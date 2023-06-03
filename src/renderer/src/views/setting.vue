<script setup>
import { reactive, watch, ref } from 'vue'
import { useCounterStore } from '../stores/index'
import { onBeforeRouteLeave } from 'vue-router'
const Store = useCounterStore()
const { ipcRenderer } = window.api
const Settings = ipcRenderer.sendSync('getSetting')
const settings = reactive(Settings)
const AppVersion = ref(Store.AppVersion)
const mask = ref(null)
const update = ref(null)
const progress = ref(null)
const nameInput = ref(null)
const flag = ref(true)
const waiting = ref(false)
const changingName = ref(false)
const changeNameWaiting = ref(false)
const changingPass = ref(false)
const changingPassError = ref('')
const changePassWaiting = ref(false)
const warning = ref('')
const login = reactive({
  account: '',
  password: ''
})
const register = reactive({
  account: '',
  password: '',
  define: ''
})
const changePassword = reactive({
  old: '',
  new: ''
})

const Theme = () => {
  settings['Theme'] = !settings['Theme']
}

const Account = (param) => {
  if (Store.onLine || event.target.id == 'back' || param == 'back') {
    Store.SettingAccount = !Store.SettingAccount
    if (Store.SettingAccountLorR != 'login') Store.SettingAccountLorR = 'login'
    for (let index in { ...login, ...register }) {
      login[index] != undefined ? (login[index] = '') : ''
      register[index] = ''
    }
    if (changingName.value) changingName.value = false
    if (changingPass.value) changingPass.value = false
  } else {
    let temp = event.target.innerText
    event.target.innerText = '请先检查网络'
    setTimeout(
      (event) => {
        event.innerText = temp
      },
      2000,
      event.target
    )
  }
}

const LorS = (params) => {
  if (Store.SettingAccountLorR != params && flag.value) {
    for (let index in { ...login, ...register }) {
      login[index] != undefined ? (login[index] = '') : ''
      register[index] = ''
    }
    flag.value = false
    warning.value = ''
    Store.SettingAccountLorR = params
    mask.value.classList.add('mask')
    setTimeout(() => {
      mask.value.classList.remove('mask')
      flag.value = true
    }, 2000)
  }
}
const accountLogin = () => {
  if (Store.onLine) {
    waiting.value = true
    ipcRenderer
      .invoke('login', { account: login.account, password: login.password })
      .then((res) => {
        res ? (Store.Configuration = res) : (warning.value = '账号不存在或账号密码错误')
        waiting.value = false
      })
  } else {
    warning.value = '请检查网络'
  }
}
const changeName = (param) => {
  if (param !== 'carry' && nameInput.value == null && Store.onLine) changingName.value = true
  else if ((nameInput.value == null || nameInput.value == '') && Store.onLine)
    changingName.value = false
  else if (!changeNameWaiting.value && Store.onLine) {
    changeNameWaiting.value = true
    waiting.value = true
    ipcRenderer
      .invoke('changeName', { Account: Store.Configuration.Account, name: nameInput.value })
      .then((res) => {
        if (res) {
          Store.Configuration.Name = nameInput.value
          nameInput.value = null
          waiting.value = false
          changingName.value = false
          changeNameWaiting.value = false
        }
      })
  } else {
    let temp = Store.Configuration.Account
    Store.Configuration.Account = '请检查网络'
    setTimeout(() => {
      Store.Configuration.Account = temp
    }, 2000)
  }
}
const changePass = () => {
  event.target.innerText != '密码' && Store.onLine
    ? (() => {
        event.target.innerText == '完成' &&
        Store.onLine &&
        changePassword.old != '' &&
        changePassword.old.length >= 4 &&
        changePassword.new != '' &&
        changePassword.new.length >= 4
          ? (async () => {
              console.log('changePass')
              changePassWaiting.value = true
              waiting.value = true
              if (
                await ipcRenderer.invoke('changePassword', {
                  Account: Store.Configuration.Account,
                  oldPass: changePassword.old,
                  nextPass: changePassword.new
                })
              ) {
                waiting.value = false
                changingPassError.value = '修改成功'
                setTimeout(() => {
                  changingPassError.value = ''
                  changePassword.old = ''
                  changePassword.new = ''
                  changingPass.value = false
                  logOff()
                  Account('back')
                }, 2000)
              } else {
                waiting.value = false
                changingPassError.value = '密码错误'
                setTimeout(() => {
                  changingPassError.value = ''
                }, 2000)
              }
            })()
          : (() => {
              changingPass.value = event.target.innerText == '取消' ? false : true
            })()
      })()
    : ''
}

