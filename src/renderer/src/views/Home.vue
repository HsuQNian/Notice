<script setup>
import { watch, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCounterStore } from '../stores/index'
const { ipcRenderer } = window.api
const counter = useCounterStore()
const orSo = ref('left')
const route = useRoute()
const router = useRouter()
const top = ref(null)
const isTop = ref(false)
const notTop = ref(false)
const content = ref(null)
ipcRenderer.on('GoToDo', () => {
  router.push('/toDo')
})
ipcRenderer.on('openSetting', () => {
  router.push('/setting')
})
ipcRenderer.on('setUpTop', (event, arg) => {
  isTop.value = arg
})
let arr = ['/Notes', '/toDo', '/setting']

const toTop = () => {
  if (route.path != '/setting')
    content.value.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
}
const add = () => {
  if (route.path === '/Notes') {
    if (counter.NoteMultiple) counter.NoteMultiple = !counter.NoteMultiple
    counter.$patch({
      NoteAdding: !counter.NoteAdding,
      NoteChanging: !counter.NoteChanging
    })
    counter.NoteChangingBlock = {
      title: '',
      content: '',
      multiple: false,
      time: `${new Date().toLocaleString().split(':').slice(0, 2).join(':')}`
    }
  } else {
    if (counter.ToDoMultiple) counter.ToDoMultiple = !counter.ToDoMultiple
    counter.$patch({
      ToDoAdding: !counter.ToDoAdding,
      ToDoChanging: !counter.ToDoChanging
    })
    counter.ToDoChangingStrip = {
      content: '',
      isDo: false,
      multiple: false
    }
  }
}
const send = () => {
  isTop.value = ipcRenderer.sendSync('Top', isTop.value)
}
const close = () => {
  ipcRenderer.send('close')
}
const scroll = () => {
  notTop.value = event.target.scrollTop > 0 ? true : false
}
onMounted(() => {
  isTop.value = ipcRenderer.sendSync('isTop')
  top.value.style.color = `var(${isTop.value ? '--Real' : '--Virtual'})`
})
router.beforeEach(async (to, from) => {
  orSo.value = arr.indexOf(to.path) < arr.indexOf(from.path) ? 'right' : 'left'
  content.value.scrollTo({
    top: 0,
    behavior: 'instant'
  })
})
watch(
  () => isTop.value,
  (val) => {
    top.value.style.color = `var(${val ? '--Real' : '--Virtual'})`
  }
)
</script>
<template>
  <div id="Home">
    <transition name="keys">
      <div
        v-if="(route.path == '/Notes' || route.path == '/toDo') && notTop"
        id="toTop"
        :style="{
          right: counter.NoteMultiple || counter.ToDoMultiple ? '44.8%' : '0',
          bottom: counter.NoteMultiple || counter.ToDoMultiple ? '0' : '44px'
        }"
        @click="toTop"
      ></div
    ></transition>
    <transition name="keys">
      <div
        v-if="
          (route.path == '/Notes' && !counter.NoteMultiple) ||
          (route.path == '/toDo' && !counter.ToDoMultiple)
        "
        id="add"
        @click="add"
      ></div>
    </transition>
    <nav id="header">
      <div>
        <router-link to="Notes">笔记</router-link>
        <router-link to="toDo">待办</router-link>
        <router-link
          to="setting"
          style="position: relative"
          :style="{
            color:
              (counter.packageStatus == '下载' || counter.packageStatus == '安装') &&
              route.path != '/setting'
                ? 'var(--Inverse)'
                : ''
          }"
          >设置</router-link
        >
      </div>
      <div>
        <span id="top" ref="top" @click="send">置顶</span>
        <span id="close" @click="close">关闭</span>
      </div>
    </nav>
    <div id="content" ref="content" @scroll="scroll">
      <router-view v-slot="{ Component }">
        <Transition :name="orSo" mode="out-in">
          <component :is="Component" ref="child" />
        </Transition>
      </router-view>
    </div>
  </div>
</template>
<style>
#options {
  letter-spacing: 4px;
  font-size: 1.12rem;
  margin: 0 8px;
  -webkit-app-region: no-drag;
}
#toTop {
  z-index: 1;
  bottom: 44px;
  margin: 12px;
  position: fixed;
  width: 36px;
  height: 36px;
  background-color: var(--theme);
  border-radius: 10px;
  transition: all 0.3s ease-in-out;
}
#toTop::after,
#toTop::before {
  content: '';
  position: absolute;
  left: 50%;
}
#toTop::before {
  transform: translate(-50%, -50%) rotate(90deg);
  width: 8px;
  height: 2px;
  top: 64%;
  background: var(--Deep);
}

#toTop::after {
  transform: translate(-50%, 120%) rotate(45deg);
  width: 8px;
  height: 8px;
  border-left: 2px solid var(--Deep);
  border-top: 2px solid var(--Deep);
  background: transparent;
}

#add {
  z-index: 1;
  bottom: 0;
  margin: 12px;
  right: 0;
  position: fixed;
  width: 36px;
  height: 36px;
  background-color: var(--theme);
  border-radius: 10px;
}

#add::before {
  transform: translate(-50%, -50%) rotate(90deg);
}

#add::after {
  transform: translate(-50%, -50%);
}

#add::after,
#add::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 2px;
  background: var(--Deep);
  top: 50%;
  left: 50%;
}

#top {
  letter-spacing: 4px;
  font-size: 1.04rem;
  margin-right: 28px;
  -webkit-app-region: no-drag;
  color: #bbb;
}
#close {
  letter-spacing: 4px;
  font-size: 1rem;
  margin-right: 28px;
  -webkit-app-region: no-drag;
  color: var(--Real);
}

#header {
  -webkit-app-region: drag;
  z-index: 1;
  display: flex;
  width: 100vw;
  height: 64px;
  position: fixed;
  background: var(--Deep);
  border-radius: 8px;
}
a {
  margin: 0 0 0 30px;
  font-size: 1.04rem;
}

a.router-link-exact-active {
  color: var(--theme);
}

#header div {
  flex: 1;
  display: flex;
  align-items: center;
}

#header div > * {
  transition: color 0.8s ease !important;
}
#header div:nth-child(1) {
  justify-content: flex-start;
}
#header div:nth-child(2) {
  justify-content: flex-end;
}
#Home {
  display: flex;
}

#content {
  border-radius: 8px;
  width: 100%;
  margin-top: 72px;
  height: calc(100vh - 72px - 40px);
  background-color: var(--Deep);
  padding: 20px 18px;
  overflow: scroll;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.left-leave-active,
.right-leave-active {
  transition: all 0.24s ease-in;
}

.left-enter-active,
.right-enter-active {
  transition: all 0.36s cubic-bezier(0.18, 0.89, 0.32, 1.12);
}

.left-enter-from {
  transform: translateX(100%);
}

.left-leave-to {
  transform: translateX(-100%);
}

.right-enter-from {
  transform: translateX(-100%);
}

.right-leave-to {
  transform: translateX(100%);
}

.keys-leave-active {
  transition: all 0.24s ease-in;
}

.keys-enter-active {
  transition: all 0.24s 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.27);
}
.keys-enter-from {
  transform: scale(0);
}
.keys-leave-to {
  transform: scale(0);
}
</style>
