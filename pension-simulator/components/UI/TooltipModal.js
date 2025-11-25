"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const TIP_CONTENT = {
  pillar1n2: {
    title: "第一支柱（社保）和 第二支柱（企业年金）",
    body: "第一支柱由基础养老金 + 个人账户组成，整体替代率约为 35%–45%，是大多数人退休金的基础来源。第二支柱由单位建立的补充养老金，覆盖率较低，但收益稳定。若所在单位有企业年金，你的退休收入将显著提高。",
  },
  pillar3: {
    title: "第三支柱缺口",
    body: "第三支柱（个人养老金）自愿缴纳，每年最高 12000 元，可享受税收优惠，是提升退休质量的关键补充部分。第三支柱缺口指为了达到目标退休收入（如 70% 替代率），在扣除第一支柱和第二支柱后，仍需通过个人养老金来补足的部分。",
  },
  replacement: {
    title: "收入替代率",
    body: "退休后收入 ÷ 退休前收入。世界银行建议维持在 70% 左右，以保证退休生活质量。",
  },
  annuity: {
    title: "计发月数",
    body: "决定你每月可以领取多少养老金。计发月数由国家统一设定：退休越早，计发月数越大，因此月领金额越少。",
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
              <p className="mt-2 text-[14px] text-[#444] leading-relaxed">
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
