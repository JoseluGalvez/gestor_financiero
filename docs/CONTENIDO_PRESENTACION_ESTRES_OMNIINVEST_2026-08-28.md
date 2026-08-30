# Contenido — presentación ejecutiva de prueba de estrés OmniInvest

## Cover

**Prueba de estrés OmniInvest**  
**Escenario ficticio: caída uniforme del 20 %, controles de riesgo y diversificación general**  
Manus AI · 28 de agosto de 2026

## Slide 1

### Un escenario reproducible, no una previsión

- Cartera ficticia de 90.000,00 EUR en tres buckets declarados.
- Choque uniforme de −20,00 % limitado a 75.000,00 EUR de exposición valorada a mercado.
- No usa cotizaciones, cartera personal, proveedor, IA ni operación de mercado.
- Objetivo: probar sensibilidad, trazabilidad y manejo de cobertura.

## Slide 2

### El valor bajo estrés pasa de 90.000 a 75.000 EUR

- Renta variable ficticia: 50.000,00 → 40.000,00 EUR.
- Renta fija ficticia: 25.000,00 → 20.000,00 EUR.
- Efectivo ficticio: 15.000,00 → 15.000,00 EUR.
- Visual principal: gráfico determinista de valores y cambio de pesos.

## Slide 3

### El efectivo amortigua el impacto total a −16,67 %

- Pérdida simulada: −15.000,00 EUR.
- El 16,67 % inicial no recibe choque bajo esta hipótesis.
- La sensibilidad se calcula por exposición, no sumando retornos.
- El resultado cambia si cambian los supuestos de liquidez o exposición.

## Slide 4

### La composición cambia, pero el HHI no predice pérdidas

- Peso de renta variable: 55,56 % → 53,33 %.
- Peso de efectivo: 16,67 % → 20,00 %.
- HHI: 0,4135802469 → 0,3955555556.
- El cambio describe pesos relativos; no acredita menor riesgo total.

## Slide 5

### OmniInvest baja 6 puntos con factores explícitos

- Indicador ficticio: 65,6 → 59,6 sobre 100.
- Hipótesis de menor valoración, momentum y gestión de riesgo; otros factores estables.
- Seis factores declarados mantienen 100 % de cobertura de factores.
- El indicador no predice precio, probabilidad ni recomendación.

## Slide 6

### Los controles bloquean precisión falsa bajo estrés

- −20 %: conserva efectivo, valores y HHI recalculado.
- −100 %: evita valores de mercado negativos y deja solo efectivo bajo el supuesto.
- Ruta extrema compuesta: −35 %, +40 %, −30 %, +25 %, −50 % termina en 39,8125 sobre base 100.
- Choques menores que −100 %, NaN y carteras vacías se bloquean.

## Slide 7

### Diversificar requiere evidencia, no una cifra única

- Mostrar top 1, top 3, HHI y peso sin clasificar por emisor, activo, sector, región, divisa y plataforma.
- Separar concentración, volatilidad, crédito, liquidez y sensibilidad de mercado.
- Declarar valor sin precio, sin FX y sin taxonomía en lugar de completar datos automáticamente.
- Usar escenarios múltiples elegidos por la persona; no inferir correlaciones o rendimiento futuro.

## Slide 8

### El siguiente salto exige ledger, cobertura y RLS

- Cerrar RLS y Realtime en staging antes de cualquier cartera conectada.
- Proyectar riesgo desde libro mayor normalizado, valoraciones, FX y taxonomía versionada.
- Versionar política, huella de entrada, algoritmo, cobertura y avisos por cálculo.
- Conservar el modo local manual/ficticio como alternativa privada.

## Slide 9

### Conclusión: estrés explicable antes que automatización opaca

**90.000 → 75.000 EUR; −16,67 %; 65,6 → 59,6 / 100**  
El escenario es ficticio y educativo. No representa una previsión, una cartera real ni asesoramiento financiero personalizado.
