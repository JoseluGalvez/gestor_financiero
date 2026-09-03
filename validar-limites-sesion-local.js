// Ejemplo educativo: validar un respaldo JSON local antes de restaurarlo.
// No modifica el estado de la interfaz; devuelve una sesión normalizada o lanza Error.

const MAX_LOCAL_FILE_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_CANVAS_ROWS = 100_000;
const SESSION_FORMAT = "portafolio-intel-local-canvas";
const SESSION_VERSION = 1;

const editableFields = ["date", "value", "category", "platform", "geography", "status"];
const filterFields = ["from", "to", "category", "platform", "geography"];

function isPlainObject(value) {
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
    : european
      ? { year: european[3], month: european[2], day: european[1] }
      : null;

  if (!parts) return "";

  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));

  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day
  ) {
    return "";
  }

  return `${parts.year.padStart(4, "0")}-${parts.month.padStart(2, "0")}-${parts.day.padStart(2, "0")}`;
}

function parseSpanishNumber(value) {
  const normalized = cleanText(value)
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");

  // El patrón evita aceptar texto libre como "abc" o notación exponencial.
  if (!/^[+-]?(?:\d{1,3}(?:\.\d{3})*|\d+)(?:[,.]\d+)?$/.test(cleanText(value))) {
    return null;
  }

  const result = Number(normalized);
  return Number.isFinite(result) ? result : null;
}

function validateMappedCell(field, value) {
  const text = cleanText(value);

  if (field === "date") {
    if (!text) return "La fecha no puede estar vacía.";
    return normalizeDate(text) ? "" : "Usa YYYY-MM-DD o DD/MM/AAAA con una fecha existente.";
  }

  if (field === "value") {
    if (!text) return "El importe no puede estar vacío.";
    return parseSpanishNumber(text) === null ? "El importe debe ser un número finito válido." : "";
  }

  if (text.length > 160) return "El texto no puede superar 160 caracteres.";
  if (/[\u0000-\u001F\u007F]/.test(text)) return "El texto contiene caracteres de control no permitidos.";
  return "";
}

function validatePayload(payload) {
  if (!isPlainObject(payload) || payload.format !== SESSION_FORMAT || payload.version !== SESSION_VERSION) {
    throw new Error("El archivo no es un estado local compatible.");
  }

  if (!Array.isArray(payload.headers) || !Array.isArray(payload.rows) || !isPlainObject(payload.mapping) || !isPlainObject(payload.filters)) {
    throw new Error("El estado no tiene el esquema esperado.");
  }

  const headers = payload.headers.map(cleanText).filter(Boolean);
  if (headers.length < 2 || headers.length !== new Set(headers).size) {
    throw new Error("Los encabezados deben ser únicos, no vacíos y contener al menos dos columnas.");
  }

  // Esta comprobación ocurre ANTES de crear objetos de filas normalizadas o registros analíticos.
  if (payload.rows.length > MAX_CANVAS_ROWS) {
    throw new Error(`El estado contiene ${payload.rows.length} filas; el límite local es ${MAX_CANVAS_ROWS}.`);
  }

  const mapping = Object.fromEntries(
    editableFields.map((field) => {
      const candidate = payload.mapping[field];
      return [field, typeof candidate === "string" && headers.includes(candidate) ? candidate : ""];
    }),
  );

  const filters = Object.fromEntries(
    filterFields.map((field) => [field, typeof payload.filters[field] === "string" ? cleanText(payload.filters[field]) : ""]),
  );

  const rows = payload.rows.map((row, index) => {
    if (!isPlainObject(row)) throw new Error(`La fila ${index + 1} no es un objeto válido.`);

    // Solo aquí se crea la copia normalizada de la fila.
    const raw = Object.fromEntries(headers.map((header) => [header, cleanText(row[header])]));

    for (const field of editableFields) {
      const header = mapping[field];
      if (!header) continue;
      const error = validateMappedCell(field, raw[header]);
      if (error) throw new Error(`La fila ${index + 1} contiene un ${field} inválido: ${error}`);
    }

    return raw;
  });

  return { format: SESSION_FORMAT, version: SESSION_VERSION, headers, mapping, filters, rows };
}

export async function validateLocalSessionFile(file) {
  if (!(file instanceof File)) throw new Error("Selecciona un archivo local.");

  // Única comprobación posible antes de leer el contenido completo.
  if (file.size > MAX_LOCAL_FILE_BYTES) {
    throw new Error("El archivo supera el límite local de 15 MB.");
  }

  let payload;
  try {
    payload = JSON.parse(await file.text());
  } catch {
    throw new Error("El archivo no contiene JSON válido.");
  }

  return validatePayload(payload);
}

// Uso en una interfaz: no actualices React/Vue/Svelte hasta que esta promesa resuelva.
async function handleSelectedFile(file, restoreSession) {
  try {
    const session = await validateLocalSessionFile(file);
    restoreSession(session); // Este es el ÚNICO punto donde debería mutar el estado de la aplicación.
  } catch (error) {
    console.error(error instanceof Error ? error.message : "No se pudo validar la sesión.");
    // El estado ya abierto sigue intacto porque restoreSession no se llamó.
  }
}

export { handleSelectedFile };
