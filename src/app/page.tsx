"use client";

import readXlsxFile from "read-excel-file/browser";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Landmark,
  LayoutDashboard,
  LineChart,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  UploadCloud,
  WalletCards,
  X,
} from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";

type Screen = "resumen" | "cartera" | "activo" | "analisis" | "fiscal" | "plataformas" | "administracion";
type PlatformKind = "Broker" | "P2P" | "Banco" | "Fondos" | "Cripto";
type DataMethod = "CSV" | "Excel" | "Manual" | "Google Sheets" | "Base de datos";
type Quality = "Verificado" | "Revisar" | "Parcial";

type Platform = {
  id: string;
  name: string;
  initials: string;
  kind: PlatformKind;
  country: string;
  currency: string;
  method: DataMethod;
  value: number;
  cost: number;
  returnPct: number;
  quality: Quality;
  updated: string;
  positions: number;
  accent: string;
  trend: number[];
};

type AssetPosition = {
  id: string;
  name: string;
  isin: string;
  assetClass: string;
  platformId: string;
  platform: string;
  quantity: number;
  value: number;
  cost: number;
  returnPct: number;
  trend: number[];
  currency: string;
  rating?: string;
  risk: number;
};

type ImportPreview = {
  fileName: string;
  headers: string[];
  rows: Record<string, string | number | boolean | null>[];
  warnings: string[];
};

const initialPlatforms: Platform[] = [
  {
    id: "myinvestor",
    name: "MyInvestor",
    initials: "MI",
    kind: "Fondos",
    country: "España",
    currency: "EUR",
    method: "CSV",
    value: 48120,
    cost: 43125,
    returnPct: 11.58,
    quality: "Verificado",
    updated: "Hoy, 09:42",
    positions: 8,
    accent: "#366ff4",
    trend: [20, 28, 26, 35, 42, 51, 47, 60, 66, 72, 78, 90],
  },
  {
    id: "mintos",
    name: "Mintos",
    initials: "M",
    kind: "P2P",
    country: "Letonia",
    currency: "EUR",
    method: "Excel",
    value: 18640,
    cost: 17115,
    returnPct: 8.91,
    quality: "Revisar",
    updated: "Ayer, 18:10",
    positions: 64,
    accent: "#8c56d9",
    trend: [30, 35, 36, 40, 48, 47, 51, 57, 59, 61, 66, 70],
  },
  {
    id: "trade-republic",
    name: "Trade Republic",
    initials: "TR",
    kind: "Broker",
    country: "Alemania",
    currency: "EUR",
    method: "Google Sheets",
    value: 24890,
    cost: 23410,
    returnPct: 6.32,
    quality: "Verificado",
    updated: "Hoy, 08:15",
    positions: 12,
    accent: "#1d9b78",
    trend: [33, 29, 41, 38, 51, 60, 63, 55, 70, 73, 75, 82],
  },
  {
    id: "binance",
    name: "Binance",
    initials: "B",
    kind: "Cripto",
    country: "Global",
    currency: "EUR",
    method: "Manual",
    value: 9840,
    cost: 11210,
    returnPct: -12.22,
    quality: "Parcial",
    updated: "12 ago. 2026",
    positions: 5,
    accent: "#ed9f29",
    trend: [76, 63, 68, 50, 47, 54, 35, 42, 30, 39, 31, 28],
  },
];

const initialPositions: AssetPosition[] = [
  { id: "msci-world", name: "Fidelity MSCI World Index Fund P-Acc-EUR", isin: "LU0340285161", assetClass: "Renta variable", platformId: "myinvestor", platform: "MyInvestor", quantity: 124.77, value: 18640, cost: 16590, returnPct: 12.36, trend: [20, 25, 22, 31, 35, 42, 39, 46, 52, 51, 57, 61], currency: "EUR", rating: "4/5", risk: 4 },
  { id: "emerging-markets", name: "iShares Emerging Markets Index Fund (IE) Acc", isin: "IE00B0M63177", assetClass: "Renta variable", platformId: "myinvestor", platform: "MyInvestor", quantity: 74.2, value: 9021, cost: 9195, returnPct: -1.89, trend: [38, 48, 45, 41, 42, 36, 33, 37, 32, 29, 31, 39], currency: "EUR", rating: "3/5", risk: 5 },
  { id: "global-aggregate", name: "Vanguard Global Aggregate Bond ETF", isin: "IE00BG47KH54", assetClass: "Bonos", platformId: "trade-republic", platform: "Trade Republic", quantity: 82, value: 8790, cost: 8500, returnPct: 3.41, trend: [20, 21, 22, 23, 26, 29, 28, 31, 32, 33, 34, 37], currency: "EUR", rating: "4/5", risk: 2 },
  { id: "mintos-notes", name: "Notas diversificadas de préstamos", isin: "MINTOS-NOTES", assetClass: "Préstamos", platformId: "mintos", platform: "Mintos", quantity: 64, value: 18640, cost: 17115, returnPct: 8.91, trend: [22, 25, 27, 31, 32, 35, 40, 43, 46, 48, 51, 56], currency: "EUR", risk: 5 },
  { id: "bitcoin", name: "Bitcoin", isin: "BTC", assetClass: "Cripto", platformId: "binance", platform: "Binance", quantity: 0.17, value: 9840, cost: 11210, returnPct: -12.22, trend: [80, 72, 76, 64, 62, 65, 54, 57, 47, 50, 44, 38], currency: "EUR", risk: 7 },
];

const platformKinds: PlatformKind[] = ["Broker", "P2P", "Banco", "Fondos", "Cripto"];
const dataMethods: DataMethod[] = ["CSV", "Excel", "Manual", "Google Sheets", "Base de datos"];
const screenLabels: Record<Screen, string> = {
  resumen: "Resumen",
  cartera: "Cartera",
  activo: "Detalle de activo",
  analisis: "Análisis",
  fiscal: "Fiscalidad",
  plataformas: "Plataformas",
  administracion: "Administración",
};

const euro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const euroPrecise = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const oneDecimal = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function formatReturn(value: number) {
  return `${value >= 0 ? "+" : ""}${oneDecimal.format(value)} %`;
}

function qualityClass(quality: Quality) {
  if (quality === "Verificado") return "badge-success";
  if (quality === "Revisar") return "badge-warning";
  return "badge-neutral";
}

function getInitials(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word.charAt(0)).join("").toUpperCase() || "NP";
}