const accountRegister = () => {
  if (Store.onLine) {
    waiting.value = true
    ipcRenderer
      .invoke('register', {
        account: register.account,
        password: register.password
      })
      .then((res) => {
        res ? (Store.Configuration = res) : (warning.value = '账号已存在')
        waiting.value = false
      })
  } else {
    warning.value = '请检查网络'
  }
}
const Sync = async () => {
  let target = event.target
  if (Store.onLine) {
    waiting.value = true
    await ipcRenderer.invoke('sync', Store.Configuration.Account).then((res) => {
      if (res) {
        waiting.value = false
        target.innerText = '已完成同步'
        target.style.width = '120px'
        setTimeout(
          (target) => {
            target.innerText = '同步'
            target.style.width = '80px'
          },
          2000,
          target
        )
      }
    })
  } else {
    target.innerText = '请检查网络'
    target.style.width = '120px'
    setTimeout(
      (target) => {
        target.innerText = '同步'
        target.style.width = '80px'
      },
      2000,
      target
    )
  }
}
const logOff = () => {
  Store.Configuration = false
  for (let index in { ...login, ...register }) {
    login[index] != undefined ? (login[index] = '') : ''
    register[index] = ''
  }
  ipcRenderer.send('logOff')
}
const Boot = () => {
  settings['Boot'] = !settings['Boot']
}

const check = () => {
  if (Store.packageStatus == '安装') ipcRenderer.send('install')
  else if (Store.packageStatus == '重启') ipcRenderer.send('restart')
  else {
    update.value.disabled = true
    Store.packageStatus = '检查中'

    if (Store.onLine)
      fetch('https://hsuqnian.top/api/project/Notice')
        .then((res) => res.json())
        .then((data) => {
          data.version > AppVersion.value
            ? ipcRenderer.send('downloadNew', data.version)
            : (Store.packageStatus = '检查更新')
        })
    else {
      Store.packageStatus = '请先检查网络'
      setTimeout(() => {
        Store.packageStatus = '检查更新'
      }, 1200)
    }
  }
  update.value.disabled = false
}

const open = () => {
  ipcRenderer.send('openFile')
}

