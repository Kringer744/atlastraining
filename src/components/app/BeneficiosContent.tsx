"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Gift, Sparkles, Tag } from "lucide-react";

type Beneficio = {
  id: string;
  parceiro: string;
  categoria: string;
  desconto: string;
  descricao: string;
  cupom: string;
  url: string;
  cor: string;
  destaque?: boolean;
};

const BENEFICIOS: Beneficio[] = [
  {
    id: "icelabz",
    parceiro: "IceLabz",
    categoria: "Suplementos",
    desconto: "10% OFF",
    descricao:
      "Whey, creatina, pré-treino e mais. Suplementação de qualidade pra performance.",
    cupom: "ATLAS",
    url: "https://icelabz.com.br/",
    cor: "#4ECDC4",
    destaque: true,
  },
];

export function BeneficiosContent() {
  return (
    <div className="space-y-3">
      <div className="atlas-card flex items-start gap-3 bg-atlas-energy/10 border-atlas-energy/30">
        <Sparkles className="text-atlas-energy shrink-0 mt-0.5" />
        <div className="text-sm">
          <div className="font-semibold text-atlas-contrast">
            Vantagens exclusivas pra quem treina com Atlas.
          </div>
          <div className="text-xs text-atlas-muted mt-1">
            Cupons e descontos negociados com parceiros selecionados. Use à
            vontade — a lista cresce toda semana.
          </div>
        </div>
      </div>

      {BENEFICIOS.map((b) => (
        <BeneficioCard key={b.id} b={b} />
      ))}

      <div className="atlas-card-muted text-center text-xs text-atlas-muted mt-4">
        <Gift size={20} className="mx-auto mb-2 text-atlas-energy" />
        Mais parceiros chegando em breve.
        <br />
        Quer indicar uma marca? Fale com seu personal.
      </div>
    </div>
  );
}

function BeneficioCard({ b }: { b: Beneficio }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(b.cupom);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // fallback: select & prompt
      window.prompt("Copie o cupom:", b.cupom);
    }
  };

  return (
    <div
      className={
        "atlas-card relative overflow-hidden " +
        (b.destaque ? "border-atlas-energy/40" : "")
      }
    >
      {b.destaque && (
        <div className="absolute top-0 right-0 bg-atlas-energy text-atlas-focus-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-bl-lg">
          Em destaque
        </div>
      )}
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-bold text-lg"
          style={{
            background: `${b.cor}22`,
            color: b.cor,
            border: `1px solid ${b.cor}55`,
          }}
        >
          {b.parceiro.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-semibold text-atlas-contrast">{b.parceiro}</div>
            <span
              className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full"
              style={{
                background: `${b.cor}22`,
                color: b.cor,
                border: `1px solid ${b.cor}44`,
              }}
            >
              {b.categoria}
            </span>
          </div>
          <div className="text-2xl font-bold mt-1" style={{ color: b.cor }}>
            {b.desconto}
          </div>
          <p className="text-xs text-atlas-muted mt-1 leading-relaxed">
            {b.descricao}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="flex-1 flex items-center justify-between gap-2 rounded-xl bg-white/5 border border-white/15 px-3 py-2.5 hover:bg-white/10 active:scale-[0.98] transition"
          aria-label={`Copiar cupom ${b.cupom}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Tag size={14} className="text-atlas-energy shrink-0" />
            <div className="text-left min-w-0">
              <div className="text-[9px] uppercase tracking-wider text-atlas-muted">
                Cupom
              </div>
              <div className="font-mono font-bold text-sm tracking-wider truncate">
                {b.cupom}
              </div>
            </div>
          </div>
          {copied ? (
            <span className="text-atlas-energy text-xs font-semibold flex items-center gap-1 shrink-0">
              <Check size={14} /> copiado
            </span>
          ) : (
            <span className="text-atlas-muted text-xs flex items-center gap-1 shrink-0">
              <Copy size={14} /> copiar
            </span>
          )}
        </button>
        <a
          href={b.url}
          target="_blank"
          rel="noreferrer noopener"
          className="atlas-btn-primary px-3 py-2.5"
          aria-label={`Abrir loja ${b.parceiro}`}
        >
          <ExternalLink size={14} />
          <span className="hidden sm:inline">Loja</span>
        </a>
      </div>
    </div>
  );
}
