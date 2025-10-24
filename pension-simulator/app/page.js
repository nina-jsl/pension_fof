"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";

function computeIdealCurves(age, retirementAge, targetMonthlyExpense, rateFn) {
  const start = parseInt(age);
  const retire = parseInt(retirementAge);
  const end = 85;

  // 1) 倒推出退休所需余额
  let futureNeed = 0;
  for (let y = end - retire - 1; y >= 0; y--) {
    const r = rateFn(retire + y);
    futureNeed = (futureNeed + targetMonthlyExpense * 12) / (1 + r);
  }
  const requiredAtRetirement = futureNeed;

  // 2) 退休前：倒推“理想储蓄线”（对齐到每个“年末”点）
  const idealSavings = [];
  let val = requiredAtRetirement;
 for (let y = retire - 1; y >= start + 1; y--) {
    const r = rateFn(y);
    val = val / (1 + r);           // 回滚一年，得到“该年末”需要的余额
    idealSavings.unshift({ age: y, value: val });
  }

  // 3) 退休后：理想余额线（保持不变）
  const idealBalances = [];
  let bal = requiredAtRetirement;
  for (let y = retire; y <= end; y++) {
    const r = rateFn(y);
    bal = bal * (1 + r) - targetMonthlyExpense * 12;
    idealBalances.push({ age: y, value: Math.max(bal, 0) });
  }

  return { idealSavings, idealBalances, requiredAtRetirement };
}


