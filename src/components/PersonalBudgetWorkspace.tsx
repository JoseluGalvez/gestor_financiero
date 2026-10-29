"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarDays, Download, FileSpreadsheet, Lightbulb, Plus, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import {
  BudgetEntry,
  BudgetEntryKind,
  CategoryBudget,
  DEFAULT_BUDGET_CATEGORIES,
  PERSONAL_BUDGET_STORAGE_KEY,
  budgetCsv,
  budgetTemplateCsv,
  currentBudgetMonth,
  isValidBudgetDate,
  parsePersonalBudgetCsv,
  summarizeBudget,
} from "@/lib/personal-budget";

const euro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
const dateFormatter = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" });
const demoEntries: BudgetEntry[] = [
  { id: "demo-income", date: `${currentBudgetMonth()}-01`, kind: "income", category: "Nómina", description: "Ingreso mensual", amount: 2200 },
  { id: "demo-rent", date: `${currentBudgetMonth()}-02`, kind: "expense", category: "Vivienda", description: "Alquiler", amount: 760 },
  { id: "demo-food", date: `${currentBudgetMonth()}-05`, kind: "expense", category: "Alimentación", description: "Compra semanal", amount: 180 },
  { id: "demo-dining", date: `${currentBudgetMonth()}-08`, kind: "expense", category: "Comer fuera", description: "Cena", amount: 158 },
  { id: "demo-transport", date: `${currentBudgetMonth()}-10`, kind: "expense", category: "Transporte", description: "Abono", amount: 55 },
];
const demoBudgets: CategoryBudget[] = [
  { id: "demo-rent-budget", month: currentBudgetMonth(), category: "Vivienda", limit: 800 },
  { id: "demo-food-budget", month: currentBudgetMonth(), category: "Alimentación", limit: 300 },
  { id: "demo-dining-budget", month: currentBudgetMonth(), category: "Comer fuera", limit: 120 },
  { id: "demo-transport-budget", month: currentBudgetMonth(), category: "Transporte", limit: 100 },
];

function download(content: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
}

function emptyForm() { return { date: new Date().toISOString().slice(0, 10), kind: "expense" as BudgetEntryKind, category: "Alimentación", description: "", amount: "" }; }

