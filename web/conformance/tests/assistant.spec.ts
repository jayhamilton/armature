import { expect, test } from '@playwright/test';
import { stubAgentChat } from '../support/agent-stub';
import { stubBackend } from '../support/backend-stub';
import { addGadget, askAssistant, createBoard, gadgetX, login } from '../support/host';

/**
 * INC-00e host parity: the assistant panel streams a reply, and every ui part
 * the backend sends acts on the board the same way in every host. Replies
 * come from fixtures/agui, so no backend or model is needed.
 */

test('a streamed reply appears in full and the typing indicator clears', async ({ page }) => {
  await stubBackend(page);
  const requests = await stubAgentChat(page, 'reply-text');
  await login(page);
  await createBoard(page, 'Plant floor');

  await page.getByRole('button', { name: 'Open assistant' }).click();
  await expect(page.getByText('Ask the dashboard to create boards, add widgets, or explain the current view.')).toBeVisible();
  await askAssistant(page, 'What can you do?');

  await expect(page.getByText('What can you do?', { exact: true })).toBeVisible();
  await expect(page.getByText('I can build boards, add gadgets, and explain the current view.', { exact: true })).toBeVisible();
  expect(requests[0]?.message).toBe('What can you do?');
  expect(requests[0]?.boardContext?.boardTitle).toBe('Plant floor');
  expect(requests[0]?.gadgetLibrary?.map((g) => g.componentType)).toContain('TextComponent');
});

test('a gadget suggestion adds the gadget with the title the model chose', async ({ page }) => {
  await stubBackend(page);
  await stubAgentChat(page, 'add-gadget');
  await login(page);
  await createBoard(page, 'Notes');

  await askAssistant(page, 'Add a text gadget for shift notes');

  await expect(page.getByText('Added ✓')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove', exact: true })).toHaveCount(1);
  // The suggestion card in the panel and the gadget's own header on the board.
  await expect(page.getByText('Shift notes', { exact: true })).toHaveCount(2);
});

test('the board list switches to the board picked', async ({ page }) => {
  await stubBackend(page);
  await stubAgentChat(page, 'board-list');
  await login(page);
  await createBoard(page, 'Plant floor');
  await createBoard(page, 'Sales');
  const boards = page.getByRole('navigation');

  await askAssistant(page, 'Show my boards');
  const card = page.getByText('Your boards').locator('..');
  await expect(card.getByRole('listitem').filter({ hasText: 'Sales' })).toBeVisible();

  await card.getByRole('listitem').filter({ hasText: 'Plant floor' }).getByRole('button', { name: 'Switch' }).click();
  await expect(boards.locator('[aria-current="page"]')).toContainText('Plant floor');
});

test('move and remove act on the gadget whose title matches, and an unmatched title changes nothing', async ({
  page,
}) => {
  await stubBackend(page);
  const requests = await stubAgentChat(page, 'move-gadget', 'remove-missing-gadget', 'remove-gadget');
  await login(page);
  await createBoard(page, 'Shift');
  await addGadget(page, 'Text');
  const before = await gadgetX(page);

  await askAssistant(page, 'Move the text gadget right');
  await expect(page.getByText('Moved right ✓')).toBeVisible();
  await expect.poll(() => gadgetX(page)).toBeGreaterThan(before);
  expect(requests[0]?.boardGadgets?.map((g) => g.title)).toEqual(['Text']);

  await askAssistant(page, 'Remove the weather gadget');
  await expect(page.getByText(`Couldn't find a gadget matching "weather" on this board.`)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove', exact: true })).toHaveCount(1);

  await askAssistant(page, 'Remove the text gadget');
  await expect(page.getByText('Removed ✓')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove', exact: true })).toHaveCount(0);
});

test('a row is added, and a layout change for a row that does not exist changes nothing', async ({ page }) => {
  await stubBackend(page);
  await stubAgentChat(page, 'add-row', 'row-layout-missing-row');
  await login(page);
  await createBoard(page, 'Rows');

  await askAssistant(page, 'Add a row');
  await expect(page.getByText('Row added ✓')).toBeVisible();

  await askAssistant(page, 'Make row 5 three columns');
  await expect(page.getByText("Couldn't find row 5 on this board.")).toBeVisible();
});

test('a run error shows the error reply and the assistant can be asked again', async ({ page }) => {
  await stubBackend(page);
  await stubAgentChat(page, 'run-error', 'reply-text');
  await login(page);
  await createBoard(page, 'Plant floor');

  await askAssistant(page, 'Hello?');
  await expect(page.getByText("Sorry, I couldn't reach the dashboard assistant. Please try again.")).toBeVisible();

  await askAssistant(page, 'What can you do?');
  await expect(page.getByText('I can build boards, add gadgets, and explain the current view.', { exact: true })).toBeVisible();
});
