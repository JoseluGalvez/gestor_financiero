export type KellyScenario = {
  probabilityWin: number;
  payoffLoss: number;
  payoffWin: number;
  edge: number;
};

export type KellyResult = {
  fullKelly: number;
  fraction: number;
  winEdge: number;
  lossEdge: number;
  isWinning: boolean;
  warnings: string[];
};

export type KellyInputs = {
  scenarios?: KellyScenario[];
  winRate?: number;
  payoffRatio?: number;
};

export function calculateKelly(
  winRate: number,
  payoffRatio: number,
): number {
  if (winRate <= 0 || winRate >= 1) return 0;
  if (payoffRatio <= 0) return 0;

  const lossRate = 1 - winRate;
  const kelly = winRate - lossRate / payoffRatio;

  return Math.max(0, kelly);
}

export function calculateKellyFromScenario(scenario: KellyScenario): number {
  if (scenario.payoffWin <= 0 || scenario.payoffLoss <= 0) return 0;
  return scenario.probabilityWin - (1 - scenario.probabilityWin) * (scenario.payoffLoss / scenario.payoffWin);
}

export function calculateConservativeKelly(fullKelly: number, reductionFactor: number = 0.5): number {
  return fullKelly * reductionFactor;
}

export function analyzeKelly(inputs: KellyInputs): KellyResult {
  const warnings: string[] = [];

  if (inputs.scenarios && inputs.scenarios.length > 0) {
    const averageWinEdge = inputs.scenarios.reduce((sum, s) => sum + s.payoffWin, 0) / inputs.scenarios.length;
    const averageLossEdge = inputs.scenarios.reduce((sum, s) => sum + s.payoffLoss, 0) / inputs.scenarios.length;

    const winRate = inputs.scenarios.reduce((sum, s) => sum + s.probabilityWin, 0) / inputs.scenarios.length;
    const payoffRatio = averageWinEdge / averageLossEdge;

    const fullKelly = calculateKelly(winRate, payoffRatio);
    const fraction = calculateConservativeKelly(fullKelly);

    const isWinning = fullKelly > 0;

    if (fraction > 1) {
      warnings.push("Kelly sugiere posición mayor al 100%, se usa fracción conservadora.");
    }

    return {
      fullKelly,
      fraction,
      winEdge: averageWinEdge,
      lossEdge: averageLossEdge,
      isWinning,
      warnings,
    };
  }

  if (inputs.winRate === undefined || inputs.payoffRatio === undefined) {
    warnings.push("Se requieren winRate y payoffRatio o escenarios.");
    return {
      fullKelly: 0,
      fraction: 0,
      winEdge: 0,
      lossEdge: 0,
      isWinning: false,
      warnings,
    };
  }

  const fullKelly = calculateKelly(inputs.winRate, inputs.payoffRatio);
  const fraction = calculateConservativeKelly(fullKelly);

  const isWinning = fullKelly > 0;

  if (fraction > 1) {
    warnings.push("Kelly sugiere posición mayor al 100%.");
  }

  return {
    fullKelly,
    fraction,
    winEdge: inputs.payoffRatio,
    lossEdge: 1,
    isWinning,
    warnings,
  };
}

export function formatKellyRecommendation(result: KellyResult, capital: number): string {
  if (!result.isWinning) {
    return "El escenario no es favorable para inversión según Kelly.";
  }

  const positionSize = capital * result.fraction;
  const fractionalPercent = result.fraction * 100;

  return `Recomendación Kelly: Utiliza el ${fractionalPercent.toFixed(1)}% de tu capital disponible (${positionSize.toFixed(2)} sobre ${capital.toFixed(2)}).`;
}