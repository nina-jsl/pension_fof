"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  computePillar1,
  computePillar2,
  computePillar3Gap,
} from "@/lib/pension";

const SOCIAL_AVG_WAGE = {
  shanghai: 183000 / 12,
  beijing: 195501 / 12,
  shenzhen: 140052 / 12,
  national: 107100 / 12,
};

// Very simple tax-saving model（够用且不会说错）
function computeTaxSaving(monthlySaving) {
  const annual = monthlySaving * 12;
  const deductible = Math.min(annual, 12000);
  return deductible * 0.1;
}

export default function Home() {
  const [showInput, setShowInput] = useState(false);

  const [city, setCity] = useState("shanghai");
  const [pillar2Level, setPillar2Level] = useState("standard");
  const [monthlyWage, setMonthlyWage] = useState("");
  const [age, setAge] = useState("");
  const [yearsWorked, setYearsWorked] = useState("");

  const retirementAge = 60;
  const socialAvg = SOCIAL_AVG_WAGE[city];

  let result = null;
  if (monthlyWage && age && yearsWorked) {
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
    const p3 = computePillar3Gap(
      Number(monthlyWage),
      Number(age),
      retirementAge,
      p1.total,
      p2.monthly
    );
    result = { p1, p2, p3 };
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-white">
      <div className="w-full max-w-[420px] px-6 text-center text-[#333]">
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

              {/* RESULT SECTION */}
              {result && (
                <>
                  <motion.div
                    className="mt-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
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
                  <div className="mt-6 bg-[#FFF5F7] p-5 rounded-xl">
                    <p className="text-sm">要维持“正常生活”（约70%收入替代）</p>

                    <p className="text-2xl font-bold text-[#FF4D6A] mt-2">
                      还差 {result.p3.gap.toFixed(0)} 元 / 月
                    </p>

                    <p className="text-sm text-[#666] mt-4">我们帮你算好了：</p>

                    <p className="text-lg font-semibold mt-1">
                      每月存{" "}
                      <span className="text-[#FF4D6A] font-bold">
                        {result.p3.monthlySaving.toFixed(0)}
                      </span>{" "}
                      元就能补上差距
                    </p>

                    <p className="text-sm text-[#FF4D6A] font-medium mt-3">
                      当年可少交税 ≈{" "}
                      {computeTaxSaving(result.p3.monthlySaving).toFixed(0)} 元
                      💰
                    </p>
                  </div>
                </>
              )}

              {/* BUTTON */}
              <button
                onClick={() => setShowInput(true)}
                className="mt-8 w-full bg-[#FF4D6A] text-white py-3 rounded-full font-semibold hover:opacity-95 transition"
              >
                我们来帮你规划
              </button>
            </motion.div>
          )}

          {/* INPUT SCREEN */}
          {showInput && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 space-y-4"
            >
              <select
                className="w-full border p-3 rounded text-center"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                <option value="shanghai">上海</option>
                <option value="beijing">北京</option>
                <option value="shenzhen">深圳</option>
                <option value="national">全国平均</option>
              </select>

              <input
                className="w-full border p-3 rounded text-center"
                placeholder="月薪（元）"
                value={monthlyWage}
                onChange={(e) => setMonthlyWage(e.target.value)}
              />

              <input
                className="w-full border p-3 rounded text-center"
                placeholder="年龄"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />

              <input
                className="w-full border p-3 rounded text-center"
                placeholder="你已经工作了多久（年）"
                value={yearsWorked}
                onChange={(e) => setYearsWorked(e.target.value)}
              />

              <p className="text-sm text-[#999] mt-4">
                你所在单位的企业年金水平
              </p>

              <select
                className="w-full border p-3 rounded text-center"
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

              <button
                className="w-full bg-[#FF4D6A] text-white py-3 rounded-full font-semibold hover:opacity-95 transition"
                onClick={() => setShowInput(false)}
              >
                查看计算结果
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
