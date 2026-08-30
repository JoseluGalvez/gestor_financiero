"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import readXlsxFile from "read-excel-file/browser";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, CheckCircle2, ChevronDown, Download, FileSpreadsheet, Filter, FolderOpen, MapPinned, Save, ShieldCheck, Sparkles, TableProperties, UploadCloud } from "lucide-react";
import { analyzeRecords, CanvasAnalysis, CanvasFilters, cleanText, csvFromRecords, detectMapping, LocalColumnMapping, LocalRecord, recordFromRaw, recordsFromMatrix, uniqueValues, validateLocalCell } from "@/lib/local-analytics";
import { csvFromRows } from "@/lib/csv-security";
import { SAMPLE_GOOGLE_SHEET } from "@/lib/sample-google-sheet";

const baseFilters: CanvasFilters = { from: "", to: "", category: "", platform: "", geography: "" };
const colors = ["#6e7bf6", "#31c7aa", "#f5aa55", "#ea7288", "#6196dd", "#a98bff"];
const money = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });

type WorkerResponse = { type: "result"; requestId: number; analysis: CanvasAnalysis } | { type: "error"; requestId: number; message: string };
const MAX_LOCAL_FILE_BYTES = 15 * 1024 * 1024;
const MAX_CANVAS_ROWS = 100_000;
type EditableField = keyof Pick<LocalColumnMapping, "date" | "value" | "category" | "platform" | "geography" | "status">;
type LocalEdits = Partial<Record<EditableField, string>>;
type LocalCanvasSession = { format: "portafolio-intel-local-canvas"; version: 1; savedAt: string; headers: string[]; mapping: LocalColumnMapping; filters: CanvasFilters; rows: Array<Record<string, string>> };
const editableColumns: Array<[EditableField, string]> = [["date", "Fecha"], ["category", "Categoría / activo"], ["platform", "Plataforma"], ["geography", "Geografía"], ["status", "Estado"], ["value", "Valor"]];
const editableFields = editableColumns.map(([field]) => field);
const LOCAL_SESSION_FORMAT = "portafolio-intel-local-canvas";

function hasOwnRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseLocalSession(payload: unknown): { session?: Omit<LocalCanvasSession, "savedAt">; error?: string } {
  if (!hasOwnRecord(payload) || payload.format !== LOCAL_SESSION_FORMAT || payload.version !== 1) return { error: "El archivo no es un estado local compatible de Portafolio Intel." };
  const mappingPayload = payload.mapping;
  const filtersPayload = payload.filters;
  if (!Array.isArray(payload.headers) || !Array.isArray(payload.rows) || !hasOwnRecord(mappingPayload) || !hasOwnRecord(filtersPayload)) return { error: "El estado local no tiene el esquema esperado." };
  const headers = payload.headers.map(cleanText).filter(Boolean);
  if (headers.length < 2 || headers.length !== new Set(headers).size) return { error: "Los encabezados del estado local no son válidos o están duplicados." };
  if (payload.rows.length > MAX_CANVAS_ROWS) return { error: `El estado supera el límite local de ${MAX_CANVAS_ROWS.toLocaleString("es-ES")} filas.` };
  const mapping = Object.fromEntries(editableFields.map((field) => [field, typeof mappingPayload[field] === "string" && headers.includes(mappingPayload[field] as string) ? mappingPayload[field] : ""])) as LocalColumnMapping;
  const filters = Object.fromEntries(Object.keys(baseFilters).map((field) => [field, typeof filtersPayload[field] === "string" ? cleanText(filtersPayload[field]) : ""])) as CanvasFilters;
  const rows = payload.rows.map((row, index) => {
    if (!hasOwnRecord(row)) throw new Error(`La fila ${index + 1} no es válida.`);
    const raw = Object.fromEntries(headers.map((header) => [header, cleanText(row[header])])) as Record<string, string>;
    for (const field of editableFields) {
      const header = mapping[field];
      const error = header ? validateLocalCell(field, raw[header] ?? "") : "";
      if (error) throw new Error(`La fila ${index + 1} contiene un ${field} inválido: ${error}`);
    }
    return raw;
  });
  return { session: { format: LOCAL_SESSION_FORMAT, version: 1, headers, mapping, filters, rows } };
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  const delimiter = text.split("\n").slice(0, 3).join("\n").split(";").length > text.split("\n").slice(0, 3).join("\n").split(",").length ? ";" : ",";
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; i += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === delimiter && !quoted) { row.push(cell.trim()); cell = ""; continue; }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; cell = ""; continue;
    }
    cell += char;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function MapExposure({ rows, onSelect }: { rows: Array<{ name: string; value: number }>; onSelect: (name: string) => void }) {
  const maximum = Math.max(...rows.map((row) => row.value), 1);
  return <section className="canvas-card map-card"><div className="canvas-card-heading"><div><span>Mapa de exposición</span><h3>Geografías detectadas</h3></div><MapPinned size={18} /></div>{rows.length ? <div className="geo-map" aria-label="Mapa relativo de exposición por geografía">{rows.slice(0, 12).map((row, index) => <button className="geo-bubble" key={row.name} onClick={() => onSelect(row.name)} style={{ ["--bubble" as string]: `${Math.max(38, (row.value / maximum) * 90)}px`, ["--x" as string]: `${10 + ((index * 29) % 78)}%`, ["--y" as string]: `${13 + ((index * 37) % 68)}%`, background: colors[index % colors.length] }}><b>{row.name.slice(0, 3).toUpperCase()}</b><small>{number.format(row.value)}</small></button>)}</div> : <div className="canvas-empty compact"><MapPinned size={22} /><b>Sin una columna geográfica</b><span>Asigna País, Región o Zona para activar el mapa relativo.</span></div>}<p className="canvas-footnote">La posición es una representación visual relativa, no cartografía legal ni geocodificación externa.</p></section>;
}

