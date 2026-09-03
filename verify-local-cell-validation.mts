import { normalizeLocalDate, validateLocalCell } from "../src/lib/local-analytics.ts";

function expectEqual(actual: string, expected: string, label: string) {
  if (actual !== expected) throw new Error(`${label}: esperado ${JSON.stringify(expected)}, recibido ${JSON.stringify(actual)}`);
}

expectEqual(normalizeLocalDate("2026-08-26"), "2026-08-26", "La fecha ISO debe preservarse");
expectEqual(normalizeLocalDate("26/08/2026"), "2026-08-26", "La fecha europea debe normalizarse");
expectEqual(normalizeLocalDate("99/99/2026"), "", "Una fecha imposible debe rechazarse");
expectEqual(normalizeLocalDate("2026-02-31"), "", "Un día imposible debe rechazarse");

expectEqual(validateLocalCell("value", "204,20"), "", "Un importe europeo válido debe aceptarse");
expectEqual(validateLocalCell("value", "1.234,50"), "", "Un importe con separador de miles debe aceptarse");
if (!validateLocalCell("date", "")) throw new Error("Una fecha vacía no debe alterar la serie temporal mientras se edita.");
if (!validateLocalCell("value", "abc")) throw new Error("Un importe no numérico debe rechazarse.");
if (!validateLocalCell("value", "")) throw new Error("Un importe vacío no debe alterar el estado analítico.");
if (!validateLocalCell("category", "x".repeat(161))) throw new Error("El texto demasiado largo debe rechazarse.");
if (!validateLocalCell("platform", "A\u0000B")) throw new Error("Los caracteres de control deben rechazarse.");

console.log(JSON.stringify({ status: "ok", localDateValidation: true, localNumericValidation: true, localTextValidation: true }));
