export interface Plataforma {
  nombre: string;
  simbolo: string;
  sorting: boolean;
  filtering: boolean;
  pagination: boolean;
  exportCSV: boolean;
  graficos: boolean;
  rendimiento: number;
}

export interface FuncionalidadItem {
  nombre: string;
  descripcion: string;
  plataforma: string;
  estatus: 'disponible' | 'faltante' | 'pending';
  impacto: 'alto' | 'medio' | 'bajo';
}

export const plataformas: Plataforma[] = [
  {
    nombre: 'P2P / Crowdlending',
    simbolo: '📊',
    sorting: true,
    filtering: true,
    pagination: true,
    exportCSV: true,
    graficos: true,
    rendimiento: 85,
  },
  {
    nombre: 'Renta Variable / Fondos',
    simbolo: '📈',
    sorting: true,
    filtering: true,
    pagination: false,
    exportCSV: true,
    graficos: true,
    rendimiento: 72,
  },
  {
    nombre: 'Tax Tracker',
    simbolo: '💼',
    sorting: true,
    filtering: true,
    pagination: true,
    exportCSV: true,
    graficos: false,
    rendimiento: 90,
  },
  {
    nombre: 'Rebalanceo',
    simbolo: '⚖️',
    sorting: false,
    filtering: false,
    pagination: false,
    exportCSV: false,
    graficos: false,
    rendimiento: 45,
  },
  {
    nombre: 'Multi-divisa',
    simbolo: '💱',
    sorting: true,
    filtering: true,
    pagination: true,
    exportCSV: true,
    graficos: true,
    rendimiento: 80,
  },
];

export const funcionalidadesFaltantes: FuncionalidadItem[] = [
  { nombre: 'Ordenamiento avanzado', descripcion: 'Sorting por múltiples columnas', plataforma: 'Renta Variable', estatus: 'faltante', impacto: 'medio' },
  { nombre: 'Paginación inteligente', descripcion: 'Paginación virtual para grandes datasets', plataforma: 'Tax Tracker', estatus: 'faltante', impacto: 'alto' },
  { nombre: 'Filtros combinados', descripcion: 'Filtros múltiples combinados (estado+país+riesgo)', plataforma: 'P2P', estatus: 'disponible', impacto: 'alto' },
  { nombre: 'Export CSV masiva', descripcion: 'Exportar todos los datos visibles a CSV', plataforma: 'Multi-divisa', estatus: 'disponible', impacto: 'alto' },
  { nombre: 'Gráficos Recharts interactivos', descripcion: 'Barras, áreas y donuts con tooltips', plataforma: 'Rebalanceo', estatus: 'faltante', impacto: 'alto' },
  { nombre: 'Heatmap calendario', descripcion: 'Visualización tipo GitHub de dividendos', plataforma: 'Calendar', estatus: 'pending', impacto: 'medio' },
  { nombre: 'Sparklines en tiempo real', descripcion: 'Gráficos de tendencia en tiempo real', plataforma: 'P2P', estatus: 'pending', impacto: 'medio' },
  { nombre: 'Badges semánticos', descripcion: 'Indicadores visuales por estado/riesgo', plataforma: 'Tax Tracker', estatus: 'disponible', impacto: 'bajo' },
];