export function LocalCanvasWorkspace() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [records, setRecords] = useState<LocalRecord[]>([]);
  const [mapping, setMapping] = useState<LocalColumnMapping>({ date: "", value: "", category: "", platform: "", geography: "", status: "" });
  const [filters, setFilters] = useState<CanvasFilters>(baseFilters);
  const [analysis, setAnalysis] = useState<CanvasAnalysis | null>(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("Sin datos locales abiertos.");
  const [showPrivacy, setShowPrivacy] = useState(true);
  const [bulkEdits, setBulkEdits] = useState<LocalEdits>({});
  const [cellDrafts, setCellDrafts] = useState<Record<string, string>>({});
  const [cellErrors, setCellErrors] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const analysisRequestRef = useRef(0);

  useEffect(() => {
    try {
      const worker = new Worker(new URL("../workers/local-analysis.worker.ts", import.meta.url));
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.requestId !== analysisRequestRef.current) return;
        if (event.data.type === "result") setAnalysis(event.data.analysis);
        else setStatus(event.data.message);
      };
      workerRef.current = worker;
      return () => worker.terminate();
    } catch {
      workerRef.current = null;
      return undefined;
    }
  }, []);

  useEffect(() => {
    if (!records.length) return;
    const requestId = analysisRequestRef.current + 1;
    analysisRequestRef.current = requestId;
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "analyze", requestId, records, filters });
      return;
    }
    const timeout = window.setTimeout(() => {
      if (requestId === analysisRequestRef.current) setAnalysis(analyzeRecords(records, filters));
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [records, filters]);

  const filterValues = useMemo(() => ({ category: uniqueValues(records, "category"), platform: uniqueValues(records, "platform"), geography: uniqueValues(records, "geography") }), [records]);

  function ingestMatrix(matrix: ReadonlyArray<ReadonlyArray<unknown>>) {
    if (matrix.length > MAX_CANVAS_ROWS + 1) {
      setStatus(`El archivo supera el límite local de ${MAX_CANVAS_ROWS.toLocaleString("es-ES")} filas. Divídelo antes de abrirlo para preservar la respuesta del navegador.`);
      return;
    }
    const importedHeaders = (matrix[0] ?? []).map(cleanText).filter(Boolean);
    if (importedHeaders.length < 2 || matrix.length < 2) { setStatus("El archivo necesita encabezados y, al menos, una fila de datos para crear el dashboard."); return; }
    const detected = detectMapping(importedHeaders);
    const importedRecords = recordsFromMatrix(importedHeaders, matrix.slice(1).map((row) => [...row]), detected);
    setHeaders(importedHeaders);
    setMapping(detected);
    setRecords(importedRecords);
    setFilters(baseFilters);
    setCellDrafts({});
    setCellErrors({});
    setBulkEdits({});
    setStatus(`${importedRecords.length} filas abiertas y analizadas localmente en esta pestaña. No se han enviado a Supabase ni a un proveedor BI.`);
  }

  async function openFile(file: File) {
    try {
      if (file.size > MAX_LOCAL_FILE_BYTES) {
        setStatus("Por privacidad y rendimiento, el archivo supera el límite local de 15 MB. Divídelo antes de abrirlo.");
        return;
      }
      setStatus("Leyendo el archivo únicamente en este navegador…");
      if (file.name.toLowerCase().endsWith(".csv") || file.type.includes("csv")) {
        ingestMatrix(parseCsv(await file.text()));
      } else {
        ingestMatrix((await readXlsxFile(file)) as unknown as ReadonlyArray<ReadonlyArray<unknown>>);
      }
    } catch {
      setStatus("No se pudo interpretar el archivo. Prueba CSV UTF-8 o Excel .xlsx con encabezados en la primera fila.");
    }
  }

  function refreshMapping(next: Partial<LocalColumnMapping>) {
    const updated = { ...mapping, ...next };
    setMapping(updated);
    if (headers.length && records.length) {
      const matrix = records.map((record) => headers.map((header) => record.raw[header] ?? ""));
      setRecords(recordsFromMatrix(headers, matrix, updated));
      setCellDrafts({});
      setCellErrors({});
    }
  }

  function updateRecord(record: LocalRecord, updates: LocalEdits) {
    const raw = { ...record.raw };
    for (const [field, value] of Object.entries(updates) as Array<[EditableField, string]>) {
      const header = mapping[field];
      if (!header || validateLocalCell(field, value)) return record;
      raw[header] = cleanText(value);
    }
    return recordFromRaw(record.id, raw, mapping);
  }

  function cellKey(recordId: string, field: EditableField) {
    return `${recordId}:${field}`;
  }

  function changeRecordCell(record: LocalRecord, field: EditableField, value: string) {
    if (!mapping[field]) return;
    const key = cellKey(record.id, field);
    const error = validateLocalCell(field, value);
    setCellDrafts((current) => ({ ...current, [key]: value }));
    setCellErrors((current) => {
      const next = { ...current };
      if (error) next[key] = error;
      else delete next[key];
      return next;
    });
    if (error) {
      setStatus(`La celda no se aplicó: ${error} Corrige el valor antes de recalcular.`);
      return;
    }
    setRecords((current) => current.map((candidate) => candidate.id === record.id ? updateRecord(candidate, { [field]: value }) : candidate));
    setStatus("La celda es válida: la tabla y los gráficos se recalculan localmente desde la misma fila en memoria.");
  }

  function finishRecordCell(record: LocalRecord, field: EditableField) {
    const key = cellKey(record.id, field);
    if (!cellErrors[key]) setCellDrafts((current) => { const next = { ...current }; delete next[key]; return next; });
  }

  function changeBulkEdit(field: EditableField, value: string) {
    const error = validateLocalCell(field, value);
    setBulkEdits((current) => ({ ...current, [field]: value }));
    setCellErrors((current) => {
      const next = { ...current };
      const key = `bulk:${field}`;
      if (error) next[key] = error;
      else delete next[key];
      return next;
    });
  }

  function applyBulkEdits() {
    const changes = (Object.entries(bulkEdits) as Array<[EditableField, string]>).filter(([field, value]) => Boolean(mapping[field] && cleanText(value)));
    if (!changes.length) { setStatus("Indica al menos un valor en la edición por selección para modificar filas filtradas localmente."); return; }
    const invalid = changes.find(([field, value]) => validateLocalCell(field, value));
    if (invalid) { setStatus(`No se aplicaron cambios: ${validateLocalCell(invalid[0], invalid[1])}`); return; }
    if (!active.length) { setStatus("No hay filas filtradas que actualizar."); return; }
    const selectedIds = new Set(active.map((record) => record.id));
    const updates = Object.fromEntries(changes) as LocalEdits;
    setRecords((current) => current.map((record) => selectedIds.has(record.id) ? updateRecord(record, updates) : record));
    setBulkEdits({});
    setStatus(`${selectedIds.size} filas filtradas se actualizaron solo en la memoria de esta pestaña; KPIs y gráficos se han sincronizado.`);
  }

  function exportEditedDataset() {
    const matrix = [headers, ...records.map((record) => headers.map((header) => record.raw[header] ?? ""))];
    download(csvFromRows(matrix), "canvas-local-editado.csv", "text/csv;charset=utf-8");
  }

  function saveLocalSession() {
    const session: LocalCanvasSession = { format: LOCAL_SESSION_FORMAT, version: 1, savedAt: new Date().toISOString(), headers, mapping, filters, rows: records.map((record) => record.raw) };
    download(JSON.stringify(session, null, 2), `canvas-local-${new Date().toISOString().slice(0, 10)}.json`, "application/json");
    setStatus("Estado local descargado como JSON. Puedes guardar varios archivos y abrir el que corresponda cuando quieras restaurarlo.");
  }

  async function openLocalSession(file: File) {
    try {
      if (file.size > MAX_LOCAL_FILE_BYTES) { setStatus("El estado JSON supera el límite local de 15 MB."); return; }
      const parsed = parseLocalSession(JSON.parse(await file.text()));
      if (!parsed.session) { setStatus(parsed.error ?? "No se pudo validar el estado local."); return; }
      const { headers: restoredHeaders, mapping: restoredMapping, filters: restoredFilters, rows } = parsed.session;
      const restoredRecords = rows.map((raw, index) => recordFromRaw(`session-${index}`, raw, restoredMapping));
      setHeaders(restoredHeaders);
      setMapping(restoredMapping);
      setFilters(restoredFilters);
      setRecords(restoredRecords);
      setCellDrafts({});
      setCellErrors({});
      setBulkEdits({});
      setStatus(`${restoredRecords.length} filas se restauraron desde un estado JSON local validado. No se envió ni almacenó el archivo.`);
    } catch (error) {
      setStatus(error instanceof Error ? `No se pudo cargar el estado local: ${error.message}` : "No se pudo interpretar el archivo JSON local.");
    }
  }

  function loadDemonstration() {
    ingestMatrix([[...SAMPLE_GOOGLE_SHEET.headers], ...SAMPLE_GOOGLE_SHEET.rows.map((row) => [...row])]);
    setStatus("Ejemplo ficticio cargado solo para demostrar filtros y visualizaciones locales. No procede de Supabase ni se guardará al cerrar la pestaña.");
  }

  function download(content: string, name: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = name; anchor.click();
    URL.revokeObjectURL(url);
  }

  function downloadPowerBiManifest() {
    download(JSON.stringify({ version: "1.0", privacy: "local-only", generated_at: new Date().toISOString(), columns: mapping, filters, row_count: analysis?.filtered.length ?? 0, instructions: "Importa el CSV asociado en Power BI Desktop. Aplica RLS/OLS en el modelo semántico antes de compartir o incrustar." }, null, 2), "power-bi-manifest-local.json", "application/json");
  }

  const active = analysis?.filtered ?? [];
  return <section className="canvas-workspace" id="canvas-local">
    <header className="canvas-hero"><div><p className="eyebrow">Canvas local · modo privado</p><h2>Construye un dashboard con el archivo abierto en tu navegador.</h2><p>Importa CSV o Excel, asigna columnas y filtra KPIs, gráficos, exposición geográfica, tabla y conclusiones sin enviar las filas al servidor.</p></div><div className="privacy-pill"><ShieldCheck size={20} /><span><b>Procesamiento local</b>Web Worker activo cuando el navegador lo admite</span></div></header>

    {showPrivacy && <aside className="privacy-notice"><ShieldCheck size={19} /><div><b>Compromiso de privacidad</b><p>Este workspace no usa `localStorage`, no crea consultas a Supabase y no llama a servicios de IA. La sesión local se destruye al recargar o cerrar esta pestaña.</p></div><button onClick={() => setShowPrivacy(false)} type="button" aria-label="Cerrar aviso">×</button></aside>}

    {!records.length ? <div className={`local-dropzone ${dragging ? "dragging" : ""}`} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) void openFile(file); }}><UploadCloud size={30} /><h3>Arrastra aquí un CSV o Excel</h3><p>Los datos se procesan en memoria. Se admiten archivos `.csv` y `.xlsx` con encabezados en la primera fila.</p><div><button className="canvas-button primary" onClick={() => inputRef.current?.click()} type="button">Elegir archivo local</button><button className="canvas-button ghost" onClick={() => sessionInputRef.current?.click()} type="button"><FolderOpen size={15} />Cargar estado JSON</button><button className="canvas-button ghost" onClick={loadDemonstration} type="button">Cargar ejemplo ficticio</button></div><input accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void openFile(file); event.currentTarget.value = ""; }} ref={inputRef} type="file" /><input accept="application/json,.json" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void openLocalSession(file); event.currentTarget.value = ""; }} ref={sessionInputRef} type="file" /></div> : <>
      <section className="canvas-control-bar"><div className="canvas-data-status"><CheckCircle2 size={17} /><span>{status}</span></div><div><button className="canvas-button ghost" onClick={() => inputRef.current?.click()} type="button"><FileSpreadsheet size={15} />Cambiar archivo</button><button className="canvas-button ghost" onClick={saveLocalSession} type="button"><Save size={15} />Guardar estado JSON</button><button className="canvas-button ghost" onClick={() => sessionInputRef.current?.click()} type="button"><FolderOpen size={15} />Cargar estado JSON</button><button className="canvas-button ghost" onClick={() => { analysisRequestRef.current += 1; setRecords([]); setHeaders([]); setAnalysis(null); setFilters(baseFilters); setBulkEdits({}); setCellDrafts({}); setCellErrors({}); setStatus("La copia en memoria se eliminó de esta pestaña."); }} type="button">Eliminar de memoria</button></div><input accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void openFile(file); event.currentTarget.value = ""; }} ref={inputRef} type="file" /><input accept="application/json,.json" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void openLocalSession(file); event.currentTarget.value = ""; }} ref={sessionInputRef} type="file" /></section>
      <section className="canvas-mapping"><div className="canvas-section-title"><div><span>Esquema local</span><h3>Confirma cómo interpretar las columnas</h3></div><span>{records.length} filas</span></div><div className="mapping-grid">{([ ["date", "Fecha"], ["value", "Importe / valor"], ["category", "Categoría"], ["platform", "Plataforma"], ["geography", "País / región"], ["status", "Estado"] ] as Array<[keyof LocalColumnMapping, string]>).map(([key, label]) => <label key={key}><span>{label}</span><select value={mapping[key]} onChange={(event) => refreshMapping({ [key]: event.target.value })}><option value="">Sin asignar</option>{headers.map((header) => <option key={header} value={header}>{header}</option>)}</select></label>)}</div></section>
      <section className="canvas-filters"><div className="canvas-section-title"><div><span>Filtros cruzados</span><h3>Segmenta el conjunto abierto</h3></div><Filter size={19} /></div><div className="filter-grid"><label><span>Desde</span><input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} /></label><label><span>Hasta</span><input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} /></label>{([ ["category", "Categoría", filterValues.category], ["platform", "Plataforma", filterValues.platform], ["geography", "Geografía", filterValues.geography] ] as Array<[keyof Pick<CanvasFilters, "category" | "platform" | "geography">, string, string[]]>).map(([key, label, choices]) => <label key={key}><span>{label}</span><select value={filters[key]} onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))}><option value="">Todas</option>{choices.map((choice) => <option key={choice}>{choice}</option>)}</select></label>)}<button className="filter-reset" onClick={() => setFilters(baseFilters)} type="button">Restablecer</button></div></section>
      <section className="canvas-kpis"><article><span>Valor filtrado</span><strong>{money.format(analysis?.kpis.total ?? 0)}</strong><small>Agregación local</small></article><article><span>Filas analizadas</span><strong>{analysis?.kpis.count ?? 0}</strong><small>Tras aplicar filtros</small></article><article><span>Media por fila</span><strong>{money.format(analysis?.kpis.average ?? 0)}</strong><small>Importe / valor asignado</small></article><article><span>Última variación</span><strong className={(analysis?.kpis.change ?? 0) < 0 ? "negative" : "positive"}>{analysis?.kpis.change === null || analysis?.kpis.change === undefined ? "—" : `${analysis.kpis.change >= 0 ? "+" : ""}${number.format(analysis.kpis.change)} %`}</strong><small>Frente al período previo</small></article></section>
      <section className="canvas-dashboard-grid"><section className="canvas-card span-two"><div className="canvas-card-heading"><div><span>Tendencia</span><h3>Valor por período</h3></div><BarChart3 size={18} /></div><ResponsiveContainer width="100%" height={260}><AreaChart data={analysis?.timeline ?? []}><defs><linearGradient id="localCanvasArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#6e7bf6" stopOpacity={0.42} /><stop offset="100%" stopColor="#6e7bf6" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="#e7ebf6" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11, fill: "#75839b" }} tickLine={false} axisLine={false} /><YAxis tick={{ fontSize: 11, fill: "#75839b" }} tickLine={false} axisLine={false} tickFormatter={(value) => number.format(value)} /><Tooltip formatter={(value) => money.format(Number(value))} /><Area dataKey="value" fill="url(#localCanvasArea)" stroke="#6e7bf6" strokeWidth={2.4} type="monotone" /></AreaChart></ResponsiveContainer></section>
        <section className="canvas-card"><div className="canvas-card-heading"><div><span>Distribución</span><h3>Por categoría</h3></div><ChevronDown size={18} /></div><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={analysis?.categories ?? []} dataKey="value" nameKey="name" innerRadius={55} outerRadius={83} paddingAngle={3} onClick={(entry) => { const name = String(entry.name ?? ""); if (name) setFilters((current) => ({ ...current, category: current.category === name ? "" : name })); }}>{(analysis?.categories ?? []).map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(value) => money.format(Number(value))} /></PieChart></ResponsiveContainer><div className="micro-legend">{(analysis?.categories ?? []).slice(0, 4).map((item, index) => <span key={item.name}><i style={{ background: colors[index % colors.length] }} />{item.name}</span>)}</div></section>
        <section className="canvas-card"><div className="canvas-card-heading"><div><span>Comparativa</span><h3>Por plataforma</h3></div><BarChart3 size={18} /></div><ResponsiveContainer width="100%" height={260}><BarChart data={analysis?.platforms.slice(0, 6) ?? []} layout="vertical" margin={{ left: 14 }}><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={92} tick={{ fontSize: 11, fill: "#75839b" }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => money.format(Number(value))} /><Bar dataKey="value" fill="#31c7aa" radius={[0, 6, 6, 0]} onClick={(entry) => { const name = String(entry.payload?.name ?? ""); if (name) setFilters((current) => ({ ...current, platform: current.platform === name ? "" : name })); }} /></BarChart></ResponsiveContainer></section><MapExposure rows={analysis?.geographies ?? []} onSelect={(name) => setFilters((current) => ({ ...current, geography: current.geography === name ? "" : name }))} />
        <section className="canvas-card insights-card"><div className="canvas-card-heading"><div><span>Lectura ejecutiva</span><h3>Conclusiones locales</h3></div><Sparkles size={18} /></div><ol>{(analysis?.insights ?? []).map((insight) => <li key={insight}>{insight}</li>)}</ol><p>Estas conclusiones son reglas deterministas sobre las filas filtradas; no se envían a una IA ni equivalen a una recomendación financiera.</p></section>
      </section>
      <section className="canvas-card local-table"><div className="canvas-card-heading"><div><span>Tabla vinculada · edición local</span><h3>Modifica filas y actualiza el dashboard al instante</h3></div><TableProperties size={18} /></div><p className="canvas-table-intro">Cada celda valida su tipo antes de alterar la copia que usan KPIs, gráficos, mapa, filtros y conclusiones. Un valor inválido queda marcado en la celda y no se envía al Web Worker.</p><div className="canvas-bulk-edit"><div><b>Edición por selección</b><span>Aplica un valor válido a las {active.length} filas visibles tras los filtros actuales.</span></div><div className="bulk-edit-fields">{editableColumns.filter(([field]) => Boolean(mapping[field])).map(([field, label]) => { const error = cellErrors[`bulk:${field}`]; return <label key={field}><span>{label}</span><input aria-invalid={Boolean(error)} aria-describedby={error ? `bulk-error-${field}` : undefined} className={error ? "invalid-cell" : ""} value={bulkEdits[field] ?? ""} onChange={(event) => changeBulkEdit(field, event.target.value)} placeholder={`Nuevo ${label.toLocaleLowerCase("es-ES")}`} />{error && <small id={`bulk-error-${field}`} role="alert">{error}</small>}</label>; })}<button className="canvas-button primary" disabled={!active.length || Object.keys(cellErrors).some((key) => key.startsWith("bulk:"))} onClick={applyBulkEdits} type="button">Aplicar a selección</button></div></div><div className="table-scroll"><table><thead><tr>{editableColumns.map(([, label]) => <th key={label}>{label}</th>)}</tr></thead><tbody>{active.slice(0, 200).map((row) => <tr key={row.id}>{editableColumns.map(([field, label]) => { const header = mapping[field]; const key = cellKey(row.id, field); const error = cellErrors[key]; const value = key in cellDrafts ? cellDrafts[key] : header ? row.raw[header] ?? "" : ""; return <td key={field}><input aria-describedby={error ? `cell-error-${row.id}-${field}` : undefined} aria-invalid={Boolean(error)} aria-label={`${label} de fila ${row.id}`} className={`${field === "value" ? "table-cell-input numeric" : "table-cell-input"}${error ? " invalid-cell" : ""}`} disabled={!header} inputMode={field === "value" ? "decimal" : undefined} onBlur={() => finishRecordCell(row, field)} onChange={(event) => changeRecordCell(row, field, event.target.value)} placeholder={header ? "" : "Sin asignar"} value={value} />{error && <small className="cell-error" id={`cell-error-${row.id}-${field}`} role="alert">{error}</small>}</td>; })}</tr>)}</tbody></table></div>{active.length > 200 && <p className="canvas-footnote">Se muestran y permiten editar las primeras 200 filas de {active.length}; los cálculos locales incluyen todas las filas filtradas. Ajusta filtros antes de usar edición masiva.</p>}<div className="canvas-table-actions"><button className="canvas-button ghost" onClick={exportEditedDataset} type="button"><Download size={15} />Exportar dataset local editado</button><span>La exportación es la única forma de conservar cambios tras cerrar o recargar la pestaña.</span></div></section>
      <section className="powerbi-panel"><div><p className="eyebrow">Preparación Power BI</p><h3>Intercambia datos, no secretos</h3><p>Exporta la vista filtrada y su manifiesto. Para incrustar Power BI se requieren un backend, token de inserción efímero y RLS/OLS en el modelo semántico; nunca introduzcas tokens en el navegador.</p></div><div><button className="canvas-button primary" onClick={() => download(csvFromRecords(active), "power-bi-local-selection.csv", "text/csv;charset=utf-8") } type="button"><Download size={15} />Exportar CSV filtrado</button><button className="canvas-button ghost" onClick={downloadPowerBiManifest} type="button">Descargar manifiesto BI</button></div></section>
    </>}
    <p className="canvas-status" aria-live="polite">{status}</p>
  </section>;
}