onBeforeRouteLeave(() => {
  if (Store.SettingAccount) Store.SettingAccount = !Store.SettingAccount
  if (Store.SettingAccountLorR != 'login') Store.SettingAccountLorR = 'login'
})
watch(
  () => [...Object.values(settings)],
  (val, oldVal) => {
    val.forEach((item, index) => {
      if (item != oldVal[index]) ipcRenderer.send(`update${Object.keys(settings)[index]}`, item)
    })
    ipcRenderer.send('updateSetting')
  },
  { deep: true }
)
watch(
  () => warning.value,
  (val) => {
    val != '' &&
      setTimeout(() => {
        warning.value = ''
      }, 3000)
  }
)
</script>
<template>
  <div id="setting">
    <div id="Theme">
      <span>主题</span>
      <div style="display: flex">
        <div>
          <input id="light" v-model="settings['Theme']" value="light" type="radio" name="Theme" />
          <label for="light" @click="Theme">
            <div><span style="color: #db5a6b">海棠</span><span>浅云</span></div>
          </label>
        </div>
        <div>
          <input id="dark" v-model="settings['Theme']" value="dark" type="radio" name="Theme" />
          <label for="dark" @click="Theme">
            <div><span style="color: #6ca984">箬竹</span><span>古鼎</span></div>
          </label>
        </div>
        <div>
          <input id="system" v-model="settings['Theme']" value="system" type="radio" name="Theme" />
          <label for="system" @click="Theme">
            <div>
              <span>跟随系统</span>
            </div>
          </label>
        </div>
      </div>
    </div>
    <!-- <div id="Account">
      <span>账号</span>
      <transition name="LoginSucceeded" mode="out-in">
        <div v-if="!Store.Configuration" style="color: var(--theme)">
          <span @click="Account">登录</span>
        </div>
        <div v-else style="color: var(--theme)">
          <span @click="Account">{{ Store.Configuration ? Store.Configuration.Name : '' }}</span>
          <span @click="logOff">注销</span>
        </div>
      </transition>
    </div> -->
    <div class="checkbox">
      <span>开机启动</span>
      <input v-model="settings['Boot']" type="checkbox" @click="Boot" />
    </div>
    <div id="Version">
      <span>当前版本</span>
      <div style="display: flex; flex-direction: column; align-items: center">
        <span style="margin: 0">{{ AppVersion }} </span>
        <button
          id="button"
          ref="update"
          :disabled="
            Store.packageStatus != '检查更新' &&
            Store.packageStatus != '安装' &&
            Store.packageStatus != '下载'
          "
          style="position: relative; overflow: hidden"
          :style="{
            backgroundColor:
              Store.packageStatus == '下载' || Store.packageStatus == '安装'
                ? 'var(--Inverse) !important'
                : ''
          }"
          @click="check"
        >
          <div
            id="progress"
            ref="progress"
            :style="{
              width: Store.DownloadProgress
            }"
            style="
              position: absolute;
              left: 0;
              top: 0;
              height: 100%;
              background: var(--theme);
              transition: width 0.24s ease, color 0.24s ease;
            "
          ></div>
          <p
            ref="update"
            style="
              z-index: 1;
              font-size: 14px;
              font-weight: 100;
              line-height: 28px;
              color: var(--Real);
              transition: color 0.8s ease;
            "
            :style="{
              color: Store.DownloadProgress.indexOf('%') ? 'var(--Real)' : 'var(--Real)'
            }"
          >
            {{ Store.DownloadProgress != '0%' ? Store.DownloadProgress : Store.packageStatus }}
          </p>
        </button>
      </div>
    </div>
    <div>
      <span>相关数据</span>
      <div
        style="
          cursor: pointer;
          margin-right: 12px;
          font-size: 1rem;
          color: var(--theme);
          letter-spacing: 4px;
          transition: color 0.8s ease;
        "
        @click="open"
      >
        位置
      </div>
    </div>
    <div>
      <span>关于</span>
      <a
        href="https://hsuqnian.top/project/Notice"
        target="_blank"
        style="
          font-size: 1rem;
          color: var(--theme);
          transition: color 0.8s ease;
          margin-right: 12px;
          cursor: pointer;
        "
        >官网</a
      >
    </div>
    <!-- <div
      id="Accounting"
      :style="{
        transform: Store.SettingAccount ? 'translateY(0)' : 'translateY(104%)'
      }"
    >
      <div id="back" @click="Account"></div>
      <div v-if="!Store.Configuration" style="width: 100%">
        <div class="title">
          <div
            v-for="index in [
              { login: '登录' },
              {
                register: '注册'
              }
            ]"
            :key="Object.keys(index)[0]"
            :style="{
              borderBottom:
                Store.SettingAccountLorR == Object.keys(index)[0]
                  ? '2px solid var(--theme)'
                  : '2px solid transparent'
            }"
            @click="LorS(Object.keys(index)[0])"
          >
            {{ Object.values(index)[0] }}
          </div>
        </div>
      </div>
      <transition name="waiting">
        <div v-if="waiting" id="waiting">
          <div class="three-body">
            <div class="three-body__dot"></div>
            <div class="three-body__dot"></div>
            <div class="three-body__dot"></div>
          </div>
        </div>
      </transition>

      <div
        class="content"
        :style="{
          marginTop: Store.Configuration ? '36px' : '0'
        }"
      >
        <div v-if="!Store.Configuration" style="display: flex; height: 100%">
          <div id="mask" ref="mask"></div>
          <transition name="LorS" mode="out-in">
            <div v-if="Store.SettingAccountLorR == 'login'" id="login">
              <div
                style="
                  flex: 1;
                  display: flex;
                  flex-direction: column;
                  width: 74%;
                  align-items: center;
                  justify-content: center;
                  margin: 0;
                "
              >
                <div
                  style="
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    position: relative;
                  "
                >
                  <input
                    v-model="login['account']"
                    spellcheck="false"
                    type="text"
                    maxlength="12"
                    :legal="login['account'].length > 3 && !/[^\x00-\xff]+/g.test(login['account'])"
                    placeholder="账号：4~12位"
                  />
                  <div style="transform: translate(64px, -200px)"></div>
                </div>
                <div
                  style="
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    position: relative;
                  "
                >
                  <input
                    v-model="login['password']"
                    type="password"
                    maxlength="12"
                    :legal="
                      login['password'].length > 3 && !/[^\x00-\xff]+/g.test(login['password'])
                    "
                    placeholder="密码：4~12位"
                  />
                  <div style="transform: translate(64px, -320px)"></div>
                </div>
              </div>
              <div style="position: absolute; top: 54%; color: var(--theme)">
                {{ warning ? warning : !Store.onLine ? '请检查网络' : '' }}
              </div>
              <div>
                <button
                  :disabled="
                    login['account'].length <= 3 ||
                    /[^\x00-\xff]+/g.test(login['account']) ||
                    login['password'].length <= 3 ||
                    /[^\x00-\xff]+/g.test(login['password']) ||
                    !Store.onLine
                  "
                  @click="accountLogin"
                >
                  登录
                </button>
              </div>
            </div>
            <div v-else-if="Store.SettingAccountLorR == 'register'" id="register">
              <div
                style="display: flex; flex-direction: row; align-items: center; position: relative"
              >
                <input
                  v-model="register['account']"
                  spellcheck="false"
                  type="text"
                  maxlength="12"
                  :legal="
                    register['account'].length > 3 && !/[^\x00-\xff]+/g.test(register['account'])
                  "
                  placeholder="账号：4~12位"
                />
                <div style="transform: translate(120px, -200px)"></div>
              </div>
              <div
                style="display: flex; flex-direction: row; align-items: center; position: relative"
              >
                <input
                  v-model="register['password']"
                  spellcheck="false"
                  type="text"
                  maxlength="12"
                  :legal="
                    register['password'].length > 3 && !/[^\x00-\xff]+/g.test(register['password'])
                  "
                  placeholder="密码：4~12位"
                />
                <div style="transform: translate(78px, -320px)"></div>
              </div>
              <div
                style="display: flex; flex-direction: row; align-items: center; position: relative"
              >
                <input
                  v-model="register['define']"
                  spellcheck="false"
                  type="text"
                  maxlength="12"
                  :legal="
                    register['password'].length > 3 && register['define'] == register['password']
                  "
                  placeholder="确认：4~12位"
                />
                <div style="transform: translate(64px, -400px)"></div>
              </div>
              <div style="position: absolute; top: 60%; color: var(--theme)">
                {{
                  warning
                    ? warning
                    : register['password'] != register['define']
                    ? '两次密码不一致'
                    : !Store.onLine
                    ? '请检查网络'
                    : ''
                }}
              </div>
              <div>
                <button
                  :disabled="
                    register['account'].length < 4 ||
                    /[^\x00-\xff]+/g.test(register['account']) ||
                    register['password'].length < 4 ||
                    /[^\x00-\xff]+/g.test(register['password']) ||
                    register['password'] != register['define'] ||
                    !Store.onLine
                  "
                  @click="accountRegister"
                >
                  注册
                </button>
              </div>
            </div>
          </transition>
        </div>
        <div v-else id="loggingIn">
          <div style="display: flex; flex-direction: column; align-items: center">
            <h1 v-if="!changingName" style="color: var(--theme); position: relative">
              {{ Store.Configuration.Name }}
              <div
                style="
                  position: absolute;
                  right: -18px;
                  top: 40%;
                  width: 10px;
                  height: 10px;
                  border: 1px solid;
                  border-radius: 2px;
                  cursor: pointer;
                "
                @click="changeName('')"
              >
                <div
                  style="
                    position: absolute;
                    top: -60%;
                    right: -10%;
                    width: 2px;
                    height: 12px;
                    background: var(--theme);
                    border: 2px solid var(--Deep);
                    border-radius: 2px;
                    transform: rotate(45deg);
                  "
                ></div>
              </div>
            </h1>
            <div
              v-else-if="changingName"
              style="display: flex; justify-content: center; position: relative"
            >
              <input
                v-model="nameInput"
                :placeholder="Store.Configuration.Name"
                spellcheck="false"
                style="
                  color: var(--theme);
                  background: var(--Shallow);
                  text-align: center;
                  cursor: text;
                  height: 40px;
                  font-size: 32px;
                  height: 43px;
                  width: 100%;
                  border: none;
                  font-size: 2em;
                  margin-inline-start: 0px;
                  margin-inline-end: 0px;
                  font-weight: bold;
                  letter-spacing: 0;
                "
                maxlength="12"
              />
              <div
                style="
                  transition: all 0.24s ease-in-out;
                  position: absolute;
                  width: 16px;
                  height: 8px;
                  border-left: 2px solid var(--theme);
                  border-bottom: 2px solid var(--theme);
                  right: -28px;
                  top: 30%;
                  transform: rotate(-45deg);
                "
                @click="changeName('carry')"
              ></div>
            </div>
            <h4 style="color: var(--theme); font-weight: 400">{{ Store.Configuration.Account }}</h4>
          </div>
          <div>
            <span
              ref="changePass"
              :style="{
                color:
                  (changePass.innerText == '完成' &&
                    changePassword['old'].length >= 4 &&
                    changePassword['new'].length >= 4) ||
                  !changingPass
                    ? 'var(--theme)'
                    : 'var(--Virtual)'
              }"
              @click="changePass"
              >{{ changingPass ? '完成' : '密码' }}{{
            }}</span>
            <span @click="changePass">{{ changingPass ? '取消' : '修改' }}</span>
          </div>
          <div
            style="
              display: flex;
              flex-direction: column;
              align-items: center;
              transition: all 0.4s;
              overflow: hidden;
            "
            :style="{
              height: changingPass ? '131px' : '0px'
            }"
          >
            <span style="width: 100%; text-align: center">
              {{ !changingPassError == '' ? changingPassError : '&nbsp;' }}
            </span>
            <input
              v-model="changePassword['old']"
              spellcheck="false"
              type="text"
              placeholder="初始密码"
            />
            <input
              v-model="changePassword['new']"
              spellcheck="false"
              type="text"
              placeholder="修改密码"
            />
          </div>
          <div>
            <span>数据同步</span>
            <button
              style="
                height: 30px;
                width: 80px;
                line-height: 30px;
                color: var(--Deep);
                font-weight: normal;
                font-size: 16px;
              "
              @click="Sync"
            >
              同步
            </button>
          </div>
        </div>
      </div>
    </div> -->
  </div>
