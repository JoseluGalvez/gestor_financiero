"use client";

import readXlsxFile from "read-excel-file/browser";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Database,
  FileSpreadsheet,
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
  UploadCloud,
  WalletCards,
  X,
} from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";

type Screen = "resumen" | "plataformas" | "administracion";
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

const platformKinds: PlatformKind[] = ["Broker", "P2P", "Banco", "Fondos", "Cripto"];
const dataMethods: DataMethod[] = ["CSV", "Excel", "Manual", "Google Sheets", "Base de datos"];

const euro = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const oneDecimal = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function formatReturn(value: number) {
  return `${value >= 0 ? "+" : ""}${oneDecimal.format(value)} %`;
}

function qualityClass(quality: Quality) {
  if (quality === "Verificado") return "badge-success";
  if (quality === "Revisar") return "badge-warning";
  return "badge-neutral";
}

function getInitials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase() || "NP";
}

function toNumber(value: string | number | boolean | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "boolean" || value === null || value === undefined) return 0;
  const cleaned = String(value)
    .trim()
    .replace(/\s/g, "")
    .replace(/€/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.-]/g, "");
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
      if (quoted && nextCharacter === '"') {
        currentCell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      currentRow.push(currentCell.trim());
      if (currentRow.some(Boolean)) table.push(currentRow);
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += character;
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(Boolean)) table.push(currentRow);
  }

  const [rawHeaders = [], ...rawRows] = table;
  const headers = rawHeaders.map((header, index) => header || `Columna ${index + 1}`);
  const rows = rawRows.slice(0, 5001).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? null])),
  ) as Record<string, string | number | boolean | null>[];

  return { headers, rows, isTruncated: rawRows.length > 5000 };
}

async function parseXlsx(file: File) {
  const sheets = await readXlsxFile(file);
  const rawRows = sheets[0]?.data ?? [];
  const [rawHeaders = [], ...dataRows] = rawRows;
  const headers = rawHeaders.map((value, index) => String(value ?? "").trim() || `Columna ${index + 1}`);
  if (headers.length === 0) throw new Error("La primera fila debe contener encabezados.");

  const rows = dataRows.slice(0, 5001).map((row) =>
    Object.fromEntries(
      headers.map((header, index) => {
        const value = row[index];
        const normalizedValue = value instanceof Date ? value.toISOString().slice(0, 10) : value === null ? null : String(value ?? "").trim() || null;
        return [header, normalizedValue];
      }),
    ),
  ) as Record<string, string | number | boolean | null>[];

  return { headers, rows: rows.slice(0, 5000), isTruncated: dataRows.length > 5000 };
}

