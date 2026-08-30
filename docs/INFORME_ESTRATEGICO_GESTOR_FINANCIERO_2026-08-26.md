# Informe estratégico de Gestor financiero

**Fecha:** 26 de agosto de 2026  
**Autor:** Manus AI  
**Alcance:** evaluación de la implementación local disponible, de su experiencia de uso y de alternativas de mercado. No constituye asesoramiento financiero, fiscal ni una recomendación de inversión.

> **Conclusión ejecutiva.** Gestor financiero se diferencia por combinar un **Canvas local sin envío de datos**, un espacio autenticado con perímetro organizativo, cálculos deterministas de transacciones y fiscalidad cripto revisable, y una capa de explicación que evita convertir ratios o divulgaciones públicas en órdenes de inversión. Su cuello de botella ya no es la ausencia de vistas: es la falta de un contrato transversal de **calidad, procedencia y rendimiento neto**. Resolverlo antes de añadir más conectores o IA generará el mayor salto cualitativo.

## 1. Alcance, criterios y estado real

Este informe separa estrictamente tres estados: **implementado localmente**, **documentado/propuesto** y **pendiente de aprobación**. No atribuye al producto conectores, datos de mercado, automatizaciones, migraciones RLS o recomendaciones que no están activos.

La evaluación utiliza cinco criterios: utilidad de decisión, trazabilidad, privacidad y seguridad, operatividad diaria y evolución técnica. El análisis se apoya en el código y registro de estado del proyecto, junto con la documentación oficial de las alternativas comparadas.

| Criterio | Pregunta de evaluación | Lectura actual |
|---|---|---|
| Utilidad de decisión | ¿Transforma movimientos y estados en información revisable? | Sí para seguimiento, FIFO, comparación realizada, Canvas y análisis fundamental manual; no para señales de mercado en vivo. |
| Trazabilidad | ¿Se puede explicar el origen, fórmula y cobertura de un resultado? | Buena en Canvas, FIFO y Salud empresa; incompleta en el dashboard general. |
| Privacidad y seguridad | ¿El tratamiento es proporcional a los datos? | Fuerte en modo local; RLS documentada para modo autenticado; integraciones sensibles aún no activadas. |
| Operatividad | ¿Reduce trabajo manual sin ocultar supuestos? | Importación local, filtros, exportación y reportes ya reducen fricción; conectores y actualización coalescida quedan pendientes. |
| Evolución | ¿La arquitectura permite ampliar capacidades sin introducir riesgo? | Sí, si se prioriza contrato de datos, rendimiento neto y backend para secretos antes de IA o cotizaciones. |

## 2. Mapa de funcionalidades desarrolladas

### 2.1 Espacios y navegación

La navegación lateral persistente reúne resumen, cartera, plataformas, criptomonedas, alertas, informes, fuentes, análisis, Canvas y Salud empresa. La decisión de diseño es correcta para una herramienta de trabajo: evita que la persona usuaria deba regresar al inicio para cambiar de contexto. El dashboard autenticado opera sobre organizaciones, carteras, transacciones, posiciones, fuentes y reglas; el Canvas local es una ruta distinta, accesible sin cuenta y sin persistencia.

| Área | Capacidades actuales | Utilidad | Límite explícito |
|---|---|---|---|
| Dashboard autenticado | Posiciones, transacciones, fuentes, alertas, análisis e informes sobre Supabase. | Visión consolidada para una organización. | Realtime necesita coalescencia, cancelación y refresco por dominio. |
| Canvas local | Importación CSV/XLSX, mapeo, KPIs, gráficos, filtros cruzados, tabla editable, conclusiones y exportación. | Análisis ad hoc privado y rápido. | No conserva datos al recargar salvo archivo JSON descargado explícitamente. |
| Sesiones JSON | Guardar/cargar encabezados, mapeo, filtros y filas validadas. | Reanudar análisis local o compartir una copia de trabajo controlada. | No existe historial automático ni nube. |
| Fuentes | Formulario de URL/ID de Google Sheets, pestaña, rango y mapeo. | Preparar una importación consciente del alcance. | No se conecta ni importa una hoja real sin autorización. |

