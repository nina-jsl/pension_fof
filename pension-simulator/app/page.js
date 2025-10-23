"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

export default function Home() {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState("");
  const [salary, setSalary] = useState("");
  const [saveRate, setSaveRate] = useState("");
  const [results, setResults] = useState(null);
  const [chosen, setChosen] = useState(null);

  const COLORS = ["#9CA3AF", "#E5E7EB"]; // neutral gray tones

  // ---------- calculation ----------
  const calcResults = (age, salary, saveRateInput) => {
    const currentAge = parseFloat(age);
    const currentSalary = parseFloat(salary);
    const retirementAge = 65;
    const years = retirementAge - currentAge;
    const salaryGrowth = 0.03;
    const saveRatio = parseFloat(saveRateInput) / 100;

    const strategies = [
      { name: "不存钱", baseRate: 0 },
      { name: "存定期", baseRate: 0.015 },
      { name: "资产配置投资", baseRate: 0.07 },
    ];

    const calcTotal = (baseRate, isAllocation = false, isNoSave = false) => {
      let total = 0;
      let s = currentSalary;
      for (let i = 0; i < years; i++) {
        if (!isNoSave) total += s * saveRatio;
        const rate = isAllocation ? baseRate - (i / years) * 0.04 : baseRate;
        total *= 1 + rate;
        s *= 1 + salaryGrowth;
      }
      return total;
    };

    return strategies.map((s) => {
      const total = calcTotal(
        s.baseRate,
        s.name === "资产配置投资",
        s.name === "不存钱"
      );
      const income = total / 20;
      const target = currentSalary * 0.7;
      const percent = ((income / target) * 100).toFixed(1);
      return {
        策略: s.name,
        退休总资产: Math.round(total),
        每年收入: Math.round(income),
        达成率: parseFloat(percent),
      };
    });
  };

  const handleNext = () => {
    if (!age || !salary || !saveRate) {
      alert("请输入年龄、工资和计划储蓄比例！");
      return;
    }
    const res = calcResults(age, salary, saveRate);
    setResults(res);
    setStep(2);
  };

  const handleChoice = (choice) => {
    setChosen(choice);
    setStep(3);
  };

  const handleCompare = () => setStep(4);
  const handleLifestyle = () => setStep(5);

  // ---------- UI ----------
  return (
    <main className="flex flex-col items-center justify-center p-8 space-y-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">
        退休储蓄模拟器
      </h1>

      <AnimatePresence mode="wait">
        {/* STEP 1 – 输入资料 */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col space-y-3 w-80 bg-white p-6 rounded-xl shadow-md"
          >
            <label>当前年龄：</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="border p-2 rounded"
              placeholder="如 30"
            />
            <label>当前年薪 (¥)：</label>
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="border p-2 rounded"
              placeholder="如 100000"
            />
            <label>计划储蓄比例 (%):</label>
            <input
              type="number"
              value={saveRate}
              onChange={(e) => setSaveRate(e.target.value)}
              className="border p-2 rounded"
              placeholder="如 10"
            />
            {saveRate && salary && (
              <p className="text-sm text-gray-500">
                每年储蓄约 ¥{((salary * saveRate) / 100).toLocaleString()}
              </p>
            )}
            <button
              onClick={handleNext}
              className="mt-4 bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-800"
            >
              下一步 →
            </button>
          </motion.div>
        )}

        {/* STEP 2 – 选择策略 */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center space-y-4"
          >
            <h2 className="text-xl font-semibold text-gray-800">
              请选择储蓄方式
            </h2>
            <div className="flex space-x-4">
              <button
                onClick={() => handleChoice("不存钱")}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                不存钱
              </button>
              <button
                onClick={() => handleChoice("存定期")}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                存定期
              </button>
              <button
                onClick={() => handleChoice("资产配置投资")}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                投资配置
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3 – 单项结果 */}
        {step === 3 && results && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-6 bg-white p-6 rounded-2xl shadow-md w-96"
          >
            {results
              .filter((r) => r.策略 === chosen)
              .map((r) => (
                <div key={r.策略}>
                  <h2 className="text-2xl font-bold text-gray-700 mb-2">
                    {r.策略}
                  </h2>
                  <PieChart width={220} height={200} className="mx-auto">
                    <Pie
                      dataKey="value"
                      data={[
                        { name: "已达成", value: r.达成率 },
                        { name: "差距", value: 100 - r.达成率 },
                      ]}
                      innerRadius={60}
                      outerRadius={80}
                      startAngle={90}
                      endAngle={450}
                      paddingAngle={2}
                    >
                      {[
                        { value: r.达成率 },
                        { value: 100 - r.达成率 },
                      ].map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                  <p className="text-gray-700">
                    退休总资产：¥{r.退休总资产.toLocaleString()}
                  </p>
                  <p className="text-gray-700">
                    每年预计收入：¥{r.每年收入.toLocaleString()}
                  </p>
                  <p className="text-gray-700">目标达成比例：{r.达成率}%</p>
                </div>
              ))}
            <div className="bg-gray-50 border rounded-lg p-3 text-sm text-gray-600">
              💡 养老FOF 会根据年龄逐步降低风险，让收益更平稳。
            </div>
            <button
              onClick={handleCompare}
              className="mt-4 bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-800"
            >
              查看对比图表 📊
            </button>
          </motion.div>
        )}

        {/* STEP 4 – 对比结果 */}
        {step === 4 && results && (
          <motion.div
            key="step4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-8 w-full max-w-3xl space-y-6 bg-white p-6 rounded-2xl shadow-md"
          >
            <h2 className="text-2xl font-semibold text-center text-gray-800">
              策略对比结果
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={results}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="策略" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="退休总资产" stroke="#9CA3AF" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            <div className="bg-gray-50 border rounded-lg p-3 text-sm text-gray-600">
              📘 养老FOF通过分散资产配置，在波动中保持稳健增长。
              定期存款虽然安全，但难以抵御通胀；
              “投资配置”方案更接近长期理财的目标平衡。
            </div>
            <button
              onClick={handleLifestyle}
              className="bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-800"
            >
              查看未来生活预览 →
            </button>
          </motion.div>
        )}

        {/* STEP 5 – 未来生活预览 */}
        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center bg-white p-8 rounded-xl shadow-md w-full max-w-4xl space-y-8"
          >
            <h2 className="text-2xl font-semibold text-gray-800">
              未来生活预览
            </h2>
            <p className="text-gray-600 text-sm text-center max-w-md">
              不同储蓄方式会在未来形成不同的生活节奏。
              以下是三个可能的场景，并非“好或坏”，而是不同选择的自然结果。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <div className="flex flex-col items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="text-5xl mb-3">🏙️</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">不存钱</h3>
                <p className="text-sm text-gray-600 text-center leading-relaxed">
                  预算较紧，需要继续工作几年以维持生活。<br />
                  对市场波动较敏感，生活节奏受外部经济影响更大。
                </p>
              </div>

              <div className="flex flex-col items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="text-5xl mb-3">🏡</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">存定期</h3>
                <p className="text-sm text-gray-600 text-center leading-relaxed">
                  生活稳定但增长有限。<br />
                  在应对通胀时可能需调整消费计划。
                </p>
              </div>

              <div className="flex flex-col items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="text-5xl mb-3">🧘</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">资产配置投资</h3>
                <p className="text-sm text-gray-600 text-center leading-relaxed">
                  收益更平稳，能更接近理想生活水平。<br />
                  投资随年龄自动调整风险，长期保持平衡。
                </p>
              </div>
            </div>

            <div className="text-center mt-6 space-y-3">
              <p className="text-gray-700 text-sm">
                💡 养老FOF的理念是让财富曲线随人生节奏自然演进，
                在风险与安心之间找到平衡。
              </p>
              <p className="text-gray-500 text-sm">
                想了解我们的养老FOF产品详情？请访问
                <a
                  href="https://example.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-gray-700 hover:text-gray-900 ml-1"
                >
                  官方产品页面
                </a>
              </p>
              <button
                onClick={() => setStep(1)}
                className="bg-gray-700 text-white py-2 px-6 rounded hover:bg-gray-800"
              >
                重新开始
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
