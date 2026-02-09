import { expect, test } from '@playwright/test';

test.describe('NetSentinel App', () => {
  test('debe cargar la interfaz principal', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('NETSENTINEL')).toBeVisible();
    await expect(page.getByRole('button', { name: 'SCAN NET' })).toBeVisible();
    await expect(page.getByText('AWAITING TARGET')).toBeVisible();
  });

  test('debe abrir y cerrar el panel de historial', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'HISTORY' }).click();
    await expect(page.getByText('LOG ARCHIVES')).toBeVisible();

    await page.getByRole('button', { name: '[ CLOSE ARCHIVES ]' }).click();
    await expect(page.getByText('LOG ARCHIVES')).toBeHidden();
  });
});
