"use client";
import { useState } from "react";

/* ===== City 社平工资 (annual -> monthly) ===== */
const SOCIAL_AVG_WAGE = {
  shanghai: 183000 / 12,
  beijing: 195501 / 12,
  shenzhen: 140052 / 12,
  national: 107100 / 12,
};

/* ===== Helper: Level → 企业年金缴费率 ===== */
function interpret_pillar2_level(level) {
  return {
    none: 0.0,
    basic: 0.03,
    standard: 0.06,
    generous: 0.10,
  }[level];
}

/* ===== Pillar 1 ===== */
function personal_account_balance_with_growth(
  monthly_wage_start,
  years_contributed,
  real_wage_growth = 0.025,
  credit_rate = 0.0
) {
  let balance = 0;
  for (let t = 0; t < years_contributed; t++) {
    const wage_t = monthly_wage_start * Math.pow(1 + real_wage_growth, t);
    const contrib = wage_t * 0.08 * 12;
    balance += contrib * Math.pow(1 + credit_rate, years_contributed - t - 1);
  }
  return balance;
}

function pillar1_pension(
  monthly_wage,
  social_avg_monthly,
  years_contributed,
  retirement_age
) {
  let ratio = monthly_wage / social_avg_monthly;
  ratio = Math.min(3.0, Math.max(0.6, ratio));

  const pooling =
    ((social_avg_monthly + social_avg_monthly * ratio) / 2) *
    years_contributed *
    0.01;

  const balance = personal_account_balance_with_growth(
    monthly_wage,
    years_contributed
  );

  const divisor = { 60: 101, 55: 127, 50: 139 }[retirement_age];
  const individual = balance / divisor;

  return pooling + individual;
}

/* ===== Pillar 2 ===== */
function pillar2_annuity(
  monthly_wage_start,
  social_avg_monthly,
  years_contributed,
  pillar2_level,
  wage_growth = 0.025,
  investment_return_real = 0.03,
  retirement_age = 60
) {
  const rate = interpret_pillar2_level(pillar2_level);

  let ratio = monthly_wage_start / social_avg_monthly;
  ratio = Math.min(3.0, Math.max(0.6, ratio));
  const base_start = social_avg_monthly * ratio;

  let balance = 0;
  for (let t = 0; t < years_contributed; t++) {
    const base_t = base_start * Math.pow(1 + wage_growth, t);
    const contrib = base_t * rate * 12;
    balance += contrib * Math.pow(1 + investment_return_real, years_contributed - t - 1);
  }

  const divisor = { 60: 101, 55: 127, 50: 139 }[retirement_age];
  return balance / divisor;
}

/* ===== Pillar 3 ===== */
function pillar3_required(
  monthly_wage_now,
  age_now,
  retirement_age,
  pillar1_monthly,
  pillar2_monthly
) {
  const target_ratio = 0.70;
  const wage_growth = 0.025;
  const invest_return_real = 0.015;
  const retire_years = 20;

  const years_to_retire = retirement_age - age_now;
  const final_wage = monthly_wage_now * Math.pow(1 + wage_growth, years_to_retire);
  const target_income = final_wage * target_ratio;

  const gap = target_income - (pillar1_monthly + pillar2_monthly);
  if (gap <= 0) return { gap: 0, requiredWealth: 0, annualSaving: 0 };

  const requiredWealth = gap * 12 * retire_years;

  const r = invest_return_real;
  const annualSaving =
    (requiredWealth * r) / (Math.pow(1 + r, years_to_retire) - 1);

  return { gap, requiredWealth, annualSaving };
}

/* ===== React Component ===== */
export default function Home() {
  const [age, setAge] = useState("");
  const [retirementAge, setRetirementAge] = useState("60");
  const [monthlyWage, setMonthlyWage] = useState("");
  const [yearsContributed, setYearsContributed] = useState("");
  const [city, setCity] = useState("shanghai");
  const [pillar2Level, setPillar2Level] = useState("none");
  const [result, setResult] = useState(null);

  const handleCalc = () => {
    const a = +age,
      ra = +retirementAge,
      wage = +monthlyWage,
      yc = +yearsContributed;

    if ([a, ra, wage, yc].some(isNaN)) return alert("请填写完整信息");
    if (yc < 0 || yc > (ra - a)) return alert("工作年限不合理");

    const socialAvg = SOCIAL_AVG_WAGE[city];

    const p1 = pillar1_pension(wage, socialAvg, yc, ra);
    const p2 = pillar2_annuity(wage, socialAvg, yc, pillar2Level, 0.025, 0.03, ra);
    const p3 = pillar3_required(wage, a, ra, p1, p2);

    setResult({ p1, p2, ...p3 });
  };

  return (
    <main className="max-w-xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold text-center">退休收入测算</h1>

      <div className="grid gap-4">
        <Input label="当前年龄" value={age} setValue={setAge} />
        <Input label="计划退休年龄" value={retirementAge} setValue={setRetirementAge} />
        <Input label="当前月薪 (¥)" value={monthlyWage} setValue={setMonthlyWage} />

        <Input
          label="已累计缴费年限（工作年限）"
          value={yearsContributed}
          setValue={setYearsContributed}
          placeholder="如 3, 8, 12"
        />

        <label>所在城市</label>
        <select className="border p-2 rounded" value={city} onChange={e => setCity(e.target.value)}>
          <option value="shanghai">上海</option>
          <option value="beijing">北京</option>
          <option value="shenzhen">深圳</option>
          <option value="national">全国平均</option>
        </select>

        <label>企业年金水平</label>
        <select className="border p-2 rounded" value={pillar2Level} onChange={e => setPillar2Level(e.target.value)}>
          <option value="none">无</option>
          <option value="basic">基础 (约3%)</option>
          <option value="standard">标准 (约6%)</option>
          <option value="generous">优厚 (约10%)</option>
        </select>

        <button onClick={handleCalc} className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          计算退休缺口
        </button>
      </div>

      {result && (
        <div className="bg-white p-6 rounded shadow space-y-3">
          <p>基本养老金: <b>¥{result.p1.toFixed(0)}</b>/月</p>
          <p>企业年金养老金: <b>¥{result.p2.toFixed(0)}</b>/月</p>
          <p>目标退休收入: 最后工资的 <b>70%</b></p>
          <p>收入缺口: <b>¥{result.gap.toFixed(0)}</b>/月</p>
          <p>退休前需累计资金: <b>¥{result.requiredWealth.toLocaleString()}</b></p>
          <p>每年需储蓄（低风险方案）: <b>¥{result.annualSaving.toFixed(0)}</b>/年</p>
        </div>
      )}
    </main>
  );
}

/* ----- Input Component ----- */
function Input({ label, value, setValue, placeholder }) {
  return (
    <div className="flex flex-col">
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
