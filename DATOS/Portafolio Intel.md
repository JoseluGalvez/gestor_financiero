# Portafolio Intel

Aplicación web de gestión financiera para **consolidar plataformas de inversión**, comparar su rendimiento y facilitar una entrada de datos controlada. Esta primera entrega implementa un flujo demostrable de extremo a extremo: catálogo de plataformas, dashboard filtrable, alta manual y previsualización de archivos CSV/XLSX.

> **Estado del repositorio:** MVP de interfaz funcional con datos de demostración. No es todavía un sistema de persistencia financiera ni un asesor de inversión.

## Qué incluye

| Área | Capacidades disponibles |
|---|---|
| Resumen | Patrimonio, resultado acumulado, calidad de la información, ranking y distribución por plataforma. |
| Comparación | Filtro por plataforma y ordenación por rentabilidad simple o valor actual. |
| Administración | Alta de plataforma con tipo, país, método de entrada, valor y rentabilidad inicial. |
| Importación | Lectura y previsualización local de CSV, XLSX y XLS; detección inicial de columnas `Valor` y `Coste`. |
| Integraciones futuras | Pantallas preparadas para Google Sheets y base de datos, sin aceptar ni almacenar credenciales en el navegador. |
| Trazabilidad comunicada | Estado de calidad, fecha de actualización, método de entrada y avisos de cobertura. |

## Inicio local

```bash
npm ci
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador. Para revisar la compilación de producción:

```bash
npm run lint
npm run build
```

## Entrada de datos en esta entrega

El botón **Importar datos** admite archivos `CSV` y `XLSX` de hasta 8 MB. Los archivos `XLS` heredados deben convertirse a `XLSX` antes de la carga. El archivo se procesa localmente para mostrar una previsualización de la primera hoja y hasta diez registros. Al aplicar la demostración se actualiza la plataforma seleccionada únicamente durante la sesión actual.

El archivo de ejemplo `tests/sample-platform-import.csv` contiene las columnas mínimas reconocidas para comprobar el flujo:

```csv
Instrumento,Valor,Coste,Divisa,Fecha
Vanguard FTSE All-World ETF,12450,11000,EUR,2026-08-22
```

## Límites intencionales del MVP

La aplicación no conserva los cambios después de recargar, no integra bancos, brokers ni Google Sheets de forma real y no almacena credenciales. Estas restricciones son deliberadas: sin autenticación, autorización y almacenamiento cifrado del lado servidor, persistir datos financieros o secretos de conexión sería una mala práctica de seguridad.

El plan de producción utiliza Next.js con componentes de servidor, Supabase PostgreSQL con RLS, almacenamiento privado, validación Zod, conectores del lado servidor, OAuth para Google Sheets y agentes de lectura para bases de datos. El detalle completo se encuentra en [`docs/ALCANCE_ARQUITECTURA.md`](docs/ALCANCE_ARQUITECTURA.md).

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/ALCANCE_ARQUITECTURA.md`](docs/ALCANCE_ARQUITECTURA.md) | Investigación de competidores y tendencias, alcance priorizado, arquitectura, modelo de datos, seguridad y plan de entrega. |
| [`docs/VALIDACION_VISUAL.md`](docs/VALIDACION_VISUAL.md) | Evidencia de validación visual e interactiva del dashboard, administración e importación. |

## Stack

- Next.js 16 con App Router
- React 19 y TypeScript
- Tailwind CSS 4
- `lucide-react` para iconografía
- `read-excel-file` para la lectura local de XLSX y un parser CSV acotado en el entorno demostrativo