### 2.2 Operativa, plataformas y fiscalidad

El módulo de plataformas calcula resultado **realizado** por fuente mediante lotes FIFO, y evita concluir si una venta no tiene coste trazable. Esta elección es prudente: no mezcla transacciones históricas con cotizaciones externas sin licencia. El módulo de criptomonedas procesa un CSV local, reconstruye lotes FIFO, modela compras, ventas y permutas atómicas, y produce un borrador CSV revisable. Cuando faltan inventario o valores justificables, bloquea la operación en vez de completar con estimaciones.

| Módulo | Ventaja funcional | Salvaguarda | Valor para el usuario |
|---|---|---|---|
| Comparación de plataformas | Resultado y rentabilidad realizada por fuente. | No consume lotes parcialmente ante una venta inválida. | Distingue dónde se materializaron resultados con coste conocido. |
| Criptomonedas/FIFO | Ganancias/pérdidas, inventario y permutas por activo. | No presenta declaración oficial ni inventa coste. | Ahorra conciliación manual conservando un borrador revisable. |
| Informes de cartera | PDF de la instantánea disponible. | No promete un informe fiscal completo. | Permite compartir contexto interno o preparar una revisión. |
| Power BI preparatorio | CSV filtrado y manifiesto de filtros/mapeo. | Sin token Embedded ni publicación web. | Facilita análisis externo sin exponer una clave en navegador. |

### 2.3 Análisis financiero y Salud empresa

`financial-analysis.ts` agrupa análisis de riesgo, técnico, DCF y scoring solo cuando existen entradas trazables. La nueva sección **Salud empresa** está deliberadamente separada: pide nombre, fecha, divisa, fuente y período, y calcula valoración, rentabilidad, márgenes, solvencia y caja con los valores introducidos en el navegador. Los tooltips muestran fórmula, objetivo, entradas y origen de cada métrica; los denominadores negativos o nulos se marcan como no significativos, en vez de presentar ratios engañosas.

Las exportaciones CSV y PDF se generan con la misma instancia `analysis` que alimenta la vista. El CSV contiene contexto, cobertura, métricas, fórmulas, estado, advertencias y evidencia de oportunidad; añade UTF‑8 BOM y neutraliza celdas que comienzan por `=`, `+`, `-` o `@` para no introducir fórmulas al abrirlo en una hoja de cálculo. El PDF se construye localmente con `@react-pdf/renderer`.

## 3. Integración de inversores de referencia sin sobrecargar la interfaz

### 3.1 Patrón implementado

Los perfiles no forman parte del flujo de cálculo primario. Se muestran **después** de los resultados, la oportunidad y las advertencias, dentro de una sección de baja prioridad visual llamada **“Referencias de estudio”**. Así, una persona que solo desea comprobar un ratio, descargar un informe o revisar una alerta no debe atravesar contenido editorial.

La lista se mantiene como datos estáticos tipados en `src/lib/influential-investors.ts`. Cada perfil contiene firma, estilo, contexto, razón de estudio, enlace de divulgación, enlace de visualización pública y una advertencia de alcance. `CompanyFundamentalsWorkspace.tsx` proyecta esos datos mediante `map`, de modo que añadir, retirar o actualizar una referencia no obliga a modificar la lógica de cálculo.

