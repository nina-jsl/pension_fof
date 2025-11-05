const DIVISOR_MAP = { 60: 139, 55: 170, 50: 195 };
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/**
 * 第一支柱统筹账户（以今天价格计）
 * pooling = (指数化月平均缴费工资 + 退休时社平) / 2 * (缴费年限 * 1%)
 */
function pillar1PoolingToday({ monthlyWage, socialAvgMonthly, yearsTotal }) {
  const payIndex = clamp(monthlyWage / Math.max(1e-9, socialAvgMonthly), 0.6, 3.0);
  const socialAvgAtRetire = socialAvgMonthly; // freeze to today's ¥ for clarity
  const indexedAvg = payIndex * socialAvgAtRetire;

  return ((indexedAvg + socialAvgAtRetire) / 2) * (yearsTotal * 0.01);
}

/**
 * 个人账户养老金余额（以今天价格计）
 */
function personalAccountBalanceToday({ monthlyWage, pastYears }) {
  const annualContrib = monthlyWage * 0.08 * 12;
  return annualContrib * Math.max(0, pastYears);
}

/**
 * 企业年金（月领取，今天价格计）
 */
function pillar2MonthlyToday({ monthlyWage, pastYears, pillar2Level, retirementAge }) {
  const rateMap = { none: 0.0, basic: 0.03, standard: 0.06, generous: 0.10 };
  const rate = rateMap[pillar2Level] ?? 0.0;

  const annualContrib = monthlyWage * rate * 12;
  const balance = annualContrib * Math.max(0, pastYears);

  const divisor = DIVISOR_MAP[retirementAge] ?? 139;
  return balance / divisor;
}

/**
 * 第一支柱：返回 { pooling, individual, total }
 */
export function computePillar1(
  monthlyWage,
  socialAvgMonthly,
  yearsWorked,
  age,
  retirementAge
) {
  const pastYears = Math.max(0, Number(yearsWorked) || 0);
  const yearsToRetire = Math.max(0, (retirementAge || 60) - (age || 0));
  const yearsTotal = pastYears + yearsToRetire;
  const divisor = DIVISOR_MAP[retirementAge] ?? 139;

  const pooling = pillar1PoolingToday({
    monthlyWage,
    socialAvgMonthly,
    yearsTotal,
  });

  const individual = personalAccountBalanceToday({
    monthlyWage,
    pastYears,
  }) / divisor;

  const total = pooling + individual;

  return { pooling, individual, total, years_past: pastYears, years_total: yearsTotal };
}

/**
 * 第二支柱：返回 { monthly, balance }
 */
export function computePillar2(
  monthlyWage,
  _socialAvgMonthly,
  yearsWorked,
  age,
  retirementAge,
  pillar2Level
) {
  const pastYears = Math.max(0, Number(yearsWorked) || 0);

  const monthly = pillar2MonthlyToday({
    monthlyWage,
    pastYears,
    pillar2Level,
    retirementAge,
  });

  const balance = monthly * (DIVISOR_MAP[retirementAge] ?? 139);

  return { monthly, balance };
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

  // Step 1: 退休前最后工资（名义）
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
