import { app, BrowserWindow } from 'electron';
import * as path from 'node:path';
import { DeviceStatus } from '@tunefour/shared-types';

/**
 * Absolute last-resort screen, baked into the compiled bundle as a data: URI so it can
 * never be "missing on disk". This is the deepest fail-safe net; later phases add a
 * configurable default image and retry/backoff on top (see IMPLEMENTATION_PLAN.md Phase 4).
 */
const FALLBACK_HTML =
  'data:text/html,' +
  encodeURIComponent(
    `<!doctype html><meta charset="utf-8" /><body style="margin:0;height:100vh;` +
      `background:#0b1020;color:#e8ecf1;display:flex;align-items:center;` +
      `justify-content:center;font-family:system-ui,sans-serif"><h1>Tunefour</h1></body>`,
  );

/**
 * Load the kiosk's content, guaranteeing we never sit on a Chromium error page: if
 * index.html fails to load, swap in the inline fallback screen. `did-fail-load` is the
 * canonical Electron signal; the `.catch` on loadFile is a belt-and-braces backstop.
 */
function loadKioskContent(win: BrowserWindow): void {
  const indexHtml = path.join(__dirname, '..', 'static', 'index.html');
  let fellBack = false;

  const fallback = (reason: string): void => {
    if (fellBack) return; // load the inline screen at most once
    fellBack = true;
    // eslint-disable-next-line no-console
    console.error(`kiosk: falling back to inline screen (${reason})`);
    void win.loadURL(FALLBACK_HTML);
  };

  // Ignore subframe failures and ERR_ABORTED (-3), which fires on normal/replaced navigations.
  win.webContents.on('did-fail-load', (_event, code, description, _url, isMainFrame) => {
    if (!isMainFrame || code === -3) return;
    fallback(`did-fail-load ${code}: ${description}`);
  });

  win.loadFile(indexHtml).catch((err: unknown) => fallback(`loadFile rejected: ${String(err)}`));
}

/**
 * Phase 0 hello-world kiosk window. Later phases add: local cache, manifest
 * reconciliation, watchdog heartbeat, and the content renderer.
 */
function createKioskWindow(): void {
  const win = new BrowserWindow({
    fullscreen: true,
    kiosk: true,
    backgroundColor: '#0b1020',
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
    },
  });

  loadKioskContent(win);

  // Referenced to prove the shared-types package is wired into the client.
  // eslint-disable-next-line no-console
  console.log('kiosk starting; known device statuses:', Object.values(DeviceStatus));
}

app.whenReady().then(() => {
  createKioskWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createKioskWindow();
  });
});

app.on('window-all-closed', () => {
  // On a kiosk we keep the process alive; a watchdog relaunches on crash.
  if (process.platform !== 'darwin') app.quit();
});
