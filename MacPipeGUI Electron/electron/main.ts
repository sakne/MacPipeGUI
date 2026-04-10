import { app, BrowserWindow, ipcMain, dialog, safeStorage } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { VDFGenerator } from './vdf-generator'
import { SteamRunner } from './steam-runner'
import Store from 'electron-store'
import { autoUpdater } from 'electron-updater'

import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let store: Store;

try {
  store = new Store();
} catch (error) {
  console.error('Failed to initialize store, attempting to reset:', error);
  try {
    const userDataPath = app.getPath('userData');
    const configPath = path.join(userDataPath, 'config.json');
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
      console.log('Corrupted config file deleted.');
    }
    store = new Store();
  } catch (retryError) {
    console.error('Failed to recover store:', retryError);
    // If it still fails, we can't do much, but at least we tried.
    throw retryError;
  }
}

const SECURE_PASSWORD_KEY = 'secure_steam_password';

function createWindow() {
  win = new BrowserWindow({
    title: 'MacPipeGUI Multi',
    width: 1165,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    resizable: false,
    icon: path.join(process.env.VITE_PUBLIC, 'app-icon.png'),
    autoHideMenuBar: true, // Hides the default menu bar
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  win.setMenuBarVisibility(false)

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('get-store', (_, key) => {
    return store.get(key);
  });

  ipcMain.handle('set-store', (_, key, value) => {
    store.set(key, value);
  });

  ipcMain.handle('save-secure-password', (_, password: string) => {
    try {
      let data: string;
      let encrypted = false;

      if (safeStorage.isEncryptionAvailable()) {
        try {
          const encryptedBuffer = safeStorage.encryptString(password);
          data = encryptedBuffer.toString('base64');
          encrypted = true;
        } catch (encErr) {
          // Fall back to plain base64 so the password is still usable.
          console.warn('safeStorage encryption failed, using plain fallback:', encErr);
          data = Buffer.from(password).toString('base64');
          encrypted = false;
        }
      } else {
        data = Buffer.from(password).toString('base64');
        encrypted = false;
      }

      // Store as JSON so the loader knows which path to use
      store.set(SECURE_PASSWORD_KEY, JSON.stringify({ data, encrypted }));
      return { success: true, encrypted };
    } catch (e) {
      console.error('Failed to save password:', e);
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle('get-secure-password', () => {
    try {
      const stored = store.get(SECURE_PASSWORD_KEY) as string;
      if (!stored) return { success: true, password: '' };

      // Support new JSON format
      let data: string;
      let encrypted: boolean;

      try {
        const parsed = JSON.parse(stored);
        data = parsed.data;
        encrypted = parsed.encrypted === true;
      } catch {
        // Old format or manually added entry
        data = stored;
        encrypted = false;
      }

      const buffer = Buffer.from(data, 'base64');

      if (encrypted) {
        if (!safeStorage.isEncryptionAvailable()) {
          return {
            success: false, password: '',
            error: 'Encryption unavailable — cannot decrypt saved password. Please re-enter it and save.'
          };
        }
        try {
          const decrypted = safeStorage.decryptString(buffer);
          return { success: true, password: decrypted, encrypted: true };
        } catch (decErr) {
          console.error('Decryption failed:', decErr);
          return {
            success: false, password: '',
            error: 'Decryption failed (keyring may be locked). Please re-enter your password and save.'
          };
        }
      } else {
        // Plain base64 — covers the fallback save path and the manual workaround.
        return { success: true, password: buffer.toString('utf8'), encrypted: false };
      }
    } catch (e) {
      console.error('Failed to get password:', e);
      return { success: false, password: '', error: String(e) };
    }
  });

  ipcMain.handle('clear-secure-password', () => {
    try {
      store.delete(SECURE_PASSWORD_KEY);
      return { success: true };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle('is-encryption-available', () => {
    return safeStorage.isEncryptionAvailable();
  });

  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openDirectory']
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('generate-vdf', async (_, profile, config) => {
    return VDFGenerator.generateFiles(profile, config);
  });

  ipcMain.on('run-build', (_, profile, config, password) => {
    if (win) {
      SteamRunner.runBuild(win, profile, config, password);
    }
  });

  ipcMain.on('stop-build', () => {
    SteamRunner.stopBuild();
  });

  ipcMain.on('steam-guard-code', (_, code) => {
    SteamRunner.writeInput(code);
  });

  // -- New IPC Handlers --

  ipcMain.on('test-run', (_, profile, config) => {
    if (win) {
      SteamRunner.testRun(win, profile, config);
    }
  });

  ipcMain.handle('validate-config', async (_, config) => {
    return SteamRunner.validateSetup(config);
  });

  // -- Auto Updater IPC Handlers --
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  ipcMain.handle('check-for-updates', async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      return {
        success: true,
        updateAvailable: result?.updateInfo?.version !== app.getVersion(),
        currentVersion: app.getVersion(),
        latestVersion: result?.updateInfo?.version || app.getVersion()
      };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle('download-update', async () => {
    try {
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall();
  });

  // Auto-updater events
  autoUpdater.on('update-available', (info) => {
    win?.webContents.send('update-available', info);
  });

  autoUpdater.on('update-downloaded', (info) => {
    win?.webContents.send('update-downloaded', info);
  });

  autoUpdater.on('error', (err) => {
    win?.webContents.send('update-error', err.message);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    win?.webContents.send('update-progress', progressObj);
  });

  if (!VITE_DEV_SERVER_URL) {
    try {
      autoUpdater.checkForUpdatesAndNotify();
    } catch (e) {
      console.error('Failed to check for updates:', e);
    }
  }
})
