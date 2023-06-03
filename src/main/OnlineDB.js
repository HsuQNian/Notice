import { app, ipcMain } from 'electron'
import { reminder } from './lib'
const { MongoClient } = require('mongodb')
const { readFileSync, writeFileSync } = require('fs')
const Store = require('electron-store')
const store = new Store()
const appPath = app.getPath('userData')
const dataPath = `${appPath}\\data.json`
const url = 'mongodb://mongo:BZpXPAC8bwiuSov23laA@containers-us-west-34.railway.app:5815'
// const url = 'mongodb://127.0.0.1:27017'
export async function OnlineDB(win) {
  const client = new MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  ipcMain.handle('login', async (event, { account, password }) => {
    try {
      await client.connect()
      const db = client.db('Notice')
      const collection = db.collection('Users')
      const OnlineData = await collection.findOne({
        Account: account,
        Password: password
      })
      if (OnlineData == null) return false
      else {
        let LocalNotes = (await readData()).Notes
        let localTodoUnfinished = (await readData()).toDo.unfinished
        let localTodoCompleted = (await readData()).toDo.completed
        let OnlineNotes = OnlineData.Data.Notes
        let OnlineTodoUnfinished = OnlineData.Data.toDo.unfinished
        let OnlineTodoCompleted = OnlineData.Data.toDo.completed
        let Notes = await OnlineToLocalSync(OnlineNotes, LocalNotes)
        let todoUnfinished = await OnlineToLocalSync(OnlineTodoUnfinished, localTodoUnfinished)
        let todoCompleted = await OnlineToLocalSync(OnlineTodoCompleted, localTodoCompleted)
        let data = {
          Notes: Notes,
          toDo: {
            unfinished: todoUnfinished,
            completed: todoCompleted
          }
        }
        writeData(data)
        store.set('config.loginConfig', {
          Name: OnlineData.Name,
          Account: account
        })
        reminder()
        return await store.get('config.loginConfig')
      }
    } finally {
      await client.close()
    }
  })
  ipcMain.handle('register', async (event, { account, password }) => {
    try {
      await client.connect()
      const db = client.db('Notice')
      const collection = db.collection('Users')
      const OnlineData = await collection.findOne({ Account: account })
      if (OnlineData != null) return false
      else {
        let name = { Name: `用户${(await collection.find({}).toArray()).length + 1}` }
        await collection.insertOne({
          ...name,
          Account: account,
          Password: password,
          Data: readData()
        })
        store.set('config.loginConfig', {
          ...name,
          Account: account
        })
        return await store.get('config.loginConfig')
      }
    } finally {
      await client.close()
    }
  })
  ipcMain.handle('changeName', async (event, { Account, name }) => {
    try {
      await client.connect()
      const db = client.db('Notice')
      const collection = db.collection('Users')
      await collection.updateOne(
        { Account: Account },
        {
          $set: {
            Name: name
          }
        }
      )
      store.set('config.loginConfig.Name', name)
    } finally {
      await client.close()
    }
    return true
  })
  ipcMain.handle('changePassword', async (event, { Account, oldPass, nextPass }) => {
    try {
      await client.connect()
      const db = client.db('Notice')
      const collection = db.collection('Users')
      const Password = await collection.findOne({
        Account: Account
      })
      if (Password.Password != oldPass) return false
      await collection.updateOne(
        { Account: Account },
        {
          $set: {
            Password: nextPass
          }
        }
      )
    } finally {
      await client.close()
    }
    return true
  })
  ipcMain.handle('sync', async (event, Account) => {
    console.log(Account)
    try {
      await client.connect()
      const db = client.db('Notice')
      const collection = db.collection('Users')
      await collection.updateOne(
        { Account: Account },
        {
          $set: {
            Data: await readData()
          }
        }
      )
    } finally {
      await client.close()
    }
    return true
  })
  ipcMain.on('logOff', async () => {
    store.delete('config.loginConfig')
  })
  win.webContents.on('did-finish-load', () => {
    win.webContents.send('loginConfig', store.get('config.loginConfig'))
  })
}
function readData() {
  return JSON.parse(readFileSync(dataPath))
}
function writeData(data) {
  writeFileSync(dataPath, JSON.stringify(data))
}
async function OnlineToLocalSync(OnlineData, LocalData) {
  let tempLocal = LocalData.concat(OnlineData)
  tempLocal = OnlineData.filter((item) => {
    return !JSON.stringify(LocalData).includes(JSON.stringify(item))
  })
  return LocalData.concat(tempLocal)
}