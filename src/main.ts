
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'


const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

const lenis = new Lenis({
  autoRaf: true,
  duration: 1.1,
  smoothWheel: true,
  touchMultiplier: 1.2,
})