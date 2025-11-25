"use client";

export default function NextStepGuide() {
  const steps = [
    {
      title: "选择开户银行 / 平台",
      desc: "目前支持个人养老金的银行包括工行、建行、农行、招行、交行等，以及支付宝、微信等平台。",
    },
    {
      title: "实名验证并开立三类账户",
      desc: "需开立个人养老金账户、资金账户，以及用于购买产品的交易账户（部分平台自动完成）。",
    },
    {
      title: "完成风险评测",
      desc: "用于匹配可购买的养老目标基金（FOF）风险等级，耗时约 1 分钟。",
    },
    {
      title: "按年存入（可随时调整）",
      desc: "每年上限 ¥12,000，可一次性或分次投入，均可享税前扣除。",
    },
    {
      title: "挑选养老目标 FOF",
      desc: "常见选择包括 2050、2040、2035 目标日期基金，中长期更稳健。",
    },
  ];

  return (
    <div className="mt-8 rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-5 border border-[#F2F2F2]">
      <h3 className="text-[15px] font-semibold text-[#111] mb-1">
        开始你的个人养老金（3 分钟完成）
      </h3>

      <p className="text-[12px] text-[#666] mb-4 leading-relaxed">
        开户流程非常简单，大多数银行或平台 3 分钟即可完成以下步骤：
      </p>

      <div className="space-y-4">
        {steps.map((s, idx) => (
          <div className="flex items-start space-x-3">
            <div className="w-7 h-7 flex items-center justify-center rounded-full bg-[#E7F3FF] text-[#0092f9] font-semibold text-[13px]">
              {idx + 1}
            </div>

            <div className="flex-1">
              <p className="text-[13px] font-semibold">{s.title}</p>
              <p className="text-[12px] mt-0.5 text-[#555] leading-relaxed">
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-4">
        <button
          onClick={() => {
            window.location.href = "https://www.cifm.com/";
          }}
          className="mt-4 rounded-full px-5 py-2 text-[14px] font-semibold text-white bg-[#0092f9]
                    ] shadow hover:opacity-95"
        >
          开始了解基金产品
        </button>

        <button
          onClick={() => setView("input")}
          className="mt-3 text-[14px] font-semibold text-[#333] ml-4"
        >
          修改参数
        </button>
      </div>

      <p className="text-[11px] text-[#999] text-center mt-2 mb-1">
        * 个人养老金账户只需开户一次，可跨平台使用。
      </p>
    </div>
  );
}
