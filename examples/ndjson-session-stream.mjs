// Parser NDJSON incremental para sesiones locales muy grandes.
// Cada línea debe ser un objeto JSON independiente: cabecera, fila o cierre.
// Diseñado para navegador moderno con File.stream(), ReadableStream y TextDecoder.

export const MAX_LOCAL_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_CANVAS_ROWS = 100_000;
export const MAX_NDJSON_LINE_CHARS = 1_000_000;
export const NDJSON_FORMAT = "portafolio-intel-local-canvas-ndjson";
export const NDJSON_VERSION = 1;

const editableFields = ["date", "value", "category", "platform", "geography", "status"];
const filterFields = ["from", "to", "category", "platform", "geography"];

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeDate(value) {
  const text = cleanText(value);
  const iso = text.match(/^(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?$/);
  const european = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  const parts = iso
    ? { year: iso[1], month: iso[2], day: iso[3] ?? "01" }
    : european ? { year: european[3], month: european[2], day: european[1] } : null;
  if (!parts) return "";

  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return "";
  return `${parts.year.padStart(4, "0")}-${parts.month.padStart(2, "0")}-${parts.day.padStart(2, "0")}`;
}

function parseNumber(value) {
  const text = cleanText(value);
  if (!/^[+-]?(?:\d{1,3}(?:[.\s]\d{3})*|\d+)(?:[,.]\d+)?$/.test(text)) return null;
  const normalized = text.replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function validateCell(field, value) {
  const text = cleanText(value);
  if (field === "date") return normalizeDate(text) ? "" : "La fecha debe ser ISO/europea y existir en el calendario.";
  if (field === "value") return parseNumber(text) === null ? "El valor debe ser un número finito." : "";
  if (text.length > 160) return "El texto supera 160 caracteres.";
  return /[\u0000-\u001F\u007F]/.test(text) ? "El texto contiene caracteres de control." : "";
}

function normalizeHeader(record) {
  if (!isObject(record) || record.kind !== "session-header" || record.format !== NDJSON_FORMAT || record.version !== NDJSON_VERSION) {
    throw new Error("La primera línea debe ser una cabecera NDJSON compatible.");
  }
  if (!Array.isArray(record.headers) || !isObject(record.mapping) || !isObject(record.filters)) {
    throw new Error("La cabecera NDJSON no contiene headers, mapping y filters válidos.");
  }

  const headers = record.headers.map(cleanText).filter(Boolean);
  if (headers.length < 2 || headers.length !== new Set(headers).size) {
    throw new Error("Los encabezados deben ser únicos y contener al menos dos columnas.");
  }

  const mapping = Object.fromEntries(editableFields.map((field) => {
    const candidate = record.mapping[field];
    return [field, typeof candidate === "string" && headers.includes(candidate) ? candidate : ""];
  }));
  const filters = Object.fromEntries(filterFields.map((field) => [field, typeof record.filters[field] === "string" ? cleanText(record.filters[field]) : ""]));

  return { headers, mapping, filters, savedAt: typeof record.savedAt === "string" ? record.savedAt : "" };
}

function normalizeRow(record, header, rowNumber) {
  if (!isObject(record) || record.kind !== "row" || !isObject(record.data)) {
    throw new Error(`La línea de fila ${rowNumber} no tiene la forma { kind: \"row\", data: {...} }.`);
  }

  const raw = Object.fromEntries(header.headers.map((name) => [name, cleanText(record.data[name])]));
  for (const field of editableFields) {
    const name = header.mapping[field];
    if (!name) continue;
    const error = validateCell(field, raw[name]);
    if (error) throw new Error(`Fila ${rowNumber}: ${field} inválido. ${error}`);
  }
  return raw;
}

/**
 * Convierte un ReadableStream<Uint8Array> en líneas de texto sin cargar el archivo completo.
 */
export async function* linesFromStream(stream, { maxLineChars = MAX_NDJSON_LINE_CHARS } = {}) {
  if (!Number.isInteger(maxLineChars) || maxLineChars < 1) throw new Error("maxLineChars debe ser un entero positivo.");
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let pending = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });
      const lines = pending.split(/\r?\n/);
      pending = lines.pop() ?? "";
      if (pending.length > maxLineChars) throw new Error(`Una línea NDJSON supera el límite de ${maxLineChars} caracteres.`);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) yield trimmed;
      }
    }

    pending += decoder.decode();
    const finalLine = pending.trim();
    if (finalLine) yield finalLine;
  } finally {
    reader.releaseLock();
  }
}

