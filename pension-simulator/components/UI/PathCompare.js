import React from 'react'

export default function PathCompare({ currentMonthly = 0, targetMonthly = 0 }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-[#EEE] bg-[#FAFAFA] p-4">
        <p className="text-xs text-[#999]">照现在</p>
        <p className="mt-1 text-lg font-semibold text-[#333]">
          {Math.round(currentMonthly)} 元 / 月
        </p>
        <p className="mt-1 text-[12px] text-[#999]">
          若不调整，退休后购买力可能持续不足。
        </p>
      </div>
      <div className="rounded-xl border border-[#EEE] bg-white p-4">
        <p className="text-xs text-[#FF4D6A]">补齐后</p>
        <p className="mt-1 text-lg font-semibold text-[#FF4D6A]">
          {Math.round(targetMonthly)} 元 / 月
        </p>
        <p className="mt-1 text-[12px] text-[#999]">
          以今天价格计的目标水平（收入替代率口径）。
        </p>
      </div>
    </div>
  );
}

