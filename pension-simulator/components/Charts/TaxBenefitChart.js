"use client";

export default function TaxBenefitChart({ monthlyWage}) {
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
        每年最多 <strong>¥12,000</strong> 可计入个人养老金账户并享受
        <strong>税前扣除</strong>。
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
        数据来源：华安基金示例。小额税优在长期复利作用下依然能累计可观金额。
      </p>
    </div>
  );
}
