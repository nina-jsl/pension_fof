'use client'
import React from 'react'
import { motion } from 'framer-motion'

export default function AppleBarCompare({ items }) {
  // items: [{ label, value }]
  const maxVal = Math.max(...items.map(i => i.value), 1);

  const gradients = [
    { from: "#bb99ff", to: "#6f44bb" },   // 紫
    { from: "#70c4ff", to: "#0092f9" },   // 蓝
    { from: "#FFE7A3", to: "#ffbe37" },   // 黄（推荐）
  ];

  return (
    <div className="space-y-4">
      {items.map((item, idx) => {
        const pct = (item.value / maxVal) * 100;
        const g = gradients[idx] || gradients[gradients.length - 1];
        const isRecommended = idx === 2;  // 第三个为推荐 FOF

        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.1 }}
            className="relative"
          >
            {/* 推荐 badge */}
            {isRecommended && (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute -top-3 right-0 bg-[#ffbe37] text-white 
                           text-[10px] px-2 py-0.5 rounded-full font-semibold shadow"
              >
                推荐
              </motion.div>
            )}

            {/* Label + 数值 */}
            <div className="flex justify-between mb-1 pr-10">
              <span className="text-[13px] text-[#666]">{item.label}</span>
              <span className="text-[13px] font-medium text-[#222]">
                ¥{Math.round(item.value)} / 月
              </span>
            </div>

            {/* 背景条 */}
            <div className="h-2.5 rounded-full bg-[#F2F2F2] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(to right, ${g.from}, ${g.to})`,
                }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
