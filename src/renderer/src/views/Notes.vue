<script setup>
import { reactive, ref, watch, onMounted, nextTick } from 'vue'
import block from '../components/block.vue'
import { useCounterStore } from '../stores/index'
import { onBeforeRouteLeave } from 'vue-router'
import hljs from 'highlight.js'
import { marked } from 'marked'
import turndown from 'turndown'
const counter = useCounterStore()
const { ipcRenderer, clipboard } = window.api
const Notes = ipcRenderer.sendSync('getNotes')
const notes = reactive(Notes)
const lock = ref(false)
const NoteContent = ref(null)
const MarkDownContent = ref(null)
const screenShot = ref(true)
let turnDown = new turndown({ preformattedCode: true })
turnDown.addRule('pre', {
  filter: ['pre'],
  replacement: function (content) {
    return '\n\n```\n' + content + '\n```\n\n'
  }
})

const change = (item) => {
  if (!counter.NoteMultiple) {
    counter.NoteChangingBlock = item
    NoteContent.value.scrollTop = 0
    counter.NoteChanging = !counter.NoteChanging
  } else {
    item.multiple = !item.multiple
  }
}
const selected = (select, item) => {
  nextTick(() => {
    item.multiple = select ? true : false
  })
}

const fromIndex = ref(null)
const currentIndex = ref(null)
const exchange = (arr, index, target) => {
  if (index > target) {
    arr.splice(target, 0, arr[index])
    arr.splice(index + 1, 1)
  } else {
    arr.splice(target + 1, 0, arr[index])
    arr.splice(index, 1)
  }
}

const dragstart = (index) => {
  fromIndex.value = index
}

const dragover = (e, index) => {
  if (fromIndex.value === null) return
  e.preventDefault()
  currentIndex.value = index
}

const drop = (index) => {
  currentIndex.value = null
  exchange(notes, fromIndex.value, index)
  fromIndex.value = null
}

const dragleave = () => {
  currentIndex.value = null
}
const back = () => {
  lock.value = false
  counter.NoteChanging = !counter.NoteChanging
  if (counter.NoteMarkDowning) {
    counter.NoteMarkDowning = !counter.NoteMarkDowning
    ipcRenderer.send('MarkDowning', counter.NoteMarkDowning)
  }
  if (counter.NoteAdding) {
    if (
      counter.NoteChangingBlock.title.replace(/\s*/g, '') != '' ||
      NoteContent.value.innerText.replace(/\s*/g, '') != '' ||
      NoteContent.value.querySelector('img') != null
    ) {
      notes.unshift(counter.NoteChangingBlock)
    }
    counter.NoteAdding = !counter.NoteAdding
  } else {
    if (
      counter.NoteChangingBlock.title.replace(/\s*/g, '') == '' &&
      NoteContent.value.innerText.replace(/\s*/g, '') == '' &&
      NoteContent.value.querySelector('img') == null
    ) {
      notes.splice(notes.indexOf(counter.NoteChangingBlock), 1)
    }
  }
}
const wordChange = (param = null) => {
  document.execCommand(event.target.id, false, param)
}
const insertPicture = () => {
  lock.value = true
  for (let i = 0; i < event.target.files.length; i++) {
    let img = event.target.files[i].path.replace(/\\/g, '/')
    if (counter.NoteMarkDowning) {
      MarkDownContent.value.innerHTML += `![image](${img})`
      markDownChange()
    } else {
      NoteContent.value.innerHTML += `<img src="${img}"/>\n`
    }
    MarkDownContent.value.focus()
  }
}
const multiple = () => {
  counter.NoteMultiple = !counter.NoteMultiple
  if (!counter.NoteMultiple) {
    notes.forEach((item) => {
      item.multiple = false
    })
  }
}
const NoteDel = () => {
  let del = []
  notes.forEach((item) => {
    if (item.multiple) {
      del.push(item)
    }
  })
  del.forEach((item) => {
    notes.splice(notes.indexOf(item), 1)
  })
  counter.NoteMultiple = false
}
const screenshot = async () => {
  if (screenShot.value) {
    lock.value = true
    screenShot.value = false
    let shot = await ipcRenderer.sendSync('Screenshot')
    if (shot != false) {
      clipboard.writeImage(shot)
      if (counter.NoteMarkDowning) {
        MarkDownContent.value.innerHTML += `![image](${shot})`
        markDownChange()
      } else {
        NoteContent.value.innerHTML += `<img src="${shot}"/>\n`
      }
      NoteContent.value.focus()
    }
    screenShot.value = true
  }
}
const MarkDown = () => {
  counter.NoteMarkDowning = !counter.NoteMarkDowning
  ipcRenderer.send('MarkDowning', counter.NoteMarkDowning)
  if (counter.NoteMarkDowning) {
    MarkDownContent.value.innerText = turnDown.turndown(NoteContent.value.innerHTML)
  }
}
const markDownChange = () => {
  counter.NoteChangingBlock.content = marked(MarkDownContent.value.innerText)
  nextTick(() => {
    NoteContent.value.querySelectorAll('pre code').forEach((Element) => {
      hljs.highlightElement(Element)
    })
  })
}