export function PersonalBudgetWorkspace() {
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(currentBudgetMonth());
  const [entryForm, setEntryForm] = useState(emptyForm);
  const [budgetForm, setBudgetForm] = useState({ category: "Alimentación", limit: "" });
  const [notice, setNotice] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = window.localStorage.getItem(PERSONAL_BUDGET_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as { entries?: BudgetEntry[]; budgets?: CategoryBudget[] };
          setEntries(Array.isArray(parsed.entries) ? parsed.entries : []);
          setBudgets(Array.isArray(parsed.budgets) ? parsed.budgets : []);
        }
      } catch { setNotice("No se pudo leer el estado local guardado; se ha iniciado una sesión vacía."); }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(PERSONAL_BUDGET_STORAGE_KEY, JSON.stringify({ entries, budgets }));
  }, [budgets, entries, hydrated]);

  const summary = useMemo(() => summarizeBudget(showDemo ? [...entries, ...demoEntries] : entries, showDemo ? [...budgets, ...demoBudgets] : budgets, selectedMonth), [budgets, entries, selectedMonth, showDemo]);
  const monthEntries = useMemo(() => (showDemo ? [...entries, ...demoEntries] : entries).filter((entry) => entry.date.startsWith(selectedMonth)).sort((a, b) => b.date.localeCompare(a.date)), [entries, selectedMonth, showDemo]);
  const monthOptions = useMemo(() => [...new Set([currentBudgetMonth(), ...entries.map((entry) => entry.date.slice(0, 7)), ...budgets.map((budget) => budget.month)])].sort().reverse(), [budgets, entries]);
  const categories = [...new Set([...DEFAULT_BUDGET_CATEGORIES, ...entries.map((entry) => entry.category), ...budgets.map((budget) => budget.category)])].sort((a, b) => a.localeCompare(b, "es"));

  function addEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(entryForm.amount.replace(",", "."));
    if (!isValidBudgetDate(entryForm.date) || !Number.isFinite(amount) || amount <= 0 || !entryForm.category.trim()) { setNotice("Revisa la fecha, la categoría y un importe superior a cero."); return; }
    setEntries((current) => [...current, { id: `entry-${Date.now()}`, date: entryForm.date, kind: entryForm.kind, category: entryForm.category.trim(), description: entryForm.description.trim() || "Sin descripción", amount }]);
    setSelectedMonth(entryForm.date.slice(0, 7)); setEntryForm(emptyForm()); setNotice("Movimiento guardado solo en este navegador.");
  }

  function addBudget(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const limit = Number(budgetForm.limit.replace(",", "."));
    if (!Number.isFinite(limit) || limit <= 0 || !budgetForm.category.trim()) { setNotice("Indica una categoría y un presupuesto superior a cero."); return; }
    setBudgets((current) => [...current.filter((item) => !(item.month === selectedMonth && item.category === budgetForm.category.trim())), { id: `budget-${Date.now()}`, month: selectedMonth, category: budgetForm.category.trim(), limit }]);
    setBudgetForm((current) => ({ ...current, limit: "" })); setNotice("Presupuesto mensual guardado en el navegador.");
  }

  function importCsv(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    if (file.size > 15 * 1024 * 1024) { setNotice("El CSV supera el límite local de 15 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { const result = parsePersonalBudgetCsv(String(reader.result ?? "")); setEntries((current) => [...current, ...result.entries]); setBudgets((current) => [...current, ...result.budgets]); setNotice(`Importación completada: ${result.entries.length} movimientos y ${result.budgets.length} presupuestos.${result.warnings.length ? ` ${result.warnings.length} filas requieren revisión.` : ""}`); event.target.value = ""; };
    reader.readAsText(file);
  }

  function clearLocal() { setEntries([]); setBudgets([]); window.localStorage.removeItem(PERSONAL_BUDGET_STORAGE_KEY); setShowDemo(false); setNotice("Se han eliminado los datos de Presupuesto personal de este navegador."); }
  const latestEntries = monthEntries.slice(0, 8);

  return <section className="budget-workspace">
    <section className="budget-hero"><div><p className="eyebrow">Privacidad primero · Presupuesto personal</p><h1>Controla lo que entra, lo que sale y cuánto queda.</h1><p>Registra ingresos y gastos por categorías, fija límites mensuales y recibe explicaciones sencillas sin enviar tus datos a Supabase ni a ningún servidor.</p></div><div className="budget-privacy"><ShieldCheck size={20} /><strong>Solo en tu navegador</strong><span>Guardado local · sin cuenta</span></div></section>
    {notice && <div className="budget-notice" role="status">{notice}<button aria-label="Cerrar aviso" onClick={() => setNotice(null)} type="button">×</button></div>}
    <section className="budget-toolbar"><label><CalendarDays size={16} /><span>Mes</span><select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}>{monthOptions.map((month) => <option key={month} value={month}>{new Date(`${month}-01T00:00:00`).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</option>)}</select></label><div className="budget-actions"><label className="button secondary budget-file-button"><UploadCloud size={16} />Importar CSV<input accept=".csv,text/csv" onChange={importCsv} type="file" /></label><button className="button secondary" onClick={() => download(budgetCsv(entries, budgets), `presupuesto-personal-${selectedMonth}.csv`)} type="button"><Download size={16} />Exportar CSV</button><button className="button ghost" onClick={() => download(budgetTemplateCsv(), "plantilla-presupuesto-personal.csv")} type="button"><FileSpreadsheet size={16} />Plantilla</button><button className="button ghost danger-button" onClick={clearLocal} type="button"><Trash2 size={16} />Borrar datos</button></div></section>
    <section className="budget-kpis"><article><span>Ingresos del mes</span><strong className="text-positive">{euro.format(summary.income)}</strong><small>Entradas registradas</small></article><article><span>Gastos del mes</span><strong className="text-negative">{euro.format(summary.expenses)}</strong><small>{summary.income ? `${Math.round(summary.expenses / summary.income * 100)}% de tus ingresos` : "Añade ingresos para calcular"}</small></article><article><span>Disponible</span><strong className={summary.remaining < 0 ? "text-negative" : "text-positive"}>{euro.format(summary.remaining)}</strong><small>Ingresos menos gastos</small></article><article><span>Presupuesto asignado</span><strong>{euro.format(summary.planned)}</strong><small>{euro.format(summary.unallocated)} sin asignar</small></article></section>
    <section className="budget-grid"><article className="panel budget-chart-panel"><div className="panel-heading"><div><p className="eyebrow">Distribución del gasto</p><h2>Gasto por categoría</h2></div><span className="data-stamp">{selectedMonth}</span></div>{summary.categories.length ? <ResponsiveContainer width="100%" height={280}><BarChart data={summary.categories} layout="vertical" margin={{ left: 20, right: 16, top: 8, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e7ebf2" /><XAxis type="number" tickFormatter={(value) => `${value} €`} /><YAxis dataKey="category" type="category" width={105} tick={{ fontSize: 11 }} /><Tooltip formatter={(value) => euro.format(Number(value ?? 0))} /><Legend /><Bar dataKey="spent" name="Gastado" fill="#2f67df" radius={[0, 5, 5, 0]} /><Bar dataKey="limit" name="Presupuesto" fill="#cbd7ee" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer> : <div className="budget-empty"><Lightbulb size={24} /><strong>Aún no hay movimientos.</strong><span>Registra tu primer ingreso o gasto para ver el panel.</span></div>}</article><article className="panel budget-chart-panel"><div className="panel-heading"><div><p className="eyebrow">Evolución</p><h2>Tendencia mes a mes</h2></div></div><ResponsiveContainer width="100%" height={280}><LineChart data={summary.trend} margin={{ left: 4, right: 12, top: 8, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="#e7ebf2" /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis tickFormatter={(value) => `${value} €`} tick={{ fontSize: 11 }} /><Tooltip formatter={(value) => euro.format(Number(value ?? 0))} /><Legend /><Line type="monotone" dataKey="income" name="Ingresos" stroke="#148765" strokeWidth={2.5} dot={{ r: 3 }} /><Line type="monotone" dataKey="expenses" name="Gastos" stroke="#c64b51" strokeWidth={2.5} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></article></section>
    <section className="budget-lower-grid"><article className="panel budget-insights"><div className="panel-heading"><div><p className="eyebrow">Lectura sencilla</p><h2>Qué está pasando</h2></div><Lightbulb size={20} /></div>{summary.insights.map((insight) => <div className={`budget-insight ${insight.tone}`} key={insight.text}><Lightbulb size={16} /><span>{insight.text}</span></div>)}{!summary.insights.length && <div className="budget-empty compact"><span>Añade movimientos y límites para generar análisis comprensibles.</span></div>}<div className="budget-category-list">{summary.categories.map((category) => <div className="budget-category-row" key={category.category}><span>{category.category}</span><b>{euro.format(category.spent)}</b><small>{category.limit > 0 ? `${euro.format(category.remaining)} restantes` : "Sin límite fijado"}</small><i><em style={{ width: `${Math.min(category.utilizationPct ?? 0, 100)}%` }} /></i></div>)}</div></article><article className="panel budget-entry-panel"><div className="panel-heading"><div><p className="eyebrow">Nuevo movimiento</p><h2>Registrar ingreso o gasto</h2></div><Plus size={20} /></div><form className="budget-form" onSubmit={addEntry}><label><span>Fecha</span><input type="date" value={entryForm.date} onChange={(event) => setEntryForm({ ...entryForm, date: event.target.value })} required /></label><label><span>Tipo</span><select value={entryForm.kind} onChange={(event) => setEntryForm({ ...entryForm, kind: event.target.value as BudgetEntryKind })}><option value="expense">Gasto</option><option value="income">Ingreso</option></select></label><label><span>Categoría</span><input list="budget-categories" value={entryForm.category} onChange={(event) => setEntryForm({ ...entryForm, category: event.target.value })} required /><datalist id="budget-categories">{categories.map((category) => <option key={category} value={category} />)}</datalist></label><label><span>Descripción</span><input placeholder="Ej. compra semanal" value={entryForm.description} onChange={(event) => setEntryForm({ ...entryForm, description: event.target.value })} /></label><label><span>Importe (€)</span><input inputMode="decimal" min="0.01" step="0.01" type="number" value={entryForm.amount} onChange={(event) => setEntryForm({ ...entryForm, amount: event.target.value })} required /></label><button className="button primary" type="submit">Guardar movimiento</button></form><div className="budget-divider" /><div className="panel-heading"><div><p className="eyebrow">Límite mensual</p><h2>Fijar presupuesto por categoría</h2></div></div><form className="budget-form compact-form" onSubmit={addBudget}><label><span>Categoría</span><input list="budget-categories" value={budgetForm.category} onChange={(event) => setBudgetForm({ ...budgetForm, category: event.target.value })} required /></label><label><span>Límite (€)</span><input inputMode="decimal" min="0.01" step="0.01" type="number" value={budgetForm.limit} onChange={(event) => setBudgetForm({ ...budgetForm, limit: event.target.value })} required /></label><button className="button secondary" type="submit">Guardar límite</button></form></article></section>
    <section className="panel budget-recent"><div className="panel-heading"><div><p className="eyebrow">Detalle del mes</p><h2>Últimos movimientos</h2></div><button className="button ghost" onClick={() => setShowDemo((current) => !current)} type="button">{showDemo ? "Ocultar ejemplo" : "Ver ejemplo ficticio"}</button></div>{latestEntries.length ? <div className="budget-table-wrap"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th>Importe</th></tr></thead><tbody>{latestEntries.map((entry) => <tr key={entry.id}><td>{dateFormatter.format(new Date(`${entry.date}T12:00:00`))}</td><td><span className={`budget-kind ${entry.kind}`}>{entry.kind === "income" ? "Ingreso" : "Gasto"}</span></td><td>{entry.category}</td><td>{entry.description}</td><td className={entry.kind === "income" ? "text-positive" : "text-negative"}>{entry.kind === "income" ? "+" : "−"}{euro.format(entry.amount)}</td></tr>)}</tbody></table></div> : <div className="budget-empty compact"><span>No hay movimientos para este mes.</span></div>}</section>
    <p className="budget-footnote"><ShieldCheck size={15} />Privacidad: estos datos se guardan únicamente en el almacenamiento local del navegador. No se envían a Supabase, no se mezclan con la cartera autenticada y se perderán si borras los datos del sitio.</p>
  </section>;
}
