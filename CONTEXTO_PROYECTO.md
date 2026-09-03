# Contexto del Proyecto - Gestor Financiero

**Última actualización:** 2026-08-31

## Resumen

Análisis fundamental de empresas con React + TypeScript + Vitest. Motor de cálculo de 16 ratios financieros con evaluación de salud y oportunidad.

## Archivos Principales

| Archivo | Propiedad | Estado |
|---------|-----------|--------|
| `company-fundamentals.ts` | Motor de cálculo (16 ratios) | ✅ Sincronizado con repo |
| `company-fundamentals-export.ts` | Exportación CSV | ⚠️ Versión local con código extra |
| `influential-investors.ts` | Datos de inversores | ✅ Sincronizado con repo |
| `CompanyFundamentalsPdf.tsx` | Componente PDF | ✅ Sincronizado con repo |
| `CompanyFundamentalsWorkspace2.tsx` | Workspace principal | ✅ Sincronizado con repo |
| `App.tsx` | UI React (nuevo) | ✅ Creado en esta sesión |
| `styles.css` | Estilos (nuevo) | ✅ Creado en esta sesión |
| `main.tsx` | Entry point React | ✅ Creado en esta sesión |
| `company-fundamentals.test.ts` | Tests Vitest (31 tests) | ✅ Creado en esta sesión |

## Repositorio

- **GitHub:** `https://github.com/JoseluGalvez/gestor_financiero` (privado)
- **Última actualización repo:** 2026-08-30T18:05:27Z
- **Auth:** `gh` CLI autenticado como `JoseluGalvez`

## Comandos Disponibles

```bash
npm test              # Ejecutar 31 tests Vitest
npm run build         # Build producción (TypeScript + Vite)
npm run dev           # Dev server en localhost:3000
```

## Lo que se hizo en esta sesión

1. **Tests Vitest:** 31 tests cubriendo todos los ratios, señales de salud, evaluación de oportunidad y casos edge
2. **UI React:** Formulario de entrada + dashboard de resultados + exportación CSV
3. **Build工具链:** package.json, tsconfig.json, vite.config.ts, vitest.config.ts

## Lo que pendiente

- **Integrar con el repo principal:** Mover los archivos nuevos (`App.tsx`, `styles.css`, `main.tsx`, `company-fundamentals.test.ts`) a `src/` del repo
- **Configurar Next.js:** El repo usa Next.js, la UI actual usa Vite standalone
- **Tests adicionales:** `company-fundamentals-export.test.ts`, `influential-investors.test.ts`
- **Componente PDF:** Integrar `CompanyFundamentalsPdf.tsx` con la UI
- **Auth/Supabase:** El repo tiene integración con Supabase (ver `src/lib/supabase.ts`)

## Ratios Financieros (16 total)

**Valoración:** EPS, Market Cap, Net Debt, Enterprise Value, PER, EV/EBITDA, P/FCF
**Rentabilidad:** ROE, ROIC, ROIC-WACC Spread
**Márgenes:** Gross, Operating, Net
**Solvencia:** Net Debt/EBITDA, Interest Coverage
**Caja:** FCF Conversion

## Dependencias

- React 18, TypeScript 5, Vite 5, Vitest 1
- `@vitejs/plugin-react` para JSX
- `react-dom` para rendering

## Estructura del Directorio Actual

```
Finanzas/
├── company-fundamentals.ts          # Motor principal
├── company-fundamentals-export.ts   # Export CSV
├── company-fundamentals.test.ts     # Tests
├── influential-investors.ts         # Datos inversores
├── App.tsx                          # UI React
├── main.tsx                         # Entry point
├── styles.css                       # Estilos
├── index.html                       # HTML entry
├── package.json                     # Dependencias
├── tsconfig.json                    # Config TypeScript
├── vite.config.ts                   # Config Vite
├── vitest.config.ts                 # Config Tests
├── CompanyFundamentalsPdf.tsx        # Componente PDF
├── CompanyFundamentalsWorkspace2.tsx # Workspace
└── *.md, *.pdf, *.mp4, *.docx      # Documentación varios
```

## Notas Importantes

- El motor de cálculo NO depende de React - puede usarse independientemente
- Los tests verifican exactitud de cálculos financieros
- El CSV export incluye BOM UTF-8 para compatibilidad con Excel
- La UI es responsive (sidebar en desktop, stacked en mobile)