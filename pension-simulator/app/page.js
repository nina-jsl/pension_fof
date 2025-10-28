"use client";
import { useState, useMemo } from "react";
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
  Area,
} from "recharts";

/* ======== Ideal JPM Benchmark (multiples of annual income) ======== */
function computeIdealCurves(age, retirementAge, annualIncome) {
  const start = parseInt(String(age), 10);
  const retire = parseInt(String(retirementAge), 10);

  // JPMorgan multiples (interpolated between knots)
  const targetMultiples = {
    25: 0.2,
    30: 0.4,
    35: 1.1,
    40: 2.0,
    45: 3.0,
    50: 4.2,
    55: 5.6,
    60: 7.3,
    65: 8.9,
  };

  const getIdealMultiple = (a) => {
    const ages = Object.keys(targetMultiples).map(Number);
    if (a <= ages[0]) return targetMultiples[ages[0]];
    if (a >= ages[ages.length - 1])
      return targetMultiples[ages[ages.length - 1]];
    for (let i = 0; i < ages.length - 1; i++) {
      if (a >= ages[i] && a < ages[i + 1]) {
        const ratio = (a - ages[i]) / (ages[i + 1] - ages[i]);
        return (
          targetMultiples[ages[i]] +
          ratio * (targetMultiples[ages[i + 1]] - targetMultiples[ages[i]])
        );
      }
    }
    return 0;
  };

  const idealSavings = [];
  for (let y = start; y <= retire; y++) {
    const multiple = getIdealMultiple(y);
    idealSavings.push({ age: y, value: multiple * annualIncome });
  }
  return { idealSavings };
}

