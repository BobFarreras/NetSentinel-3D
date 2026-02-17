import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

test.describe('NetSentinel App', () => {
  test.beforeEach(async ({ page }) => {
    // E2E debe ser independiente del idioma/config local del operador.
    // Forzamos inglés para que el texto operacional sea determinista.
    await page.addInitScript(() => {
      try {
        localStorage.setItem("netsentinel.uiLanguage", "en");
      } catch {
        // ignore
      }
    });
  });

  const readNodesCount = async (page: Page): Promise<number> => {
    const locator = page.getByText(/NODES:\s*\d+/).first();
    const raw = (await locator.textContent()) ?? "";
    const m = raw.match(/NODES:\s*(\d+)/);
    return m ? Number(m[1]) : 0;
  };

  const expectNodesAtLeast = async (page: Page, count: number) => {
    await expect
      .poll(async () => readNodesCount(page), { timeout: 12000 })
      .toBeGreaterThanOrEqual(count);
  };

  const triggerScan = async (page: Page) => {
    const scan = page.getByRole('button', { name: 'TOPBAR_SCAN' });
    await expect(scan).toBeVisible({ timeout: 12000 });
    if (await scan.isDisabled()) {
      await expect(scan).toBeEnabled({ timeout: 12000 });
    }
    await scan.click();
  };

  test('debe cargar la interfaz principal', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('NETSENTINEL')).toBeVisible();
    await expect(page.getByRole('button', { name: 'TOPBAR_SCAN' })).toBeVisible();
  });

  test('debe ejecutar scan y reflejar nodos detectados', async ({ page }) => {
    await page.goto('/');

    await triggerScan(page);
    await expectNodesAtLeast(page, 3);
  });

  test('debe cargar snapshot desde historial y aplicar la sesion', async ({ page }) => {
    await page.goto('/');

    await triggerScan(page);
    await expectNodesAtLeast(page, 3);
    const before = await readNodesCount(page);

    await page.getByRole('button', { name: 'TOPBAR_HISTORY' }).click();
    await expect(page.getByText('LOG ARCHIVES')).toBeVisible();

    await page.getByRole('button', { name: '[ LOAD SNAPSHOT ]' }).nth(1).click();
    await expect
      .poll(async () => readNodesCount(page), { timeout: 12000 })
      .toBeLessThan(before);
    await expect(page.getByText('LOG ARCHIVES')).toBeHidden();
  });

  test('debe iniciar monitor de trafico y recibir paquetes', async ({ page }) => {
    await page.goto('/');

    await page.getByText('LIVE TRAFFIC').click();
    await page.getByRole('button', { name: /START/ }).click();

    await expect(page.getByRole('button', { name: /STOP/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /ALL \([1-9]\d*\)/ })).toBeVisible();
  });

  test('debe abrir y cerrar el panel de historial', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'TOPBAR_HISTORY' }).click();
    await expect(page.getByText('LOG ARCHIVES')).toBeVisible();

    await page.getByRole('button', { name: '[ CLOSE ARCHIVES ]' }).click();
    await expect(page.getByText('LOG ARCHIVES')).toBeHidden();
  });

  test('debe permitir seleccionar nodo, auditar y detectar riesgo de gateway', async ({ page }) => {
    // Ruta determinista: abrimos directamente el panel del gateway en modo detached.
    // Evitamos clicks en canvas (fragiles por layout/animacion/aleatoriedad).
    await page.goto('/?detached=1&panel=device&targetIp=192.168.1.1');

    await expect(page.getByText('DEVICE_INTEL')).toBeVisible();
    await expect(page.getByText('192.168.1.1')).toBeVisible();

    await page.getByRole('button', { name: /DEEP AUDIT/ }).click();
    await expect(page.getByText(/ANALYSIS COMPLETE\. PORTS FOUND:/)).toBeVisible();

    await page.getByRole('button', { name: /AUDIT GATEWAY SECURITY/ }).click();
    await expect(page.getByText(/PASSWORD FOUND|CRITICAL:/)).toBeVisible();
  });

  test('debe recuperarse si scan_network falla y mantener la UI operativa', async ({ page }) => {
    await page.addInitScript(() => {
      (window as Window & { __E2E_SCENARIO__?: { failScan?: boolean } }).__E2E_SCENARIO__ = {
        failScan: true,
      };
    });

    await page.goto('/');
    const before = await readNodesCount(page);

    await page.getByRole('button', { name: 'TOPBAR_SCAN' }).click();

    await expect(page.getByRole('button', { name: 'TOPBAR_SCAN' })).toBeVisible();
    await expect
      .poll(async () => readNodesCount(page), { timeout: 12000 })
      .toBe(before);
  });

  test('debe mantener monitor detenido si start_traffic_sniffing falla', async ({ page }) => {
    await page.addInitScript(() => {
      (window as Window & { __E2E_SCENARIO__?: { failTrafficStart?: boolean } }).__E2E_SCENARIO__ = {
        failTrafficStart: true,
      };
    });

    await page.goto('/');

    await page.getByText('LIVE TRAFFIC').click();
    await page.getByRole('button', { name: /START/ }).click();

    await expect(page.getByRole('button', { name: /START/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /STOP/ })).toHaveCount(0);
  });

  test('debe abrir Radar View y escanear redes WiFi (mock)', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'TOPBAR_RADAR' }).click();
    await expect(page.getByText('RADAR VIEW')).toBeVisible();

    await page.getByRole('button', { name: /ACCEPT AND CONTINUE|ACEPTO Y CONTINUO|ACCEPTO I CONTINUO/i }).click();
    await page.getByRole('button', { name: /SCAN AIRWAVES/ }).click();

    // Al menos debe mostrar contador actualizado.
    await expect(page.getByText(/NETWORKS:\s*[1-9]\d*/)).toBeVisible();
  });

  test('debe activar y desactivar Kill Net sin bloquear la UI', async ({ page }) => {
    // Ruta determinista para E2E: panel detached con target no-gateway del historial mock.
    await page.goto('/?detached=1&panel=device&targetIp=192.168.1.99');

    await expect(page.getByText('DEVICE_INTEL')).toBeVisible();
    await expect(page.getByText('192.168.1.99')).toBeVisible();

    await page.getByRole('button', { name: /KILL NET/i }).click();
    await expect(page.getByRole('button', { name: /JAM\.\.\.|STOP/i })).toBeVisible();

    await page.getByRole('button', { name: /STOP/i }).click();
    await expect(page.getByRole('button', { name: /KILL NET/i })).toBeVisible();

    // Verificacion anti-bloqueo: tras start/stop la vista sigue operativa.
    await expect(page.getByText('DEVICE_INTEL')).toBeVisible();
  });
});
