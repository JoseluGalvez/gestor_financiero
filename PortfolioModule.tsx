import { useCallback, useEffect, useState } from "react";
import { getAllAdapters, parseCSV, parseXLSX, detectPlatform, buildImportResult } from "./portfolio-adapters";
import { aggregatePortfolio } from "./portfolio-aggregation";

const ASSET_CLASS_LABELS: Record<string, string> = {
  equity: "Acciones",
  etf: "ETFs",
  bond: "Bonos",
  fund: "Fondos",
  crypto: "Criptomonedas",
  derivative: "Derivados",
  cash: "Efectivo",
  other: "Otros",
};

function formatCurrency(value: number, currency = "EUR"): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

function SummaryCard({ label, value, variant }: { label: string; value: string; variant?: "positive" | "negative" }) {
  return (
    <div className={`summary-card ${variant ?? ""}`}>
      <span className="label">{label}</span>
      <span className={`value ${variant ?? ""}`}>{value}</span>
    </div>
  );
}

function formatCurrency(value: number, currency = "EUR"): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

function AllocationChart({ data }: { data: Map<string, { value: number; percentage: number; count: number }> }) {
  const entries = Array.from(data.entries())
    .filter(([, v]) => v.value > 0)
    .sort((a, b) => b[1].value - a[1].value);

  if (entries.length === 0) return <p className="empty">Sin datos</p>;

  return (
    <div className="allocation-chart">
      {entries.map(([key, slice]) => (
        <div key={key} className="allocation-row">
          <span className="label">{ASSET_CLASS_LABELS[key] ?? key}</span>
          <div className="bar-container">
            <div className="bar" style={{ width: `${slice.percentage}%` }} />
            <span className="percentage">{slice.percentage.toFixed(1)}%</span>
          </div>
          <span className="value">{formatCurrency(slice.value)}</span>
        </div>
      ))}
    </div>
  );
}

function MetricItem({ label, value, variant }: { label: string; value: string; variant?: "positive" | "negative" }) {
  return (
    <div className="metric-item">
      <span className="label">{label}</span>
      <span className={`value ${variant ?? ""}`}>{value}</span>
    </div>
  );
}

function PerformanceMetrics({ metrics }: { metrics: { twr: number; xirr: number; totalReturn: number; totalReturnPct: number } }) {
  return (
    <div className="metrics-grid">
      <MetricItem label="TWR" value={`${metrics.twr.toFixed(2)}%`} />
      <MetricItem label="XIRR" value={`${metrics.xirr.toFixed(2)}%`} />
      <MetricItem label="Rentabilidad Total" value={`${metrics.totalReturnPct.toFixed(2)}%`} variant={metrics.totalReturnPct >= 0 ? "positive" : "negative"} />
      <MetricItem label="Beneficio Total" value={formatCurrency(metrics.totalReturn)} variant={metrics.totalReturn >= 0 ? "positive" : "negative"} />
    </div>
  );
}

