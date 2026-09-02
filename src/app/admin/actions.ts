"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { categories } from "@/data/categories";
import { ProductWriteInput } from "@/lib/types";

interface ActionResult {
  error?: string;
  id?: string;
}

function validate(input: ProductWriteInput): string | null {
  if (!input.name.trim()) return "O nome é obrigatório.";
  if (!input.slug.trim() || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(input.slug)) {
    return "O slug deve usar apenas minúsculas, números e hífenes (ex: vaso-geometrico).";
  }
  if (!categories.some((c) => c.key === input.category_key)) return "Categoria inválida.";
  if (!Number.isFinite(input.price_cents) || input.price_cents <= 0) {
    return "O preço tem de ser maior que zero.";
  }
  if (input.colors.length === 0) return "Adiciona pelo menos uma cor.";
  if (input.materials.length === 0) return "Adiciona pelo menos um material.";
  if (input.profile.length < 2) return "A silhueta precisa de pelo menos 2 valores.";
  if (input.profile.some((n) => !Number.isFinite(n) || n <= 0 || n > 1)) {
    return "Os valores da silhueta devem estar entre 0 e 1.";
  }
  if (input.customizable && !input.customization_label?.trim()) {
    return "Produtos personalizáveis precisam de uma etiqueta de personalização.";
  }
  return null;
}

function friendlyDbError(message: string): string {
  if (message.includes("duplicate key") && message.includes("products_slug_key")) {
    return "Já existe um produto com este slug — escolhe outro.";
  }
  return "Não foi possível guardar o produto.";
}

export async function createProduct(input: ProductWriteInput): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Sem permissões de administração." };

  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const supabase = createClient();
  const { data, error } = await supabase.from("products").insert(input).select("id").single();

  if (error || !data) {
    console.error("[guedias] erro ao criar produto:", error?.message);
    return { error: friendlyDbError(error?.message ?? "") };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/produtos");
  revalidatePath("/loja");
  revalidatePath("/");
  revalidatePath(`/produto/${input.slug}`);

  return { id: data.id };
}

export async function updateProduct(
  id: string,
  input: ProductWriteInput
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Sem permissões de administração." };

  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const supabase = createClient();
  const { data: previous } = await supabase
    .from("products")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("products").update(input).eq("id", id);

  if (error) {
    console.error("[guedias] erro ao editar produto:", error.message);
    return { error: friendlyDbError(error.message) };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/produtos");
  revalidatePath("/loja");
  revalidatePath("/");
  revalidatePath(`/produto/${input.slug}`);
  if (previous && previous.slug !== input.slug) {
    revalidatePath(`/produto/${previous.slug}`);
  }

  return { id };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Sem permissões de administração." };

  const supabase = createClient();
  const { data: product } = await supabase
    .from("products")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    console.error("[guedias] erro ao apagar produto:", error.message);
    if (error.message.includes("violates foreign key constraint")) {
      return { error: "Não é possível apagar: este produto já tem encomendas associadas." };
    }
    return { error: "Não foi possível apagar o produto." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/produtos");
  revalidatePath("/loja");
  revalidatePath("/");
  if (product) revalidatePath(`/produto/${product.slug}`);

  return {};
}
