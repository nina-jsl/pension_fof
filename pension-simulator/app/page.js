"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  CategoryScale,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler);

/* ======== JPM Benchmark ======== */
function computeIdealCurves(age, retirementAge, annualIncome) {
  const start = parseInt(age);
  const retire = parseInt(retirementAge);
  const multiples = { 25: 0.2, 30: 0.4, 35: 1.1, 40: 2.0, 45: 3.0, 50: 4.2, 55: 5.6, 60: 7.3, 65: 8.9 };

  const interp = (a) => {
    const ages = Object.keys(multiples).map(Number);
    if (a <= ages[0]) return multiples[ages[0]];
    if (a >= ages.at(-1)) return multiples[ages.at(-1)];
    for (let i = 0; i < ages.length - 1; i++) {
      if (a >= ages[i] && a < ages[i + 1]) {
        const t = (a - ages[i]) / (ages[i + 1] - ages[i]);
        return multiples[ages[i]] + t * (multiples[ages[i + 1]] - multiples[ages[i]]);
      }
    }
  };

  return Array.from({ length: retire - start + 1 }, (_, i) => {
    const a = start + i;
    return { age: a, val: interp(a) * annualIncome };
  });
}

/* ======== Simulation ======== */
function simulateStrategy(age, retirementAge, income, saveRate, rateAnnualFn, vol = 0.2885) {
  const years = retirementAge - age;
  let bal = 0;
  const arr = [];
  for (let y = 0; y <= years; y++) {
    bal = bal * (1 + rateAnnualFn(y, years)) + income * saveRate;
    arr.push({
      age: age + y,
      mean: bal,
      upper: bal * (1 + vol / 2),
      lower: bal * (1 - vol / 2),
    });
  }
  return arr;
}

/* ======== Component ======== */
export default function Home() {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState("");
  const [retirementAge, setRetirementAge] = useState("65");
  const [annualIncome, setAnnualIncome] = useState("");
  const [saveRate, setSaveRate] = useState("");
  const [chosen, setChosen] = useState(null);
  const [results, setResults] = useState(null);

  const LINE_COLORS = {
    定存: "#5B4E9C",
    全部股票: "#0071BB",
    全部债券: "#00847C",
    养老FOF: "#84A040",
  };

  const handleNext = () => {
    const a = +age,
      ra = +retirementAge,
      inc = +annualIncome,
      s = +saveRate / 100;
    if ([a, ra, inc, s].some(isNaN)) return alert("请完整填写所有输入项");

    const strategies = [
      { name: "定存", rateAnnualFn: () => 0.018 },
      { name: "全部股票", rateAnnualFn: () => 0.078 },
      { name: "全部债券", rateAnnualFn: () => 0.03 },
      { name: "养老FOF", rateAnnualFn: (y, total) => 0.06 + (0.03 - 0.06) * (y / total) },
    ];

    const sims = strategies.map((st) => ({
      name: st.name,
      data: simulateStrategy(a, ra, inc, s, st.rateAnnualFn),
    }));
    const ideal = computeIdealCurves(a, ra, inc);
    setResults({ sims, ideal });
    setStep(2);
  };

  const handleChoice = (name) => {
    setChosen(name);
    setStep(3);
  };

  const handleCompare = () => setStep(4);
  const handleRestart = () => {
    setStep(1);
    setResults(null);
    setChosen(null);
  };

  const selected = results?.sims.find((x) => x.name === chosen);

  /* ======== Step 3 Chart ======== */
  const chartData = useMemo(() => {
    if (!results || !selected) return null;
    const labels = selected.data.map((d) => `${d.age}岁`);
    return {
      labels,
      datasets: [
        {
          label: "实际累计",
          data: selected.data.map((d) => d.mean),
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59,130,246,0.25)",
          fill: "+1",
          tension: 0.25,
        },
        {
          label: "上界",
          data: selected.data.map((d) => d.upper),
          borderColor: "transparent",
          backgroundColor: "rgba(59,130,246,0.1)",
          fill: "-1",
          pointRadius: 0,
        },
        {
          label: "下界",
          data: selected.data.map((d) => d.lower),
          borderColor: "transparent",
          backgroundColor: "rgba(59,130,246,0.1)",
          fill: "-1",
          pointRadius: 0,
        },
        {
          label: "理想累计线",
          data: results.ideal.map((d) => d.val),
          borderColor: "#22C55E",
          borderDash: [5, 5],
          fill: false,
          tension: 0.25,
        },
      ],
    };
  }, [results, selected]);

  /* ======== Step 4 Chart (Comparison) ======== */
  const compareData = useMemo(() => {
    if (!results) return null;

    const labels = results.ideal.map((d) => `${d.age}岁`);

    const datasets = results.sims.map((s) => ({
      label: s.name,
      data: s.data.map((d) => d.mean),
      borderColor: LINE_COLORS[s.name],
      fill: false,
      tension: 0.25,
    }));

    datasets.push({
      label: "理想累计线",
      data: results.ideal.map((d) => d.val),
      borderColor: "#22C55E",
      borderDash: [5, 5],
      fill: false,
      tension: 0.25,
    });

    return { labels, datasets };
  }, [results]);

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      tooltip: { callbacks: { label: (ctx) => `¥${Math.round(ctx.parsed.y).toLocaleString()}` } },
    },
    scales: {
      y: { ticks: { callback: (v) => `¥${v / 1000}K` } },
      x: { ticks: { autoSkip: true, maxTicksLimit: 10 } },
    },
  };

  /* ======== Render ======== */
  return (
    <main className="flex flex-col items-center justify-center p-8 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">退休储蓄模拟器</h1>

      <AnimatePresence mode="wait">
        {/* STEP 1 */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl bg-white p-6 rounded-xl shadow-md"
          >
            <Input label="当前年龄" value={age} setValue={setAge} placeholder="如 25" />
            <Input label="计划退休年龄" value={retirementAge} setValue={setRetirementAge} placeholder="如 65" />
            <Input label="当前年薪 (¥)" value={annualIncome} setValue={setAnnualIncome} placeholder="如 30000" />
            <Input label="储蓄比例 (% of 年薪)" value={saveRate} setValue={setSaveRate} placeholder="如 10" />
            <div className="md:col-span-2 text-center mt-2">
              <button onClick={handleNext} className="bg-gray-700 text-white py-2 px-6 rounded hover:bg-gray-800">
                下一步 →
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center space-y-4"
          >
            <h2 className="text-xl font-semibold text-gray-800">请选择投资策略</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {["定存", "全部股票", "全部债券", "养老FOF"].map((label) => (
                <button
                  key={label}
                  onClick={() => handleChoice(label)}
                  className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 3 */}
        {step === 3 && selected && (
          <motion.div
            key="step3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-3xl text-center space-y-6"
          >
            <h3 className="text-lg font-semibold text-gray-700">
              每年龄实际累计 vs 理想累计线（{chosen}）
            </h3>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <Line data={chartData} options={options} />
            </div>
            <button
              onClick={handleCompare}
              className="bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-800"
            >
              查看所有策略对比 →
            </button>
          </motion.div>
        )}

        {/* STEP 4: Compare all */}
        {step === 4 && compareData && (
          <motion.div
            key="step4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-5xl text-center space-y-6"
          >
            <h3 className="text-xl font-semibold text-gray-700">策略对比：全部策略 vs 理想线</h3>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <Line data={compareData} options={options} />
            </div>
            <button
              onClick={handleRestart}
              className="bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-800"
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
