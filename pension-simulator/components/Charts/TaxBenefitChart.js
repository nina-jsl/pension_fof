"use client";

import TooltipModal from "../UI/TooltipModal";

export default function TaxBenefitChart({ monthlyWage }) {
  // ---------------------- Tax Table ----------------------
  const TAX_TABLE = [
    {
      min: 0,
      max: 36000,
      bracket: 3,
      monthly: 0,
      yearly: 0,
      thirtyYear: 0,
    },
    {
      min: 36000,
      max: 144000,
      bracket: 10,
      monthly: 70,
      yearly: 840,
      thirtyYear: 25200,
    },
    {
      min: 144000,
      max: 300000,
      bracket: 20,
      monthly: 170,
      yearly: 2040,
      thirtyYear: 61200,
    },
    {
      min: 300000,
      max: 420000,
      bracket: 25,
      monthly: 220,
      yearly: 2640,
      thirtyYear: 79200,
    },
    {
      min: 420000,
      max: 660000,
      bracket: 30,
      monthly: 270,
      yearly: 3240,
      thirtyYear: 97200,
    },
    {
      min: 660000,
      max: 960000,
      bracket: 35,
      monthly: 320,
      yearly: 3840,
      thirtyYear: 115200,
    },
    {
      min: 960000,
      max: Infinity,
      bracket: 45,
      monthly: 420,
      yearly: 5040,
      thirtyYear: 151200,
    },
  ];

  // ---------------------- Determine User Bracket ----------------------
  const yearlyIncome = Number(monthlyWage) * 12 || 0;

  // find the bracket whose [min, max) covers yearly income
  const bracketRow =
    TAX_TABLE.find((r) => yearlyIncome >= r.min && yearlyIncome < r.max) ||
    TAX_TABLE[2]; // default around 20%

  const userBracket = bracketRow.bracket;

  // ---------------------- Component UI ----------------------
  return (
    <div className="mt-6 rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-5 border border-[#F2F2F2]">
      <h3 className="text-[15px] font-semibold text-[#111] mb-2">
        税收优惠的长期累积效果
      </h3>

      <p className="text-[12px] text-[#666] leading-relaxed mb-3">
        个人养老金账户每年最多 <strong>12,000 元</strong> 纳入税前扣除，
        等于你每月为退休多存钱的同时，还能少交一部分税。
        同样的钱，放在合规的个人养老金账户里，比简单存活期更划算。
        <br />
        <br />
        根据你的税率档，你的长期节税效果如下：
      </p>

      <div className="border border-[#EEE] rounded-xl overflow-hidden">
        <table className="w-full text-[12px]">
          <thead className="bg-[#FAFAFA] text-[#666]">
            <tr>
              <th className="py-2 text-center">税率档位</th>
              <th className="py-2 text-center">每月节税</th>
              <th className="py-2 text-center">每年节税</th>
              <th className="py-2 text-center">累积30年节税</th>
            </tr>
          </thead>

          <tbody>
            {TAX_TABLE.map((row) => {
              const highlight = row.bracket === userBracket;

              return (
                <tr
                  key={row.bracket}
                  className={
                    highlight
                      ? "bg-[#E8F4FF] text-[#0092f9] font-semibold"
                      : "text-[#444]"
                  }
                >
                  <td className="py-2 text-center">{row.bracket}%</td>
                  <td className="py-2 text-center">¥{row.monthly}</td>
                  <td className="py-2 text-center">¥{row.yearly}</td>
                  <td className="py-2 text-center">¥{row.thirtyYear}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[12px] text-[#999] mt-3 leading-relaxed">
        小额税优在长期复利作用下依然能累计可观金额<TooltipModal type="tax" />
      </p>
    </div>
  );
}