export default function Home() {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState("");
  const [retirementAge, setRetirementAge] = useState("65");
  const [initIncome, setInitIncome] = useState("");
  const [incomeGrowth, setIncomeGrowth] = useState("3");
  const [saveRate, setSaveRate] = useState("");
  const [inflation, setInflation] = useState("2.5");
  const [expenseRate, setExpenseRate] = useState("70");
  const [results, setResults] = useState(null);
  const [chosen, setChosen] = useState(null);

  const LINE_COLORS = {
    "定存/储蓄": "#9CA3AF",
    全部股票: "#6B7280",
    全部债券: "#A3A3A3",
    养老FOF: "#4B5563",
  };

  // ---------- Simulation ----------
  const simulateStrategyMonthly = ({
    age,
    retirementAge,
    initMonthlyIncome,
    incomeGrowthAnnual,
    saveRate,
    inflationAnnual,
    rateAnnualFn,
    crisisMonthIndex,
  }) => {
    const months = Math.max(0, (retirementAge - age) * 12);
    const g_m = Math.pow(1 + incomeGrowthAnnual, 1 / 12) - 1;
    const inf_m = Math.pow(1 + inflationAnnual, 1 / 12) - 1;

    let balance = 0;
    let monthlyIncome = initMonthlyIncome;
    let inflationIndex = 1;
    const series = [];

    for (let m = 0; m < months; m++) {
      const monthlySaving = monthlyIncome * saveRate;
      balance += monthlySaving;
      const r_annual = rateAnnualFn(m, months, age + m / 12);
      const r_m = Math.pow(1 + r_annual, 1 / 12) - 1;
      balance *= 1 + r_m;
      inflationIndex *= 1 + inf_m;

      if ((m + 1) % 12 === 0) {
        const currentAge = age + (m + 1) / 12;
        const nominal = balance;
        const real = balance / inflationIndex;
        const monthlyRetIncome = nominal / (20 * 12);
        series.push({
          yearLabel: `${Math.round(currentAge)}岁`,
          yearNum: Math.round(currentAge),
          nominal,
          real,
          monthlyRetIncome,
        });
      }
      monthlyIncome *= 1 + g_m;
    }

    const finalNominal = balance;
    const monthlyRetirementIncomeNominal = finalNominal / (20 * 12);
    const lastMonthIncome = monthlyIncome / (1 + g_m);
    const targetMonthlyExpense = lastMonthIncome * (parseFloat(expenseRate) / 100);

    const retireTo85Months = Math.max(0, (85 - retirementAge) * 12);
    const decumulationSeries = [];
    let bal = finalNominal;
    for (let m = 0; m < retireTo85Months; m++) {
      const r_annual = rateAnnualFn(months + m, months + retireTo85Months, retirementAge + m / 12);
      const r_m = Math.pow(1 + r_annual, 1 / 12) - 1;
      bal *= 1 + r_m;
      bal -= monthlyRetirementIncomeNominal;
      if ((m + 1) % 12 === 0) {
        const currentAge = retirementAge + (m + 1) / 12;
        decumulationSeries.push({
          yearLabel: `${Math.round(currentAge)}岁`,
          yearNum: Math.round(currentAge),
          balance: Math.max(bal, 0),
        });
      }
      if (bal <= 0) break;
    }

    const percent = Math.max(0, Math.min(999, (monthlyRetirementIncomeNominal / targetMonthlyExpense) * 100));

    return {
      series,
      decumulationSeries,
      finalNominal,
      monthlyRetirementIncomeNominal,
      targetMonthlyExpense,
      percent: Number(percent.toFixed(1)),
    };
  };

  const makeSimulations = () => {
    const a = parseFloat(age);
    const ra = parseFloat(retirementAge);
    const inc0 = parseFloat(initIncome);
    const g = parseFloat(incomeGrowth) / 100;
    const s = parseFloat(saveRate) / 100;
    const inf = parseFloat(inflation) / 100;
    if ([a, ra, inc0, g, s, inf].some((x) => Number.isNaN(x))) return null;
    if (ra <= a) return null;

    const months = (ra - a) * 12;
    const crisisMonthIndex = Math.max(1, Math.floor(months * 0.65));

    const strategies = [
      { name: "定存/储蓄", rateAnnualFn: () => 0.018 },
      {
        name: "全部股票",
        rateAnnualFn: (m) => (m === crisisMonthIndex ? (1 - 0.3) ** 12 - 1 : 0.07),
      },
      { name: "全部债券", rateAnnualFn: () => 0.03 },
      {
        name: "养老FOF",
        rateAnnualFn: (m, total) => {
          const start = 0.06,
            end = 0.03;
          return start + (end - start) * (m / Math.max(1, total - 1));
        },
      },
    ];

    return strategies.map((st) => ({
      name: st.name,
      ...simulateStrategyMonthly({
        age: a,
        retirementAge: ra,
        initMonthlyIncome: inc0,
        incomeGrowthAnnual: g,
        saveRate: s,
        inflationAnnual: inf,
        rateAnnualFn: st.rateAnnualFn,
        crisisMonthIndex,
      }),
    }));
  };

  const handleNext = () => {
    const res = makeSimulations();
    if (!res) {
      alert("请完整填写所有输入项");
      return;
    }
    setResults(res);
    setStep(2);
  };
  const handleChoice = (c) => {
    setChosen(c);
    setStep(3);
  };
  const handleCompare = () => setStep(4);

  const sims = useMemo(() => results || [], [results]);
  const selectedSim = useMemo(() => sims.find((x) => x.name === chosen), [sims, chosen]);

  // ---------- UI ----------
  return (
    <main className="flex flex-col items-center justify-center p-8 space-y-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">退休储蓄模拟器</h1>

      <AnimatePresence mode="wait">
        {/* STEP 1 */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl bg-white p-6 rounded-xl shadow-md"
          >
            <Input label="当前年龄" value={age} setValue={setAge} placeholder="如 30" />
            <Input label="计划退休年龄" value={retirementAge} setValue={setRetirementAge} placeholder="如 65" />
            <Input label="当前月薪 (¥)" value={initIncome} setValue={setInitIncome} placeholder="如 10000" />
            <Input label="工资年增速 (%)" value={incomeGrowth} setValue={setIncomeGrowth} placeholder="如 3" />
            <Input label="储蓄比例 (% of 月薪)" value={saveRate} setValue={setSaveRate} placeholder="如 10" />
            <Input label="年通胀率 (%)" value={inflation} setValue={setInflation} placeholder="如 2.5" />
            <div className="md:col-span-2">
              <button onClick={handleNext} className="mt-2 bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-800">
                下一步 →
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2 */}
        {step === 2 && results && (
          <motion.div
            key="step2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center space-y-4"
          >
            <h2 className="text-xl font-semibold text-gray-800">请选择想要投资的方式</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {["定存/储蓄", "全部股票", "全部债券", "养老FOF"].map((label) => (
                <button
                  key={label}
                  onClick={() => handleChoice(label)}
                  className="bg-gray-600 text-white px-5 py-2 rounded hover:bg-gray-700"
                >
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 3: 用户选择的策略 */}
        {selectedSim && step === 3 && (
          <div className="w-full max-w-3xl mt-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-700 text-center">财富积累阶段（实际储蓄 vs 理想储蓄线）</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={(() => {
                  const ideal = computeIdealCurves(age, retirementAge, selectedSim.targetMonthlyExpense, () => 0.04);
                  const data = {};
                  selectedSim.series.forEach((pt) => {
                    data[pt.yearNum] = { year: `${pt.yearNum}岁`, 实际储蓄: pt.nominal };
                  });
                  ideal.idealSavings.forEach((pt) => {
                    if (!data[pt.age]) data[pt.age] = { year: `${pt.age}岁` };
                    data[pt.age]["理想储蓄线"] = pt.value;
                  });
                  return Object.values(data).sort((a, b) => parseInt(a.year) - parseInt(b.year));
                })()}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(v) => (v >= 1e6 ? `¥${Math.round(v / 1e6)}M` : `¥${Math.round(v / 1e3)}K`)} />
                <Tooltip formatter={(v) => `¥${Math.round(v).toLocaleString()}`} />
                <Legend />
                <Line type="linear" dataKey="理想储蓄线" stroke="#D1D5DB" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Line type="linear" dataKey="实际储蓄" stroke="#4B5563" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>

            <h3 className="text-lg font-semibold text-gray-700 text-center">退休支出阶段（账户余额 vs 理想余额线）</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={(() => {
                  const ideal = computeIdealCurves(age, retirementAge, selectedSim.targetMonthlyExpense, () => 0.03);
                  const data = {};
                  ideal.idealBalances.forEach((pt) => {
                    data[pt.age] = { year: `${pt.age}岁`, 理想余额线: pt.value };
                  });
                  let balance = selectedSim.finalNominal;
                  for (let y = parseInt(retirementAge); y <= 85; y++) {
                    balance = balance * 1.03 - selectedSim.monthlyRetirementIncomeNominal;
                    data[y] = { ...data[y], 实际余额: Math.max(balance, 0), year: `${y}岁` };
                  }
                  return Object.values(data).sort((a, b) => parseInt(a.year) - parseInt(b.year));
                })()}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(v) => (v >= 1e6 ? `¥${Math.round(v / 1e6)}M` : `¥${Math.round(v / 1e3)}K`)} />
                <Tooltip formatter={(v) => `¥${Math.round(v).toLocaleString()}`} />
                <Legend />
                <Line type="linear" dataKey="理想余额线" stroke="#D1D5DB" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Line type="linear" dataKey="实际余额" stroke="#4B5563" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>

            <button onClick={handleCompare} className="bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-800 mx-auto block">
              查看所有策略对比 →
            </button>
          </div>
        )}

        {/* STEP 4: 所有策略对比 */}
        {step === 4 && results && (
          <motion.div
            key="step4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="mt-8 w-full max-w-5xl space-y-8 bg-white p-6 rounded-2xl shadow-md"
          >
            <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">策略对比：财富积累阶段 与 退休支出阶段</h2>

            {/* 财富积累阶段 */}
            <ResponsiveContainer width="100%" height={360}>
              <LineChart
                data={(() => {
                  const a = parseFloat(age);
                  const ra = parseFloat(retirementAge);
                  const targetExpense = results[0].targetMonthlyExpense;
                  const ideal = computeIdealCurves(a, ra, targetExpense, () => 0.04);
                  const byYear = {};

                  results.forEach((s) => {
                    s.series.forEach((pt) => {
                      if (!byYear[pt.yearNum]) byYear[pt.yearNum] = { year: `${pt.yearNum}岁` };
                      byYear[pt.yearNum][s.name] = pt.nominal;
                    });
                  });

                  ideal.idealSavings.forEach((pt) => {
                    if (!byYear[pt.age]) byYear[pt.age] = { year: `${pt.age}岁` };
                    byYear[pt.age]["理想储蓄线"] = pt.value;
                  });

                  return Object.values(byYear).sort((a, b) => parseInt(a.year) - parseInt(b.year));
                })()}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(v) => (v >= 1e6 ? `¥${Math.round(v / 1e6)}M` : `¥${Math.round(v / 1e3)}K`)} />
                <Tooltip formatter={(v) => `¥${Math.round(v).toLocaleString()}`} />
                <Legend />
                {Object.keys(LINE_COLORS).map((k) => (
                  <Line key={k} type="linear" dataKey={k} stroke={LINE_COLORS[k]} strokeWidth={2} dot={false} isAnimationActive={false} />
                ))}
                <Line type="linear" dataKey="理想储蓄线" stroke="#D1D5DB" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>

            {/* 退休支出阶段 */}
            <ResponsiveContainer width="100%" height={360}>
              <LineChart
                data={(() => {
                  const a = parseFloat(age);
                  const ra = parseFloat(retirementAge);
                  const targetExpense = results[0].targetMonthlyExpense;
                  const ideal = computeIdealCurves(a, ra, targetExpense, () => 0.03);
                  const byYear = {};

                  ideal.idealBalances.forEach((pt) => {
                    byYear[pt.age] = { year: `${pt.age}岁`, 理想余额线: pt.value };
                  });

                  results.forEach((s) => {
                    let balance = s.finalNominal;
                    for (let y = parseInt(retirementAge); y <= 85; y++) {
                      balance = balance * 1.03 - s.monthlyRetirementIncomeNominal;
                      if (!byYear[y]) byYear[y] = { year: `${y}岁` };
                      byYear[y][s.name] = Math.max(balance, 0);
                    }
                  });

                  return Object.values(byYear).sort((a, b) => parseInt(a.year) - parseInt(b.year));
                })()}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(v) => (v >= 1e6 ? `¥${Math.round(v / 1e6)}M` : `¥${Math.round(v / 1e3)}K`)} />
                <Tooltip formatter={(v) => `¥${Math.round(v).toLocaleString()}`} />
                <Legend />
                {Object.keys(LINE_COLORS).map((k) => (
                  <Line key={k} type="linear" dataKey={k} stroke={LINE_COLORS[k]} strokeWidth={2} dot={false} isAnimationActive={false} />
                ))}
                <Line type="linear" dataKey="理想余额线" stroke="#D1D5DB" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>

            <button onClick={() => setStep(1)} className="bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-800 mx-auto block">
              重新开始模拟 →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Input({ label, value, setValue, placeholder }) {
  return (
    <div className="flex flex-col space-y-2">
      <label>{label}</label>
      <input
        className="border p-2 rounded"
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
