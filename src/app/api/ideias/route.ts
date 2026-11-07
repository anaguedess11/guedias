import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { sendCustomRequestNotification } from "@/lib/email";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_IDEA_IMAGES,
  MAX_IDEA_IMAGE_BYTES,
  MIN_DESCRIPTION_LENGTH,
} from "@/lib/custom-requests";

const BUCKET = "custom-request-images";
const MAX_PER_IP_PER_HOUR = 5;
const MAX_PER_DAY = 100;

const IMAGE_TYPES = [
  { type: "image/jpeg", ext: "jpg", matches: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    type: "image/png",
    ext: "png",
    matches: (b: Buffer) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    type: "image/webp",
    ext: "webp",
    matches: (b: Buffer) => b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP",
  },
];

function text(form: FormData, field: string, max: number): string {
  const value = form.get(field);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured) return fail("A loja ainda não está configurada.", 503);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Não foi possível ler o pedido. Experimenta com imagens mais pequenas.");
  }

  // Campo escondido: só os robôs o preenchem. Finge sucesso para não os ensinar a evitá-lo.
  if (text(form, "website", 200)) return NextResponse.json({ ok: true });

  const name = text(form, "name", 120);
  const email = text(form, "email", 200);
  const phone = text(form, "phone", 30);
  const description = text(form, "description", MAX_DESCRIPTION_LENGTH);
  const size = text(form, "size", 120);
  const colors = text(form, "colors", 120);
  const neededBy = text(form, "neededBy", 120);
  const quantityRaw = text(form, "quantity", 10);
  const quantity = quantityRaw ? Number(quantityRaw) : null;

  if (description.length < MIN_DESCRIPTION_LENGTH) return fail("Conta-nos um pouco mais sobre a tua ideia.");
  if (!name) return fail("Indica o teu nome.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Indica um email válido.");
  if (phone && !/^[+\d][\d\s()-]{7,}$/.test(phone)) return fail("Indica um telemóvel válido.");
  if (quantity !== null && (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000)) {
    return fail("Indica uma quantidade válida.");
  }

  const files = form.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_IDEA_IMAGES) return fail(`Podes enviar até ${MAX_IDEA_IMAGES} imagens.`);

  const images: { body: Buffer; type: string; ext: string }[] = [];
  for (const file of files) {
    if (file.size > MAX_IDEA_IMAGE_BYTES) return fail("Uma das imagens é demasiado grande.");
    // O tipo declarado pelo browser não é fiável: confirma pelo conteúdo do ficheiro.
    const body = Buffer.from(await file.arrayBuffer());
    const kind = IMAGE_TYPES.find((t) => t.matches(body));
    if (!kind) return fail("Só aceitamos imagens JPG, PNG ou WebP.");
    images.push({ body, type: kind.type, ext: kind.ext });
  }

  const admin = createAdminClient();

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconhecido";
  const ipHash = createHash("sha256")
    .update(`${ip}:${process.env.SUPABASE_SERVICE_ROLE_KEY}`)
    .digest("hex");
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const [byIp, today] = await Promise.all([
    admin
      .from("custom_requests")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", hourAgo),
    admin.from("custom_requests").select("id", { count: "exact", head: true }).gte("created_at", dayAgo),
  ]);
  if (byIp.error || today.error) {
    console.error("[guedias] erro ao verificar limite de ideias:", byIp.error?.message ?? today.error?.message);
    return fail("Não foi possível enviar a tua ideia. Tenta novamente.", 500);
  }
  if ((byIp.count ?? 0) >= MAX_PER_IP_PER_HOUR || (today.count ?? 0) >= MAX_PER_DAY) {
    return fail("Recebemos muitos pedidos. Tenta novamente mais tarde.", 429);
  }

  const id = randomUUID();
  const imagePaths: string[] = [];
  const removeUploaded = async () => {
    if (imagePaths.length) await admin.storage.from(BUCKET).remove(imagePaths);
  };

  for (const [i, image] of images.entries()) {
    const path = `${id}/${i + 1}.${image.ext}`;
    const { error } = await admin.storage.from(BUCKET).upload(path, image.body, { contentType: image.type });
    if (error) {
      console.error("[guedias] erro ao guardar imagem de ideia:", error.message);
      await removeUploaded();
      return fail("Não foi possível guardar as imagens. Tenta novamente.", 500);
    }
    imagePaths.push(path);
  }

  const row = {
    id,
    name,
    email,
    phone: phone || null,
    description,
    size: size || null,
    colors: colors || null,
    needed_by: neededBy || null,
    quantity,
    image_paths: imagePaths,
    ip_hash: ipHash,
  };
  const { error: insertError } = await admin.from("custom_requests").insert(row);
  if (insertError) {
    console.error("[guedias] erro ao gravar ideia:", insertError.message);
    await removeUploaded();
    return fail("Não foi possível enviar a tua ideia. Tenta novamente.", 500);
  }

  await sendCustomRequestNotification(row);

  return NextResponse.json({ ok: true });
}
