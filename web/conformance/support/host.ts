import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Steps every scenario shares, written once against roles and accessible
 * names only. If a step only works on one host, the fix belongs in the
 * other host's markup, never in a host specific branch here.
 */

/** Signs in through the demo login (both hosts prefill admin/admin). */
export async function login(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('button', { name: 'Board settings' })).toBeVisible();
}

/** Opens Board settings on the given tab. Returns the dialog. */
export async function openSettings(page: Page, tab: 'Application' | 'Boards' | 'Endpoints'): Promise<Locator> {
  await page.getByRole('button', { name: 'Board settings' }).click();
  const dialog = page.getByRole('dialog', { name: 'Configuration' });
  await dialog.getByRole('tab', { name: tab }).click();
  // Wait for the tab to finish switching: Angular animates the change, and
  // text typed into the incoming panel mid animation can be lost.
  await expect(dialog.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true');
  await expect(dialog.getByRole('tabpanel', { name: tab })).toBeVisible();
  return dialog;
}

/** Creates a board from the Boards tab, optionally choosing its icon. */
export async function createBoard(page: Page, title: string, icon?: string): Promise<void> {
  const dialog = await openSettings(page, 'Boards');
  if (icon) {
    await dialog.getByRole('button', { name: 'Choose an icon' }).click();
    await page.getByRole('button', { name: icon, exact: true }).click();
    await expect(dialog.getByRole('button', { name: 'Choose an icon' })).toContainText(icon);
  }
  await dialog.getByRole('textbox', { name: 'Title' }).fill(title);
  await dialog.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(dialog).toBeHidden();
}

/**
 * Adds a gadget from the library panel. The Angular library is virtualized
 * and keeps its scroll position between openings, so the wanted entry may
 * not be rendered until the list scrolls, in either direction.
 */
export async function addGadget(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: 'Gadget library', exact: true }).click();
  const entry = page.getByRole('button', { name: `Add ${name}`, exact: true });
  // Any rendered library entry, to put the pointer over the list ("Add Row"
  // belongs to the layout panel, not the library).
  await page.getByRole('button', { name: /^Add (?!Row$)/ }).first().hover();
  for (const deltaY of [200, -200]) {
    for (let i = 0; i < 20 && (await entry.count()) === 0; i++) {
      await page.mouse.wheel(0, deltaY);
    }
  }
  await entry.click();
  await page.getByRole('button', { name: 'Close gadget library panel' }).click();
}

/** Opens the configuration panel of the only gadget on the board. Returns the panel's tab panel. */
export async function configureGadget(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: 'Configure', exact: true }).click();
  const panel = page.getByRole('tabpanel', { name: 'Configuration' });
  await expect(panel).toBeVisible();
  return panel;
}

/** Saves the open gadget configuration. */
export async function saveConfiguration(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Save', exact: true }).click();
}

/** Closes the gadget configuration panel. */
export async function closeConfiguration(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Close configuration panel' }).click();
  await expect(page.getByRole('tabpanel', { name: 'Configuration' })).toBeHidden();
}
