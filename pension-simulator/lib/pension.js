// helpers
const DIVISOR_MAP = { 60: 139, 55: 170, 50: 195 };
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const geomSumForward = (n, r) =>
  n <= 0 ? 0 : Math.abs(r) < 1e-9 ? n : ((1 + r) ** (n + 1) - (1 + r)) / r;
const geomSumBackward = (n, r) =>
  n <= 0 ? 0 : Math.abs(r) < 1e-9 ? n : (1 - (1 + r) ** -n) / r;
const sumPow = (n, a) =>
  n <= 0 ? 0 : Math.abs(a - 1) < 1e-9 ? n * a : (a * (1 - a ** n)) / (1 - a);

/** Utility: get annuity divisor */
export function getAnnuityDivisor(retirementAge = 60) {
  return DIVISOR_MAP[Number(retirementAge)] ?? 139;
}

/**
 * Scenario:
 * Convert constant real saving → future payout (in today's prices)
 */
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
  const fv =
    Math.abs(rm) < 1e-9 ? pmt * n : pmt * (((1 + rm) ** n - 1) / rm);

  return fv / Math.max(1, Number(annuityDivisor) || 139);
}

/**
 * Pillar 1 = 基础养老金 pooling + 个人账户
 *
 * 🚨 FIX: We now use ONLY past years (NO future accrual)
 */

// Pooling Calculation (use only pastYears)
function pillar1PoolingToday({ monthlyWage, socialAvgMonthly, yearsTotal }) {
  const payIndex = clamp(
    Number(monthlyWage) / Math.max(1e-9, Number(socialAvgMonthly)),
    0.6,
    3.0
  );
  const sa = Number(socialAvgMonthly) || 0;
  return ((payIndex * sa + sa) / 2) * (Math.max(0, yearsTotal) * 0.01);
}

// Personal Account: FIX → only past, no future
function personalAccountMonthlyToday({
  monthlyWage,
  yearsWorked,
  g_w = 0.0,
  credit_rate = 0.0,
  divisor,
}) {
  const wage0 = Number(monthlyWage) || 0;
  const Yp = Math.max(0, Number(yearsWorked) || 0);

  const base = wage0 * 0.08 * 12; // personal account yearly contribution

  // No future contributions
  if (Math.abs(credit_rate) < 1e-9) {
    const past = base * geomSumBackward(Yp, g_w);
    return past / divisor;
  }

  // If crediting is used (rare)
  const aPast = (1 + credit_rate) / (1 + g_w);
  const pastGrown =
    base *
    (1 + credit_rate) ** 0 * // no future years => exponent simplified
    sumPow(Yp, aPast);

  return pastGrown / divisor;
}

/**
 * Pillar 2 (企业年金)
 * 🚨 FIX: We now calculate using ONLY past contributions
 */
function pillar2MonthlyToday({
  monthlyWage,
  yearsWorked,
  pillar2Level,
  retirementAge,
  g_w = 0.0,
  credit_rate = 0.0,
}) {
  const rateMap = { none: 0.0, basic: 0.03, standard: 0.06, generous: 0.1 };
  const rate = rateMap[pillar2Level] ?? 0.0;
  const divisor = DIVISOR_MAP[retirementAge] ?? 139;

  const wage0 = Number(monthlyWage) || 0;
  const Yp = Math.max(0, Number(yearsWorked) || 0);
  const base = wage0 * rate * 12;

  // no future contribution
  if (Math.abs(credit_rate) < 1e-9) {
    const past = base * geomSumBackward(Yp, g_w);
    return past / divisor;
  }

  const aPast = (1 + credit_rate) / (1 + g_w);
  const pastGrown = base * sumPow(Yp, aPast);

  return pastGrown / divisor;
}

/** ===============================
 *   Public API (exports)
 *  ===============================
 */

// Pillar 1: past-only
export function computePillar1(
  monthlyWage,
  socialAvgMonthly,
  yearsWorked,
  _age,            // unused in past-only version
  retirementAge,
  { g_w = 0.0, credit_rate = 0.0 } = {}
) {
  const pastYears = Math.max(0, Number(yearsWorked) || 0);
  const divisor = DIVISOR_MAP[retirementAge] ?? 139;

  const pooling = pillar1PoolingToday({
    monthlyWage,
    socialAvgMonthly,
    yearsTotal: pastYears, // ONLY past years
  });

  const individual = personalAccountMonthlyToday({
    monthlyWage,
    yearsWorked: pastYears,
    g_w,
    credit_rate,
    divisor,
  });

  return {
    pooling,
    individual,
    total: individual,
    years_past: pastYears,
    years_total: pastYears,
  };
}

// Pillar 2: past-only
export function computePillar2(
  monthlyWage,
  _socialAvgMonthly,
  yearsWorked,
  _age, // unused now
  retirementAge,
  pillar2Level,
  { g_w = 0.0, credit_rate = 0.0 } = {}
) {
  const pastYears = Math.max(0, Number(yearsWorked) || 0);

  const monthly = pillar2MonthlyToday({
    monthlyWage,
    yearsWorked: pastYears,
    pillar2Level,
    retirementAge,
    g_w,
    credit_rate,
  });

  const divisor = DIVISOR_MAP[retirementAge] ?? 139;
  return { monthly, balance: monthly * divisor };
}

/**
 * Pillar 3 gap: unchanged
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

  // Step 1: future nominal wage
  const futureWage = monthlyWage * Math.pow(1 + g_w, yearsToRetire);

  // Step 2: target nominal income at retirement
  const targetNominal = futureWage * targetReplacement;

  // Step 3: discount to today
  const targetReal = targetNominal / Math.pow(1 + inf, yearsToRetire);

  const existingReal = pillar1TotalMonthly + pillar2Monthly;

  const gap = Math.max(0, targetReal - existingReal);

  const monthsToRetire = Math.max(1, yearsToRetire * 12);
  const monthlySaving = (gap * annuityDivisor) / monthsToRetire;

  return { gap, monthlySaving, targetReal, futureWage };
}
