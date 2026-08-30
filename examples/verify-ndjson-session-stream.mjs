import { readFile } from "node:fs/promises";
import { Blob } from "node:buffer";
import { importNdjsonInBatches, parseNdjsonSession } from "./ndjson-session-stream.mjs";

const content = await readFile(new URL("./canvas-local-session-ejemplo.ndjson", import.meta.url), "utf8");
const file = new Blob([content], { type: "application/x-ndjson" });
const eventTypes = [];
for await (const event of parseNdjsonSession(file, { maxRows: 6, maxLineChars: 10_000 })) eventTypes.push(event.type);
if (eventTypes.join(",") !== "header,row,row,row,row,row,row,end") throw new Error(`Eventos inesperados: ${eventTypes.join(",")}`);

const batches = [];
const result = await importNdjsonInBatches(new Blob([content]), {
  batchSize: 2,
  maxRows: 6,
  onBatch: async (batch) => batches.push(batch.length),
});
if (result.rows !== 6 || batches.join(",") !== "2,2,2") throw new Error(`Lotes inesperados: filas=${result.rows}; lotes=${batches.join(",")}`);

console.log(JSON.stringify({ status: "ok", events: eventTypes, rows: result.rows, batches }));
