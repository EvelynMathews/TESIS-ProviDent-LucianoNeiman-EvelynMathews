/**
 * Servicio de gestión del estado local del carrito de compras.
 * Propósito: Almacenar de forma reactiva los ítems que el usuario agrega
 * a su carrito antes de finalizar la compra. Utiliza un modelo simple
 * basado en `ref` de Vue para la reactividad.
 * Funcionamiento: Mantiene un array `cartItems` (actualmente con datos de mock).
 * Proporciona funciones CRUD (`addToCart`, `removeFromCart`, `updateQuantity`)
 * y funciones de cálculo (`getCartCount`, `getCartTotal`) para que los
 * componentes de la aplicación accedan y modifiquen el carrito.
 */

import { ref } from 'vue'

const cartItems = ref([
    {
        id: 'product-1',
        type: 'product',
        name: 'Resina Compuesta Flow A2',
        brand: 'DentFlow Pro',
        price: 18500,
        quantity: 2,
        unit: 'Jeringa 4g',
        image: 'https://placehold.co/600x600/2A6FAF/ffffff?text=Resina+Flow',
        seller: {
            username: 'Dental Supply BA'
        }
    },
    {
        id: 'service-101',
        type: 'service',
        name: 'Corona de Zirconio',
        provider: 'Laboratorio Estético Dental',
        price: 45000,
        quantity: 1,
        config: {
            workType: 'Corona Total',
            toothGroup: 'Anterior'
        },
        image: 'https://placehold.co/600x600/29A68C/ffffff?text=Corona+Zirconio',
        seller: {
            username: 'Laboratorio Estético Dental'
        }
    }
])

export function getCartItems() {
    return cartItems.value
}

export function getCartCount() {
    return cartItems.value.reduce((total, item) => total + item.quantity, 0)
}

export function addToCart(item) {
    const existingItem = cartItems.value.find(i => i.id === item.id)

    if (existingItem) {
        existingItem.quantity += item.quantity || 1
    } else {
        cartItems.value.push({
            ...item,
            quantity: item.quantity || 1
        })
    }
}

export function removeFromCart(itemId) {
    const index = cartItems.value.findIndex(item => item.id === itemId)
    if (index !== -1) {
        cartItems.value.splice(index, 1)
    }
}

export function updateQuantity(itemId, quantity) {
    const item = cartItems.value.find(i => i.id === itemId)
    if (item) {
        item.quantity = quantity
        if (item.quantity <= 0) {
            removeFromCart(itemId)
        }
    }
}

export function clearCart() {
    cartItems.value = []
}

export function getCartTotal() {
    return cartItems.value.reduce((total, item) => total + (item.price * item.quantity), 0)
}