```tsx
<section className="investor-profiles" aria-labelledby="investor-profiles-title">
  <div className="panel-heading">
    <div>
      <p className="eyebrow">Referencias de estudio</p>
      <h3 id="investor-profiles-title">
        Inversores influyentes: fuentes y gráficos públicos
      </h3>
    </div>
    <span className="data-stamp">No son cartera modelo ni señal operativa</span>
  </div>

  <p className="investor-profiles-intro">
    Estos perfiles sirven para investigar metodologías y consultar divulgaciones públicas.
    Las posiciones históricas tienen retrasos y alcance limitado.
  </p>

  <div className="investor-profile-grid">
    {INFLUENTIAL_INVESTORS.map((investor) => (
      <article key={investor.name}>
        <div><p>{investor.firm}</p><h4>{investor.name}</h4></div>
        <dl>
          <div><dt>Estilo</dt><dd>{investor.philosophy}</dd></div>
          <div><dt>Hito o contexto</dt><dd>{investor.milestone}</dd></div>
          <div><dt>Por qué estudiarlos</dt><dd>{investor.whyFollow}</dd></div>
        </dl>
        <div className="investor-profile-links">
          <a href={investor.disclosureUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={14} />{investor.disclosureLabel}
          </a>
          <a href={investor.portfolioVisualizationUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={14} />{investor.portfolioVisualizationLabel}
          </a>
        </div>
        <small>{investor.disclosureCaveat}</small>
      </article>
    ))}
  </div>
</section>
```

El uso de `target="_blank"` y `rel="noreferrer"` protege el contexto de la aplicación al abrir sitios externos. No se ejecuta una llamada de red al renderizar las tarjetas: las fuentes se abren solo por acción explícita. El contenido no incluye posiciones copiadas, rankings ni puntuaciones de compra.

> La SEC advierte en la portada de los formularios 13F que no ha revisado necesariamente la información ni determinado que sea exacta y completa. Por ello, la aplicación presenta estas divulgaciones como fuentes históricas, no como una señal operativa. [1]

### 3.2 Cómo reducir aún más la carga cognitiva

La implementación actual usa una cuadrícula adaptable de tarjetas y está contenida después de los resultados. El siguiente refinamiento debería ocultarla tras un acordeón **“Explorar referencias”**, cargado cerrado por defecto. El encabezado mostraría solo cinco nombres y un contador; el detalle se abriría de forma explícita. También conviene filtrar por filosofía —calidad, cuantitativo, contrarian, macro— y permitir marcar una referencia como leída sin crear una alerta ni persistir preferencias salvo consentimiento.

| Regla de interfaz | Aplicación actual | Evolución recomendada |
|---|---|---|
| Jerarquía | Está debajo de métricas, oportunidad y advertencias. | Acordeón cerrado para una lectura más rápida. |
| Progresión | Una tarjeta muestra firma, estilo, contexto y dos enlaces. | Panel lateral bajo demanda para biografía y metodología. |
| Integridad | Etiqueta visible: “No son cartera modelo ni señal operativa”. | Mostrar fecha/cobertura de la divulgación al abrir una fuente. |
| Rendimiento | Datos estáticos locales; no hay fetch al cargar. | Renderización diferida al expandir el acordeón si el catálogo crece. |
| Accesibilidad | Enlaces con texto, `rel="noreferrer"` y estructura semántica. | Añadir navegación por teclado y prueba de lector de pantalla automatizada. |

## 4. Código de implementación del informe PDF

### 4.1 Flujo de descarga

El botón no sube el informe al servidor. Llama al renderizador, convierte el documento a `Blob`, crea una URL temporal, descarga el fichero y revoca la URL. La exportación se habilita solo si hay cobertura superior a cero.

```tsx
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function exportPdf() {
  const blob = await pdf(<CompanyFundamentalsPdf analysis={analysis} />).toBlob();
  downloadBlob(blob, companyFundamentalsFilename(analysis.companyName, "pdf"));
}
```

El componente `CompanyFundamentalsPdf` recibe una sola dependencia funcional: `analysis`. Por tanto, no recalcula ratios ni altera el estado del formulario al exportar. El nombre de descarga se normaliza y adopta el patrón `salud-financiera-{empresa}-{fecha}.pdf`.

### 4.2 Estructura del documento

El PDF presenta cabecera, contexto de la fuente, métricas por categoría, oportunidad, señales y advertencias. Es importante que el bloque de oportunidad aparezca **después** de las métricas: evita que una etiqueta favorable se lea separada de sus condiciones.

