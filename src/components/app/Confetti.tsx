"use client";

import { useEffect, useState } from "react";

const COLORS = ["#C6FF00", "#9ECC00", "#EDEDED", "#7B6DFF", "#FFD24F"];

type Piece = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  rot: number;
  drot: number;
  color: string;
  size: number;
  shape: "rect" | "circle";
};

export function Confetti({
  active,
  duration = 3000,
  count = 120,
}: {
  active: boolean;
  duration?: number;
  count?: number;
}) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!active) return;
    setHidden(false);
    const arr: Piece[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: 50 + (Math.random() - 0.5) * 30,
        y: -10 - Math.random() * 20,
        dx: (Math.random() - 0.5) * 1.5,
        dy: 0.6 + Math.random() * 1.4,
        rot: Math.random() * 360,
        drot: (Math.random() - 0.5) * 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 8,
        shape: Math.random() > 0.5 ? "rect" : "circle",
      });
    }
    setPieces(arr);
    const t = setTimeout(() => setHidden(true), duration);
    return () => clearTimeout(t);
  }, [active, duration, count]);

  if (!active || hidden) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[200] overflow-hidden"
      aria-hidden
    >
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute will-change-transform"
          style={{
            left: `${p.x}%`,
            top: 0,
            width: p.size,
            height: p.shape === "rect" ? p.size * 1.5 : p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "9999px" : "2px",
            transform: `translateY(${p.y}vh) rotate(${p.rot}deg)`,
            animation: `confetti-fall ${duration}ms ${i * 5}ms linear forwards`,
            opacity: 0.95,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20vh) translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(120vh) translateX(${(Math.random() - 0.5) * 60}px) rotate(720deg); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
