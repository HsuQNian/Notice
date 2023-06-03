import { defineStore } from 'pinia'
export const useCounterStore = defineStore('main', {
  state: () => ({
    AppVersion: '',
    packageStatus: '检查更新',
    onLine: navigator.onLine,

    NoteAdding: false,
    NoteChanging: false,
    NoteMultiple: false,
    NoteMarkDowning: false,
    NoteChangingBlock: {},

    ToDoAdding: false,
    ToDoChanging: false,
    ToDoMultiple: false,
    ToDoChangingStrip: {},

    loginAccount: '',
    Configuration: {},
    LoginSucceeded: false,
    SettingAccount: false,
    DownloadProgress: '0%',
    SettingAccountLorR: 'login'
  })
})