```tsx
export function CompanyFundamentalsPdf({ analysis }: {
  analysis: CompanyFundamentalsAnalysis;
}) {
  return (
    <Document title={`Salud financiera · ${analysis.companyName}`} author="Portafolio Intel">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>PORTAFOLIO INTEL · INFORME EXPLICABLE</Text>
          <Text style={styles.title}>Salud financiera y rentabilidad</Text>
          <Text style={styles.subtitle}>
            Informe generado a partir de datos introducidos manualmente. No representa
            una recomendación de inversión ni una validación independiente de la fuente.
          </Text>
        </View>

        <View style={styles.context}>
          <Context label="Empresa" value={analysis.companyName} />
          <Context label="Fecha de referencia" value={analysis.asOf || "No indicada"} />
          <Context label="Divisa" value={analysis.currency} />
          <Context label="Cobertura" value={`${analysis.coveragePct.toLocaleString("es-ES")} %`} />
          <Context label="Fuente declarada" value={analysis.sourceLabel} />
        </View>

        {(["Valoración", "Rentabilidad", "Márgenes", "Solvencia", "Caja"] as const)
          .map((category) => (
            <View key={category} style={styles.section}>
              <Text style={styles.sectionTitle}>{category}</Text>
              {analysis.metrics.filter((m) => m.category === category).map((metric) => (
                <View key={metric.key} style={styles.row}>
                  <Text style={styles.metric}>{metric.label} · {statusLabel(metric)}</Text>
                  <Text style={styles.formula}>{metric.formula}</Text>
                  <Text style={styles.metricValue}>{formatMetric(metric, analysis.currency)}</Text>
                </View>
              ))}
            </View>
          ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Oportunidad a revisar</Text>
          <View style={styles.opportunity}>
            <Text style={styles.signalTitle}>{analysis.opportunity.title}</Text>
            <Text style={styles.signalText}>{analysis.opportunity.detail}</Text>
            {analysis.opportunity.evidence.map((evidence) => (
              <Text key={evidence.label} style={styles.signalText}>
                • {evidence.label}: {evidence.passed === null ? "no calculable" : evidence.passed ? "cumple" : "no cumple"}
                {` (${evidence.condition})`}
              </Text>
            ))}
          </View>
        </View>

        <Text style={styles.footnote}>{analysis.opportunity.disclaimer}</Text>
      </Page>
    </Document>
  );
}
```

El fragmento usa `Context` y `statusLabel` como pequeñas abstracciones de presentación; el componente real completo está en `src/components/CompanyFundamentalsPdf.tsx`. El documento real añade las señales de salud y todas las advertencias que devuelve el motor.

| Bloque del PDF | Contenido | Función de control |
|---|---|---|
| Cabecera | Empresa, fecha, divisa, fuente y cobertura. | Impide separar una cifra de su período y contexto. |
| Métricas | Categoría, etiqueta, estado, fórmula y valor. | Diferencia calculable, faltante y no significativo. |
| Oportunidad | Título, detalle y evidencia por criterio. | Explica por qué hay o no una candidata a investigar. |
| Señales | Lectura orientativa de deuda, intereses y ROIC−WACC. | Obliga a mirar riesgos junto con datos favorables. |
| Advertencias | Datos ausentes, límites y descargo. | Evita tratar el PDF como auditoría o consejo. |

## 5. Valor para usuarios noveles y expertos

### 5.1 Persona usuaria novel

Para una persona que empieza, el principal valor no es un indicador sofisticado sino un recorrido que reduce ambigüedad: cargar un CSV/XLSX local, asignar columnas, ver qué datos se usan, filtrar sin perder el conjunto original y entender por qué un ratio no se publica. Los ejemplos son ficticios y el Canvas expone un aviso de privacidad, por lo que permite aprender sin subir un extracto real.

Las ayudas de fórmula y los estados **Calculable**, **Falta información** y **No significativo** evitan dos errores frecuentes: interpretar una métrica incompleta como cero y usar un múltiplo con denominador negativo. El borrador cripto con FIFO sigue la misma filosofía: muestra evidencia y advertencias en lugar de una presentación fiscal automática.