</template>
<style scoped>
#back {
  position: absolute;
  top: 0;
  left: -4px;
  width: 36px;
  height: 36px;
  z-index: 1;
}
#back::before {
  position: absolute;
  content: ' ';
  width: 10px;
  height: 10px;
  transform: rotate(45deg) translate(0%, -10%);
  border-left: 2px solid var(--theme);
  border-bottom: 2px solid var(--theme);
  top: 12px;
  left: 12px;
}
#Accounting {
  position: absolute;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
  background: var(--Deep);
  margin: 0 !important;
  transform: translateY(-104%);
  transition: all 0.48s ease;
  display: flex;
  flex-direction: column;
}
.title {
  width: 100%;
  display: flex;
  justify-content: space-around;
  margin: 6px 0;
}
.title > div {
  cursor: pointer;
  transition: all 0.64s;
}
.content {
  width: 100%;
  height: 92%;
  position: relative;
  flex-direction: column;
  overflow: hidden;
  border-radius: 12px;
}
.content span {
  font-size: 1rem;
  color: var(--theme);
  padding: 0 28px;
}

.content input[type='text'] + div,
.content input[type='password'] + div {
  position: absolute;
  top: 50%;
  right: -16px;
  width: 12px;
  height: 12px;
  border-left: 2px solid var(--theme);
  border-bottom: 2px solid var(--theme);
  margin: 0 !important;
  transition: all 0.8s;
  display: block;
}
.content input[type='text']:focus:not(input[legal='true']) + div,
.content input[type='password']:focus:not(input[legal='true']) + div {
  transform: rotate(45deg) translate(0px, 0px) !important;
}
.content input[type='text'],
.content input[type='password'] {
  padding: 6px 12px;
  text-align: center;
  width: 320px;
  height: 32px;
  border: none;
  color: var(--Real) !important;
  border: 2px solid transparent;
  border-bottom: 2px solid var(--theme);
  background: transparent;
  border-radius: 8px;
  outline: none;
  transition: all 0.4s ease;
  position: relative;
  cursor: auto;
  font-size: 16px;
  margin-top: 18px;
}
.content > div {
  flex-direction: column;
  width: 100%;
  display: flex;
  justify-content: space-around;
  align-items: center;
}
#mask {
  position: absolute;
  top: 0;
  right: 0;
  width: 540px;
  height: 540px;
  background: var(--theme);
  transition: all 1.8s;
  transform: translate(84%, -84%) rotate(45deg);
  z-index: 1;
}
.mask {
  animation: mask 2s ease forwards;
}
#waiting {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  z-index: 2;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.three-body {
  --uib-size: 35px;
  --uib-speed: 0.8s;
  --uib-color: var(--theme);
  position: relative;
  display: inline-block;
  height: var(--uib-size);
  width: var(--uib-size);
  animation: spin78236 calc(var(--uib-speed) * 2.5) infinite linear;
}

