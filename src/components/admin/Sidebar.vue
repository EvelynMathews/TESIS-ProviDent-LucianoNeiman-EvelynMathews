<!-- 
 * Lógica del componente de la barra de navegación lateral (Sidebar) del panel de administración.
 * Propósito: Definir la estructura y los enlaces del menú de navegación del panel
 * para acceder a las diferentes secciones de gestión (Dashboard, Productos, Perfil).
 * Funcionamiento: Almacena la lista de `menuItems` (nombre, ruta, ícono) y utiliza
 * la propiedad computada `currentPath` para determinar qué elemento del menú
 * debe estar marcado como activo (`active`).
 -->

<script src="./sidebar.js"></script>

<template>
    <aside class="admin-sidebar">
        <h3 class="sidebar-title">Panel de Administración</h3>
        <nav>
            <ul class="menu-list">
                <li v-for="item in menuItems" :key="item.path" class="menu-item">
                    <RouterLink
                        :to="item.path"
                        class="menu-link"
                        :class="{ active: currentPath === item.path }"
                    >
                        <svg v-if="item.icon === 'dashboard'" class="menu-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
                            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
                            <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
                            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        <svg v-else-if="item.icon === 'products'" class="menu-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <svg v-else-if="item.icon === 'profile'" class="menu-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>{{ item.name }}</span>
                    </RouterLink>
                </li>
            </ul>
        </nav>
    </aside>
</template>

<style src="./sidebar.css" scoped></style>
