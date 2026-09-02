"use client";

export function PrintButton({ className = "btn-primary" }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      Imprimir
    </button>
  );
}
