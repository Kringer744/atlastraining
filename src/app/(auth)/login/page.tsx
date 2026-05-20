"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { signInAction } from "../actions";

export default function LoginPage() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="atlas-card">
      <h1 className="text-2xl font-bold">Entrar</h1>
      <p className="text-sm text-atlas-muted mt-1">
        Bem-vindo de volta. Vamos treinar.
      </p>

      <form
        action={(fd) =>
          start(async () => {
            setError(null);
            const res = await signInAction(fd);
            if (res?.error) setError(res.error);
          })
        }
        className="mt-6 space-y-3"
      >
        <input
          name="email"
          type="email"
          placeholder="email@exemplo.com"
          required
          className="atlas-input"
        />
        <input
          name="password"
          type="password"
          placeholder="senha"
          required
          minLength={6}
          className="atlas-input"
        />
        {error && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
            {error}
          </div>
        )}
        <button disabled={pending} className="atlas-btn-primary w-full">
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="mt-4 text-sm text-atlas-muted text-center">
        Não tem conta?{" "}
        <Link href="/signup" className="text-atlas-energy hover:underline">
          Criar conta
        </Link>
      </div>
    </div>
  );
}
