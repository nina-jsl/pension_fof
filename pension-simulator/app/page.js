"use client";
// ---------------------- Imports ----------------------
import { useEffect, useState, startTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  computePillar1,
  computePillar2,
  computePillar3Gap,
  projectMonthlyPayout,
} from "@/lib/pension";
import wageData from "./wage.json";
import didYouKnowData from "./didYouKnow.json";
import DidYouKnowCarousel from "@/components/UI/DidYouKnowCarousel";
import AppleBarCompare from "@/components/Charts/AppleBarCompare";
import GapBar from "@/components/UI/GapBar";
import EarlyStartBarChart from "@/components/Charts/EarlyStartBarChart";
import TooltipModal from "@/components/UI/TooltipModal";
import TaxBenefitChart from "@/components/Charts/TaxBenefitChart";
import NextStepGuide from "@/components/UI/NextStepGuide";

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

    const wage = Number(monthlyWage);
    const ageNum = Number(age);
    const years = Number(yearsWorked);

    const gw = Number(wageGrowth) / 100; // 工资增速 g_w
    const inf = Number(inflation) / 100; // 通胀
    const targetRep = Number(targetReplacement) / 100;
    const divisor = Number(annuityDivisor) || 139;

    // 如果你有“退休前预期收益率”之类的输入，可以用它当作 credit_rate
    // 否则就让它走默认值（在 lib 里是 0.0275）
    const creditRate =
      preRetRealReturn !== undefined && preRetRealReturn !== null
        ? Number(preRetRealReturn) / 100
        : undefined;

    // --- Pillar 1: 基础养老金 + 个人账户（过去 + 未来） ---
    const p1 = computePillar1(wage, socialAvg, years, ageNum, retirementAge, {
      g_w: gw,
      inf,
      ...(creditRate !== undefined ? { credit_rate: creditRate } : {}),
    });

    // --- Pillar 2: 企业年金（过去 + 未来） ---
    const p2 = computePillar2(
      wage,
      socialAvg,
      years,
      ageNum,
      retirementAge,
      pillar2Level,
      {
        g_w: gw,
        inf,
        ...(creditRate !== undefined ? { credit_rate: creditRate } : {}),
      }
    );

    // --- Pillar 3: 缺口 + 建议每月储蓄 ---
    const gapObj = computePillar3Gap(
      wage,
      ageNum,
      retirementAge,
      p1.total, // 已经是“今天价格”的月养老金
      p2.monthly, // 同上
      {
        g_w: gw,
        inf,
        targetReplacement: targetRep,
        annuityDivisor: divisor,
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

  const DEMO_CONTRIBUTION = 1000; // 每月示例储蓄金额

  let early30 = 0;
  let early40 = 0;
  let early50 = 0;
  let rate25 = 0;
  let rate6 = 0;

  if (view === "result" && result) {
    // 当前用户年龄与退休年龄
    const yearsLeft = Math.max(0, retirementAge - Number(age));

    // A. 收益率差异（定存 vs 组合）
    rate25 = projectMonthlyPayout({
      monthlySaving: DEMO_CONTRIBUTION,
      yearsToRetire: yearsLeft,
      realReturn: 0.025,
      annuityDivisor,
    });

    rate6 = projectMonthlyPayout({
      monthlySaving: DEMO_CONTRIBUTION,
      yearsToRetire: yearsLeft,
      realReturn: 0.06,
      annuityDivisor,
    });

    // B. 不同起投年龄
    early30 = projectMonthlyPayout({
      monthlySaving: DEMO_CONTRIBUTION,
      yearsToRetire: retirementAge - 30,
      realReturn: 0.06,
      annuityDivisor,
    });

    early40 = projectMonthlyPayout({
      monthlySaving: DEMO_CONTRIBUTION,
      yearsToRetire: retirementAge - 40,
      realReturn: 0.06,
      annuityDivisor,
    });

    early50 = projectMonthlyPayout({
      monthlySaving: DEMO_CONTRIBUTION,
      yearsToRetire: retirementAge - 50,
      realReturn: 0.06,
      annuityDivisor,
    });
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-white">
      <div className="w-full max-w-[460px] px-6 text-center text-[#333] pb-28">
        {/* --------- LANDING --------- */}
        {view === "landing" && (
          <>
            <DidYouKnowCarousel items={didYouKnow} />

            <h1 className="text-xl font-semibold mt-6">
              60岁的你，会过怎样的生活？
            </h1>
            <p className="text-sm text-[#999] mt-2">
              我们用最少输入，给你一个清晰的退休图景。
            </p>

            <div className="mt-8">
              <button
                onClick={() => setView("input")}
                className="w-full bg-[#0092f9] text-white py-3 rounded-full font-semibold hover:opacity-95 transition"
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
              className="w-full border border-[#E5E5E5] rounded-lg px-4 py-3 text-left text-[15px] focus:outline-none focus:ring-1 focus:ring-[#0092f9]"
              placeholder="月薪（元）"
              value={monthlyWage}
              onChange={(e) => setMonthlyWage(e.target.value)}
            />

            <input
              className="w-full border border-[#E5E5E5] rounded-lg px-4 py-3 text-left text-[15px] focus:outline-none focus:ring-1 focus:ring-[#0092f9]"
              placeholder="年龄"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />

            <input
              className="w-full border border-[#E5E5E5] rounded-lg px-4 py-3 text-left text-[15px] focus:outline-none focus:ring-1 focus:ring-[#0092f9]"
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
                      退休折算除数(计发月数)
                      <TooltipModal type="annuity" />
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
                      className="w-full accent-[#0092f9]"
                    />
                    <p className="text-[11px] text-[#999] mt-1">
                      70%为世界银行建议标准，可上调以追求更高品质生活。
                    </p>
                  </div>

                  {/* <div className="flex justify-between items-center px-3 py-3">
                    <span className="text-sm text-[#333]">边际税率(%)</span>
                    <input
                      type="number"
                      className="text-right w-16 text-sm outline-none"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                    />
                  </div> */}
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
                className="w-full bg-[#0092f9] text-white py-3 rounded-full font-semibold hover:opacity-95 transition"
                onClick={doCalc}
              >
                查看计算结果
              </button>
            </div>
          </motion.div>
        )}

        {view === "result" && result && (
          <>
            <section className="mt-8 text-left space-y-6">
              <div className="relative rounded-2xl border border-[#0092f9]/10 bg-[#F9FBFF] p-4 shadow-sm">
                <div
                  className="absolute -top-2 left-4 bg-[#0092f9]/5 text-[#0092f9] 
       text-[11px] px-2 py-0.5 rounded-full font-medium shadow"
                >
                  提醒
                </div>

                <p className="text-[14px] font-semibold text-[#1A2B4A] leading-relaxed pt-2">
                  很多人以为“退休的事以后再说”，或觉得“有社保就够了”。
                </p>

                <p className="mt-2 text-[13px] text-[#3B4D6A] leading-relaxed">
                  但真正决定你未来生活质量的，是你以为能领到的金额，
                  和你实际能领到的金额之间的差距。
                </p>

                <p className="mt-2 text-[13px] text-[#3B4D6A] leading-relaxed">
                  我们先根据你的情况快速测算，看看你60岁时的“真实数字”是多少。
                </p>
              </div>

              {/* 2) 实际 vs 目标 ———— Real Shock Card */}
              <div className="rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)] p-5">
                <h2 className="text-[15px] font-semibold text-[#111] mb-3">
                  你的真实退休收入（按今天购买力）
                </h2>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-[#FAFAFA] p-4">
                    <p className="text-[12px] text-[#8B8B8B]">你可以领到</p>
                    <p className="mt-1 text-[28px] leading-none font-extrabold text-[#222]">
                      ¥{Math.round(result.p1.total + result.p2.monthly)}
                      <span className="text-[14px] font-semibold">/ 月</span>
                    </p>
                    <p className="mt-1 text-[12px] text-[#9B9B9B]">
                      (第一支柱 + 第二支柱)
                      <TooltipModal type="pillar1n2" />
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#FAFAFA] p-4">
                    <p className="text-[12px] text-[#8B8B8B]">
                      目标({Number(targetReplacement)}% 收入替代率)
                      <TooltipModal type="replacement" />
                    </p>
                    <p className="mt-1 text-[28px] leading-none font-extrabold text-[#222]">
                      ¥{Math.round(result.p3.targetReal)}
                      <span className="text-[14px] font-semibold">/ 月</span>
                    </p>
                    <p className="mt-1 text-[12px] text-[#9B9B9B]">
                      按今天购买力
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <GapBar
                    current={result.p1.total + result.p2.monthly}
                    target={result.p3.targetReal}
                    mode="percent"
                  />
                </div>
              </div>

              {/* 3) 为什么会差这么多 ———— Misperception Fix */}
              <div className="rounded-xl bg-white border border-[#EEE] p-5">
                <h3 className="text-[15px] font-semibold text-[#111] mb-2">
                  为什么会有这么大的差距？
                </h3>
                <div className="rounded-xl text-[13px] text-[#444] leading-relaxed">
                  退休金之所以不够，是因为我们想象中的收入曲线和养老金的积累方式并不一致。职场中工资增长快，消费水平也不断提高，但社保养老金属于基础保障，个人账户和企业年金的积累速度都比较慢。再加上大多数年轻人低估了退休后的生活成本，自然会形成一段让人意外的差距。
                </div>
              </div>

              {/* 4) 第三支柱缺口 ———— Core Gap Section */}
              <div className="rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)] p-5">
                <h2 className="text-[15px] font-semibold text-[#111]">
                  你的第三支柱缺口
                  <TooltipModal type="pillar3" />
                </h2>

                {result.p3.gap > 0 ? (
                  <>
                    <div className="mt-3">
                      <p className="text-[12px] text-[#21292e]">
                        退休后每月还差
                      </p>
                      <p className="text-[26px] font-bold text-[#0092f9] leading-tight">
                        ¥{Math.round(result.p3.gap)}
                        <span className="text-[13px] font-semibold">/ 月</span>
                      </p>
                    </div>

                    <div className="mt-3">
                      <p className="text-[12px] text-[#21292e]">
                        若现在开始，应每月储蓄
                      </p>
                      <p className="text-[22px] font-bold text-[#0092f9]">
                        ¥{Math.round(result.p3.monthlySaving)}
                        <span className="text-[13px] font-semibold">/ 月</span>
                      </p>
                    </div>

                    <p className="mt-2 text-[12px] text-[#00458a]">
                      再晚一年开始，你需要的年储蓄将增加明显。
                    </p>
                  </>
                ) : (
                  <div className="mt-3 rounded-xl bg-[#EEFFF6] p-4 text-[#1B7A55] text-[13px]">
                    👍 你的退休收入已经达到目标。
                  </div>
                )}
              </div>

              {/* 5) 早 vs 晚 + 稳健 vs 组合 ———— Behavior + Product Insight */}
              <div className="rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)] p-5">
                <h3 className="text-[15px] font-semibold text-[#111] mb-4">
                  为什么“越早开始越轻松”？
                </h3>

                <p className="text-[12px] text-[#999] mb-2">
                  以每月储蓄 <strong>¥1,000</strong>{" "}
                  为例，在退休时你每月可领取的金额如下：
                </p>

                {/* A. 定存 vs 投资 */}
                <AppleBarCompare
                  leftLabel="定存（约 2.5%）"
                  rightLabel="投资组合（约 6%）"
                  leftValue={rate25}
                  rightValue={rate6}
                />

                <p className="mt-2 text-[12px] text-[#999]">
                  收益率越高，复利越强，未来退休时每月可领取的金额差距显著。
                </p>

                <div className="my-4 h-px bg-[#F0F0F0]" />

                <p className="text-[13px] font-medium text-[#111]">
                  若每月储蓄相同，不同年龄开始，退休时月领金额如下：
                </p>

                <EarlyStartBarChart
                  points={[
                    { label: "30岁", value: early30 },
                    { label: "40岁", value: early40 },
                    { label: "50岁", value: early50 },
                  ]}
                />

                <p className="mt-2 text-[12px] text-[#999] leading-relaxed">
                  越早开始，复利作用越强。相比 30 岁启动，50
                  岁开始的退休月领金额可能仅为其
                  <strong> {Math.round((early50 / early30) * 100)}%</strong>。
                </p>
              </div>
              <TaxBenefitChart userRate={taxRate} />

              <NextStepGuide />

              {/* 7) 收尾文案 */}
              <p className="text-center text-[12px] text-[#999] mt-6">
                退休是一场马拉松，只要现在开始，你就已经领先大多数人。
              </p>
            </section>

            <div className="h-28" />
          </>
        )}
      </div>
    </div>
  );
}
