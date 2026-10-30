# Desplegar Gestor financiero en GitHub Pages

Esta aplicación puede publicarse como exportación estática porque su ruta principal se prerenderiza y no contiene rutas API ni código de servidor propio. El navegador ejecuta la interfaz, el módulo de Presupuesto personal y las conexiones permitidas a Supabase.

La URL de proyecto será:

```text
https://joselugalvez.github.io/gestor_financiero/
```

GitHub Pages solo sirve archivos estáticos. No ejecutará funciones de servidor de Next.js. Si en el futuro se añaden rutas API, Server Actions, middleware dependiente del servidor o secretos privados usados desde el backend, habrá que mantener ese backend en otra plataforma.

## 1. Variables de Supabase

En GitHub abre `JoseluGalvez/gestor_financiero` y entra en:

`Settings` → `Secrets and variables` → `Actions` → `New repository secret`.

Crea estos dos secretos:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Usa únicamente la URL pública y la clave publicable o anon del proyecto Supabase. Nunca subas una `service_role key` ni otra clave privilegiada. Los valores `NEXT_PUBLIC_*` terminan en el JavaScript del navegador; la seguridad real debe estar en las políticas RLS de Supabase.

El proyecto Supabase debe estar activo y sus orígenes autorizados deben incluir:

```text
https://joselugalvez.github.io
```

## 2. Activar GitHub Pages

En el repositorio abre `Settings` → `Pages`. En `Build and deployment`, selecciona `GitHub Actions` como fuente de publicación.

No selecciones `Deploy from a branch`: el workflow ya construye la carpeta `out` y la entrega mediante el artifact oficial de Pages.

## 3. Ejecutar el despliegue

El archivo `.github/workflows/deploy-pages.yml` se ejecuta automáticamente en cada `push` a `main`. También puede iniciarse manualmente desde:

`Actions` → `Deploy Next.js to GitHub Pages` → `Run workflow`.

El proceso realiza estas acciones:

1. Instala las dependencias con `npm ci`.
2. Ejecuta `next build` con `output: "export"`.
3. Genera la carpeta `out` con `index.html` y `404.html`.
4. Sube `out` como artifact de GitHub Pages.
5. Publica el artifact en el entorno `github-pages`.

Cuando finalice, GitHub mostrará la URL en el resumen del workflow. Para este repositorio debe ser:

```text
https://joselugalvez.github.io/gestor_financiero/
```

## 4. Comprobación local equivalente

Para comprobar el mismo tipo de compilación antes de hacer push:

```bash
NEXT_PUBLIC_BASE_PATH=/gestor_financiero npm run lint
NEXT_PUBLIC_BASE_PATH=/gestor_financiero npm run build
```

El resultado esperado es una carpeta `out` que contiene `index.html` y `404.html`.

## 5. Privacidad del módulo Presupuesto personal

El módulo Presupuesto personal no usa Supabase. Sus ingresos, gastos y presupuestos se guardan en `localStorage` del navegador bajo la clave `portafolio-intel.personal-budget.v1`.

Por eso los datos no se suben a GitHub Pages ni al repositorio y no se comparten con otros dispositivos. La exportación CSV es el mecanismo de respaldo. Si se borran los datos del sitio o se cambia de navegador, será necesario importar de nuevo el CSV.

## 6. Limitaciones de GitHub Pages

La exportación estática no aplica las cabeceras configuradas en `next.config.ts`; Next.js muestra un aviso durante el build porque GitHub Pages no ejecuta la capa de servidor de Next.js. Las funcionalidades de autenticación y datos persistentes dependen de Supabase y de sus políticas RLS. Para una aplicación que necesitase secretos de backend, endpoints privados o procesamiento servidor, Vercel, Cloudflare Workers o un backend separado serían opciones más adecuadas.
