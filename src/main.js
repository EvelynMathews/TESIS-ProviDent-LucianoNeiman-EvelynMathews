/**
 * Punto de entrada principal de la aplicación Vue.
 * Propósito: Inicializar el framework Vue, configurar el enrutador
 * y montar la aplicación en el elemento HTML con id="#app".
 * Funcionamiento: Importa las dependencias clave (Vue, Router, App.vue),
 * importa los estilos globales (incluyendo Tailwind y Flowbite)
 * y ejecuta `createApp(App).use(router).mount('#app')` para arrancar
 * la aplicación.
 */
import { createApp } from 'vue'
import router from "./router/router";
import App from './App.vue'

import './style.css'
import 'flowbite'

createApp(App).use(router).mount('#app')
