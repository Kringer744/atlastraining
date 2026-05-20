"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AppError]", error);
  }, [error]);

  return (
    <div className="min-h-dvh flex items-center justify-center p-8">
      <div className="atlas-card max-w-md w-full">
        <h1 className="text-xl font-bold">Algo deu errado nessa página</h1>
        <p className="text-sm text-atlas-muted mt-1">
          O servidor retornou um erro. Tenta de novo em instantes.
        </p>
        <div className="mt-4 atlas-card-muted text-xs font-mono break-all">
          <div>
            <strong>digest:</strong> {error.digest ?? "—"}
          </div>
          <div className="mt-1">
            <strong>message:</strong> {error.message || "(sem mensagem)"}
          </div>
        </div>
        <button onClick={() => reset()} className="atlas-btn-primary mt-4 w-full">
          Tentar de novo
        </button>
      </div>
    </div>
  );
}
