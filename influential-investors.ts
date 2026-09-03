export type InfluentialInvestor = {
  name: string;
  firm: string;
  philosophy: string;
  milestone: string;
  whyFollow: string;
  disclosureLabel: string;
  disclosureUrl: string;
  portfolioVisualizationLabel: string;
  portfolioVisualizationUrl: string;
  disclosureCaveat: string;
};

export const INFLUENTIAL_INVESTORS: InfluentialInvestor[] = [
  {
    name: "Warren Buffett",
    firm: "Berkshire Hathaway",
    philosophy: "Value investing y calidad empresarial a largo plazo.",
    milestone: "La cifra histórica de retorno citada por la persona usuaria debe contrastarse en cartas y reportes anuales; no se recalcula dentro de la aplicación.",
    whyFollow: "Sus cartas a accionistas explican asignación de capital, disciplina de valoración y el papel de la liquidez.",
    disclosureLabel: "Cartas a accionistas de Berkshire",
    disclosureUrl: "https://www.berkshirehathaway.com/letters/letters.html",
    portfolioVisualizationLabel: "Informes anuales de Berkshire",
    portfolioVisualizationUrl: "https://www.berkshirehathaway.com/reports.html",
    disclosureCaveat: "Las posiciones informadas no equivalen a una cartera modelo ni reflejan necesariamente compras o ventas posteriores.",
  },
  {
    name: "Jim Simons",
    firm: "Renaissance Technologies",
    philosophy: "Trading cuantitativo y modelos matemáticos.",
    milestone: "El rendimiento histórico citado por la persona usuaria pertenece al Medallion Fund y no se utiliza como pronóstico ni puede replicarse a partir de divulgaciones públicas.",
    whyFollow: "Sirve para estudiar investigación cuantitativa, disciplina de datos y límites de inferir una estrategia desde posiciones divulgadas.",
    disclosureLabel: "Divulgaciones SEC de Renaissance Technologies",
    disclosureUrl: "https://www.sec.gov/edgar/browse/?CIK=1037389&owner=exclude",
    portfolioVisualizationLabel: "Búsqueda SEC de la firma",
    portfolioVisualizationUrl: "https://www.sec.gov/edgar/browse/?CIK=1037389&owner=exclude",
    disclosureCaveat: "Los formularios 13F tienen retraso, alcance limitado y no muestran la estrategia completa, derivados, efectivo o posiciones cortas en todos los casos.",
  },
  {
    name: "Michael Burry",
    firm: "Scion Asset Management",
    philosophy: "Inversión contraria y value táctico.",
    milestone: "Es conocido por su tesis sobre crédito hipotecario antes de la crisis de 2008; ese hecho histórico no valida ni anticipa ideas posteriores.",
    whyFollow: "Ilustra el análisis independiente de riesgos, balance y escenarios adversos.",
    disclosureLabel: "Formulario 13F de Scion en SEC",
    disclosureUrl: "https://www.sec.gov/Archives/edgar/data/1649339/000164933925000007/xslForm13F_X02/primary_doc.xml",
    portfolioVisualizationLabel: "Búsqueda SEC de Scion",
    portfolioVisualizationUrl: "https://www.sec.gov/edgar/browse/?CIK=1649339&owner=exclude",
    disclosureCaveat: "La SEC advierte que no debe asumirse que la información de un 13F sea exacta o completa; una divulgación no es una señal operativa.",
  },
  {
    name: "Stanley Druckenmiller",
    firm: "Duquesne Family Office",
    philosophy: "Macro global y tendencias de liquidez.",
    milestone: "La cifra de rendimiento citada por la persona usuaria no se verifica ni se usa como comparador de rendimiento futuro en la aplicación.",
    whyFollow: "Ayuda a estudiar la relación entre ciclos macroeconómicos, riesgo y tamaño de posición, sin extrapolar una cartera divulgada.",
    disclosureLabel: "Formulario 13F de Duquesne en SEC",
    disclosureUrl: "https://www.sec.gov/Archives/edgar/data/1536411/000153641124000007/xslForm13F_X02/primary_doc.xml",
    portfolioVisualizationLabel: "Búsqueda SEC de Duquesne",
    portfolioVisualizationUrl: "https://www.sec.gov/edgar/browse/?CIK=1536411&owner=exclude",
    disclosureCaveat: "Los 13F solo cubren determinados valores estadounidenses reportables y pueden diferir sustancialmente de la exposición económica total.",
  },
  {
    name: "Terry Smith",
    firm: "Fundsmith",
    philosophy: "Quality growth: negocios resistentes, alto retorno sobre capital y horizonte de largo plazo.",
    milestone: "El fondo publica una hoja informativa con rendimiento, riesgo, composición y metodología; los resultados pasados no constituyen una predicción.",
    whyFollow: "Su documentación explica criterios de calidad, concentración y costes de manera contrastable.",
    disclosureLabel: "Ficha oficial de Fundsmith Equity Fund",
    disclosureUrl: "https://www.fundsmith.co.uk/factsheet/",
    portfolioVisualizationLabel: "Gráfico y composición publicados por Fundsmith",
    portfolioVisualizationUrl: "https://www.fundsmith.co.uk/factsheet/",
    disclosureCaveat: "La ficha publica datos de un fondo y una fecha concreta; la composición, precios, rendimiento y riesgos cambian con el tiempo.",
  },
];
