import { csvFromRows } from "./csv-security.ts";

export type CryptoAction = "buy" | "sell" | "swap" | "unknown";

export type CryptoOperation = {
  id: string;
  rowNumber: number;
  date: string;
  action: CryptoAction;
  asset: string;
  quantity: number;
  receivedAsset: string;
  receivedQuantity: number;
  eurValue: number;
  receivedEurValue: number;
  fees: number;
  platform: string;
  warnings: string[];
};

export type CryptoTaxLine = {
  id: string;
  date: string;
  action: "sell" | "swap";
  asset: string;
  quantity: number;
  receivedAsset: string;
  transmissionValue: number;
  acquisitionValue: number | null;
  fees: number;
  result: number | null;
  warning: string | null;
};

export type CryptoTaxResult = {
  operations: CryptoOperation[];
  lines: CryptoTaxLine[];
  summary: {
    gains: number;
    losses: number;
    netResult: number;
    confirmedLines: number;
    reviewLines: number;
    unsupportedRows: number;
  };
  warnings: string[];
  holdings: Array<{ asset: string; quantity: number; cost: number }>;
};

type Lot = { quantity: number; cost: number };
type CsvMatrix = string[][];

type HeaderMapping = {
  date: string;
  action: string;
  asset: string;
  quantity: string;
  receivedAsset: string;
  receivedQuantity: string;
  eurValue: string;
  receivedEurValue: string;
  fees: string;
  platform: string;
};


function clean(value: unknown) {
  return String(value ?? "").trim();
}

