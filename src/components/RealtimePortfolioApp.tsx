"use client";

import { pdf, Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  CircleDollarSign,
  Database,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  LineChart as LineChartIcon,
  LoaderCircle,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  WalletCards,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { MembershipRecord, PortfolioAlert, PortfolioRecord, PortfolioSnapshot, supabase } from "@/lib/supabase";

type Screen = "resumen" | "cartera" | "alertas" | "informes" | "fuentes" | "analisis";
type PositionRow = { id: string; instrument_id: string; quantity: number; cost_basis: number; market_value: number | null; as_of: string };
type InstrumentRow = { id: string; name: string; symbol: string | null; isin: string | null; asset_class: string; currency: string };
type SourceRow = { id: string; display_name: string; provider: string; status: string; last_success_at: string | null; last_error_code: string | null; connection_config: { spreadsheet_id?: string; sheet_name?: string; range?: string } | null };
type AnalysisRunRow = { id: string; instrument_id: string; as_of: string; status: string; coverage_pct: number; weighted_score: number | null; dcf_fair_value: number | null; kelly_fraction: number | null; warnings: unknown };
type AlertRuleRow = { id: string; rule_type: string; threshold: number | null; enabled: boolean; updated_at: string };

type Workspace = {
  membership: MembershipRecord;
  portfolio: PortfolioRecord;
  snapshots: PortfolioSnapshot[];
  positions: PositionRow[];
  instruments: InstrumentRow[];
  alerts: PortfolioAlert[];
  sources: SourceRow[];
  analysisRuns: AnalysisRunRow[];
  rules: AlertRuleRow[];
};

const euro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
const compactEuro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0, notation: "compact" });
const oneDecimal = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function getSpreadsheetId(value: string): string | null {
  const raw = value.trim();
  const urlMatch = raw.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]+)/);
  const candidate = urlMatch?.[1] ?? raw;
  return /^[A-Za-z0-9_-]{20,}$/.test(candidate) ? candidate : null;
}

const reportStyles = StyleSheet.create({
  page: { padding: 42, color: "#17253e", fontFamily: "Helvetica", fontSize: 10 },
  header: { borderBottomWidth: 2, borderBottomColor: "#2d6cdf", paddingBottom: 14, marginBottom: 18 },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#17336b" },
  subtitle: { color: "#687993", marginTop: 5 },
  grid: { flexDirection: "row", gap: 10, marginBottom: 18 },
  card: { backgroundColor: "#f4f7fc", borderRadius: 8, padding: 12, flexGrow: 1 },
  label: { color: "#6d7d94", fontSize: 8, marginBottom: 5 },
  value: { color: "#1a2a43", fontFamily: "Helvetica-Bold", fontSize: 15 },
  sectionTitle: { color: "#183263", fontFamily: "Helvetica-Bold", fontSize: 13, marginBottom: 9 },
  row: { borderBottomColor: "#e4eaf3", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingVertical: 7 },
  footnote: { color: "#78869a", fontSize: 8, lineHeight: 1.4, marginTop: 18 },
});

function PortfolioSummaryPdf({ workspace }: { workspace: Workspace }) {
  const latest = workspace.snapshots.at(-1);
  const value = latest?.market_value ?? 0;
  const cost = latest?.cost_basis ?? 0;
  const gain = latest?.gain ?? 0;
  return (
    <Document>
      <Page size="A4" style={reportStyles.page}>
        <View style={reportStyles.header}>
          <Text style={reportStyles.title}>Portafolio Intel — Resumen de cartera</Text>
          <Text style={reportStyles.subtitle}>Generado el {new Date().toLocaleDateString("es-ES")} · Datos disponibles hasta {latest ? new Date(latest.as_of).toLocaleString("es-ES") : "sin datos"}</Text>
        </View>
        <View style={reportStyles.grid}>
          <View style={reportStyles.card}><Text style={reportStyles.label}>Valor de mercado</Text><Text style={reportStyles.value}>{euro.format(value)}</Text></View>
          <View style={reportStyles.card}><Text style={reportStyles.label}>Coste acumulado</Text><Text style={reportStyles.value}>{euro.format(cost)}</Text></View>
          <View style={reportStyles.card}><Text style={reportStyles.label}>Resultado</Text><Text style={reportStyles.value}>{euro.format(gain)}</Text></View>
        </View>
        <Text style={reportStyles.sectionTitle}>Posiciones incluidas</Text>
        {workspace.positions.map((position) => {
          const instrument = workspace.instruments.find((item) => item.id === position.instrument_id);
          return <View key={position.id} style={reportStyles.row}><Text>{instrument?.name ?? "Instrumento sin identificar"}</Text><Text>{euro.format(position.market_value ?? 0)}</Text></View>;
        })}
        <Text style={reportStyles.footnote}>Este informe refleja exclusivamente los datos conciliados disponibles en la base de datos en el momento de generación. No constituye recomendación de inversión ni documento tributario para presentar.</Text>
      </Page>
    </Document>
  );
}

