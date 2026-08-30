/// <reference lib="webworker" />

import { analyzeRecords, CanvasFilters, LocalRecord } from "@/lib/local-analytics";

type AnalyzeMessage = { type: "analyze"; requestId: number; records: LocalRecord[]; filters: CanvasFilters };

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (event: MessageEvent<AnalyzeMessage>) => {
  if (event.data.type !== "analyze") return;
  try {
    self.postMessage({ type: "result", requestId: event.data.requestId, analysis: analyzeRecords(event.data.records, event.data.filters) });
  } catch (error) {
    self.postMessage({ type: "error", requestId: event.data.requestId, message: error instanceof Error ? error.message : "No se pudo analizar el conjunto local." });
  }
};

export {};
