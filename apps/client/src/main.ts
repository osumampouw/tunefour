import { app, BrowserWindow } from 'electron';
import * as path from 'node:path';
import { DeviceStatus } from '@tunefour/shared-types';

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

  void win.loadFile(path.join(__dirname, '..', 'static', 'index.html'));

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
