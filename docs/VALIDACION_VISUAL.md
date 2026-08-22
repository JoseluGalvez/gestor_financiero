# Validación visual — 22 de agosto de 2026

## Estado comprobado

La página principal de `http://localhost:3000` se ha renderizado correctamente en navegador. El tablero muestra la navegación lateral, los filtros por plataforma y orden, cuatro indicadores de decisión, la comparativa de rendimiento con minigráficos, distribución por fuente y el bloque de calidad de información.

## Observaciones

| Área | Resultado |
|---|---|
| Identidad y jerarquía | El diseño FinTech mantiene jerarquía clara entre título, filtros, KPIs y análisis de plataformas. |
| Responsividad inicial | En vista de escritorio los paneles no se solapan, los textos principales son legibles y las acciones de importación/alta son visibles. |
| Filtro y comparación | El selector permite filtrar por cada una de las cuatro plataformas de demostración y cambiar el criterio de ordenación. |
| Transparencia del dato | La interfaz identifica el entorno como demostración y marca datos parciales o pendientes de revisión. |
| Protección declarada | El lateral comunica que el navegador no recibe credenciales de terceros; la arquitectura de producción detallada en `ALCANCE_ARQUITECTURA.md` define los controles posteriores. |

## Próximas comprobaciones

Queda por validar mediante interacción la pantalla de administración, el alta de una plataforma y el flujo de previsualización de importación. También se realizarán lint y build de producción como controles de regresión.

## Validación interactiva adicional

La pantalla **Administración** se ha abierto correctamente desde la navegación lateral. La vista presenta el formulario de alta de plataforma, los accesos a CSV/Excel, Google Sheets y base de datos, la advertencia de mínimo privilegio y el contrato de columnas de importación. Se completó el formulario con una plataforma de prueba (`Indexa Capital`, 16.000 €, 7,8 %) y todos los campos interactivos aceptaron los valores esperados. Falta confirmar el envío y validar el flujo de archivo de importación.

El envío del formulario creó correctamente la tarjeta de `Indexa Capital`, actualizó el contador del menú a cinco plataformas y mostró una confirmación visible. Durante la comprobación, el navegador conservó el filtro de plataforma seleccionado de una sesión de desarrollo previa; el código fue ajustado para restablecer el filtro a `Todas las plataformas` al crear una fuente. Esta corrección debe verificarse con una carga nueva de la aplicación, ya que el estado existente no se reinicializa durante una actualización en caliente.

El botón de importación abre correctamente el selector nativo de archivos. El input está oculto de forma intencional para mantener una interfaz limpia y se limita a extensiones CSV, XLSX y XLS. La validación posterior se realizará con el archivo CSV de prueba incluido en `tests/sample-platform-import.csv`.

Para automatizar la prueba se expuso temporalmente el selector de archivo de la sesión de navegador. El control se localizó correctamente y admite las extensiones esperadas. Esta exposición no forma parte del código de la aplicación: solo se emplea en la sesión de validación.

La carga de `tests/sample-platform-import.csv` abrió la previsualización esperada, detectó las columnas `Instrumento`, `Valor`, `Coste`, `Divisa` y `Fecha`, y mostró las dos filas de ejemplo. Al aplicar la demostración se cerró el modal y apareció el mensaje que explica que, en producción, se creará un lote auditable y se usará almacenamiento privado. La importación se aplicó al origen seleccionado en el diálogo; la persistencia real queda fuera del entorno demostrativo por decisión de seguridad.

## Validación técnica y seguridad

La ejecución final de `npm run lint` y `npm run build` finalizó correctamente. La auditoría inicial detectó una vulnerabilidad alta sin corrección disponible en el paquete `xlsx`; dicho paquete se retiró antes de la entrega. El lector de XLSX se reemplazó por `read-excel-file/browser`, y la auditoría posterior con `npm audit --omit=dev --audit-level=high` informa **0 vulnerabilidades**. La interfaz no usa `localStorage`, `sessionStorage`, contraseñas, tokens ni cadenas de conexión; las únicas referencias a secretos son avisos de seguridad para el usuario.

La aplicación fue recargada desde una sesión limpia tras reemplazar el lector XLSX. El dashboard volvió al estado esperado de cuatro plataformas y los filtros quedaron en `Todas las plataformas`. El selector de archivo se expuso temporalmente solo para automatizar la comprobación final del CSV.

La comprobación final de `tests/sample-platform-import.csv` superó correctamente el importador posterior al cambio de dependencia. El modal reconoció y mostró las cinco columnas, conservó las fechas ISO y presentó las dos filas esperadas antes de cualquier aplicación. Con ello quedan validados el filtro de tipo, el límite de entrada, la lectura CSV, la previsualización y la separación entre revisión y aplicación en la demostración.
