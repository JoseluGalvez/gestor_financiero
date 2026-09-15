import { useMemo, useState } from 'react';
import type { CompanyFundamentalsAnalysis } from './company-fundamentals';
import type { EdgarCompanyFacts } from './sec-edgar-adapter';
import type { HistoryEntry } from './analysis-history';
import {
  buildIntegratedReportHtml,
  REPORT_SECTIONS,
  sectionAvailability,
  type ReportData,
  type ReportSectionId,
} from './report-sections';

interface InformeSectionProps {
  analysis: CompanyFundamentalsAnalysis | null;
  edgarFacts: EdgarCompanyFacts | null;
  history: HistoryEntry[];
  compareAnalyses: CompanyFundamentalsAnalysis[];
}

const GROUP_ORDER = [
  'Análisis Fundamental',
  'Historial y Comparación',
  'SEC EDGAR',
  'GMT Terminal',
  'Cartera Multi-Plataforma',
  'Comparativa de Plataformas',
] as const;

export default function InformeSection({
  analysis,
  edgarFacts,
  history,
  compareAnalyses,
}: InformeSectionProps) {
  const [selected, setSelected] = useState<Set<ReportSectionId>>(
    () => new Set(REPORT_SECTIONS.map((section) => section.id)),
  );

  const data = useMemo<ReportData>(
    () => ({ analysis, edgarFacts, history, compareAnalyses }),
    [analysis, edgarFacts, history, compareAnalyses],
  );

  const availability = useMemo(
    () => new Map(REPORT_SECTIONS.map((def) => [def.id, sectionAvailability(def, data)])),
    [data],
  );

  const [sectionNotes, setSectionNotes] = useState<Record<ReportSectionId, string>>(
    () => {
      const init: Record<ReportSectionId, string> = {} as Record<ReportSectionId, string>;
      REPORT_SECTIONS.forEach((def) => {
        init[def.id] = def.notes ?? '';
      });
      return init;
    },
  );

  const groups = useMemo(
    () =>
      GROUP_ORDER.map((group) => ({
        group,
        sections: REPORT_SECTIONS.filter((def) => def.group === group),
      })).filter((entry) => entry.sections.length > 0),
    [],
  );

  const selectedCount = selected.size;
  const availableCount = REPORT_SECTIONS.filter(
    (def) => availability.get(def.id)!.available,
  ).length;

  const toggleSection = (id: ReportSectionId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateNote = (id: ReportSectionId, value: string) => {
    setSectionNotes((prev) => ({ ...prev, [id]: value }));
  };

  const selectAll = () => setSelected(new Set(REPORT_SECTIONS.map((def) => def.id)));
  const deselectAll = () => setSelected(new Set());

  const generatePdf = () => {
    const html = buildIntegratedReportHtml([...selected], {
      ...data,
      generatedAt: new Date(),
    });

    const printWindow = window.open('', '_blank', 'width=860,height=640');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  };

  return (
    <div className="informe-view">
      <div className="informe-header">
        <h2>Informe en PDF</h2>
        <p className="informe-subtitle">
          Marca los apartados que quieres incluir en el informe consolidado y pulsa
          <strong> Generar informe PDF</strong>. Por defecto están todos seleccionados; los
          apartados sin datos se omiten e indican su motivo en el documento.
        </p>
      </div>

      <div className="informe-toolbar">
        <div className="informe-toolbar-info">
          <span className="coverage">{selectedCount} / {REPORT_SECTIONS.length} seleccionados</span>
          <span className="informe-availability">{availableCount} apartados con datos disponibles</span>
        </div>
        <div className="informe-toolbar-actions">
          <button className="btn btn-secondary" onClick={selectAll}>Seleccionar todo</button>
          <button className="btn btn-secondary" onClick={deselectAll}>Deseleccionar todo</button>
          <button className="btn btn-primary" onClick={generatePdf} disabled={selectedCount === 0}>
            Generar informe PDF
          </button>
        </div>
      </div>

      {groups.map(({ group, sections }) => (
        <fieldset key={group} className="checklist-group">
          <legend>{group}</legend>
          {sections.map((def) => {
            const isChecked = selected.has(def.id);
            const status = availability.get(def.id)!;
            const note = sectionNotes[def.id] || '';
            return (
              <label key={def.id} className={`checklist-item ${isChecked ? 'is-selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleSection(def.id)}
                />
                <span className="checklist-item-text">
                  <strong>{def.title}</strong>
                  <span className="checklist-item-desc">{def.description}</span>
                </span>
                <span className={`check-badge ${status.available ? 'check-ok' : 'check-missing'}`}>
                  {status.available ? 'Con datos' : 'Sin datos'}
                </span>
                <textarea
                  className="section-notes-textarea"
                  placeholder="Escribe tus ideas, planes, notas o tareas aquí..."
                  value={note}
                  onChange={(e) => updateNote(def.id, e.target.value)}
                  rows={3}
                />
              </label>
            );
          })}
        </fieldset>
      ))}

      <div className="informe-actions">
        <button className="btn btn-primary" onClick={generatePdf} disabled={selectedCount === 0}>
          Generar informe PDF
        </button>
        <p className="informe-note">
          El PDF se genera abriendo una ventana de impresión con el contenido seleccionado;
          elige «Guardar como PDF» en el diálogo.
        </p>
      </div>
    </div>
  );
}