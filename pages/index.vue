<template>
  <div class="min-h-screen bg-slate-50 pb-12">
    <section class="border-b border-slate-200 bg-white">
      <div class="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside class="hidden rounded-lg border border-slate-200 bg-white p-3 lg:block">
          <div class="mb-3 flex items-center justify-between px-2">
            <h2 class="text-sm font-semibold text-slate-950">Categories</h2>
            <Icon name="lucide:layout-grid" class="h-4 w-4 text-emerald-700" />
          </div>

          <div v-if="categoryLoading" class="space-y-2 px-2">
            <div v-for="item in 6" :key="item" class="h-10 animate-pulse rounded-md bg-slate-100" />
          </div>

          <button
            v-for="category in categories"
            v-else
            :key="category.id"
            class="mb-1 flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition"
            :class="selectedCategory === category.id ? 'bg-emerald-50 font-semibold text-emerald-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'"
            type="button"
            @click="selectCategory(category.id)"
          >
            <span class="flex min-w-0 items-center gap-2">
              <Icon :name="category.icon" class="h-4 w-4 shrink-0" />
              <span class="truncate">{{ category.name }}</span>
            </span>
            <span class="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{{ category.count }}</span>
          </button>
        </aside>

        <div class="min-w-0">
          <div class="relative overflow-hidden rounded-lg bg-slate-950 text-white shadow-sm">
            <div v-if="bannerLoading" class="grid h-[320px] place-items-center bg-slate-900 sm:h-[380px]">
              <Icon name="lucide:loader-circle" class="h-8 w-8 animate-spin text-emerald-300" />
            </div>

            <template v-else>
              <div
                v-for="(banner, index) in banners"
                :key="banner.id"
                class="transition-opacity duration-500"
                :class="activeBanner === index ? 'relative opacity-100' : 'pointer-events-none absolute inset-0 opacity-0'"
              >
                <img :src="getBannerImage(banner)" :alt="banner.title" class="h-[320px] w-full object-cover sm:h-[380px]">
                <div class="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-slate-950/10" />
                <div class="absolute inset-y-0 left-0 flex max-w-2xl flex-col justify-center px-6 sm:px-10">
                  <p class="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">{{ getBannerProductCode(banner) || 'Featured' }}</p>
                  <h1 class="text-3xl font-bold leading-tight sm:text-5xl">{{ banner.title }}</h1>
                  <p class="mt-4 max-w-md text-sm leading-6 text-slate-100 sm:text-base">{{ banner.description }}</p>
                  <div v-if="getBannerProductId(banner)" class="mt-6 flex flex-wrap items-center gap-3">
                    <button class="rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700" type="button" @click="openProductDetail(getBannerProductId(banner))">
                      View product
                    </button>
                    <span v-if="getBannerProductPrice(banner)" class="text-sm font-semibold text-emerald-100">{{ getBannerProductPrice(banner) }}</span>
                  </div>
                </div>
              </div>

              <button
                v-if="banners.length > 1"
                class="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
                type="button"
                aria-label="Previous banner"
                @click="showPreviousBanner"
              >
                <Icon name="lucide:chevron-left" class="h-5 w-5" />
              </button>
              <button
                v-if="banners.length > 1"
                class="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
                type="button"
                aria-label="Next banner"
                @click="showNextBanner"
              >
                <Icon name="lucide:chevron-right" class="h-5 w-5" />
              </button>
              <div v-if="banners.length > 1" class="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
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
            </template>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:hidden">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-base font-semibold text-slate-950">Categories</h2>
        <span class="text-xs font-medium text-emerald-700">{{ totalProducts }} items</span>
      </div>
      <div class="flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="category in categories"
          :key="category.id"
          class="flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm transition"
          :class="selectedCategory === category.id ? 'border-emerald-600 bg-emerald-50 font-semibold text-emerald-800' : 'border-slate-200 bg-white text-slate-600'"
          type="button"
          @click="selectCategory(category.id)"
        >
          <Icon :name="category.icon" class="h-4 w-4" />
          <span>{{ category.name }}</span>
        </button>
      </div>
    </section>

    <section id="products" class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div class="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Catalog</p>
          <h2 class="mt-1 text-2xl font-bold text-slate-950">{{ selectedCategoryName }}</h2>
        </div>
        <div class="relative w-full md:max-w-md">
          <Icon name="lucide:search" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            v-model="search"
            class="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-10 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            type="search"
            placeholder="Search products"
          >
          <button v-if="search" class="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700" type="button" aria-label="Clear search" @click="search = ''">
            <Icon name="lucide:x" class="h-4 w-4" />
          </button>
        </div>
      </div>

      <div v-if="isInitialProductLoading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="item in 8" :key="item" class="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div class="aspect-[4/3] animate-pulse bg-slate-100" />
          <div class="space-y-3 p-4">
            <div class="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
            <div class="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
            <div class="h-6 w-24 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </div>

      <div v-else-if="products.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="product in products"
          :key="getProductId(product)"
          class="group overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/70"
        >
          <button class="block w-full text-left" type="button" @click="openProductDetail(getProductId(product))">
            <div class="relative aspect-[4/3] overflow-hidden bg-slate-100">
              <img :src="getProductImage(product)" :alt="product.nameEn" class="h-full w-full object-cover transition duration-300 group-hover:scale-105">
              <span v-if="Number(product.discount || 0) > 0" class="absolute left-3 top-3 rounded-md bg-rose-600 px-2 py-1 text-xs font-bold text-white">Save {{ formatPrice(product.discount || 0) }}</span>
              <span class="absolute right-3 top-3 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-slate-700">{{ getAvailableStock(product.stock) }} left</span>
            </div>
            <div class="p-4">
              <div class="mb-3 min-w-0">
                <p class="text-xs font-medium uppercase tracking-wide text-emerald-700">{{ getCategoryName(product.category) }}</p>
                <h3 class="mt-1 truncate text-sm font-semibold text-slate-950">{{ product.nameEn }}</h3>
                <p v-if="product.nameKh" class="mt-1 truncate text-xs text-slate-500">{{ product.nameKh }}</p>
              </div>
              <div class="flex items-end justify-between gap-3">
                <div>
                  <p class="text-lg font-bold text-emerald-700">{{ formatPrice(getProductFinalPrice(product)) }}</p>
                  <p v-if="Number(product.discount || 0) > 0" class="text-xs text-slate-400 line-through">{{ formatPrice(product.unitPrice) }}</p>
                </div>
                <span class="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white transition group-hover:bg-emerald-700">
                  <Icon name="lucide:eye" class="h-5 w-5" />
                </span>
              </div>
            </div>
          </button>
        </article>
      </div>

      <div v-else class="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
        <Icon name="lucide:search-x" class="mx-auto h-10 w-10 text-slate-300" />
        <h3 class="mt-3 text-base font-semibold text-slate-950">No products found</h3>
        <p class="mt-1 text-sm text-slate-500">Try another keyword or category.</p>
      </div>

      <div ref="loadMoreTarget" class="h-12" />

      <div v-if="isLoadingMore" class="mt-2 flex items-center justify-center gap-2 text-sm text-slate-500">
        <Icon name="lucide:loader-circle" class="h-4 w-4 animate-spin" />
        Loading more products
      </div>

      <p v-else-if="products.length && !hasMoreProducts" class="mt-4 text-center text-sm text-slate-400">
        You reached the end of the catalog.
      </p>
    </section>

    <el-dialog v-model="isDetailDialogVisible" width="860px" destroy-on-close class="product-detail-dialog">
      <template #header>
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Product detail</p>
          <h3 class="mt-1 text-lg font-bold text-slate-950">{{ selectedProduct?.nameEn || 'Loading product' }}</h3>
        </div>
      </template>

      <div v-if="detailLoading" class="grid min-h-[320px] place-items-center">
        <Icon name="lucide:loader-circle" class="h-8 w-8 animate-spin text-emerald-600" />
      </div>

      <div v-else-if="selectedProduct" class="grid gap-6 md:grid-cols-[minmax(0,360px)_1fr]">
        <div class="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          <img :src="getProductImage(selectedProduct)" :alt="selectedProduct.nameEn" class="aspect-square h-full w-full object-cover">
        </div>
        <div class="min-w-0">
          <div class="mb-4 flex flex-wrap gap-2">
            <span class="rounded bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{{ getCategoryName(selectedProduct.category) }}</span>
            <span class="rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{{ selectedProduct.code }}</span>
          </div>

          <h2 class="text-2xl font-bold text-slate-950">{{ selectedProduct.nameEn }}</h2>
          <p v-if="selectedProduct.nameKh" class="mt-1 text-sm text-slate-500">{{ selectedProduct.nameKh }}</p>
          <p v-if="selectedProduct.description" class="mt-4 text-sm leading-6 text-slate-600">{{ selectedProduct.description }}</p>

          <div class="mt-6 grid gap-3 sm:grid-cols-3">
            <div class="rounded-lg border border-slate-200 bg-white p-3">
              <p class="text-xs text-slate-500">Price</p>
              <p class="mt-1 text-lg font-bold text-emerald-700">{{ formatPrice(getProductFinalPrice(selectedProduct)) }}</p>
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-3">
              <p class="text-xs text-slate-500">Discount</p>
              <p class="mt-1 text-lg font-bold text-slate-950">{{ formatPrice(selectedProduct.discount || 0) }}</p>
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-3">
              <p class="text-xs text-slate-500">Stock</p>
              <p class="mt-1 text-lg font-bold text-slate-950">{{ getAvailableStock(selectedProduct.stock) }}</p>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'

