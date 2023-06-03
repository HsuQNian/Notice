import {
  app,
  ipcMain,
  Notification,
  BrowserWindow,
  globalShortcut,
  nativeTheme,
  screen,
  desktopCapturer
} from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { checkForUpdates } from './updater'
import { exec, spawn } from 'child_process'
import path from 'path'
const Store = require('electron-store')
const store = new Store()
let notificationObject = null
if (store.get('config') === undefined)
  store.set('config', {
    Boot: false,
    Theme: 'light'
  })
const ex = process.execPath
let Settings = {
  Boot: store.get('config.Boot'),
  Theme: store.get('config.Theme'),
  ...(() =>
    store.get('config.loginConfig') != undefined
      ? { loginConfig: store.get('config.loginConfig') }
      : '')()
}
let dataPath = `${app.getPath('userData')}\\data.json`
export function MainIpc(mainWindow) {
  ipcMain.on('Start', () => {
    reminder(mainWindow)
  })
  ipcMain.on('Top', async (event, Boolean) => {
    // mainWindow.moveTop()
    mainWindow.setAlwaysOnTop(!Boolean, 'main-menu', 100000)
    event.returnValue = !Boolean
  })
  ipcMain.on('isTop', (event) => {
    event.returnValue = mainWindow.isAlwaysOnTop()
  })
  ipcMain.on('close', async () => {
    mainWindow.close()
  })
  ipcMain.on('getNotes', async (event) => {
    event.returnValue = readData().Notes
  })
  ipcMain.on('getToDo', async (event) => {
    event.returnValue = readData().toDo
  })
  ipcMain.on('updateToDo', async (event, arg) => {
    let data = readData()
    data.toDo = arg
    writeData(data)
    reminder(mainWindow)
  })
  ipcMain.on('updateNotes', async (event, arg) => {
    let data = readData()
    data.Notes = arg
    writeData(data)
  })
  ipcMain.on('updateBoot', async () => {
    Settings.Boot = !app.getLoginItemSettings({
      openAtLogin: Settings.Boot,
      path: ex,
      args: ['--openAsHidden']
    }).openAtLogin
    app.setLoginItemSettings({
      openAtLogin: Settings.Boot,
      path: ex,
      args: ['--openAsHidden']
    })
  })
  ipcMain.on('updateTheme', (event, arg) => {
    switch (arg) {
      case 'light':
        nativeTheme.themeSource = 'light'
        break
      case 'dark':
        nativeTheme.themeSource = 'dark'
        break
      case 'system':
        nativeTheme.themeSource = 'system'
        break
    }
    Settings.Theme = arg
  })
  ipcMain.on('getSetting', (event) => {
    event.returnValue = Settings
  })
  ipcMain.on('updateSetting', () => {
    store.set('config', Settings)
  })
  ipcMain.on('Notice', (event, { title, content }) => {
    let notification = new Notification({
      title: title,
      body: content,
      icon: path.join(__dirname, '../renderer/assets/icon.7ee2fbca.png')
    })
    notification.show()
    notification.on('click', () => {
      mainWindow.isVisible() ? '' : mainWindow.show()
      mainWindow.webContents.send('GoToDo')
    })
  })
  ipcMain.on('Pop', (event, arg) => {
    const win = new BrowserWindow({
      width: screen.getPrimaryDisplay().workAreaSize.width,
      height: 240,
      x: 0,
      y: 0,
      show: false,
      frame: false,
      skipTaskbar: true,
      movable: false,
      resizable: false,
      fullscreenable: false,
      alwaysOnTop: true,
      transparent: true,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        nodeIntegration: true,
        contextIsolation: false
      }
    })
    win.loadURL(path.join(__dirname + '/../renderer/index.html#Pop'))
    win.hookWindowMessage(278, function () {
      win.setEnabled(false)
      setTimeout(() => {
        win.setEnabled(true)
      }, 100)
      return true
    })
    setTimeout(() => {
      win.close()
    }, 4200)
    win.webContents.on('did-finish-load', async () => {
      win.webContents.send('PopContent', {
        content: arg.content,
        time: arg.time
      })
      win.showInactive()
      win.setAlwaysOnTop(true, 'main-menu', 100)
    })
  })
  switch (store.get('config.Theme')) {
    case 'light':
      nativeTheme.themeSource = 'light'
      break
    case 'dark':
      nativeTheme.themeSource = 'dark'
      break
    case 'system':
      nativeTheme.themeSource = 'system'
  }
  globalShortcut.register('Alt+P', () => {
    mainWindow.isVisible()
      ? mainWindow.isAlwaysOnTop()
        ? mainWindow.hide()
        : (() => {
            mainWindow.moveTop()
            mainWindow.setAlwaysOnTop(true, 'main-menu', 100)
            mainWindow.webContents.send('setUpTop', true)
          })()
      : (() => {
          mainWindow.show()
          mainWindow.setAlwaysOnTop(false)
          mainWindow.webContents.send('setUpTop', false)
        })()
  })
  ipcMain.on('Screenshot', (ScreenshotEvent) => {
    console.log('Screenshot')
    const { size, scaleFactor } = screen.getPrimaryDisplay()
    desktopCapturer
      .getSources({
        types: ['screen'],
        thumbnailSize: {
          width: size.width * scaleFactor,
          height: size.height * scaleFactor
        }
      })
      .then(async (sources) => {
        const screenshot = new BrowserWindow({
          show: false,
          frame: false,
          skipTaskbar: true,
          movable: false,
          resizable: false,
          transparent: true,
          alwaysOnTop: true,
          webPreferences: {
            preload: path.join(__dirname, '../preload/index.js'),
            nodeIntegration: true,
            contextIsolation: false
          }
        })
        screenshot.hookWindowMessage(278, function () {
          screenshot.setEnabled(false)
          setTimeout(() => {
            screenshot.setEnabled(true)
          }, 100)
          return true
        })
        await screenshot.loadURL(path.join(__dirname + '/../renderer/index.html#Screenshot'))
        screenshot.setFullScreen(true)
        screenshot.moveTop()
        screenshot.setAlwaysOnTop(true, 'pop-up-menu', 1000000)
        screenshot.showInactive()
        screenshot.focus()
        ipcMain.once('getImg', (event) => {
          event.returnValue = sources[0].thumbnail.toDataURL()
        })
        ipcMain.once('screenshotSuccess', (event, arg) => {
          screenshot.close()
          let now = new Date()
          let ScreenshotPath = app.getPath('userData').replace(/\\/g, '/') + '/Screenshot'
          let exists = existsSync(ScreenshotPath)
          let name = `/${now
            .toLocaleDateString('chinese', { year: 'numeric', day: '2-digit', month: '2-digit' })
            .split('/')
            .join('-')}T${now.getTime()}.png`
          if (!exists) {
            mkdirSync(ScreenshotPath)
          }
          writeFileSync(
            ScreenshotPath + name,
            Buffer.from(arg.replace(/^data:image\/\w+;base64,/, ''), 'base64'),
            {
              encoding: 'base64'
            }
          )
          ScreenshotEvent.returnValue = ScreenshotPath + name
          ipcMain.removeAllListeners('screenshotCancel')
        })
        ipcMain.once('screenshotCancel', () => {
          screenshot.close()
          ScreenshotEvent.returnValue = false
          ipcMain.removeAllListeners('screenshotSuccess')
        })
      })
  })
  ipcMain.on('MarkDowning', (event, arg) => {
    mainWindow.setResizable(true)
    if (arg) {
      mainWindow.setSize(1080, 720)
    } else {
      mainWindow.setSize(540, 720)
    }
    mainWindow.setResizable(false)
  })

  ipcMain.on('openImg', async (event, arg) => {
    exec(`start ${decodeURI(arg).replace(/\\/g, '/').replace('file:///', '').replace(' ', '" "')}`)
  })

  ipcMain.on('downloadNew', (event, arg) => {
    checkForUpdates(mainWindow, arg)
  })

  ipcMain.on('openFile', () =>
    exec(
      `start ${app
        .getPath('userData')
        .replace(/\\/g, '/')
        .replace('file:///', '')
        .replace(' ', '" "')}`
    )
  )

  ipcMain.on('install', () => {
    spawn(
      `${app.getPath('userData').replace(/\\/g, '/').replace('file:///', '').replace(' ', '" "')}/${
        readdirSync(app.getPath('userData')).filter((item) => item.includes('Notice'))[0]
      }`,
      ['/S', '--force-run'],
      {
        detached: true,
        stdio: 'ignore'
      }
    ).unref()
    app.exit()
  })

  reminder(mainWindow)
  app.on('second-instance', (event, commandLine) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return
    }
    let time = null
    switch (commandLine[2].split(':')[1]) {
      case 'Ten':
        time = 10
        break
      case 'Half':
        time = 30
        break
      case 'One':
        time = 60
        break
    }
    let notification
    if (notificationObject !== null && time !== null) {
      notification = new Notification({
        timeoutType: 'never',
        toastXml: `
    <toast activationType="protocol" scenario="incomingCall">
        <visual>
            <binding template="ToastGeneric">
                <text>提醒</text>
                <text>${notificationObject.content}</text>
            </binding>
        </visual>
        <actions>
            <action content="十分钟后" arguments="Notice:Ten" activationType="protocol"/>
            <action content="半小时后" arguments="Notice:Half" activationType="protocol"/>
            <action content="一小时后" arguments="Notice:One" activationType="protocol"/>
            <action content="已然知晓" arguments="Notice:None" activationType="protocol"/>
        </actions>
    </toast>
    `
      })
      setTimeout(() => {
        notification.show()
        time = null
      }, time * 1000 * 60)
    }
  })
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('AppVersion', app.getVersion())
    let packages = readdirSync(app.getPath('userData')).filter((item) => item.includes('Notice'))[0]
    packages?.split('-')[1].split('.exe')[0] > app.getVersion() && packages?.split('-')[0] != 'temp'
      ? mainWindow.webContents.send('packageStatus', true) //更新
      : mainWindow.webContents.send('packageStatus', false) //检查更新
  })
}
function readData() {
  return JSON.parse(readFileSync(dataPath))
}
function writeData(data) {
  writeFileSync(dataPath, JSON.stringify(data))
}

