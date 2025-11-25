'use client'
import { useEffect, useRef, useState} from "react";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

export default function DidYouKnowCarousel({ items = [] }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!items.length) return;
    timerRef.current = setInterval(
      () => setIdx((i) => (i + 1) % items.length),
      3600
    );
    return () => clearInterval(timerRef.current);
  }, [items.length]);

  if (!items.length) return null;
  const it = items[idx];

  return (
    <div className="mt-5 rounded-xl border border-[#EEE] bg-white p-4 text-left shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-[#0092f9]">
          你知道吗？
        </span>
        <div className="flex gap-1">
          {items.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${
                i === idx ? "bg-[#0092f9]" : "bg-[#E6E6E6]"
              }`}
            />
          ))}
        </div>
      </div>
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="mt-2 text-[13px] leading-relaxed text-[#444]"
      >
        <p className="font-medium">{it.title}</p>
        <p className="mt-1">{it.text}</p>
        {it.source && (
          <a
            className="mt-2 inline-block text-xs text-[#999] underline underline-offset-4"
            href={it.source}
            target="_blank"
            rel="noreferrer"
          >
            数据来源
          </a>
        )}
      </motion.div>
    </div>
  );
}
