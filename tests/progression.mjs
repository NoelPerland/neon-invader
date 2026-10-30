import { chromium } from "playwright-core";
import { createServer } from "vite";
import assert from "node:assert/strict";
const server = await createServer({ server: { host: "127.0.0.1", port: 0 } });
await server.listen();
(async () => {
  let browser;
  try {
    browser = await chromium.launch({
      executablePath:
        process.env.CHROME_PATH ||
        "C:/Program Files/Google/Chrome/Application/chrome.exe",
      headless: true,
    });
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(server.resolvedUrls.local[0], { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await page.waitForFunction(
      () =>
        window.__NEON_INVADER_DEBUG__?.getSnapshot().game?.activeEnemyCount > 0,
    );
    const before = await page.evaluate(
      () => window.__NEON_INVADER_DEBUG__.getSnapshot().game.playerX,
    );
    const cdp = await page.context().newCDPSession(page);
    const left = await page.locator('[data-input="left"]').boundingBox(),
      fire = await page.locator('[data-input="fire"]').boundingBox();
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { x: left.x + left.width / 2, y: left.y + left.height / 2, id: 1 },
        { x: fire.x + fire.width / 2, y: fire.y + fire.height / 2, id: 2 },
      ],
    });
    await page.waitForTimeout(350);
    const during = await page.evaluate(
      () => window.__NEON_INVADER_DEBUG__.getSnapshot().game,
    );
    assert(during.playerX < before);
    assert(during.activePlayerBullets > 0);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    for (let wave = 1; wave <= 5; wave++) {
      await page.waitForFunction(
        (w) =>
          window.__NEON_INVADER_DEBUG__.getSnapshot().game?.wave === w &&
          !window.__NEON_INVADER_DEBUG__.getSnapshot().game?.transitioning,
        wave,
      );
      await page.evaluate(() =>
        window.__NEON_INVADER_DEBUG__.clearCurrentWave(),
      );
    }
    await page.waitForFunction(
      () => window.__NEON_INVADER_DEBUG__.getActiveSceneKey() === "game-over",
    );
    assert((await page.evaluate(() => window.__NEON_INVADER_DEBUG__.getSnapshot().sceneTexts)).includes('ALL WAVES CLEARED'));
    await page.keyboard.press('Enter');
    await page.waitForFunction(
      () => window.__NEON_INVADER_DEBUG__.getSnapshot().game?.wave === 1,
    );
    await page.evaluate(() => {
      for (let i = 0; i < 3; i++)
        window.__NEON_INVADER_DEBUG__.triggerPlayerHit();
    });
    await page.evaluate(() =>
      window.__NEON_INVADER_DEBUG__.finishRun("defeat"),
    );
    await page.waitForFunction(
      () => window.__NEON_INVADER_DEBUG__.getActiveSceneKey() === "game-over",
    );
    assert((await page.evaluate(() => window.__NEON_INVADER_DEBUG__.getSnapshot().sceneTexts)).includes('GAME OVER!'));
    await page.keyboard.press('Space');
    await page.waitForFunction(() => window.__NEON_INVADER_DEBUG__.getSnapshot().game?.wave === 1);
    assert.deepEqual(errors, []);
    console.log(
      "PASS: concurrent real touch movement/fire, five debug-assisted wave transitions/victory/retry, debug-assisted defeat, no page errors.",
    );
  } finally {
    await browser?.close();
    await server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