export function reminder(mainWindow) {
  let timer = null
  let { unfinished, completed } = readData().toDo
  completed.forEach((item) => {
    if (item.remind?.Time) {
      let now = new Date()
      let Time = new Date(item.remind.Time)
      let condition =
        item.remind.Time.split('T')[0] <
        now
          .toLocaleDateString('chinese', {
            year: 'numeric',
            day: '2-digit',
            month: '2-digit'
          })
          .split('/')
          .join('-')
      if (
        (condition && item.remind.Repetition === 'day') ||
        (condition && Time.getDay() === now.getDay() && item.remind.Repetition === 'week') ||
        (condition && Time.getDate() === now.getDate() && item.remind.Repetition === 'month')
      ) {
        item.isDo = false
        item.remind.Time = `${now
          .toLocaleDateString('chinese', {
            year: 'numeric',
            day: '2-digit',
            month: '2-digit'
          })
          .split('/')
          .join('-')}T${item.remind.Time.split('T')[1]}`
        delete item.CompletedTime
        unfinished.push(item)
        completed.splice(completed.indexOf(item), 1)
      }
    }
  })
  unfinished.forEach((item) => {
    let now = new Date()
    if (item.remind?.Time) {
      let Time = new Date(item.remind.Time)
      let condition =
        item.remind.Time.split('T')[0] <
        now
          .toLocaleDateString('chinese', {
            year: 'numeric',
            day: '2-digit',
            month: '2-digit'
          })
          .split('/')
          .join('-')
      if (
        (condition && item.remind.Repetition === 'day') ||
        (condition && Time.getDay() === now.getDay() && item.remind.Repetition === 'week') ||
        (condition && Time.getDate() === now.getDate() && item.remind.Repetition === 'month')
      ) {
        if (
          item.remind.Time.split('T')[1] >
          now.toLocaleTimeString('chinese', { hour: '2-digit', minute: '2-digit' })
        )
          item.reminder = true
        item.remind.Time = `${now
          .toLocaleDateString('chinese', {
            year: 'numeric',
            day: '2-digit',
            month: '2-digit'
          })
          .split('/')
          .join('-')}T${item.remind.Time.split('T')[1]}`
      }
    }
  })
  let data = readData()
  data.toDo = { unfinished, completed }
  writeData(data)
  let remindArray = unfinished.filter((item) => {
    if (item.remind?.Time) {
      let now = new Date()
      let today = now
        .toLocaleDateString('chinese', {
          year: 'numeric',
          day: '2-digit',
          month: '2-digit'
        })
        .split('/')
        .join('-')

      return (
        item.remind.Time.split('T')[0] === today &&
        item.remind.Time.split('T')[1] >
          now.toLocaleTimeString('chinese', { hour: '2-digit', minute: '2-digit' })
      )
    }
  })
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  if (remindArray.length > 0) {
    timer = setInterval(() => {
      let now = new Date()
      remindArray.forEach((item) => {
        if (
          item.reminder &&
          item.remind.Time.split('T')[1] ==
            now.toLocaleTimeString('chinese', { hour: '2-digit', minute: '2-digit' })
        ) {
          item.remind.Mode.forEach((ModeItem) => {
            switch (ModeItem) {
              case 'Pop': {
                const win = new BrowserWindow({
                  width: screen.getPrimaryDisplay().workAreaSize.width,
                  height: 240,
                  x: 0,
                  y: 0,
                  show: false,
                  frame: false, // 无边框
                  skipTaskbar: true, // 使窗口不显示在任务栏中
                  movable: false, // 禁止窗口被用户移动
                  resizable: false, // 禁止窗口手动调整窗口大小
                  fullscreenable: false, // 禁止窗口可以进入全屏状态
                  alwaysOnTop: true, // 窗口是否总是显示在其他窗口之前
                  transparent: true, // 窗口是否透明
                  webPreferences: {
                    preload: path.join(__dirname, '../preload/index.js'),
                    nodeIntegration: true,
                    contextIsolation: false
                  }
                })
                win.loadURL(path.join(__dirname + '/../renderer/index.html#Pop'))
                win.hookWindowMessage(278, function () {
                  win.setEnabled(false)
                  setTimeout(() => {
                    win.setEnabled(true)
                  }, 100)
                  return true
                })
                win.webContents.on('did-finish-load', () => {
                  win.webContents.send('PopContent', {
                    content: item.content,
                    time: item.remind.Time.split('T')[1]
                  })
                  win.showInactive()
                })
                setTimeout(() => {
                  win.close()
                }, 4200)

                break
              }
              case 'Sound':
                mainWindow.webContents.send('Sound', item.content)
                break
              case 'Notice': {
                let notification = new Notification({
                  timeoutType: 'never',
                  toastXml: `
                  <toast activationType="protocol" scenario="incomingCall">
                  <visual>
                      <binding template="ToastGeneric">
                          <text>提醒</text>
                          <text>${item.content}</text>
                      </binding>
                  </visual>
                  <actions>
                      <action content="十分钟后" arguments="Notice:Ten" activationType="protocol"/>
                      <action content="半小时后" arguments="Notice:Half" activationType="protocol"/>
                      <action content="一小时后" arguments="Notice:One" activationType="protocol"/>
                      <action content="已然知晓" arguments="Notice:None" activationType="protocol"/>
                  </actions>
              </toast>
              `
                })
                notification.show()
                break
              }
            }
          })
          item.reminder = false
          notificationObject = item
        }
      })
    }, 1000)
  } else {
    clearInterval(timer)
    timer = null
  }
}
