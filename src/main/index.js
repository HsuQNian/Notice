import { app, shell, BrowserWindow, protocol, Menu, Tray, session } from 'electron'
import path from 'path'
import { MainIpc } from './lib'
// import { OnlineDB } from "./OnlineDB";
app.disableHardwareAcceleration()
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.exit()
}
let appTray = null
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
const { existsSync, writeFileSync } = require('fs')
let dataPath = `${app.getPath('userData')}\\data.json`
function createWindow() {
  const mainWindow = new BrowserWindow({
    title: 'Notice',
    width: 540,
    height: 720,
    show: false,
    frame: false,
    maximizable: false,
    resizable: false,
    autoHideMenuBar: true,
    transparent: true,
    icon: path.join(__dirname, '../renderer/assets/icon.7ee2fbca.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  })
  mainWindow.hookWindowMessage(278, function () {
    mainWindow.setEnabled(false)
    setTimeout(() => {
      mainWindow.setEnabled(true)
    }, 100)
    return true
  })
  mainWindow.once('ready-to-show', () => {
    if (process.argv.indexOf('--openAsHidden') < 0) mainWindow.show()
  })
  mainWindow.on('close', (event) => {
    event.preventDefault()
    mainWindow.hide()
  })
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
  let trayMenuTemplate = [
    {
      label: '显示主面板',
      click: () => {
        mainWindow.isVisible() ? '' : mainWindow.show()
        mainWindow.moveTop()
      }
    },
    {
      label: '找不着了',
      click: () => {
        mainWindow.center()
        mainWindow.isVisible() ? '' : mainWindow.show()
        mainWindow.moveTop()
      }
    },
    {
      label: '设置',
      click: () => {
        mainWindow.webContents.send('openSetting')
        mainWindow.isVisible() ? '' : mainWindow.show()
        mainWindow.moveTop()
      }
    },
    {
      label: '重启',
      click: () => {
        app.relaunch()
        app.exit()
      }
    },
    {
      label: '退出',
      click: () => {
        app.exit()
      }
    }
  ]

  let iconPath = path.join(__dirname, '../renderer/assets/icon.7ee2fbca.png')
  appTray = new Tray(iconPath)
  const contextMenu = Menu.buildFromTemplate(trayMenuTemplate)
  appTray.setToolTip('Notice')
  appTray.setContextMenu(contextMenu)
  appTray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
  })
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
    session.defaultSession.loadExtension(
      path.resolve(
        'C:\\Users\\Yeean\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Extensions\\olofadcdnkkjdfgjcmjaadnlehnnihnl\\6.5.0_0'
      )
    )
  }
  return mainWindow
}
let mainWindow = null
app.on('ready', () => {
  app.setAsDefaultProtocolClient('Notice')
  if (!existsSync(dataPath)) {
    writeFileSync(
      dataPath,
      JSON.stringify({
        Notes: [],
        toDo: {
          unfinished: [],
          completed: []
        }
      })
    )
  }
  mainWindow = createWindow()
  MainIpc(mainWindow)
  // OnlineDB(mainWindow)
})
