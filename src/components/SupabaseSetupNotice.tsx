export function SupabaseSetupNotice() {
  return (
    <div className="bg-clay-600 py-3 text-center text-sm text-white">
      <p className="container-page">
        <strong className="font-semibold">Ligação à base de dados por configurar.</strong>{" "}
        Segue o guia em <code className="rounded bg-black/15 px-1.5 py-0.5">README.md</code> para
        ligar o Supabase (e ver produtos, criar conta e comprar a sério).
      </p>
    </div>
  );
}