definePageMeta({
  title: 'តោះចាយលុយ!'
})

type ApiCategory = {
  id?: string
  _id?: string
  code?: string
  nameEn?: string
  nameKh?: string
  icon?: string
}

type Category = {
  id: string
  code?: string
  name: string
  icon: string
  count: number
}

type ApiStock = {
  stockIn?: number
  stockOut?: number
  stockAdjustment?: number
  isStock?: boolean
}

type MinioUploadObject = {
  bucket?: string
  objectName?: string
  originalName?: string
  mimeType?: string
  size?: number
  etag?: string
  publicId?: string
  public_id?: string
  fileName?: string
  filename?: string
  url?: string
  secureUrl?: string
  secure_url?: string
  path?: string
  data?: ThumbnailValue
}

type ThumbnailValue = string | MinioUploadObject | null

type ApiProduct = {
  _id?: string
  id?: string
  code: string
  nameEn: string
  nameKh?: string
  unitPrice: number
  thumbnail?: ThumbnailValue
  discount?: number
  description?: string
  category?: ApiCategory
  stock?: ApiStock
}

type ApiBanner = {
  id?: string
  _id?: string
  product?: string | ApiProduct
  title: string
  description?: string
  thumbnail?: ThumbnailValue
}

type CollectionResponse<T> = {
  success?: boolean
  message?: string
  data?: T[] | { items?: T[]; docs?: T[]; categories?: T[]; products?: T[]; banners?: T[] }
  items?: T[]
  docs?: T[]
  categories?: T[]
  products?: T[]
  banners?: T[]
  pagination?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
}

