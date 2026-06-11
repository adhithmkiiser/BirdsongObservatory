// Statistical helper functions for species richness analysis

export interface StatsResult {
  meanLC: number;
  meanLI: number;
  sdLC: number;
  sdLI: number;
  nLC: number;
  nLI: number;
  difference: number;
  uStat: number | null;
  pValue: number | null;
  significance: string;
}

// Standard Normal Cumulative Distribution Function
function stdNormalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.39894228 * Math.exp(-x * x / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x >= 0 ? 1 - p : p;
}

export function calculateStats(lcValues: number[], liValues: number[]): StatsResult {
  const nLC = lcValues.length;
  const nLI = liValues.length;
  
  if (nLC === 0 || nLI === 0) {
    return {
      meanLC: 0, meanLI: 0, sdLC: 0, sdLI: 0, nLC: 0, nLI: 0, difference: 0,
      uStat: null, pValue: null, significance: 'No data'
    };
  }

  // Mean
  const meanLC = lcValues.reduce((a, b) => a + b, 0) / nLC;
  const meanLI = liValues.reduce((a, b) => a + b, 0) / nLI;
  const difference = meanLC - meanLI;

  // Standard Deviation
  const varianceLC = lcValues.reduce((a, b) => a + Math.pow(b - meanLC, 2), 0) / Math.max(1, nLC - 1);
  const varianceLI = liValues.reduce((a, b) => a + Math.pow(b - meanLI, 2), 0) / Math.max(1, nLI - 1);
  const sdLC = Math.sqrt(varianceLC);
  const sdLI = Math.sqrt(varianceLI);

  // Mann-Whitney U Test
  // 1. Combine and sort values with their group indicators
  const combined = [
    ...lcValues.map(v => ({ val: v, group: 'LC' })),
    ...liValues.map(v => ({ val: v, group: 'LI' }))
  ].sort((a, b) => a.val - b.val);

  // 2. Assign ranks (handle ties)
  let ranks: number[] = new Array(combined.length).fill(0);
  let i = 0;
  while (i < combined.length) {
    let j = i;
    while (j < combined.length && combined[j].val === combined[i].val) {
      j++;
    }
    // Rank range: i+1 to j
    // Average rank: ((i+1) + j) / 2
    const avgRank = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) {
      ranks[k] = avgRank;
    }
    i = j;
  }

  // 3. Sum ranks for LC group
  let rankSumLC = 0;
  for (let k = 0; k < combined.length; k++) {
    if (combined[k].group === 'LC') {
      rankSumLC += ranks[k];
    }
  }

  // 4. Calculate U statistic
  const uLC = nLC * nLI + (nLC * (nLC + 1)) / 2 - rankSumLC;
  const uLI = nLC * nLI - uLC;
  const uStat = Math.min(uLC, uLI);

  // 5. Calculate p-value using normal approximation (standard for U-test)
  const meanU = (nLC * nLI) / 2;
  const sdU = Math.sqrt((nLC * nLI * (nLC + nLI + 1)) / 12);
  
  let pValue: number | null = null;
  let significance = 'ns';
  
  if (sdU > 0) {
    // Continuity correction
    const z = (uStat - meanU + 0.5) / sdU;
    pValue = 2 * stdNormalCDF(z);
    
    if (pValue < 0.001) significance = '***';
    else if (pValue < 0.01) significance = '**';
    else if (pValue < 0.05) significance = '*';
    else significance = `ns (p=${pValue.toFixed(3)})`;
  }

  return {
    meanLC,
    meanLI,
    sdLC,
    sdLI,
    nLC,
    nLI,
    difference,
    uStat,
    pValue,
    significance
  };
}