.three-body__dot {
  position: absolute;
  height: 100%;
  width: 30%;
}

.three-body__dot:after {
  content: '';
  position: absolute;
  height: 0%;
  width: 100%;
  padding-bottom: 100%;
  background-color: var(--uib-color);
  border-radius: 50%;
}

.three-body__dot:nth-child(1) {
  bottom: 5%;
  left: 0;
  transform: rotate(60deg);
  transform-origin: 50% 85%;
}

.three-body__dot:nth-child(1)::after {
  bottom: 0;
  left: 0;
  animation: wobble1 var(--uib-speed) infinite ease-in-out;
  animation-delay: calc(var(--uib-speed) * -0.3);
}

.three-body__dot:nth-child(2) {
  bottom: 5%;
  right: 0;
  transform: rotate(-60deg);
  transform-origin: 50% 85%;
}

.three-body__dot:nth-child(2)::after {
  bottom: 0;
  left: 0;
  animation: wobble1 var(--uib-speed) infinite calc(var(--uib-speed) * -0.15) ease-in-out;
}

.three-body__dot:nth-child(3) {
  bottom: -5%;
  left: 0;
  transform: translateX(116.666%);
}

.three-body__dot:nth-child(3)::after {
  top: 0;
  left: 0;
  animation: wobble2 var(--uib-speed) infinite ease-in-out;
}