type DetailResponse<T> = {
  success?: boolean
  message?: string
  data?: T
}

const config = useRuntimeConfig()
const route = useRoute()
const authToken = useCookie<string | null>('auth_token')

const apiBaseUrl = computed(() => String(config.public.apiBaseUrl).replace(/\/$/, ''))
const categoriesEndpoint = computed(() => `${apiBaseUrl.value}/master-data/categories/select-options`)
const bannersEndpoint = computed(() => `${apiBaseUrl.value}/saling/banners/select-options`)
const productsEndpoint = computed(() => `${apiBaseUrl.value}/master-data/products`)
const requestHeaders = computed(() => ({
  ...(authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {})
}))

const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
const selectedCategory = ref('all')
const activeBanner = ref(0)
const categoryOptions = ref<ApiCategory[]>([])
const banners = ref<ApiBanner[]>([])
const products = ref<ApiProduct[]>([])
const selectedProduct = ref<ApiProduct | null>(null)
const thumbnailUrlCache = ref<Record<string, string>>({})
const categoryLoading = ref(true)
const bannerLoading = ref(true)
const productLoading = ref(false)
const detailLoading = ref(false)
const isDetailDialogVisible = ref(false)
const productPage = ref(1)
const productLimit = 10
const totalProducts = ref(0)
const loadMoreTarget = ref<HTMLElement | null>(null)

