"use client";

import React from "react";

// points: [{ label: "30岁", value: 75721 }, ...]
export default function EarlyStartBarChart({ points }) {
  if (!Array.isArray(points) || points.length === 0) return null;

  const values = points.map((p) => p.value ?? 0);
  const maxValue = Math.max(...values, 1); // 避免除以 0

  const formatCurrency = (v) => `¥${Math.round(v).toLocaleString("zh-CN")}`;

  return (
    <div className="w-full py-2">
      {/* 柱状图区域 */}
      <div className="flex items-end justify-between gap-4">
        {points.map((p, idx) => {
          const heightPct = (p.value / maxValue) * 100;

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center"
            >
              {/* 上面的金额文字 */}
              <span className="mb-1 text-[11px] text-neutral-800 whitespace-nowrap">
                {formatCurrency(p.value)}
              </span>

              {/* 固定高度 24 的灰色柱子，内部用百分比填充 */}
              <div className="w-4 h-24 rounded-full bg-neutral-100 flex items-end overflow-hidden">
                <div
                  className="w-full rounded-full bg-[#6f44bb]"
                  style={{ height: `${heightPct}%` }}
                />
              </div>

              {/* 年龄标签 */}
              <span className="mt-1 text-[11px] text-neutral-500 whitespace-nowrap">
                {p.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