#login,
#register {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
#login span,
#register span {
  /* margin: 0 !important; */
  transition: all 0.5s;
  pointer-events: none;
}
#login div,
#register div {
  margin-top: 64px;
}
#login button,
#register button {
  height: 36px;
  line-height: 32px;
  font-weight: normal;
  font-size: 1rem;
  margin: 40px;
}
#loggingIn {
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: center;
  height: 100%;
  width: 100%;
}
#loggingIn > div:not(:nth-child(1)) {
  display: flex;
  align-items: center;
  width: 100%;
  height: 12%;
  justify-content: space-between;
}
#loggingIn > div:not(:nth-child(1)) span {
  padding: 0 18px;
  margin: 0;
}
#loggingIn input::-webkit-input-placeholder {
  color: var(--Virtual) !important;
}
label span {
  margin: 0 !important;
  font-size: 12px;
}
label div {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  letter-spacing: 2px;
  font-size: 12px;
  font-weight: 200;
}
#Account div span {
  cursor: pointer;
  margin: 12px !important;
}
#Theme input:checked + label div {
  background: var(--theme) !important;
}
#Theme input:checked + label div,
#Theme input:checked + label div span {
  color: var(--Deep) !important;
}
#Theme input {
  display: none;
}
#Theme label {
  display: flex;
  align-items: center;
  width: 88px;
  height: 36px;
  margin-left: 12px;
  border-radius: 14px;
}
#setting {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--Real);
  position: relative;
}
#setting > div {
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 1rem;
}
#setting > div:first-child {
  margin-top: 0.5rem;
}
#setting div span {
  margin-left: 12px;
  transition: color 0.8s ease;
}

