<script setup>
import { ref } from 'vue'
const { ipcRenderer } = window.api
const content = ref('')
const time = ref('')
ipcRenderer.on('PopContent', (event, arg) => {
  ;[content.value, time.value] = [arg.content, arg.time]
})
</script>
<template>
  <div id="Pop">
    <div id="pop">
      <div class="img"></div>
      <h2 class="content">{{ content }}</h2>
      <div class="time">{{ time }}</div>
    </div>
  </div>
</template>
<style scoped>
#Pop {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  flex-direction: column;
}
#pop {
  height: 54px;
  width: 480px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  padding: 0 16px 0 8px;
  transition: all 0.4s;
  animation: pop 4s forwards cubic-bezier(0.18, 0.89, 0.32, 1.27);
  background: var(--Deep);
}
#pop .img {
  width: 40px;
  height: 40px;
  object-fit: cover;
  background-image: var(--icon);
  background-repeat: no-repeat;
  background-size: contain;
}
#pop .content {
  flex: 1;
  margin: 0 16px;
  text-align: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--Real);
}
#pop .time {
  color: var(--theme);
}

</style>
