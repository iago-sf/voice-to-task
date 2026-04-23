import { app, BrowserWindow, dialog, ipcMain, Notification } from 'electron'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { randomBytes } from 'node:crypto'
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'

const require = createRequire(import.meta.url)
const { autoUpdater } = require('electron-updater')

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const isDev = !app.isPackaged
const FIXED_PORT = 37000
const SESSION_FILE = join(app.getPath('userData'), 'session-password.txt')

async function loadOrCreateSessionPassword() {
  try {
    const existing = await readFile(SESSION_FILE, 'utf-8')
    if (existing && existing.length >= 32) return existing.trim()
  } catch {}
  const generated = randomBytes(32).toString('hex')
  await mkdir(dirname(SESSION_FILE), { recursive: true })
  await writeFile(SESSION_FILE, generated, 'utf-8')
  return generated
}

let sessionPassword = ''

ipcMain.handle('select-folder', async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Project Folder',
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

ipcMain.on('notify', (_event, { title, body }) => {
  console.log('[Notify]', title, body)
  try {
    if (Notification.isSupported()) {
      const notif = new Notification({ title, body, silent: false })
      notif.on('click', () => {
        if (mainWindow) { mainWindow.show(); mainWindow.focus() }
      })
      notif.show()
    }
  } catch (err) {
    console.error('[Notify] Error:', err)
  }
})

let mainWindow = null
let nitroProcess = null
let serverPort = null

const CONFIG_FILE = join(app.getPath('userData'), 'oauth-config.json')

async function loadOAuthConfig() {
  try {
    const raw = await readFile(CONFIG_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return { googleClientId: '', googleClientSecret: '' }
  }
}

async function saveOAuthConfig(config) {
  await mkdir(dirname(CONFIG_FILE), { recursive: true })
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
}

async function findServerEntry(outputDir) {
  const entries = await readdir(outputDir)
  for (const entry of entries) {
    if (entry.endsWith('.mjs') || entry.endsWith('.js')) {
      return join(outputDir, entry)
    }
  }
  return null
}

async function waitForServer(port, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`http://localhost:${port}/`)
      if (res.ok || res.status < 500) return true
    } catch {}
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

async function startNitro() {
  const userDataPath = app.getPath('userData')
  const dbPath = join(userDataPath, 'voice-linear.db')

  let serverEntry
  if (isDev) {
    serverEntry = join(__dirname, '..', '.output', 'server', 'index.mjs')
  } else {
    const outputDir = join(process.resourcesPath, '.output', 'server')
    serverEntry = await findServerEntry(outputDir)
  }

  if (!serverEntry) {
    dialog.showErrorBox('Startup Error', 'Could not find Nitro server entry point.')
    app.quit()
    return null
  }

  const oauthConfig = await loadOAuthConfig()

  const env = {
    ...process.env,
    NUXT_DESKTOP_MODE: 'true',
    NUXT_PUBLIC_DESKTOP_MODE: 'true',
    DESKTOP_DB_PATH: dbPath,
    PORT: String(FIXED_PORT),
    NUXT_SESSION_PASSWORD: sessionPassword,
    NODE_ENV: 'production',
    NUXT_OAUTH_GOOGLE_CLIENT_ID: oauthConfig.googleClientId || '',
    NUXT_OAUTH_GOOGLE_CLIENT_SECRET: oauthConfig.googleClientSecret || '',
  }

  nitroProcess = spawn(process.execPath, [serverEntry], { env, stdio: ['pipe', 'pipe', 'pipe'] })

  nitroProcess.stdout.on('data', (data) => {
    console.log('[Nitro]', data.toString().trim())
  })
  nitroProcess.stderr.on('data', (data) => {
    console.error('[Nitro]', data.toString().trim())
  })

  nitroProcess.on('exit', async (code) => {
    console.log('[Nitro] exited with code', code)
    nitroProcess = null
    if (mainWindow && !app.isQuitting) {
      dialog.showMessageBox(mainWindow, {
        type: 'error',
        title: 'Server Stopped',
        message: 'The local server stopped unexpectedly.',
        detail: 'Click OK to restart it.',
        buttons: ['OK'],
      }).then(async () => {
        const port = await startNitro()
        if (port && mainWindow) {
          serverPort = port
          mainWindow.loadURL(`http://localhost:${port}`)
        }
      })
    }
  })

  const ready = await waitForServer(FIXED_PORT)
  if (!ready) {
    dialog.showErrorBox('Startup Error', 'Nitro server failed to start.')
    app.quit()
    return null
  }

  return FIXED_PORT
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    title: 'Voice to Task',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.loadURL(`http://localhost:${port}`)

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.webContents.on('did-fail-load', (_event, _errorCode, _errorDesc, validatedURL) => {
    console.error('[BrowserWindow] Failed to load:', validatedURL, _errorDesc)
    if (serverPort && mainWindow) {
      setTimeout(() => {
        mainWindow.loadURL(`http://localhost:${serverPort}`)
      }, 500)
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function setupAutoUpdater() {
  if (isDev) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-downloaded', (info) => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `Version ${info.version} has been downloaded.`,
      detail: 'Restart the app to apply the update.',
      buttons: ['Restart', 'Later'],
      defaultId: 0,
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall()
      }
    })
  })

  autoUpdater.on('error', (err) => {
    console.error('[AutoUpdater]', err.message)
  })

  autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    console.error('[AutoUpdater] check failed:', err.message)
  })
}

const DEV_PORT = 3004

app.on('ready', async () => {
  if (isDev) {
    console.log('[Electron] Dev mode — connecting to Nuxt dev server on port', DEV_PORT)
    const ready = await waitForServer(DEV_PORT)
    if (!ready) {
      dialog.showErrorBox('Startup Error', 'Nuxt dev server not found. Run: NUXT_DESKTOP_MODE=true nuxt dev')
      app.quit()
      return
    }
    serverPort = DEV_PORT
    createWindow(DEV_PORT)
    return
  }

  sessionPassword = await loadOrCreateSessionPassword()
  const port = await startNitro()
  if (!port) return

  serverPort = port
  createWindow(port)
  setupAutoUpdater()
})

app.on('window-all-closed', () => {
  if (nitroProcess) {
    nitroProcess.kill('SIGTERM')
    nitroProcess = null
  }
  app.quit()
})

app.on('before-quit', () => {
  app.isQuitting = true
  if (nitroProcess) {
    nitroProcess.kill('SIGTERM')
    nitroProcess = null
  }
})
