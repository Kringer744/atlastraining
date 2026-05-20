"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { WorkoutExercise } from "@/lib/types";
import { Plus, Check, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

type Row = {
  exercise_id: string | null;
  exercise_name: string;
  set_index: number;
  reps: string;
  load_kg: string;
  rpe: string;
  done: boolean;
};

type SetInput = {
  exercise_id: string | null;
  exercise_name: string;
  set_index: number;
  reps: number | null;
  load_kg: number | null;
  rpe: number | null;
};

export type FinishHandler = (params: {
  workout_id: string;
  perceived_effort: number;
  notes?: string | null;
  sets: SetInput[];
}) => Promise<{ redirectTo?: string; error?: string } | void>;

export function IniciarTreinoForm({
  workoutId,
  exercises,
  onFinish,
}: {
  workoutId: string;
  exercises: WorkoutExercise[];
  onFinish: FinishHandler;
}) {
  const router = useRouter();

  const initialRows: Row[] = useMemo(() => {
    if (exercises.length === 0)
      return [
        {
          exercise_id: null,
          exercise_name: "",
          set_index: 1,
          reps: "",
          load_kg: "",
          rpe: "",
          done: false,
        },
      ];
    return exercises.flatMap((e) =>
      Array.from({ length: e.sets ?? 3 }).map((_, i) => ({
        exercise_id: e.id,
        exercise_name: e.name,
        set_index: i + 1,
        reps: e.reps?.split("-")[0] ?? "",
        load_kg: e.load_kg ? String(e.load_kg) : "",
        rpe: "",
        done: false,
      })),
    );
  }, [exercises]);

  const [rows, setRows] = useState<Row[]>(initialRows);
  const [rpe, setRpe] = useState(7);
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const totalVolume = rows.reduce(
    (acc, r) => acc + Number(r.load_kg || 0) * Number(r.reps || 0),
    0,
  );
  const doneCount = rows.filter((r) => r.done).length;

  function upd(i: number, field: keyof Row, v: any) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: v } : row)));
  }

  const grouped = rows.reduce<Record<string, Row[]>>((acc, r) => {
    acc[r.exercise_name] = acc[r.exercise_name] ?? [];
    acc[r.exercise_name].push(r);
    return acc;
  }, {});

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="space-y-3 max-w-2xl">
      <div className="atlas-card flex items-center justify-between">
        <div>
          <div className="text-xs text-atlas-muted">Tempo</div>
          <div className="text-3xl font-bold tabular-nums">
            {mm}:{ss}
          </div>
        </div>
        <div>
          <div className="text-xs text-atlas-muted">Volume</div>
          <div className="text-3xl font-bold">{Math.round(totalVolume)} kg</div>
        </div>
        <div>
          <div className="text-xs text-atlas-muted">Sets</div>
          <div className="text-3xl font-bold">
            {doneCount}/{rows.length}
          </div>
        </div>
      </div>

      {Object.entries(grouped).map(([exerciseName, sets]) => (
        <div key={exerciseName} className="atlas-card">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">{exerciseName || "Exercício livre"}</div>
            <button
              type="button"
              onClick={() =>
                setRows((r) => [
                  ...r,
                  {
                    exercise_id: sets[0].exercise_id,
                    exercise_name: sets[0].exercise_name,
                    set_index: sets.length + 1,
                    reps: sets[sets.length - 1].reps,
                    load_kg: sets[sets.length - 1].load_kg,
                    rpe: "",
                    done: false,
                  },
                ])
              }
              className="text-xs text-atlas-energy flex items-center gap-1"
            >
              <Plus size={12} /> set
            </button>
          </div>
          <div className="space-y-1.5">
            {sets.map((r) => {
              const i = rows.indexOf(r);
              return (
                <div
                  key={i}
                  className={cn(
                    "rounded-xl border border-white/5 p-2 flex items-center gap-2",
                    r.done ? "bg-atlas-energy/10 border-atlas-energy/30" : "bg-atlas-balance/60",
                  )}
                >
                  <span className="text-xs w-6 text-atlas-muted">#{r.set_index}</span>
                  <input
                    placeholder="reps"
                    inputMode="numeric"
                    value={r.reps}
                    onChange={(e) => upd(i, "reps", e.target.value)}
                    className="atlas-input py-1.5"
                  />
                  <input
                    placeholder="kg"
                    inputMode="decimal"
                    value={r.load_kg}
                    onChange={(e) => upd(i, "load_kg", e.target.value)}
                    className="atlas-input py-1.5"
                  />
                  <button
                    type="button"
                    onClick={() => upd(i, "done", !r.done)}
                    className={cn(
                      "rounded-full p-2 transition",
                      r.done
                        ? "bg-atlas-energy text-black"
                        : "bg-white/5 border border-white/10 text-atlas-muted hover:text-atlas-contrast",
                    )}
                  >
                    <Check size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="atlas-card">
        <div className="text-xs uppercase tracking-wider text-atlas-muted">
          Como foi? (PSE)
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={rpe}
          onChange={(e) => setRpe(Number(e.target.value))}
          className="w-full mt-2 accent-[#C6FF00]"
        />
        <div className="flex justify-between text-xs text-atlas-muted">
          <span>1 fácil</span>
          <span className="text-atlas-energy font-semibold">{rpe}</span>
          <span>10 máximo</span>
        </div>
        <textarea
          placeholder="Notas (opcional)"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="atlas-input mt-3"
        />
      </div>

      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await onFinish({
              workout_id: workoutId,
              perceived_effort: rpe,
              notes: notes || null,
              sets: rows
                .filter((r) => r.done)
                .map((r) => ({
                  exercise_id: r.exercise_id,
                  exercise_name: r.exercise_name || "Livre",
                  set_index: r.set_index,
                  reps: r.reps ? Number(r.reps) : null,
                  load_kg: r.load_kg ? Number(r.load_kg) : null,
                  rpe: r.rpe ? Number(r.rpe) : null,
                })),
            });
            if (res?.redirectTo) router.push(res.redirectTo);
          })
        }
        className="atlas-btn-primary w-full text-lg py-4"
      >
        <Flame size={20} /> {pending ? "Salvando..." : "Concluir treino"}
      </button>
    </div>
  );
}
