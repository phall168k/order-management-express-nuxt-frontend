<template>
  <div class="pb-12">
    <section class="bg-white">
      <div class="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside id="categories" class="hidden rounded-lg border border-slate-200 bg-white p-3 lg:block">
          <div class="mb-3 flex items-center justify-between px-2">
            <h2 class="text-sm font-semibold text-slate-950">Categories</h2>
            <Icon name="lucide:layout-grid" class="h-4 w-4 text-emerald-700" />
          </div>
          <button
            v-for="category in categories"
            :key="category.id"
            class="mb-1 flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition"
            :class="selectedCategory === category.id ? 'bg-emerald-50 font-semibold text-emerald-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'"
            type="button"
            @click="selectedCategory = category.id"
          >
            <span class="flex min-w-0 items-center gap-2">
              <Icon :name="category.icon" class="h-4 w-4 shrink-0" />
              <span class="truncate">{{ category.name }}</span>
            </span>
            <span class="text-xs text-slate-400">{{ category.count }}</span>
          </button>
        </aside>

        <div class="min-w-0">
          <div class="relative overflow-hidden rounded-lg bg-slate-900 text-white">
            <div
              v-for="(banner, index) in banners"
              :key="banner.title"
              class="transition-opacity duration-500"
              :class="activeBanner === index ? 'relative opacity-100' : 'pointer-events-none absolute inset-0 opacity-0'"
            >
              <img :src="banner.image" :alt="banner.title" class="h-[300px] w-full object-cover sm:h-[360px]">
              <div class="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/45 to-transparent" />
              <div class="absolute inset-y-0 left-0 flex max-w-xl flex-col justify-center px-6 sm:px-10">
                <p class="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">{{ banner.eyebrow }}</p>
                <h1 class="text-3xl font-bold leading-tight sm:text-5xl">{{ banner.title }}</h1>
                <p class="mt-4 max-w-md text-sm leading-6 text-slate-100 sm:text-base">{{ banner.description }}</p>
                <div class="mt-6 flex flex-wrap gap-3">
                  <a href="#products" class="rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
                    Shop now
                  </a>
                  <a href="#deals" class="rounded-md border border-white/35 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                    View deals
                  </a>
                </div>
              </div>
            </div>

            <button class="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25" type="button" aria-label="Previous banner" @click="showPreviousBanner">
              <Icon name="lucide:chevron-left" class="h-5 w-5" />
            </button>
            <button class="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25" type="button" aria-label="Next banner" @click="showNextBanner">
              <Icon name="lucide:chevron-right" class="h-5 w-5" />
            </button>
            <div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              <button
                v-for="(_, index) in banners"
                :key="index"
                class="h-2.5 rounded-full transition"
                :class="activeBanner === index ? 'w-8 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/70'"
                type="button"
                :aria-label="`Show banner ${index + 1}`"
                @click="activeBanner = index"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:hidden">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-base font-semibold text-slate-950">Categories</h2>
        <span class="text-xs font-medium text-emerald-700">{{ filteredProducts.length }} items</span>
      </div>
      <div class="flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="category in categories"
          :key="category.id"
          class="flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm transition"
          :class="selectedCategory === category.id ? 'border-emerald-600 bg-emerald-50 font-semibold text-emerald-800' : 'border-slate-200 bg-white text-slate-600'"
          type="button"
          @click="selectedCategory = category.id"
        >
          <Icon :name="category.icon" class="h-4 w-4" />
          {{ category.name }}
        </button>
      </div>
    </section>

    <section id="deals" class="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:grid-cols-3 sm:px-6 lg:px-8">
      <div v-for="stat in stats" :key="stat.label" class="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
          <Icon :name="stat.icon" class="h-5 w-5" />
        </span>
        <div>
          <p class="text-sm font-semibold text-slate-950">{{ stat.value }}</p>
          <p class="text-xs text-slate-500">{{ stat.label }}</p>
        </div>
      </div>
    </section>

    <section id="products" class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div class="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Fresh catalog</p>
          <h2 class="mt-1 text-2xl font-bold text-slate-950">Popular products</h2>
        </div>
        <div class="relative w-full md:max-w-sm">
          <Icon name="lucide:search" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            v-model="search"
            class="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            type="search"
            placeholder="Filter products"
          >
        </div>
      </div>

      <div v-if="filteredProducts.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article v-for="product in filteredProducts" :key="product.id" class="group overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/70">
          <div class="relative aspect-[4/3] overflow-hidden bg-slate-100">
            <img :src="product.image" :alt="product.name" class="h-full w-full object-cover transition duration-300 group-hover:scale-105">
            <span v-if="product.badge" class="absolute left-3 top-3 rounded-md bg-rose-600 px-2 py-1 text-xs font-bold text-white">{{ product.badge }}</span>
          </div>
          <div class="p-4">
            <div class="mb-2 flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="truncate text-sm font-semibold text-slate-950">{{ product.name }}</h3>
                <p class="mt-1 text-xs text-slate-500">{{ product.category }}</p>
              </div>
              <div class="flex items-center gap-1 text-xs font-semibold text-amber-600">
                <Icon name="lucide:star" class="h-3.5 w-3.5 fill-current" />
                {{ product.rating }}
              </div>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-lg font-bold text-emerald-700">${{ product.price.toFixed(2) }}</p>
                <p class="text-xs text-slate-400">{{ product.stock }} in stock</p>
              </div>
              <button class="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white transition hover:bg-emerald-700" type="button" :aria-label="`Add ${product.name} to cart`">
                <Icon name="lucide:plus" class="h-5 w-5" />
              </button>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
        <Icon name="lucide:search-x" class="mx-auto h-10 w-10 text-slate-300" />
        <h3 class="mt-3 text-base font-semibold text-slate-950">No products found</h3>
        <p class="mt-1 text-sm text-slate-500">Try another keyword or category.</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'តោះចាយលុយ!'
});

