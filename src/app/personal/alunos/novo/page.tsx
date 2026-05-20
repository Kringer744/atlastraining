"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AppShell } from "@/components/app/AppShell";
import { PersonalNav } from "@/components/app/PersonalNav";
import { linkClientByEmail, type LinkState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="atlas-btn-primary w-full">
      {pending ? "Vinculando..." : "Vincular aluno"}
    </button>
  );
}

export default function NovoAlunoPage() {
  const [state, formAction] = useActionState<LinkState, FormData>(
    linkClientByEmail,
    undefined,
  );

  return (
    <AppShell
      title="Novo aluno"
      subtitle="Vincule pelo email do aluno. Se ele ainda não tiver conta, fica um convite registrado."
      bottomNav={<PersonalNav />}
    >
      <form action={formAction} className="atlas-card space-y-3 max-w-md">
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
        {state?.error && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
            {state.error}
          </div>
        )}
        {state?.warning && (
          <div className="text-sm text-atlas-energy bg-atlas-energy/10 border border-atlas-energy/30 rounded-xl px-3 py-2">
            {state.warning}
          </div>
        )}
        <SubmitButton />
      </form>
    </AppShell>
  );
}