La limitación para este perfil es que el producto todavía no ofrece una guía de incorporación progresiva ni un diccionario único de términos. Un asistente de configuración basado en datos ficticios, definiciones contextuales y una pantalla “¿qué falta para completar este indicador?” aumentaría de forma importante la accesibilidad sin incorporar IA ni datos externos.

### 5.2 Persona usuaria experta

Para una persona con experiencia, el valor diferencial está en la separación de dominios: análisis ad hoc local, entorno organizativo con RLS, FIFO atómico, resultados realizados por plataforma, exportación filtrada para Power BI y anexos PDF/CSV que conservan fórmula y cobertura. Esta persona puede revisar los supuestos, detectar datos no conciliados y transportar el resultado a una herramienta de análisis externo sin depender de una interfaz cerrada.

El límite para este perfil es más exigente: faltan TWR/MWR-XIRR netos, puente de atribución, exposición multiactivo, clasificación consistente, series de riesgo y conectores de mercado con licencia. También necesita pruebas E2E, una política de versionado de cálculos y un registro de decisión que permita contrastar hipótesis contra resultados posteriores.

| Necesidad | Novel | Experto | Respuesta actual | Mejora de mayor valor |
|---|---|---|---|---|
| Importación | Comprender qué se carga. | Repetir y auditar mapeos. | Canvas CSV/XLSX y configuración de fuentes. | Plantillas por bróker y validación de semántica. |
| Rendimiento | Ver una lectura sencilla. | Separar flujos, FX, costes e impuestos. | KPIs locales y resultado realizado. | Motor TWR/MWR y puente de valor. |
| Riesgo | Entender concentración. | Medir drawdown, volatilidad y escenarios. | Gráficos de exposición relativos. | Clasificación verificable y panel de riesgo. |
| Fiscalidad | Evitar errores de inventario. | Revisar lotes y documentación. | FIFO cripto revisable. | Conciliación, exportación de anexos y revisión profesional. |
| Análisis de empresa | Saber qué significa una fórmula. | Contrastar supuestos y cobertura. | Salud empresa manual y PDF/CSV. | Fuentes versionadas, comparables y datos de filings con licencia. |

## 6. Comparación con alternativas de mercado

La comparación es funcional, no una clasificación absoluta. Las funciones y limitaciones de terceros se basan en la documentación comercial y técnica publicada por cada proveedor; la disponibilidad por país, plan y conector puede cambiar.

| Alternativa | Capacidades declaradas | Ventajas frente a Gestor financiero | Limitaciones frente a Gestor financiero | Encaje de usuario |
|---|---|---|---|---|
| **Sharesight** | Consolidación de valores, ETF, dividendos, brókeres y mercados; múltiples integraciones e informes. [2] | Amplia madurez de conectores y reporting de inversión. | Modelo cloud, límites por plan y menor control de un Canvas totalmente local. | Inversor que prioriza automatización de seguimiento. |
| **Portfolio Performance** | Open source, TTWROR/IRR, histórico de transacciones, fuentes de precios, XML y exportación CSV/JSON. [3] | Muy fuerte en métricas de rendimiento y propiedad local del fichero. | Menor experiencia web colaborativa y exige configuración manual. | Usuario técnico que prioriza control y cálculo de rendimiento. |
| **Finary** | Patrimonio multiactivo, agregación de cuentas, rendimiento, dividendos y comisiones. [4] | Experiencia móvil, automatización y cobertura patrimonial amplia. | Centraliza datos en un servicio externo y depende de conectores. | Usuario que busca comodidad y visión global. |
| **Empower** | Agregación de cuentas, seguimiento de inversiones, jubilación y análisis de comisiones. [5] | Herramientas consolidadas de patrimonio y planificación. | Orientación principalmente estadounidense y relación con servicios de asesoramiento. | Usuario de EE. UU. con interés en planificación patrimonial. |
| **getquin** | Importación API/manual/CSV, rentabilidad, dividendos, X‑Ray, benchmark y comunidad. [6] | Actualización de mercado, benchmarking y capa social. | La comunidad puede añadir ruido y el modelo depende de datos cloud. | Inversor que valora seguimiento activo y comunidad. |
| **Kubera** | Patrimonio complejo, activos alternativos, entidades, acceso granular e informes dinámicos. [7] | Cobertura de estructuras y activos complejos; colaboración. | Precio y enfoque premium; amplio perímetro de datos conectados. | Patrimonio multiactivo/familiar de mayor complejidad. |
| **Gestor financiero** | Canvas local, RLS organizativo, FIFO cripto, resultado realizado, análisis manual explicable, CSV/PDF y preparación Power BI. | Privacidad local, adaptabilidad, trazabilidad de fórmula y control de alcance. | Sin conectores activos, datos de mercado licenciados, TWR/MWR productivo ni app móvil. | Usuario que prioriza control, privacidad y evolución a medida. |