type Product = {
  id: number
  name: string
  category: string
  categoryId: string
  price: number
  stock: number
  rating: number
  badge?: string
  image: string
}

const route = useRoute()

const selectedCategory = ref('all')
const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
const activeBanner = ref(0)
let carouselTimer: ReturnType<typeof setInterval> | undefined

const categories = [
  { id: 'all', name: 'All products', count: 36, icon: 'lucide:store' },
  { id: 'grocery', name: 'Grocery', count: 12, icon: 'lucide:wheat' },
  { id: 'beverage', name: 'Beverages', count: 8, icon: 'lucide:cup-soda' },
  { id: 'bakery', name: 'Bakery', count: 6, icon: 'lucide:croissant' },
  { id: 'household', name: 'Household', count: 10, icon: 'lucide:spray-can' },
]

const banners = [
  {
    eyebrow: 'Weekly market',
    title: 'Fast ordering for daily essentials',
    description: 'Browse popular stock, filter by category, and prepare orders from one clean storefront.',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=80',
  },
  {
    eyebrow: 'Fresh deals',
    title: 'Save more on grocery bundles',
    description: 'Build carts for customers with high-demand products, clear pricing, and available stock.',
    image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1400&q=80',
  },
  {
    eyebrow: 'Ready to ship',
    title: 'Keep sales moving all day',
    description: 'A responsive home page for quick product discovery across desktop and mobile.',
    image: 'https://images.unsplash.com/photo-1601599963565-b7ba29c8e5ff?auto=format&fit=crop&w=1400&q=80',
  },
]

const stats = [
  { icon: 'lucide:package-check', value: '1,240+', label: 'Orders completed' },
  { icon: 'lucide:clock-3', value: '30 min', label: 'Average preparation' },
  { icon: 'lucide:shield-check', value: 'Live stock', label: 'Inventory friendly' },
]

const products: Product[] = [
  { id: 1, name: 'Organic Rice 5kg', category: 'Grocery', categoryId: 'grocery', price: 12.5, stock: 42, rating: 4.8, badge: 'Best', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=700&q=80' },
  { id: 2, name: 'Fresh Orange Juice', category: 'Beverages', categoryId: 'beverage', price: 3.25, stock: 28, rating: 4.7, image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=700&q=80' },
  { id: 3, name: 'Butter Croissant Pack', category: 'Bakery', categoryId: 'bakery', price: 4.2, stock: 18, rating: 4.9, badge: 'New', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=700&q=80' },
  { id: 4, name: 'Laundry Detergent', category: 'Household', categoryId: 'household', price: 7.9, stock: 35, rating: 4.5, image: 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?auto=format&fit=crop&w=700&q=80' },
  { id: 5, name: 'Mixed Vegetables Box', category: 'Grocery', categoryId: 'grocery', price: 8.75, stock: 31, rating: 4.6, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80' },
  { id: 6, name: 'Sparkling Water 12 Pack', category: 'Beverages', categoryId: 'beverage', price: 6.4, stock: 64, rating: 4.4, badge: 'Deal', image: 'https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=700&q=80' },
  { id: 7, name: 'Sourdough Bread', category: 'Bakery', categoryId: 'bakery', price: 3.8, stock: 15, rating: 4.8, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80' },
  { id: 8, name: 'Kitchen Towel Rolls', category: 'Household', categoryId: 'household', price: 5.6, stock: 50, rating: 4.3, image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=700&q=80' },
]

const filteredProducts = computed(() => {
  const keyword = search.value.trim().toLowerCase()

  return products.filter((product) => {
    const matchesCategory = selectedCategory.value === 'all' || product.categoryId === selectedCategory.value
    const matchesSearch = !keyword || [product.name, product.category].some((value) => value.toLowerCase().includes(keyword))

    return matchesCategory && matchesSearch
  })
})

watch(
  () => route.query.q,
  (value) => {
    search.value = typeof value === 'string' ? value : ''
  },
)

const showNextBanner = () => {
  activeBanner.value = (activeBanner.value + 1) % banners.length
}

const showPreviousBanner = () => {
  activeBanner.value = activeBanner.value === 0 ? banners.length - 1 : activeBanner.value - 1
}

onMounted(() => {
  carouselTimer = setInterval(showNextBanner, 5000)
})

onBeforeUnmount(() => {
  if (carouselTimer) {
    clearInterval(carouselTimer)
  }
})
</script>
