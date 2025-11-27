<template>
    <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div class="skeleton-loader">
            <div class="skeleton-image"></div>
            <div class="p-4">
                <div class="skeleton-line skeleton-line-title"></div>
                <div class="skeleton-line skeleton-line-subtitle"></div>
                <div class="skeleton-line skeleton-line-text"></div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'SkeletonCard'
}
</script>

<style scoped>
.skeleton-loader {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.skeleton-image {
    height: 12rem;
    background: linear-gradient(90deg, #E3EEF8 0%, #A4C5DF 50%, #E3EEF8 100%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-line {
    height: 1rem;
    border-radius: 0.25rem;
    margin-bottom: 0.5rem;
    background: linear-gradient(90deg, #E3EEF8 0%, #A4C5DF 50%, #E3EEF8 100%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-line-title {
    width: 75%;
    height: 1.25rem;
}

.skeleton-line-subtitle {
    width: 50%;
}

.skeleton-line-text {
    width: 60%;
}

@keyframes shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.9;
    }
}
</style>
