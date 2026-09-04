export type DCFProjection = {
  year: number;
  fcf: number;
  discountFactor: number;
  presentValue: number;
};

export type DCFResult = {
  freeCashFlows: DCFProjection[];
  terminalValue: number;
  terminalValuePresentValue: number;
  totalPresentValue: number;
  fairValuePerShare: number | null;
  assumptions: {
    terminalGrowthRate: number;
    wacc: number;
    sharesOutstanding: number | null;
    netDebt: number | null;
  };
  isValid: boolean;
  warnings: string[];
};

export type FCFInput = {
  year1: number;
  growthRates: number[];
  terminalGrowthRate: number;
  wacc: number;
  sharesOutstanding: number | null;
  netDebt: number | null;
};

const MIN_FCF_COUNT = 10;

export function calculateDCF(input: FCFInput): DCFResult {
  const warnings: string[] = [];

  if (input.growthRates.length < MIN_FCF_COUNT - 1) {
    warnings.push(`Se requieren al menos ${MIN_FCF_COUNT} proyecciones, se tienen ${input.growthRates.length + 1}.`);
  }

  if (input.terminalGrowthRate >= input.wacc) {
    warnings.push("La tasa de crecimiento terminal no puede ser superior o igual al WACC.");
  }

  if (input.wacc <= 0) {
    warnings.push("El WACC debe ser positivo.");
  }

  let fcf = input.year1;
  const freeCashFlows: DCFProjection[] = [];
  let year = 1;

  for (const growthRate of input.growthRates) {
    const discountFactor = Math.pow(1 + input.wacc, year);
    const presentValue = fcf / discountFactor;

    freeCashFlows.push({
      year,
      fcf,
      discountFactor: 1 / discountFactor,
      presentValue,
    });

    fcf = fcf * (1 + growthRate);
    year++;
  }

  const terminalFcf = freeCashFlows[freeCashFlows.length - 1]?.fcf ?? 0;
  const terminalValue = (terminalFcf * (1 + input.terminalGrowthRate)) / (input.wacc - input.terminalGrowthRate);

  if (terminalFcf <= 0) {
    warnings.push("El flujo de caja terminal no es positivo, el valor terminal puede no ser significativo.");
  }

  const terminalDiscountFactor = Math.pow(1 + input.wacc, freeCashFlows.length + 1);
  const terminalValuePresentValue = terminalValue / terminalDiscountFactor;

  const totalPresentValueOfFcf = freeCashFlows.reduce((sum, p) => sum + p.presentValue, 0);
  const totalPresentValue = totalPresentValueOfFcf + terminalValuePresentValue;

  const fairValuePerShare = input.sharesOutstanding !== null && input.netDebt !== null
    ? (totalPresentValue - input.netDebt) / input.sharesOutstanding
    : null;

  const isValid = warnings.length === 0 && input.wacc > input.terminalGrowthRate && fcf > 0;

  return {
    freeCashFlows,
    terminalValue,
    terminalValuePresentValue,
    totalPresentValue,
    fairValuePerShare,
    assumptions: {
      terminalGrowthRate: input.terminalGrowthRate,
      wacc: input.wacc,
      sharesOutstanding: input.sharesOutstanding,
      netDebt: input.netDebt,
    },
    isValid,
    warnings,
  };
}

export function formatDCFReport(result: DCFResult): string {
  let report = "=== DCF Valuation Report ===\n\n";

  report += "Proyecciones de Flujo de Caja:\n";
  for (const proj of result.freeCashFlows) {
    report += `  Año ${proj.year}: FCF = ${proj.fcf.toFixed(2)}, PV = ${proj.presentValue.toFixed(2)}\n`;
  }

  report += `\nValor Terminal: ${result.terminalValue.toFixed(2)}\n`;
  report += `Valor Terminal Presente: ${result.terminalValuePresentValue.toFixed(2)}\n`;
  report += `Valor Presente Total de FCF: ${result.totalPresentValue.toFixed(2)}\n`;

  if (result.fairValuePerShare !== null) {
    report += `Valor Justo por Acción: ${result.fairValuePerShare.toFixed(2)}\n`;
  }

  if (result.warnings.length > 0) {
    report += "\nAdvertencias:\n";
    for (const warning of result.warnings) {
      report += `  - ${warning}\n`;
    }
  }

  return report;
}