#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generador del informe PDF: Portafolio Intel — Gestor Financiero
"""

from fpdf import FPDF
import os

class InformeFinanciero(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=25)
        self.toc_entries = []
        self.current_section = ""

    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, "Portafolio Intel - Gestor Financiero | Informe Estrategico", align="C")
        self.ln(4)
        self.set_draw_color(200, 200, 200)
        self.line(15, 14, 195, 14)
        self.ln(6)

    def footer(self):
        if self.page_no() == 1:
            return
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, self.safe_text(f"Pagina {self.page_no() - 1}"), align="C")

    def portada(self):
        self.add_page()
        # Fondo degradado simulado con rectángulos
        self.set_fill_color(15, 23, 42)  # Azul oscuro
        self.rect(0, 0, 210, 297, "F")

        # Barra superior de acento
        self.set_fill_color(59, 130, 246)  # Azul brillante
        self.rect(0, 0, 210, 8, "F")

        # Icono decorativo
        self.set_fill_color(59, 130, 246)
        self.rect(75, 60, 60, 60, "F")
        # Símbolo "PI" dentro del cuadro
        self.set_font("Helvetica", "B", 32)
        self.set_text_color(255, 255, 255)
        self.set_xy(75, 72)
        self.cell(60, 20, "PI", align="C")
        self.set_font("Helvetica", "", 11)
        self.set_xy(75, 92)
        self.cell(60, 10, "Portafolio Intel", align="C")

    def safe_text(self, text):
        """Replace Unicode chars that Helvetica can't encode."""
        replacements = {
            '\u2014': '--',  # em-dash
            '\u2013': '-',   # en-dash
            '\u201c': '"',   # left double quote
            '\u201d': '"',   # right double quote
            '\u2018': "'",   # left single quote
            '\u2019': "'",   # right single quote
            '\u2026': '...',  # ellipsis
            '\u2022': '-',   # bullet
            '\u00b7': '-',   # middle dot
            '\u00e9': 'e',   # e-acute
            '\u00ed': 'i',   # i-acute
            '\u00f3': 'o',   # o-acute
            '\u00e1': 'a',   # a-acute
            '\u00fa': 'u',   # u-acute
            '\u00f1': 'n',   # n-tilde
            '\u00fc': 'u',   # u-diaeresis
            '\u00f6': 'o',   # o-diaeresis
            '\u00e4': 'a',   # a-diaeresis
            '\u00c9': 'E',   # E-acute
            '\u00cd': 'I',   # I-acute
            '\u00d3': 'O',   # O-acute
            '\u00c1': 'A',   # A-acute
            '\u00da': 'U',   # U-acute
            '\u00d1': 'N',   # N-tilde
            '\u2032': "'",   # prime
            '\u2264': '<=',  # less than or equal
            '\u2265': '>=',  # greater than or equal
            '\u2260': '!=',  # not equal
            '\u221e': 'inf', # infinity
            '\u03a3': 'S',   # Sigma
            '\u03a0': 'P',   # Pi
            '\u03b1': 'a',   # alpha
            '\u03b2': 'b',   # beta
            '\u03b3': 'g',   # gamma
            '\u03b4': 'd',   # delta
            '\u03b5': 'e',   # epsilon
            '\u03bb': 'l',   # lambda
            '\u03c0': 'pi',  # pi
            '\u03c3': 's',   # sigma
            '\u03c9': 'w',   # omega
            '\u2103': 'C',   # degree celsius
            '\u00b0': 'deg', # degree
            '\u00a0': ' ',   # non-breaking space
        }
        for k, v in replacements.items():
            text = text.replace(k, v)
        # Final fallback: replace any remaining non-latin1 chars
        result = []
        for ch in text:
            try:
                ch.encode('latin-1')
                result.append(ch)
            except UnicodeEncodeError:
                result.append('?')
        return ''.join(result)

        # Título principal
        self.set_text_color(255, 255, 255)
        self.set_font("Helvetica", "B", 28)
        self.set_xy(20, 145)
        self.cell(170, 14, "Gestor Financiero", align="C")
        self.set_font("Helvetica", "B", 20)
        self.set_xy(20, 162)
        self.cell(170, 12, "Portafolio Intel", align="C")

        # Línea decorativa
        self.set_draw_color(59, 130, 246)
        self.set_line_width(0.8)
        self.line(60, 185, 150, 185)

        # Subtítulo
        self.set_font("Helvetica", "", 13)
        self.set_text_color(180, 200, 230)
        self.set_xy(20, 195)
        self.cell(170, 8, "Informe Estratégico del Producto", align="C")

        # Descripción
        self.set_font("Helvetica", "", 10)
        self.set_text_color(140, 160, 190)
        self.set_xy(30, 210)
        self.multi_cell(150, 6,
            "Análisis completo de funcionalidades, arquitectura,\n"
            "comparativa de mercado, seguridad, roadmap\n"
            "y beneficios para el usuario.",
            align="C"
        )

        # Fecha y versión
        self.set_font("Helvetica", "I", 10)
        self.set_text_color(100, 120, 150)
        self.set_xy(20, 245)
        self.cell(170, 8, "Versión del informe: Agosto 2026", align="C")
        self.set_xy(20, 255)
        self.cell(170, 8, "Documento de referencia interna", align="C")

        # Barra inferior
        self.set_fill_color(59, 130, 246)
        self.rect(0, 289, 210, 8, "F")

    def indice(self):
        self.add_page()
        self.set_font("Helvetica", "B", 22)
        self.set_text_color(15, 23, 42)
        self.cell(0, 12, "Índice", ln=True)
        self.ln(4)
        self.set_draw_color(59, 130, 246)
        self.set_line_width(0.6)
        self.line(10, self.get_y(), 80, self.get_y())
        self.ln(8)

        sections = [
            ("1", "Resumen Ejecutivo"),
            ("2", "Visión General de la Aplicación"),
            ("3", "Funcionalidades Principales"),
            ("3.1", "   Canvas Local de Análisis"),
            ("3.2", "   Dashboard Autenticado y Supabase"),
            ("3.3", "   Comparación de Plataformas"),
            ("3.4", "   Módulo de Criptomonedas y FIFO"),
            ("3.5", "   Análisis Financiero y Salud Empresa"),
            ("3.6", "   Generación de Informes PDF y CSV"),
            ("3.7", "   Integración con Power BI"),
            ("3.8", "   Navegación Lateral y Espacios"),
            ("4", "Arquitectura Técnica"),
            ("4.1", "   Stack Tecnológico"),
            ("4.2", "   Seguridad y Privacidad"),
            ("4.3", "   Motor de Cálculo FIFO"),
            ("4.4", "   Protección contra Inyección CSV"),
            ("5", "Comparativa con el Mercado"),
            ("6", "Hoja de Ruta y Mejoras Futuras"),
            ("7", "Análisis de Seguridad y Auditoría"),
            ("8", "Beneficios para el Usuario"),
            ("8.1", "   Para Usuarios Noveles"),
            ("8.2", "   Para Usuarios Expertos"),
            ("9", "Modelos Tributarios y Fiscalidad Cripto"),
            ("10", "Diseño del Agente IA Financiero"),
            ("11", "Conclusiones"),
            ("12", "Palabras Finales"),
            ("13", "Referencias"),
        ]

        for num, title in sections:
            self.set_font("Helvetica", "B" if "." not in num else "", 11)
            self.set_text_color(15, 23, 42)
            indent = 5 if "." in num else 0
            self.set_x(10 + indent)
            self.cell(0, 7, self.safe_text(f"{num}  {title}"), ln=True)

    def section_title(self, num, title):
        self.ln(4)
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(15, 23, 42)
        self.cell(0, 10, self.safe_text(f"{num}. {title}"), ln=True)
        self.set_draw_color(59, 130, 246)
        self.set_line_width(0.5)
        self.line(10, self.get_y(), 100, self.get_y())
        self.ln(4)

    def subsection_title(self, num, title):
        self.ln(2)
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(59, 130, 246)
        self.cell(0, 8, self.safe_text(f"{num} {title}"), ln=True)
        self.ln(2)

    def body_text(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 5.5, self.safe_text(text))
        self.ln(2)

    def bold_text(self, text):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 5.5, self.safe_text(text))
        self.ln(1)

    def italic_text(self, text):
        self.set_font("Helvetica", "I", 10)
        self.set_text_color(80, 80, 80)
        self.multi_cell(0, 5.5, self.safe_text(text))
        self.ln(2)

    def highlight_box(self, text):
        self.set_fill_color(240, 245, 255)
        self.set_draw_color(59, 130, 246)
        x = self.get_x()
        y = self.get_y()
        self.set_font("Helvetica", "", 9)
        self.set_text_color(30, 60, 100)
        self.multi_cell(180, 5, self.safe_text(text), border=1, fill=True)
        self.ln(3)

    def bullet_point(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(40, 40, 40)
        x = self.get_x()
        self.set_x(15)
        self.cell(5, 5.5, "-")
        self.multi_cell(0, 5.5, self.safe_text(text))
        self.ln(1)

    def table_row(self, cols, widths, bold=False):
        self.set_font("Helvetica", "B" if bold else "", 9)
        if bold:
            self.set_fill_color(230, 238, 255)
            self.set_text_color(15, 23, 42)
        else:
            self.set_fill_color(250, 250, 255)
            self.set_text_color(40, 40, 40)
        h = 6
        for i, (col, w) in enumerate(zip(cols, widths)):
            self.cell(w, h, self.safe_text(col), border=1, fill=True)
        self.ln(h)


def generar_informe():
    pdf = InformeFinanciero()
    pdf.set_title("Portafolio Intel — Gestor Financiero: Informe Estratégico")
    pdf.set_author("Manus AI")

    # ==================== PORTADA ====================
    pdf.portada()

    # ==================== ÍNDICE ====================
    pdf.indice()

    # ==================== 1. RESUMEN EJECUTIVO ====================
    pdf.add_page()
    pdf.section_title("1", "Resumen Ejecutivo")

    pdf.body_text(
        "Portafolio Intel — Gestor Financiero es una aplicación web diseñada para ofrecer a personas "
        "físicas y profesionales una herramienta completa de gestión financiera personal, con un enfoque "
        "diferenciador en privacidad, trazabilidad y control total sobre los datos. A diferencia de las "
        "soluciones cloud tradicionales que centralizan la información en servidores externos, este producto "
        "combina dos modos de operación: un Canvas local que procesa archivos únicamente en la memoria del "
        "navegador sin enviar datos a ningún servidor, y un Dashboard autenticado respaldado por Supabase "
        "con políticas de seguridad a nivel de fila (RLS)."
    )

    pdf.body_text(
        "El sistema permite importar archivos CSV y XLSX, aplicar cálculos deterministas de FIFO para "
        "criptomonedas, generar borradores fiscales revisables, producir informes PDF y CSV con fórmulas "
        "y cobertura visibles, y ejecutar análisis financieros explicable con métricas de salud empresarial, "
        "DCF, scoring y valores de referencia. La aplicación no emite recomendaciones de inversión, no "
        "ejecuta órdenes y no promete declaraciones fiscales oficiales: su filosofía es convertir datos en "
        "información revisable, auditada y transparente."
    )

    pdf.highlight_box(
        "Diferenciador clave: Gestor financiero compite en confianza, trazabilidad y control, "
        "no en amplitud de conectores. Cada cifra exhibe origen, fecha de corte, cobertura, divisa, "
        "versión de cálculo y advertencias."
    )

    # ==================== 2. VISIÓN GENERAL ====================
    pdf.section_title("2", "Visión General de la Aplicación")

    pdf.body_text(
        "Gestor financiero está construido con Next.js 16.3.1, React 19, TypeScript y Supabase. "
        "La interfaz presenta una navegación lateral persistente que reúne las siguientes áreas funcionales:"
    )

    areas = [
        "Resumen: panel general con posiciones y métricas consolidadas.",
        "Cartera: detalle de instrumentos, transacciones y snapshots.",
        "Plataformas: comparativa de rendimiento realizado por fuente de datos.",
        "Criptomonedas: módulo FIFO para operaciones con activos digitales.",
        "Alertas: notificaciones basadas en reglas definidas por el usuario.",
        "Informes: generación de documentos PDF y exportaciones CSV.",
        "Fuentes: configuración de conectores de datos (Google Sheets, APIs).",
        "Análisis: módulo de scoring, DCF, indicadores técnicos y riesgo.",
        "Canvas: espacio de análisis local sin cuenta ni persistencia.",
        "Salud Empresa: evaluación manual de fundamentales con tooltips explicativos."
    ]
    for a in areas:
        pdf.bullet_point(a)

    pdf.body_text(
        "El producto se estructura en dos contextos claramente diferenciados:"
    )
    pdf.bold_text(
        "• Modo Local (Canvas): procesamiento íntegro en el navegador. No se envían datos a "
        "Supabase, IA ni almacenamiento persistente. Ideal para análisis ad hoc y privacidad total."
    )
    pdf.bold_text(
        "• Modo Autenticado (Dashboard): espacio colaborativo con organizaciones, carteras, "
        "alertas y datos persistentes bajo políticas RLS de Supabase."
    )

    # ==================== 3. FUNCIONALIDADES PRINCIPALES ====================
    pdf.section_title("3", "Funcionalidades Principales")

    # 3.1 Canvas Local
    pdf.subsection_title("3.1", "Canvas Local de Análisis")
    pdf.body_text(
        "El Canvas local es el espacio insignia de privacidad del producto. Permite a cualquier persona "
        "cargar un archivo CSV o XLSX sin crear una cuenta, asignar columnas manualmente, aplicar filtros "
        "cruzados y obtener KPIs, gráficos de área/donut/barras, un mapa de exposición relativo, una tabla "
        "editable con validación de celdas y conclusiones deterministas."
    )
    pdf.body_text(
        "Características principales del Canvas:"
    )
    canvas_features = [
        "Importación de archivos CSV/XLSX/JSON con límite de 15 MB y 100.000 filas.",
        "Mapeo interactivo de columnas con vista previa.",
        "Filtros cruzados que no alteran el conjunto original.",
        "KPIs calculados en un Web Worker para no bloquear la interfaz.",
        "Gráficos de área, donut, barras y mapa de exposición relativo.",
        "Tabla editable con validación de fechas ISO/europeas, importes y texto.",
        "Edición por selección y recálculo automático del análisis.",
        "Guardado y carga de sesiones JSON versionadas (sin localStorage).",
        "Exportación CSV con protección contra inyección de fórmulas.",
        "Conclusión ejecutiva determinista sin dependencia de IA."
    ]
    for f in canvas_features:
        pdf.bullet_point(f)

    pdf.highlight_box(
        "Privacidad: el Canvas local no genera solicitudes a Supabase, IA, Google Sheets "
        "ni dominios de análisis externos. Los datos se destruyen al recargar la página."
    )

    # 3.2 Dashboard Autenticado
    pdf.subsection_title("3.2", "Dashboard Autenticado y Supabase")
    pdf.body_text(
        "El dashboard autenticado opera sobre una base de datos Supabase con un esquema versionado que "
        "incluye: organizaciones, membresías, carteras, instrumentos, fuentes, sincronizaciones, "
        "transacciones, posiciones, cotizaciones, snapshots, reglas de alertas, alertas, informes, "
        "auditoría y análisis. Cada tabla está protegida por políticas RLS (Row Level Security) que "
        "aislan los datos por organización."
    )
    pdf.body_text(
        "El dashboard consolidada posiciones, transacciones, alertas, fuentes, análisis e informes. "
        "Se implementó una suscripción Realtime por organization_id para actualizar la interfaz de "
        "forma reactiva cuando cambian los datos en el servidor. Sin embargo, la recarga integral "
        "ante cada evento requiere optimización (coalescencia, cancelación y paginación)."
    )

    # 3.3 Comparación de Plataformas
    pdf.subsection_title("3.3", "Comparación de Plataformas")
    pdf.body_text(
        "El módulo de plataformas calcula el resultado realizado por fuente de datos utilizando lotes "
        "FIFO. Permite al usuario comparar el rendimiento entre diferentes brókeres o exchanges, "
        "distinguiendo dónde se materializaron resultados con coste conocido."
    )
    pdf.body_text(
        "Este módulo ofrece:"
    )
    plat_features = [
        "Ingresos, coste dispuesto, resultado y rentabilidad realizada por fuente.",
        "Consumo atómico de lotes que impide que una venta no trazable distorsione ventas posteriores.",
        "Bloqueo automático cuando una venta supera el inventario disponible.",
        "No recomienda mover capital ni mezcla precios de mercado externos no licenciados.",
        "Advertencias claras cuando falta coste trazable para una operación."
    ]
    for f in plat_features:
        pdf.bullet_point(f)

    # 3.4 Criptomonedas y FIFO
    pdf.subsection_title("3.4", "Módulo de Criptomonedas y Cálculo FIFO")
    pdf.body_text(
        "El módulo de criptomonedas procesa un archivo CSV local con fecha, tipo de operación, activos "
        "entregados/recibidos, valores en EUR, comisiones y plataforma. El motor reconstruye lotes "
        "FIFO por activo y genera un borrador CSV revisable para la declaración de la Renta."
    )
    pdf.body_text(
        "Funcionalidades clave del módulo cripto:"
    )
    crypto_features = [
        "Reconstrucción de inventario FIFO por activo con trazabilidad de lotes.",
        "Tratamiento de compras, ventas y permutas atómicas.",
        "Bloqueo de operaciones con fechas de calendario imposibles (ej: 2026-99-99).",
        "Validación de fechas ISO y verificación de calendario real con Date.UTC.",
        "Marca de revisión para ventas/permutas sin inventario suficiente.",
        "No crea lotes ficticios ni estima datos faltantes.",
        "Generación de CSV de borrador revisable, no declaración fiscal oficial.",
        "Exportación con protección contra inyección de fórmulas."
    ]
    for f in crypto_features:
        pdf.bullet_point(f)

    pdf.italic_text(
        "Nota: La aplicación no presenta el XML del Modelo 100 hasta implementar y validar "
        "el formato oficial vigente, la identidad del declarante y las reglas del ejercicio."
    )

    # 3.5 Análisis Financiero y Salud Empresa
    pdf.subsection_title("3.5", "Análisis Financiero y Salud Empresa")
    pdf.body_text(
        "El módulo de análisis financiero agrupa análisis de riesgo, técnico, DCF y scoring únicamente "
        "cuando existen entradas trazables. La sección Salud Empresa está deliberadamente separada: "
        "pide nombre, fecha, divisa, fuente y período, y calcula valoración, rentabilidad, márgenes, "
        "solvencia y caja con los valores introducidos manualmente en el navegador."
    )

    pdf.bold_text("Capacidades del motor de análisis:")
    analysis_features = [
        "Score ponderado con seis factores (20/20/20/15/15/10) que requiere al menos 60% de datos.",
        "DCF con diez flujos de caja libre proyectados, descuento y valor terminal.",
        "Indicadores técnicos: SMA 20/50/200, MACD, RSI 14, Bandas de Bollinger y ATR 14.",
        "Métricas de riesgo: volatilidad anualizada, máximo drawdown y Sharpe.",
        "Kelly conservador con escenario documentado explícito.",
        "Tooltips que muestran fórmula, objetivo, entradas y origen de cada métrica.",
        "Estados Calculable, Falta información y No significativo para cada ratio.",
        "Bloqueo del DCF cuando WACC ≤ crecimiento terminal o datos incompletos.",
        "Exportación PDF local con @react-pdf/renderer y CSV con metadatos de cobertura."
    ]
    for f in analysis_features:
        pdf.bullet_point(f)

    # 3.6 Informes PDF y CSV
    pdf.subsection_title("3.6", "Generación de Informes PDF y CSV")
    pdf.body_text(
        "La aplicación genera informes PDF y CSV directamente en el navegador sin subir datos al servidor. "
        "El botón de descarga convierte el documento a Blob, crea una URL temporal, descarga el fichero "
        "y revoca la URL. La exportación se habilita solo si hay cobertura superior a cero."
    )
    pdf.body_text("Estructura del informe PDF de Salud Empresa:")
    pdf_struct = [
        "Cabecera: empresa, fecha, divisa, fuente y cobertura.",
        "Métricas por categoría: Valoración, Rentabilidad, Márgenes, Solvencia, Caja.",
        "Sección de Oportunidad a Revisar con evidencia por criterio.",
        "Señales de salud con lectura orientativa de deuda e intereses.",
        "Advertencias, descargo de responsabilidad y límites del análisis."
    ]
    for f in pdf_struct:
        pdf.bullet_point(f)

    pdf.body_text(
        "El CSV contiene contexto, cobertura, métricas, fórmulas, estado, advertencias y evidencia. "
        "Se añade UTF-8 BOM y se neutralizan celdas que comienzan por =, +, - o @."
    )

    # 3.7 Power BI
    pdf.subsection_title("3.7", "Integración con Power BI")
    pdf.body_text(
        "El Canvas local puede descargar el subconjunto filtrado como CSV y un manifiesto JSON con "
        "mapeo y filtros. Esta interoperabilidad permite al usuario llevar datos a Power BI Desktop "
        "sin enviar tokens al navegador. Power BI Embedded queda explícitamente fuera del frontend "
        "actual: debería construirse con backend, token de corta duración, RLS/OLS y capacidad adecuada."
    )

    # 3.8 Navegación y Espacios
    pdf.subsection_title("3.8", "Navegación Lateral y Espacios de Trabajo")
    pdf.body_text(
        "La navegación lateral persistente reúne resumen, cartera, plataformas, criptomonedas, alertas, "
        "informes, fuentes, análisis, Canvas y Salud empresa. Esta decisión de diseño evita que la "
        "persona usuaria deba regresar al inicio para cambiar de contexto, lo cual es especialmente "
        "útil en una herramienta de trabajo financiero."
    )
    pdf.body_text(
        "El Canvas local se presenta como una ruta distinta accesible sin cuenta y sin persistencia. "
        "Un aviso visible explica que los datos se destruyen al recargar o cerrar. Las sesiones JSON "
        "permiten reanudar análisis o compartir copias de trabajo controladas."
    )

    # ==================== 4. ARQUITECTURA TÉCNICA ====================
    pdf.section_title("4", "Arquitectura Técnica")

    pdf.subsection_title("4.1", "Stack Tecnológico")
    pdf.body_text(
        "Gestor financiero utiliza un stack moderno y abierto:"
    )
    stack = [
        "Frontend: Next.js 16.3.1 con React 19 y TypeScript.",
        "Backend: Supabase (PostgreSQL) con Edge Functions para lógica de servidor.",
        "Autenticación: Supabase Auth con JWT y sesiones persistidas por SDK.",
        "Persistencia: PostgreSQL con RLS a nivel de fila por organización.",
        "Realtime: Suscripciones Supabase Realtime por organization_id.",
        "Cálculo local: Web Workers para no bloquear el hilo principal.",
        "Exportación: @react-pdf/renderer para PDF, utilidad csv-security.ts para CSV.",
        "Seguridad: Cabeceras HTTP (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy)."
    ]
    for s in stack:
        pdf.bullet_point(s)

    pdf.subsection_title("4.2", "Seguridad y Privacidad")
    pdf.body_text(
        "La aplicación implementa múltiples capas de seguridad:"
    )
    security = [
        "RLS (Row Level Security): aislamiento de datos por organización a nivel de base de datos.",
        "Edge Functions: validación de JWT, autorización server-side y gestión de secretos.",
        "Canvas local: sin transmisión de datos, sin localStorage ni persistencia automática.",
        "Protección CSV: utilidad csv-security.ts que neutraliza inyección de fórmulas OWASP.",
        "Validación de fechas: verificación de calendario real para evitar fechas imposibles.",
        "Límites de archivos: 15 MB y 100.000 filas para Canvas, 15 MB y 50.000 para cripto.",
        "Web Worker: procesamiento asíncrono que preserva la respuesta de la interfaz.",
        "Cabeceras HTTP: X-Content-Type-Options, X-Frame-Options, CSP en modo Report-Only.",
        "Sin datos reales en demos: todas las demostraciones usan datos ficticios."
    ]
    for s in security:
        pdf.bullet_point(s)

    pdf.subsection_title("4.3", "Motor de Cálculo FIFO")
    pdf.body_text(
        "El motor FIFO es el corazón del módulo de criptomonedas y la comparación de plataformas. "
        "Su diseño se basa en principios de transparencia y trazabilidad:"
    )
    fifo_principles = [
        "Cada lote consume de forma atómica: una venta no puede distorsionar ventas posteriores.",
        "Las fechas se validan con patrón ISO y verificación de calendario real (Date.UTC).",
        "Las permutas se tratan como transmisión del activo entregado y creación del activo recibido.",
        "El inventario solo se modifica cuando la operación es completamente válida.",
        "Las operaciones inválidas se conservan como incidencias revisables sin crear lotes ficticios.",
        "El borrador generado no es una declaración fiscal: requiere justificantes y revisión profesional.",
        "La aplicación documentation la integración de pérdidas patrimoniales según la normativa AEAT."
    ]
    for f in fifo_principles:
        pdf.bullet_point(f)

    pdf.subsection_title("4.4", "Protección contra Inyección CSV")
    pdf.body_text(
        "Siguiendo las recomendaciones de OWASP sobre CSV Injection, la aplicación implementa una "
        "utilidad centralizada csv-security.ts que neutraliza campos que podrían ser interpretados "
        "como fórmulas por las hojas de cálculo. Los textos que empiezan por =, +, - o @ se exportan "
        "precedidos de una tabulación dentro de una celda entrecomillada. Los valores numéricos "
        "conservan su condición numérica para permitir cálculos en la hoja de destino."
    )
    pdf.body_text(
        "Esta protección se aplica consistentemente al Canvas local, al módulo de Criptomonedas y "
        "a la exportación de Salud Empresa."
    )

    # ==================== 5. COMPARATIVA CON EL MERCADO ====================
    pdf.section_title("5", "Comparativa con el Mercado")

    pdf.body_text(
        "Gestor financiero se posiciona en un nicho diferenciado dentro del ecosistema de herramientas "
        "de gestión financiera. A continuación se presenta una comparación funcional con las principales "
        "alternativas disponibles:"
    )

    # Tabla comparativa
    pdf.set_font("Helvetica", "B", 9)
    widths = [32, 48, 48, 48]
    pdf.table_row(["Alternativa", "Ventajas", "Limitaciones", "Encaje de usuario"], widths, bold=True)
    pdf.set_font("Helvetica", "", 8)
    rows = [
        ["Sharesight", "Amplia madurez de conectores y reporting de inversión.", "Modelo cloud con límites por plan y menor control local.", "Inversor que prioriza automatización."],
        ["Portfolio Performance", "Fuerte en métricas de rendimiento (TTWROR/IRR) y propiedad local del fichero.", "Menor experiencia web colaborativa; requiere configuración manual.", "Usuario técnico que prioriza control."],
        ["Finary", "Experiencia móvil, automatización y cobertura patrimonial amplia.", "Centraliza datos en servicio externo y depende de conectores.", "Usuario que busca comodidad."],
        ["getquin", "Actualización de mercado, benchmarking y capa social.", "Comunidad puede añadir ruido; depende de datos cloud.", "Inversor que valora seguimiento activo."],
        ["Kubera", "Cobertura de estructuras y activos complejos; colaboración.", "Precio premium; amplio perímetro de datos conectados.", "Patrimonio multiactivo complejo."],
        ["Gestor financiero", "Canvas local, RLS organizativo, FIFO cripto, análisis explicable.", "Sin conectores activos, TWR/MWR productivo ni app móvil.", "Usuario que prioriza control y privacidad."],
    ]
    for row in rows:
        pdf.table_row(row, widths)

    pdf.ln(4)
    pdf.body_text(
        "La ventaja competitiva de Gestor financiero radica en combinar un Canvas local sin cuenta "
        "con cálculo local revisable, edición bidireccional de datos y una frontera explícita entre "
        "privacidad local y datos persistentes. Las alternativas consolidadas son hoy más completas "
        "en agregación automática, soporte de entidades, datos de mercado y fiscalidad industrializada."
    )
    pdf.body_text(
        "El salto cualitativo no consiste en copiar todas sus funciones, sino en cerrar primero "
        "RLS/Realtime y construir una plataforma de datos trazable, conciliada y controlada por el usuario."
    )

    # ==================== 6. HOJA DE RUTA ====================
    pdf.section_title("6", "Hoja de Ruta y Mejoras Futuras")

    pdf.body_text(
        "La secuencia recomendada prioriza la confianza de cada cifra antes de añadir nuevas "
        "funcionalidades. Las mejoras se organizan en olas:"
    )

    waves = [
        ("Ola 0 — Contrato de Calidad y Procedencia",
         "Todo KPI debe exhibir as_of, fuente, divisa, cobertura, versión de cálculo y advertencias. "
         "Un KPI sin datos críticos se degrada a parcial/no disponible. No requiere fuentes externas."),
        ("Ola 1 — TWR, MWR/XIRR y Puente de Atribución",
         "Separar rendimiento económico de aportaciones/retiros. Pruebas deterministas de flujos y "
         "conciliación entre valor inicial y final. Requiere definir moneda base, costes e impuestos."),
        ("Ola 2 — Exposición, Concentración y Riesgo",
         "Peso por activo/emisor/sector/país/divisa, drawdown y escenarios explícitos. "
         "Sin clasificar no entra silenciosamente en una conclusión."),
        ("Ola 3 — Importación Confiable y Conectores R/O",
         "Menos trabajo manual sin sacrificar consentimiento. Vista previa, deduplicación, "
         "mapeo versionado, secretos solo backend y logs de auditoría."),
        ("Ola 4 — Alertas y Cola de Decisiones",
         "Cada alerta explica insumos, regla, evaluación y estado. "
         "Ráfagas Realtime coalescidas; ninguna notificación externa sin consentimiento."),
        ("Ola 5 — Informes Reproducibles y Colaboración",
         "Evidencia, hipótesis, resultado posterior y reparto de responsabilidades. "
         "Informe con fuentes, cobertura, TWR/MWR y anexo de exclusiones."),
        ("Ola 6 — Piloto IA Solo Lectura",
         "Explicaciones citadas sobre datos autorizados y fuentes licenciadas. "
         "RLS por organización/cartera, consentimiento, fecha de corte y auditoría.")
    ]

    for title, desc in waves:
        pdf.bold_text(title)
        pdf.body_text(desc)

    # ==================== 7. ANÁLISIS DE SEGURIDAD ====================
    pdf.section_title("7", "Análisis de Seguridad y Auditoría")

    pdf.body_text(
        "Se realizó una auditoría exhaustiva de seguridad, privacidad, accesibilidad y robustez "
        "que cubrió el código fuente, compilación, pruebas y recorridos con datos ficticios. "
        "Los hallazgos se clasificaron en Alto, Medio, Bajo e Informativo."
    )

    pdf.bold_text("Hallazgos corregidos:")
    pdf.bullet_point(
        "AUD-2026-01 (Alto): Inyección de fórmulas CSV. Se creó csv-security.ts con escapeSpreadsheetCell "
        "y csvFromRows. Los textos que empiezan por =, +, - o @ se exportan con tabulación protectora."
    )
    pdf.bullet_point(
        "AUD-2026-02 (Alto): Fecha cripto imposible. Se añadió normalizeCryptoIsoDate con verificación "
        "de calendario real. Fechas como 2026-99-99 o 2026-02-30 son rechazadas."
    )

    pdf.bold_text("Hallazgos medios pendientes:")
    pdf.bullet_point(
        "AUD-2026-03: Realtime desencadena recargas completas sin coalescencia ni versionado."
    )
    pdf.bullet_point(
        "AUD-2026-04: Bootstrap de organización no transaccional; puede dejar registros parciales."
    )
    pdf.bullet_point(
        "AUD-2026-05: DCF no rechaza explícitamente crecimiento terminal no finito (corregido localmente)."
    )
    pdf.bullet_point(
        "AUD-2026-06: Cabeceras HTTP defensivas no verificadas en el despliegue de producción."
    )
    pdf.bullet_point(
        "AUD-2026-07: Pico de memoria en importaciones/restauraciones locales grandes."
    )
    pdf.bullet_point(
        "AUD-2026-08: connection_config podría evolucionar hacia un almacén de secretos."
    )

    pdf.bold_text("Controles verificados correctamente:")
    verified = [
        "Secretos locales: .gitignore ignora .env*; claves identificadas por nombre sin lectura de valores.",
        "Cliente Supabase: solo usa URL y clave publicable NEXT_PUBLIC; el rol de servicio está en Edge Functions.",
        "Edge Function: rechaza métodos distintos de POST, exige Authorization y limita origen.",
        "RLS declarada: tablas con RLS y helpers privados security definer con search_path explícito.",
        "Canvas privado: sin localStorage, Supabase ni IA por diseño; Worker con requestId.",
        "Dependencias: 0 vulnerabilidades de producción según npm audit.",
        "Accesibilidad: labels, botones con nombre explícito, mensajes role=status/alert y foco visible."
    ]
    for v in verified:
        pdf.bullet_point(v)

    # ==================== 8. BENEFICIOS ====================
    pdf.section_title("8", "Beneficios para el Usuario")

    pdf.subsection_title("8.1", "Para Usuarios Noveles")
    pdf.body_text(
        "Para una persona que empieza en el mundo de las finanzas, el principal valor no es un "
        "indicador sofisticado sino un recorrido que reduce ambigüedad: cargar un archivo CSV, "
        "asignar columnas, ver qué datos se usan, filtrar sin perder el conjunto original y "
        "entender por qué un ratio no se publica."
    )
    pdf.body_text("Beneficios específicos para usuarios nuevos:")
    novel_benefits = [
        "Las demos usan datos ficticios, permitiendo aprender sin subir un extracto real.",
        "Las ayudas de fórmula explican el significado de cada métrica en lenguaje sencillo.",
        "Los estados Calculable, Falta información y No significativo evitan errores de interpretación.",
        "El borrador cripto con FIFO muestra evidencia y advertencias en lugar de conclusiones automáticas.",
        "La navegación lateral reduce pasos entre secciones relacionadas.",
        "Los tooltips de Salud Empresa muestran fórmula, objetivo, entradas y origen.",
        "La interfaz no asume conocimientos previos de inversión o fiscalidad."
    ]
    for b in novel_benefits:
        pdf.bullet_point(b)

    pdf.subsection_title("8.2", "Para Usuarios Expertos")
    pdf.body_text(
        "Para una persona con experiencia, el valor diferencial está en la separación de dominios: "
        "análisis ad hoc local, entorno organizativo con RLS, FIFO atómico, resultados realizados "
        "por plataforma, exportación filtrada para Power BI y anexos PDF/CSV que conservan fórmula "
        "y cobertura."
    )
    pdf.body_text("Beneficios específicos para usuarios expertos:")
    expert_benefits = [
        "Posibilidad de revisar supuestos, detectar datos no conciliados y transportar resultados a herramientas externas.",
        "Exportación CSV con metadatos completos para análisis en Python, R o Excel avanzado.",
        "Motor FIFO con trazabilidad de lotes y verificación de calendario para auditoría.",
        "Protección contra inyección CSV que cumple las recomendaciones OWASP.",
        "Análisis DCF con validación de entradas y bloqueo de supuestos no válidos.",
        "Integración preparatoria con Power BI para análisis externo sin exponer tokens.",
        "Arquitectura extensible que permite evolucionar hacia TWR/MWR y puente de atribución."
    ]
    for b in expert_benefits:
        pdf.bullet_point(b)

    # ==================== 9. FISCALIDAD ====================
    pdf.section_title("9", "Modelos Tributarios y Fiscalidad Cripto")

    pdf.body_text(
        "La aplicación aborda la fiscalidad criptomonéa de forma prudente y documentada. El motor "
        "FIFO genera datos trazables para la declaración de la Renta, pero no sustituye la revisión "
        "de un asesor tributario ni presenta declaraciones oficiales automáticamente."
    )

    pdf.body_text("Modelos tributarios relevantes considerados en el diseño:")
    tax_models = [
        "Modelo 714 (Impuesto sobre el Patrimonio): instantánea patrimonial fechada a 31 de diciembre.",
        "Modelo 718 (Impuesto Temporal de Solidaridad de Grandes Fortunas): reutilización de la instantánea patrimonial.",
        "Modelo 172/173 (Saldos y operaciones con monedas virtuales): orientado a proveedores, no a inversores particulares.",
        "Modelo 130 (Pago fraccionado IRPF): solo si la operativa constituye actividad económica.",
        "Modelo 303 (IVA): condicionado a la existencia de actividad sujeta a IVA.",
        "Modelo 721 (Bienes en el extranjero): módulo separado para cartera internacional."
    ]
    for t in tax_models:
        pdf.bullet_point(t)

    pdf.body_text(
        "La documentación de la AEAT indica que las pérdidas patrimoniales de transmisiones se "
        "integran en la base del ahorro con otras ganancias/pérdidas y, si queda saldo negativo, "
        "se compensan en los términos legales con rendimientos positivos del capital mobiliario."
    )

    pdf.highlight_box(
        "La aplicación no habilita presentación fiscal oficial sin un diseño de registro validado, "
        "datos completos y revisión profesional. El borrador generado es una herramienta de trabajo, "
        "no una declaración ante la AEAT."
    )

    # ==================== 10. AGENTE IA ====================
    pdf.section_title("10", "Diseño del Agente IA Financiero")

    pdf.body_text(
        "Se evaluó una integración de asistente IA para responder consultas sobre datos propios "
        "autorizados y información financiera externa actualizada. El diseño se rige por principios "
        "estrictos de seguridad y transparencia."
    )

    pdf.bold_text("Principios de diseño del agente:")
    agent_principles = [
        "Solo herramientas de solo lectura: el modelo no puede modificar datos ni ejecutar operaciones.",
        "Backend exclusivo: el agente se ejecuta en Edge Functions, nunca en el navegador.",
        "RLS por organización: cada consulta obedece las políticas de aislamiento de datos.",
        "Consentimiento explícito: se requiere autorización previa para acceder a datos de cartera.",
        "Fuentes autorizadas: solo SEC EDGAR, BCE y proveedores con licencia verificada.",
        "Salida estructurada: cada respuesta incluye citas, cobertura, advertencias y clasificación.",
        "Sin SQL libre: las herramientas están predefinidas con JSON Schema estricto.",
        "Auditoría completa: se registra usuario, herramienta, fuente, cobertura y latencia.",
        "Sin recomendaciones personalizadas: se muestran datos, supuestos y riesgos."
    ]
    for p in agent_principles:
        pdf.bullet_point(p)

    pdf.body_text(
        "El agente diferencia explícitamente entre dato reportado (de filings o proveedores), "
        "dato calculado (por funciones deterministas versionadas) y supuesto declarado (aportado "
        "o aprobado por el usuario). Esta separación es fundamental para mantener la integridad "
        "de la información financiera."
    )

    # ==================== 11. CONCLUSIONES ====================
    pdf.section_title("11", "Conclusiones")

    pdf.body_text(
        "Gestor financiero ya ofrece una base diferenciada en el ecosistema de herramientas de "
        "gestión financiera personal. Sus principales fortalezas son:"
    )
    conclusions = [
        "Privacidad real: el Canvas local procesa datos únicamente en el navegador sin enviar información a servicios externos.",
        "Trazabilidad: cada métrica, ratio y cálculo conserva origen, fórmula, cobertura y advertencias.",
        "Fiscalidad prudente: el módulo FIFO genera borradores revisables sin prometer declaraciones oficiales.",
        "Seguridad por diseño: RLS, Edge Functions, validación de fechas, protección CSV y límites de archivos.",
        "Arquitectura extensible: separación clara entre modo local y conectado, preparada para evolucionar.",
        "Transparencia: tooltips, estados de calidad y advertencias visibles en cada sección.",
        "Responsabilidad: la aplicación nunca emite recomendaciones de inversión ni ejecuta órdenes."
    ]
    for c in conclusions:
        pdf.bullet_point(c)

    pdf.body_text(
        "Frente a herramientas maduras como Sharesight, Portfolio Performance o Kubera, Gestor "
        "financiero no debe competir todavía en amplitud de conectores ni prometer rendimiento en "
        "tiempo real. Debe competir en confianza, trazabilidad y control."
    )
    pdf.body_text(
        "El salto cualitativo no es añadir otra tarjeta de KPI, sino establecer el contrato de "
        "datos, introducir rendimiento neto correctamente y enlazar toda alerta, informe o explicación "
        "a una fuente, fecha, método y cobertura. Con esa base, los conectores, Power BI, informes "
        "de cartera y un asistente IA podrán ampliar productividad sin degradar seguridad ni inducir "
        "decisiones no fundamentadas."
    )

    # ==================== 12. PALABRAS FINALES ====================
    pdf.section_title("12", "Palabras Finales")

    pdf.body_text(
        "Este informe describe un producto que ha elegido un camino diferente al de la mayoría de "
        "las herramientas financieras disponibles en el mercado. Mientras otras plataformas compiten "
        "por automatizar la mayor cantidad de conexiones y funcionalidades, Gestor financiero prioriza "
        "que cada dato tenga origen verificable, cada cálculo sea reproducible y cada usuario mantenga "
        "el control sobre su información."
    )
    pdf.body_text(
        "La filosofía del producto se resume en una premisa: la utilidad de una herramienta financiera "
        "no se mide por cuántos botones ofrece, sino por cuánta confianza puede generar en la persona "
        "que la utiliza. Un número sin contexto no es información; es ruido. Un ratio sin fórmula no "
        "es conocimiento; es una opinión disfrazada de dato."
    )
    pdf.body_text(
        "Gestor financiero busca ser la herramienta que responda siempre a cinco preguntas: "
        "¿de dónde viene este dato?, ¿cuándo se calculó?, ¿qué cobertura tiene?, "
        "¿en qué moneda está expresado? y ¿qué versión del cálculo produjo este resultado? "
        "Si esas cinco preguntas tienen respuesta, el usuario puede tomar decisiones con confianza."
    )
    pdf.body_text(
        "El camino por delante incluye cerrar la seguridad del modo autenticado, implementar "
        "métricas de rendimiento neto (TWR/MWR-XIRR), construir un puente de atribución explicable "
        "y, solo cuando la base de datos sea trazable y conciliada, activar conectores de mercado "
        "y un asistente IA de solo lectura. Cada paso debe ser verificable antes de dar el siguiente."
    )
    pdf.body_text(
        "La privacidad no es un eslogan en este producto: es una arquitectura. El modo local no "
        "envía datos porque su implementación no los transmite. El modo conectado no expone secretos "
        "porque su diseño los mantiene en el servidor. La diferencia entre ambas afirmaciones es la "
        "diferencia entre una promesa y una propiedad verificable."
    )
    pdf.body_text(
        "Para el usuario, ya sea principiante o experto, Gestor financiero ofrece algo que pocas "
        "herramientas pueden demostrar: la certeza de que los números que ve en pantalla son el "
        "resultado de un proceso transparente, documentado y sujeto a auditoría. Esa es, en última "
        "instancia, la mayor utilidad que una aplicación financiera puede ofrecer."
    )

    # ==================== 13. REFERENCIAS ====================
    pdf.section_title("13", "Referencias")

    refs = [
        "[1] SEC — Form 13F, advertencia de alcance y exactitud. https://www.sec.gov/",
        "[2] Sharesight — Portfolio tracker, integraciones y seguridad. https://www.sharesight.com/",
        "[3] Portfolio Performance — TTWROR, IRR, modelo XML y exportación. https://www.portfolio-performance.info/",
        "[4] Finary — Agregación patrimonial y declaraciones de seguridad. https://finary.com/",
        "[5] Empower — Portfolio tracking benefits. https://www.empower.com/",
        "[6] getquin — Portfolio tracker, rendimiento e importación. https://www.getquin.com/",
        "[7] Kubera — Seguimiento multiactivo e informes. https://www.kubera.com/",
        "[8] Ghostfolio — Privacy-first open-source wealth management. https://ghostfol.io/",
        "[9] CoinTracking — Crypto Tax Calculator & Portfolio Tracker. https://cointracking.info/",
        "[10] Koinly — Crypto Tax Calculator. https://koinly.io/",
        "[11] CFA Institute — Rates and Returns. https://www.cfainstitute.org/",
        "[12] ESMA — Cost of Investment Products. https://www.esma.europa.eu/",
        "[13] GIPS Standards Handbook for Firms. https://www.gipsstandards.org/",
        "[14] OWASP — CSV Injection. https://owasp.org/www-community/attacks/CSV_Injection",
        "[15] OWASP — Input Validation. https://cheatsheetseries.owasp.org/",
        "[16] OWASP — HTTP Security Response Headers. https://cheatsheetseries.owasp.org/",
        "[17] Supabase — Edge Functions. https://supabase.com/docs/guides/functions",
        "[18] Supabase — Row Level Security. https://supabase.com/docs/guides/database/postgres/row-level-security",
        "[19] Supabase — Realtime Authorization. https://supabase.com/docs/guides/realtime/authorization",
        "[20] AEAT — Modelo 172: Saldos en monedas virtuales. https://sede.agenciatributaria.gob.es/",
        "[21] AEAT — Modelo 173: Operaciones con monedas virtuales. https://sede.agenciatributaria.gob.es/",
        "[22] AEAT — Modelo 714: Impuesto sobre el Patrimonio. https://sede.agenciatributaria.gob.es/",
        "[23] AEAT — Integración y compensación de rentas en la base imponible del ahorro. https://sede.agenciatributaria.gob.es/",
        "[24] SEC — EDGAR Application Programming Interfaces. https://www.sec.gov/",
        "[25] Microsoft — Inspections overview, Dynamics 365 Field Service. https://learn.microsoft.com/",
        "[26] WCAG 2.2 — Target Size (Minimum). https://www.w3.org/",
        "[27] EDPB — Secure personal data. https://www.edpb.europa.eu/"
    ]
    for r in refs:
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(60, 60, 60)
        pdf.multi_cell(0, 4.5, pdf.safe_text(r))
        pdf.ln(1)

    # Guardar
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "finanzas_personales.pdf")
    pdf.output(output_path)
    print(f"PDF generado exitosamente: {output_path}")
    return output_path


if __name__ == "__main__":
    generar_informe()
