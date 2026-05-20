"use client";

import { useState } from "react";
import { WORKOUT_TEMPLATES, type WorkoutTemplate } from "@/lib/workout-templates";
import { BodyMuscles } from "@/components/brand/BodyMuscles";
import { Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function WorkoutSuggestions({
  onPick,
}: {
  onPick: (tpl: WorkoutTemplate) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="atlas-card-muted">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="text-atlas-energy" size={18} />
          <span className="font-semibold">Sugestões do Atlas</span>
        </div>
        <span className="text-xs text-atlas-muted">
          {open ? "fechar" : "ver opções"}
        </span>
      </button>

      {open && (
        <div className="mt-3 grid sm:grid-cols-2 gap-2">
          {WORKOUT_TEMPLATES.map((tpl) => (
            <button
              type="button"
              key={tpl.id}
              onClick={() => {
                onPick(tpl);
                setOpen(false);
              }}
              className={cn(
                "atlas-card text-left flex gap-3 hover:border-atlas-energy/40 hover:bg-atlas-energy/5 transition group",
              )}
            >
              <BodyMuscles
                selected={tpl.muscle_groups}
                side="front"
                size={56}
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm flex items-center gap-1">
                  {tpl.name}
                </div>
                <div className="text-[11px] text-atlas-muted mt-0.5 line-clamp-2">
                  {tpl.description}
                </div>
                <div className="text-[10px] text-atlas-energy mt-1">
                  {tpl.exercises.length} exercícios · clique pra usar
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
