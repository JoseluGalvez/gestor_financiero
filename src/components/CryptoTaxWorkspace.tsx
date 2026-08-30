"use client";

import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, ShieldCheck, UploadCloud, X } from "lucide-react";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import { calculateCryptoTax, cryptoDraftCsv, cryptoTemplateCsv, operationsFromCsv, type CryptoTaxResult } from "@/lib/crypto-tax";

const euro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
const quantity = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 10 });
const MAX_LOCAL_FILE_BYTES = 15 * 1024 * 1024;
const MAX_CRYPTO_OPERATIONS = 50_000;

function download(content: string, fileName: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function CryptoTaxWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<CryptoTaxResult | null>(null);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [year, setYear] = useState(String(new Date().getFullYear() - 1));

  const allWarnings = useMemo(() => [...parseWarnings, ...(result?.warnings ?? [])], [parseWarnings, result]);
  const reviewRequired = Boolean(result && (result.summary.reviewLines > 0 || result.summary.unsupportedRows > 0 || allWarnings.length > 0));

  async function analyzeFile(file: File) {
    if (file.size > MAX_LOCAL_FILE_BYTES) {
      setFileName("");
      setResult(null);
      setParseWarnings(["Por privacidad y rendimiento, el archivo supera el límite local de 15 MB. Divide el CSV antes de analizarlo."]);
      return;
    }
    if (!file.name.toLocaleLowerCase("es-ES").endsWith(".csv") && !file.type.includes("csv")) {
      setResult(null);
      setParseWarnings(["Solo se admiten archivos CSV. Descarga la plantilla y completa las columnas con tus operaciones."]);
      return;
    }
    const parsed = operationsFromCsv(await file.text());
    if (parsed.operations.length > MAX_CRYPTO_OPERATIONS) {
      setFileName("");
      setResult(null);
      setParseWarnings([`El archivo contiene más de ${MAX_CRYPTO_OPERATIONS.toLocaleString("es-ES")} operaciones. Divide el CSV antes de analizarlo localmente.`]);
      return;
    }
    setFileName(file.name);
    setParseWarnings(parsed.warnings);
    setResult(calculateCryptoTax(parsed.operations));
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void analyzeFile(file);
  }

  function clearMemory() {
    setFileName("");
    setResult(null);
    setParseWarnings([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  return <section className="crypto-workspace">
    <section className="crypto-hero">
      <div><p className="eyebrow">IRPF · criptoactivos</p><h1>Reconstruye ventas y permutas con trazabilidad FIFO.</h1><p>Adjunta un CSV local para obtener un detalle revisable de transmisiones. El archivo no se guarda en Supabase ni se envía a Hacienda.</p></div>
      <div className="crypto-privacy-pill"><ShieldCheck size={18} /><span><b>Revisión local</b>CSV y cálculos solo en memoria</span></div>
    </section>

    <section className="crypto-disclaimer"><AlertCircle size={20} /><div><strong>Borrador de trabajo, no declaración tributaria</strong><p>La aplicación calcula transmisiones con FIFO sobre la secuencia del CSV. No estima cuota de IRPF, no sustituye el Modelo 100 y no presenta información ante la AEAT. Verifica el resultado con un profesional antes de utilizarlo.</p></div></section>

    <section className="crypto-upload-card panel">
      <div><p className="eyebrow">Archivo de operaciones</p><h2>Adjunta compras, ventas y permutas</h2><p>Para calcular una venta o permuta hacen falta los lotes de compra previos, fechas, cantidades, valores en EUR y comisiones. Las operaciones con datos incompletos quedan marcadas para revisión.</p></div>
      <div className="crypto-upload-actions"><input accept=".csv,text/csv" className="visually-hidden" onChange={onFileChange} ref={inputRef} type="file" /><button className="button primary" onClick={() => inputRef.current?.click()} type="button"><UploadCloud size={16} />Adjuntar CSV local</button><button className="button secondary" onClick={() => download(cryptoTemplateCsv(), "plantilla-operaciones-cripto.csv", "text/csv;charset=utf-8")} type="button"><FileSpreadsheet size={16} />Descargar plantilla</button>{fileName && <button className="button ghost" onClick={clearMemory} type="button"><X size={16} />Eliminar de memoria</button>}</div>
      <div className="crypto-template-note"><ShieldCheck size={16} /><span>Columnas: Fecha, Tipo, Activo entregado, Cantidad entregada, Activo recibido, Cantidad recibida, Valor EUR entregado, Valor EUR recibido, Comisiones EUR y Plataforma.</span></div>
    </section>

    {!result && <section className="crypto-empty panel"><FileSpreadsheet size={28} /><strong>Aún no hay un CSV analizado.</strong><span>Selecciona un archivo que contenga compras históricas y las ventas o permutas del ejercicio que deseas revisar.</span></section>}

    {result && <>
      <section className="crypto-status-grid"><article className={reviewRequired ? "crypto-status review" : "crypto-status ready"}>{reviewRequired ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}<div><span>Estado del borrador</span><strong>{reviewRequired ? "Revisión requerida" : "Cálculo local completo"}</strong><small>{result.summary.reviewLines} transmisiones pendientes de validar</small></div></article><article className="crypto-status"><FileSpreadsheet size={20} /><div><span>Operaciones leídas</span><strong>{result.operations.length}</strong><small>{result.summary.unsupportedRows} filas con datos insuficientes</small></div></article><article className="crypto-status"><ShieldCheck size={20} /><div><span>Privacidad</span><strong>Solo en memoria</strong><small>{fileName || "Sin archivo persistido"}</small></div></article></section>

      <section className="crypto-kpis"><article><span>Ganancias confirmadas</span><strong className="text-positive">{euro.format(result.summary.gains)}</strong><small>Solo transmisiones trazables</small></article><article><span>Pérdidas confirmadas</span><strong className="text-negative">{euro.format(result.summary.losses)}</strong><small>Solo transmisiones trazables</small></article><article><span>Resultado neto confirmado</span><strong className={result.summary.netResult < 0 ? "text-negative" : "text-positive"}>{euro.format(result.summary.netResult)}</strong><small>No equivale a cuota tributaria</small></article><article><span>Transmisiones calculadas</span><strong>{result.summary.confirmedLines} / {result.lines.length}</strong><small>Ventas y permutas del CSV</small></article></section>

      {allWarnings.length > 0 && <section className="crypto-warnings"><AlertCircle size={19} /><div><strong>Antes de descargar el borrador</strong><ul>{allWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div></section>}

      <section className="crypto-grid"><article className="panel crypto-lines"><div className="panel-heading"><div><p className="eyebrow">Detalle de transmisiones</p><h2>FIFO por activo y orden cronológico</h2></div><span className="data-stamp">Ejercicio revisado: {year}</span></div>{result.lines.length ? <div className="crypto-table-wrap"><table><thead><tr><th>Fecha</th><th>Operación</th><th>Activo</th><th>Cantidad</th><th>Transmisión</th><th>Adquisición FIFO</th><th>Resultado</th><th>Estado</th></tr></thead><tbody>{result.lines.map((line) => <tr key={line.id}><td>{line.date}</td><td>{line.action === "sell" ? "Venta" : `Permuta → ${line.receivedAsset}`}</td><td>{line.asset}</td><td>{quantity.format(line.quantity)}</td><td>{euro.format(line.transmissionValue)}</td><td>{line.acquisitionValue === null ? "—" : euro.format(line.acquisitionValue)}</td><td className={line.result === null ? "" : line.result < 0 ? "text-negative" : "text-positive"}>{line.result === null ? "Pendiente" : euro.format(line.result)}</td><td>{line.warning ? <span className="crypto-review-chip">Revisar</span> : <span className="crypto-ready-chip">Calculado</span>}</td></tr>)}</tbody></table></div> : <div className="crypto-empty compact"><AlertCircle size={23} /><strong>No se detectaron ventas ni permutas.</strong><span>Las compras se conservan como lotes FIFO para transmisiones posteriores.</span></div>}</article><aside className="panel crypto-checklist"><p className="eyebrow">Revisión obligatoria</p><h2>Checklist antes de Renta</h2><ul><li><CheckCircle2 size={16} />Comprueba que se han incluido compras históricas o saldo inicial de cada activo.</li><li><CheckCircle2 size={16} />Contrasta los valores EUR y las comisiones con los justificantes del exchange.</li><li><AlertCircle size={16} />Revisa permutas: el CSV debe contener un valor de mercado EUR coherente en la fecha de la operación.</li><li><AlertCircle size={16} />Las operaciones no incluidas, staking, airdrops, derivados, NFT y actividad económica requieren revisión separada.</li></ul><label className="crypto-year"><span>Ejercicio del borrador</span><input inputMode="numeric" max="2100" min="2017" onChange={(event) => setYear(event.target.value)} type="number" value={year} /></label><button className="button primary full-width" onClick={() => download(cryptoDraftCsv(result, year), `borrador-cripto-irpf-${year}.csv`, "text/csv;charset=utf-8")} type="button"><Download size={16} />Descargar borrador revisable</button></aside></section>

      <section className="panel crypto-holdings"><div className="panel-heading"><div><p className="eyebrow">Lotes pendientes</p><h2>Inventario FIFO restante según el CSV</h2></div></div>{result.holdings.length ? <div className="crypto-holdings-list">{result.holdings.map((holding) => <div key={holding.asset}><strong>{holding.asset}</strong><span>{quantity.format(holding.quantity)} unidades</span><b>{euro.format(holding.cost)} de coste FIFO</b></div>)}</div> : <div className="crypto-empty compact"><CheckCircle2 size={23} /><strong>No quedan lotes abiertos en el archivo.</strong><span>Este resultado solo refleja las operaciones cargadas en la sesión local.</span></div>}</section>

      <section className="crypto-model-721"><AlertCircle size={19} /><div><p className="eyebrow">Control separado</p><h2>Posible revisión del modelo 721</h2><p>Las ventas y permutas no bastan para determinar esta obligación informativa. Para revisarla se necesitan los saldos por activo a 31 de diciembre, la entidad que custodia las claves y su situación. El módulo no presenta ni rellena el modelo 721.</p></div></section>
    </>}
  </section>;
}
