<script setup>
import { ref, watch, computed } from 'vue'
import { useCounterStore } from '../stores/index'
defineEmits(['trigger', 'ToDoChange', 'selected'])
const counter = useCounterStore()
const app = defineProps({
  content: String,
  checked: Boolean,
  remind: {
    type: Object,
    default: () => {
      return {}
    }
  },
  reminder: Boolean,
  multiple: Boolean
})
let checked = ref(app.checked)
let multiple = ref(app.multiple)
const strip = ref(null)
const Hour = ref(
  new Date(app.remind.Time).getHours() * 30 +
    (new Date(app.remind.Time).getMinutes() * 6) / 12 +
    'deg'
)
const Minute = ref(new Date(app.remind.Time).getMinutes() * 6 + 'deg')
let color
watch(
  () => app.remind.Time,
  (val) => {
    let Time = new Date(val)
    Hour.value = Time.getHours() * 30 + (Time.getMinutes() * 6) / 12 + 'deg'
    Minute.value = Time.getMinutes() * 6 + 'deg'
    color = computed(() => {
      return app.reminder ? 'var(--theme)' : 'var(--Virtual)'
    })
  },
  {
    immediate: true
  }
)
watch(
  () => app.multiple,
  (val) => {
    multiple.value = val
  }
)
</script>
<template>
  <div
    ref="strip"
    style="width: 504px"
    draggable="true"
    class="strip"
    @click.self="$emit('ToDoChange')"
  >
    <input
      v-model="checked"
      :style="{
        opacity: !counter.ToDoMultiple ? 1 : 0,
        transform: !counter.ToDoMultiple ? '' : 'translateX(-60px)  scale(1.4)'
      }"
      style="transition: all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.4)"
      type="checkbox"
      @change="$emit('trigger', checked)"
    />
    <div
      :style="{ transform: counter.ToDoMultiple ? 'translateX(-30px)' : 'translateX(0px)' }"
      style="
        margin-left: 10px;
        transition: all 0.2s;
        width: 64vw;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        color: var(--Real);
        line-height: 2;
        transition: all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.27);
        font-size: 16px;
      "
      draggable
      @click="$emit('ToDoChange')"
    >
      <mark>{{ content }}</mark>
    </div>
    <transition name="remind">
      <div
        :style="{
          opacity: !checked && remind.Time ? 1 : 0,
          transform: !counter.ToDoMultiple ? 'translateX(48px)' : 'translateX(18px)'
        }"
        style="transition: all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.4)"
        class="Clock"
      >
        <div class="disc"></div>
        <div class="Hour"></div>
        <div class="Minute"></div>
      </div>
    </transition>
    <input
      v-model="multiple"
      :style="{
        transform: counter.ToDoMultiple ? ' scale(1.4)' : 'translateX(40px)  scale(1.4)',
        opacity: counter.ToDoMultiple ? 1 : 0
      }"
      style="transition: all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.4)"
      type="checkbox"
      @change="$emit('selected', multiple)"
    />
  </div>
</template>
<style scoped>
.disc,
.Hour,
.Minute {
  transition: all 0.2s;
  position: absolute;
  width: 16px;
  height: 16px;
  transition: transform 0.2s;
}
.Hour {
  transform: rotate(v-bind('Hour'));
}
.Minute {
  transform: rotate(v-bind('Minute'));
}
.Hour::before,
.Minute::before {
  left: 0;
  right: 0;
  margin: auto;
  content: '';
  position: absolute;
  width: 2px;
  background: v-bind('color');
  border-radius: 12px;
}
.Hour::before {
  height: 6px;
  top: 2px;
}
.Minute::before {
  height: 8px;
  top: 0px;
}
.disc {
  border-radius: 50%;
  border: 1px solid v-bind('color');
}
.Clock div {
  transition: color 0.2s;
}
.Clock {
  width: 48px;
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}
.strip {
  margin: 8px 0;
  height: 56px;
  border-radius: 8px;
  background: var(--Shallow);
  display: flex;
  align-items: center;
  transition: width 0.24s cubic-bezier(0.39, 0.57, 0.56, 1),
    transform 0.24s cubic-bezier(0.39, 0.57, 0.56, 1);
  position: relative;
  box-shadow: 0 0 2px var(--theme);
  -webkit-user-drag: v-bind('!counter.ToDoMultiple?"element":"none"');
}

input[type='checkbox'] {
  margin-left: 20px;
  transform: scale(1.4);
}

mark {
  background-color: transparent;
  background-image: linear-gradient(to right, var(--theme), var(--theme));
  background-repeat: no-repeat;
  background-size: 0 0.1em;
  background-position: 0 64%;
  transition: background-size 0.4s ease, color 0.4s ease;
  word-break: break-word;
  color: var(--Real);
}
input[type='checkbox']:checked ~ div mark {
  color: var(--Virtual);
  background-size: 100% 0.1em;
}
.remind-enter-active,
.remind-leave-active {
  transition: all 0.4s 0.2s ease;
}

.remind-enter-from,
.remind-leave-to {
  opacity: 0;
}
</style>
