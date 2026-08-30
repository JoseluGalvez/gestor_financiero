export type StressPositionCategory = "market_priced" | "cash";

export type StressPositionInput = {
  id: string;
  label: string;
  category: StressPositionCategory;
  marketValueBase: number;
};

export type StressedPosition = StressPositionInput & {
  shockRate: number;
  changeBase: number;
  stressedValueBase: number;
  baselineWeightPct: number | null;
  stressedWeightPct: number | null;
};

export type MarketStressResult = {
  marketShockRate: number;
  baselineValueBase: number;
  stressedValueBase: number;
  changeBase: number;
  changePct: number | null;
  baselineHhi: number | null;
  stressedHhi: number | null;
  positions: StressedPosition[];
  warnings: string[];
};

function assertFiniteNonNegative(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${field} debe ser un número finito mayor o igual que cero.`);
  }
}

function calculateHhi(values: number[], total: number): number | null {
  if (total <= 0) return null;
  return values.reduce((sum, value) => sum + (value / total) ** 2, 0);
}

/**
 * Aplica un choque uniforme exclusivamente a posiciones `market_priced`.
 * El rango [-1, 1] representa una variación porcentual entre pérdida total
 * y subida del 100 %. No es un pronóstico ni un modelo de riesgo.
 */
export function applyUniformMarketShock(
  positions: StressPositionInput[],
  marketShockRate: number,
): MarketStressResult {
  if (!Number.isFinite(marketShockRate) || marketShockRate < -1 || marketShockRate > 1) {
    throw new RangeError("El choque de mercado debe ser un número finito entre −1 y 1.");
  }
  if (positions.length === 0) {
    throw new RangeError("El escenario requiere al menos una posición ficticia.");
  }

  const seen = new Set<string>();
  for (const position of positions) {
    if (!position.id.trim() || !position.label.trim()) {
      throw new RangeError("Cada posición debe incluir identificador y etiqueta.");
    }
    if (seen.has(position.id)) {
      throw new RangeError("Los identificadores de posición deben ser únicos.");
    }
    seen.add(position.id);
    assertFiniteNonNegative(position.marketValueBase, `El valor de ${position.label}`);
  }

  const baselineValueBase = positions.reduce((sum, position) => sum + position.marketValueBase, 0);
  const interim = positions.map((position) => {
    const shockRate = position.category === "market_priced" ? marketShockRate : 0;
    const changeBase = position.marketValueBase * shockRate;
    return {
      ...position,
      shockRate,
      changeBase,
      stressedValueBase: position.marketValueBase + changeBase,
    };
  });
  const stressedValueBase = interim.reduce((sum, position) => sum + position.stressedValueBase, 0);

  return {
    marketShockRate,
    baselineValueBase,
    stressedValueBase,
    changeBase: stressedValueBase - baselineValueBase,
    changePct: baselineValueBase > 0 ? (stressedValueBase - baselineValueBase) / baselineValueBase : null,
    baselineHhi: calculateHhi(positions.map((position) => position.marketValueBase), baselineValueBase),
    stressedHhi: calculateHhi(interim.map((position) => position.stressedValueBase), stressedValueBase),
    positions: interim.map((position) => ({
      ...position,
      baselineWeightPct: baselineValueBase > 0 ? (position.marketValueBase / baselineValueBase) * 100 : null,
      stressedWeightPct: stressedValueBase > 0 ? (position.stressedValueBase / stressedValueBase) * 100 : null,
    })),
    warnings: [
      "Escenario hipotético uniforme: no es una previsión ni estima probabilidades.",
      "No incluye correlaciones, FX, liquidez, crédito, derivados, costes ni impuestos.",
    ],
  };
}
