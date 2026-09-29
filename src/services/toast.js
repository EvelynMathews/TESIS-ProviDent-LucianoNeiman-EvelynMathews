/**
 * Servicio de notificaciones flotantes (toasts).
 * Propósito: Mostrar avisos de éxito, error o información desde cualquier vista
 * sin usar alert() del navegador.
 * Funcionamiento: Igual que `auth.js`, usa el patrón Observer: `showToast` agrega
 * un aviso a la lista y notifica a los suscriptores (el componente `ToastContainer`).
 * Cada aviso se elimina solo después de unos segundos.
 */

let toasts = []
let observers = []
let nextId = 1

function notifyAll() {
    observers.forEach(callback => callback([...toasts]))
}

export function dismissToast(id) {
    toasts = toasts.filter(t => t.id !== id)
    notifyAll()
}

export function showToast(message, type = 'success', duration = 3500) {
    const id = nextId++
    toasts = [...toasts, { id, message, type }]
    notifyAll()
    setTimeout(() => dismissToast(id), duration)
}

export function subscribeToToasts(callback) {
    observers.push(callback)
    callback([...toasts])
    return () => {
        observers = observers.filter(obs => obs !== callback)
    }
}
