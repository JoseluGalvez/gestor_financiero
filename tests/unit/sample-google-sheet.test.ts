import { describe, expect, it } from "vitest";
import { buildSampleGoogleSheetsPreview, SAMPLE_GOOGLE_SHEET } from "../../src/lib/sample-google-sheet";

const validMapping = {
  date: "Fecha",
  instrument: "Instrumento",
  type: "Tipo",
  quantity: "Cantidad",
  price: "Precio",
  currency: "Divisa",
};

describe("previsualización de Google Sheets", () => {
  it("acepta el mapeo explícito de las seis columnas requeridas", () => {
    const result = buildSampleGoogleSheetsPreview(validMapping);

    expect(result.missingHeaders).toEqual([]);
    expect(result.acceptedRows).toBe(SAMPLE_GOOGLE_SHEET.rows.length);
    expect(result.rejectedRows).toBe(0);
    expect(result.rows[0]).toMatchObject({
      Fecha: "2026-01-03",
      Instrumento: "Fondo Atlas Simulado",
      Tipo: "buy",
      Divisa: "EUR",
    });
  });

  it("rechaza el mapeo antes de previsualizar si falta un encabezado", () => {
    const result = buildSampleGoogleSheetsPreview({ ...validMapping, price: "Precio inexistente" });

    expect(result.missingHeaders).toEqual(["Precio inexistente"]);
    expect(result.rows).toEqual([]);
    expect(result.acceptedRows).toBe(0);
    expect(result.rejectedRows).toBe(SAMPLE_GOOGLE_SHEET.rows.length);
  });
});
