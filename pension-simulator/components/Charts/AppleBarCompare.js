'use client'
import React from 'react'

export default function AppleBarCompare({ leftLabel, rightLabel, leftValue, rightValue }) {
  const maxVal = Math.max(leftValue, rightValue, 1);
  const leftPct = (leftValue / maxVal) * 100;
  const rightPct = (rightValue / maxVal) * 100;

  return (
    <div className="space-y-3">
      {/* Row 1 */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[13px] text-[#666]">{leftLabel}</span>
          <span className="text-[13px] font-medium text-[#222]">
            ¥{Math.round(leftValue)} / 月
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-[#F2F2F2] overflow-hidden">
          <div
            className="h-full rounded-full bg-linear-to-r from-[#A4A8FF] to-[#6E73F9]"
            style={{ width: `${leftPct}%` }}
          />
        </div>
      </div>

      {/* Row 2 */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[13px] text-[#666]">{rightLabel}</span>
          <span className="text-[13px] font-medium text-[#FF4D6A]">
            ¥{Math.round(rightValue)} / 月
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-[#F2F2F2] overflow-hidden">
          <div
            className="h-full rounded-full bg-linear-to-r from-[#FF9AAE] to-[#FF4D6A]"
            style={{ width: `${rightPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

