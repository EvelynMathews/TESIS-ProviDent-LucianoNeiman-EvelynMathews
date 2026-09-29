/**
 * Lógica de la vista de Anuncios de empleo (Clasificados) en el Panel de Administración.
 * Propósito: Permitir al administrador ver, buscar, activar/desactivar y eliminar
 * los avisos que se muestran en la sección Clasificados del Home.
 * Funcionamiento: `loadAds` trae todos los avisos (activos e inactivos; RLS solo
 * se los devuelve completos a un admin). `toggleActive` y `deleteAd` guardan en la base
 * con `saveClassified` / `deleteClassified`. El detalle se muestra con `ClassifiedModal`,
 * el mismo modal que ve el usuario en el Home.
 */

import { listAllClassifieds, saveClassified, deleteClassified } from '../../services/classifieds'
import { showToast } from '../../services/toast'
import AdminLayout from '../../components/admin/AdminLayout.vue'
import ClassifiedModal from '../../components/ClassifiedModal.vue'

export default {
    name: 'AdminClassifieds',
    components: {
        AdminLayout,
        ClassifiedModal
    },
    data() {
        return {
            ads: [],
            searchQuery: '',
            filterStatus: 'all',
            loading: true,
            loadError: '',
            busyId: null,
            adToView: null,
            adToDelete: null
        }
    },
    computed: {
        stats() {
            return {
                total: this.ads.length,
                active: this.ads.filter(a => a.is_active).length,
                inactive: this.ads.filter(a => !a.is_active).length
            }
        },
        filteredAds() {
            const query = this.searchQuery.trim().toLowerCase()
            return this.ads.filter(ad => {
                const matchesText = !query ||
                    ad.title.toLowerCase().includes(query) ||
                    ad.company.toLowerCase().includes(query) ||
                    ad.location?.toLowerCase().includes(query)
                const matchesStatus = this.filterStatus === 'all' ||
                    (this.filterStatus === 'active') === ad.is_active
                return matchesText && matchesStatus
            })
        }
    },
    methods: {
        async loadAds() {
            this.loadError = ''
            try {
                this.ads = await listAllClassifieds()
            } catch (error) {
                console.error('Error al cargar anuncios:', error)
                this.loadError = 'No se pudieron cargar los anuncios. Intentá de nuevo más tarde.'
            } finally {
                this.loading = false
            }
        },
        async toggleActive(ad) {
            this.busyId = ad.id
            try {
                await saveClassified(ad.id, { is_active: !ad.is_active })
                ad.is_active = !ad.is_active
                showToast(`"${ad.title}" ${ad.is_active ? 'ahora se muestra en Clasificados' : 'ya no se muestra en Clasificados'}`)
            } catch (error) {
                showToast(`No se pudo cambiar el estado: ${error.message}`, 'error')
            } finally {
                this.busyId = null
            }
        },
        async deleteAd() {
            const ad = this.adToDelete
            this.busyId = ad.id
            try {
                await deleteClassified(ad.id)
                this.ads = this.ads.filter(a => a.id !== ad.id)
                showToast(`"${ad.title}" se eliminó correctamente`)
            } catch (error) {
                showToast(`No se pudo eliminar: ${error.message}`, 'error')
            } finally {
                this.busyId = null
                this.adToDelete = null
            }
        },
        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
        }
    },
    mounted() {
        this.loadAds()
    }
}