function toNumber(value: string | number | boolean | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "boolean" || value === null || value === undefined) return 0;
  const cleaned = String(value).trim().replace(/\s/g, "").replace(/€/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(/,/g, ".").replace(/[^0-9.-]/g, "");
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function valueFromRow(row: Record<string, string | number | boolean | null>, candidates: string[]) {
  const foundKey = Object.keys(row).find((key) => candidates.includes(key.toLowerCase().trim()));
  return foundKey ? toNumber(row[foundKey]) : 0;
}

function parseCsv(text: string) {
  const table: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];
    if (character === '"') {
      if (quoted && nextCharacter === '"') { currentCell += '"'; index += 1; } else { quoted = !quoted; }
    } else if (character === "," && !quoted) {
      currentRow.push(currentCell.trim()); currentCell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      currentRow.push(currentCell.trim());
      if (currentRow.some(Boolean)) table.push(currentRow);
      currentRow = []; currentCell = "";
    } else { currentCell += character; }
  }
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(Boolean)) table.push(currentRow);
  }
  const [rawHeaders = [], ...rawRows] = table;
  const headers = rawHeaders.map((header, index) => header || `Columna ${index + 1}`);
  const rows = rawRows.slice(0, 5001).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? null]))) as Record<string, string | number | boolean | null>[];
  return { headers, rows, isTruncated: rawRows.length > 5000 };
}

async function parseXlsx(file: File) {
  const sheets = await readXlsxFile(file);
  const rawRows = sheets[0]?.data ?? [];
  const [rawHeaders = [], ...dataRows] = rawRows;
  const headers = rawHeaders.map((value, index) => String(value ?? "").trim() || `Columna ${index + 1}`);
  if (headers.length === 0) throw new Error("La primera fila debe contener encabezados.");
  const rows = dataRows.slice(0, 5001).map((row) => Object.fromEntries(headers.map((header, index) => {
    const value = row[index];
    const normalized = value instanceof Date ? value.toISOString().slice(0, 10) : value === null ? null : String(value ?? "").trim() || null;
    return [header, normalized];
  }))) as Record<string, string | number | boolean | null>[];
  return { headers, rows: rows.slice(0, 5000), isTruncated: dataRows.length > 5000 };
}

