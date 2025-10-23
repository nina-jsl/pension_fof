"use client";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Home() {
  const [age, setAge] = useState("");
  const [salary, setSalary] = useState("");
  const [results, setResults] = useState(null);

  const handleCalculate = () => {
    const currentAge = parseFloat(age);
    const currentSalary = parseFloat(salary);
    const retirementAge = 65;
    const years = retirementAge - currentAge;

    if (isNaN(currentAge) || isNaN(currentSalary) || years <= 0) {
      alert("请输入合理的年龄和工资！");
      return;
    }

    const salaryGrowth = 0.03; // 工资年增长率
    const savingRate = 0.1; // 每年储蓄比例

    // 各策略年化收益率
    const strategies = [
      { name: "不存钱", rate: 0 },
      { name: "存定期", rate: 0.02 },
      { name: "资产配置投资", rate: 0.06 },
    ];

    // 计算总资产
    const calcTotal = (rate) => {
      let total = 0;
      let annualSalary = currentSalary;
      for (let i = 0; i < years; i++) {
        total += annualSalary * savingRate;
        total *= 1 + rate;
        annualSalary *= 1 + salaryGrowth;
      }
      return total;
    };

    // 计算结果数据
    const data = strategies.map((s) => {
      const total = calcTotal(s.rate);
      const income = total / 20; // 假设退休后支取 20 年
      const target = currentSalary * 0.7; // 理想退休收入
      const percent = ((income / target) * 100).toFixed(1);

      return {
        策略: s.name,
        退休总资产: Math.round(total),
        每年收入: Math.round(income),
        达成率: parseFloat(percent),
      };
    });

    setResults(data);
  };

  return (
    <main className="flex flex-col items-center justify-center p-8 space-y-6">
      <h1 className="text-3xl font-bold mb-4">未来的我 – 退休储蓄模拟器</h1>

      <div className="flex flex-col space-y-2 w-64">
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
        <button
          onClick={handleCalculate}
          className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          开始模拟
        </button>
      </div>

      {results && (
        <div className="mt-10 w-full max-w-3xl">
          <h2 className="text-xl font-semibold mb-3 text-center">结果对比</h2>

          {/* --- 数据表格 --- */}
          <table className="w-full border border-gray-300 text-center mb-8">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">策略</th>
                <th className="p-2 border">退休时总资产 (¥)</th>
                <th className="p-2 border">每年可支配收入 (¥)</th>
                <th className="p-2 border">达成目标 (%)</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.策略}>
                  <td className="border p-2">{r.策略}</td>
                  <td className="border p-2">{r.退休总资产.toLocaleString()}</td>
                  <td className="border p-2">{r.每年收入.toLocaleString()}</td>
                  <td
                    className={`border p-2 ${
                      r.达成率 >= 70
                        ? "text-green-600"
                        : r.达成率 >= 40
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {r.达成率}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* --- 柱状图 --- */}
          <h3 className="text-lg font-medium mb-2 text-center">资产对比图表</h3>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart
                data={results}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="策略" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="退休总资产" fill="#4F46E5" />
                <Bar dataKey="每年收入" fill="#60A5FA" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </main>
  );
}
