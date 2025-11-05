// helpers
const DIVISOR_MAP = { 60: 139, 55: 170, 50: 195 };
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const geomSumForward = (n, r) => (n<=0?0: Math.abs(r)<1e-9 ? n : ((1+r)**(n+1)-(1+r))/r);
const geomSumBackward = (n, r) => (n<=0?0: Math.abs(r)<1e-9 ? n : (1-(1+r)**(-n))/r); //pension discounting 
const sumPow = (n, a) => (n<=0?0: Math.abs(a-1)<1e-9 ? n*a : (a*(1-a**n))/(1-a));

/**
 * Pillar 1 = pooling + personal account 
 */
// Pooling Calculation (original formula already adjusted for wage increment)
function pillar1PoolingToday({ monthlyWage, socialAvgMonthly, yearsTotal }) {
  // payindex but camp to be bewteen 0.6 - 3.0 
  const payIndex = clamp(
    Number(monthlyWage) / Math.max(1e-9, Number(socialAvgMonthly)),
    0.6, 3.0
  );
  // official rule for calculating pooling 
  const sa = Number(socialAvgMonthly) || 0;
  return ((payIndex * sa + sa) / 2) * (Math.max(0, yearsTotal) * 0.01);
}

// Personal Account Calculation 
function personalAccountMonthlyToday({
  monthlyWage, yearsWorked, yearsToRetire, g_w = 0.0, credit_rate = 0.0, divisor
}) {
  const wage0 = Number(monthlyWage) || 0;
  const Yp = Math.max(0, Number(yearsWorked) || 0);
  const Yf = Math.max(0, Number(yearsToRetire) || 0);
  // contribution to personal from wage is 8%
  const base = wage0 * 0.08 * 12;

  // case for no investment return 
  if (Math.abs(credit_rate) < 1e-9) {
    const past   = base * geomSumBackward(Yp, g_w);
    const future = base * geomSumForward(Yf, g_w);
    return (past + future) / divisor;
  }

  // with real crediting
  const aPast = (1 + credit_rate) / (1 + g_w);
  const aFut  = (1 + g_w) / (1 + credit_rate);
  const pastGrown   = base * (1 + credit_rate) ** Math.max(0, Yf - 1) * sumPow(Yp, aPast);
  const futureGrown = base * (1 + credit_rate) ** Yf * sumPow(Yf, aFut);
  // official formula for calculating personal account amount, divisor also official
  return (pastGrown + futureGrown) / divisor;
}

/**
 * Pillar 2 Calculation 
 */
function pillar2MonthlyToday({
  monthlyWage, yearsWorked, yearsToRetire, pillar2Level, retirementAge, g_w = 0.0, credit_rate = 0.0
}) {
  // Determine contribution rate (annual)
  const rateMap = { none: 0.0, basic: 0.03, standard: 0.06, generous: 0.10 };
  const rate = rateMap[pillar2Level] ?? 0.0;
  const divisor = DIVISOR_MAP[retirementAge] ?? 139;

  const wage0 = Number(monthlyWage) || 0;
  const Yp = Math.max(0, Number(yearsWorked) || 0);
  const Yf = Math.max(0, Number(yearsToRetire) || 0);
  const base = wage0 * rate * 12;

  // case for no investment return 
  if (Math.abs(credit_rate) < 1e-9) {
    const past   = base * geomSumBackward(Yp, g_w);
    const future = base * geomSumForward(Yf, g_w);
    return (past + future) / divisor;
  }

  // case for with investment return 
  const aPast = (1 + credit_rate) / (1 + g_w);
  const aFut  = (1 + g_w) / (1 + credit_rate);
  const pastGrown   = base * (1 + credit_rate) ** Math.max(0, Yf - 1) * sumPow(Yp, aPast);
  const futureGrown = base * (1 + credit_rate) ** Yf * sumPow(Yf, aFut);
  return (pastGrown + futureGrown) / divisor;
}

// ===== Public APIs (note the new final options arg) =====
export function computePillar1(
  monthlyWage, socialAvgMonthly, yearsWorked, age, retirementAge,
  { g_w = 0.0, credit_rate = 0.0 } = {}
) {
  const pastYears     = Math.max(0, Number(yearsWorked) || 0);
  const yearsToRetire = Math.max(0, (retirementAge || 60) - (age || 0));
  const yearsTotal    = pastYears + yearsToRetire;
  const divisor       = DIVISOR_MAP[retirementAge] ?? 139;

  const pooling = pillar1PoolingToday({ monthlyWage, socialAvgMonthly, yearsTotal });
  const individual = personalAccountMonthlyToday({
    monthlyWage, yearsWorked: pastYears, yearsToRetire, g_w, credit_rate, divisor
  });
  return { pooling, individual, total: pooling + individual, years_past: pastYears, years_total: yearsTotal };
}

export function computePillar2(
  monthlyWage, _socialAvgMonthly, yearsWorked, age, retirementAge, pillar2Level,
  { g_w = 0.0, credit_rate = 0.0 } = {}
) {
  const yearsToRetire = Math.max(0, (retirementAge || 60) - (age || 0));
  const divisor       = DIVISOR_MAP[retirementAge] ?? 139;

  const monthly = pillar2MonthlyToday({
    monthlyWage, yearsWorked, yearsToRetire, pillar2Level, retirementAge, g_w, credit_rate
  });
  return { monthly, balance: monthly * divisor };
}

/**
 * 第三支柱缺口 & 月存额（Semi Model, 折回今天价格）
 *  options:
 *   - g_w  工资年增长率 (ex: 0.03)
 *   - inf  年通胀率 (ex: 0.0225)
 *   - targetReplacement 替代率 (ex: 0.70)
 *   - annuityDivisor 退休后折算除数 (ex: 139)
 */
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

  // Step 1: 退休前最后工资(Nominal)
  const futureWage = monthlyWage * Math.pow(1 + g_w, yearsToRetire);

  // Step 2: 退休时目标收入（名义）
  const targetNominal = futureWage * targetReplacement;

  // Step 3: 折现回今天的购买力
  const targetReal = targetNominal / Math.pow(1 + inf, yearsToRetire);

  const existingReal = pillar1TotalMonthly + pillar2Monthly;

  const gap = Math.max(0, targetReal - existingReal);

  // Step 4: 月存额（Real）
  const monthsToRetire = Math.max(1, yearsToRetire * 12);
  const monthlySaving = (gap * annuityDivisor) / monthsToRetire;

  return { gap, monthlySaving, targetReal, futureWage };
}
