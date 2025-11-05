"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  computePillar1,
  computePillar2,
  computePillar3Gap,
} from "@/lib/pension";
import { WAGE_DATA } from "./wage";

/* ========================= Helpers & Data ========================= */
const PROVINCES = WAGE_DATA.map((d) => d.province);

function getSocialAvg(province) {
  const found = WAGE_DATA.find((d) => d.province === province);
  return found ? Number(found.avg_wage_all) : null;
}

function computeTaxSaving(monthlySaving, marginalRate = 0.1) {
  const annual = monthlySaving * 12;
  const deductible = Math.min(annual, 12000);
  return deductible * marginalRate;
}

/* ========================= UI Components ========================= */

// 0) 倒计时条（距离60岁）
function UrgencyStrip({ age, retirementAge = 60 }) {
  const [now, setNow] = useState(null); // JS file: no TS generic

  useEffect(() => {
    // update via a callback only (no immediate setState)
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const yearsLeft = Math.max(0, retirementAge - Number(age || 0));

  // safe without initial `now`
  const daysLeft = (() => {
    if (now == null) return Math.floor(yearsLeft * 365);
    const dayFrac = (now / 86_400_000) % 1;
    return Math.max(0, Math.floor(yearsLeft * 365 - dayFrac));
  })();

  const pct = Math.min(100, (yearsLeft / 40) * 100);

  return (
    <div className="mt-4 rounded-xl border border-[#EEE] bg-[#FAFAFA] px-4 py-2 text-left">
      <div className="flex items-center justify-between text-xs text-[#666]">
        <span>距离 60 岁还有</span>
        <span className="font-medium text-[#333]">{yearsLeft} 年</span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-[#F2F2F2] overflow-hidden">
        <div
          className="h-full bg-[#FF4D6A]"
          style={{ width: `${pct}%`, transition: "width .4s ease" }}
        />
      </div>
      <p className="mt-1 text-[11px] text-[#999]">大约还剩 {daysLeft} 天。</p>
    </div>
  );
}


// 1) 事实轮播（轻量，自动/手动切换）
function DidYouKnowCarousel({ items = [] }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % items.length);
    }, 3600);
    return () => clearInterval(timerRef.current);
  }, [items.length]);

  if (!items.length) return null;
  const it = items[idx];

  return (
    <div className="mt-5 rounded-xl border border-[#EEE] bg-white p-4 text-left shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-[#FF4D6A]">
          你知道吗？
        </span>
        <div className="flex gap-1">
          {items.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${
                i === idx ? "bg-[#FF4D6A]" : "bg-[#E6E6E6]"
              }`}
            />
          ))}
        </div>
      </div>
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="mt-2 text-[13px] leading-relaxed text-[#444]"
      >
        <p className="font-medium">{it.title}</p>
        <p className="mt-1">{it.text}</p>
        {it.source && (
          <a
            className="mt-2 inline-block text-xs text-[#999] underline underline-offset-4"
            href={it.source}
            target="_blank"
            rel="noreferrer"
          >
            数据来源
          </a>
        )}
      </motion.div>
    </div>
  );
}

// 2) 缺口热条
function GapHeatbar({ value = 0, max = 20000 }) {
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between text-xs text-[#666]">
        <span>缺口热度</span>
        <span>{Math.round(pct * 100)}%</span>
      </div>
      <div className="relative mt-2 h-3 w-full rounded-full bg-gradient-to-r from-[#FFE6EA] via-[#FF9AAE] to-[#FF4D6A]">
        <motion.div
          className="absolute left-0 top-0 h-3 rounded-full bg-white/50"
          initial={{ width: "0%" }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        />
        {value > 0 && (
          <motion.div
            className="absolute -top-1.5 h-6 w-6 rounded-full border-2 border-white"
            style={{ left: `calc(${pct * 100}% - 12px)` }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            <div className="h-full w-full rounded-full bg-[#FF4D6A]/80" />
          </motion.div>
        )}
      </div>
      <p className="mt-2 text-[12px] text-[#999]">
        按“今天价格”估算，越红说明你的现金流断档越明显。
      </p>
    </div>
  );
}

// 3) 两条未来（对比卡）
function PathCompare({ currentMonthly = 0, targetMonthly = 0 }) {
  return (
    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
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

// 4) 底部固定 CTA
function StickyCTA({ visible, saving = 0, tax = 0, onClick }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-x-0 bottom-4 z-40 px-4">
      <div className="mx-auto max-w-[460px] rounded-2xl border border-[#EEE] bg-white/95 p-3 shadow-lg backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="text-sm">
              每月补{" "}
              <span className="font-semibold text-[#FF4D6A]">
                {Math.round(saving)}
              </span>{" "}
              元
            </p>
            <p className="mt-0.5 text-[12px] text-[#999]">
              当年可少交税 ≈ {Math.round(tax)} 元
            </p>
          </div>
          <button
            onClick={onClick}
            className="rounded-full bg-[#FF4D6A] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            现在就制定计划
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========================= Page ========================= */

export default function Home() {
  // --- state (unchanged) ---
  const [showInput, setShowInput] = useState(false);
  const [showTaxInfo, setShowTaxInfo] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMethod, setShowMethod] = useState(false);

  const [city, setCity] = useState("");
  const [pillar2Level, setPillar2Level] = useState("none");
  const [monthlyWage, setMonthlyWage] = useState("");
  const [age, setAge] = useState("");
  const [yearsWorked, setYearsWorked] = useState("");

  const [showMethod, setShowMethod] = useState(false);
  const [targetReplacement, setTargetReplacement] = useState(70);
  const [preRetRealReturn, setPreRetRealReturn] = useState(0);
  const [wageGrowth, setWageGrowth] = useState(3);
  const [inflation, setInflation] = useState(2.25);
  const [annuityDivisor, setAnnuityDivisor] = useState(139);
  const [taxRate, setTaxRate] = useState(10);
  const [customSocialAvg, setCustomSocialAvg] = useState("");

  // --- derived inputs ---
  const retirementAge = 60;
  const socialAvg =
    customSocialAvg !== "" ? Number(customSocialAvg) : getSocialAvg(city) || 0;

  // IMPORTANT: declare result first
  let result = null;

  // Only compute when we have the basics
  if (monthlyWage && age && yearsWorked) {
    const gw = Number(wageGrowth) / 100; // real wage growth
    const cr = Number(preRetRealReturn) / 100 || 0; // real credit rate

    const p1 = computePillar1(
      Number(monthlyWage),
      socialAvg,
      Number(yearsWorked),
      Number(age),
      retirementAge,
      { g_w: gw, credit_rate: cr } // <-- pass growth/credit here
    );

    const p2 = computePillar2(
      Number(monthlyWage),
      socialAvg,
      Number(yearsWorked),
      Number(age),
      retirementAge,
      pillar2Level || "none",
      { g_w: gw, credit_rate: 0 } // show “无收益/不复利”
    );

    // Pillar 3 缺口与月存
    const gapObj = computePillar3Gap(
      Number(monthlyWage),
      Number(age),
      retirementAge,
      p1.total,
      p2.monthly,
      {
        g_w: gw,
        inf: Number(inflation) / 100,
        targetReplacement: Number(targetReplacement) / 100,
        annuityDivisor: Number(annuityDivisor),
      }
    );

    const computed = {
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

    // optional quick sanity log
    console.log("DEBUG", {
      gw,
      cr,
      p1_pooling: p1.pooling.toFixed(2),
      p1_individual: p1.individual.toFixed(2),
      p2_monthly: p2.monthly.toFixed(2),
    });
  }

  const currentMonthly =
    (result?.p1?.total || 0) + (result?.p2?.monthly || 0);

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
                        中国养老金由三大支柱构成：
                        <strong>第一支柱（社保）</strong>、
                        <strong>第二支柱（企业/职业年金）</strong>、
                        <strong>第三支柱（个人储蓄）</strong>。
                      </p>

                      <p className="text-xs text-[#AAA] mt-2">
                        注：我们默认你从参加工作当年开始正常缴纳养老保险（无断缴）。
                      </p>

                      <p className="mt-3 font-medium text-[#444]">
                        ▸ 第一支柱 = 统筹养老金 + 个人账户养老金
                      </p>
                      <p className="mt-1">
                        统筹养老金（基础养老金）按国家公式：
                        <br />(<code>缴费指数 × 社平工资 + 社平工资</code>) ÷ 2
                        × 缴费年限 × 1%。
                      </p>
                      <p>
                        个人账户养老金 = 个人账户累计余额 ÷<code>计发月数</code>
                        （退休年龄决定，如60岁≈139）。
                      </p>

                      <p className="mt-3 font-medium text-[#444]">
                        ▸ 第二支柱（企业/职业年金）
                      </p>
                      <p>
                        若单位为你缴纳企业/职业年金，则按工资的一定比例（如 3% /
                        6% / 10%） 按月计入你的年金账户。
                      </p>
                      <p>
                        企业年金月养老金 = 年金账户累计余额 ÷
                        <code>计发月数</code>。
                      </p>

                      <p className="mt-3 font-medium text-[#444]">
                        ▸ 第三支柱（个人自助退休储蓄）
                      </p>
                      <p>
                        我们按世界银行建议，退休后维持退休前约
                        <strong> {targetReplacement}% </strong>的收入替代率。
                      </p>

                      <p className="mt-3">
                        <strong>差额</strong> = 目标退休收入 −（第一支柱 +
                        第二支柱）
                      </p>
                      <p>
                        <strong>月存额</strong> = 差额 × 计发月数 ÷ 距离退休月数
                      </p>

                      <p className="text-xs text-[#AAA] mt-3">
                        注：所有金额均为“以今天购买力计”，未考虑理财或投资收益，旨在给出
                        <strong>保守且直观</strong>的参考值。
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

        {/* --------- LANDING --------- */}
        {view === "landing" && (
          <>
            <DidYouKnowCarousel items={didYouKnow} />

            <h1 className="text-xl font-semibold mt-6">
              60岁的你，会过怎样的生活？
            </h1>
            <p className="text-sm text-[#999] mt-2">
              退休不是很远，是每天都在靠近。
            </p>

            <div className="mt-8">
              <button
                onClick={() => setView("input")}
                className="w-full bg-[#FF4D6A] text-white py-3 rounded-full font-semibold hover:opacity-95 transition"
              >
                来算算你的未来的养老金
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
                {showMethod ? "收起计算规则" : "计算规则 · 展开更多"}
              </button>

              <AnimatePresence>
                {showMethod && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-[13px] text-[#666] mt-3 leading-relaxed bg-[#FAFAFA] p-4 rounded-xl border border-[#EEE] text-left"
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
                        placeholder={`默认 ${
                          socialAvg ? Math.round(socialAvg) : "未选择"
                        }`}
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
            </div>

            <h2 className="text-sm text-center text-[#999]">
              你当前所在的城市
            </h2>
            <select
              className="w-full border border-[#E5E5E5] rounded-lg px-4 py-3 pr-8 text-left bg-white"
              value={city}
              onChange={(e) => setCity(e.target.value)}
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
              <option value="none">没有企业年金</option>
              <option value="basic">有，但比较少</option>
              <option value="standard">一般水平（多数大厂 / 外企）</option>
              <option value="generous">福利较好（银行 / 保险 / 中央国企）</option>
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

            <AnimatePresence initial={false}>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden mt-3 bg-white rounded-xl border border-[#EEE]"
                >
                  <div className="flex justify-between items-center px-3 py-3 border-b border-[#F3F3F3]">
                    <span className="text-sm text-[#333]">预期年工资增长率 (%)</span>
                    <input
                      type="number"
                      className="text-right w-16 text-sm outline-none"
                      value={wageGrowth}
                      onChange={(e) => setWageGrowth(Number(e.target.value))}
                    />
                  </div>

                  <div className="flex justify-between items-center px-3 py-3 border-b border-[#F3F3F3]">
                    <span className="text-sm text-[#333]">预期年通胀率 (%)</span>
                    <input
                      type="number"
                      className="text-right w-16 text-sm outline-none"
                      value={inflation}
                      onChange={(e) => setInflation(Number(e.target.value))}
                    />
                  </div>

                  <div className="flex justify-between items-center px-3 py-3 border-b border-[#F3F3F3]">
                    <span className="text-sm text-[#333]">预期第一支柱 年投资收益率(%)</span>
                    <input type="number" className="text-right w-16 text-sm outline-none" value={2.75} disabled />
                  </div>

                  <div className="flex justify-between items-center px-3 py-3 border-b border-[#F3F3F3]">
                    <span className="text-sm text-[#333]">所在城市平均月工资</span>
                    <input
                      className="text-right w-20 text-sm outline-none"
                      placeholder={`默认 ${socialAvg ? Math.round(socialAvg) : "未选择"}`}
                      value={customSocialAvg}
                      onChange={(e) => setCustomSocialAvg(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-between items-center px-3 py-3 border-b border-[#F3F3F3]">
                    <span className="text-sm text-[#333]">理想替代率 (%)</span>
                    <input
                      type="number"
                      className="text-right w-16 text-sm outline-none"
                      value={targetReplacement}
                      onChange={(e) => setTargetReplacement(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-between items-center px-3 py-3">
                    <span className="text-sm text-[#333]">社保缴纳比例 (%)</span>
                    <input type="number" className="text-right w-16 text-sm outline-none" value={8} disabled />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-3">
              <button
                className="w-full bg-[#F2F2F2] text-[#333] py-3 rounded-full font-semibold hover:opacity-95 transition"
                onClick={() => setView("landing")}
              >
                返回
              </button>
              <button
                className="w-full bg-[#FF4D6A] text-white py-3 rounded-full font-semibold hover:opacity-95 transition"
                onClick={doCalc}
              >
                查看计算结果
              </button>
            </div>
          </motion.div>
        )}

        {/* --------- RESULT --------- */}
        {view === "result" && result && (
          <>
            {/* 倒计时条：现在只在结果页显示 */}
            {Number.isFinite(Number(age)) &&
              Number(retirementAge) > Number(age) && (
                <UrgencyStrip age={age} retirementAge={retirementAge} />
              )}

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

            <GapHeatbar value={result.p3.gap} max={20000} />

            <div className="mt-6 bg-[#FFF5F7] p-5 rounded-xl text-left">
              <p className="text-sm">
                要维持“正常生活”（约 {Number(targetReplacement).toFixed(0)}% 收入替代）
              </p>

              {result.p3.gap > 0 ? (
                <>
                  <p className="text-2xl font-bold text-[#FF4D6A] mt-2 text-center">
                    还差 {result.p3.gap.toFixed(0)} 元 / 月
                  </p>

                  <p className="text-sm text-[#666] mt-4">我们帮你算好了：</p>
                  <p className="text-lg font-semibold mt-1 text-center">
                    每月存{" "}
                    <span className="text-[#FF4D6A] font-bold">
                      {result.p3.monthlySaving.toFixed(0)}
                    </span>{" "}
                    元就能补上差距
                  </p>

                  <button
                    onClick={() => setShowTaxInfo(true)}
                    className="text-sm text-[#FF4D6A] font-medium mt-3 underline underline-offset-4"
                  >
                    当年可少交税 ≈ {result.p3.taxSaving.toFixed(0)} 元（怎么算？）
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

            <PathCompare
              currentMonthly={currentMonthly}
              targetMonthly={result.p3.targetReal}
            />

            {/* Sticky CTA */}
            <StickyCTA
              visible
              saving={result.p3.monthlySaving || 0}
              tax={result.p3.taxSaving || 0}
              onClick={() => setView("input")}
            />
          </>
        )}

        {/* ----- TAX MODAL ----- */}
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
                <h3 className="text-lg font-semibold">“少交税 ≈ XXX 元”怎么算？</h3>
                <ol className="mt-3 text-sm text-[#555] list-decimal pl-4 space-y-2">
                  <li>
                    假设你每月按<span className="font-medium">税延养老</span>
                    或类似合规方式存入
                    <span className="font-medium">可税前扣除</span>的金额。
                  </li>
                  <li>
                    我们按<strong>年扣除限额 12,000 元</strong>进行估算（保守且通用）。
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