onMounted(() => {
  NoteContent.value.onkeydown = (event) => {
    if (event.keyCode == 9) {
      event.preventDefault()
      document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;')
    }
    if (event.ctrlKey && event.keyCode == 90) {
      event.preventDefault()
      document.execCommand('undo', false, null)
    }
    if (event.ctrlKey && event.shiftKey && event.keyCode == 90) {
      event.preventDefault()
      document.execCommand('redo', false, null)
    }
  }
  NoteContent.value.onpaste = () => {
    event.preventDefault()
    if (event.clipboardData.getData('text') != '')
      document.execCommand('insertHTML', false, event.clipboardData.getData('text'))
  }
  NoteContent.value.onclick = () => {
    NoteContent.value.focus()
  }
  NoteContent.value.ondblclick = () => {
    if (event.target.tagName == 'IMG') {
      ipcRenderer.send('openImg', event.target.src)
    }
  }
  MarkDownContent.value.onkeydown = () => {
    if (event.keyCode == 9) {
      event.preventDefault()
      document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;')
    }
    if (event.ctrlKey && event.keyCode == 90) {
      event.preventDefault()
      document.execCommand('undo', false, null)
    }
    if (event.ctrlKey && event.shiftKey && event.keyCode == 90) {
      event.preventDefault()
      document.execCommand('redo', false, null)
    }
  }
  MarkDownContent.value.onpaste = () => {
    event.preventDefault()
    if (event.clipboardData.getData('text') != '')
      document.execCommand('insertHTML', false, event.clipboardData.getData('text'))
  }
})
onBeforeRouteLeave(() => {
  if (counter.NoteChanging) {
    counter.NoteChanging = !counter.NoteChanging
  }
  if (counter.NoteMultiple) counter.NoteMultiple = !counter.NoteMultiple
  notes.forEach((item) => {
    item.multiple = false
  })
  if (counter.NoteMarkDowning) {
    counter.NoteMarkDowning = !counter.NoteMarkDowning
    ipcRenderer.send('MarkDowning', counter.NoteMarkDowning)
  }
})
watch(
  () => lock.value,
  () => {
    if (!lock.value) {
      counter.NoteChangingBlock.content = NoteContent.value.innerHTML.replace(/<br>/g, '')
    }
  }
)
watch(
  () => counter.NoteChanging,
  (val) => {
    if (val) {
      nextTick(() => {
        NoteContent.value.querySelectorAll('pre code').forEach((Element) => {
          hljs.highlightElement(Element)
        })
      })
    }
  }
)
watch(
  () => notes,
  () => {
    ipcRenderer.send('updateNotes', Notes)
  },
  { deep: true }
)
</script>
<template>
  <div id="Notes">
    <transition mode="in-out" name="empty">
      <div v-if="notes.length < 1" id="empty">开始你的第一篇笔记</div>
      <div v-else id="multiple">
        <span @click="multiple">{{ counter.NoteMultiple ? '取消' : '选择' }}</span>
        <transition name="NoteDel">
          <span v-if="counter.NoteMultiple" @click="NoteDel"> 删除 </span>
        </transition>
      </div>
    </transition>
    <TransitionGroup name="notes" tag="div">
      <block
        v-for="(item, index) in notes"
        :key="item"
        draggable="true"
        :title="item.title"
        :content="item.content"
        :time="item.time"
        :selected="item.multiple"
        @note-change="change(item)"
        @selected="(select) => selected(select, item)"
        @dragstart="dragstart(index)"
        @dragover="dragover($event, index)"
        @drop="drop(index)"
        @dragleave="dragleave"
      />
    </TransitionGroup>
    <transition name="changing">
      <div
        id="change"
        :style="{
          transform: counter['NoteChanging'] ? 'translateY(-100vh)' : 'translateY(0)',
          opacity: counter['NoteChanging'] ? 1 : 0,
          width: counter.NoteMarkDowning ? '98%' : '96%'
        }"
      >
        <div id="back" @click="back"></div>
        <div v-if="!counter.NoteMarkDowning" id="changeWords">
          <button id="removeFormat" value="removeFormat" @click="wordChange()">A</button>
          <button id="bold" style="font-weight: 700" @click="wordChange()">A</button>
          <button id="foreColor" style="color: var(--theme)" @click.self="wordChange('#42d392')">
            A
            <input id="foreColor" type="color" @change="wordChange($event.target.value)" />
          </button>
          <button
            id="hiliteColor"
            style="background: var(--theme); color: var(--Deep)"
            @click.self="wordChange('#42d392')"
          >
            A
            <input id="hiliteColor" type="color" @change="wordChange($event.target.value)" />
          </button>
          <button id="italic" style="font-style: italic" @click="wordChange()">A</button>
          <button id="underline" style="text-decoration: underline" @click="wordChange()">A</button>
          <button id="strikeThrough" style="text-decoration: line-through" @click="wordChange()">
            A
          </button>
        </div>
        <div id="Screenshot" @click="screenshot"></div>
        <div id="insertPicture">
          <input type="file" accept="image/*" multiple @change="insertPicture" />
        </div>
        <div
          id="markDown"
          :style="{
            fontSize: counter.NoteMarkDowning ? '18px' : '30px',
            lineHeight: counter.NoteMarkDowning ? '24px' : '22px',
            background: counter.NoteMarkDowning ? 'var(--theme)' : 'none',
            color: counter.NoteMarkDowning ? 'var(--Deep)' : 'var(--theme)'
          }"
          @click="MarkDown"
        >
          M
        </div>
        <div id="title">
          <input
            v-model.trim="counter.NoteChangingBlock.title"
            spellcheck="false"
            type="text"
            placeholder="标题"
          />
        </div>
        <span style="margin-top: 20px; margin-left: 80px; width: 100%; color: var(--theme)">
          {{ counter.NoteChangingBlock.time }}
        </span>
        <div style="width: 100%; margin-top: 48px; display: flex; flex-direction: row">
          <div
            id="NoteContent"
            ref="NoteContent"
            class="markdown-body"
            :style="{
              width: counter.NoteMarkDowning ? '50%' : '100%',
              marginRight: counter.NoteMarkDowning ? '4px' : '0'
            }"
            :contenteditable="!counter.NoteMarkDowning"
            spellcheck="false"
            @input="lock = true"
            @change="lock = false"
            v-html="counter.NoteChangingBlock.content"
          ></div>
          <div
            id="MarkDownContent"
            ref="MarkDownContent"
            spellcheck="false"
            contenteditable
            :style="{
              width: counter.NoteMarkDowning ? '50%' : '0%',
              padding: counter.NoteMarkDowning ? '8px' : '0'
            }"
            @input="markDownChange"
            @change="markDownChange"
          ></div>
        </div>
      </div>
    </transition>
  </div>
