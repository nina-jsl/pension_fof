"use client";

export default function NextStepGuide({ setView }) {
  const steps = [
    {
      title: "选择一个你常用的平台",
      desc: "你可以在工行、建行、农行、招行等银行 App，也可以通过支付宝、微信的“个人养老金专区”开启流程。",
    },
    {
      title: "完成实名认证并开立账户",
      desc: "系统会帮你开立个人养老金账户和资金账户；部分平台会自动创建交易账户，无需你额外操作。",
    },
    {
      title: "做一个简单的风险测评",
      desc: "大约 1 分钟，用来确认你可以购买哪些类型的养老目标基金或养老产品。",
    },
    {
      title: "按年存入你希望投入的金额",
      desc: "你可以自由选择每年投入多少。其中前 ¥12,000 可计入个人养老金账户，享受税前扣除；超过 ¥12,000 的部分仍可继续投资，但作为“补充养老投资”，只能申购 A/C 份额，不再享受额外税惠。",
    },

    {
      title: "挑选适合你的养老目标 FOF",
      desc: "常见选择有 2050、2040、2035 目标日期基金，适合长期稳健积累；也可选择其他符合资格的养老产品。",
    },
  ];

  return (
    <div className="mt-8 rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-5 border border-[#F2F2F2]">
      <h3 className="text-[15px] font-semibold text-[#111] mb-1">
        开始你的个人养老金（3 分钟完成）
      </h3>

      <p className="text-[12px] text-[#666] mb-4 leading-relaxed">
        实际流程非常简单，大多数平台 3 分钟即可完成以下步骤：
      </p>

      <div className="space-y-4">
        {steps.map((s, idx) => (
          <div key={idx} className="flex items-start space-x-3">
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

      {/* Buttons */}
      <div className="flex justify-center mt-4">
        <button
          onClick={() => {
            window.location.href = "https://www.cifm.com/";
          }}
          className="mt-4 rounded-full px-5 py-2 text-[14px] font-semibold text-white bg-[#0092f9] shadow hover:opacity-95"
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
        *
        个人养老金账户只需开立一次，可在不同平台间通用；税前扣除额度按自然年度重新计算。
      </p>
    </div>
  );
}