export function parseCryptoNumber(value: unknown) {
  const source = clean(value).replace(/\s/g, "");
  if (!source) return 0;
  const normalized = source.includes(",") && source.includes(".")
    ? source.replace(/\./g, "").replace(",", ".")
    : source.replace(",", ".");
  const parsed = Number(normalized.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseCryptoCsv(text: string): CsvMatrix {
  const rows: CsvMatrix = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; index += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if ((char === "," || char === ";") && !quoted) { row.push(cell.trim()); cell = ""; continue; }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalizeHeader(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Devuelve la fecha ISO solo si representa un día real del calendario gregoriano. */
export function normalizeCryptoIsoDate(value: string) {
  const match = clean(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  const [, year, month, day] = match;
  const normalized = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (normalized.getUTCFullYear() !== Number(year) || normalized.getUTCMonth() !== Number(month) - 1 || normalized.getUTCDate() !== Number(day)) return "";
  return `${year}-${month}-${day}`;
}

function headerFor(headers: string[], patterns: string[]) {
  return headers.find((header) => patterns.some((pattern) => normalizeHeader(header).includes(pattern))) ?? "";
}

function detectHeaders(headers: string[]): HeaderMapping {
  return {
    date: headerFor(headers, ["fecha", "date"]),
    action: headerFor(headers, ["tipo", "operacion", "accion", "action"]),
    asset: headerFor(headers, ["activoentregado", "activo", "moneda", "asset", "crypto"]),
    quantity: headerFor(headers, ["cantidadentregada", "cantidad", "unidades", "quantity"]),
    receivedAsset: headerFor(headers, ["activorecibido", "monedarecibida", "contrapartida", "receivedasset"]),
    receivedQuantity: headerFor(headers, ["cantidadrecibida", "unidadesrecibidas", "receivedquantity"]),
    eurValue: headerFor(headers, ["valoreurentregado", "valoreur", "importeureur", "importe"]),
    receivedEurValue: headerFor(headers, ["valoreurrecibido", "receivedeurvalue"]),
    fees: headerFor(headers, ["comisioneseur", "comisiones", "fees", "fee"]),
    platform: headerFor(headers, ["plataforma", "exchange", "broker", "custodio"]),
  };
}

function normalizeAction(value: string): CryptoAction {
  const action = normalizeHeader(value);
  if (["compra", "buy", "adquisicion", "adquirir", "inicial"].some((item) => action.includes(item))) return "buy";
  if (["venta", "sell", "disposicion", "vender"].some((item) => action.includes(item))) return "sell";
  if (["permuta", "swap", "intercambio", "exchange"].some((item) => action.includes(item))) return "swap";
  return "unknown";
}

function csvValue(row: string[], headers: string[], header: string) {
  const index = headers.indexOf(header);
  return index >= 0 ? row[index] ?? "" : "";
}

export function operationsFromCsv(text: string): { operations: CryptoOperation[]; warnings: string[] } {
  const matrix = parseCryptoCsv(text);
  if (matrix.length < 2) return { operations: [], warnings: ["El CSV necesita una fila de encabezados y al menos una operación."] };
  const headers = matrix[0].map(clean);
  const mapping = detectHeaders(headers);
  const missing = ([
    ["Fecha", mapping.date],
    ["Tipo", mapping.action],
    ["Activo entregado", mapping.asset],
    ["Cantidad entregada", mapping.quantity],
    ["Valor EUR entregado", mapping.eurValue],
  ] as Array<[string, string]>).filter(([, header]) => !header).map(([label]) => label);
  const warnings = missing.length ? [`No se detectaron las columnas obligatorias: ${missing.join(", ")}. Descarga la plantilla o adapta los encabezados.`] : [];
  const operations = matrix.slice(1).map((row, index) => {
    const sourceDate = clean(csvValue(row, headers, mapping.date));
    const normalizedDate = normalizeCryptoIsoDate(sourceDate);
    const date = normalizedDate || sourceDate;
    const action = normalizeAction(clean(csvValue(row, headers, mapping.action)));
    const asset = clean(csvValue(row, headers, mapping.asset)).toUpperCase();
    const quantity = parseCryptoNumber(csvValue(row, headers, mapping.quantity));
    const receivedAsset = clean(csvValue(row, headers, mapping.receivedAsset)).toUpperCase();
    const receivedQuantity = parseCryptoNumber(csvValue(row, headers, mapping.receivedQuantity));
    const eurValue = parseCryptoNumber(csvValue(row, headers, mapping.eurValue));
    const receivedEurValue = parseCryptoNumber(csvValue(row, headers, mapping.receivedEurValue));
    const fees = parseCryptoNumber(csvValue(row, headers, mapping.fees));
    const rowWarnings: string[] = [];
    if (!normalizedDate) rowWarnings.push("La fecha debe usar AAAA-MM-DD y representar un día real del calendario.");
    if (action === "unknown") rowWarnings.push("Tipo no reconocido. Usa Compra, Venta o Permuta.");
    if (!asset) rowWarnings.push("Falta el activo entregado.");
    if (quantity <= 0) rowWarnings.push("La cantidad entregada debe ser mayor que cero.");
    if ((action === "sell" || action === "swap") && eurValue <= 0 && receivedEurValue <= 0) rowWarnings.push("Falta un valor de mercado en EUR para valorar la transmisión.");
    if (action === "swap" && (!receivedAsset || receivedQuantity <= 0)) rowWarnings.push("Una permuta necesita activo y cantidad recibidos.");
    return { id: `crypto-${index + 1}`, rowNumber: index + 2, date, action, asset, quantity, receivedAsset, receivedQuantity, eurValue, receivedEurValue, fees, platform: clean(csvValue(row, headers, mapping.platform)) || "Sin plataforma", warnings: rowWarnings };
  }).filter((operation) => [operation.date, operation.asset, operation.quantity, operation.action].some(Boolean));
  return { operations, warnings };
}

function consumeLots(lots: Lot[], quantity: number) {
  const available = lots.reduce((total, lot) => total + lot.quantity, 0);
  if (available + 1e-10 < quantity) {
    return { cost: 0, missing: quantity - available };
  }

  let remaining = quantity;
  let cost = 0;
  while (remaining > 1e-10 && lots.length) {
    const lot = lots[0];
    const consumed = Math.min(remaining, lot.quantity);
    const portion = lot.cost * (consumed / lot.quantity);
    lot.quantity -= consumed;
    lot.cost -= portion;
    remaining -= consumed;
    cost += portion;
    if (lot.quantity <= 1e-10) lots.shift();
  }
  return { cost, missing: 0 };
}

export function calculateCryptoTax(operations: CryptoOperation[]): CryptoTaxResult {
  const lotsByAsset = new Map<string, Lot[]>();
  const lines: CryptoTaxLine[] = [];
  const globalWarnings: string[] = [];
  let unsupportedRows = 0;

  const ordered = [...operations].sort((left, right) => left.date.localeCompare(right.date) || left.rowNumber - right.rowNumber);
  ordered.forEach((operation) => {
    const operationWarning = operation.warnings[0] ?? null;
    if (operation.warnings.length) {
      unsupportedRows += 1;
      if (operation.action !== "buy" && operation.action !== "sell" && operation.action !== "swap") return;
    }
    const lots = lotsByAsset.get(operation.asset) ?? [];
    lotsByAsset.set(operation.asset, lots);
    if (operation.action === "buy") {
      if (operation.warnings.length) return;
      lots.push({ quantity: operation.quantity, cost: operation.eurValue + operation.fees });
      return;
    }
    if (operation.action === "sell" || operation.action === "swap") {
      const referenceValue = operation.action === "swap" ? Math.max(operation.eurValue, operation.receivedEurValue) : operation.eurValue;
      const consumed = operationWarning ? { cost: 0, missing: operation.quantity } : consumeLots(lots, operation.quantity);
      const lineWarning = operationWarning ?? (consumed.missing > 1e-10 ? `Faltan lotes FIFO por ${consumed.missing.toFixed(10)} ${operation.asset}. Añade las compras o el saldo inicial histórico.` : null);
      const transmissionValue = Math.max(0, referenceValue - operation.fees);
      const result = lineWarning ? null : transmissionValue - consumed.cost;
      lines.push({ id: operation.id, date: operation.date, action: operation.action, asset: operation.asset, quantity: operation.quantity, receivedAsset: operation.receivedAsset, transmissionValue, acquisitionValue: lineWarning ? null : consumed.cost, fees: operation.fees, result, warning: lineWarning });
      if (operation.action === "swap" && !lineWarning) {
        const receivedLots = lotsByAsset.get(operation.receivedAsset) ?? [];
        receivedLots.push({ quantity: operation.receivedQuantity, cost: referenceValue });
        lotsByAsset.set(operation.receivedAsset, receivedLots);
      }
    }
  });

  const confirmed = lines.filter((line) => line.result !== null);
  const gains = confirmed.filter((line) => (line.result ?? 0) > 0).reduce((total, line) => total + (line.result ?? 0), 0);
  const losses = confirmed.filter((line) => (line.result ?? 0) < 0).reduce((total, line) => total + (line.result ?? 0), 0);
  if (lines.some((line) => line.warning)) globalWarnings.push("Hay transmisiones sin cálculo confirmado. Completa los lotes históricos, fechas, cantidades o valores de mercado antes de usar el borrador.");
  if (operations.some((operation) => operation.action === "swap" && operation.fees > 0)) globalWarnings.push("Las comisiones de permuta se han restado del valor de transmisión; revisa su imputación documental antes de presentar la declaración.");
  if (!operations.some((operation) => operation.action === "buy")) globalWarnings.push("El archivo no contiene compras ni saldo inicial. Un CSV solo con ventas o permutas no permite reconstruir el FIFO completo.");
  const holdings = [...lotsByAsset.entries()].map(([asset, lots]) => ({ asset, quantity: lots.reduce((sum, lot) => sum + lot.quantity, 0), cost: lots.reduce((sum, lot) => sum + lot.cost, 0) })).filter((item) => item.quantity > 1e-10).sort((left, right) => left.asset.localeCompare(right.asset));
  return { operations, lines, summary: { gains, losses, netResult: gains + losses, confirmedLines: confirmed.length, reviewLines: lines.length - confirmed.length, unsupportedRows }, warnings: globalWarnings, holdings };
}

export function cryptoTemplateCsv() {
  return csvFromRows([["Fecha", "Tipo", "Activo entregado", "Cantidad entregada", "Activo recibido", "Cantidad recibida", "Valor EUR entregado", "Valor EUR recibido", "Comisiones EUR", "Plataforma"]]);
}

export function cryptoDraftCsv(result: CryptoTaxResult, year: string) {
  const rows: Array<Array<string | number | null>> = [
    ["Borrador de revisión fiscal de criptoactivos", "Ejercicio", year],
    ["Estado", result.summary.reviewLines ? "REVISAR" : "CÁLCULO LOCAL COMPLETO"],
    ["Ganancias confirmadas EUR", result.summary.gains],
    ["Pérdidas confirmadas EUR", result.summary.losses],
    ["Resultado neto confirmado EUR", result.summary.netResult],
    [],
    ["Fecha", "Operación", "Activo entregado", "Cantidad", "Activo recibido", "Valor transmisión EUR", "Valor adquisición FIFO EUR", "Comisiones EUR", "Ganancia/Pérdida EUR", "Advertencia"],
    ...result.lines.map((line) => [line.date, line.action === "sell" ? "Venta" : "Permuta", line.asset, line.quantity, line.receivedAsset, line.transmissionValue, line.acquisitionValue, line.fees, line.result, line.warning]),
    [],
    ["AVISO", "Borrador de trabajo local. No constituye una declaración Modelo 100 ni se presenta ante la AEAT. Revise valores de mercado, comisiones, lotes FIFO y el resto de circunstancias fiscales antes de usarlo."],
  ];
  return csvFromRows(rows);
}
