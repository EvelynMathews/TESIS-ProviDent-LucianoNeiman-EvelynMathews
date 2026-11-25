<script>
// Decorative blobs behind the home sections. `variant` picks the size and color set.
export default {
  name: 'OrganicShapes',
  props: {
    variant: { type: String, default: 'page' },
    count: { type: Number, required: true }
  },
  computed: {
    baseClass() {
      return this.variant === 'page' ? 'organic-shape' : `organic-shape-${this.variant}`
    }
  }
}
</script>

<template>
  <div v-for="n in count" :key="n" :class="[baseClass, `${baseClass}-${n}`]"></div>
</template>

<style scoped>
.organic-shape {
  position: absolute;
  border-radius: 50% 40% 60% 50%;
  opacity: 0.6;
  z-index: 0;
}

.organic-shape-1 {
  width: 600px;
  height: 600px;
  background: var(--color-primary-soft);
  top: -200px;
  left: -100px;
  animation: float 20s ease-in-out infinite;
}

.organic-shape-2 {
  width: 800px;
  height: 800px;
  background: var(--color-secondary-soft);
  bottom: -300px;
  left: 10%;
  border-radius: 60% 50% 40% 60%;
  animation: float 25s ease-in-out infinite reverse;
}

.organic-shape-3 {
  width: 500px;
  height: 500px;
  background: var(--color-accent-soft);
  bottom: 10%;
  right: -150px;
  border-radius: 40% 60% 50% 40%;
  animation: float 30s ease-in-out infinite;
}

.organic-shape-4 {
  width: 400px;
  height: 400px;
  background: var(--color-primary-50);
  top: 40%;
  right: -100px;
  border-radius: 55% 45% 60% 40%;
  animation: float 22s ease-in-out infinite;
}

.organic-shape-5 {
  width: 350px;
  height: 350px;
  background: var(--color-secondary-soft);
  top: 60%;
  left: 20%;
  border-radius: 45% 55% 40% 60%;
  animation: float 28s ease-in-out infinite reverse;
}

.organic-shape-6 {
  width: 450px;
  height: 450px;
  background: var(--color-accent-soft);
  bottom: -150px;
  right: 30%;
  border-radius: 50% 50% 45% 55%;
  animation: float 35s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  33% {
    transform: translate(30px, -30px) rotate(5deg);
  }
  66% {
    transform: translate(-20px, 20px) rotate(-5deg);
  }
}

.organic-shape-category {
  position: absolute;
  border-radius: 50% 40% 60% 50%;
  opacity: 0.4;
  z-index: 0;
}

.organic-shape-category-1 {
  width: 300px;
  height: 300px;
  background: var(--color-primary-soft);
  top: -100px;
  right: 5%;
  border-radius: 60% 40% 50% 50%;
  animation: float 18s ease-in-out infinite;
}

.organic-shape-category-2 {
  width: 250px;
  height: 250px;
  background: var(--color-secondary-soft);
  bottom: -80px;
  left: 10%;
  border-radius: 45% 55% 45% 55%;
  animation: float 24s ease-in-out infinite reverse;
}

.organic-shape-category-3 {
  width: 200px;
  height: 200px;
  background: var(--color-accent-soft);
  top: 50%;
  right: -50px;
  border-radius: 50% 50% 40% 60%;
  animation: float 20s ease-in-out infinite;
}

.organic-shape-category-4 {
  width: 180px;
  height: 180px;
  background: var(--color-primary-soft);
  bottom: 20%;
  left: -40px;
  border-radius: 55% 45% 50% 50%;
  animation: float 26s ease-in-out infinite reverse;
}

.organic-shape-category-5 {
  width: 220px;
  height: 220px;
  background: var(--color-primary-50);
  top: 20%;
  left: 15%;
  border-radius: 40% 60% 55% 45%;
  animation: float 22s ease-in-out infinite;
}

.organic-shape-products {
  position: absolute;
  border-radius: 50% 40% 60% 50%;
  opacity: 0.4;
  z-index: 0;
}

.organic-shape-products-1 {
  width: 280px;
  height: 280px;
  background: var(--color-accent-soft);
  top: -80px;
  left: 8%;
  border-radius: 60% 40% 50% 50%;
  animation: float 19s ease-in-out infinite;
}

.organic-shape-products-2 {
  width: 320px;
  height: 320px;
  background: var(--color-primary-50);
  bottom: -100px;
  right: 5%;
  border-radius: 45% 55% 45% 55%;
  animation: float 23s ease-in-out infinite reverse;
}

.organic-shape-products-3 {
  width: 240px;
  height: 240px;
  background: var(--color-primary-soft);
  top: 40%;
  right: -60px;
  border-radius: 50% 50% 40% 60%;
  animation: float 21s ease-in-out infinite;
}

.organic-shape-products-4 {
  width: 200px;
  height: 200px;
  background: var(--color-secondary-soft);
  bottom: 30%;
  left: -50px;
  border-radius: 55% 45% 50% 50%;
  animation: float 25s ease-in-out infinite reverse;
}

.organic-shape-products-5 {
  width: 260px;
  height: 260px;
  background: var(--color-accent-soft);
  top: 60%;
  left: 20%;
  border-radius: 40% 60% 55% 45%;
  animation: float 27s ease-in-out infinite;
}

.organic-shape-hero {
  position: absolute;
  border-radius: 50% 40% 60% 50%;
  opacity: 0.5;
  z-index: 0;
}

.organic-shape-hero-1 {
  width: 350px;
  height: 350px;
  background: var(--color-secondary);
  top: -100px;
  right: 10%;
  border-radius: 60% 40% 50% 50%;
  animation: float 20s ease-in-out infinite;
}

.organic-shape-hero-2 {
  width: 280px;
  height: 280px;
  background: var(--color-accent-blush);
  bottom: -80px;
  left: 5%;
  border-radius: 45% 55% 45% 55%;
  animation: float 24s ease-in-out infinite reverse;
}

.organic-shape-hero-3 {
  width: 300px;
  height: 300px;
  background: var(--color-primary-soft);
  top: 50%;
  left: -80px;
  border-radius: 50% 50% 40% 60%;
  animation: float 22s ease-in-out infinite;
}

.organic-shape-hero-4 {
  width: 250px;
  height: 250px;
  background: var(--color-secondary);
  bottom: 20%;
  right: -60px;
  border-radius: 55% 45% 50% 50%;
  animation: float 26s ease-in-out infinite reverse;
}

.organic-shape-hero-5 {
  width: 320px;
  height: 320px;
  background: var(--color-accent-blush);
  top: 20%;
  left: 15%;
  border-radius: 40% 60% 55% 45%;
  animation: float 28s ease-in-out infinite;
}
</style>
