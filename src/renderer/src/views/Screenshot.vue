<script setup>
import { ref, onMounted, reactive } from 'vue'
const { ipcRenderer } = window.api
const screenshot = ref(null)
const oldCanvas = ref(null)
const nowCanvas = ref(null)
const clipTox = ref(null)
const options = ref(false)
const flag = ref(false)
const drag = ref(false)
const cut = ref(false)
// let resize = ref(false)
const dargArray = reactive([
  'TopLeft',
  'Top',
  'TopRight',
  'Left',
  'Right',
  'BottomLeft',
  'Bottom',
  'BottomRight'
])
const Img = new Image()
let imgData
let startPoint, endPoint

const shot = () => {
  ipcRenderer.send('screenshotSuccess', imgData(Img))
}

onMounted(() => {
  let oldContext = oldCanvas.value.getContext('2d')
  oldContext.clearRect(0, 0, oldCanvas.value.width, oldCanvas.value.height)
  Img.src = ipcRenderer.sendSync('getImg')
  Img.onload = () => {
    oldCanvas.value.width = Img.width
    oldCanvas.value.height = Img.height
    oldContext.drawImage(Img, 0, 0, oldCanvas.value.width, oldCanvas.value.height)
  }
  screenshot.value.onmousedown = () => {
    if (event.which != 1) return
    event.preventDefault()
    if (!cut.value) {
      flag.value = true
      let box = oldCanvas.value.getBoundingClientRect()
      startPoint = {
        x: event.clientX - box.left,
        y: event.clientY - box.top
      }
      clipTox.value.style.left = startPoint.x + 'px'
      clipTox.value.style.top = startPoint.y + 'px'
    }
  }
  screenshot.value.onmousemove = () => {
    if (flag.value && !cut.value) {
      let box = oldCanvas.value.getBoundingClientRect()
      endPoint = {
        x: event.clientX - box.left,
        y: event.clientY - box.top
      }
      if (endPoint.x < startPoint.x && endPoint.y < startPoint.y) {
        clipTox.value.style.left = endPoint.x + 'px'
        clipTox.value.style.top = endPoint.y + 'px'
        clipTox.value.style.width = startPoint.x - endPoint.x + 'px'
        clipTox.value.style.height = startPoint.y - endPoint.y + 'px'
      } else if (endPoint.x < startPoint.x && endPoint.y > startPoint.y) {
        clipTox.value.style.left = endPoint.x + 'px'
        clipTox.value.style.top = startPoint.y + 'px'
        clipTox.value.style.width = startPoint.x - endPoint.x + 'px'
        clipTox.value.style.height = endPoint.y - startPoint.y + 'px'
      } else if (endPoint.x > startPoint.x && endPoint.y < startPoint.y) {
        clipTox.value.style.left = startPoint.x + 'px'
        clipTox.value.style.top = endPoint.y + 'px'
        clipTox.value.style.width = endPoint.x - startPoint.x + 'px'
        clipTox.value.style.height = startPoint.y - endPoint.y + 'px'
      } else {
        clipTox.value.style.left = startPoint.x + 'px'
        clipTox.value.style.top = startPoint.y + 'px'
        clipTox.value.style.width = endPoint.x - startPoint.x + 'px'
        clipTox.value.style.height = endPoint.y - startPoint.y + 'px'
      }
    }
  }
  screenshot.value.onmouseup = () => {
    flag.value = false
    let box = oldCanvas.value.getBoundingClientRect()
    let clipBox = clipTox.value.getBoundingClientRect()
    let clipStartPoint = {
      y: clipTox.value.clientY - clipBox.top
    }
    let clipEndPoint = {
      y: screenshot.value.clientY - box.top
    }
    let y = clipEndPoint.y - clipStartPoint.y
    if (y - 64 < 0) {
      options.value.style.top = ''
      options.value.style.bottom = -56 + 'px'
    }
    if (
      parseInt(clipTox.value.style.top.slice(0, -2)) +
        parseInt(clipTox.value.style.height.slice(0, -2)) +
        64 >
      box.height
    ) {
      options.value.style.bottom = ''
      options.value.style.top = -56 + 'px'
    }
    cut.value = true
  }
  clipTox.value.onmousedown = (clipToxEvent) => {
    drag.value = true
    let box = oldCanvas.value.getBoundingClientRect()
    let clipBox = clipTox.value.getBoundingClientRect()
    let clipStartPoint = {
      x: clipToxEvent.clientX - clipBox.left,
      y: clipToxEvent.clientY - clipBox.top
    }
    screenshot.value.onmousemove = (screenshotEvent) => {
      if (drag.value) {
        let clipEndPoint = {
          x: screenshotEvent.clientX - box.left,
          y: screenshotEvent.clientY - box.top
        }
        let x = clipEndPoint.x - clipStartPoint.x
        let y = clipEndPoint.y - clipStartPoint.y
        if (x < 0) {
          x = 0
        } else if (x + clipBox.width > box.width) {
          x = oldCanvas.value.width - clipTox.value.style.width.slice(0, -2)
        }
        if (y - 50 < 0) {
          options.value.style.top = ''
          options.value.style.bottom = -56 + 'px'
        }
        if (
          parseInt(clipTox.value.style.top.slice(0, -2)) +
            parseInt(clipTox.value.style.height.slice(0, -2)) +
            50 >
          box.height
        ) {
          options.value.style.bottom = ''
          options.value.style.top = -56 + 'px'
        }
        if (y < 0) {
          y = 0
        } else if (y + clipBox.height > box.height) {
          y = oldCanvas.value.height - clipTox.value.style.height.slice(0, -2)
        }
        clipTox.value.style.left = x + 'px'
        clipTox.value.style.top = y + 'px'
      }
    }
  }
  clipTox.value.onmouseup = () => {
    drag.value = false
  }
  imgData = (Img) => {
    let nowContext = nowCanvas.value.getContext('2d')
    let clipBox = clipTox.value.getBoundingClientRect()
    let width = clipBox.width
    let height = clipBox.height
    nowCanvas.value.width = width
    nowCanvas.value.height = height
    nowContext.drawImage(
      Img,
      clipTox.value.style.left.slice(0, -2) * (Img.width / oldCanvas.value.width),
      clipTox.value.style.top.slice(0, -2) * (Img.height / oldCanvas.value.height),
      width,
      height,
      0,
      0,
      width,
      height
    )
    return nowCanvas.value.toDataURL('image/png')
  }
})

