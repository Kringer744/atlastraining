"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWorkout, uploadWorkoutPdf } from "../actions";
import { Plus, Trash2, Upload, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import { BodyMuscles } from "@/components/brand/BodyMuscles";

type Client = { id: string; full_name: string };

type Row = {
  name: string;
  sets: string;
  reps: string;
  load_kg: string;
  rest_seconds: string;
  notes: string;
};

const empty: Row = { name: "", sets: "", reps: "", load_kg: "", rest_seconds: "", notes: "" };

export function NovoTreinoForm({
  clients,
  preselectClient,
}: {
  clients: Client[];
  preselectClient?: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"manual" | "pdf">("manual");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([{ ...empty }]);
  const [client, setClient] = useState<string>(preselectClient ?? "");
  const [muscles, setMuscles] = useState<string[]>([]);

  function updateRow(i: number, field: keyof Row, v: string) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: v } : row)));
  }

  return (
    <div className="max-w-2xl">
      <div className="atlas-card mb-4">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setTab("manual")}
            className={cn(
              "atlas-btn-ghost",
              tab === "manual" && "bg-atlas-energy/15 text-atlas-energy border-atlas-energy/30",
            )}
          >
            <Dumbbell size={16} /> Manual
          </button>
          <button
            onClick={() => setTab("pdf")}
            className={cn(
              "atlas-btn-ghost",
              tab === "pdf" && "bg-atlas-energy/15 text-atlas-energy border-atlas-energy/30",
            )}
          >
            <Upload size={16} /> Enviar PDF
          </button>
        </div>

        {tab === "manual" ? (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget as HTMLFormElement);
              start(async () => {
                setError(null);
                const res = await createWorkout({
                  name: String(fd.get("name") ?? ""),
                  description: String(fd.get("description") ?? "") || null,
                  weekday: fd.get("weekday") ? Number(fd.get("weekday")) : null,
                  client_id: client || null,
                  muscle_groups: muscles,
                  exercises: rows.map((r) => ({
                    name: r.name,
                    sets: r.sets ? Number(r.sets) : null,
                    reps: r.reps || null,
                    load_kg: r.load_kg ? Number(r.load_kg) : null,
                    rest_seconds: r.rest_seconds ? Number(r.rest_seconds) : null,
                    notes: r.notes || null,
                  })),
                });
                if (res?.error) setError(res.error);
                else if (res?.id) router.push(`/personal/treinos/${res.id}`);
              });
            }}
          >
            <input name="name" required placeholder="Nome (Ex: Peito + Tríceps)" className="atlas-input" />
            <textarea name="description" rows={2} placeholder="Descrição (opcional)" className="atlas-input" />

            <div className="grid grid-cols-2 gap-3">
              <select
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="atlas-input"
              >
                <option value="">— Sem aluno (template) —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
              <select name="weekday" defaultValue="" className="atlas-input">
                <option value="">Sem dia fixo</option>
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 atlas-card-muted">
              <div className="text-xs uppercase tracking-wider text-atlas-muted mb-2 text-center">
                Grupos musculares trabalhados
              </div>
              <BodyMuscles selected={muscles} onChange={setMuscles} />
            </div>

            <div className="mt-4">
              <div className="text-xs uppercase tracking-wider text-atlas-muted mb-2">
                Exercícios
              </div>
              <div className="space-y-2">
                {rows.map((row, i) => (
                  <div key={i} className="atlas-card-muted">
                    <div className="flex items-center gap-2">
                      <input
                        value={row.name}
                        onChange={(e) => updateRow(i, "name", e.target.value)}
                        placeholder="Exercício"
                        className="atlas-input flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}
                        className="rounded-full bg-white/5 border border-white/10 p-2 hover:bg-red-500/15 hover:text-red-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      <input
                        value={row.sets}
                        onChange={(e) => updateRow(i, "sets", e.target.value)}
                        placeholder="Séries"
                        inputMode="numeric"
                        className="atlas-input"
                      />
                      <input
                        value={row.reps}
                        onChange={(e) => updateRow(i, "reps", e.target.value)}
                        placeholder="Reps"
                        className="atlas-input"
                      />
                      <input
                        value={row.load_kg}
                        onChange={(e) => updateRow(i, "load_kg", e.target.value)}
                        placeholder="Carga (kg)"
                        inputMode="decimal"
                        className="atlas-input"
                      />
                      <input
                        value={row.rest_seconds}
                        onChange={(e) => updateRow(i, "rest_seconds", e.target.value)}
                        placeholder="Desc. (s)"
                        inputMode="numeric"
                        className="atlas-input"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setRows((r) => [...r, { ...empty }])}
                className="atlas-btn-ghost mt-2 w-full"
              >
                <Plus size={16} /> Adicionar exercício
              </button>
            </div>

            {error && (
              <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <button disabled={pending} className="atlas-btn-primary w-full mt-3">
              {pending ? "Salvando..." : "Salvar treino"}
            </button>
          </form>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget as HTMLFormElement);
              if (client) fd.set("client_id", client);
              start(async () => {
                setError(null);
                const res = await uploadWorkoutPdf(fd);
                if (res?.error) setError(res.error);
                else if (res?.id) router.push(`/personal/treinos/${res.id}`);
              });
            }}
          >
            <input
              name="name"
              required
              placeholder="Nome do treino (Ex: Plano Maio)"
              className="atlas-input"
            />
            <select value={client} onChange={(e) => setClient(e.target.value)} className="atlas-input">
              <option value="">— Sem aluno (template) —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
            <label className="atlas-card-muted flex items-center gap-3 cursor-pointer">
              <Upload className="text-atlas-energy" />
              <div className="flex-1">
                <div className="font-medium">Selecionar PDF</div>
                <div className="text-xs text-atlas-muted">
                  Arraste ou clique. O arquivo fica privado do aluno e do personal.
                </div>
              </div>
              <input type="file" name="pdf" accept="application/pdf" required className="hidden" />
            </label>
            {error && (
              <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                {error}
              </div>
            )}
            <button disabled={pending} className="atlas-btn-primary w-full">
              {pending ? "Enviando..." : "Enviar PDF"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