/**
 * Valida y emite eventos NDJSON, uno a uno. No guarda las filas ya emitidas.
 * El límite de tamaño se comprueba antes de abrir el stream.
 */
export async function* parseNdjsonSession(file, {
  maxFileBytes = MAX_LOCAL_FILE_BYTES,
  maxRows = MAX_CANVAS_ROWS,
  maxLineChars = MAX_NDJSON_LINE_CHARS,
} = {}) {
  if (!file || typeof file.size !== "number" || typeof file.stream !== "function") {
    throw new Error("Se requiere un objeto File o Blob con size y stream().");
  }
  if (file.size > maxFileBytes) {
    throw new Error(`El archivo supera el límite de ${maxFileBytes} bytes.`);
  }

  let header = null;
  let rows = 0;
  let lineNumber = 0;
  let sawEnd = false;

  for await (const line of linesFromStream(file.stream(), { maxLineChars })) {
    lineNumber += 1;
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      throw new Error(`La línea ${lineNumber} no contiene JSON válido.`);
    }

    if (!header) {
      header = normalizeHeader(record);
      yield { type: "header", header };
      continue;
    }

    if (record?.kind === "end") {
      if (sawEnd) throw new Error("El archivo NDJSON contiene más de una línea de cierre.");
      if (!Number.isInteger(record.rows) || record.rows !== rows) {
        throw new Error(`El cierre NDJSON declara ${record.rows} filas, pero se recibieron ${rows}.`);
      }
      sawEnd = true;
      yield { type: "end", rows };
      continue;
    }

    if (sawEnd) throw new Error("No se permiten filas después del cierre NDJSON.");
    rows += 1;
    if (rows > maxRows) throw new Error(`El archivo supera el límite de ${maxRows} filas.`);
    yield { type: "row", row: normalizeRow(record, header, rows), rowNumber: rows };
  }

  if (!header) throw new Error("El archivo NDJSON está vacío o no contiene cabecera.");
  if (!sawEnd) throw new Error("Falta la línea de cierre { kind: \"end\", rows: N }.");
}

/**
 * Consumidor por lotes: mantiene solo un lote pequeño en RAM.
 * onBatch puede enviar los datos a un Worker, IndexedDB, OPFS o un backend explícitamente consentido.
 */
export async function importNdjsonInBatches(file, {
  batchSize = 500,
  maxFileBytes = MAX_LOCAL_FILE_BYTES,
  maxRows = MAX_CANVAS_ROWS,
  maxLineChars = MAX_NDJSON_LINE_CHARS,
  onHeader = async () => {},
  onBatch = async () => {},
  onComplete = async () => {},
} = {}) {
  if (!Number.isInteger(batchSize) || batchSize < 1) throw new Error("batchSize debe ser un entero positivo.");

  let batch = [];
  let header;
  let rows = 0;

  for await (const event of parseNdjsonSession(file, { maxFileBytes, maxRows, maxLineChars })) {
    if (event.type === "header") {
      header = event.header;
      await onHeader(header);
      continue;
    }
    if (event.type === "row") {
      batch.push(event.row);
      rows += 1;
      if (batch.length === batchSize) {
        await onBatch(batch, header);
        batch = []; // Libera la referencia del lote ya consumido.
      }
      continue;
    }
    if (event.type === "end" && batch.length) {
      await onBatch(batch, header);
      batch = [];
    }
  }

  await onComplete({ header, rows });
  return { header, rows };
}
