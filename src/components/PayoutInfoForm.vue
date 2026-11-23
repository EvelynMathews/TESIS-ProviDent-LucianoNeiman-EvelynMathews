<script>
/**
 * Formulario de datos para cobrar (vendedor).
 * Pide titular, CUIT/CUIL (opcional) y CBU/CVU o alias. Valida el formato antes de guardar.
 * Lo usan "Configurar ventas" y "Mis ventas". Emite `saved` con los datos guardados.
 */
import { savePayoutInfo } from '../services/sellers'

export default {
    name: 'PayoutInfoForm',
    props: {
        initial: { type: Object, default: null },
        idPrefix: { type: String, default: 'payout' },
        submitText: { type: String, default: 'Guardar datos de cobro' },
    },
    emits: ['saved', 'cancel'],
    data() {
        return {
            form: {
                holder_name: this.initial?.holder_name || '',
                cuit: this.initial?.cuit || '',
                cbu_cvu: this.initial?.cbu_cvu || '',
                alias: this.initial?.alias || '',
            },
            touched: false,
            saving: false,
            error: '',
        }
    },
    computed: {
        errors() {
            const e = {}
            const cbu = this.form.cbu_cvu.replace(/\D/g, '')
            const alias = this.form.alias.trim()
            const cuit = this.form.cuit.replace(/\D/g, '')
            if (!this.form.holder_name.trim()) e.holder_name = 'Ingresá el nombre del titular de la cuenta.'
            if (!cbu && !alias) e.account = 'Ingresá un CBU/CVU o un alias.'
            if (cbu && cbu.length !== 22) e.cbu_cvu = 'El CBU o CVU tiene 22 números.'
            if (alias && !/^[a-zA-Z0-9.-]{6,20}$/.test(alias)) e.alias = 'El alias tiene entre 6 y 20 caracteres: letras, números, puntos o guiones.'
            if (cuit && cuit.length !== 11) e.cuit = 'El CUIT/CUIL tiene 11 números.'
            return e
        },
        isValid() {
            return Object.keys(this.errors).length === 0
        }
    },
    methods: {
        show(field) {
            return this.touched && this.errors[field]
        },
        async submit() {
            this.touched = true
            this.error = ''
            if (!this.isValid) return
            this.saving = true
            try {
                const saved = await savePayoutInfo(this.form)
                this.$emit('saved', saved)
            } catch (e) {
                console.error('Error guardando datos de cobro', e)
                this.error = 'No pudimos guardar tus datos. Intentá de nuevo.'
            } finally {
                this.saving = false
            }
        }
    }
}
</script>

<template>
    <form class="space-y-4" novalidate @submit.prevent="submit">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
                <label :for="`${idPrefix}-holder`" class="field-label">Titular de la cuenta</label>
                <input :id="`${idPrefix}-holder`" v-model="form.holder_name" type="text" autocomplete="name" class="field-input"
                    :aria-invalid="!!show('holder_name')" :aria-describedby="`${idPrefix}-holder-error`" />
                <p v-if="show('holder_name')" :id="`${idPrefix}-holder-error`" class="field-error">{{ errors.holder_name }}</p>
            </div>
            <div>
                <label :for="`${idPrefix}-cbu`" class="field-label">CBU o CVU</label>
                <input :id="`${idPrefix}-cbu`" v-model="form.cbu_cvu" type="text" inputmode="numeric" maxlength="26" class="field-input tabular-nums"
                    placeholder="22 números" :aria-invalid="!!(show('cbu_cvu') || show('account'))" :aria-describedby="`${idPrefix}-cbu-error`" />
                <p v-if="show('cbu_cvu')" :id="`${idPrefix}-cbu-error`" class="field-error">{{ errors.cbu_cvu }}</p>
            </div>
            <div>
                <label :for="`${idPrefix}-alias`" class="field-label">Alias</label>
                <input :id="`${idPrefix}-alias`" v-model="form.alias" type="text" autocapitalize="characters" class="field-input"
                    placeholder="Ej: consultorio.sur" :aria-invalid="!!(show('alias') || show('account'))" :aria-describedby="`${idPrefix}-alias-error`" />
                <p v-if="show('alias')" :id="`${idPrefix}-alias-error`" class="field-error">{{ errors.alias }}</p>
            </div>
            <p v-if="show('account')" class="field-error sm:col-span-2 m-0" role="alert">{{ errors.account }}</p>
            <div>
                <label :for="`${idPrefix}-cuit`" class="field-label">CUIT/CUIL <span class="font-normal text-gray-600">(opcional)</span></label>
                <input :id="`${idPrefix}-cuit`" v-model="form.cuit" type="text" inputmode="numeric" maxlength="13" class="field-input tabular-nums"
                    placeholder="11 números" :aria-invalid="!!show('cuit')" :aria-describedby="`${idPrefix}-cuit-error`" />
                <p v-if="show('cuit')" :id="`${idPrefix}-cuit-error`" class="field-error">{{ errors.cuit }}</p>
            </div>
        </div>

        <p class="field-hint m-0">Usamos estos datos solo para transferirte el dinero de tus ventas. Podés cargar CBU, CVU (Mercado Pago, Ualá, etc.) o alias.</p>
        <p v-if="error" class="text-sm text-red-800 bg-red-50 rounded-lg px-3 py-2 m-0" role="alert">{{ error }}</p>

        <div class="flex flex-col-reverse sm:flex-row gap-3">
            <button v-if="initial" type="button" @click="$emit('cancel')"
                class="h-11 px-5 font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                Cancelar
            </button>
            <button type="submit" :disabled="saving"
                class="h-11 px-5 font-semibold text-white bg-primary rounded-lg hover:bg-primary-600 transition disabled:opacity-60">
                {{ saving ? 'Guardando…' : submitText }}
            </button>
        </div>
    </form>
</template>