Portfolio Performance es el referente más próximo en cálculos de rendimiento local: declara TTWROR e IRR, un modelo de datos persistido en XML y exportación CSV/JSON. [3] Gestor financiero debería adoptar sus lecciones metodológicas sin copiar su experiencia: calcular TWR/MWR con contexto, conservar flujos/costes y marcar cobertura en la interfaz.

Sharesight, getquin, Finary y Kubera demuestran el valor de la automatización de conectores, agregación, dividendos, exposición y reporting. Sharesight comunica consolidación de activos, brókeres y mercados, mientras que getquin incorpora importación API/manual/CSV y métricas de retorno; ambos muestran por qué el producto debe invertir en un contrato de importación antes de multiplicar integraciones. [2] [6] Finary y Kubera enfatizan el patrimonio multiactivo, pero su propuesta exige aceptar un modelo cloud y conectores de terceros. [4] [7]

## 7. Mejoras de salto cualitativo

La secuencia recomendada no busca maximizar la cantidad de funcionalidades, sino aumentar la confianza de cada cifra. Antes de añadir mercados en vivo, IA o alertas externas, la aplicación debe saber explicar qué datos faltan, qué parte está conciliada y qué método produjo cada resultado.

| Ola | Mejora | Resultado cualitativo | Criterio de aceptación | Dependencias |
|---|---|---|---|---|
| 0 | **Contrato de calidad y procedencia** | Todo KPI exhibe `as_of`, fuente, divisa, cobertura, versión de cálculo y advertencias. | Un KPI sin datos críticos se degrada a parcial/no disponible. | Ninguna fuente externa. |
| 1 | **TWR, MWR/XIRR y puente de atribución** | Separa rendimiento económico de aportaciones/retiros. | Pruebas ficticias de flujos; conciliación valor inicial/final. | Definir moneda base, costes e impuestos. |
| 2 | **Exposición, concentración y riesgo** | Añade peso por activo/emisor/sector/país/divisa, drawdown y escenarios explícitos. | “Sin clasificar” no entra silenciosamente en una conclusión. | Taxonomía de instrumentos y series suficientes. |
| 3 | **Importación confiable y conectores R/O** | Menos trabajo manual sin sacrificar consentimiento. | Vista previa, deduplicación, mapeo versionado, secretos solo backend y logs. | Selección de proveedor/licencia, OAuth/Edge Functions. |
| 4 | **Alertas y cola de decisiones** | Cada alerta explica insumos, regla, evaluación y estado. | Ráfagas Realtime coalescidas; ninguna notificación externa sin consentimiento. | Calidad de datos y backend de evaluación. |
| 5 | **Informes reproducibles y colaboración** | Evidencia, hipótesis, resultado posterior y reparto de responsabilidades. | Informe con fuentes, cobertura, TWR/MWR y anexo de exclusiones. | Motor de rendimiento y control de acceso. |
| 6 | **Piloto IA solo lectura** | Explicaciones citadas sobre datos autorizados y fuentes licenciadas. | RLS por organización/cartera, consentimiento, fecha de corte, auditoría y cero escritura. | Todas las olas anteriores y aprobación explícita. |

### 7.1 Tres inversiones de producto prioritarias

