import { resolve } from 'path'
import { defineConfig, bytecodePlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({
  main: {
    plugins: [bytecodePlugin()]
  },
  preload: {
    plugins: [bytecodePlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [vue()]
  }
})
