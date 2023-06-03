<script setup>
import { useCounterStore } from './stores/index'
const Store = useCounterStore()
window.onkeydown = () => {
  if (
    (event.ctrlKey && event.key == 'w') ||
    event.keyCode == '122'
    // ||(event.ctrlKey && event.key == 'r')
  )
    return false
}
window.addEventListener('online', () => {
  Store.onLine = true
})
window.addEventListener('offline', () => {
  Store.onLine = false
})
const { ipcRenderer } = window.api
ipcRenderer.on('Sound', (event, arg) => {
  let utterThis = new SpeechSynthesisUtterance()
  utterThis.text = `提醒：${arg}`
  utterThis.lang = 'zh'
  window.speechSynthesis.speak(utterThis)
})
ipcRenderer.on('AppVersion', (event, arg) => {
  Store.AppVersion = arg
})
ipcRenderer.on('packageStatus', (event, arg) => {
  Store.packageStatus = arg ? '安装' : '检查更新'
})
ipcRenderer.on('downloadUrl-progress', (event, arg) => {
  arg.total.indexOf('%') != -1
    ? (Store.DownloadProgress = arg.total.indexOf('100') > -1 ? '0%' : arg.total)
    : (Store.packageStatus = arg.total)
})
ipcRenderer.on('loginConfig', (event, arg) => {
  Store.Configuration = arg
})

setTimeout(() => {
  if (Store.packageStatus != '安装' && Store.onLine) {
    fetch('https://hsuqnian.top/api/project/Notice')
      .then((res) => res.json())
      .then((data) => {
        if (data.version <= Store.AppVersion) Store.packageStatus = '检查更新'
      })
  }
}, 1000)
</script>
<template>
  <router-view />
</template>
<style lang="less">
@import './styles.less';
</style>
