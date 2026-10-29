import { csvFromRows } from "@/lib/csv-security";

export type BudgetEntryKind = "income" | "expense";

export type BudgetEntry = {
  id: string;
  date: string;
  kind: BudgetEntryKind;
  category: string;
  description: string;
  amount: number;
};

export type CategoryBudget = {
  id: string;
  month: string;
  category: string;
  limit: number;
};

export type BudgetCategorySummary = {
  category: string;
  spent: number;
  limit: number;
  remaining: number;
  utilizationPct: number | null;
};

export type BudgetInsight = {
  tone: "positive" | "warning" | "neutral";
  text: string;
};

export type BudgetSummary = {
  month: string;
  income: number;
  expenses: number;
  remaining: number;
  planned: number;
  unallocated: number;
  categories: BudgetCategorySummary[];
  trend: Array<{ month: string; label: string; income: number; expenses: number; remaining: number }>;
  insights: BudgetInsight[];
};

export const PERSONAL_BUDGET_STORAGE_KEY = "portafolio-intel.personal-budget.v1";
export const PERSONAL_BUDGET_CSV_HEADERS = ["registro", "fecha", "tipo", "categoria", "descripcion", "importe", "mes", "presupuesto"] as const;

export const DEFAULT_BUDGET_CATEGORIES = [
  "Vivienda",
  "Alimentación",
  "Comer fuera",
  "Transporte",
  "Salud",
  "Ocio",
  "Suscripciones",
  "Compras",
  "Educación",
  "Viajes",
  "Otros",
];

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function currentBudgetMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function isValidBudgetMonth(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function isValidBudgetDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function monthFromDate(value: string) {
  return value.slice(0, 7);
}

function normalizeKind(value: string): BudgetEntryKind | null {
  const normalized = value.trim().toLowerCase();
  if (["income", "ingreso", "entrada", "cobro"].includes(normalized)) return "income";
  if (["expense", "gasto", "salida", "pago"].includes(normalized)) return "expense";
  return null;
}

function parseAmount(value: string) {
  const normalized = value.trim().replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function parseCsvMatrix(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"' && quoted && next === '"') { cell += '"'; index += 1; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (!quoted && (character === "," || character === ";")) { row.push(cell); cell = ""; continue; }
    if (!quoted && (character === "\n" || character === "\r")) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell); cell = "";
      if (row.some((item) => item.trim() !== "")) rows.push(row);
      row = [];
      continue;
    }
    cell += character;
  }
  if (cell || row.length) { row.push(cell); if (row.some((item) => item.trim() !== "")) rows.push(row); }
  return rows;
}

function headerIndex(headers: string[], names: string[]) {
  return headers.findIndex((header) => names.includes(header.trim().toLowerCase()));
}

export function parsePersonalBudgetCsv(text: string) {
  const rows = parseCsvMatrix(text);
  const warnings: string[] = [];
  if (rows.length < 2) return { entries: [] as BudgetEntry[], budgets: [] as CategoryBudget[], warnings: ["El CSV necesita una fila de encabezados y al menos un registro."] };
  const headers = rows[0].map((header) => header.replace(/^\uFEFF/, "").trim().toLowerCase());
  const recordIndex = headerIndex(headers, ["registro", "record", "tipo_registro"]);
  const dateIndex = headerIndex(headers, ["fecha", "date"]);
  const kindIndex = headerIndex(headers, ["tipo", "kind", "naturaleza"]);
  const categoryIndex = headerIndex(headers, ["categoria", "categoría", "category"]);
  const descriptionIndex = headerIndex(headers, ["descripcion", "descripción", "description"]);
  const amountIndex = headerIndex(headers, ["importe", "amount", "cantidad"]);
  const monthIndex = headerIndex(headers, ["mes", "month"]);
  const budgetIndex = headerIndex(headers, ["presupuesto", "budget", "limite", "límite"]);
  if (categoryIndex < 0 || (amountIndex < 0 && budgetIndex < 0)) return { entries: [], budgets: [], warnings: ["Faltan las columnas categoria e importe o presupuesto."] };

  const entries: BudgetEntry[] = [];
  const budgets: CategoryBudget[] = [];
  rows.slice(1).forEach((cells, rowIndex) => {
    const get = (index: number) => index >= 0 ? (cells[index] ?? "").trim() : "";
    const record = get(recordIndex).toLowerCase();
    const month = get(monthIndex) || (isValidBudgetDate(get(dateIndex)) ? monthFromDate(get(dateIndex)) : "");
    const category = get(categoryIndex) || "Otros";
    const amount = parseAmount(get(amountIndex));
    const budgetAmount = parseAmount(get(budgetIndex));
    if (record === "presupuesto" || record === "budget" || (budgetIndex >= 0 && !get(kindIndex) && budgetAmount !== null)) {
      if (!isValidBudgetMonth(month) || budgetAmount === null) { warnings.push(`Fila ${rowIndex + 2}: presupuesto rechazado; revisa mes y presupuesto.`); return; }
      budgets.push({ id: makeId("budget"), month, category, limit: budgetAmount });
      return;
    }
    const kind = normalizeKind(get(kindIndex));
    const date = get(dateIndex);
    if (!kind || !isValidBudgetDate(date) || amount === null) { warnings.push(`Fila ${rowIndex + 2}: movimiento rechazado; revisa fecha, tipo e importe.`); return; }
    entries.push({ id: makeId("entry"), date, kind, category, description: get(descriptionIndex), amount });
  });
  return { entries, budgets, warnings };
}

