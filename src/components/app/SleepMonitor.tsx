"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Moon, Mic, MicOff, Save, Activity, Volume2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveSleepSession, type SleepSummary } from "@/app/cliente/sono/actions";

// Threshold de RMS pra classificar segundo:
//   < 0.005 = silencioso (sono profundo provável)
//   < 0.025 = ruído leve (respiração / movimento leve)
//   >= 0.025 = ruído alto (ronco / movimento brusco)
const QUIET_RMS = 0.005;
const LOUD_RMS = 0.025;

type Phase = "idle" | "recording" | "stopped";

export function SleepMonitor() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [currentRms, setCurrentRms] = useState(0);
  const [stats, setStats] = useState({
    quietSec: 0,
    lightSec: 0,
    loudSec: 0,
    noiseEvents: 0,
    peakDb: -60,
  });
  const [summary, setSummary] = useState<SleepSummary | null>(null);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<Date | null>(null);
  const tickerRef = useRef<NodeJS.Timeout | null>(null);
  const lastEventTsRef = useRef<number>(0);
  const wakeLockRef = useRef<any>(null);

  async function startMonitoring() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      startedAtRef.current = new Date();
      setElapsed(0);
      setStats({ quietSec: 0, lightSec: 0, loudSec: 0, noiseEvents: 0, peakDb: -60 });
      setSummary(null);
      setPhase("recording");

      // Wake lock pra tela não dormir (iOS 16.4+)
      try {
        wakeLockRef.current = await (navigator as any).wakeLock?.request("screen");
      } catch {
        // não bloqueia se falhar
      }

      const buf = new Float32Array(analyser.fftSize);
      let lastSecond = -1;
      let secRmsAcc = 0;
      let secRmsCount = 0;

      const loop = () => {
        analyser.getFloatTimeDomainData(buf);
        // RMS
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);
        setCurrentRms(rms);

        const now = Date.now();
        const startMs = startedAtRef.current!.getTime();
        const elapsedSec = Math.floor((now - startMs) / 1000);

        secRmsAcc += rms;
        secRmsCount++;

        if (elapsedSec !== lastSecond) {
          // fechou um segundo — classifica
          const avg = secRmsAcc / Math.max(1, secRmsCount);
          const db = rmsToDb(avg);
          setStats((s) => {
            const next = { ...s };
            if (avg < QUIET_RMS) next.quietSec++;
            else if (avg < LOUD_RMS) next.lightSec++;
            else next.loudSec++;
            if (db > next.peakDb) next.peakDb = db;
            // conta evento de ruído se loud e passaram >5s do último
            if (avg >= LOUD_RMS && now - lastEventTsRef.current > 5000) {
              next.noiseEvents++;
              lastEventTsRef.current = now;
            }
            return next;
          });
          lastSecond = elapsedSec;
          secRmsAcc = 0;
          secRmsCount = 0;
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);

      tickerRef.current = setInterval(() => {
        if (startedAtRef.current) {
          setElapsed(
            Math.floor((Date.now() - startedAtRef.current.getTime()) / 1000),
          );
        }
      }, 1000);
    } catch (e: any) {
      setError(
        "Não consegui acessar o microfone. " +
          "No iPhone: Ajustes → Safari → Câmera/Microfone → Permitir.",
      );
    }
  }

  async function stopMonitoring() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (tickerRef.current) clearInterval(tickerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      await audioCtxRef.current?.close();
    } catch {
      // ignore
    }
    try {
      await wakeLockRef.current?.release();
    } catch {
      // ignore
    }
    if (!startedAtRef.current) return;
    const startedAt = startedAtRef.current.toISOString();
    const endedAt = new Date().toISOString();
    const durationMin = elapsed / 60;
    const quietMin = stats.quietSec / 60;
    const score = computeQuality(durationMin, quietMin, stats.noiseEvents, stats.loudSec);
    setSummary({
      startedAt,
      endedAt,
      durationMin,
      quietMin,
      noiseEvents: stats.noiseEvents,
      peakDb: stats.peakDb,
      qualityScore: score,
    });
    setPhase("stopped");
  }

  function discard() {
    setSummary(null);
    setPhase("idle");
    setElapsed(0);
    setCurrentRms(0);
    setStats({ quietSec: 0, lightSec: 0, loudSec: 0, noiseEvents: 0, peakDb: -60 });
    setNote("");
  }

  function persist() {
    if (!summary) return;
    start(async () => {
      await saveSleepSession({ ...summary, note: note || null });
      discard();
    });
  }

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (tickerRef.current) clearInterval(tickerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
      wakeLockRef.current?.release?.().catch(() => {});
    };
  }, []);

  // === RENDER ===

  if (phase === "stopped" && summary) {
    return <SleepSummaryView summary={summary} note={note} setNote={setNote} onSave={persist} onDiscard={discard} pending={pending} />;
  }

  const dbDisplay = phase === "recording" ? Math.max(-60, rmsToDb(currentRms)) : -60;
  const dbPct = Math.max(0, Math.min(100, ((dbDisplay + 60) / 60) * 100));
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="space-y-4">
      <div className="atlas-card relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 50% 30%, rgba(123,109,255,0.18), transparent 60%)",
          }}
        />
        <div className="relative flex flex-col items-center">
          <div
            className={cn(
              "relative w-40 h-40 rounded-full flex items-center justify-center mb-3 transition",
              phase === "recording"
                ? "bg-[#7B6DFF]/20 border-2 border-[#7B6DFF] shadow-[0_0_40px_rgba(123,109,255,0.5)]"
                : "bg-atlas-balance border border-white/10",
            )}
          >
            {phase === "recording" && (
              <span
                className="absolute inset-0 rounded-full border-2 border-[#7B6DFF]/60 animate-ping"
                style={{ animationDuration: "2.5s" }}
              />
            )}
            <Moon
              size={64}
              className={phase === "recording" ? "text-[#7B6DFF]" : "text-atlas-muted"}
            />
          </div>
          <div className="text-3xl font-bold tabular-nums">
            {mm}:{ss}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-atlas-muted mt-1">
            {phase === "recording" ? "Modo soneca ativo" : "Pronto para dormir"}
          </div>

          {phase === "recording" && (
            <div className="mt-4 w-full max-w-xs">
              <div className="flex items-center gap-2 text-xs text-atlas-muted mb-1">
                <Volume2 size={12} />
                <div className="h-1.5 flex-1 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-[#7B6DFF] transition-all"
                    style={{ width: `${dbPct}%` }}
                  />
                </div>
                <span className="tabular-nums">{dbDisplay.toFixed(0)} dB</span>
              </div>
            </div>
          )}

          {phase === "idle" ? (
            <button
              onClick={startMonitoring}
              className="atlas-btn-primary mt-5"
            >
              <Mic size={16} /> Ativar modo soneca
            </button>
          ) : (
            <button
              onClick={stopMonitoring}
              className="atlas-btn-danger mt-5"
            >
              <MicOff size={16} /> Acordei
            </button>
          )}
        </div>
      </div>

      {phase === "recording" && (
        <div className="grid grid-cols-3 gap-2">
          <StatCell label="Silêncio" value={fmtMin(stats.quietSec)} />
          <StatCell label="Movimentos" value={String(stats.noiseEvents)} />
          <StatCell label="Pico" value={`${stats.peakDb.toFixed(0)} dB`} />
        </div>
      )}

      {error && (
        <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      <div className="atlas-card-muted text-xs text-atlas-muted space-y-1">
        <div className="font-semibold text-atlas-contrast">Como funciona</div>
        <p>
          Atlas usa o microfone só pra medir o <b>volume do ambiente</b> em
          tempo real — nada de áudio é gravado ou enviado.
        </p>
        <p>
          Deixe o celular <b>perto da cama</b>, carregando. Mantenha o app
          aberto (a tela pode escurecer).
        </p>
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="atlas-card-muted text-center py-2">
      <div className="text-[10px] uppercase tracking-wider text-atlas-muted">
        {label}
      </div>
      <div className="font-bold mt-0.5">{value}</div>
    </div>
  );
}

