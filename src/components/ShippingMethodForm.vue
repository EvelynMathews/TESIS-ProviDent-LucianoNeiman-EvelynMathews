<script>
/**
 * Formulario corto para crear o editar un método de envío.
 * Pide solo lo que usa la app: nombre, precio, demora y a qué provincias se envía.
 * Guarda con `saveShippingMethod` y emite `saved` con el id del método.
 */
import { listProvinces, saveShippingMethod } from '../services/shipping'
import ShippingIcon from './ShippingIcon.vue'

export default {
    name: 'ShippingMethodForm',
    components: { ShippingIcon },
    props: {
        method: { type: Object, default: null },
        submitText: { type: String, default: 'Guardar método' }
    },
    emits: ['saved', 'cancel'],
    data() {
        const m = this.method
        return {
            provinces: [],
            loadingProvinces: true,
            form: {
                name: m?.name || '',
                price: m?.configured ? m.price : '',
                eta_days: m?.configured ? m.eta_days : '',
                coverage: m?.configured && !m.all_country ? 'some' : 'all',
                province_ids: m?.province_ids ? [...m.province_ids] : [],
                active: m ? m.active : true
            },
            saving: false,
            error: ''
        }
    },
    computed: {
        selectedCount() {
            return this.form.coverage === 'all' ? this.provinces.length : this.form.province_ids.length
        }
    },
    methods: {
        selectAll() {
            this.form.province_ids = this.provinces.map(p => p.id)
        },
        selectNone() {
            this.form.province_ids = []
        },
        async submit() {
            this.error = ''
            const f = this.form
            if (!f.name.trim()) return (this.error = 'Poné un nombre, por ejemplo "Envío por moto".')
            if (f.price === '' || Number(f.price) < 0) return (this.error = 'Indicá el precio del envío (0 si es gratis).')
            if (!f.eta_days || Number(f.eta_days) < 1) return (this.error = 'Indicá en cuántos días llega (1 o más).')
            const provinceIds = f.coverage === 'all' ? this.provinces.map(p => p.id) : f.province_ids
            if (!provinceIds.length) return (this.error = 'Elegí al menos una provincia.')

            this.saving = true
            try {
                const id = await saveShippingMethod({
                    id: this.method?.id || null,
                    name: f.name,
                    active: f.active,
                    price: f.price,
                    eta_days: f.eta_days,
                    province_ids: provinceIds
                })
                this.$emit('saved', id)
            } catch (e) {
                console.error('Error al guardar el método de envío:', e)
                this.error = e.message || 'No pudimos guardar el método. Intentá de nuevo.'
            } finally {
                this.saving = false
            }
        }
    },
    async mounted() {
        try {
            this.provinces = await listProvinces()
        } catch {
            this.error = 'No pudimos cargar las provincias. Recargá la página.'
        } finally {
            this.loadingProvinces = false
        }
    }
}
</script>

<template>
    <form class="flex flex-col gap-5" novalidate @submit.prevent="submit">
        <div>
            <label for="sm-name" class="field-label flex items-center gap-1.5"><ShippingIcon icon="truck" class="w-4 h-4 text-primary" /> Nombre del método</label>
            <input id="sm-name" v-model="form.name" type="text" maxlength="60" class="field-input"
                placeholder="Ej: Envío por moto, Correo, Retiro en el local" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label for="sm-price" class="field-label flex items-center gap-1.5"><ShippingIcon icon="price" class="w-4 h-4 text-primary" /> Precio del envío ($)</label>
                <input id="sm-price" v-model="form.price" type="number" min="0" step="1" inputmode="numeric"
                    class="field-input" placeholder="Ej: 3500" aria-describedby="sm-price-hint" />
                <p id="sm-price-hint" class="field-hint">Poné 0 si el envío es gratis.</p>
            </div>
            <div>
                <label for="sm-eta" class="field-label flex items-center gap-1.5"><ShippingIcon icon="clock" class="w-4 h-4 text-primary" /> Demora (días)</label>
                <input id="sm-eta" v-model="form.eta_days" type="number" min="1" step="1" inputmode="numeric"
                    class="field-input" placeholder="Ej: 3" />
            </div>
        </div>

        <fieldset>
            <legend class="field-label flex items-center gap-1.5"><ShippingIcon icon="pin" class="w-4 h-4 text-primary" /> ¿A dónde enviás?</legend>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label class="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-300"
                    :class="form.coverage === 'all' ? 'border-primary bg-primary-50' : 'border-gray-200 hover:border-primary-200'">
                    <input v-model="form.coverage" type="radio" value="all" class="sr-only" />
                    <span class="w-10 h-10 rounded-full flex items-center justify-center"
                        :class="form.coverage === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'">
                        <ShippingIcon icon="country" class="w-5 h-5" />
                    </span>
                    <span>
                        <span class="block font-semibold text-gray-800">Todo el país</span>
                        <span class="block text-xs text-gray-600">Las 24 provincias</span>
                    </span>
                </label>
                <label class="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-300"
                    :class="form.coverage === 'some' ? 'border-primary bg-primary-50' : 'border-gray-200 hover:border-primary-200'">
                    <input v-model="form.coverage" type="radio" value="some" class="sr-only" />
                    <span class="w-10 h-10 rounded-full flex items-center justify-center"
                        :class="form.coverage === 'some' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'">
                        <ShippingIcon icon="map" class="w-5 h-5" />
                    </span>
                    <span>
                        <span class="block font-semibold text-gray-800">Algunas provincias</span>
                        <span class="block text-xs text-gray-600">Elegís cuáles</span>
                    </span>
                </label>
            </div>

            <div v-if="form.coverage === 'some'" class="mt-3 border border-gray-200 rounded-lg">
                <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                    <span class="text-sm text-gray-700">{{ form.province_ids.length }} de {{ provinces.length }} elegidas</span>
                    <div class="flex gap-3 text-sm font-semibold">
                        <button type="button" class="text-primary-700 hover:underline" @click="selectAll">Todas</button>
                        <button type="button" class="text-primary-700 hover:underline" @click="selectNone">Ninguna</button>
                    </div>
                </div>
                <p v-if="loadingProvinces" class="p-3 text-sm text-gray-600 m-0">Cargando provincias…</p>
                <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 p-3 max-h-56 overflow-y-auto">
                    <label v-for="p in provinces" :key="p.id" class="flex items-center gap-2 py-1 text-sm text-gray-800 cursor-pointer">
                        <input v-model="form.province_ids" type="checkbox" :value="p.id" class="w-4 h-4 accent-primary" />
                        {{ p.name }}
                    </label>
                </div>
            </div>
            <p v-else class="field-hint">Se envía a las {{ selectedCount }} provincias con el mismo precio y demora.</p>
        </fieldset>

        <label v-if="method" class="inline-flex items-center gap-2 text-sm font-semibold text-gray-800 cursor-pointer">
            <input v-model="form.active" type="checkbox" class="w-4 h-4 accent-secondary" />
            Método activo (se puede elegir al publicar)
        </label>

        <p v-if="error" class="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm font-semibold m-0" role="alert">{{ error }}</p>

        <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button type="button" class="h-11 px-5 font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                @click="$emit('cancel')">
                Cancelar
            </button>
            <button type="submit" :disabled="saving || loadingProvinces"
                class="h-11 px-5 font-semibold text-white bg-primary rounded-lg hover:bg-primary-600 transition disabled:opacity-60">
                {{ saving ? 'Guardando…' : loadingProvinces ? 'Cargando…' : submitText }}
            </button>
        </div>
    </form>
</template>