let carouselTimer: ReturnType<typeof setInterval> | undefined
let searchTimer: ReturnType<typeof setTimeout> | undefined
let loadMoreObserver: IntersectionObserver | undefined

const fallbackBanners: ApiBanner[] = [
  {
    id: 'fallback-market',
    title: 'Fresh products ready for order',
    description: 'Browse available products by category and quickly inspect price, discount, and stock.',
    thumbnail: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=80'
  }
]

const fallbackProductImages = [
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1601599963565-b7ba29c8e5ff?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=700&q=80'
]

const minioBucketPathPattern = /\/order-management\/(.+?)(?:\?.*)?$/

const isInitialProductLoading = computed(() => productLoading.value && productPage.value === 1)
const isLoadingMore = computed(() => productLoading.value && productPage.value > 1)
const hasMoreProducts = computed(() => products.value.length < totalProducts.value)

const categories = computed<Category[]>(() => [
  {
    id: 'all',
    name: 'All products',
    icon: 'lucide:store',
    count: totalProducts.value
  },
  ...categoryOptions.value.map((category) => ({
    id: getCategoryId(category),
    code: category.code,
    name: getCategoryName(category),
    icon: category.icon || 'lucide:tags',
    count: countLoadedProductsByCategory(category)
  })).filter((category) => Boolean(category.id))
])

const selectedCategoryName = computed(() => {
  return categories.value.find((category) => category.id === selectedCategory.value)?.name || 'Products'
})

const extractCollection = <T>(response: CollectionResponse<T> | T[]): T[] => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data?.items)) return response.data.items
  if (Array.isArray(response.data?.docs)) return response.data.docs
  if (Array.isArray(response.data?.categories)) return response.data.categories
  if (Array.isArray(response.data?.products)) return response.data.products
  if (Array.isArray(response.data?.banners)) return response.data.banners
  if (Array.isArray(response.items)) return response.items
  if (Array.isArray(response.docs)) return response.docs
  if (Array.isArray(response.categories)) return response.categories
  if (Array.isArray(response.products)) return response.products
  if (Array.isArray(response.banners)) return response.banners
  return []
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string; error?: string } }).data
    return data?.message || data?.error || fallback
  }

  return fallback
}

const getCategoryId = (category?: ApiCategory) => category?._id || category?.id || category?.code || ''

const getCategoryName = (category?: ApiCategory) => {
  return category?.nameEn || category?.nameKh || category?.code || 'Uncategorized'
}

const isProductObject = (product?: string | ApiProduct): product is ApiProduct => {
  return typeof product === 'object' && product !== null
}

const getProductId = (product?: string | ApiProduct) => {
  if (!product) return ''
  return typeof product === 'string' ? product : product._id || product.id || ''
}

const getBannerId = (banner: ApiBanner, index: number) => banner._id || banner.id || `${banner.title}-${index}`

