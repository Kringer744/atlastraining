"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Moon, Mic, MicOff, Save, Activity, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveSleepSession, type SleepSummary } from "@/app/cliente/sono/actions";

const QUIET_RMS = 0.004;
const LOUD_RMS = 0.022;
const SNORE_FREQ_MIN_HZ = 80;
const SNORE_FREQ_MAX_HZ = 350;
const SNORE_LOW_BAND_RATIO = 0.55;
const SNORE_MIN_INTERVAL_MS = 1800;
const SNORE_MAX_INTERVAL_MS = 6500;
const SNORE_PATTERN_THRESHOLD = 3;

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
    snoreEvents: 0,
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
  const lastNoiseTsRef = useRef<number>(0);
  const lastSnorePulseTsRef = useRef<number>(0);
  const snoreStreakRef = useRef<number>(0);
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
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      startedAtRef.current = new Date();
      setElapsed(0);
      setStats({ quietSec: 0, lightSec: 0, loudSec: 0, noiseEvents: 0, snoreEvents: 0, peakDb: -60 });
      setSummary(null);
      setPhase("recording");

      try {
        wakeLockRef.current = await (navigator as any).wakeLock?.request("screen");
      } catch {}

      const timeBuf = new Float32Array(analyser.fftSize);
      const freqBuf = new Float32Array(analyser.frequencyBinCount);
      const sampleRate = ctx.sampleRate;
      const binWidth = sampleRate / analyser.fftSize;
      const lowBinStart = Math.floor(SNORE_FREQ_MIN_HZ / binWidth);
      const lowBinEnd = Math.floor(SNORE_FREQ_MAX_HZ / binWidth);

      let lastSecond = -1;
      let secRmsAcc = 0;
      let secRmsCount = 0;

      const loop = () => {
        analyser.getFloatTimeDomainData(timeBuf);
        analyser.getFloatFrequencyData(freqBuf);

        let sumSq = 0;
        for (let i = 0; i < timeBuf.length; i++) sumSq += timeBuf[i] * timeBuf[i];
        const rms = Math.sqrt(sumSq / timeBuf.length);
        setCurrentRms(rms);

        const now = Date.now();
        const startMs = startedAtRef.current!.getTime();
        const elapsedSec = Math.floor((now - startMs) / 1000);

        secRmsAcc += rms;
        secRmsCount++;

        if (elapsedSec !== lastSecond) {
          const avg = secRmsAcc / Math.max(1, secRmsCount);
          const db = rmsToDb(avg);
          setStats((s) => {
            const next = { ...s };
            if (avg < QUIET_RMS) next.quietSec++;
            else if (avg < LOUD_RMS) next.lightSec++;
            else next.loudSec++;
            if (db > next.peakDb) next.peakDb = db;

            if (avg >= LOUD_RMS && now - lastNoiseTsRef.current > 5000) {
              next.noiseEvents++;
              lastNoiseTsRef.current = now;

              // Análise de banda pra ronco
              let lowEnergy = 0;
              let totalEnergy = 0;
              for (let i = 0; i < freqBuf.length; i++) {
                const lin = Math.pow(10, freqBuf[i] / 20);
                totalEnergy += lin;
                if (i >= lowBinStart && i <= lowBinEnd) lowEnergy += lin;
              }
              const lowRatio = totalEnergy > 0 ? lowEnergy / totalEnergy : 0;

              if (lowRatio >= SNORE_LOW_BAND_RATIO) {
                const dt = now - lastSnorePulseTsRef.current;
                if (dt >= SNORE_MIN_INTERVAL_MS && dt <= SNORE_MAX_INTERVAL_MS) {
                  snoreStreakRef.current++;
                  if (snoreStreakRef.current === SNORE_PATTERN_THRESHOLD) {
                    next.snoreEvents++;
                  }
                } else {
                  snoreStreakRef.current = 1;
                }
                lastSnorePulseTsRef.current = now;
              } else {
                snoreStreakRef.current = 0;
              }
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
        "Não consegui acessar o microfone. No iPhone: Ajustes → Safari → Microfone → Permitir.",
      );
    }
  }

  async function stopMonitoring() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (tickerRef.current) clearInterval(tickerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try { await audioCtxRef.current?.close(); } catch {}
    try { await wakeLockRef.current?.release(); } catch {}
    if (!startedAtRef.current) return;
    const startedAt = startedAtRef.current.toISOString();
    const endedAt = new Date().toISOString();
    const durationMin = elapsed / 60;
    const quietMin = stats.quietSec / 60;
    const score = computeQuality(
      durationMin, quietMin, stats.noiseEvents, stats.loudSec, stats.snoreEvents,
    );
    setSummary({
      startedAt, endedAt, durationMin, quietMin,
      noiseEvents: stats.noiseEvents,
      snoreEvents: stats.snoreEvents,
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
    setStats({ quietSec: 0, lightSec: 0, loudSec: 0, noiseEvents: 0, snoreEvents: 0, peakDb: -60 });
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

  if (phase === "stopped" && summary) {
    return (
      <SleepSummaryView
        summary={summary}
        note={note}
        setNote={setNote}
        onSave={persist}
        onDiscard={discard}
        pending={pending}
      />
    );
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
            <button onClick={startMonitoring} className="atlas-btn-primary mt-5">
              <Mic size={16} /> Ativar modo soneca
            </button>
          ) : (
            <button onClick={stopMonitoring} className="atlas-btn-danger mt-5">
              <MicOff size={16} /> Acordei
            </button>
          )}
        </div>
      </div>

      {phase === "recording" && (
        <div className="grid grid-cols-4 gap-2">
          <StatCell label="Calmo" value={fmtMin(stats.quietSec)} />
          <StatCell label="Eventos" value={String(stats.noiseEvents)} />
          <StatCell label="Roncos" value={String(stats.snoreEvents)} />
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
        <p>Atlas mede só o <b>volume e a frequência do ambiente</b> — nada de áudio é gravado nem enviado.</p>
        <p>Para detectar <b>ronco</b>, Atlas analisa pulsos rítmicos em baixa frequência (80-350Hz) que se repetem a cada 2-6s.</p>
        <p>Deixe o celular <b>perto da cama, carregando</b>. Mantém o app aberto.</p>
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
      <div className="font-bold mt-0.5 text-sm">{value}</div>
    </div>
  );
}

function SleepSummaryView({
  summary, note, setNote, onSave, onDiscard, pending,
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
          <div className="text-5xl">{summary.qualityScore >= 70 ? "🌟" : "🌙"}</div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-[#9F94FF] mt-2">Bom dia</div>
          <div className="text-4xl font-bold mt-1 tabular-nums">
            {h}h {String(m).padStart(2, "0")}
          </div>
          <div className="text-xs text-atlas-muted mt-1">de monitoramento</div>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-atlas-energy/10 border border-atlas-energy/30">
            <Activity className="text-atlas-energy" size={16} />
            <span className="font-semibold text-atlas-energy">
              Qualidade: {summary.qualityScore}/100
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="atlas-card-muted text-center py-3">
          <div className="text-2xl mb-1">😴</div>
          <div className="text-[10px] uppercase tracking-wider text-atlas-muted">Tempo calmo</div>
          <div className="font-bold mt-0.5">{fmtMin(summary.quietMin * 60)}</div>
        </div>
        <div className="atlas-card-muted text-center py-3">
          <div className="text-2xl mb-1">{(summary.snoreEvents ?? 0) >= 3 ? "🐻" : "🤫"}</div>
          <div className="text-[10px] uppercase tracking-wider text-atlas-muted">Roncos</div>
          <div className="font-bold mt-0.5">
            {(summary.snoreEvents ?? 0) > 0 ? `${summary.snoreEvents}` : "nenhum"}
          </div>
        </div>
        <div className="atlas-card-muted text-center py-3">
          <div className="text-2xl mb-1">🌊</div>
          <div className="text-[10px] uppercase tracking-wider text-atlas-muted">Movimentos</div>
          <div className="font-bold mt-0.5">{summary.noiseEvents}</div>
        </div>
        <div className="atlas-card-muted text-center py-3">
          <div className="text-2xl mb-1">📈</div>
          <div className="text-[10px] uppercase tracking-wider text-atlas-muted">Pico</div>
          <div className="font-bold mt-0.5">{summary.peakDb.toFixed(0)} dB</div>
        </div>
      </div>

      <div className="atlas-card">
        <div className="text-[11px] uppercase tracking-wider text-atlas-muted mb-2">Análise do Atlas</div>
        <p className="text-sm leading-snug">{sleepInsight(summary)}</p>
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
        <button onClick={onDiscard} className="atlas-btn-ghost">Descartar</button>
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
  durationMin: number, quietMin: number, noiseEvents: number,
  loudSec: number, snoreEvents: number,
): number {
  if (durationMin < 30) return Math.round(durationMin);
  const ideal = 8 * 60;
  const durScore = Math.min(40, (durationMin / ideal) * 40);
  const quietRatio = quietMin / Math.max(1, durationMin);
  const quietScore = quietRatio * 40;
  const eventPenalty = Math.min(15, noiseEvents * 0.4);
  const loudPenalty = Math.min(10, loudSec / 60);
  const snorePenalty = Math.min(15, snoreEvents * 1.5);
  return Math.max(0, Math.min(100,
    Math.round(durScore + quietScore + 20 - eventPenalty - loudPenalty - snorePenalty),
  ));
}
function sleepInsight(s: SleepSummary): string {
  const lines: string[] = [];
  if (s.durationMin < 6 * 60)
    lines.push("Sono curto — abaixo de 6h. Dorme mais cedo amanhã.");
  else if (s.durationMin >= 7 * 60 && s.durationMin <= 9 * 60)
    lines.push("Duração ideal — entre 7 e 9h.");
  else if (s.durationMin > 9 * 60)
    lines.push("Sono longo — recuperação ativa ou fadiga acumulada.");

  if ((s.snoreEvents ?? 0) >= 5)
    lines.push("Vários episódios de ronco — vale dormir de lado e hidratar bem.");
  else if ((s.snoreEvents ?? 0) >= 1)
    lines.push("Atlas detectou ronco leve. Pode ser cansaço ou posição.");

  if (s.noiseEvents >= 20) lines.push("Quarto agitado. Tenta blackout e silêncio.");
  else if (s.noiseEvents >= 10) lines.push("Algumas interrupções durante a noite.");

  if (s.qualityScore >= 80) lines.push("Score top — mantém a rotina.");
  else if (s.qualityScore >= 60) lines.push("Boa noite no geral.");
  else lines.push("Qualidade abaixo do ideal. Tela menos antes de dormir.");

  return lines.join(" ");
}