function SleepSummaryView({
  summary,
  note,
  setNote,
  onSave,
  onDiscard,
  pending,
}: {
  summary: SleepSummary;
  note: string;
  setNote: (n: string) => void;
  onSave: () => void;
  onDiscard: () => void;
  pending: boolean;
}) {
  const h = Math.floor(summary.durationMin / 60);
  const m = Math.round(summary.durationMin % 60);
  return (
    <div className="space-y-3">
      <div className="atlas-card text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 50% 0%, rgba(123,109,255,0.25), transparent 60%)",
          }}
        />
        <div className="relative">
          <div className="text-5xl">🌙</div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-[#9F94FF] mt-2">
            Bom dia
          </div>
          <div className="text-4xl font-bold mt-1 tabular-nums">
            {h}h {String(m).padStart(2, "0")}
          </div>
          <div className="text-xs text-atlas-muted mt-1">
            de monitoramento
          </div>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-atlas-energy/10 border border-atlas-energy/30">
            <Activity className="text-atlas-energy" size={16} />
            <span className="font-semibold text-atlas-energy">
              Score: {summary.qualityScore}/100
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatCell label="Tempo calmo" value={fmtMin(summary.quietMin * 60)} />
        <StatCell label="Eventos" value={String(summary.noiseEvents)} />
        <StatCell label="Pico" value={`${summary.peakDb.toFixed(0)} dB`} />
      </div>

      <div className="atlas-card">
        <div className="text-[11px] uppercase tracking-wider text-atlas-muted mb-2">
          Análise
        </div>
        <p className="text-sm leading-snug">
          {sleepInsight(summary)}
        </p>
      </div>

      <div className="atlas-card">
        <label className="text-[11px] uppercase tracking-wider text-atlas-muted">
          Como você se sente hoje?
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Ex: acordei descansado, queria mais 1h..."
          className="atlas-input mt-1.5"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onDiscard} className="atlas-btn-ghost">
          Descartar
        </button>
        <button onClick={onSave} disabled={pending} className="atlas-btn-primary">
          <Save size={16} /> {pending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}

