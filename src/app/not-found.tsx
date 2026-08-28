import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="font-display text-6xl font-semibold text-clay-500">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold text-stone-900">
        Página não encontrada
      </h1>
      <p className="mt-2 max-w-sm text-sm text-stone-900/55">
        A página que procuras não existe ou foi movida.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Voltar ao início
      </Link>
    </div>
  );
}
