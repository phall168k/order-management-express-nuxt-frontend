<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div class="bg-emerald-50 text-emerald-800">
        <div class="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 text-xs sm:px-6 lg:px-8">
          <ul class="flex items-center gap-4">
            <li class="flex items-center gap-1.5">
              <Icon name="lucide:truck" class="h-4 w-4" />
              <span class="hidden sm:inline">Free delivery for orders over $25</span>
              <span class="sm:hidden">Free delivery</span>
            </li>
            <li class="hidden items-center gap-1.5 md:flex">
              <Icon name="lucide:badge-percent" class="h-4 w-4" />
              <span>Daily deals up to 50% off</span>
            </li>
          </ul>

          <div class="flex items-center gap-3">
            <NuxtLink to="/admin/dashboard" class="hidden font-medium hover:text-emerald-950 sm:inline">
              Admin
            </NuxtLink>
            <button class="grid h-6 w-6 place-items-center rounded-full hover:bg-emerald-100" type="button" aria-label="Khmer language">
              <Icon name="emojione:flag-for-cambodia" class="h-4 w-4" />
            </button>
            <button class="grid h-6 w-6 place-items-center rounded-full hover:bg-emerald-100" type="button" aria-label="English language">
              <Icon name="circle-flags:us" class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex min-h-16 items-center gap-3 py-3">
          <NuxtLink to="/" class="flex min-w-0 shrink-0 items-center gap-2">
            <span class="grid h-10 w-10 place-items-center rounded-lg bg-emerald-700 text-white">
              <Icon name="lucide:shopping-bag" class="h-6 w-6" />
            </span>
            <span class="hidden text-lg font-bold text-emerald-800 sm:inline">OrderMart</span>
          </NuxtLink>

          <form class="relative hidden flex-1 md:block" @submit.prevent="submitSearch">
            <Icon name="lucide:search" class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              v-model="search"
              class="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-11 pr-28 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              type="search"
              placeholder="Search products, SKU, or categories"
            >
            <button
              class="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
              type="submit"
            >
              Search
            </button>
          </form>

          <nav class="ml-auto hidden items-center gap-1 lg:flex">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>

          <div class="flex items-center gap-1">
            <button class="grid h-10 w-10 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950" type="button" aria-label="Account">
              <Icon name="lucide:user-round" class="h-5 w-5" />
            </button>
            <button class="relative grid h-10 w-10 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950" type="button" aria-label="Cart">
              <Icon name="lucide:shopping-cart" class="h-5 w-5" />
              <span class="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white">3</span>
            </button>
          </div>
        </div>

        <form class="relative pb-3 md:hidden" @submit.prevent="submitSearch">
          <Icon name="lucide:search" class="pointer-events-none absolute left-4 top-5 h-5 w-5 text-slate-400" />
          <input
            v-model="search"
            class="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            type="search"
            placeholder="Search products"
          >
        </form>
      </div>
    </header>

    <main>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const search = ref(typeof route.query.q === 'string' ? route.query.q : '')

const navItems = [
  { label: 'Categories', to: '/#categories' },
  { label: 'Deals', to: '/#deals' },
  { label: 'Products', to: '/#products' },
]

watch(
  () => route.query.q,
  (value) => {
    search.value = typeof value === 'string' ? value : ''
  },
)

const submitSearch = async () => {
  await router.push({
    path: '/',
    query: search.value.trim() ? { q: search.value.trim() } : {},
    hash: '#products',
  })
}
</script>
