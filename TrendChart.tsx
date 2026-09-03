import type { MetricPoint } from "./analysis-history";
import { formatMetricPointValue } from "./analysis-history";

export function TrendChart({ points, unit }: { points: MetricPoint[]; unit: MetricPoint["unit"] }) {
  if (points.length < 2) {
    return (
      <div className="trend-chart-empty">
        Necesitas al menos dos análisis con fecha de referencia para dibujar una evolución.
      </div>
    );
  }

  const width = 640;
  const height = 260;
  const padding = { top: 24, right: 24, bottom: 40, left: 64 };

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const span = range * 0.15;
  const lo = min - span;
  const hi = max + span;

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const x = (index: number) => padding.left + (points.length === 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth);
  const y = (value: number) => padding.top + ((hi - value) / (hi - lo)) * innerHeight;

  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${x(index).toFixed(1)} ${y(point.value).toFixed(1)}`).join(" ");
  const areaPath = `${path} L ${x(points.length - 1).toFixed(1)} ${(padding.top + innerHeight).toFixed(1)} L ${x(0).toFixed(1)} ${(padding.top + innerHeight).toFixed(1)} Z`;

  const gridLines = 4;
  const grid = Array.from({ length: gridLines + 1 }, (_, i) => {
    const value = lo + (i / gridLines) * (hi - lo);
    return { value, y: y(value) };
  });

  const firstDraft = points[0].value;
  const lastDraft = points[points.length - 1].value;
  const change = lastDraft - firstDraft;
  const direction = change >= 0 ? "up" : "down";

  return (
    <div className="trend-chart">
      <div className="trend-chart-meta">
        <span className="trend-chart-title">{points.length} periodos registrados</span>
        <span className={`trend-chart-delta ${direction}`}>
          {change >= 0 ? "▲" : "▼"} {formatMetricPointValue(Math.abs(change), unit)} en el periodo
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="trend-chart-svg" role="img" aria-label="Evolución temporal del ratio seleccionado">
        {grid.map((line, i) => (
          <g key={i}>
            <line x1={padding.left} y1={line.y} x2={width - padding.right} y2={line.y} className="trend-grid-line" />
            <text x={padding.left - 8} y={line.y + 4} textAnchor="end" className="trend-axis-label">
              {formatMetricPointValue(line.value, unit)}
            </text>
          </g>
        ))}

        <path d={areaPath} className="trend-area" />
        <path d={path} className="trend-line" />

        {points.map((point, index) => (
          <g key={index}>
            <circle cx={x(index)} cy={y(point.value)} r={4} className="trend-point" />
            <text x={x(index)} y={height - 14} textAnchor="middle" className="trend-x-label">
              {point.asOf}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}