import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

app.config.errorHandler = (error, _instance, info) => {
  console.error(`[festou] falha durante a renderizacao (${info}):`, error)
}

app.use(router).mount('#app')