function valueOf(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" }) : "Sin sincronizar";
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${oneDecimal.format(value)} %`;
}

export function RealtimePortfolioApp() {
  const [screen, setScreen] = useState<Screen>("resumen");
  const [sessionReady, setSessionReady] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceKind, setSourceKind] = useState("google_sheets");
  const [googleSheetReference, setGoogleSheetReference] = useState("");
  const [googleSheetTab, setGoogleSheetTab] = useState("");
  const [googleSheetRange, setGoogleSheetRange] = useState("");
  const [dateColumn, setDateColumn] = useState("");
  const [instrumentColumn, setInstrumentColumn] = useState("");
  const [typeColumn, setTypeColumn] = useState("");
  const [quantityColumn, setQuantityColumn] = useState("");
  const [priceColumn, setPriceColumn] = useState("");
  const [currencyColumn, setCurrencyColumn] = useState("");
  const [creatingSource, setCreatingSource] = useState(false);
  const [creatingRule, setCreatingRule] = useState(false);
  const [ruleType, setRuleType] = useState("rebalance_drift");
  const [ruleThreshold, setRuleThreshold] = useState("5");
  const [realtimeState, setRealtimeState] = useState<"conectando" | "activo" | "desconectado">("desconectado");

  const loadWorkspace = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setWorkspace(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: membershipData, error: membershipError } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (membershipError) {
      setNotice("No se pudo cargar la pertenencia de la cuenta.");
      setLoading(false);
      return;
    }
    const membership = membershipData as MembershipRecord | null;
    if (!membership) {
      setWorkspace(null);
      setLoading(false);
      return;
    }

    const { data: portfolioData, error: portfolioError } = await supabase
      .from("portfolios")
      .select("id, organization_id, name, base_currency")
      .eq("organization_id", membership.organization_id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (portfolioError || !portfolioData) {
      setNotice("La organización no tiene todavía una cartera preparada.");
      setLoading(false);
      return;
    }
    const portfolio = portfolioData as PortfolioRecord;
    const [snapshotsResult, positionsResult, alertsResult, sourcesResult, analysisResult, rulesResult] = await Promise.all([
      supabase.from("portfolio_snapshots").select("id, portfolio_id, organization_id, as_of, market_value, cost_basis, gain, return_pct, source_version").eq("portfolio_id", portfolio.id).order("as_of", { ascending: true }).limit(180),
      supabase.from("positions").select("id, instrument_id, quantity, cost_basis, market_value, as_of").eq("portfolio_id", portfolio.id).order("updated_at", { ascending: false }).limit(250),
      supabase.from("alerts").select("id, organization_id, severity, status, title, body, triggered_at").eq("organization_id", membership.organization_id).in("status", ["open", "acknowledged"]).order("triggered_at", { ascending: false }).limit(20),
      supabase.from("data_sources").select("id, display_name, provider, status, last_success_at, last_error_code, connection_config").eq("organization_id", membership.organization_id).order("created_at", { ascending: false }).limit(30),
      supabase.from("analysis_runs").select("id, instrument_id, as_of, status, coverage_pct, weighted_score, dcf_fair_value, kelly_fraction, warnings").eq("organization_id", membership.organization_id).order("as_of", { ascending: false }).limit(100),
      supabase.from("alert_rules").select("id, rule_type, threshold, enabled, updated_at").eq("organization_id", membership.organization_id).order("updated_at", { ascending: false }).limit(30),
    ]);
    const positionRows = (positionsResult.data ?? []) as PositionRow[];
    const ids = [...new Set(positionRows.map((position) => position.instrument_id))];
    const instrumentsResult = ids.length > 0
      ? await supabase.from("instruments").select("id, name, symbol, isin, asset_class, currency").in("id", ids)
      : { data: [] as InstrumentRow[] };

    if (snapshotsResult.error || positionsResult.error || alertsResult.error || sourcesResult.error || analysisResult.error || rulesResult.error || ("error" in instrumentsResult && instrumentsResult.error)) {
      setNotice("No se pudieron cargar todos los datos persistentes. Vuelve a intentarlo.");
    }
    setWorkspace({
      membership,
      portfolio,
      snapshots: (snapshotsResult.data ?? []).map((row) => ({ ...row, market_value: valueOf(row.market_value), cost_basis: valueOf(row.cost_basis), gain: valueOf(row.gain), return_pct: row.return_pct === null ? null : valueOf(row.return_pct) })) as PortfolioSnapshot[],
      positions: positionRows.map((row) => ({ ...row, quantity: valueOf(row.quantity), cost_basis: valueOf(row.cost_basis), market_value: row.market_value === null ? null : valueOf(row.market_value) })),
      instruments: (instrumentsResult.data ?? []) as InstrumentRow[],
      alerts: (alertsResult.data ?? []) as PortfolioAlert[],
      sources: (sourcesResult.data ?? []) as SourceRow[],
      analysisRuns: (analysisResult.data ?? []).map((row) => ({ ...row, coverage_pct: valueOf(row.coverage_pct), weighted_score: row.weighted_score === null ? null : valueOf(row.weighted_score), dcf_fair_value: row.dcf_fair_value === null ? null : valueOf(row.dcf_fair_value), kelly_fraction: row.kelly_fraction === null ? null : valueOf(row.kelly_fraction) })) as AnalysisRunRow[],
      rules: (rulesResult.data ?? []).map((row) => ({ ...row, threshold: row.threshold === null ? null : valueOf(row.threshold) })) as AlertRuleRow[],
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionReady(true);
      if (data.session?.user.email) setUserEmail(data.session.user.email);
      void loadWorkspace();
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setUserEmail(currentSession?.user.email ?? "");
      setMagicLinkSent(false);
      void loadWorkspace();
    });
    return () => listener.subscription.unsubscribe();
  }, [loadWorkspace]);

  const organizationId = workspace?.membership.organization_id;

  useEffect(() => {
    if (!organizationId) return;
    const channel = supabase
      .channel(`portfolio-intel-${organizationId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "portfolio_snapshots", filter: `organization_id=eq.${organizationId}` }, () => void loadWorkspace())
      .on("postgres_changes", { event: "*", schema: "public", table: "market_quotes", filter: `organization_id=eq.${organizationId}` }, () => void loadWorkspace())
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts", filter: `organization_id=eq.${organizationId}` }, () => void loadWorkspace())
      .on("postgres_changes", { event: "*", schema: "public", table: "data_sources", filter: `organization_id=eq.${organizationId}` }, () => void loadWorkspace())
      .on("postgres_changes", { event: "*", schema: "public", table: "analysis_runs", filter: `organization_id=eq.${organizationId}` }, () => void loadWorkspace())
      .on("postgres_changes", { event: "*", schema: "public", table: "alert_rules", filter: `organization_id=eq.${organizationId}` }, () => void loadWorkspace())
      .subscribe((status) => setRealtimeState(status === "SUBSCRIBED" ? "activo" : status === "CHANNEL_ERROR" || status === "TIMED_OUT" ? "desconectado" : "conectando"));
    return () => { void supabase.removeChannel(channel); };
  }, [loadWorkspace, organizationId]);

  const chartRows = useMemo(() => workspace?.snapshots.map((snapshot) => ({
    at: new Date(snapshot.as_of).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
    value: snapshot.market_value,
    gain: snapshot.gain,
  })) ?? [], [workspace?.snapshots]);
  const latest = workspace?.snapshots.at(-1);
  const previous = workspace?.snapshots.at(-2);
  const change = latest && previous && previous.market_value !== 0 ? ((latest.market_value - previous.market_value) / previous.market_value) * 100 : null;
  const openAlerts = workspace?.alerts.filter((alert) => alert.status === "open") ?? [];

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = userEmail.trim();
    if (!email) return;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (error) { setNotice("No se pudo enviar el enlace de acceso. Revisa el correo e inténtalo de nuevo."); return; }
    setMagicLinkSent(true);
  }

  async function bootstrapOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data, error } = await supabase.functions.invoke("bootstrap-organization", { body: { organizationName, portfolioName: "Cartera principal" } });
    if (error || data?.error) { setNotice(data?.error ?? "No se pudo preparar la organización."); return; }
    setOrganizationName("");
    setNotice("Organización y cartera creadas. Añade ahora una fuente de datos conciliable.");
    await loadWorkspace();
  }

  async function registerSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace || !sourceName.trim()) return;

    const spreadsheetId = sourceKind === "google_sheets" ? getSpreadsheetId(googleSheetReference) : null;
    const mapping = { date: dateColumn.trim(), instrument: instrumentColumn.trim(), type: typeColumn.trim(), quantity: quantityColumn.trim(), price: priceColumn.trim(), currency: currencyColumn.trim() };
    if (sourceKind === "google_sheets" && !spreadsheetId) {
      setNotice("Indica una URL válida de Google Sheets o un ID de hoja válido antes de guardar.");
      return;
    }
    if (sourceKind === "google_sheets" && Object.values(mapping).some((column) => !column)) {
      setNotice("Completa las seis columnas obligatorias: fecha, instrumento, tipo, cantidad, precio y divisa.");
      return;
    }

    setCreatingSource(true);
    const connectionConfig = sourceKind === "google_sheets" ? {
      spreadsheet_id: spreadsheetId,
      source_reference: googleSheetReference.trim(),
      sheet_name: googleSheetTab.trim() || null,
      range: googleSheetRange.trim() || null,
      mapping,
      configured_at: new Date().toISOString(),
    } : {};
    const { error } = await supabase.from("data_sources").insert({
      organization_id: workspace.membership.organization_id,
      portfolio_id: workspace.portfolio.id,
      provider: sourceKind,
      display_name: sourceName.trim(),
      status: "pending",
      connection_config: connectionConfig,
    });
    setCreatingSource(false);
    if (error) { setNotice("No se pudo registrar la fuente. Confirma que tu rol tiene permisos de edición."); return; }
    setSourceName("");
    setGoogleSheetReference("");
    setGoogleSheetTab("");
    setGoogleSheetRange("");
    setDateColumn("");
    setInstrumentColumn("");
    setTypeColumn("");
    setQuantityColumn("");
    setPriceColumn("");
    setCurrencyColumn("");
    setNotice(sourceKind === "google_sheets" ? "Configuración de Google Sheets registrada como pendiente. La hoja no se ha leído ni importado todavía; el siguiente paso es validarla con consentimiento OAuth." : "Fuente registrada. El conector del servidor validará el esquema antes de importar datos.");
  }

  async function registerAlertRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace) return;
    const threshold = Number(ruleThreshold);
    if (!Number.isFinite(threshold) || threshold < 0) { setNotice("El umbral debe ser un número igual o superior a cero."); return; }
    setCreatingRule(true);
    const { error } = await supabase.from("alert_rules").insert({
      organization_id: workspace.membership.organization_id,
      portfolio_id: workspace.portfolio.id,
      rule_type: ruleType,
      threshold,
      enabled: true,
    });
    setCreatingRule(false);
    if (error) { setNotice("No se pudo guardar la regla. Confirma que tu rol tiene permisos de edición."); return; }
    setNotice("Regla guardada. Se evaluará cuando el servicio de datos reciba una actualización conciliada.");
  }

  async function downloadPortfolioSummary() {
    if (!workspace || !latest) { setNotice("El informe requiere al menos una instantánea real de cartera."); return; }
    const blob = await pdf(<PortfolioSummaryPdf workspace={workspace} />).toBlob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `portfolio-summary-${new Date().toISOString().slice(0, 10)}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Informe de cartera generado con la última instantánea disponible.");
  }

  if (!sessionReady || loading) return <main className="realtime-loading"><LoaderCircle className="spin" size={28} /><span>Conectando con el espacio financiero protegido…</span></main>;

  if (!userEmail) return <main className="auth-shell"><section className="auth-card"><div className="auth-mark"><LineChartIcon size={24} /></div><p className="eyebrow">Portafolio Intel · Espacio protegido</p><h1>Conecta una cartera real, no una demostración.</h1><p>Accede con un enlace seguro para crear tu organización y consultar solo los datos a los que tienes permiso.</p><form onSubmit={sendMagicLink}><label><span>Correo de acceso</span><input autoComplete="email" onChange={(event) => setUserEmail(event.target.value)} placeholder="nombre@empresa.com" type="email" value={userEmail} required /></label><button className="button primary full-width" type="submit">Enviar enlace seguro</button></form>{magicLinkSent && <div className="auth-success"><CheckCircle2 size={18} />Revisa tu correo para completar el acceso.</div>}</section></main>;

  if (!workspace) return <main className="auth-shell"><section className="auth-card setup-card"><div className="auth-mark"><ShieldCheck size={24} /></div><p className="eyebrow">Primera configuración</p><h1>Prepara tu espacio de datos.</h1><p>La organización es el límite de seguridad que separa carteras, alertas e informes. Podrás invitar a más miembros después.</p><form onSubmit={bootstrapOrganization}><label><span>Nombre de organización</span><input onChange={(event) => setOrganizationName(event.target.value)} placeholder="Ej. Gestora familiar" value={organizationName} required minLength={2} maxLength={120} /></label><button className="button primary full-width" type="submit">Crear organización y cartera</button></form></section></main>;

  const navigation: { id: Screen; label: string; icon: React.ReactNode }[] = [
    { id: "resumen", label: "Resumen", icon: <LayoutDashboard size={18} /> },
    { id: "cartera", label: "Cartera", icon: <WalletCards size={18} /> },
    { id: "alertas", label: "Alertas", icon: <BellRing size={18} /> },
    { id: "informes", label: "Informes", icon: <FileText size={18} /> },
    { id: "fuentes", label: "Fuentes", icon: <Database size={18} /> },
    { id: "analisis", label: "Análisis", icon: <Sparkles size={18} /> },
  ];

  return <main className="realtime-shell">
    <aside className="realtime-sidebar"><div className="brand"><div className="brand-mark"><LineChartIcon size={21} /></div><div><strong>Portafolio</strong><span>Intel</span></div></div><nav aria-label="Navegación principal" className="nav-list">{navigation.map((item) => <button className={screen === item.id ? "nav-item active" : "nav-item"} key={item.id} onClick={() => setScreen(item.id)} type="button">{item.icon}{item.label}{item.id === "alertas" && openAlerts.length > 0 ? <span className="nav-count">{openAlerts.length}</span> : null}</button>)}</nav><div className="sidebar-bottom"><div className={`realtime-badge ${realtimeState}`}><i />{realtimeState === "activo" ? "Actualización en tiempo real" : realtimeState === "conectando" ? "Conectando Realtime" : "Realtime desconectado"}</div><button className="help-button" onClick={() => void supabase.auth.signOut()} type="button"><LogOut size={16} />Cerrar sesión</button></div></aside>
    <section className="realtime-workspace"><header className="realtime-topbar"><div><p className="eyebrow">{workspace.portfolio.name}</p><strong>{screen === "resumen" ? "Vista consolidada" : navigation.find((item) => item.id === screen)?.label}</strong></div><div className="topbar-actions"><button aria-label="Actualizar datos" className="icon-button" onClick={() => void loadWorkspace()} type="button"><RefreshCw size={17} /></button><div className="avatar" aria-label="Cuenta autenticada">{userEmail.slice(0, 2).toUpperCase()}</div></div></header>
      <div className="realtime-content">{notice && <div className="notice" role="status"><AlertCircle size={18} /><span>{notice}</span><button aria-label="Cerrar aviso" onClick={() => setNotice(null)} type="button">×</button></div>}
        {screen === "resumen" && <><section className="page-heading"><div><p className="eyebrow">Datos persistentes</p><h1>El estado de tu cartera se actualiza con cada dato conciliado.</h1><p className="subtitle">Las cifras, tendencias y alertas proceden de Supabase. Sin una fuente sincronizada no se inventan resultados.</p></div><button className="button primary" onClick={() => setScreen("fuentes")} type="button"><UploadCloud size={17} />Conectar datos</button></section><section className="realtime-kpis"><article><span>Valor de mercado</span><strong>{latest ? euro.format(latest.market_value) : "—"}</strong><small>{latest ? `Instantánea: ${formatDateTime(latest.as_of)}` : "Esperando primera instantánea"}</small></article><article><span>Resultado acumulado</span><strong className={latest && latest.gain < 0 ? "text-negative" : "text-positive"}>{latest ? euro.format(latest.gain) : "—"}</strong><small>{latest ? formatPercent(latest.return_pct) : "Sin datos calculados"}</small></article><article><span>Variación desde la última lectura</span><strong className={change !== null && change < 0 ? "text-negative" : "text-positive"}>{formatPercent(change)}</strong><small>{previous ? `Comparado con ${formatDateTime(previous.as_of)}` : "Se requieren dos instantáneas"}</small></article><article><span>Alertas abiertas</span><strong>{openAlerts.length}</strong><small>{workspace.sources.length} fuentes registradas</small></article></section><section className="realtime-grid"><article className="panel live-chart-panel"><div className="panel-heading"><div><p className="eyebrow">Tendencia de cartera</p><h2>Valor de mercado por instantánea</h2></div><span className="live-label"><i />{realtimeState === "activo" ? "En directo" : "Histórico"}</span></div>{chartRows.length > 0 ? <ResponsiveContainer height={290} width="100%"><AreaChart data={chartRows} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}><defs><linearGradient id="portfolioArea" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#2d6cdf" stopOpacity={0.25} /><stop offset="95%" stopColor="#2d6cdf" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#edf1f7" strokeDasharray="3 3" vertical={false} /><XAxis axisLine={false} dataKey="at" tick={{ fill: "#8190a4", fontSize: 11 }} tickLine={false} /><YAxis axisLine={false} tick={{ fill: "#8190a4", fontSize: 11 }} tickFormatter={(value) => compactEuro.format(value)} tickLine={false} /><Tooltip formatter={(value) => euro.format(Number(value ?? 0))} labelStyle={{ color: "#42516b" }} /><Area dataKey="value" fill="url(#portfolioArea)" stroke="#2d6cdf" strokeWidth={2.5} type="monotone" /></AreaChart></ResponsiveContainer> : <div className="realtime-empty"><LineChartIcon size={26} /><strong>Aún no hay tendencia que dibujar.</strong><span>Al sincronizar transacciones o posiciones, el backend creará las instantáneas que alimentan este gráfico.</span></div>}</article><article className="panel live-alert-panel"><div className="panel-heading"><div><p className="eyebrow">Centro de alertas</p><h2>Señales activas</h2></div><button className="text-button" onClick={() => setScreen("alertas")} type="button">Ver todas</button></div>{openAlerts.length > 0 ? <div className="alert-list">{openAlerts.slice(0, 4).map((alert) => <article className={`live-alert ${alert.severity}`} key={alert.id}><AlertCircle size={17} /><div><strong>{alert.title}</strong><p>{alert.body}</p><small>{formatDateTime(alert.triggered_at)}</small></div></article>)}</div> : <div className="realtime-empty compact"><CheckCircle2 size={23} /><strong>No hay alertas abiertas.</strong><span>Las reglas se evaluarán al recibir datos conciliados.</span></div>}</article></section></>}
        {screen === "cartera" && <><section className="page-heading compact-heading"><div><p className="eyebrow">Posiciones persistentes</p><h1>Instrumentos y valoración actual.</h1><p className="subtitle">Cada importe aparece solo si existe en una posición registrada y tiene trazabilidad de actualización.</p></div></section><section className="panel realtime-positions"><div className="panel-heading"><div><p className="eyebrow">Cartera</p><h2>{workspace.positions.length} posiciones disponibles</h2></div><span className="data-stamp">Actualizado {latest ? formatDateTime(latest.as_of) : "sin datos"}</span></div>{workspace.positions.length > 0 ? <div className="positions-table-wrap"><table className="positions-table"><thead><tr><th>Activo</th><th>Clase</th><th>Unidades</th><th>Coste</th><th>Valor</th><th>Última lectura</th></tr></thead><tbody>{workspace.positions.map((position) => { const instrument = workspace.instruments.find((item) => item.id === position.instrument_id); return <tr key={position.id}><td><strong>{instrument?.name ?? "Instrumento sin identificar"}</strong><small>{instrument?.isin ?? instrument?.symbol ?? "Sin ISIN/ticker"}</small></td><td><span className="source-chip">{instrument?.asset_class ?? "Sin clasificar"}</span></td><td>{oneDecimal.format(position.quantity)}</td><td>{euro.format(position.cost_basis)}</td><td><strong>{position.market_value === null ? "Pendiente" : euro.format(position.market_value)}</strong></td><td>{formatDateTime(position.as_of)}</td></tr>; })}</tbody></table></div> : <div className="realtime-empty"><WalletCards size={26} /><strong>No hay posiciones almacenadas.</strong><span>Registra una fuente y completa una sincronización validada para crear posiciones reales.</span><button className="button secondary" onClick={() => setScreen("fuentes")} type="button">Registrar una fuente</button></div>}</section></>}
        {screen === "alertas" && <><section className="page-heading compact-heading"><div><p className="eyebrow">Alertas inteligentes</p><h1>Reglas configurables sobre datos comprobables.</h1><p className="subtitle">Mora P2P, dividendos, desvíos de asignación, variaciones FX y calidad de fuentes se evaluarán en el backend cuando entren datos conciliados.</p></div></section><section className="alert-rule-grid"><article className="panel rule-card"><BellRing size={20} /><h2>Crear una regla</h2><p>Elige el evento y su umbral. La regla se guarda en tu organización y se deduplicará cuando el proceso de datos la evalúe.</p><form className="compact-form" onSubmit={registerAlertRule}><select aria-label="Tipo de alerta" onChange={(event) => setRuleType(event.target.value)} value={ruleType}><option value="rebalance_drift">Desviación de rebalanceo (%)</option><option value="fx_move">Movimiento de tipo de cambio (%)</option><option value="p2p_overdue">Mora P2P (días)</option><option value="dividend_due">Dividendo próximo (días)</option><option value="data_stale">Fuente sin actualizar (horas)</option></select><input aria-label="Umbral" inputMode="decimal" min="0" onChange={(event) => setRuleThreshold(event.target.value)} step="any" type="number" value={ruleThreshold} /><button className="button primary" disabled={creatingRule} type="submit">{creatingRule ? "Guardando…" : "Guardar regla"}</button></form></article><article className="panel rule-card"><ShieldCheck size={20} /><h2>{workspace.rules.length} reglas activas</h2>{workspace.rules.length ? <div className="configured-rules">{workspace.rules.map((rule) => <span key={rule.id}><b>{rule.rule_type.replaceAll("_", " ")}</b> · umbral {rule.threshold ?? "—"}</span>)}</div> : <p>Sin reglas configuradas. Los envíos externos permanecen desactivados por defecto.</p>}<span>El centro de la aplicación es el primer canal de entrega.</span></article></section><section className="panel live-alert-panel"><div className="panel-heading"><div><p className="eyebrow">Historial activo</p><h2>Alertas que requieren seguimiento</h2></div></div>{workspace.alerts.length ? <div className="alert-list">{workspace.alerts.map((alert) => <article className={`live-alert ${alert.severity}`} key={alert.id}><AlertCircle size={17} /><div><strong>{alert.title}</strong><p>{alert.body}</p><small>{alert.status} · {formatDateTime(alert.triggered_at)}</small></div></article>)}</div> : <div className="realtime-empty compact"><CheckCircle2 size={24} /><strong>El historial está limpio.</strong><span>Las alertas aparecerán aquí cuando se cumpla una regla versionada.</span></div>}</section></>}
        {screen === "informes" && <><section className="page-heading compact-heading"><div><p className="eyebrow">Informes reproducibles</p><h1>Documentos basados en instantáneas cerradas.</h1><p className="subtitle">Los documentos solo toman datos reales disponibles. Los informes fiscales se mantienen como borradores de revisión profesional.</p></div></section><section className="report-grid"><article className="panel report-card"><FileText size={23} /><p className="eyebrow">Portfolio Summary</p><h2>Resumen de cartera</h2><p>PDF profesional con valoración, coste, resultado y posiciones de la última instantánea guardada.</p><button className="button primary" disabled={!latest} onClick={() => void downloadPortfolioSummary()} type="button">Generar PDF</button></article><article className="panel report-card"><CalendarIcon /><p className="eyebrow">Calendario de dividendos</p><h2>Próximos cobros</h2><p>Se activará al sincronizar operaciones y eventos de dividendo con fuente y fecha verificables.</p><button className="button secondary" disabled type="button">Requiere datos de dividendo</button></article><article className="panel report-card"><CircleDollarSign size={23} /><p className="eyebrow">Tax Tracker</p><h2>Borrador fiscal</h2><p>Requiere transacciones conciliadas, retenciones, divisas y reglas revisadas antes de generar un documento de trabajo.</p><button className="button secondary" disabled type="button">Requiere conciliación fiscal</button></article></section><div className="tax-disclaimer"><AlertCircle size={20} /><div><strong>Revisión fiscal obligatoria</strong><p>Los borradores no se presentan ante Hacienda ni sustituyen los datos fiscales de las entidades o el criterio de un profesional tributario.</p></div></div></>}
        {screen === "fuentes" && <><section className="page-heading compact-heading"><div><p className="eyebrow">Conectores de datos</p><h1>Configura la fuente antes de validarla.</h1><p className="subtitle">Indica exactamente qué hoja y qué columnas autorizas. La aplicación guardará la configuración, pero no leerá ni importará datos hasta la validación de acceso.</p></div></section><section className="sources-layout"><article className="panel source-form-card"><div className="panel-heading"><div><p className="eyebrow">Nueva fuente</p><h2>Google Sheets con esquema explícito</h2></div><FileSpreadsheet size={22} /></div><form className="admin-form" onSubmit={registerSource}><label><span>Nombre visible de la fuente</span><input onChange={(event) => setSourceName(event.target.value)} placeholder="Ej. Cartera familiar · enero 2026" value={sourceName} required /></label><label><span>Tipo de fuente</span><select onChange={(event) => setSourceKind(event.target.value)} value={sourceKind}><option value="google_sheets">Google Sheets</option><option value="csv">Archivo CSV</option><option value="xlsx">Archivo Excel</option><option value="sql">Base de datos SQL</option></select></label>{sourceKind === "google_sheets" && <><fieldset className="sheet-fieldset"><legend>Hoja autorizada</legend><label><span>URL o ID exacto de Google Sheets</span><input onChange={(event) => setGoogleSheetReference(event.target.value)} placeholder="https://docs.google.com/spreadsheets/d/... o ID" value={googleSheetReference} required /></label><div className="source-mapping-grid"><label><span>Pestaña</span><input onChange={(event) => setGoogleSheetTab(event.target.value)} placeholder="Ej. Transacciones" value={googleSheetTab} /></label><label><span>Rango autorizado</span><input onChange={(event) => setGoogleSheetRange(event.target.value)} placeholder="Ej. A1:H500" value={googleSheetRange} /></label></div><small className="field-help">Pestaña y rango son opcionales, pero restringirlos reduce la superficie de lectura de la sincronización.</small></fieldset><fieldset className="sheet-fieldset"><legend>Mapeo obligatorio de columnas</legend><p className="field-help">Escribe los encabezados tal como aparecen en la hoja. El primer acceso solo comprobará este esquema antes de importar.</p><div className="source-mapping-grid"><label><span>Fecha</span><input onChange={(event) => setDateColumn(event.target.value)} placeholder="Fecha" value={dateColumn} required /></label><label><span>Instrumento</span><input onChange={(event) => setInstrumentColumn(event.target.value)} placeholder="ISIN o Instrumento" value={instrumentColumn} required /></label><label><span>Tipo</span><input onChange={(event) => setTypeColumn(event.target.value)} placeholder="Tipo" value={typeColumn} required /></label><label><span>Cantidad</span><input onChange={(event) => setQuantityColumn(event.target.value)} placeholder="Cantidad" value={quantityColumn} required /></label><label><span>Precio</span><input onChange={(event) => setPriceColumn(event.target.value)} placeholder="Precio" value={priceColumn} required /></label><label><span>Divisa</span><input onChange={(event) => setCurrencyColumn(event.target.value)} placeholder="Divisa" value={currencyColumn} required /></label></div></fieldset></>}<button className="button primary full-width" disabled={creatingSource} type="submit">{creatingSource ? "Guardando configuración…" : sourceKind === "google_sheets" ? "Guardar configuración pendiente" : "Registrar fuente"}</button></form><div className="source-security"><ShieldCheck size={18} /><span>Esta acción guarda solo la referencia y el esquema autorizado. No almacena tokens OAuth, no abre la hoja y no importa movimientos.</span></div></article><article className="panel source-list-card"><div className="panel-heading"><div><p className="eyebrow">Estado de fuentes</p><h2>{workspace.sources.length} fuentes registradas</h2></div></div>{workspace.sources.length ? <div className="source-list">{workspace.sources.map((source) => <article key={source.id}><span className="source-type">{source.provider === "google_sheets" ? <FileSpreadsheet size={17} /> : <Database size={17} />}</span><div><strong>{source.display_name}</strong><small>{source.provider.replace("_", " ")} · {formatDateTime(source.last_success_at)}</small>{source.provider === "google_sheets" && source.connection_config?.spreadsheet_id && <em>Hoja configurada · {source.connection_config.sheet_name || "pestaña no delimitada"}{source.connection_config.range ? ` · ${source.connection_config.range}` : ""}</em>}{source.last_error_code && <em>Error controlado: {source.last_error_code}</em>}</div><span className={`badge ${source.status === "active" ? "badge-success" : source.status === "error" ? "badge-warning" : "badge-neutral"}`}>{source.status}</span></article>)}</div> : <div className="realtime-empty compact"><Database size={24} /><strong>No hay fuentes registradas.</strong><span>Configura una hoja y su mapeo antes de autorizar la primera lectura.</span></div>}</article></section></>}
        {screen === "analisis" && <section className="analysis-live-intro"><p className="eyebrow">Módulo de análisis financiero</p><h1>Análisis explicable, con cobertura y fuentes visibles.</h1><p>El motor pondera salud financiera, crecimiento, valoración, ventaja competitiva, técnico/momentum y gestión de riesgos. Publica métricas solo cuando existen entradas trazables y advierte de la cobertura incompleta.</p><div className="analysis-factor-grid">{[["Salud financiera", "20 %"], ["Crecimiento", "20 %"], ["Valoración", "20 %"], ["Ventaja competitiva", "15 %"], ["Técnico / Momentum", "15 %"], ["Gestión de riesgos", "10 %"]].map(([name, weight]) => <article key={name}><span>{weight}</span><strong>{name}</strong><small>{workspace.analysisRuns.length ? "Calculado en ejecuciones disponibles" : "Esperando fuente trazable"}</small></article>)}</div>{workspace.analysisRuns.length > 0 ? <section className="panel analysis-run-panel"><div className="panel-heading"><div><p className="eyebrow">Ejecuciones persistidas</p><h2>Resultados disponibles para revisión</h2></div><span className="data-stamp">Se actualizan por Realtime</span></div><div className="analysis-run-list">{workspace.analysisRuns.map((run) => { const instrument = workspace.instruments.find((item) => item.id === run.instrument_id); const warningCount = Array.isArray(run.warnings) ? run.warnings.length : 0; return <article key={run.id}><div><strong>{instrument?.name ?? "Instrumento sin identificar"}</strong><small>{formatDateTime(run.as_of)} · Estado: {run.status}</small></div><span><small>Cobertura</small><b>{oneDecimal.format(run.coverage_pct)} %</b></span><span><small>Score ponderado</small><b>{run.weighted_score === null ? "No publicado" : oneDecimal.format(run.weighted_score)}</b></span><span><small>DCF por acción</small><b>{run.dcf_fair_value === null ? "No disponible" : euro.format(run.dcf_fair_value)}</b></span><span><small>Advertencias</small><b>{warningCount}</b></span></article>; })}</div></section> : <div className="realtime-empty analysis-empty"><Sparkles size={27} /><strong>No hay ejecuciones de análisis aún.</strong><span>Sin fundamentales, series de precios con licencia y fuente de las hipótesis, el sistema no calcula un score ni una valoración artificial.</span></div>}<div className="analysis-callout"><ShieldCheck size={19} /><span>El modelo implementa score ponderado, DCF con valor terminal, SMA/MACD/RSI/Bollinger/ATR, volatilidad, drawdown, Sharpe y fracción Kelly conservadora. Son cálculos informativos y reproducibles: no ejecutan operaciones, no ofrecen compra/venta ni sustituyen el criterio profesional.</span></div></section>}
      </div>
    </section>
  </main>;
}

function CalendarIcon() {
  return <FileSpreadsheet size={23} />;
}
