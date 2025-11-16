<script>
import { supabase } from '../../services/supabase'

export default {
    name: 'AdminLogin',
    data() {
        return {
            email: '',
            password: '',
            rememberMe: false,
            loading: false,
            error: ''
        }
    },
    methods: {
        async handleLogin() {
            this.error = ''
            this.loading = true

            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: this.email,
                    password: this.password
                })

                if (error) throw error

                // Verificar que el usuario tenga role admin en user_metadata
                const role = data.user?.user_metadata?.role

                if (role !== 'admin') {
                    await supabase.auth.signOut()
                    this.error = 'No tienes permisos para acceder al panel de administración.'
                    this.loading = false
                    return
                }

                // Redirigir al dashboard
                this.$router.push('/admin/dashboard')

            } catch (error) {
                this.error = 'Las credenciales no coinciden con nuestros registros.'
                console.error('Error al iniciar sesión:', error)
            } finally {
                this.loading = false
            }
        }
    },
    async mounted() {
        // Si ya está logueado como admin, redirigir al dashboard
        const { data } = await supabase.auth.getSession()
        if (data?.session?.user) {
            const role = data.session.user.user_metadata?.role
            if (role === 'admin') {
                this.$router.push('/admin/dashboard')
            }
        }
    }
}
</script>

<template>
    <div class="admin-login-page">
        <div class="login-card">
            <div class="login-header">
                <div class="login-logo">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#2A6FAF" stroke="#2A6FAF" stroke-width="2" stroke-linejoin="round"/>
                        <path d="M2 17L12 22L22 17" stroke="#29A68C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M2 12L12 17L22 12" stroke="#29A68C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="login-logo-text">ProviDent</span>
                </div>
                <h1 class="login-title">Panel de Administración</h1>
                <p class="login-subtitle">Ingresa tus credenciales de administrador</p>
            </div>

            <form @submit.prevent="handleLogin" class="login-form">
                <div v-if="error" class="alert alert-error">
                    {{ error }}
                </div>

                <div class="form-group">
                    <label for="email" class="form-label">Email</label>
                    <input
                        id="email"
                        v-model="email"
                        type="email"
                        class="form-input"
                        placeholder="admin@ejemplo.com"
                        required
                        autocomplete="email"
                    />
                </div>

                <div class="form-group">
                    <label for="password" class="form-label">Contraseña</label>
                    <input
                        id="password"
                        v-model="password"
                        type="password"
                        class="form-input"
                        placeholder="••••••••"
                        required
                        autocomplete="current-password"
                    />
                </div>

                <div class="form-group">
                    <div class="form-checkbox-group">
                        <input
                            id="rememberMe"
                            v-model="rememberMe"
                            type="checkbox"
                            class="form-checkbox"
                        />
                        <label for="rememberMe" class="form-checkbox-label">
                            Recordarme
                        </label>
                    </div>
                </div>

                <button type="submit" class="btn-primary" :disabled="loading">
                    {{ loading ? 'Iniciando sesión...' : 'Iniciar sesión' }}
                </button>
            </form>

            <div class="login-footer">
                <RouterLink to="/">Volver al sitio público</RouterLink>
            </div>
        </div>
    </div>
</template>

<style scoped>
.admin-login-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #2A6FAF 0%, #29A68C 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.login-card {
    background: white;
    border-radius: 1rem;
    padding: 3rem;
    max-width: 450px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
    text-align: center;
    margin-bottom: 2rem;
}

.login-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.login-logo-text {
    font-size: 2rem;
    font-weight: 700;
    color: #2A6FAF;
}

.login-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1F2937;
    margin-bottom: 0.5rem;
}

.login-subtitle {
    color: #6B7280;
    font-size: 0.875rem;
}

.login-form {
    margin-top: 2rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
}

.form-input {
    width: 100%;
    padding: 0.875rem;
    border: 2px solid #E5E7EB;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    transition: all 0.2s;
}

.form-input:focus {
    outline: none;
    border-color: #2A6FAF;
    box-shadow: 0 0 0 3px rgba(42, 111, 175, 0.1);
}

.form-checkbox-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.form-checkbox {
    width: 16px;
    height: 16px;
    cursor: pointer;
}

.form-checkbox-label {
    font-size: 0.875rem;
    color: #6B7280;
    cursor: pointer;
}

.alert {
    padding: 0.875rem;
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
}

.alert-error {
    background: #FEE2E2;
    color: #991B1B;
    border: 1px solid #FCA5A5;
}

.btn-primary {
    width: 100%;
    padding: 0.875rem;
    background: #2A6FAF;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
    background: #1e4d7a;
}

.btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.login-footer {
    margin-top: 2rem;
    text-align: center;
    font-size: 0.875rem;
    color: #6B7280;
}

.login-footer a {
    color: #2A6FAF;
    text-decoration: none;
    font-weight: 500;
}

.login-footer a:hover {
    text-decoration: underline;
}

@media (max-width: 640px) {
    .login-card {
        padding: 2rem;
    }

    .login-logo-text {
        font-size: 1.5rem;
    }

    .login-title {
        font-size: 1.25rem;
    }
}
</style>
