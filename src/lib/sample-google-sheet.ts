export const SAMPLE_GOOGLE_SHEET = {
  spreadsheetId: "1CndN_QiwH6Q2H-rNsML0jAjuuok74IDzG_a8u5A-uWo",
  url: "https://docs.google.com/spreadsheets/d/1CndN_QiwH6Q2H-rNsML0jAjuuok74IDzG_a8u5A-uWo/edit",
  sheetName: "Transacciones ficticias",
  range: "A1:I7",
  headers: ["Fecha", "Instrumento", "Tipo", "Cantidad", "Precio", "Divisa", "ISIN", "Comisiones", "Notas"],
  rows: [
    ["2026-01-03", "Fondo Atlas Simulado", "buy", "12.5", "104.2", "EUR", "DEMO00000001", "1.5", "DATO FICTICIO"],
    ["2026-01-17", "Empresa Boreal Demo", "buy", "8", "57.35", "EUR", "DEMO00000002", "0.8", "DATO FICTICIO"],
    ["2026-02-01", "Fondo Atlas Simulado", "dividend", "0", "1.24", "EUR", "DEMO00000001", "0", "DATO FICTICIO"],
    ["2026-02-12", "Préstamo Cobalto Demo", "interest", "0", "16.75", "EUR", "DEMO00000003", "0", "DATO FICTICIO"],
    ["2026-03-02", "Empresa Boreal Demo", "sell", "3", "61.1", "EUR", "DEMO00000002", "0.5", "DATO FICTICIO"],
    ["2026-03-15", "Efectivo de prueba", "deposit", "0", "500", "EUR", "DEMO00000004", "0", "DATO FICTICIO"],
  ],
} as const;

export type PreviewMapping = {
  date: string;
  instrument: string;
  type: string;
  quantity: string;
  price: string;
  currency: string;
};

export type PreviewResult = {
  missingHeaders: string[];
  rows: Array<Record<string, string>>;
  acceptedRows: number;
  rejectedRows: number;
};

export function buildSampleGoogleSheetsPreview(mapping: PreviewMapping): PreviewResult {
  const requiredHeaders = Object.values(mapping).map((header) => header.trim());
  const missingHeaders = requiredHeaders.filter((header) => !SAMPLE_GOOGLE_SHEET.headers.includes(header as never));
  if (missingHeaders.length > 0) return { missingHeaders, rows: [], acceptedRows: 0, rejectedRows: SAMPLE_GOOGLE_SHEET.rows.length };

  const index = Object.fromEntries(SAMPLE_GOOGLE_SHEET.headers.map((header, position) => [header, position]));
  const rows = SAMPLE_GOOGLE_SHEET.rows.map((row) => ({
    Fecha: row[index[mapping.date]],
    Instrumento: row[index[mapping.instrument]],
    Tipo: row[index[mapping.type]],
    Cantidad: row[index[mapping.quantity]],
    Precio: row[index[mapping.price]],
    Divisa: row[index[mapping.currency]],
  }));
  return { missingHeaders: [], rows, acceptedRows: rows.length, rejectedRows: 0 };
}
