/**
 * Lógica del formulario de Anuncios de empleo en el Panel de Administración.
 * Propósito: Crear un anuncio nuevo (`/admin/classifieds/new`) o editar uno existente
 * (`/admin/classifieds/:id/edit`) con todos sus datos.
 * Funcionamiento: Si hay `id` en la ruta, `loadAd` carga el anuncio en el formulario.
 * `saveAd` valida los campos obligatorios y guarda en la tabla `classifieds` con
 * `saveClassified`; al terminar vuelve al listado y muestra un aviso.
 */

import { getClassifiedById, saveClassified, JOB_TYPES } from '../../services/classifieds'
import { showToast } from '../../services/toast'
import AdminLayout from '../../components/admin/AdminLayout.vue'

const today = () => new Date().toLocaleDateString('en-CA')

export default {
    name: 'AdminClassifiedEdit',
    components: {
        AdminLayout
    },
    data() {
        return {
            jobTypes: JOB_TYPES,
            form: {
                title: '',
                company: '',
                location: '',
                job_type: '',
                summary: '',
                description: '',
                requirements: '',
                contact_email: '',
                published_at: today(),
                is_active: true
            },
            loading: false,
            saving: false,
            loadError: '',
            saveError: ''
        }
    },
    computed: {
        adId() {
            return this.$route.params.id || null
        }
    },
    methods: {
        async loadAd() {
            this.loading = true
            try {
                const ad = await getClassifiedById(this.adId)
                if (!ad) {
                    this.loadError = 'No encontramos este anuncio. Puede que haya sido eliminado.'
                    return
                }
                this.form = {
                    title: ad.title || '',
                    company: ad.company || '',
                    location: ad.location || '',
                    job_type: ad.job_type || '',
                    summary: ad.summary || '',
                    description: ad.description || '',
                    requirements: ad.requirements || '',
                    contact_email: ad.contact_email || '',
                    published_at: new Date(ad.published_at).toLocaleDateString('en-CA'),
                    is_active: ad.is_active
                }
            } catch (error) {
                console.error('Error al cargar el anuncio:', error)
                this.loadError = 'No se pudo cargar el anuncio. Intentá de nuevo más tarde.'
            } finally {
                this.loading = false
            }
        },
        async saveAd() {
            this.saveError = ''
            const f = this.form
            const required = [f.title, f.company, f.job_type, f.summary, f.description, f.contact_email, f.published_at]
            if (required.some(value => !String(value).trim())) {
                this.saveError = 'Completá todos los campos obligatorios (*)'
                return
            }

            this.saving = true
            try {
                await saveClassified(this.adId, {
                    title: f.title.trim(),
                    company: f.company.trim(),
                    location: f.location.trim() || null,
                    job_type: f.job_type,
                    summary: f.summary.trim(),
                    description: f.description.trim(),
                    requirements: f.requirements.trim() || null,
                    contact_email: f.contact_email.trim(),
                    // noon avoids the date moving a day when converting time zones
                    published_at: new Date(`${f.published_at}T12:00:00`).toISOString(),
                    is_active: f.is_active
                })
                showToast(this.adId ? 'Anuncio actualizado correctamente' : 'Anuncio creado correctamente')
                this.$router.push('/admin/classifieds')
            } catch (error) {
                console.error('Error al guardar el anuncio:', error)
                this.saveError = `No se pudo guardar el anuncio: ${error.message}`
            } finally {
                this.saving = false
            }
        }
    },
    mounted() {
        if (this.adId) this.loadAd()
    }
}
