"use client";

import { useEffect, useRef, useState } from "react";

type Props = { onDone?: () => void };

type BreathState = {
  cycle: number;
  phase: "in" | "out";
  left: number;
  done: boolean;
};

export function BreathExercise({ onDone }: Props) {
  const [s, setS] = useState<BreathState>({ cycle: 1, phase: "in", left: 4, done: false });
  const rm =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const t = setInterval(() => {
      setS((prev) => {
        if (prev.done) return prev;
        if (prev.left > 1) return { ...prev, left: prev.left - 1 };
        if (prev.phase === "in") return { ...prev, phase: "out", left: 6 };
        if (prev.cycle < 3) {
          return { cycle: prev.cycle + 1, phase: "in", left: 4, done: false };
        }
        clearInterval(t);
        setTimeout(() => onDoneRef.current?.(), 400);
        return { ...prev, done: true };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const big = s.phase === "in" && !s.done;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
      }}
    >
      <span style={{ fontSize: 13, color: "#6B7280" }}>
        Respiración 4-6 · ciclo {s.cycle} de 3
      </span>
      <div style={{ width: 150, height: 150, display: "grid", placeItems: "center" }}>
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "#31C6E6",
            border: "3px solid #0F2D3B",
            transform: rm ? "none" : big ? "scale(1)" : "scale(0.55)",
            transition: rm ? "none" : big ? "transform 4s ease-in-out" : "transform 6s ease-in-out",
            display: "grid",
            placeItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 26,
              fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
              fontWeight: 600,
              color: "#0F2D3B",
              transform: rm ? "none" : big ? "scale(1)" : "scale(1.8)",
              transition: rm ? "none" : big ? "transform 4s ease-in-out" : "transform 6s ease-in-out",
            }}
          >
            {s.done ? "✓" : String(s.left)}
          </span>
        </div>
      </div>
      <span style={{ fontSize: 18, fontWeight: 500 }}>
        {s.done ? "Muy bien." : s.phase === "in" ? "Tome aire" : "Suelte el aire despacio"}
      </span>
    </div>
  );
}