/* ======== Main App ======== */
export default function Home() {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState("");
  const [retirementAge, setRetirementAge] = useState("65");
  const [annualIncome, setAnnualIncome] = useState("");
  const [saveRate, setSaveRate] = useState("");
  const [results, setResults] = useState(null);
  const [chosen, setChosen] = useState(null);

  // Palette you wanted
  const LINE_COLORS = {
    定存: "#5B4E9C",
    全部股票: "#0071BB",
    全部债券: "#00847C",
    养老FOF: "#84A040",
  };

  /* ---------- Simulation (annual, cumulative) ---------- */
  const simulateStrategy = ({
    age,
    retirementAge,
    annualIncome,
    saveRate,
    rateAnnualFn,
  }) => {
    const years = Math.max(0, retirementAge - age);
    const series = [];
    let balance = 0;

    for (let y = 0; y <= years; y++) {
      const currentAge = age + y;
      const annualSaving = annualIncome * saveRate;
      balance =
        balance * (1 + rateAnnualFn(y, years, currentAge)) + annualSaving;

      const vol = 0.2885;
      const upper = balance * (1 + vol / 2); // +1σ
      const lower = balance * (1 - vol / 2); // -1σ

      series.push({
        yearLabel: `${currentAge}岁`,
        yearNum: currentAge,
        actual: balance,
        shadowUp: upper,
        shadowDown: lower,
      });
    }

    return { series, finalBalance: balance };
  };

  const makeSimulations = () => {
    const a = parseFloat(age);
    const ra = parseFloat(retirementAge);
    const inc = parseFloat(annualIncome);
    const s = parseFloat(saveRate) / 100;
    if ([a, ra, inc, s].some((x) => Number.isNaN(x))) return null;
    if (ra <= a) return null;

    const years = ra - a;
    const crashYearIndex = Math.max(1, Math.floor(years * 0.65)); // one big drawdown mid-late career

    const strategies = [
      { name: "定存", rateAnnualFn: () => 0.018 },
      {
        name: "全部股票",
        rateAnnualFn: (y) => 0.078, // steady 7.8% compound return
        withShadow: true, // mark for visualization
      },

      { name: "全部债券", rateAnnualFn: () => 0.03 },
      {
        name: "养老FOF",
        rateAnnualFn: (y, total) => {
          const start = 0.06;
          const end = 0.03; // glide path: higher early, lower later
          return start + (end - start) * (y / Math.max(1, total - 1));
        },
      },
    ];

    return strategies.map((st) => ({
      name: st.name,
      ...simulateStrategy({
        age: a,
        retirementAge: ra,
        annualIncome: inc,
        saveRate: s,
        rateAnnualFn: st.rateAnnualFn,
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

  // Make these BEFORE return so JSX can use them
  const sims = useMemo(() => results || [], [results]);
  const selectedSim = useMemo(
    () => sims.find((x) => x.name === chosen),
    [sims, chosen]
  );

  /* ---------- UI ---------- */
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
            <Input
              label="当前年龄"
              value={age}
              setValue={setAge}
              placeholder="如 25"
            />
            <Input
              label="计划退休年龄"
              value={retirementAge}
              setValue={setRetirementAge}
              placeholder="如 65"
            />
            <Input
              label="当前年薪 (¥)"
              value={annualIncome}
              setValue={setAnnualIncome}
              placeholder="如 30000"
            />
            <Input
              label="储蓄比例 (% of 年薪)"
              value={saveRate}
              setValue={setSaveRate}
              placeholder="如 10"
            />

            <div className="md:col-span-2">
              <button
                onClick={handleNext}
                className="mt-2 bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-800"
              >
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
            <h2 className="text-xl font-semibold text-gray-800">
              请选择想要投资的方式
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {["定存", "全部股票", "全部债券", "养老FOF"].map((label) => (
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

        {/* STEP 3: 单一策略 */}
        {selectedSim && step === 3 && (
          <div className="w-full max-w-3xl mt-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-700 text-center">
              每年龄实际累计 vs 理想累计线（{chosen}）
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={(() => {
                  const ideal = computeIdealCurves(
                    age,
                    retirementAge,
                    parseFloat(annualIncome)
                  );
                  const data = {};

                  selectedSim.series.forEach((pt) => {
                    data[pt.yearNum] = {
                      year: `${pt.yearNum}岁`,
                      实际累计: pt.actual,
                      shadowUp: pt.shadowUp,
                      shadowDown: pt.shadowDown,
                    };
                  });

                  ideal.idealSavings.forEach((pt) => {
                    if (!data[pt.age]) data[pt.age] = { year: `${pt.age}岁` };
                    data[pt.age]["理想累计线"] = pt.value;
                  });

                  return Object.values(data).sort(
                    (a, b) => parseInt(a.year) - parseInt(b.year)
                  );
                })()}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis
                  domain={[0, "auto"]}
                  tickFormatter={(v) => `¥${Math.round(Number(v) / 1000)}K`}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "shadowUp" || name === "shadowDown")
                      return null; // hide
                    return [
                      `¥${Math.round(Number(value)).toLocaleString()}`,
                      name,
                    ];
                  }}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                  }}
                />

                <Legend />

                {/* Shadow band area (surrounds the blue line) */}
                {chosen === "全部股票" && (
                  <>
                    <defs>
                      <linearGradient
                        id="shadowGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#0071BB"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="100%"
                          stopColor="#0071BB"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <Area
                      type="monotone"
                      dataKey="shadowUp"
                      stroke="none"
                      fill="url(#shadowGradient)"
                      fillOpacity={0.25}
                      isAnimationActive={false}
                      baseLine={(d) => d.shadowDown}
                      activeDot={false}
                      legendType="none"
                      name={null}
                    />
                  </>
                )}

                <Line
                  type="linear"
                  dataKey="理想累计线"
                  stroke="#22C55E"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line
                  type="linear"
                  dataKey="实际累计"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>

            <button
              onClick={handleCompare}
              className="bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-800 mx-auto block"
            >
              查看所有策略对比 →
            </button>
          </div>
        )}

        {/* STEP 4: 策略对比 */}
        {step === 4 && results && (
          <motion.div
            key="step4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="mt-8 w-full max-w-5xl space-y-8 bg-white p-6 rounded-2xl shadow-md"
          >
            <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">
              策略对比：每年累计累计 vs 理想累计线
            </h2>

            <ResponsiveContainer width="100%" height={360}>
              <LineChart
                data={(() => {
                  const ideal = computeIdealCurves(
                    age,
                    retirementAge,
                    parseFloat(annualIncome)
                  );
                  const byYear = {};

                  results.forEach((s) => {
                    s.series.forEach((pt) => {
                      if (!byYear[pt.yearNum])
                        byYear[pt.yearNum] = { year: `${pt.yearNum}岁` };
                      byYear[pt.yearNum][s.name] = pt.actual;
                    });
                  });

                  ideal.idealSavings.forEach((pt) => {
                    if (!byYear[pt.age])
                      byYear[pt.age] = { year: `${pt.age}岁` };
                    byYear[pt.age]["理想累计线"] = pt.value;
                  });

                  return Object.values(byYear).sort(
                    (a, b) => parseInt(a.year, 10) - parseInt(b.year, 10)
                  );
                })()}
              >
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fill: "#4B5563" }} />
                <YAxis
                  tick={{ fill: "#4B5563" }}
                  tickFormatter={(v) => `¥${Math.round(Number(v) / 1000)}K`}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "shadowUp" || name === "shadowDown")
                      return null;
                    return [
                      `¥${Math.round(Number(value)).toLocaleString()}`,
                      name,
                    ];
                  }}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                  }}
                />

                <Legend
                  wrapperStyle={{
                    color: "#374151",
                    fontSize: 13,
                    marginTop: 8,
                  }}
                />

                {Object.keys(LINE_COLORS).map((k) => (
                  <Line
                    key={k}
                    type="linear"
                    dataKey={k}
                    stroke={LINE_COLORS[k]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
                <Line
                  type="linear"
                  dataKey="理想累计线"
                  stroke="#22C55E"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>

            <button
              onClick={() => setStep(1)}
              className="bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-800 mx-auto block"
            >
              重新开始模拟 →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

/* ----- Input Component ----- */
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
