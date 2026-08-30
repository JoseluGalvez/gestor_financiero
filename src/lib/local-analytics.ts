import { csvFromRows } from "./csv-security.ts";

export type LocalColumnMapping = {
  date: string;
  value: string;
  category: string;
  platform: string;
  geography: string;
  status: string;
};

export type LocalRecord = {
  id: string;
  date: string;
  value: number;
  category: string;
  platform: string;
  geography: string;
  status: string;
  raw: Record<string, string>;
};

export type CanvasFilters = {
  from: string;
  to: string;
  category: string;
  platform: string;
  geography: string;
};

export type CanvasAnalysis = {
  filtered: LocalRecord[];
  kpis: { total: number; count: number; average: number; change: number | null };
  timeline: Array<{ label: string; value: number }>;
  categories: Array<{ name: string; value: number }>;
  platforms: Array<{ name: string; value: number }>;
  geographies: Array<{ name: string; value: number }>;
  insights: string[];
};

const empty = "Sin clasificar";

export function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

export function parseNumber(value: unknown) {
  const clean = cleanText(value).replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".").replace(/[^0-9.-]/g, "");
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : 0;
}

function validLocalIsoDate(year: string, month: string, day: string) {
  const yearNumber = Number(year);
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  const date = new Date(Date.UTC(yearNumber, monthNumber - 1, dayNumber));
  if (date.getUTCFullYear() !== yearNumber || date.getUTCMonth() !== monthNumber - 1 || date.getUTCDate() !== dayNumber) return "";
  return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function normalizeLocalDate(value: string) {
  const iso = value.match(/^(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?$/);
  if (iso) return validLocalIsoDate(iso[1], iso[2], iso[3] ?? "01");
  const european = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (european) return validLocalIsoDate(european[3], european[2], european[1]);
  return "";
}

export function validateLocalCell(field: keyof LocalColumnMapping, value: string) {
  const text = cleanText(value);
  if (field === "date") {
    if (!text) return "La fecha no puede estar vacía.";
    return normalizeLocalDate(text) ? "" : "Usa YYYY-MM-DD o DD/MM/AAAA.";
  }
  if (field === "value") {
    if (!text) return "El importe no puede estar vacío.";
    if (!/^[+-]?(?:\d{1,3}(?:[.\s]\d{3})*|\d+)(?:[,.]\d+)?$/.test(text)) return "Introduce un número válido, por ejemplo 1250,50.";
    return Number.isFinite(parseNumber(text)) ? "" : "El importe debe ser finito.";
  }
  if (text.length > 160) return "El texto no puede superar 160 caracteres.";
  if(/[\u0000-\u001F\u007F]/.test(text)) return "El texto contiene caracteres de control no permitidos.";
  return "";
}

export function detectMapping(headers: string[]): LocalColumnMapping {
  const candidate = (patterns: RegExp[]) => headers.find((header) => patterns.some((pattern) => pattern.test(header.toLocaleLowerCase("es-ES")))) ?? "";
  return {
    date: candidate([/fecha/, /date/, /periodo/, /mes/]),
    value: candidate([/importe/, /valor/, /amount/, /precio/, /revenue/, /ingreso/, /coste/]),
    category: candidate([/categoria/, /category/, /instrumento/, /activo/, /familia/, /tipo/]),
    platform: candidate([/plataforma/, /platform/, /broker/, /canal/, /fuente/]),
    geography: candidate([/pais/, /pa.s/, /region/, /zona/, /geograf/]),
    status: candidate([/estado/, /status/, /situacion/]),
  };
}

export function recordFromRaw(id: string, raw: Record<string, string>, mapping: LocalColumnMapping): LocalRecord {
  return {
    id,
    date: raw[mapping.date] || "Sin fecha",
    value: parseNumber(raw[mapping.value]),
    category: raw[mapping.category] || empty,
    platform: raw[mapping.platform] || empty,
    geography: raw[mapping.geography] || empty,
    status: raw[mapping.status] || empty,
    raw,
  };
}

export function recordsFromMatrix(headers: string[], rows: Array<Array<unknown>>, mapping: LocalColumnMapping): LocalRecord[] {
  return rows.map((row, index) => {
    const raw = Object.fromEntries(headers.map((header, column) => [header, cleanText(row[column])]));
    return recordFromRaw(`${index}-${raw[mapping.date] ?? ""}-${raw[mapping.value] ?? ""}`, raw, mapping);
  }).filter((record) => Object.values(record.raw).some(Boolean));
}

function group(records: LocalRecord[], property: "category" | "platform" | "geography") {
  const items = new Map<string, number>();
  records.forEach((record) => items.set(record[property], (items.get(record[property]) ?? 0) + record.value));
  return [...items.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function timelineLabel(value: string) {
  const normalized = normalizeLocalDate(value);
  return normalized ? normalized.slice(0, 7) : "Sin fecha";
}

export function analyzeRecords(records: LocalRecord[], filters: CanvasFilters): CanvasAnalysis {
  const filtered = records.filter((record) => {
    const date = normalizeLocalDate(record.date);
    return (!filters.from || (date && date >= filters.from)) && (!filters.to || (date && date <= filters.to)) &&
      (!filters.category || record.category === filters.category) &&
      (!filters.platform || record.platform === filters.platform) &&
      (!filters.geography || record.geography === filters.geography);
  });
  const total = filtered.reduce((sum, record) => sum + record.value, 0);
  const timelineMap = new Map<string, number>();
  filtered.forEach((record) => {
    const label = timelineLabel(record.date);
    timelineMap.set(label, (timelineMap.get(label) ?? 0) + record.value);
  });
  const timeline = [...timelineMap.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => a.label.localeCompare(b.label));
  const previous = timeline.length > 1 ? timeline.at(-2)?.value ?? 0 : null;
  const last = timeline.at(-1)?.value ?? null;
  const change = previous !== null && previous !== 0 && last !== null ? ((last - previous) / Math.abs(previous)) * 100 : null;
  const categories = group(filtered, "category");
  const platforms = group(filtered, "platform");
  const geographies = group(filtered, "geography");
  const insights: string[] = [];
  if (categories[0]) insights.push(`${categories[0].name} concentra ${((categories[0].value / (total || 1)) * 100).toFixed(1)} % del valor filtrado.`);
  if (platforms[0] && platforms.length > 1) insights.push(`${platforms[0].name} es la plataforma con mayor exposición en la selección actual.`);
  if (change !== null) insights.push(`La última ventana temporal varía ${change >= 0 ? "+" : ""}${change.toFixed(1)} % frente a la anterior.`);
  if (geographies.length > 3) insights.push(`La selección abarca ${geographies.length} geografías; revisa concentración antes de tomar decisiones.`);
  if (!insights.length) insights.push("Carga un archivo local y asigna columnas para generar una lectura ejecutiva basada únicamente en el conjunto abierto en esta pestaña.");
  return { filtered, kpis: { total, count: filtered.length, average: filtered.length ? total / filtered.length : 0, change }, timeline, categories, platforms, geographies, insights };
}

export function uniqueValues(records: LocalRecord[], key: "category" | "platform" | "geography") {
  return [...new Set(records.map((record) => record[key]).filter((item) => item !== empty))].sort((a, b) => a.localeCompare(b));
}

export function csvFromRecords(records: LocalRecord[]) {
  const headers = ["Fecha", "Instrumento/Categoría", "Plataforma", "Geografía", "Estado", "Valor"];
  return csvFromRows([headers, ...records.map((record) => [record.date, record.category, record.platform, record.geography, record.status, record.value])]);
}
