"use client";
import { useEffect, useState } from "react";

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    window.addEventListener("mousemove", (e) => {
      setPos({ x: e.clientX, y: e.clientY });
    });
  }, []);

  return (
    <div
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
      }}
      className="fixed z-[9999] w-6 h-6 rounded-full bg-[rgba(218,216,195,0.4)] backdrop-blur-md pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-all duration-150 mix-blend-exclusion"
    />
  );
}
