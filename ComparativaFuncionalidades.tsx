import { useState } from 'react';
import {
  BarChart,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Bar,
  LabelList,
  XAxis,
  YAxis,
} from 'recharts';

import {
  funcionalidadesFaltantes,
  plataformas,
  type FuncionalidadItem,
  type Plataforma,
} from './comparativa-data';

export type { FuncionalidadItem, Plataforma } from './comparativa-data';

export default function ComparativaFuncionalidades() {
  const [filtroPlataforma, setFiltroPlataforma] = useState<string | null>(null);

  const plataformasFiltradas = filtroPlataforma
    ? plataformas.filter((p) => p.nombre.includes(filtroPlataforma!))
    : plataformas;

  const funcionalidadesPorPlataforma = plataformasFiltradas.map((p) => {
    const funcs = funcionalidadesFaltantes.filter((f) => f.plataforma === p.nombre);
    return {
      ...p,
      funcsFaltantes: funcs.length,
      funcsDisponibles: funcionalidadesFaltantes.filter(
        (f) => f.plataforma === p.nombre && f.estatus === 'disponible'
      ).length,
      funcsFaltantesCount: funcs.filter((f) => f.estatus === 'faltante').length,
    };
  });

  const rendimientoPromedio = Math.round(
    (plataformas.reduce((sum, p) => sum + p.rendimiento, 0) / plataformas.length + Number.EPSILON) * 100
  ) / 100;

  const mejorPlataforma = plataformas.reduce((prev, actual) =>
    actual.rendimiento > prev.rendimiento ? actual : prev
  );

  const peorPlataforma = plataformas.reduce((prev, actual) =>
    actual.rendimiento < prev.rendimiento ? actual : prev
  );

  return (
    <div className="comparativa-container">
      <div className="comparativa-header">
        <h1>Comparativa de Funcionalidades por Plataforma</h1>
        <p>Análisis de funcionalidades faltantes y rendimiento comparado</p>
        <SelectFiltro plataformas={plataformas} setFiltro={setFiltroPlataforma} />
      </div>

      <div className="comparativa-content">
        <div className="rendimiento-summary">
          <h2>Rendimiento Promedio General: {rendimientoPromedio} / 100</h2>
          <p>Mejor plataforma: {mejorPlataforma.nombre} ({mejorPlataforma.rendimiento} / 100)</p>
          <p>Plataforma con más margen de mejora: {peorPlataforma.nombre} ({peorPlataforma.rendimiento} / 100)</p>
        </div>

        <div className="graficos-render">
          <RenderGraficoRendimiento plataformas={plataformas} />
          <RenderFuncionalidadesTable funcionalidades={funcionalidadesFaltantes} plataformasFiltradas={funcionalidadesPorPlataforma} />
        </div>

        <div className="recomendaciones">
          <h3>Recomendaciones Prioritarias</h3>
          <ul>
            {mejorPlataforma.rendimiento >= 80 && (
              <li>
                <strong>{mejorPlataforma.nombre}:</strong> Rendimiento excelente. Enfocarse en mantener calidad y escalar.
              </li>
            )}
            {peorPlataforma.rendimiento < 60 && (
              <li>
                <strong>{peorPlataforma.nombre}:</strong> Necesita atención inmediata. Priorizar implementación de sorting, filtering y pagination.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

interface SelectFiltroProps {
  plataformas: Plataforma[];
  setFiltro: React.Dispatch<React.SetStateAction<string | null>>;
}

function SelectFiltro({ plataformas, setFiltro }: SelectFiltroProps) {
  const todasOpciones = ['Todas las plataformas', ...plataformas.map((p) => p.nombre)];
  const [seleccionado, setSeleccionado] = useState('Todas las plataformas');

  return (
    <div className="filtro-selector">
      <label className="filtro-label">Filtrar por plataforma:</label>
      <select
        value={seleccionado}
        onChange={(e) => {
          setSeleccionado(e.target.value);
          setFiltro(e.target.value === 'Todas las plataformas' ? null : e.target.value);
        }}
      >
        {todasOpciones.map((opcion) => (
          <option key={opcion} value={opcion}>
            {opcion}
          </option>
        ))}
      </select>
    </div>
  );
}

interface RenderGraficoRendimientoProps {
  plataformas: Plataforma[];
}

function RenderGraficoRendimiento({ plataformas }: RenderGraficoRendimientoProps) {
  const datosGrafico = plataformas.map((p) => ({
    nombre: p.nombre,
    rendimiento: p.rendimiento,
  }));

  return (
    <div className="grafico-rendimiento">
      <h3>Rendimiento por Plataforma</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={datosGrafico} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Bar dataKey="rendimiento" fill="#8884d8">
            <LabelList dataKey="rendimiento" position="insideEnd" fill="#fff" fontSize={12} offset={10} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface RenderFuncionalidadesTableProps {
  funcionalidades: FuncionalidadItem[];
  plataformasFiltradas: any[];
}

function RenderFuncionalidadesTable({
  funcionalidades,
  plataformasFiltradas,
}: RenderFuncionalidadesTableProps) {
  return (
    <div className="funcionalidades-table">
      <h3>Funcionalidades por Plataforma ({funcionalidades.length} en total)</h3>
      <table>
        <thead>
          <tr>
            <th>Funcionalidad</th>
            <th>Plataforma</th>
            <th>Estatus</th>
            <th>Impacto</th>
          </tr>
        </thead>
        <tbody>
          {funcionalidades.map((func) => {
            const plataforma = plataformasFiltradas.find((p) => p.nombre === func.plataforma);
            const estatusClass =
              func.estatus === 'disponible'
                ? 'estatus-disponible'
                : func.estatus === 'faltante'
                  ? 'estatus-faltante'
                  : 'estatus-pending';
            const impactoClass =
              func.impacto === 'alto'
                ? 'impacto-alto'
                : func.impacto === 'medio'
                  ? 'impacto-medio'
                  : 'impacto-bajo';
            return (
              <tr key={func.nombre}>
                <td>{func.nombre}</td>
                <td>{plataforma ? plataforma.simbolo + ' ' + plataforma.nombre : func.plataforma}</td>
                <td className={`status-badge ${estatusClass}`}>{func.estatus}</td>
                <td className={`impact-badge ${impactoClass}`}>{func.impacto}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}