const getObjectNameFromThumbnail = (thumbnail?: ThumbnailValue): string => {
  if (!thumbnail) return ''

  if (typeof thumbnail === 'string') {
    if (thumbnail.startsWith('uploads/')) return ''

    const objectNameFromUrl = thumbnail.match(minioBucketPathPattern)?.[1]
    if (objectNameFromUrl) return decodeURIComponent(objectNameFromUrl)
    if (/^https?:\/\//.test(thumbnail)) return ''

    return thumbnail
  }

  if (thumbnail.data) return getObjectNameFromThumbnail(thumbnail.data)

  return thumbnail.objectName
    || thumbnail.publicId
    || thumbnail.public_id
    || thumbnail.fileName
    || thumbnail.filename
    || (thumbnail.url?.match(minioBucketPathPattern)?.[1]
      ? decodeURIComponent(thumbnail.url.match(minioBucketPathPattern)?.[1] || '')
      : '')
}

const isUsableImageSource = (source?: string) => {
  if (!source) return false
  return /^https?:\/\//.test(source) || source.includes('/') || /\.(png|jpe?g|webp|gif|avif)$/i.test(source)
}

const getDirectAssetUrl = (source?: ThumbnailValue) => {
  if (!source) return ''

  if (typeof source !== 'string') {
    if (getObjectNameFromThumbnail(source)) return ''

    return source.secureUrl || source.secure_url || source.url || source.path || ''
  }

  if (!isUsableImageSource(source)) return ''
  if (getObjectNameFromThumbnail(source)) return ''
  if (/^https?:\/\//.test(source)) return source

  return `${apiBaseUrl.value.replace(/\/api\/v\d+$/, '')}/${String(source).replace(/^\//, '')}`
}

const getThumbnailCacheKey = (source?: ThumbnailValue) => getObjectNameFromThumbnail(source) || getDirectAssetUrl(source)

const getAssetUrl = (source?: ThumbnailValue) => {
  const cacheKey = getThumbnailCacheKey(source)

  return (cacheKey ? thumbnailUrlCache.value[cacheKey] : '') || getDirectAssetUrl(source)
}

const getFallbackProductImage = (product?: ApiProduct) => {
  const id = product ? getProductId(product) || product.code : ''
  const index = id ? id.charCodeAt(id.length - 1) % fallbackProductImages.length : 0
  return fallbackProductImages[index]
}

const getProductImage = (product: ApiProduct) => {
  return getAssetUrl(product.thumbnail) || getFallbackProductImage(product)
}

const getBannerImage = (banner: ApiBanner) => {
  return getAssetUrl(banner.thumbnail) || getAssetUrl(isProductObject(banner.product) ? banner.product.thumbnail : null) || fallbackBanners[0].thumbnail || ''
}

const getBannerProductId = (banner: ApiBanner) => getProductId(banner.product)

const getBannerProductCode = (banner: ApiBanner) => {
  return isProductObject(banner.product) ? banner.product.code : ''
}

const getBannerProductPrice = (banner: ApiBanner) => {
  if (!isProductObject(banner.product)) return ''

  return formatPrice(getDiscountedPrice(banner.product.unitPrice, banner.product.discount))
}

const getDiscountedPrice = (unitPrice = 0, discount = 0) => {
  return Math.max(Number(unitPrice || 0) - Number(discount || 0), 0)
}

const getProductFinalPrice = (product: ApiProduct) => getDiscountedPrice(product.unitPrice, product.discount)

const formatPrice = (value = 0) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(Number(value || 0))
}

const getAvailableStock = (stock?: ApiStock) => {
  if (!stock?.isStock) return 0
  return Math.max(Number(stock.stockIn || 0) + Number(stock.stockAdjustment || 0) - Number(stock.stockOut || 0), 0)
}

const countLoadedProductsByCategory = (category: ApiCategory) => {
  const categoryKeys = [getCategoryId(category), category.code, category.nameEn, category.nameKh]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase())

  return products.value.filter((product) => {
    const productCategory = product.category
    const productKeys = [getCategoryId(productCategory), productCategory?.code, productCategory?.nameEn, productCategory?.nameKh]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase())

    return productKeys.some((value) => categoryKeys.includes(value))
  }).length
}

const loadThumbnailUrl = async (thumbnail?: ThumbnailValue) => {
  const objectName = getObjectNameFromThumbnail(thumbnail)
  if (!thumbnail || !objectName || thumbnailUrlCache.value[objectName]) return

  try {
    const response = await $fetch<{ data?: { url?: string }; url?: string }>('minio/presigned-get', {
      baseURL: `${apiBaseUrl.value}/`,
      method: 'post',
      headers: requestHeaders.value,
      body: {
        objectName,
        expiresInSeconds: 3600
      }
    })

    const url = response.data?.url || response.url
    if (url) {
      thumbnailUrlCache.value = {
        ...thumbnailUrlCache.value,
        [objectName]: url
      }
    }
  } catch (error) {
    console.error(error)
  }
}

const loadProductImageUrls = (items: ApiProduct[]) => {
  items.forEach((product) => {
    loadThumbnailUrl(product.thumbnail)
  })
}

const loadBannerImageUrls = (items: ApiBanner[]) => {
  items.forEach((banner) => {
    loadThumbnailUrl(banner.thumbnail)
    if (isProductObject(banner.product)) {
      loadThumbnailUrl(banner.product.thumbnail)
    }
  })
}

const refreshCategories = async () => {
  categoryLoading.value = true

  try {
    const response = await $fetch<CollectionResponse<ApiCategory>>(categoriesEndpoint.value, {
      headers: requestHeaders.value
    })
    categoryOptions.value = extractCollection(response)
  } catch (error) {
    ElMessage.error(getErrorMessage(error, 'Failed to load categories.'))
  } finally {
    categoryLoading.value = false
  }
}

