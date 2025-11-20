<!--
 * Componente de botón de "Me gusta" (Like) para películas.
 * Propósito: Permitir a los usuarios autenticados dar o quitar "Me gusta"
 * a una publicación de película, y mostrar el conteo total de likes
 * de forma reactiva.
 * Funcionamiento: El método `fetchLikes` obtiene el conteo total y verifica
 * si el usuario actual ya dio like. `toggleLike` inserta o elimina el registro
 * en la tabla `likes` de Supabase y actualiza el estado local (`liked`, `likeCount`).
 * Requiere el `movieId` como prop.
 -->

<script>
import { supabase } from '../services/supabase.js'
import { subscribeToAuthStateChanges } from '../services/auth.js'

export default {
    name: 'LikeButton',
    props: {
        movieId: String,
    },
    data() {
        return {
            liked: false,
            likeCount: 0,
            user: null,
        }
    },
    methods: {
        async fetchLikes() {
            const { count, error } = await supabase
                .from('likes')
                .select('*', { count: 'exact', head: true })
                .eq('movie_id', this.movieId)

            if (!error) this.likeCount = count || 0

            if (this.user) {
                const { data: userLike } = await supabase
                    .from('likes')
                    .select('*')
                    .eq('movie_id', this.movieId)
                    .eq('user_id', this.user.id)
                    .maybeSingle()

                this.liked = !!userLike
            }
        },

        async toggleLike() {
            if (!this.user) return alert('Tenés que iniciar sesión para dar like.')

            if (this.liked) {
                await supabase
                    .from('likes')
                    .delete()
                    .match({ movie_id: this.movieId, user_id: this.user.id })
                this.likeCount--
            } else {
                await supabase
                    .from('likes')
                    .insert({ movie_id: this.movieId, user_id: this.user.id })
                this.likeCount++
            }
            this.liked = !this.liked
        },
    },

    async mounted() {
        subscribeToAuthStateChanges((newUser) => {
            this.user = newUser
            this.fetchLikes()
        })
    },
}
</script>

<template>
    <button class="flex items-center gap-2" @click="toggleLike">
        <span :class="liked ? 'text-red-500' : 'text-gray-400'">♥</span>
        <span class="text-sm text-gray-300">{{ likeCount }}</span>
    </button>
</template>
