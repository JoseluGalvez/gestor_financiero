import { csvFromRecords, type LocalRecord } from "../src/lib/local-analytics.ts";
import { calculateCryptoTax, cryptoDraftCsv, normalizeCryptoIsoDate, operationsFromCsv } from "../src/lib/crypto-tax.ts";

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const canvasRows: LocalRecord[] = [{
  id: "safe-csv-1",
  date: "2026-01-03",
  value: -120.5,
  category: "=HYPERLINK(\"https://example.invalid\")",
  platform: "+SUM(1,1)",
  geography: "@SUM(A1:A2)",
  status: "-texto-no-numerico",
  raw: {},
}];
const canvasCsv = csvFromRecords(canvasRows);
expect(canvasCsv.includes("\"\t=HYPERLINK"), "La exportación Canvas debe forzar a texto una celda que comienza con =.");
expect(canvasCsv.includes("\"\t+SUM"), "La exportación Canvas debe forzar a texto una celda que comienza con +.");
expect(canvasCsv.includes("\"\t@SUM"), "La exportación Canvas debe forzar a texto una celda que comienza con @.");
expect(canvasCsv.includes("\"\t-texto-no-numerico"), "La exportación Canvas debe forzar a texto un valor textual que comienza con -.");
expect(canvasCsv.includes("\"-120.5\""), "Los importes numéricos negativos deben conservarse como números en CSV.");

const cryptoForCsv = operationsFromCsv([
  "Fecha,Tipo,Activo entregado,Cantidad entregada,Valor EUR entregado",
  "2026-01-01,Compra,=BTC,1,100",
  "2026-02-01,Venta,=BTC,1,150",
].join("\n"));
const cryptoCsv = cryptoDraftCsv(calculateCryptoTax(cryptoForCsv.operations), "2026");
expect(cryptoCsv.includes("\"\t=BTC\""), "El borrador cripto debe forzar a texto activos que comienzan con =.");

const invalidDate = operationsFromCsv([
  "Fecha,Tipo,Activo entregado,Cantidad entregada,Valor EUR entregado",
  "2026-99-99,Compra,BTC,1,100",
].join("\n"));
const invalidResult = calculateCryptoTax(invalidDate.operations);
expect(!normalizeCryptoIsoDate("2026-99-99"), "Una fecha con mes imposible debe rechazarse.");
expect(!normalizeCryptoIsoDate("2026-02-30"), "Una fecha con día imposible debe rechazarse.");
expect(normalizeCryptoIsoDate("2024-02-29") === "2024-02-29", "Un día bisiesto real debe aceptarse.");
expect(invalidDate.operations[0]?.warnings.some((warning) => warning.includes("día real del calendario")), "La operación debe registrar un aviso de fecha de calendario imposible.");
expect(invalidResult.summary.unsupportedRows === 1, "La fila con fecha imposible debe contarse como no soportada.");
expect(invalidResult.holdings.length === 0, "Una compra con fecha imposible no debe crear una tenencia FIFO.");

console.log(JSON.stringify({ status: "ok", csvFormulaPrefixesNeutralized: true, impossibleDatesBlocked: true }));
