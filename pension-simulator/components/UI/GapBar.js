'use client'
import React from 'react'
import { useState} from "react";
import { motion, AnimatePresence } from "framer-motion";


export default function GapBar({ current = 0, target = 0, mode = "amount" }) {
  const [hover, setHover] = useState(false);
  const safeTarget = Math.max(target, 0.0001);
  const pct = Math.min(1, Math.max(0, current / safeTarget));
  const gap = Math.max(0, safeTarget - current);
  const centerLabel =
    mode === "percent"
      ? `${Math.round(pct * 100)}%`
      : `¥${Math.round(current)} / ¥${Math.round(safeTarget)}`;
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-[#666] mb-1">
        <span>退休准备进度</span>
        <span>{Math.round(pct * 100)}%</span>
      </div>
      <div
        className="relative h-4 rounded-full bg-[#F2F2F2] overflow-hidden"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-[#FF9AAE] to-[#FF4D6A]"
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.6 }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[11px] text-white font-medium pointer-events-none">
          {centerLabel}
        </div>
        <AnimatePresence>
          {hover && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute left-1/2 top-full z-10 mt-2 w-max -translate-x-1/2 rounded-lg border border-[#EEE] bg-white px-3 py-2 text-[12px] text-[#444] shadow"
            >
              <div>
                预计可领：<strong>¥{Math.round(current)}</strong>
              </div>
              <div>
                目标水平：<strong>¥{Math.round(safeTarget)}</strong>
              </div>
              <div>
                当前差距：<strong>¥{Math.round(gap)}</strong>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
