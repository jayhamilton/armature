import { expect, test } from '@playwright/test';
import { stubBackend, type StubEndpoint } from '../support/backend-stub';
import { addGadget, closeConfiguration, configureGadget, createBoard, login, openSettings, saveConfiguration } from '../support/host';

/**
 * INC-00d host parity: every control type library.json uses, and the three
 * Board settings tabs, behave the same in every host.
 */

const PLANT_API: StubEndpoint = {
  id: 'ep-plant',
  name: 'Plant API',
  address: 'https://plant.example.com/data',
  description: '',
  tags: [{ facet: '', name: 'bar' }],
  authType: 'none',
};

test('a board icon chosen in Board settings shows in the board list', async ({ page }) => {
  await stubBackend(page);
  await login(page);

  await createBoard(page, 'Plant floor', 'factory');

  // The icon is a Material Icons ligature, so its name is the element's text.
  const boardList = page.getByRole('navigation');
  await expect(boardList).toContainText('Plant floor');
  await expect(boardList).toContainText('factory');
});

test('markdown typed in the Text gadget editor renders in its preview', async ({ page }) => {
  await stubBackend(page);
  await login(page);
  await createBoard(page, 'Notes');
  await addGadget(page, 'Text');

  const panel = await configureGadget(page);
  await panel.getByRole('textbox', { name: 'Markdown' }).fill('Shift report');
  await panel.getByRole('button', { name: 'Heading 1' }).click();

  await expect(panel.getByRole('textbox', { name: 'Markdown' })).toHaveValue('# Shift report');
  await expect(panel.getByRole('region', { name: 'Preview' }).getByRole('heading', { level: 1 })).toHaveText(
    'Shift report'
  );

  await saveConfiguration(page);
  await closeConfiguration(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Shift report' })).toBeVisible();
});

test('an illustration picked for the Illustration gadget is shown on the board', async ({ page }) => {
  await stubBackend(page);
  await login(page);
  await createBoard(page, 'Welcome');
  await addGadget(page, 'Illustration');

  const panel = await configureGadget(page);
  await panel.getByRole('button', { name: 'Choose an illustration' }).click();
  await page.getByRole('button', { name: 'Team', exact: true }).click();
  await expect(panel.getByRole('button', { name: 'Choose an illustration' })).toContainText('Team');

  await saveConfiguration(page);
  await expect(page.locator('img[src$="illustrations/team.svg"]').first()).toBeVisible();
});

test('endpoints can be created, edited, and deleted in Board settings', async ({ page }) => {
  const endpoints = await stubBackend(page);
  await login(page);

  const dialog = await openSettings(page, 'Endpoints');
  await dialog.getByRole('textbox', { name: 'Name' }).fill('Line sensors');
  await dialog.getByRole('textbox', { name: 'Address' }).fill('https://sensors.example.com');
  await dialog.getByRole('combobox', { name: 'Tags' }).click();
  await page.getByRole('option', { name: /^table/ }).click();
  await dialog.getByRole('button', { name: 'Add', exact: true }).click();

  const row = dialog.getByRole('row', { name: /Line sensors/ });
  await expect(row).toContainText('https://sensors.example.com');
  await expect(row).toContainText('table');
  expect(endpoints).toHaveLength(1);

  await dialog.getByRole('button', { name: 'Edit Line sensors' }).click();
  await dialog.getByRole('textbox', { name: 'Name' }).fill('Line sensors (east)');
  await dialog.getByRole('button', { name: 'Update', exact: true }).click();
  await expect(dialog.getByRole('row', { name: /Line sensors \(east\)/ })).toBeVisible();

  await dialog.getByRole('button', { name: 'Delete Line sensors (east)' }).click();
  await page.getByRole('dialog', { name: 'Delete Endpoint' }).getByRole('button', { name: 'Delete' }).click();
  await expect(dialog.getByText('No endpoints defined yet.')).toBeVisible();
  expect(endpoints).toHaveLength(0);
});

test("the Bar Chart gadget's data source is picked from endpoints that share its tags", async ({ page }) => {
  await stubBackend(page, [
    PLANT_API,
    { ...PLANT_API, id: 'ep-video', name: 'Video API', tags: [{ facet: '', name: 'media' }] },
  ]);
  await login(page);
  await createBoard(page, 'Throughput');
  await addGadget(page, 'Bar Chart');

  let panel = await configureGadget(page);
  await panel.getByRole('button', { name: 'Data source: Manual' }).click();
  await expect(page.getByRole('menuitem', { name: 'Video API' })).toHaveCount(0);
  await page.getByRole('menuitem', { name: 'Plant API' }).click();
  await expect(panel.getByRole('button', { name: 'Data source: Plant API' })).toBeVisible();
  await saveConfiguration(page);
  await closeConfiguration(page);

  panel = await configureGadget(page);
  await expect(panel.getByRole('button', { name: 'Data source: Plant API' })).toBeVisible();
});
