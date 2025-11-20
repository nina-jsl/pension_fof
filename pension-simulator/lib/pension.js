const DIVISOR_MAP = { 60: 139, 55: 170, 50: 195 };

// Clamp
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

// ---------------------- Annuity Divisor ----------------------
export function getAnnuityDivisor(retirementAge = 60) {
  return DIVISOR_MAP[Number(retirementAge)] ?? 139;
}

// -------------------------------------------------------------
// DC Accumulation (个人账户 + 企业年金)
// JPM logic:
// - Past wage backward growth = 1.5%
// - Future wage = today's wage (no growth)
// - Crediting = 2%
// -------------------------------------------------------------
function accumulateDCToRetirement({
  monthlyWage,
  yearsWorked,
  age,
  retirementAge,
  contribRate,
  inf,
  divisor,
  credit_rate = 0.02,
}) {
  const w0 = Number(monthlyWage) || 0;
  const pastYears = Math.max(0, Number(yearsWorked) || 0);
  const futureYears = Math.max(0, retirementAge - age);
  if (w0 <= 0 || contribRate <= 0) {
    return { monthlyToday: 0, balanceAtRet: 0 };
  }

  let balanceAtRet = 0;

  // historical wage backward ~1.5%
  const backward_wage_growth = 0.015;

  // Past contributions
  for (let k = 1; k <= pastYears; k++) {
    const wagePast = w0 / Math.pow(1 + backward_wage_growth, k);
    const contrib = wagePast * 12 * contribRate;
    const yearsToGrow = futureYears + k;
    balanceAtRet += contrib * Math.pow(1 + credit_rate, yearsToGrow);
  }

  // Future contributions (flat future wage)
  for (let f = 0; f < futureYears; f++) {
    const wageFuture = w0;
    const contrib = wageFuture * 12 * contribRate;
    const yearsToGrow = futureYears - f;
    balanceAtRet += contrib * Math.pow(1 + credit_rate, yearsToGrow);
  }

  const monthlyAtRet = balanceAtRet / divisor;
  const monthlyToday = monthlyAtRet / Math.pow(1 + inf, futureYears);

  return { monthlyToday, balanceAtRet };
}

// -------------------------------------------------------------
// Pillar 1 — 基础养老金（pooling）
// -------------------------------------------------------------
function pillar1PoolingJPM({
  monthlyWage,
  socialAvgMonthly,
  yearsWorked,
  age,
  retirementAge,
  inf,
}) {
  const sa = Number(socialAvgMonthly) || 0;
  if (!sa) return 0;

  // pay index: clamp 0.6 ~ 3
  const payIndex = clamp(Number(monthlyWage) / Math.max(sa, 1e-9), 0.6, 3.0);

  const yearsPast = Math.max(0, Number(yearsWorked) || 0);
  const yearsToRetire = Math.max(0, retirementAge - age);

  const monthlyAtRet = ((payIndex * sa + sa) / 2) * yearsPast * 0.01;
  const monthlyToday = monthlyAtRet / Math.pow(1 + inf, yearsToRetire);

  return monthlyToday;
}

// -------------------------------------------------------------
// Pillar 1 Total = 基础养老金 + 个人账户养老金
// -------------------------------------------------------------
export function computePillar1(
  monthlyWage,
  socialAvgMonthly,
  yearsWorked,
  age,
  retirementAge,
  { inf = 0.0225 } = {}
) {
  const divisor = DIVISOR_MAP[retirementAge] ?? 139;

  // 基础养老金
  const pooling = pillar1PoolingJPM({
    monthlyWage,
    socialAvgMonthly,
    yearsWorked,
    age,
    retirementAge,
    inf,
  });

  // Personal account
  const { monthlyToday: individual, balanceAtRet } =
    accumulateDCToRetirement({
      monthlyWage,
      yearsWorked,
      age,
      retirementAge,
      contribRate: 0.08,
      inf,
      divisor,
      credit_rate: 0.02,
    });

  return {
    pooling,
    individual,
    total: pooling + individual,
    balanceAtRet,
    years_past: yearsWorked,
    years_total: yearsWorked,
  };
}

// -------------------------------------------------------------
// Pillar 2 — 企业年金
// -------------------------------------------------------------
export function computePillar2(
  monthlyWage,
  _socialAvgMonthly,
  yearsWorked,
  age,
  retirementAge,
  pillar2Level,
  { inf = 0.0225 } = {}
) {
  const rateMap = {
    none: 0.0,
    basic: 0.03,
    standard: 0.06,
    generous: 0.1,
  };
  const contribRate = rateMap[pillar2Level] ?? 0;
  const divisor = DIVISOR_MAP[retirementAge] ?? 139;

  if (contribRate <= 0) return { monthly: 0, balance: 0 };

  const { monthlyToday, balanceAtRet } = accumulateDCToRetirement({
    monthlyWage,
    yearsWorked,
    age,
    retirementAge,
    contribRate,
    inf,
    divisor,
    credit_rate: 0.02,
  });

  return {
    monthly: monthlyToday,
    balance: balanceAtRet,
  };
}

// -------------------------------------------------------------
// Pillar 3 — 缺口
// -------------------------------------------------------------
export function computePillar3Gap(
  monthlyWage,
  age,
  retirementAge,
  pillar1TotalMonthly,
  pillar2Monthly,
  {
    g_w = 0.03,
    inf = 0.0225,
    targetReplacement = 0.7,
    annuityDivisor = 139,
  } = {}
) {
  const yearsToRetire = Math.max(0, retirementAge - age);

  const futureWage = monthlyWage * Math.pow(1 + g_w, yearsToRetire);
  const targetNominal = futureWage * targetReplacement;
  const targetReal = targetNominal / Math.pow(1 + inf, yearsToRetire);

  const existingReal = (pillar1TotalMonthly || 0) + (pillar2Monthly || 0);
  const gap = Math.max(0, targetReal - existingReal);

  const monthsToRetire = Math.max(1, yearsToRetire * 12);
  const monthlySaving = (gap * annuityDivisor) / monthsToRetire;

  return {
    gap,
    monthlySaving,
    targetReal,
    futureWage,
  };
}

// -------------------------------------------------------------
// projectMonthlyPayout — 你 UI 在用的函数
// 同额月存 → 退休后每月可领多少（今天价格）
// -------------------------------------------------------------
export function projectMonthlyPayout({
  monthlySaving,
  yearsToRetire,
  realReturn = 0.06,
  annuityDivisor = 139,
}) {
  const pmt = Math.max(0, Number(monthlySaving) || 0);
  const n = Math.max(0, Math.round((Number(yearsToRetire) || 0) * 12));
  if (pmt === 0 || n === 0) return 0;

  const rm = Number(realReturn) / 12;

  // FV of annuity
  const fv =
    Math.abs(rm) < 1e-9 ? pmt * n : pmt * (((1 + rm) ** n - 1) / rm);

  return fv / Math.max(1, Number(annuityDivisor) || 139);
}
