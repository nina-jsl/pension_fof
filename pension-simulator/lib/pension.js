// src/lib/pension.js

// --- Helpers ---
const DIVISOR_MAP = { 60: 139, 55: 170, 50: 195 };
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/**
 * 基础养老金（统筹账户）
 * pooling = (指数化月平均缴费工资 + 退休时社平) / 2 * (缴费年限 * 1%)
 * Here we freeze 社平工资 growth to keep numbers in today's ¥.
 */
function pillar1PoolingToday({
  monthlyWage,
  socialAvgMonthly,
  yearsTotal,
}) {
  // 缴费指数（法定 0.6~3.0）
  const payIndex = clamp(monthlyWage / Math.max(1e-9, socialAvgMonthly), 0.6, 3.0);

  // Freeze social average at today's level (no growth) for “today’s ¥”
  const socialAvgAtRetire = socialAvgMonthly; // growth = 0
  const indexedAvg = payIndex * socialAvgAtRetire;

  const pooling = ((indexedAvg + socialAvgAtRetire) / 2) * (yearsTotal * 0.01);
  return pooling;
}

/**
 * 个人账户余额（今天的¥表达）
 * Only count past contributions, no wage growth, no account credit.
 */
function personalAccountBalanceToday({
  monthlyWage,
  pastYears,
}) {
  // Contribution each year: 8% * 12 months
  const annualContrib = monthlyWage * 0.08 * 12;
  return annualContrib * Math.max(0, pastYears);
}

/**
 * 企业年金（今天的¥表达）
 * Only count past contributions, no wage growth, no fund return.
 */
function pillar2MonthlyToday({
  monthlyWage,
  pastYears,
  pillar2Level, // 'none' | 'basic' | 'standard' | 'generous'
  retirementAge,
}) {
  const rateMap = { none: 0.0, basic: 0.03, standard: 0.06, generous: 0.10 };
  const rate = rateMap[pillar2Level] ?? 0.0;
  const annualContrib = monthlyWage * rate * 12;
  const balance = annualContrib * Math.max(0, pastYears);

  const divisor = DIVISOR_MAP[retirementAge] ?? 139;
  return balance / divisor;
}

/**
 * Pillar 1: returns { pooling, individual, total }
 * Inputs are current (today's) ¥; output is monthly ¥ in today's prices.
 */
export function computePillar1(
  monthlyWage,
  socialAvgMonthly,
  yearsWorked, // past years contributed
  age,
  retirementAge
) {
  const pastYears = Math.max(0, Number(yearsWorked) || 0);
  const yearsToRetire = Math.max(0, (Number(retirementAge) || 60) - (Number(age) || 0));
  const yearsTotal = pastYears + yearsToRetire;

  const divisor = DIVISOR_MAP[retirementAge] ?? 139;

  // 基础养老金（统筹）
  const pooling = pillar1PoolingToday({
    monthlyWage: Number(monthlyWage) || 0,
    socialAvgMonthly: Number(socialAvgMonthly) || 0,
    yearsTotal,
  });

  // 个人账户养老金（按余额/除数）
  const individualMonthly =
    personalAccountBalanceToday({
      monthlyWage: Number(monthlyWage) || 0,
      pastYears,
    }) / divisor;

  const total = pooling + individualMonthly;
  return {
    pooling,
    individual: individualMonthly,
    total,
    years_past: pastYears,
    years_total: yearsTotal,
  };
}

/**
 * Pillar 2: returns { monthly, balance }
 * Inputs are current (today's) ¥; output is monthly ¥ in today's prices.
 */
export function computePillar2(
  monthlyWage,
  _socialAvgMonthly, // not needed here but kept for identical signature
  yearsWorked,
  age,
  retirementAge,
  pillar2Level
) {
  const pastYears = Math.max(0, Number(yearsWorked) || 0);

  const monthly = pillar2MonthlyToday({
    monthlyWage: Number(monthlyWage) || 0,
    pastYears,
    pillar2Level,
    retirementAge,
  });

  // Optional: expose the not-yet-annuitized balance for display/debug
  const balance = monthly * (DIVISOR_MAP[retirementAge] ?? 139);

  return { monthly, balance };
}

/**
 * Pillar 3 gap & suggested saving:
 * Target = 70% income replacement of current monthly wage (today's ¥).
 * gap = max(0, target - (pillar1_total + pillar2_monthly))
 * For a simple, conservative “enough and not wrong” calculator:
 * monthlySaving ≈ gap * divisor / monthsToRetire
 *  - assumes zero growth on savings and same annuity divisor at retirement
 */
export function computePillar3Gap(
  monthlyWage,
  age,
  retirementAge,
  pillar1TotalMonthly,
  pillar2Monthly
) {
  const target = 0.7 * (Number(monthlyWage) || 0);
  const existing = (Number(pillar1TotalMonthly) || 0) + (Number(pillar2Monthly) || 0);
  const gap = Math.max(0, target - existing);

  const yearsToRetire = Math.max(0, (Number(retirementAge) || 60) - (Number(age) || 0));
  const monthsToRetire = Math.max(1, Math.round(yearsToRetire * 12)); // avoid divide-by-zero
  const divisor = DIVISOR_MAP[retirementAge] ?? 139;

  // Very conservative, transparent formula (no returns assumed)
  const monthlySaving = (gap * divisor) / monthsToRetire;

  return { gap, monthlySaving, target };
}
