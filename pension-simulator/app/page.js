"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  computePillar1,
  computePillar2,
  computePillar3Gap,
} from "@/lib/pension";
import wageData from "./wage.json";

// 城市选项（
const PROVINCES = wageData.map((d) => d.province);

// 返回选中省份对应的平均工资（每月）
function getSocialAvg(province) {
  const found = wageData.find((d) => d.province === province);
  return found ? Number(found.avg_wage_all) : null;
}

// Simple, transparent tax model
function computeTaxSaving(monthlySaving, marginalRate = 0.1) {
  const annual = monthlySaving * 12;
  const deductible = Math.min(annual, 12000); // 专项附加扣除上限（便于解释，不会说错）
  return deductible * marginalRate;
}

export default function Home() {
  const [showInput, setShowInput] = useState(false);
  const [showTaxInfo, setShowTaxInfo] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Basic inputs
  const [city, setCity] = useState("");
  const [pillar2Level, setPillar2Level] = useState("");
  const [monthlyWage, setMonthlyWage] = useState("");
  const [age, setAge] = useState("");
  const [yearsWorked, setYearsWorked] = useState("");

  // Assumptions (可选可改)
  const [showMethod, setShowMethod] = useState(false);
  const [targetReplacement, setTargetReplacement] = useState(70); // %
  const [preRetRealReturn, setPreRetRealReturn] = useState(0); // % 退休前“实际”年化收益
  const [wageGrowth, setWageGrowth] = useState(3); // 预期年工资增长率（%）
  const [inflation, setInflation] = useState(2.25); // 预期年通胀率（%）
  const [annuityDivisor, setAnnuityDivisor] = useState(139); // 默认60岁
  const [taxRate, setTaxRate] = useState(10); // % 边际税率（保守演示）
  const [customSocialAvg, setCustomSocialAvg] = useState(""); // 允许覆盖城市社平

  const retirementAge = 60;
  const socialAvg = customSocialAvg
    ? Number(customSocialAvg)
    : getSocialAvg(city);

  let result = null;
  if (monthlyWage && age && yearsWorked) {
    // Pillar 1 & 2（保持“今天价格”的口径）
    const p1 = computePillar1(
      Number(monthlyWage),
      socialAvg,
      Number(yearsWorked),
      Number(age),
      retirementAge
    );
    const p2 = computePillar2(
      Number(monthlyWage),
      socialAvg,
      Number(yearsWorked),
      Number(age),
      retirementAge,
      pillar2Level
    );

    // Pillar 3 缺口与月存（用可选收益假设）
    const gapObj = computePillar3Gap(
      Number(monthlyWage),
      Number(age),
      retirementAge,
      p1.total,
      p2.monthly,
      {
        g_w: wageGrowth / 100,
        inf: inflation / 100,
        targetReplacement: Number(targetReplacement) / 100,
        annuityDivisor: Number(annuityDivisor),
      }
    );

    result = {
      p1,
      p2,
      p3: {
        ...gapObj,
        taxSaving: computeTaxSaving(
          gapObj.monthlySaving,
          Number(taxRate) / 100
        ),
      },
    };
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-white">
      <div className="w-full max-w-[460px] px-6 text-center text-[#333]">
        <AnimatePresence mode="wait">
          {!showInput && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {/* TITLE */}
              <h1 className="text-xl font-semibold mt-6">
                60岁的你，会过怎样的生活？
              </h1>
              <p className="text-sm text-[#999] mt-2">
                退休不是很远，是每天都在靠近。
              </p>

              {/* Assumption chip */}
              {/* <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0F2] text-[#FF4D6A] text-xs font-medium">
                按<strong>零收益</strong>测算（不含理财/定存收益）
              </div> */}
              <div className="mt-4">
                <button
                  onClick={() => setShowMethod((v) => !v)}
                  className="text-xs text-[#999] underline underline-offset-4"
                >
                  {showMethod ? "收起计算规则" : "计算规则 · 展开更多"}
                </button>

                <AnimatePresence>
                  {showMethod && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[13px] text-[#666] mt-3 leading-relaxed bg-[#FAFAFA] p-4 rounded-xl border border-[#EEE]"
                    >
                      <p>
                        我们按世界银行建议，退休后维持退休前约
                        <strong>{targetReplacement}%</strong> 的收入替代率。
                      </p>
                      <p className="mt-2">
                        第一支柱（社保）≈ 统筹养老金 + 个人账户养老金
                      </p>
                      <p>第二支柱（企业年金）≈ 企业年金账户 ÷ 年金折算除数</p>
                      <p className="mt-2">
                        差额 = 目标退休收入 -（第一支柱 + 第二支柱）
                      </p>
                      <p className="mt-2">
                        月存额 = 差额 × 年金折算除数 ÷ 距离退休月数
                      </p>
                      <p className="text-xs text-[#AAA] mt-3">
                        注：此测算为“以今天价格计”，不含理财/存款收益，目的是给你一个保守且直观的参考。
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* RESULT */}
              {result && (
                <>
                  <motion.div
                    className="mt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <p className="text-sm">你退休后每月预计可领：</p>
                    <motion.p
                      className="text-3xl font-bold text-[#FF4D6A] mt-1"
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 0.6 }}
                    >
                      {result.p1.total.toFixed(0)} 元 / 月
                    </motion.p>
                  </motion.div>

                  {/* GAP & PLAN */}
                  <div className="mt-6 bg-[#FFF5F7] p-5 rounded-xl text-left">
                    <p className="text-sm">
                      要维持“正常生活”（约
                      {Number(targetReplacement).toFixed(0)}%收入替代）
                    </p>

                    {result.p3.gap > 0 ? (
                      <>
                        <p className="text-2xl font-bold text-[#FF4D6A] mt-2 text-center">
                          还差 {result.p3.gap.toFixed(0)} 元 / 月
                        </p>

                        <p className="text-sm text-[#666] mt-4">
                          我们帮你算好了：
                        </p>
                        <p className="text-lg font-semibold mt-1 text-center">
                          每月存{" "}
                          <span className="text-[#FF4D6A] font-bold">
                            {result.p3.monthlySaving.toFixed(0)}
                          </span>{" "}
                          元就能补上差距
                        </p>
                        {/* tax line + link */}
                        <button
                          onClick={() => setShowTaxInfo(true)}
                          className="text-sm text-[#FF4D6A] font-medium mt-3 underline underline-offset-4"
                        >
                          当年可少交税 ≈ {result.p3.taxSaving.toFixed(0)}{" "}
                          元（怎么算？）
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-[#666] mt-2 text-center">
                          你已经达到理想退休水平
                        </p>
                        <p className="text-sm text-[#666] mt-4 text-center">
                          继续保持现在的储蓄和社保缴纳即可。
                        </p>
                      </>
                    )}
                  </div>
                </>
              )}

              <button
                onClick={() => setShowInput(true)}
                className="mt-8 w-full bg-[#FF4D6A] text-white py-3 rounded-full font-semibold hover:opacity-95 transition"
              >
                我们来帮你规划
              </button>
            </motion.div>
          )}

          {/* INPUT + ADVANCED */}
          {showInput && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 space-y-4 text-left"
            >
              <h2 className="text-sm text-center text-[#999]">
                你当前所在的城市
              </h2>
              <select
                className="w-full border border-[#E5E5E5] rounded-lg px-4 py-3 pr-8 text-left bg-white"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={`${socialAvg ? Math.round(socialAvg) : "未选择"}`}

              >
                <option value="">请选择所在省份</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <input
                className="w-full border border-[#E5E5E5] rounded-lg px-4 py-3 text-left text-[15px] focus:outline-none focus:ring-1 focus:ring-[#FF4D6A]"
                placeholder="月薪（元）"
                value={monthlyWage}
                onChange={(e) => setMonthlyWage(e.target.value)}
              />

              <input
                className="w-full border border-[#E5E5E5] rounded-lg px-4 py-3 text-left text-[15px] focus:outline-none focus:ring-1 focus:ring-[#FF4D6A]"
                placeholder="年龄"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />

              <input
                className="w-full border border-[#E5E5E5] rounded-lg px-4 py-3 text-left text-[15px] focus:outline-none focus:ring-1 focus:ring-[#FF4D6A]"
                placeholder="你已经工作了多久（年）"
                value={yearsWorked}
                onChange={(e) => setYearsWorked(e.target.value)}
              />

              <p className="text-sm text-center text-[#999] mt-2">
                你所在单位的企业年金水平
              </p>
              <select
                className="w-full border border-[#E5E5E5] rounded-lg px-4 py-3 pr-8 text-left bg-white"
                value={pillar2Level}
                onChange={(e) => setPillar2Level(e.target.value)}
              >
                <option value="none">无</option>
                <option value="none">没有企业年金</option>
                <option value="basic">有，但比较少</option>
                <option value="standard">一般水平（多数大厂 / 外企）</option>
                <option value="generous">
                  福利较好（银行 / 保险 / 中央国企）
                </option>
              </select>
              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="text-xs text-[#999] underline underline-offset-4"
                >
                  {showAdvanced ? "收起可选项" : "可选项 · 展开更多"}
                </button>
              </div>

              {/* Advanced panel */}
              <AnimatePresence initial={false}>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden mt-3 bg-white rounded-xl border border-[#EEE]"
                  >
                    {/* LIST ITEM */}
                    <div className="flex justify-between items-center px-3 py-3 border-b border-[#F3F3F3]">
                      <span className="text-sm text-[#333]">
                        预期年工资增长率 (%)
                      </span>
                      <input
                        type="number"
                        className="text-right w-16 text-sm outline-none"
                        value={wageGrowth}
                        onChange={(e) => setWageGrowth(Number(e.target.value))}
                      />
                    </div>

                    <div className="flex justify-between items-center px-3 py-3 border-b border-[#F3F3F3]">
                      <span className="text-sm text-[#333]">
                        预期年通胀率 (%)
                      </span>
                      <input
                        type="number"
                        className="text-right w-16 text-sm outline-none"
                        value={inflation}
                        onChange={(e) => setInflation(Number(e.target.value))}
                      />
                    </div>

                    <div className="flex justify-between items-center px-3 py-3 border-b border-[#F3F3F3]">
                      <span className="text-sm text-[#333]">
                        预期第一支柱 年投资收益率(%)
                      </span>
                      <input
                        type="number"
                        className="text-right w-16 text-sm outline-none"
                        value={2.75}
                        disabled
                      />
                    </div>

                    <div className="flex justify-between items-center px-3 py-3 border-b border-[#F3F3F3]">
                      <span className="text-sm text-[#333]">
                        所在城市平均月工资
                      </span>
                      <input
                        className="text-right w-20 text-sm outline-none"
                        placeholder={`默认 ${socialAvg ? Math.round(socialAvg) : "未选择"}`}
                        value={customSocialAvg}
                        onChange={(e) => setCustomSocialAvg(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-between items-center px-3 py-3 border-b border-[#F3F3F3]">
                      <span className="text-sm text-[#333]">
                        理想替代率 (%)
                      </span>
                      <input
                        type="number"
                        className="text-right w-16 text-sm outline-none"
                        value={targetReplacement}
                        onChange={(e) => setTargetReplacement(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-between items-center px-3 py-3">
                      <span className="text-sm text-[#333]">
                        社保缴纳比例 (%)
                      </span>
                      <input
                        type="number"
                        className="text-right w-16 text-sm outline-none"
                        value={8}
                        disabled
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                className="w-full bg-[#FF4D6A] text-white py-3 rounded-full font-semibold hover:opacity-95 transition mt-2"
                onClick={() => setShowInput(false)}
              >
                查看计算结果
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TAX EXPLAINER MODAL */}
        <AnimatePresence>
          {showTaxInfo && (
            <motion.div
              className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTaxInfo(false)}
            >
              <motion.div
                className="bg-white rounded-2xl p-6 w-[90%] max-w-[440px] text-left"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold">
                  “少交税 ≈ XXX 元”怎么算？
                </h3>
                <ol className="mt-3 text-sm text-[#555] list-decimal pl-4 space-y-2">
                  <li>
                    假设你每月按<span className="font-medium">税延养老</span>
                    或类似合规方式存入
                    <span className="font-medium">可税前扣除</span>的金额。
                  </li>
                  <li>
                    我们按<strong>年扣除限额 12,000 元</strong>
                    进行估算（保守且通用）。
                  </li>
                  <li>
                    省税 ≈ <code>min(月存×12, 12000) × 你的边际税率</code>。
                  </li>
                </ol>
                <p className="text-xs text-[#9a9a9a] mt-3">
                  注：这是简化示意，真实税负受收入结构/专项附加扣除/地方规则影响。
                </p>
                <button
                  className="mt-4 w-full bg-[#FF4D6A] text-white py-2 rounded-full font-semibold"
                  onClick={() => setShowTaxInfo(false)}
                >
                  明白了
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
