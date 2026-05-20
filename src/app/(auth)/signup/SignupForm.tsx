"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { signUpAction, type AuthState } from "../actions";
import { Dumbbell, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "personal" | "client" | "solo";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="atlas-btn-primary w-full">
      {pending ? "Criando..." : "Criar conta"}
    </button>
  );
}

export function SignupForm({ initialRole }: { initialRole: Role }) {
  const [role, setRole] = useState<Role>(initialRole);
  const [state, formAction] = useActionState<AuthState, FormData>(
    signUpAction,
    undefined,
  );

  const options: { value: Role; icon: any; title: string; desc: string }[] = [
    { value: "personal", icon: Dumbbell, title: "Sou Personal", desc: "Gerencio alunos e treinos." },
    { value: "client", icon: User, title: "Sou Aluno", desc: "Treino com meu personal." },
    { value: "solo", icon: Sparkles, title: "Meu Atlas Pessoal", desc: "Eu mesmo crio e gerencio meus treinos." },
  ];

  return (
    <div className="atlas-card">
      <h1 className="text-2xl font-bold">Criar conta</h1>
      <p className="text-sm text-atlas-muted mt-1">
        Escolha como você vai usar o Atlas.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setRole(o.value)}
            className={cn(
              "atlas-card-muted text-left transition flex items-center gap-3",
              role === o.value && "ring-2 ring-atlas-energy/60 border-atlas-energy/40",
            )}
          >
            <o.icon className={role === o.value ? "text-atlas-energy" : "text-atlas-muted"} />
            <div>
              <div className="font-semibold">{o.title}</div>
              <div className="text-xs text-atlas-muted">{o.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <form action={formAction} className="mt-5 space-y-3">
        <input type="hidden" name="role" value={role} />
        <input name="full_name" placeholder="Seu nome" required className="atlas-input" />
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
          placeholder="senha (mín. 6 caracteres)"
          required
          minLength={6}
          className="atlas-input"
        />
        {state?.error && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
            {state.error}
          </div>
        )}
        <SubmitButton />
      </form>

      <div className="mt-4 text-sm text-atlas-muted text-center">
        Já tem conta?{" "}
        <Link href="/login" className="text-atlas-energy hover:underline">
          Entrar
        </Link>
      </div>
    </div>
  );
}