const refreshBanners = async () => {
  bannerLoading.value = true

  try {
    const response = await $fetch<CollectionResponse<ApiBanner>>(bannersEndpoint.value, {
      headers: requestHeaders.value
    })
    banners.value = extractCollection(response).map((banner, index) => ({
      ...banner,
      id: getBannerId(banner, index)
    }))

    if (!banners.value.length) {
      banners.value = fallbackBanners
    }
    loadBannerImageUrls(banners.value)
  } catch (error) {
    banners.value = fallbackBanners
    ElMessage.error(getErrorMessage(error, 'Failed to load banners.'))
  } finally {
    bannerLoading.value = false
  }
}

const buildProductQuery = () => ({
  page: productPage.value,
  limit: productLimit,
  ...(search.value.trim() ? { search: search.value.trim() } : {}),
  ...(selectedCategory.value !== 'all' ? { category: selectedCategory.value } : {})
})

const refreshProducts = async (mode: 'replace' | 'append' = 'replace') => {
  if (productLoading.value) return
  productLoading.value = true

  try {
    const response = await $fetch<CollectionResponse<ApiProduct>>(productsEndpoint.value, {
      headers: requestHeaders.value,
      query: buildProductQuery()
    })

    const items = extractCollection(response)
    products.value = mode === 'append' ? [...products.value, ...items] : items
    loadProductImageUrls(items)
    totalProducts.value = response.pagination?.total ?? products.value.length
  } catch (error) {
    ElMessage.error(getErrorMessage(error, 'Failed to load products.'))
    if (mode === 'replace') {
      products.value = []
      totalProducts.value = 0
    }
  } finally {
    productLoading.value = false
  }
}

const loadMoreProducts = async () => {
  if (productLoading.value || !hasMoreProducts.value) return
  productPage.value += 1
  await refreshProducts('append')
}

const resetAndRefreshProducts = async () => {
  productPage.value = 1
  products.value = []
  totalProducts.value = 0
  await refreshProducts('replace')
}

const selectCategory = (categoryId: string) => {
  if (selectedCategory.value === categoryId) return
  selectedCategory.value = categoryId
  resetAndRefreshProducts()
}

const openProductDetail = async (productId?: string) => {
  if (!productId) return

  isDetailDialogVisible.value = true
  detailLoading.value = true
  selectedProduct.value = products.value.find((product) => getProductId(product) === productId) || null

  try {
    const response = await $fetch<DetailResponse<ApiProduct>>(`${productsEndpoint.value}/${productId}`, {
      headers: requestHeaders.value
    })
    selectedProduct.value = response.data || selectedProduct.value
    loadThumbnailUrl(selectedProduct.value?.thumbnail)
  } catch (error) {
    ElMessage.error(getErrorMessage(error, 'Failed to load product detail.'))
  } finally {
    detailLoading.value = false
  }
}

const showNextBanner = () => {
  if (!banners.value.length) return
  activeBanner.value = (activeBanner.value + 1) % banners.value.length
}

const showPreviousBanner = () => {
  if (!banners.value.length) return
  activeBanner.value = activeBanner.value === 0 ? banners.value.length - 1 : activeBanner.value - 1
}

watch(
  () => route.query.q,
  (value) => {
    search.value = typeof value === 'string' ? value : ''
  }
)

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    resetAndRefreshProducts()
  }, 350)
})

onMounted(() => {
  refreshCategories()
  refreshBanners()
  resetAndRefreshProducts()

  carouselTimer = setInterval(showNextBanner, 5000)

  if (loadMoreTarget.value) {
    loadMoreObserver = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        loadMoreProducts()
      }
    }, {
      rootMargin: '320px'
    })
    loadMoreObserver.observe(loadMoreTarget.value)
  }
})

onBeforeUnmount(() => {
  if (carouselTimer) clearInterval(carouselTimer)
  if (searchTimer) clearTimeout(searchTimer)
  loadMoreObserver?.disconnect()
})
</script>

<style scoped>
:deep(.product-detail-dialog) {
  border-radius: 8px;
}
</style>