function MiniTrend({ values, color, label = "Tendencia de valor" }: { values: number[]; color: string; label?: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const denominator = Math.max(max - min, 1);
  const points = values.map((point, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * 100;
    const y = 34 - ((point - min) / denominator) * 28;
    return `${x},${y}`;
  }).join(" ");
  return <svg aria-label={label} className="mini-trend" viewBox="0 0 100 38" preserveAspectRatio="none" role="img"><polyline fill="none" points={points} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" /></svg>;
}

function Donut({ values }: { values: Platform[] }) {
  const total = values.reduce((sum, platform) => sum + platform.value, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const segments = values.map((platform, index) => {
    const proportion = total > 0 ? platform.value / total : 0;
    const priorValue = values.slice(0, index).reduce((sum, item) => sum + item.value, 0);
    return { platform, segment: proportion * circumference, offset: total > 0 ? (priorValue / total) * circumference : 0 };
  });
  return <div className="donut-wrap"><svg aria-label="Distribución de valor por plataforma" className="donut" viewBox="0 0 112 112" role="img"><circle cx="56" cy="56" fill="none" r={radius} stroke="#edf1f7" strokeWidth="13" />{segments.map(({ platform, segment, offset }) => <circle key={platform.id} cx="56" cy="56" fill="none" r={radius} stroke={platform.accent} strokeDasharray={`${Math.max(segment - 3, 0)} ${circumference}`} strokeDashoffset={-offset} strokeLinecap="butt" strokeWidth="13" transform="rotate(-90 56 56)" />)}</svg><div className="donut-center"><strong>{values.length}</strong><span>fuentes</span></div></div>;
}

function AllocationDonut({ items }: { items: { id: string; label: string; value: number; color: string }[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const stops = items.map((item, index) => {
    const priorValue = items.slice(0, index).reduce((sum, priorItem) => sum + priorItem.value, 0);
    const start = total ? (priorValue / total) * 100 : 0;
    const end = total ? ((priorValue + item.value) / total) * 100 : 0;
    return `${item.color} ${start}% ${Math.max(end - 0.7, start)}%`;
  });
  return <div className="allocation-donut" aria-label="Distribución por clase de activo" role="img"><div className="allocation-ring" style={{ background: `conic-gradient(${stops.join(", ")})` }}><div className="allocation-hole"><strong>{euro.format(total)}</strong><span>valor total</span></div></div></div>;
}

function Histogram({ values, color = "#1d9b78" }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  return <div aria-label="Histograma de distribución" className="histogram" role="img">{values.map((value, index) => <span key={`${value}-${index}`} style={{ backgroundColor: color, height: `${Math.max((value / max) * 100, 6)}%` }} />)}</div>;
}

function InsightCard({ title, value, change, tone, icon }: { title: string; value: string; change: string; tone: "positive" | "neutral" | "negative"; icon: React.ReactNode }) {
  return <article className="insight-card"><div className="insight-icon">{icon}</div><div><p>{title}</p><strong>{value}</strong><span className={`metric-change ${tone}`}>{tone === "negative" ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}{change}</span></div></article>;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("resumen");
  const [platforms, setPlatforms] = useState<Platform[]>(initialPlatforms);
  const [selectedPlatform, setSelectedPlatform] = useState("todos");
  const [sortBy, setSortBy] = useState<"return" | "value">("return");
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importTarget, setImportTarget] = useState("myinvestor");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceMethod, setSourceMethod] = useState<DataMethod>("Google Sheets");
  const [activeAsset, setActiveAsset] = useState<AssetPosition>(initialPositions[0]);
  const [taxYear, setTaxYear] = useState("2026");
  const [taxGenerated, setTaxGenerated] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const visiblePlatforms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const subset = platforms.filter((platform) => (selectedPlatform === "todos" || platform.id === selectedPlatform) && (!normalizedQuery || `${platform.name} ${platform.kind} ${platform.country}`.toLowerCase().includes(normalizedQuery)));
    return [...subset].sort((a, b) => (sortBy === "return" ? b.returnPct - a.returnPct : b.value - a.value));
  }, [platforms, query, selectedPlatform, sortBy]);

  const totals = useMemo(() => {
    const value = visiblePlatforms.reduce((sum, platform) => sum + platform.value, 0);
    const cost = visiblePlatforms.reduce((sum, platform) => sum + platform.cost, 0);
    const gain = value - cost;
    const returnPct = cost > 0 ? (gain / cost) * 100 : 0;
    const verified = visiblePlatforms.filter((platform) => platform.quality === "Verificado").length;
    return { value, cost, gain, returnPct, verified };
  }, [visiblePlatforms]);

  const visiblePositions = useMemo(() => initialPositions.filter((position) => selectedPlatform === "todos" || position.platformId === selectedPlatform), [selectedPlatform]);
  const assetAllocation = useMemo(() => {
    const colors: Record<string, string> = { "Renta variable": "#225c42", Bonos: "#a8befa", Préstamos: "#40c97f", Cripto: "#192b72" };
    return Object.values(visiblePositions.reduce<Record<string, { id: string; label: string; value: number; color: string }>>((accumulator, position) => {
      const current = accumulator[position.assetClass] ?? { id: position.assetClass, label: position.assetClass, value: 0, color: colors[position.assetClass] ?? "#b68e30" };
      current.value += position.value;
      accumulator[position.assetClass] = current;
      return accumulator;
    }, {}));
  }, [visiblePositions]);
  const bestPlatform = visiblePlatforms.length > 0 ? visiblePlatforms[0] : null;
  const currentAssetGain = activeAsset.value - activeAsset.cost;

  const resetNotice = () => window.setTimeout(() => setNotice(null), 4200);
  const navigate = (nextScreen: Screen) => { setScreen(nextScreen); if (nextScreen !== "plataformas") setQuery(""); };
  const openAsset = (asset: AssetPosition) => { setActiveAsset(asset); setScreen("activo"); };

  function addPlatform(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const kind = String(form.get("kind") ?? "Broker") as PlatformKind;
    const country = String(form.get("country") ?? "Global").trim() || "Global";
    const method = String(form.get("method") ?? "Manual") as DataMethod;
    const value = toNumber(String(form.get("value") ?? "0"));
    const returnPct = toNumber(String(form.get("returnPct") ?? "0"));
    if (!name) { setNotice("Indica el nombre de la plataforma antes de crearla."); resetNotice(); return; }
    const cost = returnPct === -100 ? value : value / (1 + returnPct / 100);
    const accents = ["#ef6c4e", "#3e8e98", "#6679c7", "#b7844c"];
    const newPlatform: Platform = { id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`, name, initials: getInitials(name), kind, country, currency: "EUR", method, value, cost: Number.isFinite(cost) ? cost : value, returnPct, quality: method === "Manual" ? "Parcial" : "Revisar", updated: "Ahora", positions: 0, accent: accents[platforms.length % accents.length], trend: [24, 28, 31, 30, 36, 38, 43, 46, 49, 52, 56, 60] };
    setPlatforms((current) => [newPlatform, ...current]);
    setSelectedPlatform("todos"); setShowAdd(false); setScreen("plataformas");
    setNotice(`${name} se ha añadido a la comparación. Los datos permanecen solo en esta sesión de demostración.`); resetNotice();
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["csv", "xlsx"].includes(extension)) { setNotice("Selecciona un archivo CSV o XLSX. Convierte los archivos XLS heredados antes de cargarlos."); resetNotice(); return; }
    if (file.size > 8 * 1024 * 1024) { setNotice("El archivo supera el límite de 8 MB para esta demostración."); resetNotice(); return; }
    try {
      const parsed = extension === "csv" ? parseCsv(await file.text()) : await parseXlsx(file);
      const warnings: string[] = [];
      const normalizedHeaders = parsed.headers.map((header) => header.toLowerCase().trim());
      if (!normalizedHeaders.some((header) => ["valor", "value", "market_value", "valor_actual"].includes(header))) warnings.push("No se ha detectado una columna de valor. Podrás revisar el mapeo antes de una importación real.");
      if (parsed.rows.length === 0) warnings.push("No se encontraron filas de datos en la primera hoja.");
      if (parsed.isTruncated) warnings.push("El archivo contiene más de 5.000 filas; la demostración solo procesa las primeras 5.000.");
      setImportPreview({ fileName: file.name, headers: parsed.headers, rows: parsed.rows.slice(0, 10), warnings }); setShowImport(true);
    } catch { setNotice("No se pudo leer el archivo. Revisa que el CSV/XLSX no esté cifrado, dañado o protegido con contraseña."); resetNotice(); }
  }

  function confirmImport() {
    if (!importPreview) return;
    const importedRows = importPreview.rows;
    const totalValue = importedRows.reduce((sum, row) => sum + valueFromRow(row, ["valor", "value", "market_value", "valor_actual"]), 0);
    const totalCost = importedRows.reduce((sum, row) => sum + valueFromRow(row, ["coste", "cost", "cost_basis", "valor_inicial"]), 0);
    setPlatforms((current) => current.map((platform) => {
      if (platform.id !== importTarget) return platform;
      const nextValue = totalValue > 0 ? totalValue : platform.value;
      const nextCost = totalCost > 0 ? totalCost : platform.cost;
      return { ...platform, value: nextValue, cost: nextCost, returnPct: nextCost > 0 ? ((nextValue - nextCost) / nextCost) * 100 : platform.returnPct, positions: importedRows.length || platform.positions, quality: importPreview.warnings.length > 0 ? "Revisar" : "Verificado", updated: "Ahora", method: importPreview.fileName.toLowerCase().endsWith(".csv") ? "CSV" : "Excel" };
    }));
    setShowImport(false); setImportPreview(null); setScreen("resumen");
    setNotice("Previsualización aplicada en la sesión. En producción, este paso creará un lote auditable y conservará el archivo en almacenamiento privado."); resetNotice();
  }

  function registerRemoteSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isValidUrl = /^https:\/\//i.test(sourceUrl.trim());
    if (sourceMethod === "Google Sheets" && !isValidUrl) { setNotice("Introduce una URL HTTPS de Google Sheets para registrar la fuente."); resetNotice(); return; }
    setNotice(sourceMethod === "Google Sheets" ? "Fuente registrada como pendiente de autorización. En producción, se conectará por OAuth con permisos mínimos." : "Solicitud de conector registrada. Las credenciales nunca se guardan en el navegador; la conexión real requiere un adaptador de solo lectura del lado servidor.");
    setSourceUrl(""); resetNotice();
  }

  function generateTaxDraft() {
    setTaxGenerated(true);
    setNotice(`Borrador fiscal ${taxYear} generado para revisión. No es una declaración oficial ni debe presentarse directamente ante la AEAT.`);
    resetNotice();
  }

  function openUpload() { inputRef.current?.click(); }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><LineChart size={22} strokeWidth={2.7} /></div><div><strong>Portafolio</strong><span>Intel</span></div></div>
        <nav aria-label="Navegación principal" className="nav-list">
          <button className={screen === "resumen" ? "nav-item active" : "nav-item"} onClick={() => navigate("resumen")} type="button"><LayoutDashboard size={18} />Resumen</button>
          <button className={screen === "cartera" || screen === "activo" ? "nav-item active" : "nav-item"} onClick={() => navigate("cartera")} type="button"><WalletCards size={18} />Cartera</button>
          <button className={screen === "plataformas" ? "nav-item active" : "nav-item"} onClick={() => navigate("plataformas")} type="button"><Building2 size={18} />Plataformas<span className="nav-count">{platforms.length}</span></button>
          <button className={screen === "analisis" ? "nav-item active" : "nav-item"} onClick={() => navigate("analisis")} type="button"><Sparkles size={18} />Análisis</button>
          <button className={screen === "fiscal" ? "nav-item active" : "nav-item"} onClick={() => navigate("fiscal")} type="button"><FileText size={18} />Fiscalidad</button>
          <button className={screen === "administracion" ? "nav-item active" : "nav-item"} onClick={() => navigate("administracion")} type="button"><SlidersHorizontal size={18} />Administración</button>
        </nav>
        <div className="sidebar-bottom"><div className="security-card"><ShieldCheck size={18} /><div><strong>Diseñado para datos sensibles</strong><span>Sin credenciales de terceros en el navegador.</span></div></div><button className="help-button" onClick={() => navigate("administracion")} type="button"><CircleHelp size={17} />Guía de importación</button></div>
      </aside>

      <section className="workspace">
        <header className="topbar"><div className="crumbs"><span>Portafolio Intel</span><ChevronRight size={15} /><strong>{screenLabels[screen]}</strong></div><div className="topbar-actions"><div className="session-pill"><span />Entorno de demostración</div><button aria-label="Actualizar datos" className="icon-button" onClick={() => { setNotice("La actualización automática se activará con conectores autorizados. Los datos de esta demostración no se sincronizan."); resetNotice(); }} type="button"><RefreshCw size={17} /></button><div aria-label="Perfil de usuario" className="avatar">JG</div></div></header>
        <div className="content">
          {notice && <div className="notice" role="status"><AlertCircle size={18} /><span>{notice}</span><button aria-label="Cerrar aviso" onClick={() => setNotice(null)} type="button"><X size={16} /></button></div>}
          <input accept=".csv,.xlsx" className="visually-hidden" onChange={handleFile} ref={inputRef} type="file" />

          {screen === "resumen" && <>
            <section className="page-heading"><div><p className="eyebrow">Visión consolidada</p><h1>Decide con la foto completa de tu patrimonio.</h1><p className="subtitle">Compara el resultado de cada plataforma y detecta de un vistazo la calidad del dato que lo respalda.</p></div><div className="heading-actions"><button className="button secondary" onClick={() => navigate("administracion")} type="button"><Plus size={17} />Añadir plataforma</button><button className="button primary" onClick={openUpload} type="button"><UploadCloud size={17} />Importar datos</button></div></section>
            <section aria-label="Filtros de cartera" className="filter-bar"><div className="filter-label"><Filter size={16} />Analizar</div><label className="select-wrap"><span className="visually-hidden">Filtrar por plataforma</span><select onChange={(event) => setSelectedPlatform(event.target.value)} value={selectedPlatform}><option value="todos">Todas las plataformas</option>{platforms.map((platform) => <option key={platform.id} value={platform.id}>{platform.name}</option>)}</select><ChevronDown size={16} /></label><label className="select-wrap"><span className="visually-hidden">Ordenar por</span><select onChange={(event) => setSortBy(event.target.value as "return" | "value")} value={sortBy}><option value="return">Mayor rentabilidad</option><option value="value">Mayor valor</option></select><ChevronDown size={16} /></label><span className="filter-caption">Datos calculados con la información disponible</span></section>
            <section aria-label="Indicadores de cartera" className="kpi-grid"><InsightCard change={`${visiblePlatforms.length} plataformas incluidas`} icon={<WalletCards size={20} />} title="Patrimonio bajo seguimiento" tone="neutral" value={euro.format(totals.value)} /><InsightCard change={formatReturn(totals.returnPct)} icon={<ArrowUpRight size={20} />} title="Resultado acumulado" tone={totals.gain >= 0 ? "positive" : "negative"} value={`${totals.gain >= 0 ? "+" : ""}${euro.format(totals.gain)}`} /><InsightCard change={`${totals.verified} con datos verificados`} icon={<ShieldCheck size={20} />} title="Calidad de los datos" tone="positive" value={`${visiblePlatforms.length > 0 ? Math.round((totals.verified / visiblePlatforms.length) * 100) : 0} %`} /><InsightCard change={bestPlatform ? `${formatReturn(bestPlatform.returnPct)} de rentabilidad simple` : "Sin datos"} icon={<BarChart3 size={20} />} title="Mejor plataforma" tone="positive" value={bestPlatform?.name ?? "—"} /></section>
            <section className="dashboard-grid"><article className="panel performance-panel"><div className="panel-heading"><div><p className="eyebrow">Rendimiento por plataforma</p><h2>¿Dónde está funcionando mejor tu capital?</h2></div><span className="panel-note"><span className="dot" />Rentabilidad simple</span></div><div className="performance-list">{visiblePlatforms.map((platform) => <div className="performance-row" key={platform.id}><div className="platform-ident"><div className="platform-logo" style={{ backgroundColor: `${platform.accent}18`, color: platform.accent }}>{platform.initials}</div><div><strong>{platform.name}</strong><span>{platform.kind} · {platform.positions} posiciones</span></div></div><MiniTrend color={platform.returnPct >= 0 ? platform.accent : "#e06057"} values={platform.trend} /><div className="performance-value"><strong className={platform.returnPct >= 0 ? "text-positive" : "text-negative"}>{formatReturn(platform.returnPct)}</strong><span>{euro.format(platform.value)}</span></div></div>)}</div>{visiblePlatforms.length === 0 && <div className="empty-inline">No hay plataformas que coincidan con este filtro.</div>}</article><article className="panel distribution-panel"><div className="panel-heading compact"><div><p className="eyebrow">Distribución</p><h2>Capital por fuente</h2></div></div><Donut values={visiblePlatforms} /><div className="legend-list">{visiblePlatforms.slice(0, 4).map((platform) => { const ratio = totals.value > 0 ? (platform.value / totals.value) * 100 : 0; return <div className="legend-row" key={platform.id}><span><i style={{ background: platform.accent }} />{platform.name}</span><strong>{oneDecimal.format(ratio)} %</strong></div>; })}</div></article></section>
            <section className="panel data-health"><div className="panel-heading"><div><p className="eyebrow">Calidad de información</p><h2>Prioridades antes de comparar con más precisión</h2></div><button className="text-button" onClick={() => navigate("administracion")} type="button">Gestionar fuentes <ChevronRight size={16} /></button></div><div className="health-grid">{platforms.filter((platform) => platform.quality !== "Verificado").slice(0, 3).map((platform) => <article className="health-item" key={platform.id}><div className="health-icon"><AlertCircle size={18} /></div><div><strong>{platform.name}</strong><p>{platform.quality === "Parcial" ? "Falta un extracto reciente para validar las métricas." : "Revisa el último archivo importado y confirma las filas detectadas."}</p></div><button onClick={() => { setImportTarget(platform.id); openUpload(); }} type="button">Actualizar</button></article>)}{platforms.every((platform) => platform.quality === "Verificado") && <div className="empty-inline">Todas las plataformas del panel tienen datos verificados.</div>}</div></section>
          </>}

          {screen === "cartera" && <>
            <section className="page-heading compact-heading portfolio-heading"><div><p className="eyebrow">Cartera consolidada</p><h1>Composición y posiciones.</h1><p className="subtitle">Una lectura clara de la asignación por activo, fuente y posición individual.</p></div><div className="heading-actions"><button className="button secondary" onClick={() => navigate("analisis")} type="button"><BarChart3 size={17} />Ver análisis</button><button className="button primary" onClick={openUpload} type="button"><UploadCloud size={17} />Actualizar cartera</button></div></section>
            <section className="portfolio-switcher"><span>Vista por</span><button className="active" type="button">Valor</button><button onClick={() => setNotice("La agrupación por cuenta se habilitará cuando los conectores guarden datos persistentes.")} type="button">Cuenta</button><div className="portfolio-filter"><Filter size={16} /><select aria-label="Filtrar cartera por plataforma" onChange={(event) => setSelectedPlatform(event.target.value)} value={selectedPlatform}><option value="todos">Todas las plataformas</option>{platforms.map((platform) => <option key={platform.id} value={platform.id}>{platform.name}</option>)}</select></div></section>
            <section className="panel portfolio-overview"><div className="portfolio-allocation"><div className="panel-heading"><div><p className="eyebrow">Asignación actual</p><h2>¿Cómo está distribuido el patrimonio?</h2></div></div><div className="allocation-content"><AllocationDonut items={assetAllocation} /><div className="allocation-legend">{assetAllocation.map((asset) => <div key={asset.id}><span><i style={{ background: asset.color }} />{asset.label}</span><strong>{totals.value ? oneDecimal.format((asset.value / totals.value) * 100) : "0,0"} %</strong></div>)}</div></div></div><div className="portfolio-summary"><p className="eyebrow">Patrimonio consolidado</p><strong>{euro.format(totals.value)}</strong><span className="text-positive"><TrendingUp size={15} />{formatReturn(totals.returnPct)} acumulado</span><dl><div><dt>Coste de adquisición</dt><dd>{euro.format(totals.cost)}</dd></div><div><dt>Resultado latente</dt><dd>{`${totals.gain >= 0 ? "+" : ""}${euro.format(totals.gain)}`}</dd></div><div><dt>Posiciones cubiertas</dt><dd>{visiblePositions.length} de {initialPositions.length}</dd></div></dl></div></section>
            <section className="panel positions-panel"><div className="panel-heading"><div><p className="eyebrow">Posiciones</p><h2>Instrumentos bajo seguimiento</h2></div><span className="table-count">{visiblePositions.length} posiciones visibles</span></div><div className="positions-table-wrap"><table className="positions-table"><thead><tr><th>Activo</th><th>Plataforma</th><th>Valor</th><th>Resultado</th><th aria-label="Abrir detalle" /></tr></thead><tbody>{visiblePositions.map((position) => <tr key={position.id}><td><button className="asset-ident" onClick={() => openAsset(position)} type="button"><span className="asset-icon"><LineChart size={18} /></span><span><strong>{position.name}</strong><small>{position.assetClass} · {position.isin}</small></span></button></td><td><span className="source-chip">{position.platform}</span></td><td><strong>{euroPrecise.format(position.value)}</strong></td><td><span className={position.returnPct >= 0 ? "return-positive" : "return-negative"}>{formatReturn(position.returnPct)}</span></td><td><button aria-label={`Abrir ${position.name}`} className="row-action" onClick={() => openAsset(position)} type="button"><ChevronRight size={19} /></button></td></tr>)}</tbody></table></div></section>
          </>}

          {screen === "activo" && <>
            <button className="back-link" onClick={() => navigate("cartera")} type="button"><ArrowLeft size={17} />Volver a cartera</button>
            <section className="asset-detail-hero"><div className="asset-detail-title"><span className="detail-badge">{activeAsset.assetClass}</span><span className="detail-badge muted">{activeAsset.currency}</span><p className="eyebrow">{activeAsset.platform}</p><h1>{activeAsset.name}</h1><div className="asset-identifiers"><span>{activeAsset.isin}</span><button aria-label="Copiar identificador" onClick={() => { setNotice("Identificador copiado para consulta. Esta demostración no accede a mercados externos."); resetNotice(); }} type="button">Copiar</button></div></div><div className="asset-value-card"><span>Valor de mercado</span><strong>{euroPrecise.format(activeAsset.value)}</strong><p className={currentAssetGain >= 0 ? "text-positive" : "text-negative"}>{`${currentAssetGain >= 0 ? "+" : ""}${euroPrecise.format(currentAssetGain)} · ${formatReturn(activeAsset.returnPct)}`}</p><small>Actualización de demostración</small></div></section>
            <section className="asset-detail-grid"><article className="panel asset-information"><div className="panel-heading"><div><p className="eyebrow">Ficha del activo</p><h2>Información para contextualizar la posición</h2></div></div><div className="asset-detail-data"><div><span>Tipo de activo</span><strong>{activeAsset.assetClass}</strong></div><div><span>Fuente</span><strong>{activeAsset.platform}</strong></div><div><span>Unidades</span><strong>{oneDecimal.format(activeAsset.quantity)}</strong></div><div><span>Coste asociado</span><strong>{euroPrecise.format(activeAsset.cost)}</strong></div><div><span>Rating informativo</span><strong>{activeAsset.rating ?? "Pendiente"}</strong></div><div><span>Riesgo estimado</span><strong>{activeAsset.risk} / 7</strong></div></div><div className="objective-box"><strong>Objetivo de seguimiento</strong><p>Centralizar la posición, su evolución y los datos que explican el resultado. La información de mercado y las métricas definitivas se activarán al conectar una fuente autorizada.</p></div></article><article className="panel asset-chart-panel"><div className="panel-heading"><div><p className="eyebrow">Evolución del activo</p><h2>Importes en EUR</h2></div><span className="period-tabs"><button className="active" type="button">1M</button><button type="button">6M</button><button type="button">1A</button></span></div><div className="large-trend"><MiniTrend color={activeAsset.returnPct >= 0 ? "#157d5c" : "#dd6270"} label="Evolución del activo" values={activeAsset.trend} /></div><div className="trend-axis"><span>Inicio</span><span>Semana 2</span><span>Semana 3</span><span>Hoy</span></div><div className="risk-card"><div><ShieldCheck size={19} /><strong>Riesgo de la posición</strong><span>La escala es informativa y no elimina el riesgo de inversión.</span></div><div className="risk-scale">{[1, 2, 3, 4, 5, 6, 7].map((value) => <i className={value === activeAsset.risk ? "selected" : ""} key={value}>{value}</i>)}</div></div></article></section>
          </>}

          {screen === "analisis" && <>
            <section className="page-heading compact-heading"><div><p className="eyebrow">Análisis de exposición</p><h1>Observa el riesgo detrás del rendimiento.</h1><p className="subtitle">Indicadores de concentración, duración y distribución para preguntas de decisión, no recomendaciones automáticas.</p></div><button className="button secondary" onClick={() => navigate("cartera")} type="button"><WalletCards size={17} />Ver cartera</button></section>
            <section className="analysis-layout"><aside className="analysis-filters"><div className="filter-title"><Filter size={17} /><strong>Filtros</strong></div><label><span>Clase de activo</span><button type="button">Todas <ChevronDown size={15} /></button></label><label><span>País o mercado</span><button type="button">Global <ChevronDown size={15} /></button></label><label><span>Plataforma</span><button type="button">{selectedPlatform === "todos" ? "Todas" : platforms.find((platform) => platform.id === selectedPlatform)?.name} <ChevronDown size={15} /></button></label><div className="analysis-filter-note"><ShieldCheck size={17} />Los filtros se basan en el conjunto de datos disponible.</div></aside><div className="analysis-content"><section className="analysis-cards"><article className="analysis-card"><p>Total invertido</p><strong>{euroPrecise.format(totals.value)}</strong><dl><div><dt>Renta variable</dt><dd>{euro.format(assetAllocation.find((item) => item.label === "Renta variable")?.value ?? 0)}</dd></div><div><dt>Préstamos</dt><dd>{euro.format(assetAllocation.find((item) => item.label === "Préstamos")?.value ?? 0)}</dd></div><div><dt>Otros activos</dt><dd>{euro.format((assetAllocation.find((item) => item.label === "Bonos")?.value ?? 0) + (assetAllocation.find((item) => item.label === "Cripto")?.value ?? 0))}</dd></div></dl></article><article className="analysis-card"><p>Periodo medio</p><strong>17m. 1d.</strong><Histogram values={[18, 76, 42, 61, 9, 6, 12, 4, 2, 1, 2, 3]} /><span>Distribución orientativa de plazos</span></article><article className="analysis-card"><p>Rentabilidad media ponderada</p><strong>{oneDecimal.format(totals.returnPct)} %</strong><Histogram color="#1d9b78" values={[0, 12, 26, 74, 38, 13, 8, 4, 36, 1]} /><span>Por posición y fuente disponible</span></article></section><section className="analysis-bottom-grid"><article className="panel diversification-card"><p className="eyebrow">Diversificación</p><h2>Exposición por clase de activo</h2><AllocationDonut items={assetAllocation} /><div className="diversification-score"><strong>61 %</strong><span>diversificación estimada</span></div><p>La puntuación es indicativa y solo evalúa las posiciones presentes en esta demostración.</p></article><article className="panel exposure-map"><div className="panel-heading"><div><p className="eyebrow">Mapa de exposición</p><h2>Activos por categoría</h2></div><span className="badge badge-neutral">{assetAllocation.length} tipos</span></div><div className="exposure-blocks">{assetAllocation.map((asset, index) => <div className={`exposure-block block-${index}`} key={asset.id} style={{ background: asset.color }}><strong>{asset.label}</strong><span>{euro.format(asset.value)}</span></div>)}</div><div className="analysis-callout"><AlertCircle size={18} /><span>Antes de usar estas métricas para decisiones, confirma que todas las fuentes están actualizadas y conciliadas.</span></div></article></section></div></section>
          </>}

          {screen === "fiscal" && <>
            <section className="page-heading compact-heading"><div><p className="eyebrow">Fiscalidad anual</p><h1>Borrador fiscal para revisión.</h1><p className="subtitle">Consolida operaciones y controles de cobertura antes de trasladar datos a Renta WEB o a tu asesoría.</p></div><div className="heading-actions"><label className="year-select"><span>Ejercicio</span><select onChange={(event) => setTaxYear(event.target.value)} value={taxYear}><option value="2026">2026</option><option value="2025">2025</option></select></label><button className="button primary" onClick={generateTaxDraft} type="button"><FileText size={17} />Generar borrador</button></div></section>
            <section className="tax-disclaimer"><AlertCircle size={20} /><div><strong>Revisión profesional obligatoria</strong><p>Este módulo genera un borrador de apoyo. No presenta declaraciones ni sustituye los datos fiscales, Renta WEB o el criterio de un profesional tributario.</p></div></section>
            <section className="tax-status-grid"><article className="tax-status-card ready"><CheckCircle2 size={20} /><div><span>Fuentes incluidas</span><strong>2 de 4 verificadas</strong><small>MyInvestor y Trade Republic</small></div></article><article className="tax-status-card review"><AlertCircle size={20} /><div><span>Revisiones pendientes</span><strong>2 fuentes</strong><small>Mintos y Binance requieren conciliación</small></div></article><article className="tax-status-card neutral"><CalendarDays size={20} /><div><span>Periodo analizado</span><strong>1 ene. — 31 dic. {taxYear}</strong><small>Datos de demostración</small></div></article></section>
            <section className="tax-grid"><article className="panel tax-report-card"><div className="panel-heading"><div><p className="eyebrow">Resumen del borrador</p><h2>Rendimientos y transmisiones</h2></div><span className={taxGenerated ? "badge badge-success" : "badge badge-neutral"}>{taxGenerated ? "Generado para revisión" : "Pendiente de generar"}</span></div><div className="tax-lines"><div><span>Ganancias y pérdidas de transmisiones</span><strong>+1.428,40 €</strong><small>3 operaciones con datos completos</small></div><div><span>Dividendos e intereses brutos</span><strong>318,20 €</strong><small>4 cobros informados</small></div><div><span>Retenciones informadas</span><strong>60,46 €</strong><small>Requiere contraste con datos fiscales</small></div><div><span>Comisiones asociadas</span><strong>42,10 €</strong><small>Incluidas solo en fuentes verificadas</small></div></div><div className="tax-report-footer"><span><ShieldCheck size={17} />Cada línea debe conservar el vínculo con la transacción y la fuente original.</span>{taxGenerated && <button className="button ghost" onClick={() => setNotice("La exportación PDF/CSV se habilitará con persistencia, historial transaccional completo y revisión registrada.")} type="button"><Download size={16} />Exportación pendiente</button>}</div></article><article className="panel tax-checklist"><p className="eyebrow">Control de calidad</p><h2>Qué debe revisarse antes de usarlo</h2><ul><li><CheckCircle2 size={17} />Identificadores y fechas de las operaciones incluidas</li><li><CheckCircle2 size={17} />Importes brutos, gastos y retenciones de fuentes verificadas</li><li><AlertCircle size={17} />Valores homogéneos, recompras y operaciones no conciliadas</li><li><AlertCircle size={17} />Conversión de divisas y retenciones extranjeras</li></ul><button className="text-button" onClick={() => navigate("administracion")} type="button">Revisar calidad de fuentes <ChevronRight size={16} /></button></article></section>
            <section className="panel tax-flow"><div><p className="eyebrow">Flujo recomendado</p><h2>Del dato original al borrador revisable</h2></div><ol><li><span>1</span><div><strong>Sincroniza y concilia</strong><p>Importa o conecta los movimientos con identificador externo y fecha.</p></div></li><li><span>2</span><div><strong>Resuelve excepciones</strong><p>Corrige duplicados, posiciones sin coste o conversiones de moneda pendientes.</p></div></li><li><span>3</span><div><strong>Genera y revisa</strong><p>Contrasta el borrador con datos fiscales y documentación de entidades.</p></div></li><li><span>4</span><div><strong>Traslada con criterio profesional</strong><p>Usa Renta WEB o tu asesoría; la aplicación no realiza la presentación.</p></div></li></ol></section>
          </>}

          {screen === "plataformas" && <>
            <section className="page-heading compact-heading"><div><p className="eyebrow">Catálogo de fuentes</p><h1>Plataformas y rendimiento.</h1><p className="subtitle">Gestiona tus fuentes, revisa su cobertura y compara su contribución al resultado.</p></div><button className="button primary" onClick={() => setShowAdd(true)} type="button"><Plus size={17} />Nueva plataforma</button></section>
            <section className="toolbar"><label className="search-field"><Search size={18} /><span className="visually-hidden">Buscar plataforma</span><input onChange={(event) => setQuery(event.target.value)} placeholder="Buscar plataforma, país o tipo…" value={query} /></label><label className="select-wrap"><span className="visually-hidden">Ordenar plataformas</span><select onChange={(event) => setSortBy(event.target.value as "return" | "value")} value={sortBy}><option value="return">Ordenar por rendimiento</option><option value="value">Ordenar por valor</option></select><ChevronDown size={16} /></label></section>
            <section className="platform-grid">{visiblePlatforms.map((platform) => <article className="platform-card" key={platform.id}><div className="platform-card-top"><div className="platform-ident"><div className="platform-logo large" style={{ backgroundColor: `${platform.accent}18`, color: platform.accent }}>{platform.initials}</div><div><strong>{platform.name}</strong><span>{platform.kind} · {platform.country}</span></div></div><span className={`badge ${qualityClass(platform.quality)}`}>{platform.quality}</span></div><div className="platform-metrics"><div><span>Valor actual</span><strong>{euro.format(platform.value)}</strong></div><div><span>Rentabilidad</span><strong className={platform.returnPct >= 0 ? "text-positive" : "text-negative"}>{formatReturn(platform.returnPct)}</strong></div></div><MiniTrend color={platform.returnPct >= 0 ? platform.accent : "#e06057"} values={platform.trend} /><div className="platform-card-footer"><span><FileSpreadsheet size={15} />{platform.method}</span><span>Actualizado {platform.updated}</span></div></article>)}</section>{visiblePlatforms.length === 0 && <div className="empty-state"><Building2 size={26} /><strong>No se encontraron plataformas</strong><span>Prueba con otra búsqueda o añade una nueva fuente de datos.</span></div>}
          </>}

          {screen === "administracion" && <>
            <section className="page-heading compact-heading"><div><p className="eyebrow">Centro de control</p><h1>Añade datos sin perder trazabilidad.</h1><p className="subtitle">Selecciona el método apropiado para cada plataforma. Las conexiones sensibles se preparan de forma segura y se autorizan en el servidor.</p></div></section>
            <section className="admin-grid"><article className="panel admin-primary"><div className="panel-heading"><div><p className="eyebrow">1. Crear una plataforma</p><h2>Empieza por identificar la fuente</h2></div><Landmark size={23} className="heading-icon" /></div><form className="admin-form" onSubmit={addPlatform}><label><span>Nombre de la plataforma</span><input name="name" placeholder="Ej. Indexa Capital" required /></label><div className="form-row"><label><span>Tipo</span><select defaultValue="Broker" name="kind">{platformKinds.map((kind) => <option key={kind} value={kind}>{kind}</option>)}</select></label><label><span>País</span><input defaultValue="España" name="country" /></label></div><div className="form-row"><label><span>Método inicial</span><select defaultValue="Manual" name="method">{dataMethods.map((method) => <option key={method} value={method}>{method}</option>)}</select></label><label><span>Valor actual (€)</span><input defaultValue="0" inputMode="decimal" name="value" /></label></div><label><span>Rentabilidad acumulada (%)</span><input defaultValue="0" inputMode="decimal" name="returnPct" /></label><button className="button primary full-width" type="submit"><Plus size={17} />Crear plataforma</button></form></article><article className="panel methods-panel"><div className="panel-heading"><div><p className="eyebrow">2. Añadir datos</p><h2>Elige el canal más eficiente</h2></div></div><button className="method-row interactive" onClick={openUpload} type="button"><span className="method-icon blue"><UploadCloud size={19} /></span><span><strong>CSV o Excel</strong><small>Previsualiza columnas antes de cargar. Recomendado para empezar.</small></span><ChevronRight size={18} /></button><button className="method-row interactive" onClick={() => { setSourceMethod("Google Sheets"); setSourceUrl(""); }} type="button"><span className="method-icon green"><FileSpreadsheet size={19} /></span><span><strong>Google Sheets</strong><small>Registra una hoja y autorízala mediante OAuth en la versión productiva.</small></span><ChevronRight size={18} /></button><button className="method-row interactive" onClick={() => { setSourceMethod("Base de datos"); setSourceUrl(""); }} type="button"><span className="method-icon violet"><Database size={19} /></span><span><strong>Base de datos</strong><small>Solicita un conector de lectura; no pegues credenciales en el navegador.</small></span><ChevronRight size={18} /></button><div className="method-security"><ShieldCheck size={17} /><span><strong>Principio de mínimo privilegio.</strong> Los conectores de producción usarán OAuth o secretos cifrados y acceso de solo lectura.</span></div></article></section>
            <section className="panel remote-source-panel"><div className="panel-heading"><div><p className="eyebrow">3. Preparar una fuente conectada</p><h2>{sourceMethod === "Google Sheets" ? "Registrar una hoja de Google" : "Solicitar un conector de base de datos"}</h2></div><span className="badge badge-neutral">Sin credenciales locales</span></div><form className="remote-form" onSubmit={registerRemoteSource}><label><span>Tipo de fuente</span><select onChange={(event) => setSourceMethod(event.target.value as DataMethod)} value={sourceMethod}><option value="Google Sheets">Google Sheets</option><option value="Base de datos">Base de datos</option></select></label><label className="grow"><span>{sourceMethod === "Google Sheets" ? "URL HTTPS de la hoja" : "Nombre o referencia del origen"}</span><input onChange={(event) => setSourceUrl(event.target.value)} placeholder={sourceMethod === "Google Sheets" ? "https://docs.google.com/spreadsheets/d/..." : "Ej. PostgreSQL de reporting — entorno lectura"} value={sourceUrl} /></label><button className="button secondary" type="submit">Registrar intención</button></form></section>
            <section className="connector-roadmap"><article><FileSpreadsheet size={20} /><div><strong>Google Sheets: OAuth de lectura</strong><span>Proyecto Cloud, consentimiento, URL de retorno y token cifrado en servidor.</span></div><button onClick={() => navigate("fiscal")} type="button">Ver control fiscal <ArrowRight size={16} /></button></article><article><Database size={20} /><div><strong>SQL: gateway de solo lectura</strong><span>Vista de datos, TLS, usuario con SELECT e importación incremental por lote.</span></div><button onClick={() => setNotice("Consulta docs/CONEXIONES_Y_FISCALIDAD.md para los pasos de configuración y controles requeridos.")} type="button">Ver plan <ArrowRight size={16} /></button></article></section>
            <section className="panel import-contract"><div className="panel-heading"><div><p className="eyebrow">Contrato de importación inicial</p><h2>Columnas que el sistema reconocerá de forma automática</h2></div></div><div className="contract-grid"><div><strong>Posiciones</strong><span>instrumento, ISIN/ticker, cantidad, valor, coste, divisa, fecha</span></div><div><strong>Transacciones</strong><span>fecha, tipo, importe, comisiones, cantidad, identificador externo</span></div><div><strong>Calidad</strong><span>origen, lote, filas aceptadas, filas rechazadas, fecha de actualización</span></div></div></section>
          </>}
        </div>
      </section>

      {showAdd && <div className="modal-backdrop" role="presentation"><section aria-labelledby="modal-title" aria-modal="true" className="modal" role="dialog"><button aria-label="Cerrar" className="modal-close" onClick={() => setShowAdd(false)} type="button"><X size={18} /></button><p className="eyebrow">Nueva fuente</p><h2 id="modal-title">Añadir plataforma</h2><p>Los valores iniciales sirven para comenzar la comparación. Podrás actualizarlos mediante una importación.</p><form className="admin-form" onSubmit={addPlatform}><label><span>Nombre</span><input autoFocus name="name" placeholder="Ej. DEGIRO" required /></label><div className="form-row"><label><span>Tipo</span><select defaultValue="Broker" name="kind">{platformKinds.map((kind) => <option key={kind} value={kind}>{kind}</option>)}</select></label><label><span>País</span><input defaultValue="España" name="country" /></label></div><div className="form-row"><label><span>Entrada</span><select defaultValue="Manual" name="method">{dataMethods.map((method) => <option key={method} value={method}>{method}</option>)}</select></label><label><span>Valor (€)</span><input defaultValue="0" inputMode="decimal" name="value" /></label></div><label><span>Rentabilidad acumulada (%)</span><input defaultValue="0" inputMode="decimal" name="returnPct" /></label><button className="button primary full-width" type="submit">Guardar plataforma</button></form></section></div>}
      {showImport && importPreview && <div className="modal-backdrop" role="presentation"><section aria-labelledby="import-title" aria-modal="true" className="modal import-modal" role="dialog"><button aria-label="Cerrar" className="modal-close" onClick={() => { setShowImport(false); setImportPreview(null); }} type="button"><X size={18} /></button><p className="eyebrow">Previsualización segura</p><h2 id="import-title">Revisa tu archivo antes de aplicarlo</h2><p className="file-name"><FileSpreadsheet size={17} />{importPreview.fileName}</p><label className="import-target"><span>Aplicar a la plataforma</span><select onChange={(event) => setImportTarget(event.target.value)} value={importTarget}>{platforms.map((platform) => <option key={platform.id} value={platform.id}>{platform.name}</option>)}</select></label>{importPreview.warnings.length > 0 && <div className="preview-warnings">{importPreview.warnings.map((warning) => <p key={warning}><AlertCircle size={15} />{warning}</p>)}</div>}<div className="preview-table-wrap"><table><thead><tr>{importPreview.headers.slice(0, 6).map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{importPreview.rows.slice(0, 5).map((row, index) => <tr key={`row-${index}`}>{importPreview.headers.slice(0, 6).map((header) => <td key={header}>{String(row[header] ?? "—")}</td>)}</tr>)}</tbody></table></div><div className="modal-actions"><button className="button ghost" onClick={() => { setShowImport(false); setImportPreview(null); }} type="button">Cancelar</button><button className="button primary" onClick={confirmImport} type="button"><CheckCircle2 size={17} />Aplicar en demostración</button></div></section></div>}
    </main>
  );
}
