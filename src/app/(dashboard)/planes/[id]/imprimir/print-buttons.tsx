"use client";

export default function PrintButtons() {
  return (
    <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
      <button
        onClick={() => window.print()}
        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
      >
        Imprimir / Guardar PDF
      </button>
      <button
        onClick={() => window.close()}
        className="px-4 py-2 bg-white border border-zinc-200 text-zinc-600 text-sm font-medium rounded-lg shadow-sm hover:bg-zinc-50 transition-colors"
      >
        Cerrar
      </button>
    </div>
  );
}
