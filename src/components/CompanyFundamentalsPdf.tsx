import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { CompanyFundamentalMetric, CompanyFundamentalsAnalysis } from "@/lib/company-fundamentals";

const styles = StyleSheet.create({
  page: { padding: 38, color: "#1b2d48", fontFamily: "Helvetica", fontSize: 9 },
  header: { borderBottomWidth: 2, borderBottomColor: "#2d6cdf", marginBottom: 16, paddingBottom: 12 },
  eyebrow: { color: "#2d6cdf", fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 1.2, marginBottom: 5 },
  title: { fontFamily: "Helvetica-Bold", fontSize: 22, marginBottom: 5 },
  subtitle: { color: "#687993", fontSize: 9, lineHeight: 1.4 },
  context: { backgroundColor: "#f4f7fc", flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16, padding: 10 },
  contextItem: { minWidth: 120, flexGrow: 1 },
  label: { color: "#687993", fontSize: 7, marginBottom: 3 },
  value: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  section: { marginBottom: 14 },
  sectionTitle: { color: "#234a7c", fontFamily: "Helvetica-Bold", fontSize: 12, marginBottom: 7 },
  row: { borderBottomWidth: 1, borderBottomColor: "#e5ebf3", flexDirection: "row", paddingVertical: 6 },
  metric: { width: "32%" },
  formula: { color: "#687993", width: "48%" },
  metricValue: { fontFamily: "Helvetica-Bold", textAlign: "right", width: "20%" },
  signal: { backgroundColor: "#f5f9ff", borderLeftWidth: 3, borderLeftColor: "#2d6cdf", marginBottom: 6, padding: 8 },
  signalTitle: { fontFamily: "Helvetica-Bold", marginBottom: 3 },
  signalText: { color: "#52627a", lineHeight: 1.4 },
  opportunity: { backgroundColor: "#f8fbff", borderWidth: 1, borderColor: "#c9def8", marginBottom: 12, padding: 10 },
  warning: { color: "#805b20", fontSize: 8, lineHeight: 1.4, marginBottom: 4 },
  footnote: { borderTopWidth: 1, borderTopColor: "#dce5f0", color: "#71809a", fontSize: 7.5, lineHeight: 1.4, marginTop: 8, paddingTop: 9 },
});

function formatMetric(metric: CompanyFundamentalMetric, currency: string) {
  if (metric.value === null) return "—";
  if (metric.unit === "percent") return `${metric.value.toLocaleString("es-ES", { maximumFractionDigits: 2 })} %`;
  if (metric.unit === "ratio") return `${metric.value.toLocaleString("es-ES", { maximumFractionDigits: 2 })}×`;
  if (metric.unit === "per_share") return `${metric.value.toLocaleString("es-ES", { maximumFractionDigits: 4 })} ${currency}/acción`;
  return `${metric.value.toLocaleString("es-ES", { maximumFractionDigits: 0 })} ${currency}`;
}

export function CompanyFundamentalsPdf({ analysis }: { analysis: CompanyFundamentalsAnalysis }) {
  return <Document title={`Salud financiera · ${analysis.companyName}`} author="Portafolio Intel" subject="Informe explicable de ratios financieros">
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>PORTAFOLIO INTEL · INFORME EXPLICABLE</Text>
        <Text style={styles.title}>Salud financiera y rentabilidad</Text>
        <Text style={styles.subtitle}>Informe generado a partir de datos introducidos manualmente. No representa una recomendación de inversión ni una validación independiente de la fuente.</Text>
      </View>
      <View style={styles.context}>
        <View style={styles.contextItem}><Text style={styles.label}>Empresa</Text><Text style={styles.value}>{analysis.companyName}</Text></View>
        <View style={styles.contextItem}><Text style={styles.label}>Fecha de referencia</Text><Text style={styles.value}>{analysis.asOf || "No indicada"}</Text></View>
        <View style={styles.contextItem}><Text style={styles.label}>Divisa</Text><Text style={styles.value}>{analysis.currency}</Text></View>
        <View style={styles.contextItem}><Text style={styles.label}>Cobertura</Text><Text style={styles.value}>{analysis.coveragePct.toLocaleString("es-ES", { maximumFractionDigits: 1 })} %</Text></View>
        <View style={styles.contextItem}><Text style={styles.label}>Fuente declarada</Text><Text style={styles.value}>{analysis.sourceLabel}</Text></View>
      </View>

      {(["Valoración", "Rentabilidad", "Márgenes", "Solvencia", "Caja"] as const).map((category) => <View key={category} style={styles.section}>
        <Text style={styles.sectionTitle}>{category}</Text>
        {analysis.metrics.filter((metric) => metric.category === category).map((metric) => <View key={metric.key} style={styles.row}>
          <Text style={styles.metric}>{metric.label} · {metric.status === "available" ? "Calculable" : metric.status === "missing" ? "Falta información" : "No significativo"}</Text>
          <Text style={styles.formula}>{metric.formula}</Text>
          <Text style={styles.metricValue}>{formatMetric(metric, analysis.currency)}</Text>
        </View>)}
      </View>)}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Oportunidad a revisar</Text>
        <View style={styles.opportunity}>
          <Text style={styles.signalTitle}>{analysis.opportunity.title}</Text>
          <Text style={styles.signalText}>{analysis.opportunity.detail}</Text>
          {analysis.opportunity.evidence.map((evidence) => <Text key={evidence.label} style={styles.signalText}>• {evidence.label}: {evidence.passed === null ? "no calculable" : evidence.passed ? "cumple" : "no cumple"} ({evidence.condition})</Text>)}
        </View>
      </View>

      {analysis.healthSignals.length > 0 && <View style={styles.section}>
        <Text style={styles.sectionTitle}>Señales de salud financiera</Text>
        {analysis.healthSignals.map((signal) => <View key={`${signal.title}-${signal.detail}`} style={styles.signal}><Text style={styles.signalTitle}>{signal.title}</Text><Text style={styles.signalText}>{signal.detail}</Text></View>)}
      </View>}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Advertencias y límites</Text>
        {analysis.warnings.map((warning) => <Text key={warning} style={styles.warning}>• {warning}</Text>)}
      </View>
      <Text style={styles.footnote}>{analysis.opportunity.disclaimer} Las fórmulas derivan del material proporcionado por la persona usuaria y deben contrastarse con estados financieros, notas, período fiscal y fuentes actualizadas.</Text>
    </Page>
  </Document>;
}
