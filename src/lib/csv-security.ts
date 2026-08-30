/**
 * Protege CSV destinados a apertura humana en Excel, LibreOffice y hojas similares.
 * Los números finitos se preservan como números; el texto que puede interpretarse como
 * fórmula se fuerza a texto con una tabulación dentro de la celda entrecomillada.
 * No debe reutilizarse para formatos de reimportación automática: esos formatos deben
 * usar un contrato de datos separado y no abrirse como hoja de cálculo.
 */
const SPREADSHEET_FORMULA_PREFIX = /^[\uFEFF\s]*[=+\-@＝＋－＠]/u;

export function escapeSpreadsheetCell(value: string | number | null | undefined) {
  const source = String(value ?? "");
  const safe = typeof value === "string" && SPREADSHEET_FORMULA_PREFIX.test(source)
    ? `\t${source}`
    : source;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function csvFromRows(rows: ReadonlyArray<ReadonlyArray<string | number | null | undefined>>) {
  return rows.map((row) => row.map(escapeSpreadsheetCell).join(",")).join("\n");
}