function PositionsTable({ positions }: { positions: Map<string, any> }) {
  const posArray = Array.from(positions).sort((a, b) => (b[1].currentValue ?? 0) - (a[1].currentValue ?? 0));

  if (posArray.length === 0) return <p className="empty">No hay posiciones</p>;

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Símbolo</th>
            <th>Nombre</th>
            <th>Clase</th>
            <th className="num">Cantidad</th>
            <th className="num">Precio Medio</th>
            <th className="num">Precio Actual</th>
            <th className="num">Valor Actual</th>
            <th className="num">P&L Latente</th>
            <th className="num">P&L %</th>
            <th>Plataformas</th>
          </tr>
        </thead>
        <tbody>
          {posArray.map(([key, pos]) => (
            <tr key={key}>
              <td><strong>{pos.symbol}</strong></td>
              <td>{pos.name}</td>
              <td>{ASSET_CLASS_LABELS[pos.assetClass] ?? pos.assetClass}</td>
              <td className="num">{pos.totalQuantity.toLocaleString("es-ES", { maximumFractionDigits: 4 })}</td>
              <td className="num">{pos.weightedAveragePrice.toFixed(4)} {pos.currency}</td>
              <td className="num">{pos.currentPrice?.toFixed(4) ?? "—"} {pos.currency}</td>
              <td className="num">{pos.currentValue?.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "—"} {pos.currency}</td>
              <td className={`num ${(pos.unrealizedPnl ?? 0) >= 0 ? "positive" : "negative"}`}>
                {pos.unrealizedPnl?.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "—"} {pos.currency}
              </td>
              <td className={`num ${(pos.unrealizedPnlPct ?? 0) >= 0 ? "positive" : "negative"}`}>
                {pos.unrealizedPnlPct?.toFixed(2) ?? "—"}%
              </td>
              <td>{Array.from(pos.byPlatform.keys()).join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PortfolioDashboard({ portfolio, onExport, onExportPdf, onClear }: {
  portfolio: any;
  onExport: () => void;
  onExportPdf: () => void;
  onClear: () => void;
}) {
  if (!portfolio) return <div className="empty-state">No hay datos de cartera. Importa un archivo CSV/XLSX.</div>;

  return (
    <div className="portfolio-dashboard">
      <div className="dashboard-header">
        <h2>Cartera Agregada Multi-Plataforma</h2>
        <div className="dashboard-actions">
          <button className="btn btn-secondary" onClick={onExport}>Exportar JSON</button>
          <button className="btn btn-secondary" onClick={onExportPdf}>Exportar PDF</button>
          <button className="btn btn-danger" onClick={onClear}>Limpiar cartera</button>
        </div>
      </div>

      <div className="summary-cards">
        <SummaryCard label="Valor Total" value={formatCurrency(portfolio.totalValue)} />
        <SummaryCard label="Coste Total" value={formatCurrency(portfolio.totalCostBasis)} />
        <SummaryCard
          label="Plusvalía/Minusvalía Latente"
          value={formatCurrency(portfolio.totalUnrealizedPnl)}
          variant={portfolio.totalUnrealizedPnl >= 0 ? "positive" : "negative"}
        />
        <SummaryCard
          label="Rentabilidad Latente"
          value={`${portfolio.totalUnrealizedPnlPct.toFixed(2)}%`}
          variant={portfolio.totalUnrealizedPnl >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="dashboard-grid">
        <section className="card">
          <h3>Asignación por Clase de Activo</h3>
          <AllocationChart data={portfolio.allocation.byAssetClass} />
        </section>
        <section className="card">
          <h3>Asignación por Plataforma</h3>
          <AllocationChart data={portfolio.allocation.byPlatform} />
        </section>
        <section className="card">
          <h3>Asignación por Divisa</h3>
          <AllocationChart data={portfolio.allocation.byCurrency} />
        </section>
        <section className="card">
          <h3>Rendimiento</h3>
          <PerformanceMetrics metrics={portfolio.performance} />
        </section>
      </div>

      <section className="card positions-table">
        <h3>Posiciones Detalle</h3>
        <PositionsTable positions={portfolio.positions} />
      </section>
    </div>
  );
}

function PortfolioSettings({ onLock, onExport, onImport, isLocked, password, onPasswordChange }: {
  onLock: () => void;
  onExport: () => void;
  onImport: () => void;
  isLocked: boolean;
  password: string;
  onPasswordChange: (p: string) => void;
}) {
  return (
    <div className="portfolio-settings">
      <h3>Configuración de Cartera</h3>
      <div className="settings-group">
        <h4>Seguridad</h4>
        <label>
          <input type="checkbox" checked={isLocked} onChange={() => onLock()} />
          <span>Cifrar cartera con contraseña (AES-GCM)</span>
        </label>
        {isLocked && (
          <div className="password-field">
            <label>Contraseña</label>
            <input type="password" value={password} onChange={(e) => onPasswordChange(e.target.value)} placeholder="Mínimo 8 caracteres" />
            <small>La cartera se cifra con AES-256-GCM + PBKDF2 (100k iteraciones)</small>
          </div>
        )}
      </div>
      <div className="settings-group">
        <h4>Importar / Exportar</h4>
        <button className="btn btn-secondary" onClick={onExport}>Exportar cartera (JSON)</button>
        <button className="btn btn-secondary" onClick={onImport}>Importar cartera (JSON)</button>
      </div>
    </div>
  );
}

function PortfolioModule() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [view, setView] = useState<"dashboard" | "import" | "settings">("dashboard");
  const [importResult, setImportResult] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  useEffect(() => {
    loadPortfolio().then((result) => {
      if (result.success && result.data) {
        setPortfolio(result.data);
      }
    });
  }, []);

  const handleImportComplete = useCallback((result: any) => {
    if (result.success && result.positions.length > 0) {
      const positions = result.positions;
      const transactions = result.transactions;
      const symbols = new Set(positions.map((p: any) => p.symbol));
      const currentPrices = new Map<string, number>();
      for (const sym of symbols) {
        currentPrices.set(`${sym}:EUR`, 100 + Math.random() * 50);
      }
      const fxRates = new Map<string, number>([["USD:EUR", 0.92], ["GBP:EUR", 1.17]]);
      const aggregated = aggregatePortfolio(positions, transactions, currentPrices, fxRates, "EUR");
      setPortfolio(aggregated);
      savePortfolio(aggregated);
      setView("dashboard");
    }
  }, []);

  const handleImportError = useCallback((msg: string) => setImportError(msg), []);

  const handleExport = useCallback(() => {
    if (!portfolio) return;
    const json = exportPortfolioData(portfolio);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cartera-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [portfolio]);

  const handleExportPdf = useCallback(() => {
    if (!portfolio) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>Informe de Cartera</title>
        <style>
          body{font-family:sans-serif;padding:20px;}
          table{width:100%;border-collapse:collapse;margin:10px 0;}
          th,td{border:1px solid #ddd;padding:8px;text-align:left;}
          th{background:#f5f5f5;}
          .pos{color:green;font-weight:bold;}
          .neg{color:red;font-weight:bold;}
        </style></head><body>
        <h1>Informe de Cartera Agregada</h1>
        <p>Fecha: ${new Date().toLocaleDateString("es-ES")}</p>
        <h2>Resumen</h2>
        <ul><li>Valor Total: ${portfolio.totalValue.toLocaleString("es-ES", {style:"currency",currency:"EUR"})}</li>
        <li>Coste: ${portfolio.totalCostBasis.toLocaleString("es-ES",{style:"currency",currency:"EUR"})}</li>
        <li class="${portfolio.totalUnrealizedPnl>=0?"pos":"neg"}">P&L: ${portfolio.totalUnrealizedPnl.toLocaleString("es-ES",{style:"currency",currency:"EUR"})} (${portfolio.totalUnrealizedPnlPct.toFixed(2)}%)</li>
        <li>TWR: ${portfolio.performance.twr.toFixed(2)}% | XIRR: ${portfolio.performance.xirr.toFixed(2)}%</li></ul>
        <h2>Posiciones</h2>
        <table><thead><tr><th>Símbolo</th><th>Cant.</th><th>P.Medio</th><th>Actual</th><th>Valor</th><th>P&L</th><th>%</th></tr></thead>
        <tbody>${Array.from(portfolio.positions).map(([,p])=>`<tr><td>${p.symbol}</td><td>${p.totalQuantity}</td><td>${p.weightedAveragePrice.toFixed(4)}</td><td>${p.currentPrice?.toFixed(4)||"N/A"}</td><td>${p.currentValue?.toFixed(2)||"N/A"}</td><td class="${(p.unrealizedPnl??0)>=0?"pos":"neg"}">${p.unrealizedPnl?.toFixed(2)||"N/A"}</td><td class="${(p.unrealizedPnlPct??0)>=0?"pos":"neg"}">${p.unrealizedPnlPct?.toFixed(2)||"N/A"}%</td></tr>`).join("")}</tbody></table></body></html>
      `);
      printWindow.document.close();
      printWindow.onload = () => { printWindow.focus(); printWindow.print(); };
    }
  }, [portfolio]);

  const handleClear = useCallback(() => {
    if (confirm("¿Eliminar toda la cartera? Esta acción no se puede deshacer.")) {
      clearPortfolio();
      setPortfolio(null);
    }
  }, []);

  const handleLock = useCallback(() => {
    setIsLocked(!isLocked);
    if (!isLocked && !password) {
      const newPass = prompt("Introduce contraseña para cifrar la cartera:");
      if (newPass) setPassword(newPass);
      else setIsLocked(false);
    }
    if (portfolio) savePortfolio(portfolio, isLocked ? undefined : password);
  }, [isLocked, password, portfolio]);

  const handleImportJson = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      const result = importPortfolioData(text, password);
      if (result.success && result.data) {
        setPortfolio(result.data);
        savePortfolio(result.data, password);
      } else {
        setImportError(result.error ?? "Error al importar");
      }
    };
    input.click();
  }, [password]);

  if (!portfolio) {
    return (
      <div className="portfolio-module">
        <nav className="portfolio-nav">
          <button className={view === "import" ? "active" : ""} onClick={() => setView("import")}>Importar</button>
          <button className={view === "settings" ? "active" : ""} onClick={() => setView("settings")}>Configuración</button>
        </nav>
        {view === "import" && <PortfolioImporter onImportComplete={handleImportComplete} onError={handleImportError} />}
        {view === "settings" && <PortfolioSettings onLock={handleLock} onExport={handleExport} onImport={handleImportJson} isLocked={isLocked} password={password} onPasswordChange={setPassword} />}
      </div>
    );
  }

  return (
    <div className="portfolio-module">
      <nav className="portfolio-nav">
        <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>Dashboard</button>
        <button className={view === "import" ? "active" : ""} onClick={() => setView("import")}>Importar</button>
        <button className={view === "settings" ? "active" : ""} onClick={() => setView("settings")}>Configuración</button>
      </nav>
      {view === "dashboard" && <PortfolioDashboard portfolio={portfolio} onExport={handleExport} onExportPdf={handleExportPdf} onClear={handleClear} />}
      {view === "import" && <PortfolioImporter onImportComplete={handleImportComplete} onError={handleImportError} />}
      {view === "settings" && <PortfolioSettings onLock={handleLock} onExport={handleExport} onImport={handleImportJson} isLocked={isLocked} password={password} onPasswordChange={setPassword} />}
    </div>
  );
}

export default PortfolioModule;