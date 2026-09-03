import { describe, expect, jest, test } from "@jest/globals";
import { Blob } from "node:buffer";
import {
  importNdjsonInBatches,
  parseNdjsonSession,
} from "./ndjson-session-stream.mjs";

const header = {
  kind: "session-header",
  format: "portafolio-intel-local-canvas-ndjson",
  version: 1,
  savedAt: "2026-08-26T08:00:00.000Z",
  headers: ["Fecha", "Precio", "Instrumento"],
  mapping: {
    date: "Fecha",
    value: "Precio",
    category: "Instrumento",
    platform: "",
    geography: "",
    status: "",
  },
  filters: { from: "", to: "", category: "", platform: "", geography: "" },
};

function row(index) {
  return {
    kind: "row",
    data: {
      Fecha: `2026-01-${String(index + 1).padStart(2, "0")}`,
      Precio: String(index + 1),
      Instrumento: `Activo ficticio ${index + 1}`,
    },
  };
}

function ndjson(rows) {
  return [header, ...rows, { kind: "end", rows: rows.length }].map((line) => JSON.stringify(line)).join("\n");
}

function fileFromText(text) {
  // El parser solo requiere size y stream(); Blob funciona tanto en Jest con entorno Node como en el navegador.
  return new Blob([text], { type: "application/x-ndjson" });
}

async function collectEvents(file, options) {
  const events = [];
  for await (const event of parseNdjsonSession(file, options)) events.push(event);
  return events;
}

describe("parseNdjsonSession: límites de recursos", () => {
  test("rechaza por tamaño antes de abrir el stream", async () => {
    const stream = jest.fn(() => new Blob([""]).stream());
    const oversizedFile = { size: 16, stream };

    await expect(collectEvents(oversizedFile, { maxFileBytes: 15, maxRows: 100 })).rejects.toThrow("supera el límite");
    expect(stream).not.toHaveBeenCalled();
  });

  test("acepta un archivo exactamente dentro del límite de bytes", async () => {
    const text = ndjson([row(0)]);
    const file = fileFromText(text);

    const events = await collectEvents(file, { maxFileBytes: file.size, maxRows: 1 });

    expect(events.map((event) => event.type)).toEqual(["header", "row", "end"]);
    expect(events.at(-1)).toEqual({ type: "end", rows: 1 });
  });

  test("rechaza la fila que excede maxRows sin crear lotes posteriores", async () => {
    const file = fileFromText(ndjson([row(0), row(1), row(2)]));

    await expect(collectEvents(file, { maxRows: 2 })).rejects.toThrow("supera el límite de 2 filas");
  });

  test("rechaza una línea individual que supera maxLineChars", async () => {
    const file = fileFromText("x".repeat(64));

    await expect(collectEvents(file, { maxLineChars: 32 })).rejects.toThrow("Una línea NDJSON supera el límite de 32 caracteres");
  });

  test("respeta el límite de filas y entrega el último lote incompleto", async () => {
    const file = fileFromText(ndjson([row(0), row(1), row(2)]));
    const batches = [];

    const result = await importNdjsonInBatches(file, {
      batchSize: 2,
      maxRows: 3,
      onBatch: async (batch) => batches.push(batch.map((item) => item.Precio)),
    });

    expect(result.rows).toBe(3);
    expect(batches).toEqual([["1", "2"], ["3"]]);
  });

  test("rechaza el archivo si el cierre declara un número de filas distinto", async () => {
    const text = [header, row(0), { kind: "end", rows: 2 }].map((line) => JSON.stringify(line)).join("\n");
    const file = fileFromText(text);

    await expect(collectEvents(file, { maxRows: 10 })).rejects.toThrow("declara 2 filas, pero se recibieron 1");
  });
});
