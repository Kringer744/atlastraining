"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTH_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const MONTH_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// Domingo a sábado, índices nativos do JS (getDay)
const WD_LABEL = ["D", "S", "T", "Q", "Q", "S", "S"];

function toISODate(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function startOfWeek(d: Date) {
  // semana começa na segunda
  const dt = new Date(d);
  const day = dt.getDay();
  const diff = day === 0 ? 6 : day - 1;
  dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() - diff);
  return dt;
}

export function ActivityDots({
  startDate,
  sessionDates,
}: {
  startDate?: string;
  sessionDates?: string[];
}) {
  const [mode, setMode] = useState<"week" | "month">("week");
  const [monthCursor, setMonthCursor] = useState<{ year: number; month: number }>(() => {
    const t = new Date();
    return { year: t.getFullYear(), month: t.getMonth() };
  });

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const start = useMemo(() => {
    if (!startDate) return null;
    const d = new Date(startDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [startDate]);

  const sessions = useMemo(() => new Set(sessionDates ?? []), [sessionDates]);

  // Semana atual (Seg-Dom)
  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const iso = toISODate(d);
      return {
        iso,
        dayNumber: d.getDate(),
        weekdayLetter: WD_LABEL[d.getDay()],
        isToday: d.getTime() === today.getTime(),
        future: d > today,
        beforeStart: start ? d < start : false,
        done: sessions.has(iso),
      };
    });
  }, [weekStart, sessions, today, start]);

  // Mês selecionado
  const monthGrid = useMemo(() => {
    const { year, month } = monthCursor;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7; // segunda = 0
    type Cell = null | {
      iso: string;
      dayNumber: number;
      done: boolean;
      future: boolean;
      beforeStart: boolean;
      isToday: boolean;
    };
    const cells: Cell[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(year, month, d);
      const iso = toISODate(date);
      cells.push({
        iso,
        dayNumber: d,
        done: sessions.has(iso),
        future: date > today,
        beforeStart: start ? date < start : false,
        isToday: date.getTime() === today.getTime(),
      });
    }
    return cells;
  }, [monthCursor, sessions, today, start]);

  const monthStats = useMemo(() => {
    return monthGrid.filter((c) => c && c.done).length;
  }, [monthGrid]);

  const cursorIsCurrent =
    monthCursor.year === today.getFullYear() && monthCursor.month === today.getMonth();

  function shiftMonth(delta: number) {
    setMonthCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  return (
    <div className="atlas-card-muted">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] uppercase tracking-wider text-atlas-muted">
          Check-ins
        </div>
        <div className="flex rounded-full bg-white/5 p-0.5 text-xs">
          <button
            onClick={() => setMode("week")}
            className={cn(
              "px-3 py-1 rounded-full transition",
              mode === "week"
                ? "bg-atlas-energy text-black font-semibold"
                : "text-atlas-muted",
            )}
          >
            Semana
          </button>
          <button
            onClick={() => setMode("month")}
            className={cn(
              "px-3 py-1 rounded-full transition",
              mode === "month"
                ? "bg-atlas-energy text-black font-semibold"
                : "text-atlas-muted",
            )}
          >
            Mês
          </button>
        </div>
      </div>

      {mode === "week" ? (
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((d) => (
            <div key={d.iso} className="flex flex-col items-center gap-1.5">
              <div className="text-[10px] text-atlas-muted uppercase">
                {d.weekdayLetter}
              </div>
              <div
                className={cn(
                  "w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-semibold transition",
                  d.done
                    ? "bg-atlas-energy text-black shadow-glow"
                    : d.isToday
                      ? "border-2 border-atlas-energy text-atlas-energy"
                      : d.beforeStart || d.future
                        ? "bg-white/5 text-atlas-muted"
                        : "bg-white/10 text-atlas-muted",
                )}
              >
                {d.dayNumber}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => shiftMonth(-1)}
              className="rounded-full bg-white/5 border border-white/10 p-1.5 hover:bg-white/10"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="text-center">
              <div className="font-semibold">
                {MONTH_PT[monthCursor.month]} {monthCursor.year}
              </div>
              <div className="text-[10px] text-atlas-muted uppercase tracking-wider">
                {monthStats} {monthStats === 1 ? "treino" : "treinos"} no mês
              </div>
            </div>
            <button
              onClick={() => shiftMonth(1)}
              disabled={cursorIsCurrent}
              className="rounded-full bg-white/5 border border-white/10 p-1.5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-2 text-[10px] text-atlas-muted text-center mb-3">
            {["S", "T", "Q", "Q", "S", "S", "D"].map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 place-items-center px-2">
            {monthGrid.map((c, i) =>
              c === null ? (
                <span key={i} className="w-3.5 h-3.5" />
              ) : (
                <div
                  key={i}
                  title={`${c.iso}${c.done ? " · treinou" : ""}`}
                  className={cn(
                    "w-3.5 h-3.5 rounded-full transition",
                    c.done
                      ? "bg-atlas-energy shadow-[0_0_8px_rgba(198,255,0,0.6)]"
                      : c.isToday
                        ? "ring-1 ring-atlas-energy bg-atlas-energy/20"
                        : c.beforeStart || c.future
                          ? "bg-white/5"
                          : "bg-white/15",
                  )}
                />
              ),
            )}
          </div>

          <div className="flex items-center justify-center gap-3 mt-4 text-[10px] text-atlas-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-atlas-energy shadow-glow inline-block" />
              treino
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white/15 inline-block" />
              sem treino
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full ring-1 ring-atlas-energy bg-atlas-energy/20 inline-block" />
              hoje
            </span>
          </div>
        </>
      )}
    </div>
  );
}
