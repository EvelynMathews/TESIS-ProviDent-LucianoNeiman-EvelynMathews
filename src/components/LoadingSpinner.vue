<template>
    <div class="flex flex-col items-center justify-center py-16">
        <div class="spinner"></div>
        <p class="mt-4 text-lg font-semibold" style="color: #2A6FAF;">
            {{ message }}
        </p>
    </div>
</template>

<script>
export default {
    name: 'LoadingSpinner',
    props: {
        message: {
            type: String,
            default: 'Cargando datos...'
        }
    }
}
</script>

<style scoped>
.spinner {
    width: 60px;
    height: 60px;
    border: 4px solid #E3EEF8;
    border-top: 4px solid #2A6FAF;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>