.checkbox {
  display: flex;
  align-items: center;
}
input {
  width: 44px;
  height: 24px;
  position: relative;
  border-radius: 4px;
  border: 1px solid var(--Real);
}
/* input[legal='false'] ~ div { */
/* transform: translateX(20px); */
/* } */
input[legal='true'] ~ div {
  width: 20px !important;
  transform: translate(0%, 0%) rotate(-45deg) !important;
}
input:checked {
  border: 1px solid var(--theme);
}
input[type='checkbox']:checked::before {
  transform: translateX(20px);
  background: var(--Deep);
}
input[type='checkbox']::before {
  content: '';
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: var(--Real);
  position: absolute;
  left: 2px;
  top: 3px;
  transition: transform 0.8s, background 0.8s;
}
.switch {
  position: relative;
  width: 50px;
  height: 24px;
  border-radius: 20px;
}

.switch .ball {
  top: 2px;
  left: 2px;
  position: absolute;
  height: 20px !important;
  width: 20px !important;
  background: #fff;
  border-radius: 50%;
}

button {
  height: 32px;
  width: 100px;
  border: none;
  color: white;
  font-size: 18px;
  font-weight: 600;
  line-height: 44px;
  text-align: center;
  background-color: var(--theme);
  clip-path: polygon(
    0 0,
    5% 0,
    5% 15%,
    10% 15%,
    10% 0,
    100% 0,
    100% 75%,
    95% 75%,
    95% 85%,
    100% 85%,
    100% 100%,
    50% 100%,
    50% 85%,
    45% 85%,
    45% 100%,
    0 100%,
    0 65%,
    5% 65%,
    5% 50%,
    0 50%,
    0 0
  );
  display: flex;
  justify-content: center;
  transition: all 0.8s ease;
  border-top-right-radius: 5px;
  border-right: #aebdb7 2px solid;
  border-bottom: #b0bab1 2px solid;
}

button:active {
  user-select: none;
  transition: all 0.01s ease;
  border-right: #aebdb7 0 solid;
  border-bottom: #b0bab1 0 solid;
  transform: translateX(1px) translateY(1px);
}
button:disabled:active {
  transform: translateX(0px) translateY(0px);
  border-right: 2px solid #aebdb7;
  border-bottom: 2px solid #aebdb7;
}
button:disabled {
  background: var(--Deep);
}
.content button:disabled {
  /* background: var(--Deep); */
  background: var(--theme);
  filter: grayscale(72%);
}
.waiting-enter-active,
.waiting-leave-active {
  transition: all 0.8s ease;
}
.waiting-enter-from,
.waiting-leave-to {
  opacity: 0;
}
.waiting-enter-to,
.waiting-leave-from {
  opacity: 1;
}
.LoginSucceeded-enter-active,
.LoginSucceeded-leave-active {
  transition: all 0.8s ease;
}
.LoginSucceeded-enter,
.LoginSucceeded-leave-to {
  opacity: 0;
}
.LoginSucceeded-enter-to,
.LoginSucceeded-leave {
  opacity: 1;
}

.LorS-enter-active,
.LorS-leave-active {
  transition: all 0.4s ease;
}
.LorS-enter-from,
.LorS-leave-to {
  opacity: 0;
}
.LorS-enter-to,
.LorS-leave-from {
  opacity: 1;
}
.changingPass-enter-active,
.changingPass-leave-active {
  transition: all 0.8s ease;
}
.changingPass-enter-from,
.changingPass-leave-to {
  height: 0;
}
.changingPass-enter-to,
.changingPass-leave-from {
  height: 140px;
}
</style>
