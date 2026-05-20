"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { PersonalNav } from "@/components/app/PersonalNav";
import { linkClientByEmail } from "../actions";

export default function NovoAlunoPage() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  return (
    <AppShell
      title="Novo aluno"
      subtitle="Vincule pelo email do aluno. Se ele ainda não tiver conta, fica um convite registrado."
      bottomNav={<PersonalNav />}
    >
      <form
        action={(fd) =>
          start(async () => {
            setError(null);
            setWarning(null);
            const res = await linkClientByEmail(fd);
            if (res?.error) setError(res.error);
            else if (res?.warning) setWarning(res.warning);
            else router.push("/personal/alunos");
          })
        }
        className="atlas-card space-y-3 max-w-md"
      >
        <label className="block">
          <span className="text-sm text-atlas-muted">Email do aluno</span>
          <input
            name="email"
            type="email"
            required
            placeholder="aluno@exemplo.com"
            className="atlas-input mt-1"
          />
        </label>
        <label className="block">
          <span className="text-sm text-atlas-muted">Objetivo (opcional)</span>
          <input
            name="goal"
            placeholder="Ex: hipertrofia, condicionamento, perda de gordura"
            className="atlas-input mt-1"
          />
        </label>
        {error && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
            {error}
          </div>
        )}
        {warning && (
          <div className="text-sm text-atlas-energy bg-atlas-energy/10 border border-atlas-energy/30 rounded-xl px-3 py-2">
            {warning}
          </div>
        )}
        <button disabled={pending} className="atlas-btn-primary w-full">
          {pending ? "Vinculando..." : "Vincular aluno"}
        </button>
      </form>
    </AppShell>
  );
}