window.onkeydown = (event) => {
  if (event.keyCode === 27) {
    ipcRenderer.send('screenshotCancel')
  }
}
</script>

<template>
  <div id="screenshot" ref="screenshot">
    <canvas id="oldCanvas" ref="oldCanvas"></canvas>
    <div id="clipTox" ref="clipTox" :style="{ cursor: cut ? 'move' : 'auto' }">
      <div v-if="!flag && cut" id="options" ref="options">
        <div id="confirm" @click="shot"></div>
        <div id="cancel" @click="ipcRenderer.send('screenshotCancel')"></div>
      </div>
      <div>
        <div v-for="item in dargArray" :id="item" :key="item" @mouseenter.stop="dragBorder"></div>
      </div>
    </div>
    <canvas ref="nowCanvas" style="display: none"></canvas>
  </div>
</template>
<style scoped>
#cancel::after {
  content: '';
  position: absolute;
  width: 2px;
  height: 18px;
  background: var(--theme);
  transform: rotate(-45deg);
}
#cancel::before {
  content: '';
  position: absolute;
  width: 2px;
  height: 18px;
  background: var(--theme);
  transform: rotate(45deg);
}
#cancel {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}
#confirm::before {
  left: 6px;
  top: 0px;
  width: 6px;
  height: 14px;
  content: '';
  position: absolute;
  border-bottom: 2px solid var(--theme);
  border-right: 2px solid var(--theme);
  transform: rotate(45deg);
}
#confirm {
  position: relative;
}
#options div:nth-child(n):hover {
  background: var(--Real);
}
#options div:nth-child(n) {
  transition: all 0.2s;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  margin-left: 10px;
}
#options div:first-child {
  margin-right: 10px;
}
#options {
  position: absolute;
  bottom: -60px;
  right: -14px;
  height: 40px;
  background: var(--Deep);
  margin: 10px;
  border-radius: 8px;
  cursor: auto;
  display: flex;
  flex-direction: row-reverse;
  justify-content: space-around;
  align-items: center;
}

#screenshot {
  position: relative;
  overflow: hidden;
  width: 100vw;
  height: 100vh;
}
#clipTox {
  position: absolute;
  border: 1px solid var(--theme);
  box-sizing: content-box;
}
#clipTox div:nth-child(n + 2) > div:nth-child(n) {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: var(--theme);
}
#TopLeft {
  top: -5px;
  left: -5px;
  cursor: nw-resize;
}
#Top {
  top: -5px;
  left: 50%;
  margin-left: -5px;
  cursor: n-resize;
}
#TopRight {
  top: -5px;
  right: -5px;
  cursor: ne-resize;
}
#Right {
  top: 50%;
  right: -5px;
  margin-top: -5px;
  cursor: e-resize;
}
#Left {
  top: 50%;
  left: -5px;
  margin-top: -5px;
  cursor: w-resize;
}
#BottomLeft {
  bottom: -5px;
  left: -5px;
  cursor: sw-resize;
}
#Bottom {
  bottom: -5px;
  left: 50%;
  margin-left: -5px;
  cursor: s-resize;
}
#BottomRight {
  bottom: -5px;
  right: -5px;
  cursor: se-resize;
}
#clipTox::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