function monthLabel(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("es-ES", { month: "short", year: "2-digit" }).format(new Date(year, monthNumber - 1, 1));
}

export function summarizeBudget(entries: BudgetEntry[], budgets: CategoryBudget[], month: string): BudgetSummary {
  const monthEntries = entries.filter((entry) => monthFromDate(entry.date) === month);
  const income = monthEntries.filter((entry) => entry.kind === "income").reduce((sum, entry) => sum + entry.amount, 0);
  const expenses = monthEntries.filter((entry) => entry.kind === "expense").reduce((sum, entry) => sum + entry.amount, 0);
  const monthBudgets = budgets.filter((budget) => budget.month === month);
  const categories = [...new Set([...monthEntries.filter((entry) => entry.kind === "expense").map((entry) => entry.category), ...monthBudgets.map((budget) => budget.category)])]
    .sort((left, right) => left.localeCompare(right, "es"))
    .map((category) => {
      const spent = monthEntries.filter((entry) => entry.kind === "expense" && entry.category === category).reduce((sum, entry) => sum + entry.amount, 0);
      const limit = monthBudgets.filter((budget) => budget.category === category).reduce((sum, budget) => sum + budget.limit, 0);
      return { category, spent, limit, remaining: limit - spent, utilizationPct: limit > 0 ? (spent / limit) * 100 : null };
    });
  const planned = monthBudgets.reduce((sum, budget) => sum + budget.limit, 0);
  const trend = Array.from({ length: 6 }, (_, offset) => {
    const [year, monthNumber] = month.split("-").map(Number);
    const date = new Date(year, monthNumber - 1 - (5 - offset), 1);
    const key = currentBudgetMonth(date);
    const rows = entries.filter((entry) => monthFromDate(entry.date) === key);
    const monthlyIncome = rows.filter((entry) => entry.kind === "income").reduce((sum, entry) => sum + entry.amount, 0);
    const monthlyExpenses = rows.filter((entry) => entry.kind === "expense").reduce((sum, entry) => sum + entry.amount, 0);
    return { month: key, label: monthLabel(key), income: monthlyIncome, expenses: monthlyExpenses, remaining: monthlyIncome - monthlyExpenses };
  });
  const insights: BudgetInsight[] = [];
  const overBudget = categories.filter((category) => category.limit > 0 && category.spent > category.limit).sort((a, b) => b.spent - b.limit - (a.spent - a.limit));
  if (overBudget[0]) {
    const category = overBudget[0];
    insights.push({ tone: "warning", text: `${category.category} va un ${Math.round((category.spent / category.limit - 1) * 100)}% por encima del presupuesto.` });
  }
  const nearLimit = categories.filter((category) => category.limit > 0 && category.spent <= category.limit && category.utilizationPct !== null && category.utilizationPct >= 80).sort((a, b) => (b.utilizationPct ?? 0) - (a.utilizationPct ?? 0));
  if (nearLimit[0]) insights.push({ tone: "neutral", text: `${nearLimit[0].category} ya ha utilizado el ${Math.round(nearLimit[0].utilizationPct ?? 0)}% de su presupuesto.` });
  if (income > 0 && expenses < income && !overBudget[0]) insights.push({ tone: "positive", text: `Vas dentro de tus límites: este mes has gastado el ${Math.round((expenses / income) * 100)}% de tus ingresos.` });
  if (expenses === 0) insights.push({ tone: "neutral", text: "Todavía no hay gastos registrados para este mes." });
  return { month, income, expenses, remaining: income - expenses, planned, unallocated: Math.max(0, income - planned), categories, trend, insights };
}

export function budgetCsv(entries: BudgetEntry[], budgets: CategoryBudget[]) {
  const rows: Array<Array<string | number>> = [PERSONAL_BUDGET_CSV_HEADERS as unknown as string[]];
  entries.forEach((entry) => rows.push(["movimiento", entry.date, entry.kind === "income" ? "ingreso" : "gasto", entry.category, entry.description, entry.amount, monthFromDate(entry.date), ""]));
  budgets.forEach((budget) => rows.push(["presupuesto", "", "", budget.category, "", "", budget.month, budget.limit]));
  return csvFromRows(rows);
}

export function budgetTemplateCsv() {
  return csvFromRows([
    PERSONAL_BUDGET_CSV_HEADERS as unknown as string[],
    ["movimiento", "2026-01-05", "ingreso", "Nómina", "Ingreso mensual", 2200, "2026-01", ""],
    ["movimiento", "2026-01-08", "gasto", "Comer fuera", "Cena", 42.5, "2026-01", ""],
    ["presupuesto", "", "", "Comer fuera", "", "", "2026-01", 120],
  ]);
}