</template>
<style scoped>
#changeWords:hover {
  height: 118px;
  clip-path: polygon(-36px 0, 100% 0, 100% 100%, -36px 100%);
}
#changeWords input {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  background: var(--Deep);
  color: var(--theme);
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  transition: all 0.5s;
  position: absolute;
  top: 0;
  left: -44px;
}
#changeWords button {
  text-align: center;
  font-weight: 360;
  line-height: 24px;
  color: var(--theme);
  font-size: 32px;
  position: relative;
  background: none;
  border: none;
  outline: none;
  height: 36px;
  width: 36px;
  border-radius: 4px;
  transition: clip-path 0.3s;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
}
#changeWords button input {
  opacity: 1;
  border: none;
}
#changeWords button:nth-child(3):hover,
#changeWords button:nth-child(4):hover {
  clip-path: polygon(-36px 0, 100% 0, 100% 100%, -36px 100%);
  opacity: 1;
}
#changeWords {
  clip-path: polygon(0 -0, 100% 0, 100% 14%, 0 14%);
  width: 36px;
  height: 220px !important;
  display: flex;
  flex-direction: column;
  transition: clip-path 0.3s;
  align-items: center;
  justify-content: center;
  z-index: 1;
  position: absolute;
  top: 18px;
  right: 142px;
}
#MarkDownContent {
  padding: 0 8px;
  height: 532px;
  border: none;
  outline: none;
  font-size: 16px;
  border-radius: 8px;
  background: var(--Real);
  color: var(--Deep);
  overflow: scroll;
  word-break: break-word;
  white-space: pre-wrap;
}
#MarkDownContent::selection,
#MarkDownContent *::selection {
  background: var(--theme);
  color: var(--Deep);
}
#markDown {
  position: absolute;
  border-radius: 4px;
  font-weight: 360;
  width: 26px;
  height: 26px;
  color: var(--theme);
  text-align: center;
  transition: all 0.4s;
  background: none;
  font-size: 28px;
  line-height: 22px;
  top: 22px;
  right: 4px;
}
#Screenshot {
  position: absolute;
  top: 24px;
  right: 50px;
  width: 20px;
  height: 20px;
}
#Screenshot::before {
  border-radius: 2px;
  position: absolute;
  content: ' ';
  width: 100%;
  height: 100%;
  border-top: 2px solid var(--theme);
  border-right: 2px solid var(--theme);
  top: 1px;
  right: 1px;
}
#Screenshot::after {
  border-radius: 2px;
  position: absolute;
  content: ' ';
  width: 100%;
  height: 100%;
  border-left: 2px solid var(--theme);
  border-bottom: 2px solid var(--theme);
  bottom: 1px;
  left: 1px;
}
#insertPicture input {
  margin: 0 !important;
  height: 36px;
  opacity: 0;
}
#insertPicture::after {
  content: '';
  position: absolute;
  width: 4px;
  height: 4px;
  top: 4px;
  left: 4px;
  border-radius: 50%;
  border: 1px solid var(--theme);
  pointer-events: none;
}
#insertPicture::before {
  content: '';
  position: absolute;
  margin: 2px;
  width: 20px;
  height: 16px;
  border: 1px solid var(--theme);
  text-align: center;
  line-height: 36px;
  top: 15px;
  transform: rotate(54deg);
  pointer-events: none;
}
#insertPicture {
  border: 2px solid var(--theme);
  border-radius: 4px;
  position: absolute;
  outline: none;
  margin: 0;
  overflow: hidden;
  width: 20px;
  height: 20px;
  top: 22px;
  right: 96px;
}
#multiple span {
  color: var(--theme);
  width: 40%;
  height: 24px;
  background: var(--Shallow);
  display: flex;
  justify-content: center;
  border-radius: 6px;
  align-items: center;
}
#multiple {
  font-size: 14px;
  width: 120px;
  display: flex;
  justify-content: space-between;
  position: absolute;
  transform: translateY(-38px);
  z-index: 1;
}
#empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
  width: calc(100vw - 40px);
  color: var(--Virtual);
  position: absolute;
}
textarea {
  overflow: scroll;
}
#back {
  position: absolute;
  top: 12px;
  left: -4px;
  width: 36px;
  height: 36px;
}
#back::before {
  position: absolute;
  content: ' ';
  width: 10px;
  height: 10px;
  transform: rotate(45deg);
  border-left: 2px solid var(--theme);
  border-bottom: 2px solid var(--theme);
  top: 12px;
  left: 12px;
}

