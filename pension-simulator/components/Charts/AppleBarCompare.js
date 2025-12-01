'use client'
import React from 'react'

export default function AppleBarCompare({ items }) {
  // items: [{ label, value, colorFrom, colorTo }]
  const maxVal = Math.max(...items.map(i => i.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const pct = (item.value / maxVal) * 100;

        // fallback colors
        const gradients = [
          { from: "#bb99ff", to: "#6f44bb" },   // 紫色
          { from: "#70c4ff", to: "#0092f9" },   // 蓝色
          { from: "#ffd27f", to: "#ff9f1c" },   // 橙色（FOF可用）
        ];

        const g = gradients[idx] || gradients[gradients.length - 1];

        return (
          <div key={idx}>
            <div className="flex justify-between mb-1">
              <span className="text-[13px] text-[#666]">{item.label}</span>
              <span className="text-[13px] font-medium text-[#222]">
                ¥{Math.round(item.value)} / 月
              </span>
            </div>

            <div className="h-2.5 rounded-full bg-[#F2F2F2] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(to right, ${g.from}, ${g.to})`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
