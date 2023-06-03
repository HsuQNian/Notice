import { app, ipcMain } from 'electron'
import { existsSync, renameSync } from 'fs'

export function checkForUpdates(win, version) {
  let url = 'https://gitee.com/HsuQNian/HsuQNian.github.io/releases/download/Notice'
  let exeUrl = `${url}v${version}/Notice-${version}.exe`
  let path = app.getPath('userData')
  win.webContents.downloadURL(exeUrl)
  win.webContents.session.once('will-download', (event, item) => {
    const fileName = item.getFilename()
    if (item.canResume()) {
      item.resume()
    }
    if (existsSync(`${path}/${fileName}`)) {
      item.cancel()
    }
    item.setSavePath(`${path}/temp-${fileName}`)
    item.on('updated', (e, state) => {
      if (state === 'interrupted') {
        item.resume()
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          console.log('Download is paused')
        } else {
          console.log(((item.getReceivedBytes() / item.getTotalBytes()) * 100).toFixed(2) + '%')
          win?.webContents.send('downloadUrl-progress', {
            total: ((item.getReceivedBytes() / item.getTotalBytes()) * 100).toFixed(2) + '%'
          })
        }
      }
    })
    item.once('done', (e, state) => {
      if (state === 'completed') {
        if (existsSync(`${path}/temp-${fileName}`)) {
          renameSync(`${path}/temp-${fileName}`, `${path}/${fileName}`)
          win?.webContents.send('downloadUrl-progress', {
            total: '安装'
          })
        }
      } else {
        console.log(state)
        win?.webContents.send('downloadUrl-progress', {
          total: '下载失败'
        })
        setTimeout(() => {
          win?.webContents.send('downloadUrl-progress', {
            total: '检查更新'
          })
        }, 2000)
      }
    })
    ipcMain.on('pause-download', () => {
      item.pause()
    })
    // 取消下载
    ipcMain.on('cancel-download', () => {
      item.cancel()
    })
    //
    // 恢复下载
    ipcMain.on('resume-download', () => {
      if (item.canResume()) {
        item.resume()
      }
    })
  })
}