**Primera: calidad y procedencia visibles.** Es la inversión de mayor retorno porque mejora Canvas, dashboard, informes, análisis fundamental y futuras alertas. Debe modelar frescura (`fresh`, `stale`, `missing`, `manual_review`), conciliación (`pending`, `reconciled`, `excluded`) y un sello de cálculo. No exige mercado en vivo ni puede filtrar secretos al cliente.

**Segunda: rendimiento neto y puente de valor.** TWR y MWR/XIRR deben coexistir. TWR responde al rendimiento de la estrategia al neutralizar flujos externos; MWR refleja el momento y magnitud de las aportaciones. El puente debe conciliar: valor inicial + flujos + mercado + dividendos/intereses − costes − impuestos ± FX = valor final. Si faltan costes, retenciones o FX, el informe debe llamarse parcial, no neto.

**Tercera: importación y conectores de solo lectura con previsualización.** La ventaja del Canvas se puede extender sin perder privacidad mediante conectores voluntarios, secretos en backend, licencia declarada, límite por fuente, caché externa y vista previa antes de escribir. La aplicación no debe usar una credencial en cliente, ejecutar compras/ventas ni convertir una importación en una sincronización implícita.

## 8. Riesgos, límites y decisiones no recomendadas

| Riesgo | Decisión segura | Antipatrón que se evita |
|---|---|---|
| Conclusión por dato incompleto | Mostrar cobertura, origen, fecha y advertencia. | KPI definitivo con precio, FX o coste faltante. |
| Dependencia de terceros | Conector R/O opcional y backend con secretos. | API key en navegador o sincronización silenciosa. |
| Sesgo por divulgaciones de inversores | Enlaces como fuentes históricas, no copia de cartera. | “Comprar lo que compra X”. |
| Fiscalidad | Borrador revisable y bloqueo de datos insuficientes. | Presentación oficial o declaración automática. |
| IA | Herramientas R/O, RLS, citas, contexto y auditoría. | Agente con SQL libre, secretos o ejecución de operaciones. |
| Escalabilidad del navegador | Límites, Worker, `requestId` y NDJSON de referencia. | Cargar archivos sin límite o permitir resultados desfasados. |

## 9. Conclusión

Gestor financiero ya ofrece una base diferenciada: respeta la decisión entre un análisis efímero y privado frente a un espacio colaborativo autenticado; trata la fiscalidad como borrador verificable; y expone fórmulas, cobertura y advertencias en la nueva Salud empresa. Frente a herramientas maduras, no debe competir todavía en amplitud de conectores ni prometer rendimiento en tiempo real. Debe competir en **confianza, trazabilidad y control**.

El salto cualitativo no es añadir otra tarjeta de KPI. Es establecer el contrato de datos, introducir rendimiento neto correctamente y enlazar toda alerta, informe o explicación a una fuente, fecha, método y cobertura. Con esa base, los conectores, Power BI, informes de cartera y un asistente IA R/O podrán ampliar productividad sin degradar seguridad ni inducir decisiones no fundamentadas.

## Referencias

[1] [SEC — Form 13F de Scion Asset Management, advertencia de alcance y exactitud](https://www.sec.gov/Archives/edgar/data/1649339/000164933925000007/xslForm13F_X02/primary_doc.xml)

[2] [Sharesight — Portfolio tracker, integraciones, planes y seguridad declarada](https://www.sharesight.com/)

[3] [Portfolio Performance — TTWROR, IRR, modelo XML y exportación](https://www.portfolio-performance.info/en/)

[4] [Finary — Agregación patrimonial, activos compatibles y declaraciones de seguridad](https://finary.com/en/app)

[5] [Empower — Portfolio tracking benefits](https://www.empower.com/portfolio-tracking-benefits)

[6] [getquin — Portfolio tracker, rendimiento, importación y exposición](https://www.getquin.com/portfolio-tracker/)

[7] [Kubera — Seguimiento multiactivo, entidades, colaboración e informes](https://www.kubera.com/portfolio-tracker)
