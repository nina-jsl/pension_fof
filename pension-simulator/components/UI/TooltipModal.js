"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const TIP_CONTENT = {
  pillar1n2: {
    title: "第一、二支柱是什么？",
    body: "第一支柱就是社保，包含基础养老金 + 个人账户，能帮你覆盖大约 35%–45% 的退休收入。第二支柱是单位给你额外准备的“企业年金”，如果公司有，你未来能领的钱会明显增加。但目前只有少部分人有企业年金。",
  },
  pillar3: {
    title: "如何计算",
    body: "第三支柱是你自己购买的个人养老金产品，每年有 12,000 元的部分可以享受税收优惠。所谓“缺口”，指的是为了达到理想退休生活（如 70% 的退休替代率），在扣掉第一、二支柱后，你还需要靠第三支柱来补齐的部分。",
  },

  replacement: {
    title: "什么是收入替代率？",
    body: "退休后每月能领的钱 ÷ 你退休前的工资。世界银行建议保持在 70% 左右，这样退休后的生活质量才不会明显下降。",
  },
  annuity: {
    title: "什么是计发月数？",
    body: `计发月数决定你每个月能领到的养老金是多少。国家会根据你的退休年龄设定：

• 退休越早 → 计发月数越大（要分更多个月发完）→ 每月领得更少  
• 退休越晚 → 计发月数越小 → 每月领得更多

例如：
60 岁退休常用的计发月数约为 139，
55 岁退休大约是 170 左右。`,
  },
  monthlySaving: {
    title: "如何计算？",
    body: `我们根据以下公式反推你现在每月需要储蓄的金额：

月储蓄 = (退休缺口 × 计发月数) ÷ [ ((1 + r)^(n × 12) − 1) × r ]\n
r = 扣除通胀后的真实年化收益率
n = 距离退休的年数`,
  },
  tax: {
    title: "如何计算",
    body: "数据来源：华安基金示例。",
  },
  backcast: {
    title: "为什么是 1.5%？",
    body: "为了估算你过去已经累积的个人账户余额，我们需要知道你每一年的历史工资。由于你只输入了当前工资，工具会假设你的工资在过去每年大约以 1.5% 的幅度向前回推递减，并据此计算历年缴费，再按 2% 的计息率滚到退休。1.5% 只是一个保守的技术性假设，用来避免低估你的历史积累，并不代表你真实的工资变化轨迹。",
  },
  productSaving: {
    title: "不同产品每月该存多少？",
    body: "这三个数字，是把你的“退休缺口”（按今天购买力）当作目标月领金额，然后反推现在每月需要存多少算出来的。\n\n简单来说：\n月领 ≈ [月储蓄 × ((1 + r/12)^(n×12) − 1) ÷ (r/12)] ÷ 计发月数\n\n其中：\n• 月领 = 你退休时每月需要补上的缺口（今天购买力）\n• r = 扣除通胀后的真实年化收益率（比如 2.5%、3.5%、5.5%）\n• n = 距离退休的年数\n• 计发月数 = 退休时国家规定要“分多少个月发完”\n\n我们把“月领”设为你的缺口，用不同的 r 反推对应的月储蓄，就得到：定存需要存多少、养老理财需要存多少、养老 FOF 大概只需要存多少。",
  },
};

export default function TooltipModal({ type }) {
  const [open, setOpen] = useState(false);

  const tip = TIP_CONTENT[type] || {
    title: "说明",
    body: "暂无内容。",
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="ml-1 inline-flex items-center justify-center 
             text-[10px] leading-none align-middle 
             text-[#0092f9] border border-[#0092f9] 
             rounded-full w-3 h-3"
      >
        ?
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 bg-black/30 flex justify-center items-end z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            {/* Card */}
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              exit={{ y: 50 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[420px] bg-white rounded-t-2xl p-6 shadow-lg"
            >
              <h2 className="text-[16px] font-semibold text-[#111]">
                {tip.title}
              </h2>
              <p className="mt-2 text-[14px] text-[#444] leading-relaxed whitespace-pre-wrap">
                {tip.body}
              </p>

              <button
                onClick={() => setOpen(false)}
                className="mt-5 w-full bg-[#0092f9] text-white rounded-full py-2 text-[14px] font-semibold"
              >
                好的
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
