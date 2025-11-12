"use client";
import { useEffect, useRef, useState, startTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  computePillar1,
  computePillar2,
  computePillar3Gap,
  projectMonthlyPayout,
} from "@/lib/pension";
import wageData from "./wage.json";
import didYouKnowData from "./didYouKnow.json";

// ---------------------- Utils & Data ----------------------
const PROVINCES = wageData.map((d) => d.province);
function getSocialAvg(province) {
  const found = wageData.find((d) => d.province === province);
  return found ? Number(found.avg_wage_all) : null;
}
function computeTaxSaving(monthlySaving, marginalRate = 0.1) {
  const annual = monthlySaving * 12;
  const deductible = Math.min(annual, 12000);
  return deductible * marginalRate;
}

// ---------------------- Small UI Atoms ----------------------
function DidYouKnowCarousel({ items = [] }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!items.length) return;
    timerRef.current = setInterval(
      () => setIdx((i) => (i + 1) % items.length),
      3600
    );
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

function AccordionSection({ title, children, defaultOpen = false, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-[#EEE] bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-medium text-[#333] flex items-center gap-2">
          {title}
          {badge && (
            <span className="text-[10px] rounded-full bg-[#F5F5F5] px-2 py-0.5 text-[#777]">
              {badge}
            </span>
          )}
        </span>
        <svg
          className={`h-4 w-4 text-[#999] transition-transform ${
            open ? "rotate-180" : "rotate-0"
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4 text-[13px] text-[#555]"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GapBar({ current = 0, target = 0, mode = "amount" }) {
  const [hover, setHover] = useState(false);
  const safeTarget = Math.max(target, 0.0001);
  const pct = Math.min(1, Math.max(0, current / safeTarget));
  const gap = Math.max(0, safeTarget - current);
  const centerLabel =
    mode === "percent"
      ? `${Math.round(pct * 100)}%`
      : `¥${Math.round(current)} / ¥${Math.round(safeTarget)}`;
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-[#666] mb-1">
        <span>退休准备进度</span>
        <span>{Math.round(pct * 100)}%</span>
      </div>
      <div
        className="relative h-4 rounded-full bg-[#F2F2F2] overflow-hidden"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-[#FF9AAE] to-[#FF4D6A]"
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.6 }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[11px] text-white font-medium pointer-events-none">
          {centerLabel}
        </div>
        <AnimatePresence>
          {hover && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute left-1/2 top-full z-10 mt-2 w-max -translate-x-1/2 rounded-lg border border-[#EEE] bg-white px-3 py-2 text-[12px] text-[#444] shadow"
            >
              <div>
                预计可领：<strong>¥{Math.round(current)}</strong>
              </div>
              <div>
                目标水平：<strong>¥{Math.round(safeTarget)}</strong>
              </div>
              <div>
                当前差距：<strong>¥{Math.round(gap)}</strong>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PathCompare({ currentMonthly = 0, targetMonthly = 0 }) {
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

function EarlyStartCompare({ monthsLeft, gap, annuityDivisor, monthlySaving }) {
  if (monthsLeft <= 0 || gap <= 0) return null;
  const earlyMonths = monthsLeft + 60; // 提前5年
  const earlyMonthlySaving = (gap * Number(annuityDivisor)) / earlyMonths;
  const reduction = monthlySaving - earlyMonthlySaving;
  const reductionPct = reduction / monthlySaving;
  return (
    <div className="rounded-xl bg-[#EAFBF3] border border-[#C6EBD8] p-4 text-left">
      <p className="text-sm font-medium text-[#2A7259]">
        其实现在开始，还来得及很多 🌱
      </p>
      <p className="mt-2 text-[13px] text-[#4A4A4A] leading-relaxed">
        若<strong>提前 5 年</strong>开始同样规划，你每月需要存的金额将从
        <strong> ¥{Math.round(monthlySaving)}</strong> 降至
        <strong> ¥{Math.round(earlyMonthlySaving)}</strong>，约减少{" "}
        <strong>{Math.round(reductionPct * 100)}%</strong>。
      </p>
    </div>
  );
}

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

// ---------------------- Page Component ----------------------
export default function Home() {
  // views
  const [view, setView] = useState("landing"); // 'landing' | 'input' | 'result'

  // toggles
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMethod, setShowMethod] = useState(false);

  // inputs
  const [city, setCity] = useState("");
  const [pillar2Level, setPillar2Level] = useState("none");
  const [monthlyWage, setMonthlyWage] = useState("");
  const [age, setAge] = useState("");
  const [yearsWorked, setYearsWorked] = useState("");

  // assumptions
  const [targetReplacement, setTargetReplacement] = useState(70);
  const [preRetRealReturn, setPreRetRealReturn] = useState(0);
  const [wageGrowth, setWageGrowth] = useState(3);
  const [inflation, setInflation] = useState(2.25);
  const [annuityDivisor, setAnnuityDivisor] = useState(139);
  const [taxRate, setTaxRate] = useState(10);
  const [customSocialAvg, setCustomSocialAvg] = useState("");
  const [didYouKnow, setDidYouKnow] = useState([]);

  // derived
  const retirementAge = 60;
  const socialAvg =
    customSocialAvg !== "" ? Number(customSocialAvg) : getSocialAvg(city) || 0;
  const [result, setResult] = useState(null);

  // progress label mode
  const [progressMode, setProgressMode] = useState("amount"); // 'amount'|'percent'

  // init did-you-know items
  useEffect(() => {
    startTransition(() => setDidYouKnow([...didYouKnowData]));
  }, []);

  function doCalc() {
    if (!monthlyWage || !age || !yearsWorked) return;

    const gw = Number(wageGrowth) / 100;
    // const cr = Number(preRetRealReturn) / 100 || 0; // reserved if adding crediting

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

    setResult(computed);
    setView("result");
  }

  const currentMonthly = (result?.p1?.total || 0) + (result?.p2?.monthly || 0);
  const kpiColor = (ok) => (ok ? "text-[#2A7259]" : "text-[#FF4D6A]");

  return (
    <div className="min-h-screen flex justify-center items-center bg-white">
      <div className="w-full max-w-[460px] px-6 text-center text-[#333] pb-28">
        {/* --------- LANDING --------- */}
        {view === "landing" && (
          <>
            <DidYouKnowCarousel items={didYouKnow} />

            <p className="mt-2 text-[12px] text-[#666]">
              个人养老金（第三支柱）：税优账户、长期复利、专为退休。
              <button
                onClick={() => setShowMethod(true)}
                className="ml-1 underline underline-offset-2 text-[#FF4D6A]"
              >
                了解详情
              </button>
            </p>

            <h1 className="text-xl font-semibold mt-6">
              60岁的你，会过怎样的生活？
            </h1>
            <p className="text-sm text-[#999] mt-2">
              我们用最少输入，给你一个清晰的退休图景。
            </p>

            <div className="mt-8">
              <button
                onClick={() => setView("input")}
                className="w-full bg-[#FF4D6A] text-white py-3 rounded-full font-semibold hover:opacity-95 transition"
              >
                来算算你的未来的养老金
              </button>
            </div>
          </>
        )}

        {/* --------- INPUT --------- */}
        {view === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 space-y-4 text-left"
          >
            {/* 规则（折叠，默认收起） */}
            <div className="text-center">
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
                    className="text-[13px] text-[#666] mt-3 leading-relaxed bg-[#FAFAFA] p-4 rounded-xl border border-[#EEE] text-left"
                  >
                    <p>
                      我们按世界银行建议，退休后维持退休前约{" "}
                      <strong>{targetReplacement}%</strong>{" "}
                      的收入替代率。中国养老金由三大支柱构成：
                      <strong> 第一支柱（社保）</strong>、
                      <strong> 第二支柱（企业/职业年金）</strong>、
                      <strong> 第三支柱（个人养老金）</strong>。
                    </p>
                    <p className="mt-2 text-[12px] text-[#999]">
                      注：本工具以“今天购买力”口径演示，旨在直观、保守地说明缺口与补齐方案。
                    </p>
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
              <option value="generous">
                福利较好（银行 / 保险 / 中央国企）
              </option>
            </select>

            {/* 可选项（折叠，默认收起） */}
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
                      退休折算除数（计发月数）
                    </span>
                    <input
                      type="number"
                      className="text-right w-16 text-sm outline-none"
                      value={annuityDivisor}
                      onChange={(e) =>
                        setAnnuityDivisor(Number(e.target.value) || 139)
                      }
                    />
                  </div>

                  <div className="flex justify-between items-center px-3 py-3 border-b border-[#F3F3F3]">
                    <span className="text-sm text-[#333]">
                      所在城市平均月工资
                    </span>
                    <input
                      className="text-right w-24 text-sm outline-none"
                      placeholder={`默认 ${
                        socialAvg ? Math.round(socialAvg) : "未选择"
                      }`}
                      value={customSocialAvg}
                      onChange={(e) => setCustomSocialAvg(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col px-3 py-3 border-b border-[#F3F3F3]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-[#333]">
                        理想替代率 (%)
                      </span>
                      <input
                        type="number"
                        className="text-right w-16 text-sm outline-none"
                        value={targetReplacement}
                        onChange={(e) =>
                          setTargetReplacement(Number(e.target.value))
                        }
                      />
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={100}
                      step={5}
                      value={targetReplacement}
                      onChange={(e) =>
                        setTargetReplacement(Number(e.target.value))
                      }
                      className="w-full accent-[#FF4D6A]"
                    />
                    <p className="text-[11px] text-[#999] mt-1">
                      70%为世界银行建议标准，可上调以追求更高品质生活。
                    </p>
                  </div>

                  <div className="flex justify-between items-center px-3 py-3">
                    <span className="text-sm text-[#333]">边际税率(%)</span>
                    <input
                      type="number"
                      className="text-right w-16 text-sm outline-none"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                    />
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

        {view === "result" && result && (
          <>
            {/* ===== iOS-style spacing container ===== */}
            <section className="mt-8 text-left space-y-6">
              {/* 1) Ready + Gap (primary card) */}
              <div className="rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)] p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-[15px] font-semibold text-[#111]">
                    你的退休准备
                  </h2>
                  {result.p3.gap <= 0 ? (
                    <span className="text-[11px] px-2 py-1 rounded-full bg-[#EEFFF6] text-[#1B7A55]">
                      已准备好
                    </span>
                  ) : (
                    <span className="text-[11px] px-2 py-1 rounded-full bg-[#FFF2F2] text-[#B22525]">
                      未达标
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-[#FAFAFA] p-4">
                    <p className="text-[12px] text-[#8B8B8B]">按今天价格估算</p>
                    <p className="mt-1 text-[28px] leading-none font-extrabold text-[#222]">
                      ¥{Math.round(result.p1.total + result.p2.monthly)}{" "}
                      <span className="text-[14px] font-semibold">/ 月</span>
                    </p>
                    <p className="mt-1 text-[12px] text-[#9B9B9B]">
                      （第一支柱 + 第二支柱）
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#FAFAFA] p-4">
                    <p className="text-[12px] text-[#8B8B8B]">
                      目标（{Number(targetReplacement).toFixed(0)}% 收入替代率）
                    </p>
                    <p className="mt-1 text-[28px] leading-none font-extrabold text-[#222]">
                      ¥{Math.round(result.p3.targetReal)}{" "}
                      <span className="text-[14px] font-semibold">/ 月</span>
                    </p>
                    <p className="mt-1 text-[12px] text-[#9B9B9B]">
                      以今天价格计
                    </p>
                  </div>
                </div>

                {result.p3.gap > 0 ? (
                  <div className="mt-4 rounded-xl bg-[#FFF7F8] p-4">
                    <p className="text-[13px] text-[#6B2C2C]">
                      要达到目标，你还需弥补：
                    </p>
                    <p className="mt-1 text-[24px] font-extrabold text-[#C03737]">
                      ¥{result.p3.gap.toFixed(0)}{" "}
                      <span className="text-[13px] font-semibold">/ 月</span>
                    </p>
                    {/* gentle urgency (one-year delay) */}
                    {(() => {
                      const monthsLeft = Math.max(
                        1,
                        (60 - Number(age || 0)) * 12
                      );
                      const later =
                        (result.p3.gap * Number(annuityDivisor)) /
                        Math.max(1, monthsLeft - 12);
                      return (
                        <p className="mt-2 text-[12px] text-[#8A3B3B]">
                          若<strong>再晚一年</strong>开始，每年需要的储蓄会从{" "}
                          <strong>
                            ¥{Math.round(result.p3.monthlySaving * 12)}
                          </strong>{" "}
                          提升至 <strong>¥{Math.round(later * 12)}</strong>。
                        </p>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl bg-[#F5FFFB] p-4 text-[#1F6E52] text-[13px]">
                    👍 已达到/超过目标，保持当前节奏即可。
                  </div>
                )}

                {/* progress bar (compact) */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-medium text-[#222]">
                      差距进度
                    </span>
                  </div>
                  <GapBar
                    current={result.p1.total + result.p2.monthly}
                    target={result.p3.targetReal}
                    mode="percent"
                  />
                </div>
              </div>

              {/* 2) 同额月存：定存2.5% vs 组合6% */}
              {result.p3.gap > 0 && (
                <div className="rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)] p-5">
                  {(() => {
                    const yearsLeft = Math.max(0, 60 - Number(age || 0));
                    const pmt = result.p3.monthlySaving;
                    const payout2p5 = projectMonthlyPayout({
                      monthlySaving: pmt,
                      yearsToRetire: yearsLeft,
                      realReturn: 0.025,
                      annuityDivisor,
                    });
                    const payout6 = projectMonthlyPayout({
                      monthlySaving: pmt,
                      yearsToRetire: yearsLeft,
                      realReturn: 0.06,
                      annuityDivisor,
                    });
                    return (
                      <>
                        <p className="text-[15px] font-semibold text-[#111]">
                          同样每月存 {Math.round(pmt)}{" "}
                          元，退休时可领（今天价格）
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div className="rounded-xl bg-[#FAFAFA] p-4">
                            <p className="text-[12px] text-[#8B8B8B]">
                              定存（约 2.5%）
                            </p>
                            <p className="mt-1 text-[22px] font-bold text-[#222]">
                              ≈ ¥{Math.round(payout2p5)}{" "}
                              <span className="text-[12px] font-semibold">
                                / 月
                              </span>
                            </p>
                          </div>
                          <div className="rounded-xl bg-[#FAFAFA] p-4">
                            <p className="text-[12px] text-[#8B8B8B]">
                              投资组合（约 6%）
                            </p>
                            <p className="mt-1 text-[22px] font-bold text-[#FF3B57]">
                              ≈ ¥{Math.round(payout6)}{" "}
                              <span className="text-[12px] font-semibold">
                                / 月
                              </span>
                            </p>
                          </div>
                        </div>
                        <p className="mt-2 text-[11px] text-[#9B9B9B]">
                          教育演示：长期年化假设，非承诺；统一以今天价格计。
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* 3) 同样 6%：30/40/50 起投差别 */}
              {result.p3.gap > 0 && (
                <div className="rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)] p-5">
                  {(() => {
                    const pmt = result.p3.monthlySaving;
                    const rows = [30, 40, 50].map((sa) => {
                      const years = Math.max(0, 60 - sa);
                      const payout = projectMonthlyPayout({
                        monthlySaving: pmt,
                        yearsToRetire: years,
                        realReturn: 0.06,
                        annuityDivisor,
                      });
                      return { age: sa, years, payout };
                    });
                    return (
                      <>
                        <p className="text-[15px] font-semibold text-[#111]">
                          同样按 6% 收益，不同起投年龄
                        </p>
                        <div className="mt-3 grid grid-cols-3 gap-3">
                          {rows.map((r) => (
                            <div
                              key={r.age}
                              className="rounded-xl bg-[#FAFAFA] p-4"
                            >
                              <p className="text-[12px] text-[#8B8B8B]">
                                {r.age} 岁开始
                              </p>
                              <p className="mt-1 text-[18px] font-semibold text-[#222]">
                                ≈ ¥{Math.round(r.payout)}
                              </p>
                              <p className="text-[11px] text-[#9B9B9B]">
                                {r.years} 年复利
                              </p>
                            </div>
                          ))}
                        </div>
                        <p className="mt-2 text-[11px] text-[#9B9B9B]">
                          越早开始，同额月存换来的退休月领越高（演示口径）。
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* 4) 行动：养老 FOF */}
              {result.p3.gap > 0 && (
                <div className="rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)] p-5">
                  <p className="text-[15px] font-semibold text-[#111]">
                    把计划落地（养老 FOF）
                  </p>
                  <p className="mt-2 text-[13px] text-[#444]">
                    从<strong>本月</strong>开始，目标年度储蓄：
                    <strong>
                      {" "}
                      ¥{Math.round(result.p3.monthlySaving * 12)}
                    </strong>
                    。 通过个人养老金账户定投<strong>养老目标（FOF）</strong>
                    ，长期持有。 当年预计少交税 ≈{" "}
                    <strong>¥{result.p3.taxSaving.toFixed(0)}</strong>。
                  </p>
                  <div className="mt-3 flex gap-8">
                    <button
                      onClick={() => setView("input")}
                      className="rounded-full px-5 py-2 text-[14px] font-semibold text-white bg-[#FF3B57] shadow hover:opacity-95"
                    >
                      现在制定我的 FOF 计划
                    </button>
                    <button
                      onClick={() =>
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }
                      className="text-[14px] font-semibold text-[#333]"
                    >
                      修改参数
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* bottom safe area for sticky */}
            <div className="h-28" />
            {/* <StickyCTA
              visible
              saving={result.p3.monthlySaving || 0}
              tax={result.p3.taxSaving || 0}
              onClick={() => setView("input")}
            /> */}
          </>
        )}
      </div>
    </div>
  );
}
