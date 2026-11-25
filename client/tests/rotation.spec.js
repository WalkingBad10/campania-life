import { test, expect } from '@playwright/test';
import { bootNewGame, attachErrorCollectors, criticalErrors, SAVE_KEY } from './helpers.js';

/* La rotazione deve essere solo un cambio di layout: nessun reload, nessuna
 * nuova partita, nessun teleport, nessuna perdita del salvataggio. */
test('portrait/landscape rotation keeps game, position and save', async ({ page }) => {
  const errors = await attachErrorCollectors(page);
  await bootNewGame(page);
  await page.evaluate(() => { CL.game.save(); window.__CLGameRef = CL.game; });
  const before = await page.evaluate((key) => ({
    map: CL.game.map.id,
    x: CL.game.player.x,
    y: CL.game.player.y,
    save: localStorage.getItem(key),
  }), SAVE_KEY);

  for (const vp of [{ width: 844, height: 390 }, { width: 390, height: 844 }, { width: 448, height: 997 }]) {
    await page.setViewportSize(vp);
    await page.waitForTimeout(140);
    const after = await page.evaluate((key) => ({
      gameSame: CL.game === window.__CLGameRef,
      map: CL.game.map.id,
      x: CL.game.player.x,
      y: CL.game.player.y,
      save: localStorage.getItem(key),
      canvasW: document.querySelector('#game').width,
      canvasH: document.querySelector('#game').height,
      hud: !!document.querySelector('.hud'),
      frame: (() => { const r = document.querySelector('#viewport-frame').getBoundingClientRect(); return r.width / r.height; })(),
    }), SAVE_KEY);
    expect(after.gameSame).toBe(true);
    expect(after.map).toBe(before.map);
    expect(after.x).toBe(before.x);
    expect(after.y).toBe(before.y);
    expect(after.save).toBe(before.save);
    expect(after.canvasW).toBe(480);
    expect(after.canvasH).toBe(270);
    expect(after.hud).toBe(true);
    expect(after.frame).toBeGreaterThan(1.75);
    expect(after.frame).toBeLessThan(1.80);
  }

  // Menu a icone: chiuso di default, apribile e richiudibile senza mutare il gioco.
  await expect(page.locator('.icon-dock')).toHaveCount(0);
  await page.locator('.hud-menu-btn').click();
  await expect(page.locator('.icon-dock button[aria-label="Missioni"]')).toBeVisible();
  await page.locator('.icon-dock button[aria-label="Missioni"]').click();
  await expect(page.locator('.panel')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.icon-dock')).toHaveCount(0);

  expect(criticalErrors(errors)).toEqual([]);
});