function rmsToDb(rms: number): number {
  if (rms <= 0.00001) return -60;
  return Math.max(-60, 20 * Math.log10(rms));
}

function fmtMin(seconds: number): string {
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}min`;
  return `${Math.floor(m / 60)}h ${m % 60}min`;
}

function computeQuality(
  durationMin: number,
  quietMin: number,
  noiseEvents: number,
  loudSec: number,
): number {
  if (durationMin < 30) return Math.round(durationMin); // muito curto
  const ideal = 8 * 60; // 8h
  const durScore = Math.min(40, (durationMin / ideal) * 40);
  const quietRatio = quietMin / Math.max(1, durationMin);
  const quietScore = quietRatio * 40;
  const eventPenalty = Math.min(20, noiseEvents * 0.5);
  const loudPenalty = Math.min(10, loudSec / 60);
  return Math.max(
    0,
    Math.min(100, Math.round(durScore + quietScore + 20 - eventPenalty - loudPenalty)),
  );
}

function sleepInsight(s: SleepSummary): string {
  const lines: string[] = [];
  if (s.durationMin < 6 * 60)
    lines.push("Sono curto — abaixo de 6h. Tenta dormir mais cedo amanhã.");
  else if (s.durationMin >= 7 * 60 && s.durationMin <= 9 * 60)
    lines.push("Duração ideal — entre 7 e 9h.");
  else if (s.durationMin > 9 * 60)
    lines.push("Sono longo — pode indicar recuperação ativa ou fadiga acumulada.");

  if (s.noiseEvents >= 20) lines.push("Muitos eventos de ruído (>20). Ambiente agitado ou ronco frequente.");
  else if (s.noiseEvents >= 10) lines.push("Alguns movimentos/ruídos durante a noite.");
  else lines.push("Ambiente bem calmo — sinal de sono tranquilo.");

  if (s.qualityScore >= 80) lines.push("Score top. Mantém a rotina.");
  else if (s.qualityScore >= 60) lines.push("Boa noite no geral. Dá pra refinar.");
  else lines.push("Qualidade abaixo do ideal. Foco em escurecer o quarto, evitar tela antes de dormir e hidratação.");

  return lines.join(" ");
}
