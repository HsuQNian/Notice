<script setup>
import { ref, watch, nextTick } from 'vue'
import { useCounterStore } from '../stores/index'
defineEmits(['NoteChange', 'selected'])
const counter = useCounterStore()
const block = ref(null)
const content = ref(null)
const img = ref()
const app = defineProps({
  color: {
    type: String,
    default: 'hsl(240, 15%, 91%)'
  },
  title: {
    type: String
  },
  content: String,
  height: {
    type: String,
    default: '140px'
  },
  time: String,
  selected: Boolean
})
let selected = ref(app.selected)
watch(
  () => app.selected,
  (val) => {
    selected.value = val
  }
)
watch(
  () => app.content,
  () => {
    nextTick(() => {
      img.value = content.value.querySelector('img')
      if (Object.values(block.value.children).length < 4 && img.value) {
        block.value.insertBefore(img.value, block.value.lastChild)
      } else if (
        content.value.querySelectorAll('img').length < 1 &&
        block.value.children[2].tagName === 'IMG'
      ) {
        block.value.removeChild(block.value.children[2])
      } else if (block.value.children[2].tagName === 'IMG') {
        block.value.children[2].src = img.value.src
      }
    })
  },
  { immediate: true }
)
</script>
<template>
  <div ref="block" :style="{ minHeight: height }" class="block" @click="$emit('NoteChange')">
    <h4 class="title" :style="{ height: app.content == '' ? '24px' : '24px' }">
      {{ app.title }}
    </h4>
    <div
      v-if="app.content == '开始你的第一篇笔记'"
      style="flex: auto; width: 100%"
      :style="app.content == '开始你的第一篇笔记' ? { color: 'var(--Virtual)' } : {}"
    ></div>
    <div ref="content" class="content" style="font-size: 14px" v-html="app.content"></div>
    <div class="time">
      {{ app.time }}
      <transition name="Multiple" mode="in-out">
        <input
          v-if="counter.NoteMultiple"
          id="selected"
          v-model="selected"
          type="checkbox"
          @change="$emit('selected', selected)"
        />
      </transition>
    </div>
  </div>
</template>
<style scoped>
#selected {
  position: absolute;
  bottom: 8px;
  transform: scale(1.2);
  right: 4px;
}
.time {
  height: 32px;
  display: flex;
  align-items: center;
  margin-bottom: 2px;
  color: var(--Virtual);
}
.block {
  width: 240px;
  background-color: var(--Shallow);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.2s ease;
  position: relative;
  max-height: 462px;
  box-shadow: 0 0 2px var(--theme) inset;
  -webkit-user-drag: v-bind('!counter.NoteMultiple?"element":"none"');
}
.title {
  margin-top: 4px;
  font-weight: 540;
  word-break: break-word;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
  padding: 0 24px;
  color: var(--Real);
  height: 24px;
}
.content {
  word-break: break-all;
  text-overflow: ellipsis;
  color: var(--Real);
  overflow: hidden !important;
  max-height: 80px;
  min-height: 0;
  position: relative;
  flex: 1;
  margin: 0 12px;
}
.Multiple-enter-active,
.Multiple-leave-active {
  transition: all 0.4s ease;
}
.Multiple-enter-from,
.Multiple-leave-to {
  opacity: 0;
}
.Multiple-enter-to,
.Multiple-leave {
  opacity: 1;
}
</style>
<style>
.block > img {
  width: 92% !important;
  object-fit: cover;
  border-radius: 8px;
  max-height: 320px;
  margin: 0 12px;
}
.content img {
  display: none !important;
}

.block {
  break-inside: avoid;
}

.block:nth-child(2n + 1) {
  margin: 24px 0;
}

.block:nth-child(1) {
  margin-top: 0px;
}

.block:nth-child(2n + 2) {
  margin: 24px 0;
}
</style>
