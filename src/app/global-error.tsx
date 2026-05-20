"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Em produção o Next só passa { digest } mas registramos o que dá pra ver
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          background: "#0F0F12",
          color: "#EDEDED",
          minHeight: "100dvh",
          padding: "2rem",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Algo deu errado
          </h1>
          <p style={{ color: "#8B8B95", marginBottom: 16 }}>
            Tenta de novo. Se persistir, manda esse código pro suporte:
          </p>
          <div
            style={{
              background: "#1A1A1F",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "12px",
              borderRadius: 12,
              fontFamily: "monospace",
              fontSize: 12,
              marginBottom: 16,
              wordBreak: "break-all",
            }}
          >
            <div>
              <strong>digest:</strong> {error.digest ?? "—"}
            </div>
            <div style={{ marginTop: 6 }}>
              <strong>message:</strong> {error.message || "(sem mensagem)"}
            </div>
          </div>
          <button
            onClick={() => reset()}
            style={{
              background: "#C6FF00",
              color: "#000",
              border: "none",
              padding: "10px 20px",
              borderRadius: 999,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  );
}
