<script setup>
import { ref, reactive, watch, nextTick } from 'vue'
import strip from '../components/strip.vue'
import { useCounterStore } from '../stores/index'
import { onBeforeRouteLeave } from 'vue-router'
const ToDoStrip = ref(null)
const unfinishedDom = ref(null)
const completedDom = ref(null)
const counter = useCounterStore()
const { ipcRenderer } = window.api
const toDo = ipcRenderer.sendSync('getToDo')
const unfinished = reactive(toDo.unfinished)
const completed = reactive(toDo.completed)
const RepetitionValue = ['none', 'day', 'week', 'month']
const RepetitionName = ['不重复', '每天', '每周', '每月']
let timer = null
const trigger = async (Boolean, item) => {
  if (Boolean) {
    item.isDo = true
    item.CompletedTime = new Date()
      .toLocaleString('chinese', {
        year: 'numeric',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      .split('/')
      .join('-')
    unfinished.splice(unfinished.indexOf(item), 1)
    completed.unshift(item)
  } else {
    item.isDo = false
    delete item.CompletedTime
    completed.splice(completed.indexOf(item), 1)
    unfinished.push(item)
  }
}
const selected = (select, item) => {
  nextTick(() => {
    item.multiple = select ? true : false
  })
}
const fromIndex = ref(null)
const currentIndex = ref(null)
const dragging = ref(null)
const exchange = (arr, index, target) => {
  if (arr.indexOf(dragging.value) == -1) {
    if (arr == unfinished) {
      dragging.value.isDo = false
      delete dragging.value.CompletedTime
      completed.splice(completed.indexOf(dragging.value), 1)
      unfinished.splice(target, 0, dragging.value)
      console.log(target, index)
    } else {
      dragging.value.isDo = true
      dragging.value.CompletedTime = new Date()
        .toLocaleString('chinese', {
          year: 'numeric',
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
        .split('/')
        .join('-')
      unfinished.splice(unfinished.indexOf(dragging.value), 1)
      console.log(target, index)
      completed.splice(target + 1, 0, dragging.value)
    }
  } else {
    if (index > target) {
      arr.splice(target, 0, arr[index])
      arr.splice(index + 1, 1)
    } else {
      arr.splice(target + 1, 0, arr[index])
      arr.splice(index, 1)
    }
  }
}

const dragstart = (index, arr) => {
  dragging.value = null
  fromIndex.value = index
  dragging.value = arr[index]
}

const dragover = (e, index) => {
  if (fromIndex.value === null) return
  e.preventDefault()
  currentIndex.value = index
}

const drop = (index, arr) => {
  currentIndex.value = null
  exchange(arr, fromIndex.value, index)
  fromIndex.value = null
}

const dragleave = () => {
  currentIndex.value = null
}
const ToDoDel = () => {
  let del = []
  for (let i = 0; i < unfinished.length; i++) {
    if (unfinished[i].multiple) {
      del.push(unfinished[i])
    }
  }
  for (let i = 0; i < del.length; i++) {
    unfinished.splice(unfinished.indexOf(del[i]), 1)
  }
  del = []
  for (let i = 0; i < completed.length; i++) {
    if (completed[i].multiple) {
      del.push(completed[i])
    }
  }
  for (let i = 0; i < del.length; i++) {
    completed.splice(completed.indexOf(del[i]), 1)
  }
  counter.ToDoMultiple = false
}
const outChange = () => {
  counter.ToDoChanging = !counter.ToDoChanging
  if (
    counter.ToDoChangingStrip.remind != undefined &&
    counter.ToDoChangingStrip.remind.Time == ''
  ) {
    delete counter.ToDoChangingStrip.remind
  }
  if (counter.ToDoAdding) {
    if (counter.ToDoChangingStrip.content.replace(/\s*/g, '') != '') {
      if (counter.ToDoChangingStrip.isDo) {
        completed.unshift(counter.ToDoChangingStrip)
      } else {
        unfinished.unshift(counter.ToDoChangingStrip)
      }
    }
    counter.ToDoAdding = !counter.ToDoAdding
  } else {
    if (counter.ToDoChangingStrip.content.replace(/\s*/g, '') == '') {
      if (counter.ToDoChangingStrip.isDo) {
        completed.splice(completed.indexOf(counter.ToDoChangingStrip), 1)
      } else {
        unfinished.splice(unfinished.indexOf(counter.ToDoChangingStrip), 1)
      }
    }
  }
  ToDoStrip.value.style.transition =
    'transform 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.27), opacity 0.4s ease'
}
const change = (item) => {
  ToDoStrip.value.style.transition =
    'transform 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.27), opacity 0.4s ease'
  counter.ToDoChangingStrip = item
  counter.ToDoChanging = !counter.ToDoChanging
  setTimeout(() => {
    nextTick(() => {
      ToDoStrip.value.style.transition = 'min-height 0.4s ease'
    })
  }, 401)
}

const AddRemind = () => {
  !counter.ToDoChangingStrip.remind
    ? (counter.ToDoChangingStrip.remind = {
        Time: '',
        Repetition: 'none',
        Mode: ['Notice']
      })
    : delete counter.ToDoChangingStrip.remind
}
const enter = (...Boolean) => {
  event.target.style.flex = 4
  event.target.lastElementChild.style.opacity = 1
  switch (Boolean.length) {
    case 1:
      event.target.style.top = '-46px'
      event.target.style.height = 164 + 'px'
      break
    case 2:
      event.target.style.top = '-46px'
      event.target.style.height = 164 + 'px'
      break
  }
}
const leave = (...Boolean) => {
  event.target.style.flex = 1
  event.target.lastElementChild.style.opacity = 0
  switch (Boolean.length) {
    case 1:
      event.target.style.top = '2px'
      event.target.style.height = 116 + 'px'
      break
    case 2:
      event.target.style.top = '2px'
      event.target.style.height = 116 + 'px'
      break
  }
}

const multiple = () => {
  counter.ToDoMultiple = !counter.ToDoMultiple
  if (!counter.ToDoMultiple) {
    unfinished.forEach((item) => {
      item.multiple = false
    })
    completed.forEach((item) => {
      item.multiple = false
    })
  }
}
const Mode = () => {
  nextTick(() => {
    counter.ToDoChangingStrip.remind.Mode.forEach((item) => {
      switch (item) {
        case 'Pop':
          ipcRenderer.send('Pop', {
            content: counter.ToDoChangingStrip.content,
            time: counter.ToDoChangingStrip.remind.Time.split('T')[1]
          })
          break
        case 'Sound':
          {
            let utterThis = new SpeechSynthesisUtterance()
            utterThis.text = `提醒：${counter.ToDoChangingStrip.content}`
            utterThis.lang = 'zh'
            window.speechSynthesis.speak(utterThis)
          }
          break
        case 'Notice':
          ipcRenderer.send('Notice', {
            title: '提醒',
            content: counter.ToDoChangingStrip.content
          })
          break
      }
    })
  })
}
onBeforeRouteLeave(() => {
  if (counter.ToDoChanging) {
    counter.ToDoChanging = !counter.ToDoChanging
  }
  if (counter.ToDoMultiple) {
    counter.ToDoMultiple = !counter.ToDoMultiple
  }
  unfinished.forEach((item) => {
    item.multiple = false
  })
  completed.forEach((item) => {
    item.multiple = false
  })
})
watch(
  () => [unfinished, completed],
  () => {
    if (timer) {
      clearInterval(timer)
    }
    ipcRenderer.send('updateToDo', toDo)
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
        return item.remind.Time.split('T')[0] === today
      }
    })
    remindArray.length > 0
      ? (timer = setInterval(() => {
          let now = new Date()
          remindArray.forEach((item) => {
            setTimeout(() => {
              item.reminder =
                item.remind.Time.split('T')[1] >
                now.toLocaleTimeString('chinese', { hour: '2-digit', minute: '2-digit' })
            }, 10)
          })
        }, 1000))
      : clearInterval(timer)
  },
  { deep: true, immediate: true }
)
watch(
  () => counter.ToDoChangingStrip,
  ({ remind }) => {
    let ModeWatch
    if (remind != undefined) {
      ModeWatch = watch(
        () => remind.Mode,
        (val, old) => {
          if (val.length == 0) {
            remind.Mode = old
          }
        },
        { deep: true }
      )
    } else {
      ModeWatch && ModeWatch()
    }
  },
  { deep: true }
)
</script>

<template>
  <div id="toDo">
    <transition mode="in-out" name="empty">
      <div v-if="unfinished.length < 1 && completed.length < 1" id="empty">开始你的第一项待办</div>
      <div v-else id="multiple">
        <span @click="multiple">{{ counter.ToDoMultiple ? '取消' : '选择' }}</span>
        <transition name="TodoDel">
          <span v-if="counter.ToDoMultiple" @click="ToDoDel">删除</span>
        </transition>
      </div>
    </transition>
    <div
      id="unfinished"
      ref="unfinishedDom"
      style="display: flex; justify-content: center; flex-direction: column"
    >
      <TransitionGroup name="strips">
        <strip
          v-for="(item, index) in unfinished"
          :key="item"
          draggable="true"
          :content="item.content"
          :checked="item.isDo"
          :remind="item.remind"
          :reminder="item.reminder"
          :multiple="item.multiple"
          @trigger.self="(Boolean) => trigger(Boolean, item)"
          @to-do-change="change(item)"
          @selected="(select) => selected(select, item)"
          @dragstart="dragstart(index, unfinished)"
          @dragover="dragover($event, index)"
          @drop="drop(index, unfinished)"
          @dragleave="dragleave"
        />
      </TransitionGroup>
    </div>
    <div
      id="completed"
      ref="completedDom"
      style="display: flex; justify-content: center; flex-direction: column"
    >
      <transition name="completed">
        <div v-if="completed.length > 0" style="color: var(--Virtual)">已完成</div>
      </transition>
      <TransitionGroup name="strips">
        <strip
          v-for="(item, index) in completed"
          :key="item"
          draggable="true"
          :content="item.content"
          :checked="item.isDo"
          :multiple="item.multiple"
          @trigger.self="(Boolean) => trigger(Boolean, item)"
          @to-do-change="change(item)"
          @selected="(select) => selected(select, item)"
          @dragstart="dragstart(index, completed)"
          @dragover="dragover($event, index)"
          @drop="drop(index, completed)"
          @dragleave="dragleave"
        />
      </TransitionGroup>
    </div>
    <transition name="change" mode="in-out">
      <div v-if="counter['ToDoChanging']" id="change" @click.self="outChange"></div>
    </transition>
    <transition name="changing">
      <div
        id="strip"
        ref="ToDoStrip"
        :style="{
          transform: counter['ToDoChanging'] ? 'translateY(0px)' : 'translateY(100%)',
          opacity: counter['ToDoChanging'] ? 1 : 0,
          minHeight: !counter.ToDoChangingStrip.isDo
            ? counter.ToDoChangingStrip.remind
              ? 'calc(100vh * 0.36)'
              : 'calc(100vh * 0.18)'
            : 'calc(100vh * 0.16)'
        }"
      >
        <div id="changingStrip">
          <input
            v-if="counter.ToDoAdding"
            v-model="counter.ToDoChangingStrip.isDo"
            style="transform: scale(1.4)"
            type="checkbox"
          />
          <textarea
            v-model="counter.ToDoChangingStrip.content"
            :style="{ width: counter.ToDoAdding ? '460px' : '488px' }"
            spellcheck="false"
            type="text"
            placeholder="待办事项"
          />
        </div>
        <div
          v-if="!counter.ToDoChangingStrip.isDo"
          id="AddRemind"
          :style="{
            marginTop: counter.ToDoChangingStrip.remind ? '12px' : '8px'
          }"
        >
          <div @click="AddRemind">
            {{ counter.ToDoChangingStrip.remind ? '关闭提醒' : '设置提醒' }}
          </div>
        </div>
        <div v-else>
          <div style="margin-top: 8px; letter-spacing: 4px; color: var(--theme)">
            完成时间:{{
              (counter.ToDoChangingStrip.CompletedTime =
                counter.ToDoChangingStrip.isDo && counter.ToDoChangingStrip.CompletedTime
                  ? counter.ToDoChangingStrip.CompletedTime
                  : new Date()
                      .toLocaleString('chinese', {
                        year: 'numeric',
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                      .split('/')
                      .join('-'))
            }}
          </div>
        </div>
        <div v-if="counter.ToDoChangingStrip.remind" id="RemindSwitch">
          <div id="Time" @mouseenter="enter()" @mouseleave="leave()">
            <span>时间</span>
            <div>
              <input v-model="counter.ToDoChangingStrip.remind.Time" type="datetime-local" />
            </div>
          </div>
          <div id="Repetition" @mouseenter="enter(true)" @mouseleave="leave(true)">
            <span>重复</span>
            <div>
              <div
                v-for="item in RepetitionValue"
                :key="item"
                style="flex: 1; width: 100%; display: flex; justify-content: center"
              >
                <input
                  :id="item"
                  v-model="counter.ToDoChangingStrip.remind.Repetition"
                  :value="item"
                  type="radio"
                  name="Repetition"
                  style="display: none"
                />
                <label :for="item">
                  <span>{{ RepetitionName[RepetitionValue.indexOf(item)] }}</span>
                </label>
              </div>
            </div>
          </div>
          <div id="Mode" @mouseenter="enter(true, true)" @mouseleave="leave(true, true)">
            <span>方式</span>
            <div style="height: 100%; display: flex">
              <div style="position: absolute; top: 12px; left: 12px" @click="Mode">预览</div>
              <input
                id="Notice"
                v-model="counter.ToDoChangingStrip.remind.Mode"
                type="checkbox"
                value="Notice"
              />
              <label for="Notice"><span>通知</span></label>
              <input
                id="Sound"
                v-model="counter.ToDoChangingStrip.remind.Mode"
                type="checkbox"
                value="Sound"
              />
              <label for="Sound"><span>声音</span></label>
              <input
                id="Pop"
                v-model="counter.ToDoChangingStrip.remind.Mode"
                :checked="true"
                type="checkbox"
                value="Pop"
              />
              <label for="Pop"><span>弹窗</span></label>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
<style scoped>
#Mode {
  position: relative;
}
#Mode label {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 72px;
  height: 72px;
  flex: 1;
  border-radius: 12px;
  border: 4px solid var(--Shallow);
}
input:checked + label {
  background-color: var(--Deep);
}
#Repetition label {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 40px;
  border-radius: 8px;
  border: 4px solid var(--Shallow);
  font-size: 12px;
}
#Repetition input,
#Mode input {
  display: none;
}
#Repetition div {
  display: flex;
  align-items: center;
}
#Time input {
  height: 48px;
  border: none;
  border-bottom: 4px solid var(--Deep);
  border-radius: 12px;
  font-size: 20px;
  padding: 0 12px;
  margin-top: 24px;
  background: transparent;
}
#Time,
#Repetition,
#Mode {
  display: flex;
  flex-direction: column;
}
#RemindSwitch > div {
  height: 116px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.8s ease;
  background: var(--Shallow);
  border-radius: 8px;
  margin: 4px 0;
  width: 60px;
  top: 2px;
  position: relative;
  flex: 1;
  overflow: hidden;
  border: 1px solid var(--theme);
}
#RemindSwitch > div > *:last-child {
  opacity: 0;
  transition: all 0.8s ease;
  flex: 3;
  width: 100%;
}
#RemindSwitch > div > *:first-child {
  flex: 1;
  margin-top: 10px;
  font-size: 1rem;
}
#RemindSwitch > div:nth-child(1) {
  margin-right: 6px;
}
#RemindSwitch > div:nth-child(3) {
  margin-left: 6px;
}
#RemindSwitch {
  margin-top: 12px;
  width: 96%;
  height: 46%;
  border-radius: 12px;
  position: absolute;
  top: 116px;
  display: flex;
  justify-content: space-between;
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
  z-index: 1;
  transform: translateY(-38px);
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
#AddRemind div:first-child {
  background: var(--Shallow);
  padding: 8px;
  font-size: 0.8rem;
  border-radius: 8px;
  letter-spacing: 2px;
  border: 1px solid var(--theme);
}
#AddRemind {
  width: 96%;
  display: flex;
  justify-content: space-between;
  font-size: 1rem;
}
textarea {
  font-size: 16px;
  padding: 6px;
  border-radius: 8px;
  outline: none;
  border: none;
  resize: none;
  background: var(--Deep);
  color: var(--Real);
  height: 52px;
}
#changingStrip {
  height: 64px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  border: 1px solid var(--theme);
}
#strip {
  position: fixed;
  width: 96%;
  background: var(--Deep);
  border-radius: 12px;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  color: var(--Real);
  left: 0;
  right: 0;
  margin: 0 auto;
  bottom: 1.6%;
  border: 1px solid var(--theme);
}
#change {
  border-radius: 6px;
  position: absolute;
  bottom: 0;
  right: 0;
  left: 0;
  height: calc(100vh - 72px);
  z-index: 1;
  align-items: flex-end;
  transition: all 0.001s;
  background: rgba(0, 0, 0, 0.4);
  width: 540px;
}
#unfinished .strip:nth-child(1) {
  margin-top: 0;
}
#toDo {
  width: 100vw;
  margin-top: 36px;
}
.strips-move,
.strips-leave-active,
.strips-enter-active {
  transition: all 0.4s cubic-bezier(0.39, 0.57, 0.56, 1);
}
.strips-enter-from,
.strips-leave-to {
  transform: rotateX(90deg);
  opacity: 0;
  transform-origin: top;
}
.strips-leave-active {
  position: absolute;
}
.completed-move,
.completed-enter-active,
.completed-leave-active {
  transition: all 0.4s cubic-bezier(0.39, 0.57, 0.56, 1);
}
.completed-leave-to,
.completed-enter-from {
  opacity: 0;
}
.completed-leave-active {
  position: absolute;
}
.changing-move,
.changing-enter-active,
.changing-leave-active {
  transition: all 0.1s cubic-bezier(0.39, 0.57, 0.56, 1);
}
.TodoDel-leave-to,
.TodoDel-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}
.TodoDel-move,
.TodoDel-enter-active,
.TodoDel-leave-active {
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
