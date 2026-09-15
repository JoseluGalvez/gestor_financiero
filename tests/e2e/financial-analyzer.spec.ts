import { test, expect } from '@playwright/test';

test.describe('Financial Analyzer E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('debe cargar la página principal', async ({ page }) => {
    await expect(page).toHaveTitle(/Finanzas|Financial/);
    await expect(page.locator('h1')).toContainText('Análisis Fundamental');
  });

  test('debe mostrar el formulario de entrada', async ({ page }) => {
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('input[type="number"]')).toHaveCountGreaterThan(10);
  });

  test('debe rechazar formulario vacío', async ({ page }) => {
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.field-error')).toContainText('requerido');
  });

  test('debe cargar datos desde SEC EDGAR', async ({ page }) => {
    await page.fill('input[aria-label*="ticker"]', 'AAPL');
    await page.click('button:has-text("Cargar desde SEC")');
    await expect(page.locator('.edgar-status')).toContainText('Cargando');
  });

  test('debe calcular métricas', async ({ page }) => {
    await page.fill('[id="companyName"]', 'Test Corp');
    await page.fill('[id="asOf"]', '2024-12-31');
    await page.fill('[id="netIncome"]', '1000000');
    await page.fill('[id="revenue"]', '10000000');
    await page.fill('[id="equity"]', '5000000');
    await page.fill('[id="totalDebt"]', '2000000');
    await page.fill('[id="cashAndEquivalents"]', '500000');
    await page.fill('[id="taxRate"]', '0.25');
    await page.fill('[id="wacc"]', '0.10');
    
    await page.click('button[type="submit"]');
    await expect(page.locator('.metric-card')).toBeVisible();
  });

  test('debe exportar CSV', async ({ page }) => {
    await page.fill('[id="companyName"]', 'Test Corp');
    await page.fill('[id="asOf"]', '2024-12-31');
    await page.fill('[id="netIncome"]', '1000000');
    await page.click('button:has-text("Analizar")');
    await page.click('button:has-text("Exportar CSV")');
    await expect(page.locator('text=análisis')).toBeVisible();
  });

  test('debe exportar PDF', async ({ page }) => {
    await page.fill('[id="companyName"]', 'Test Corp');
    await page.fill('[id="asOf"]', '2024-12-31');
    await page.fill('[id="netIncome"]', '1000000');
    await page.click('button:has-text("Analizar")');
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('debe manejar CAPM inputs', async ({ page }) => {
    await page.fill('[id="riskFreeRate"]', '0.03');
    await page.fill('[id="beta"]', '1.5');
    await page.fill('[id="marketRiskPremium"]', '0.05');
    await page.fill('[id="netIncome"]', '1000000');
    await page.click('button:has-text("Analizar")');
  });

  test('debe calcular múltiples ratios', async ({ page }) => {
    await page.fill('[id="companyName"]', 'Test Corp');
    await page.fill('[id="asOf"]', '2024-12-31');
    await page.fill('[id="netIncome"]', '1000000');
    await page.fill('[id="equity"]', '5000000');
    await page.fill('[id="revenue"]', '10000000');
    await page.fill('[id="costOfRevenue"]', '6000000');
    await page.click('button:has-text("Analizar")');
    
    await expect(page.locator('text=ROE')).toBeVisible();
    await expect(page.locator('text=Margen bruto')).toBeVisible();
  });

  test('debe mostrar warnings de calidad', async ({ page }) => {
    await page.fill('[id="companyName"]', 'Test Corp');
    await page.fill('[id="asOf"]', '2024-12-31');
    await page.click('button:has-text("Analizar")');
    await expect(page.locator('.warnings-section')).toBeVisible();
  });

  test('debe navegar entre secciones', async ({ page }) => {
    await page.click('button:has-text("Historial")');
    await expect(page.locator('h2')).toContainText('Historial');
    
    await page.click('button:has-text("Market")');
  });

  test('debe mostrar datos históricos', async ({ page }) => {
    await page.click('button:has-text("Historial")');
    await expect(page.locator('.history-list')).toBeVisible();
  });

  test('footer contiene disclaimer', async ({ page }) => {
    await expect(page.locator('footer')).toContainText('informativos');
    await expect(page.locator('footer')).toContainText('recomendación');
  });
});