function MiniTrend({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const denominator = Math.max(max - min, 1);
  const points = values
    .map((point, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 34 - ((point - min) / denominator) * 28;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg aria-label="Tendencia de valor" className="mini-trend" viewBox="0 0 100 38" preserveAspectRatio="none" role="img">
      <polyline fill="none" points={points} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
    </svg>
  );
}

function Donut({ values }: { values: Platform[] }) {
  const total = values.reduce((sum, platform) => sum + platform.value, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const segments = values.map((platform, index) => {
    const proportion = total > 0 ? platform.value / total : 0;
    const priorValue = values.slice(0, index).reduce((sum, item) => sum + item.value, 0);
    return {
      platform,
      segment: proportion * circumference,
      offset: total > 0 ? (priorValue / total) * circumference : 0,
    };
  });

  return (
    <div className="donut-wrap">
      <svg aria-label="Distribución de valor por plataforma" className="donut" viewBox="0 0 112 112" role="img">
        <circle cx="56" cy="56" fill="none" r={radius} stroke="#edf1f7" strokeWidth="13" />
        {segments.map(({ platform, segment, offset }) => (
          <circle
            key={platform.id}
            cx="56"
            cy="56"
            fill="none"
            r={radius}
            stroke={platform.accent}
            strokeDasharray={`${Math.max(segment - 3, 0)} ${circumference}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            strokeWidth="13"
            transform="rotate(-90 56 56)"
          />
        ))}
      </svg>
      <div className="donut-center">
        <strong>{values.length}</strong>
        <span>fuentes</span>
      </div>
    </div>
  );
}

function InsightCard({ title, value, change, tone, icon }: { title: string; value: string; change: string; tone: "positive" | "neutral" | "negative"; icon: React.ReactNode }) {
  return (
    <article className="insight-card">
      <div className="insight-icon">{icon}</div>
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
        <span className={`metric-change ${tone}`}>
          {tone === "negative" ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
          {change}
        </span>
      </div>
    </article>
  );
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
  const inputRef = useRef<HTMLInputElement>(null);

  const visiblePlatforms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const subset = platforms.filter((platform) => {
      const matchesPlatform = selectedPlatform === "todos" || platform.id === selectedPlatform;
      const matchesQuery = !normalizedQuery || `${platform.name} ${platform.kind} ${platform.country}`.toLowerCase().includes(normalizedQuery);
      return matchesPlatform && matchesQuery;
    });
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

  const bestPlatform = visiblePlatforms.length > 0 ? visiblePlatforms[0] : null;

  const resetNotice = () => {
    window.setTimeout(() => setNotice(null), 4200);
  };

  function addPlatform(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const kind = String(form.get("kind") ?? "Broker") as PlatformKind;
    const country = String(form.get("country") ?? "Global").trim() || "Global";
    const method = String(form.get("method") ?? "Manual") as DataMethod;
    const value = toNumber(String(form.get("value") ?? "0"));
    const returnPct = toNumber(String(form.get("returnPct") ?? "0"));

    if (!name) {
      setNotice("Indica el nombre de la plataforma antes de crearla.");
      resetNotice();
      return;
    }

    const cost = returnPct === -100 ? value : value / (1 + returnPct / 100);
    const accentColors = ["#ef6c4e", "#3e8e98", "#6679c7", "#b7844c"];
    const newPlatform: Platform = {
      id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
      name,
      initials: getInitials(name),
      kind,
      country,
      currency: "EUR",
      method,
      value,
      cost: Number.isFinite(cost) ? cost : value,
      returnPct,
      quality: method === "Manual" ? "Parcial" : "Revisar",
      updated: "Ahora",
      positions: 0,
      accent: accentColors[platforms.length % accentColors.length],
      trend: [24, 28, 31, 30, 36, 38, 43, 46, 49, 52, 56, 60],
    };

    setPlatforms((current) => [newPlatform, ...current]);
    setSelectedPlatform("todos");
    setShowAdd(false);
    setScreen("plataformas");
    setNotice(`${name} se ha añadido a la comparación. Los datos permanecen solo en esta sesión de demostración.`);
    resetNotice();
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["csv", "xlsx"].includes(extension)) {
      setNotice("Selecciona un archivo CSV o XLSX. Convierte los archivos XLS heredados antes de cargarlos.");
      resetNotice();
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setNotice("El archivo supera el límite de 8 MB para esta demostración.");
      resetNotice();
      return;
    }

    try {
      const parsed = extension === "csv" ? parseCsv(await file.text()) : await parseXlsx(file);
      const warnings: string[] = [];
      const normalizedHeaders = parsed.headers.map((header) => header.toLowerCase().trim());
      if (!normalizedHeaders.some((header) => ["valor", "value", "market_value", "valor_actual"].includes(header))) {
        warnings.push("No se ha detectado una columna de valor. Podrás revisar el mapeo antes de una importación real.");
      }
      if (parsed.rows.length === 0) warnings.push("No se encontraron filas de datos en la primera hoja.");
      if (parsed.isTruncated) warnings.push("El archivo contiene más de 5.000 filas; la demostración solo procesa las primeras 5.000.");
      setImportPreview({ fileName: file.name, headers: parsed.headers, rows: parsed.rows.slice(0, 10), warnings });
      setShowImport(true);
    } catch {
      setNotice("No se pudo leer el archivo. Revisa que el CSV/XLSX no esté cifrado, dañado o protegido con contraseña.");
      resetNotice();
    }
  }

  function confirmImport() {
    if (!importPreview) return;
    const importedRows = importPreview.rows;
    const totalValue = importedRows.reduce((sum, row) => sum + valueFromRow(row, ["valor", "value", "market_value", "valor_actual"]), 0);
    const totalCost = importedRows.reduce((sum, row) => sum + valueFromRow(row, ["coste", "cost", "cost_basis", "valor_inicial"]), 0);
    const positions = importedRows.length;

    setPlatforms((current) =>
      current.map((platform) => {
        if (platform.id !== importTarget) return platform;
        const nextValue = totalValue > 0 ? totalValue : platform.value;
        const nextCost = totalCost > 0 ? totalCost : platform.cost;
        return {
          ...platform,
          value: nextValue,
          cost: nextCost,
          returnPct: nextCost > 0 ? ((nextValue - nextCost) / nextCost) * 100 : platform.returnPct,
          positions: positions || platform.positions,
          quality: importPreview.warnings.length > 0 ? "Revisar" : "Verificado",
          updated: "Ahora",
          method: importPreview.fileName.toLowerCase().endsWith(".csv") ? "CSV" : "Excel",
        };
      }),
    );
    setShowImport(false);
    setImportPreview(null);
    setScreen("resumen");
    setNotice("Previsualización aplicada en la sesión. En producción, este paso creará un lote auditable y conservará el archivo en almacenamiento privado.");
    resetNotice();
  }

  function registerRemoteSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isValidUrl = /^https:\/\//i.test(sourceUrl.trim());
    if (sourceMethod === "Google Sheets" && !isValidUrl) {
      setNotice("Introduce una URL HTTPS de Google Sheets para registrar la fuente.");
      resetNotice();
      return;
    }
    setNotice(
      sourceMethod === "Google Sheets"
        ? "Fuente registrada como pendiente de autorización. En producción, se conectará por OAuth con permisos mínimos."
        : "Solicitud de conector registrada. Las credenciales nunca se guardan en el navegador; la conexión real requiere un adaptador de solo lectura del lado servidor.",
    );
    setSourceUrl("");
    resetNotice();
  }

  function openUpload() {
    inputRef.current?.click();
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><LineChart size={22} strokeWidth={2.7} /></div>
          <div>
            <strong>Portafolio</strong>
            <span>Intel</span>
          </div>
        </div>

        <nav aria-label="Navegación principal" className="nav-list">
          <button className={screen === "resumen" ? "nav-item active" : "nav-item"} onClick={() => setScreen("resumen")} type="button">
            <LayoutDashboard size={18} />
            Resumen
          </button>
          <button className={screen === "plataformas" ? "nav-item active" : "nav-item"} onClick={() => setScreen("plataformas")} type="button">
            <Building2 size={18} />
            Plataformas
            <span className="nav-count">{platforms.length}</span>
          </button>
          <button className={screen === "administracion" ? "nav-item active" : "nav-item"} onClick={() => setScreen("administracion")} type="button">
            <SlidersHorizontal size={18} />
            Administración
          </button>
          <button className="nav-item muted" onClick={() => setNotice("El módulo de análisis avanzado pertenece al roadmap posterior, tras validar la calidad de los datos importados.")} type="button">
            <Sparkles size={18} />
            Análisis
            <span className="coming-soon">Próx.</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="security-card">
            <ShieldCheck size={18} />
            <div>
              <strong>Diseñado para datos sensibles</strong>
              <span>Sin credenciales de terceros en el navegador.</span>
            </div>
          </div>
          <button className="help-button" onClick={() => setScreen("administracion")} type="button">
            <CircleHelp size={17} />
            Guía de importación
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="crumbs">
            <span>Portafolio Intel</span>
            <ChevronRight size={15} />
            <strong>{screen === "resumen" ? "Resumen" : screen === "plataformas" ? "Plataformas" : "Administración"}</strong>
          </div>
          <div className="topbar-actions">
            <div className="session-pill"><span /> Entorno de demostración</div>
            <button aria-label="Actualizar datos" className="icon-button" onClick={() => { setNotice("La actualización automática se activará con conectores autorizados. Los datos de esta demostración no se sincronizan."); resetNotice(); }} type="button">
              <RefreshCw size={17} />
            </button>
            <div className="avatar" aria-label="Perfil de usuario">JG</div>
          </div>
        </header>

        <div className="content">
          {notice && (
            <div className="notice" role="status">
              <AlertCircle size={18} />
              <span>{notice}</span>
              <button aria-label="Cerrar aviso" onClick={() => setNotice(null)} type="button"><X size={16} /></button>
            </div>
          )}

          {screen === "resumen" && (
            <>
              <section className="page-heading">
                <div>
                  <p className="eyebrow">Visión consolidada</p>
                  <h1>Decide con la foto completa de tu patrimonio.</h1>
                  <p className="subtitle">Compara el resultado de cada plataforma y detecta de un vistazo la calidad del dato que lo respalda.</p>
                </div>
                <div className="heading-actions">
                  <button className="button secondary" onClick={() => setScreen("administracion")} type="button"><Plus size={17} /> Añadir plataforma</button>
                  <button className="button primary" onClick={openUpload} type="button"><UploadCloud size={17} /> Importar datos</button>
                </div>
              </section>

              <input accept=".csv,.xlsx" className="visually-hidden" onChange={handleFile} ref={inputRef} type="file" />

              <section aria-label="Filtros de cartera" className="filter-bar">
                <div className="filter-label"><Filter size={16} /> Analizar</div>
                <label className="select-wrap">
                  <span className="visually-hidden">Filtrar por plataforma</span>
                  <select onChange={(event) => setSelectedPlatform(event.target.value)} value={selectedPlatform}>
                    <option value="todos">Todas las plataformas</option>
                    {platforms.map((platform) => <option key={platform.id} value={platform.id}>{platform.name}</option>)}
                  </select>
                  <ChevronDown size={16} />
                </label>
                <label className="select-wrap">
                  <span className="visually-hidden">Ordenar por</span>
                  <select onChange={(event) => setSortBy(event.target.value as "return" | "value")} value={sortBy}>
                    <option value="return">Mayor rentabilidad</option>
                    <option value="value">Mayor valor</option>
                  </select>
                  <ChevronDown size={16} />
                </label>
                <span className="filter-caption">Datos calculados con la información disponible</span>
              </section>

              <section aria-label="Indicadores de cartera" className="kpi-grid">
                <InsightCard change={`${visiblePlatforms.length} plataformas incluidas`} icon={<WalletCards size={20} />} title="Patrimonio bajo seguimiento" tone="neutral" value={euro.format(totals.value)} />
                <InsightCard change={formatReturn(totals.returnPct)} icon={<ArrowUpRight size={20} />} title="Resultado acumulado" tone={totals.gain >= 0 ? "positive" : "negative"} value={`${totals.gain >= 0 ? "+" : ""}${euro.format(totals.gain)}`} />
                <InsightCard change={`${totals.verified} con datos verificados`} icon={<ShieldCheck size={20} />} title="Calidad de los datos" tone="positive" value={`${visiblePlatforms.length > 0 ? Math.round((totals.verified / visiblePlatforms.length) * 100) : 0} %`} />
                <InsightCard change={bestPlatform ? `${formatReturn(bestPlatform.returnPct)} de rentabilidad simple` : "Sin datos"} icon={<BarChart3 size={20} />} title="Mejor plataforma" tone="positive" value={bestPlatform?.name ?? "—"} />
              </section>

              <section className="dashboard-grid">
                <article className="panel performance-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">Rendimiento por plataforma</p>
                      <h2>¿Dónde está funcionando mejor tu capital?</h2>
                    </div>
                    <span className="panel-note"><span className="dot" /> Rentabilidad simple</span>
                  </div>
                  <div className="performance-list">
                    {visiblePlatforms.map((platform) => (
                      <div className="performance-row" key={platform.id}>
                        <div className="platform-ident">
                          <div className="platform-logo" style={{ backgroundColor: `${platform.accent}18`, color: platform.accent }}>{platform.initials}</div>
                          <div>
                            <strong>{platform.name}</strong>
                            <span>{platform.kind} · {platform.positions} posiciones</span>
                          </div>
                        </div>
                        <MiniTrend color={platform.returnPct >= 0 ? platform.accent : "#e06057"} values={platform.trend} />
                        <div className="performance-value">
                          <strong className={platform.returnPct >= 0 ? "text-positive" : "text-negative"}>{formatReturn(platform.returnPct)}</strong>
                          <span>{euro.format(platform.value)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {visiblePlatforms.length === 0 && <div className="empty-inline">No hay plataformas que coincidan con este filtro.</div>}
                </article>

                <article className="panel distribution-panel">
                  <div className="panel-heading compact">
                    <div>
                      <p className="eyebrow">Distribución</p>
                      <h2>Capital por fuente</h2>
                    </div>
                  </div>
                  <Donut values={visiblePlatforms} />
                  <div className="legend-list">
                    {visiblePlatforms.slice(0, 4).map((platform) => {
                      const ratio = totals.value > 0 ? (platform.value / totals.value) * 100 : 0;
                      return <div className="legend-row" key={platform.id}><span><i style={{ background: platform.accent }} />{platform.name}</span><strong>{oneDecimal.format(ratio)} %</strong></div>;
                    })}
                  </div>
                </article>
              </section>

              <section className="panel data-health">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Calidad de información</p>
                    <h2>Prioridades antes de comparar con más precisión</h2>
                  </div>
                  <button className="text-button" onClick={() => setScreen("administracion")} type="button">Gestionar fuentes <ChevronRight size={16} /></button>
                </div>
                <div className="health-grid">
                  {platforms.filter((platform) => platform.quality !== "Verificado").slice(0, 3).map((platform) => (
                    <article className="health-item" key={platform.id}>
                      <div className="health-icon"><AlertCircle size={18} /></div>
                      <div><strong>{platform.name}</strong><p>{platform.quality === "Parcial" ? "Falta un extracto reciente para validar las métricas." : "Revisa el último archivo importado y confirma las filas detectadas."}</p></div>
                      <button onClick={() => { setImportTarget(platform.id); openUpload(); }} type="button">Actualizar</button>
                    </article>
                  ))}
                  {platforms.every((platform) => platform.quality === "Verificado") && <div className="empty-inline">Todas las plataformas del panel tienen datos verificados.</div>}
                </div>
              </section>
            </>
          )}

          {screen === "plataformas" && (
            <>
              <section className="page-heading compact-heading">
                <div><p className="eyebrow">Catálogo de fuentes</p><h1>Plataformas y rendimiento.</h1><p className="subtitle">Gestiona tus fuentes, revisa su cobertura y compara su contribución al resultado.</p></div>
                <button className="button primary" onClick={() => setShowAdd(true)} type="button"><Plus size={17} /> Nueva plataforma</button>
              </section>
              <section className="toolbar">
                <label className="search-field"><Search size={18} /><span className="visually-hidden">Buscar plataforma</span><input onChange={(event) => setQuery(event.target.value)} placeholder="Buscar plataforma, país o tipo…" value={query} /></label>
                <label className="select-wrap"><span className="visually-hidden">Ordenar plataformas</span><select onChange={(event) => setSortBy(event.target.value as "return" | "value")} value={sortBy}><option value="return">Ordenar por rendimiento</option><option value="value">Ordenar por valor</option></select><ChevronDown size={16} /></label>
              </section>
              <section className="platform-grid">
                {visiblePlatforms.map((platform) => (
                  <article className="platform-card" key={platform.id}>
                    <div className="platform-card-top"><div className="platform-ident"><div className="platform-logo large" style={{ backgroundColor: `${platform.accent}18`, color: platform.accent }}>{platform.initials}</div><div><strong>{platform.name}</strong><span>{platform.kind} · {platform.country}</span></div></div><span className={`badge ${qualityClass(platform.quality)}`}>{platform.quality}</span></div>
                    <div className="platform-metrics"><div><span>Valor actual</span><strong>{euro.format(platform.value)}</strong></div><div><span>Rentabilidad</span><strong className={platform.returnPct >= 0 ? "text-positive" : "text-negative"}>{formatReturn(platform.returnPct)}</strong></div></div>
                    <MiniTrend color={platform.returnPct >= 0 ? platform.accent : "#e06057"} values={platform.trend} />
                    <div className="platform-card-footer"><span><FileSpreadsheet size={15} /> {platform.method}</span><span>Actualizado {platform.updated}</span></div>
                  </article>
                ))}
              </section>
              {visiblePlatforms.length === 0 && <div className="empty-state"><Building2 size={26} /><strong>No se encontraron plataformas</strong><span>Prueba con otra búsqueda o añade una nueva fuente de datos.</span></div>}
            </>
          )}

          {screen === "administracion" && (
            <>
              <section className="page-heading compact-heading">
                <div><p className="eyebrow">Centro de control</p><h1>Añade datos sin perder trazabilidad.</h1><p className="subtitle">Selecciona el método apropiado para cada plataforma. Las conexiones sensibles se preparan de forma segura y se autorizan en el servidor.</p></div>
              </section>
              <section className="admin-grid">
                <article className="panel admin-primary">
                  <div className="panel-heading"><div><p className="eyebrow">1. Crear una plataforma</p><h2>Empieza por identificar la fuente</h2></div><Landmark size={23} className="heading-icon" /></div>
                  <form className="admin-form" onSubmit={addPlatform}>
                    <label><span>Nombre de la plataforma</span><input name="name" placeholder="Ej. Indexa Capital" required /></label>
                    <div className="form-row"><label><span>Tipo</span><select defaultValue="Broker" name="kind">{platformKinds.map((kind) => <option key={kind} value={kind}>{kind}</option>)}</select></label><label><span>País</span><input defaultValue="España" name="country" /></label></div>
                    <div className="form-row"><label><span>Método inicial</span><select defaultValue="Manual" name="method">{dataMethods.map((method) => <option key={method} value={method}>{method}</option>)}</select></label><label><span>Valor actual (€)</span><input defaultValue="0" inputMode="decimal" name="value" /></label></div>
                    <label><span>Rentabilidad acumulada (%)</span><input defaultValue="0" inputMode="decimal" name="returnPct" /></label>
                    <button className="button primary full-width" type="submit"><Plus size={17} /> Crear plataforma</button>
                  </form>
                </article>

                <article className="panel methods-panel">
                  <div className="panel-heading"><div><p className="eyebrow">2. Añadir datos</p><h2>Elige el canal más eficiente</h2></div></div>
                  <button className="method-row interactive" onClick={openUpload} type="button"><span className="method-icon blue"><UploadCloud size={19} /></span><span><strong>CSV o Excel</strong><small>Previsualiza columnas antes de cargar. Recomendado para empezar.</small></span><ChevronRight size={18} /></button>
                  <button className="method-row interactive" onClick={() => { setSourceMethod("Google Sheets"); setSourceUrl(""); }} type="button"><span className="method-icon green"><FileSpreadsheet size={19} /></span><span><strong>Google Sheets</strong><small>Registra una hoja y autorízala mediante OAuth en la versión productiva.</small></span><ChevronRight size={18} /></button>
                  <button className="method-row interactive" onClick={() => { setSourceMethod("Base de datos"); setSourceUrl(""); }} type="button"><span className="method-icon violet"><Database size={19} /></span><span><strong>Base de datos</strong><small>Solicita un conector de lectura; no pegues credenciales en el navegador.</small></span><ChevronRight size={18} /></button>
                  <div className="method-security"><ShieldCheck size={17} /><span><strong>Principio de mínimo privilegio.</strong> Los conectores de producción usarán OAuth o secretos cifrados y acceso de solo lectura.</span></div>
                </article>
              </section>

              <section className="panel remote-source-panel">
                <div className="panel-heading"><div><p className="eyebrow">3. Preparar una fuente conectada</p><h2>{sourceMethod === "Google Sheets" ? "Registrar una hoja de Google" : "Solicitar un conector de base de datos"}</h2></div><span className="badge badge-neutral">Sin credenciales locales</span></div>
                <form className="remote-form" onSubmit={registerRemoteSource}>
                  <label><span>Tipo de fuente</span><select onChange={(event) => setSourceMethod(event.target.value as DataMethod)} value={sourceMethod}><option value="Google Sheets">Google Sheets</option><option value="Base de datos">Base de datos</option></select></label>
                  <label className="grow"><span>{sourceMethod === "Google Sheets" ? "URL HTTPS de la hoja" : "Nombre o referencia del origen"}</span><input onChange={(event) => setSourceUrl(event.target.value)} placeholder={sourceMethod === "Google Sheets" ? "https://docs.google.com/spreadsheets/d/..." : "Ej. PostgreSQL de reporting — entorno lectura"} value={sourceUrl} /></label>
                  <button className="button secondary" type="submit">Registrar intención</button>
                </form>
              </section>

              <section className="panel import-contract">
                <div className="panel-heading"><div><p className="eyebrow">Contrato de importación inicial</p><h2>Columnas que el sistema reconocerá de forma automática</h2></div></div>
                <div className="contract-grid"><div><strong>Posiciones</strong><span>instrumento, ISIN/ticker, cantidad, valor, coste, divisa, fecha</span></div><div><strong>Transacciones</strong><span>fecha, tipo, importe, comisiones, cantidad, identificador externo</span></div><div><strong>Calidad</strong><span>origen, lote, filas aceptadas, filas rechazadas, fecha de actualización</span></div></div>
              </section>
            </>
          )}
        </div>
      </section>

      {showAdd && (
        <div className="modal-backdrop" role="presentation">
          <section aria-labelledby="modal-title" aria-modal="true" className="modal" role="dialog">
            <button aria-label="Cerrar" className="modal-close" onClick={() => setShowAdd(false)} type="button"><X size={18} /></button>
            <p className="eyebrow">Nueva fuente</p><h2 id="modal-title">Añadir plataforma</h2><p>Los valores iniciales sirven para comenzar la comparación. Podrás actualizarlos mediante una importación.</p>
            <form className="admin-form" onSubmit={addPlatform}>
              <label><span>Nombre</span><input autoFocus name="name" placeholder="Ej. DEGIRO" required /></label>
              <div className="form-row"><label><span>Tipo</span><select defaultValue="Broker" name="kind">{platformKinds.map((kind) => <option key={kind} value={kind}>{kind}</option>)}</select></label><label><span>País</span><input defaultValue="España" name="country" /></label></div>
              <div className="form-row"><label><span>Entrada</span><select defaultValue="Manual" name="method">{dataMethods.map((method) => <option key={method} value={method}>{method}</option>)}</select></label><label><span>Valor (€)</span><input defaultValue="0" inputMode="decimal" name="value" /></label></div>
              <label><span>Rentabilidad acumulada (%)</span><input defaultValue="0" inputMode="decimal" name="returnPct" /></label>
              <button className="button primary full-width" type="submit">Guardar plataforma</button>
            </form>
          </section>
        </div>
      )}

      {showImport && importPreview && (
        <div className="modal-backdrop" role="presentation">
          <section aria-labelledby="import-title" aria-modal="true" className="modal import-modal" role="dialog">
            <button aria-label="Cerrar" className="modal-close" onClick={() => { setShowImport(false); setImportPreview(null); }} type="button"><X size={18} /></button>
            <p className="eyebrow">Previsualización segura</p><h2 id="import-title">Revisa tu archivo antes de aplicarlo</h2><p className="file-name"><FileSpreadsheet size={17} />{importPreview.fileName}</p>
            <label className="import-target"><span>Aplicar a la plataforma</span><select onChange={(event) => setImportTarget(event.target.value)} value={importTarget}>{platforms.map((platform) => <option key={platform.id} value={platform.id}>{platform.name}</option>)}</select></label>
            {importPreview.warnings.length > 0 && <div className="preview-warnings">{importPreview.warnings.map((warning) => <p key={warning}><AlertCircle size={15} /> {warning}</p>)}</div>}
            <div className="preview-table-wrap"><table><thead><tr>{importPreview.headers.slice(0, 6).map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{importPreview.rows.slice(0, 5).map((row, index) => <tr key={`row-${index}`}>{importPreview.headers.slice(0, 6).map((header) => <td key={header}>{String(row[header] ?? "—")}</td>)}</tr>)}</tbody></table></div>
            <div className="modal-actions"><button className="button ghost" onClick={() => { setShowImport(false); setImportPreview(null); }} type="button">Cancelar</button><button className="button primary" onClick={confirmImport} type="button"><CheckCircle2 size={17} /> Aplicar en demostración</button></div>
          </section>
        </div>
      )}
    </main>
  );
}
