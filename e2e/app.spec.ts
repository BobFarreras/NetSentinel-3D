import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

test.describe('NetSentinel App', () => {
  const expectNodesCount = async (page: Page, count: number) => {
    await expect(page.getByText(new RegExp(`NODES:\\s*${count}`))).toBeVisible();
  };

  const triggerScan = async (page: Page) => {
    const scanIdle = page.getByRole('button', { name: 'SCAN NET' });
    const scanBusy = page.getByRole('button', { name: 'SCANNING...' });

    const busy = await scanBusy.isVisible({ timeout: 400 }).catch(() => false);
    if (busy) {
      await expect(scanIdle).toBeVisible({ timeout: 8000 });
    }

    await scanIdle.click();
  };

  test('debe cargar la interfaz principal', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('NETSENTINEL')).toBeVisible();
    await expect(page.getByRole('button', { name: 'SCAN NET' })).toBeVisible();
    await expect(page.getByText('AWAITING TARGET')).toBeVisible();
  });

  test('debe ejecutar scan y reflejar nodos detectados', async ({ page }) => {
    await page.goto('/');

    await triggerScan(page);
    await expectNodesCount(page, 3);
  });

  test('debe cargar snapshot desde historial y aplicar la sesion', async ({ page }) => {
    await page.goto('/');

    await triggerScan(page);
    await expectNodesCount(page, 3);

    await page.getByRole('button', { name: 'HISTORY' }).click();
    await expect(page.getByText('LOG ARCHIVES')).toBeVisible();

    await page.getByRole('button', { name: '[ LOAD SNAPSHOT ]' }).nth(1).click();
    await expectNodesCount(page, 2);
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

    await page.getByRole('button', { name: 'HISTORY' }).click();
    await expect(page.getByText('LOG ARCHIVES')).toBeVisible();

    await page.getByRole('button', { name: '[ CLOSE ARCHIVES ]' }).click();
    await expect(page.getByText('LOG ARCHIVES')).toBeHidden();
  });

  test('debe permitir seleccionar nodo, auditar y detectar riesgo de gateway', async ({ page }) => {
    await page.goto('/');

    await triggerScan(page);
    await expectNodesCount(page, 3);

    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('No se encontro el canvas de red');

    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    await expect(page.getByText('TARGET_ANALYSIS')).toBeVisible();

    await page.getByRole('button', { name: /DEEP AUDIT/ }).click();
    await expect(page.getByText(/ANALYSIS COMPLETE\. PORTS FOUND:/)).toBeVisible();

    await page.getByRole('button', { name: /AUDIT GATEWAY SECURITY/ }).click();
    await expect(page.getByText(/CRITICAL VULNERABILITY/)).toBeVisible();
  });

  test('debe recuperarse si scan_network falla y mantener la UI operativa', async ({ page }) => {
    await page.addInitScript(() => {
      (window as Window & { __E2E_SCENARIO__?: { failScan?: boolean } }).__E2E_SCENARIO__ = {
        failScan: true,
      };
    });

    await page.goto('/');
    await expectNodesCount(page, 2);

    await page.getByRole('button', { name: 'SCAN NET' }).click();

    await expect(page.getByRole('button', { name: 'SCAN NET' })).toBeVisible();
    await expectNodesCount(page, 2);
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

    await page.getByRole('button', { name: 'RADAR' }).click();
    await expect(page.getByText('RADAR VIEW')).toBeVisible();

    await page.getByRole('button', { name: /ACEPTO Y CONTINUO/ }).click();
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
    await expect(page.getByRole('button', { name: /DISCONNECTING|JAMMING/i })).toBeVisible();

    await page.getByRole('button', { name: /DISCONNECTING/i }).click();
    await expect(page.getByRole('button', { name: /KILL NET/i })).toBeVisible();

    // Verificacion anti-bloqueo: tras start/stop la vista sigue operativa.
    await expect(page.getByText('DEVICE_INTEL')).toBeVisible();
  });
});