#Notes {
  width: 100vw;
  columns: 2;
  margin-top: 36px;
  column-gap: 24px;
}
#NoteContent img {
  width: 100%;
}
#NoteContent:focus {
  border: 1px solid var(--theme);
  border-top: 1px solid transparent;
}
#NoteContent {
  width: 100%;
  height: 540px;
  border: 1px solid transparent;
  outline: none;
  font-size: 16px;
  border-radius: 8px;
  background: transparent;
  overflow: scroll;
  word-break: break-word;
  white-space: pre-wrap;
  color: var(--Real);
  position: relative;
  padding: 4px 8px;
  transition: all 0.4s;
}
#title {
  width: 100%;
  background: transparent;
  position: absolute;
  display: flex;
  margin-top: 48px;
}
#title input {
  letter-spacing: 0;
  width: 100%;
  height: 100%;
  outline: none;
  border: none;
  font-size: 1rem;
  padding: 4px 8px;
  background: transparent;
  position: relative;
  margin: 0 !important;
  cursor: auto;
}
#title::after {
  content: '';
  position: absolute;
  bottom: -4px;
  width: 100%;
  height: 1px;
  background: var(--theme);
}
#change {
  transition: transform 0.4s ease, opacity 0.4s ease;
  display: flex;
  align-items: center;
  flex-direction: column;
  background: var(--Deep);
  border-radius: 6px;
  position: fixed;
  height: calc(100vh - 72px);
  z-index: 1;
  left: 0;
  right: 0;
  margin: 0 auto;
  bottom: -100vh;
}

.changing-leave-active {
  transition: all 0.24s ease-in;
}
.changing-enter-active {
  transition: all 0.24s ease-out;
}
.notes-move,
.notes-enter-active,
.notes-leave-active {
  transition: all 0.36s ease-out;
}
.notes-leave-to,
.notes-enter-from {
  opacity: 0;
  transform: scale(0.4);
}
.notes-leave-active {
  position: absolute;
}
.NoteDel-leave-to,
.NoteDel-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}
.NoteDel-move,
.NoteDel-enter-active,
.NoteDel-leave-active {
  transition: all 0.4s;
}
.empty-enter-active {
  transition: all 0.1s ease-in;
}
.empty-leave-active {
  transition: all 0.4s cubic-bezier(0.39, 0.57, 0.56, 1);
}
.empty-leave-to,
.empty-enter-from {
  opacity: 0;
}
.empty-leave-active {
  position: absolute;
}
</style>
<style>
@import url(../assets/default.min.css);
@import url(../assets/markdown.css);
#NoteContent img {
  width: 100%;
  object-fit: cover;
  border-radius: 8px;
  cursor: default;
  text-align: center;
}
</style>
