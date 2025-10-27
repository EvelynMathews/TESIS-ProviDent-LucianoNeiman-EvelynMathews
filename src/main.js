import { createApp } from 'vue'
import router from "./router/router";
import App from './App.vue'

import './style.css'
import 'flowbite'

import { testSupabaseConnection } from './services/testSupabase'

testSupabaseConnection();

createApp(App).use(router).mount('#app')
