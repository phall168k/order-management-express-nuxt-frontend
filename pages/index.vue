<template>
  <div class="min-h-screen bg-slate-50 pb-12">
    <section class="border-b border-slate-200 bg-white">
      <div class="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside class="hidden rounded-lg border border-slate-200 bg-white p-3 lg:block">
          <div class="mb-3 flex items-center justify-between px-2">
            <h2 class="text-sm font-semibold text-slate-950">{{ t('storefront.categories') }}</h2>
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
                  <p class="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">{{ getBannerProductCode(banner) || t('storefront.featured') }}</p>
                  <h1 class="text-3xl font-bold leading-tight sm:text-5xl">{{ banner.title }}</h1>
                  <p class="mt-4 max-w-md text-sm leading-6 text-slate-100 sm:text-base">{{ banner.description }}</p>
                  <div v-if="getBannerProductId(banner)" class="mt-6 flex flex-wrap items-center gap-3">
                    <button class="rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700" type="button" @click="openProductDetail(getBannerProductId(banner))">
                      {{ t('storefront.viewProduct') }}
                    </button>
                    <span v-if="getBannerProductPrice(banner)" class="text-sm font-semibold text-emerald-100">{{ getBannerProductPrice(banner) }}</span>
                  </div>
                </div>
              </div>

              <button
                v-if="banners.length > 1"
                class="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
                type="button"
                :aria-label="t('storefront.previousBanner')"
                @click="showPreviousBanner"
              >
                <Icon name="lucide:chevron-left" class="h-5 w-5" />
              </button>
              <button
                v-if="banners.length > 1"
                class="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
                type="button"
                :aria-label="t('storefront.nextBanner')"
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
                  :aria-label="t('storefront.showBanner', { number: index + 1 })"
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
        <h2 class="text-base font-semibold text-slate-950">{{ t('storefront.categories') }}</h2>
        <span class="text-xs font-medium text-emerald-700">{{ t('storefront.itemCount', totalProducts, { count: totalProducts }) }}</span>
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
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">{{ t('storefront.catalog') }}</p>
          <h2 class="mt-1 text-2xl font-bold text-slate-950">{{ selectedCategoryName }}</h2>
        </div>
        <div class="relative w-full md:max-w-md">
          <Icon name="lucide:search" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            v-model="search"
            class="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-10 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            type="search"
            :placeholder="t('storefront.searchProducts')"
          >
          <button v-if="search" class="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700" type="button" :aria-label="t('storefront.clearSearch')" @click="search = ''">
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
              <img :src="getProductImage(product)" :alt="getProductName(product)" class="h-full w-full object-cover transition duration-300 group-hover:scale-105">
              <span v-if="Number(product.discount || 0) > 0" class="absolute left-3 top-3 rounded-md bg-rose-600 px-2 py-1 text-xs font-bold text-white">{{ t('storefront.save', { amount: formatPrice(product.discount || 0) }) }}</span>
              <span class="absolute right-3 top-3 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-slate-700">{{ t('storefront.stockLeft', { count: getAvailableStock(product.stock) }) }}</span>
            </div>
          </button>
          <div class="p-4">
            <button class="mb-3 block min-w-0 text-left" type="button" @click="openProductDetail(getProductId(product))">
              <p class="text-xs font-medium uppercase tracking-wide text-emerald-700">{{ getCategoryName(product.category) }}</p>
              <h3 class="mt-1 truncate text-sm font-semibold text-slate-950">{{ getProductName(product) }}</h3>
              <p v-if="getProductSecondaryName(product)" class="mt-1 truncate text-xs text-slate-500">{{ getProductSecondaryName(product) }}</p>
            </button>
            <div class="flex items-end justify-between gap-3">
              <button class="text-left" type="button" @click="openProductDetail(getProductId(product))">
                <p class="text-lg font-bold text-emerald-700">{{ formatPrice(getProductFinalPrice(product)) }}</p>
                <p v-if="Number(product.discount || 0) > 0" class="text-xs text-slate-400 line-through">{{ formatPrice(product.unitPrice) }}</p>
              </button>
              <button
                class="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-950 text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:bg-emerald-500"
                type="button"
                :disabled="isProductBeingPicked(getProductId(product))"
                :aria-label="t('storefront.addToCart')"
                @click="handlePickProduct(product)"
              >
                <Icon v-if="isProductBeingPicked(getProductId(product))" name="lucide:loader-circle" class="h-5 w-5 animate-spin" />
                <Icon v-else name="lucide:shopping-cart" class="h-5 w-5" />
              </button>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
        <Icon name="lucide:search-x" class="mx-auto h-10 w-10 text-slate-300" />
        <h3 class="mt-3 text-base font-semibold text-slate-950">{{ t('storefront.noProducts') }}</h3>
        <p class="mt-1 text-sm text-slate-500">{{ t('storefront.noProductsHelp') }}</p>
      </div>

      <div ref="loadMoreTarget" class="h-12" />

      <div v-if="isLoadingMore" class="mt-2 flex items-center justify-center gap-2 text-sm text-slate-500">
        <Icon name="lucide:loader-circle" class="h-4 w-4 animate-spin" />
        {{ t('storefront.loadingMore') }}
      </div>

      <p v-else-if="products.length && !hasMoreProducts" class="mt-4 text-center text-sm text-slate-400">
        {{ t('storefront.endOfCatalog') }}
      </p>
    </section>

    <section v-if="pickedProducts.length" class="fixed bottom-5 left-1/2 z-30 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 sm:left-auto sm:right-6 sm:w-auto sm:translate-x-0">
      <div class="flex items-center justify-between gap-5 rounded-xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10 sm:min-w-[380px]">
        <div class="min-w-0">
          <p class="text-xs font-medium text-slate-500">{{ t('storefront.cartCount', pickedProductsCount, { count: pickedProductsCount }) }}</p>
          <p class="truncate text-lg font-bold text-slate-950">{{ formatPrice(checkoutTotal) }}</p>
        </div>
        <button class="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800" type="button" @click="openCheckout">
          <Icon name="lucide:credit-card" class="h-4 w-4" />
          {{ t('storefront.placeOrder') }}
        </button>
      </div>
    </section>

    <el-dialog v-model="isCheckoutVisible" :title="t('storefront.checkout.title')" width="680px" destroy-on-close>
      <el-form ref="checkoutFormRef" :model="checkoutForm" :rules="checkoutRules" label-position="top" @submit.prevent="submitOrder">
        <div class="grid gap-4 sm:grid-cols-2">
          <el-form-item :label="t('storefront.checkout.orderCode')" prop="code">
            <el-input v-model="checkoutForm.code" />
          </el-form-item>
          <el-form-item :label="t('storefront.checkout.paymentMethod')" prop="paymentMethod">
            <el-select v-model="checkoutForm.paymentMethod" class="w-full" filterable :loading="paymentMethodsLoading" :placeholder="t('storefront.checkout.selectPaymentMethod')">
              <el-option v-for="method in paymentMethods" :key="getPaymentMethodId(method)" :label="getPaymentMethodLabel(method)" :value="getPaymentMethodId(method)" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item :label="t('storefront.checkout.deliveryAddress')" prop="address">
          <el-input v-model="checkoutForm.address" :placeholder="t('storefront.checkout.addressPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('storefront.checkout.orderNote')" prop="note">
          <el-input v-model="checkoutForm.note" type="textarea" :rows="3" :placeholder="t('storefront.checkout.notePlaceholder')" />
        </el-form-item>

        <div class="rounded-lg border border-slate-200">
          <div v-for="order in pickedProducts" :key="getPickedOrderId(order)" class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0">
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-slate-900">{{ getCheckoutProductName(order) }}</p>
              <p class="text-xs text-slate-500">{{ order.quantity || 1 }} × {{ formatPrice(getCheckoutUnitPrice(order)) }}</p>
            </div>
            <p class="shrink-0 text-sm font-bold text-slate-900">{{ formatPrice(getCheckoutLineTotal(order)) }}</p>
          </div>
          <div class="flex items-center justify-between bg-slate-50 px-4 py-3">
            <span class="text-sm font-semibold text-slate-700">{{ t('storefront.checkout.total') }}</span>
            <span class="text-lg font-bold text-emerald-700">{{ formatPrice(checkoutTotal) }}</span>
          </div>
        </div>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="isCheckoutVisible = false">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="isSubmittingOrder" @click="submitOrder">{{ t('storefront.checkout.confirmOrder') }}</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="isDetailDialogVisible" width="860px" destroy-on-close class="product-detail-dialog">
      <template #header>
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">{{ t('storefront.productDetail') }}</p>
          <h3 class="mt-1 text-lg font-bold text-slate-950">{{ selectedProduct ? getProductName(selectedProduct) : t('storefront.loadingProduct') }}</h3>
        </div>
      </template>

      <div v-if="detailLoading" class="grid min-h-[320px] place-items-center">
        <Icon name="lucide:loader-circle" class="h-8 w-8 animate-spin text-emerald-600" />
      </div>

      <div v-else-if="selectedProduct" class="grid gap-6 md:grid-cols-[minmax(0,360px)_1fr]">
        <div class="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          <img :src="getProductImage(selectedProduct)" :alt="getProductName(selectedProduct)" class="aspect-square h-full w-full object-cover">
        </div>
        <div class="min-w-0">
          <div class="mb-4 flex flex-wrap gap-2">
            <span class="rounded bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{{ getCategoryName(selectedProduct.category) }}</span>
            <span class="rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{{ selectedProduct.code }}</span>
          </div>

          <h2 class="text-2xl font-bold text-slate-950">{{ getProductName(selectedProduct) }}</h2>
          <p v-if="getProductSecondaryName(selectedProduct)" class="mt-1 text-sm text-slate-500">{{ getProductSecondaryName(selectedProduct) }}</p>
          <p v-if="selectedProduct.description" class="mt-4 text-sm leading-6 text-slate-600">{{ selectedProduct.description }}</p>

          <div class="mt-6 grid gap-3 sm:grid-cols-3">
            <div class="rounded-lg border border-slate-200 bg-white p-3">
              <p class="text-xs text-slate-500">{{ t('storefront.price') }}</p>
              <p class="mt-1 text-lg font-bold text-emerald-700">{{ formatPrice(getProductFinalPrice(selectedProduct)) }}</p>
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-3">
              <p class="text-xs text-slate-500">{{ t('storefront.discount') }}</p>
              <p class="mt-1 text-lg font-bold text-slate-950">{{ formatPrice(selectedProduct.discount || 0) }}</p>
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-3">
              <p class="text-xs text-slate-500">{{ t('storefront.stock') }}</p>
              <p class="mt-1 text-lg font-bold text-slate-950">{{ getAvailableStock(selectedProduct.stock) }}</p>
            </div>
          </div>

          <button
            class="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:bg-emerald-400"
            type="button"
            :disabled="isProductBeingPicked(getProductId(selectedProduct))"
            @click="handlePickProduct(selectedProduct)"
          >
            <Icon v-if="isProductBeingPicked(getProductId(selectedProduct))" name="lucide:loader-circle" class="h-4 w-4 animate-spin" />
            <Icon v-else name="lucide:shopping-cart" class="h-4 w-4" />
            {{ t('storefront.addToCart') }}
          </button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { PickedOrder, PickedProduct } from '~/composables/usePickedProducts'

definePageMeta({
  title: 'Storefront'
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
const { t, locale } = useI18n()
useHead(() => ({ title: t('storefront.pageTitle') }))
const authToken = useCookie<string | null>('auth_token')
const { user, isAuthenticated } = useAuth()
const {
  pickedProducts,
  pickedProductsCount,
  pickProduct,
  fetchPickedProducts,
  removePickedProduct,
  getPickedProductId,
  getPickedOrderId
} = usePickedProducts()

const apiBaseUrl = computed(() => String(config.public.apiBaseUrl).replace(/\/$/, ''))
const categoriesEndpoint = computed(() => `${apiBaseUrl.value}/master-data/categories/select-options`)
const bannersEndpoint = computed(() => `${apiBaseUrl.value}/saling/banners/select-options`)
const productsEndpoint = computed(() => `${apiBaseUrl.value}/master-data/products`)
const salesEndpoint = computed(() => `${apiBaseUrl.value}/saling/sales`)
const paymentMethodsEndpoint = computed(() => `${apiBaseUrl.value}/system/payment-methods`)
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
const pickingProductIds = ref<string[]>([])
type PaymentMethod = { _id?: string; id?: string; merchantName?: string; bankAccount?: string; isActive?: boolean }
type PaymentMethodsResponse = PaymentMethod[] | { data?: PaymentMethod[] | { paymentMethods?: PaymentMethod[]; items?: PaymentMethod[]; docs?: PaymentMethod[] }; paymentMethods?: PaymentMethod[]; items?: PaymentMethod[]; docs?: PaymentMethod[] }

const isCheckoutVisible = ref(false)
const isSubmittingOrder = ref(false)
const paymentMethodsLoading = ref(false)
const paymentMethods = ref<PaymentMethod[]>([])
const checkoutFormRef = ref<FormInstance>()
const checkoutForm = reactive({ code: '', paymentMethod: '', address: '', note: '' })
const checkoutRules: FormRules = {
  code: [{ required: true, message: () => t('storefront.validation.orderCodeRequired'), trigger: 'blur' }],
  paymentMethod: [{ required: true, message: () => t('storefront.validation.paymentMethodRequired'), trigger: 'change' }],
  address: [{ required: true, message: () => t('storefront.validation.addressRequired'), trigger: 'blur' }]
}

let carouselTimer: ReturnType<typeof setInterval> | undefined
let searchTimer: ReturnType<typeof setTimeout> | undefined
let loadMoreObserver: IntersectionObserver | undefined

const fallbackBanners: ApiBanner[] = [
  {
    id: 'fallback-market',
    title: '',
    description: '',
    thumbnail: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=80'
  }
]

const getFallbackBanners = (): ApiBanner[] => fallbackBanners.map((banner) => ({
  ...banner,
  title: t('storefront.fallbackBanner.title'),
  description: t('storefront.fallbackBanner.description')
}))

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
    name: t('storefront.allProducts'),
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
  return categories.value.find((category) => category.id === selectedCategory.value)?.name || t('storefront.products')
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
  return (locale.value === 'km' ? category?.nameKh || category?.nameEn : category?.nameEn || category?.nameKh)
    || category?.code
    || t('storefront.uncategorized')
}

const getProductName = (product?: ApiProduct | null) => {
  if (!product) return t('storefront.product')
  return (locale.value === 'km' ? product.nameKh || product.nameEn : product.nameEn || product.nameKh)
    || product.code
    || t('storefront.product')
}

const getProductSecondaryName = (product?: ApiProduct | null) => {
  if (!product) return ''
  return locale.value === 'km' ? product.nameEn : product.nameKh || ''
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
  return new Intl.NumberFormat(locale.value === 'km' ? 'km-KH' : 'en-US', {
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
    ElMessage.error(getErrorMessage(error, t('storefront.errors.categories')))
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
      banners.value = getFallbackBanners()
    }
    loadBannerImageUrls(banners.value)
  } catch (error) {
    banners.value = getFallbackBanners()
    ElMessage.error(getErrorMessage(error, t('storefront.errors.banners')))
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
    ElMessage.error(getErrorMessage(error, t('storefront.errors.products')))
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
    ElMessage.error(getErrorMessage(error, t('storefront.errors.productDetail')))
  } finally {
    detailLoading.value = false
  }
}

const isProductBeingPicked = (productId?: string) => {
  return Boolean(productId && pickingProductIds.value.includes(productId))
}

const handlePickProduct = async (product?: ApiProduct | null) => {
  const productId = getProductId(product || undefined)
  if (!productId || isProductBeingPicked(productId)) return

  pickingProductIds.value = [...pickingProductIds.value, productId]

  try {
    await pickProduct(productId)
    ElMessage.success(t('storefront.messages.addedToCart'))
  } catch (error) {
    ElMessage.error(getErrorMessage(error, t('storefront.errors.addToCart')))
  } finally {
    pickingProductIds.value = pickingProductIds.value.filter((id) => id !== productId)
  }
}

const getCheckoutProduct = (order: PickedOrder): PickedProduct | null => {
  return typeof order.product === 'object' && order.product !== null ? order.product : null
}

const getCheckoutProductName = (order: PickedOrder) => {
  const product = getCheckoutProduct(order)
  return product ? getProductName(product as ApiProduct) : getPickedProductId(order.product) || t('storefront.product')
}

const getCheckoutUnitPrice = (order: PickedOrder) => {
  const product = getCheckoutProduct(order)
  return Math.max(Number(product?.unitPrice || 0) - Number(product?.discount || 0), 0)
}

const getCheckoutLineTotal = (order: PickedOrder) => {
  return getCheckoutUnitPrice(order) * Math.max(Number(order.quantity || 1), 1)
}

const checkoutTotal = computed(() => pickedProducts.value.reduce((total, order) => total + getCheckoutLineTotal(order), 0))

const getPaymentMethodId = (method: PaymentMethod) => method._id || method.id || ''
const getPaymentMethodLabel = (method: PaymentMethod) => {
  return [method.merchantName, method.bankAccount].filter(Boolean).join(' — ') || t('storefront.checkout.paymentMethod')
}

const extractPaymentMethods = (response: PaymentMethodsResponse): PaymentMethod[] => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data?.paymentMethods)) return response.data.paymentMethods
  if (Array.isArray(response.data?.items)) return response.data.items
  if (Array.isArray(response.data?.docs)) return response.data.docs
  if (Array.isArray(response.paymentMethods)) return response.paymentMethods
  if (Array.isArray(response.items)) return response.items
  if (Array.isArray(response.docs)) return response.docs
  return []
}

const loadPaymentMethods = async () => {
  if (paymentMethods.value.length || paymentMethodsLoading.value) return
  paymentMethodsLoading.value = true
  try {
    const response = await $fetch<PaymentMethodsResponse>(paymentMethodsEndpoint.value, {
      headers: requestHeaders.value,
      query: { page: 1, limit: 100, isActive: true }
    })
    paymentMethods.value = extractPaymentMethods(response).filter((method) => method.isActive !== false && getPaymentMethodId(method))
  } catch (error) {
    ElMessage.error(getErrorMessage(error, t('storefront.errors.paymentMethods')))
  } finally {
    paymentMethodsLoading.value = false
  }
}

const createSaleCode = () => {
  const now = new Date()
  const date = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((part, index) => index ? String(part).padStart(2, '0') : part).join('')
  return `SALE-${date}-${String(now.getTime()).slice(-6)}`
}

const openCheckout = async () => {
  if (!isAuthenticated.value) {
    await navigateTo('/auth/login')
    return
  }
  if (!pickedProducts.value.length) return

  checkoutForm.code = createSaleCode()
  checkoutForm.address = user.value?.userProfile?.address || checkoutForm.address
  isCheckoutVisible.value = true
  await loadPaymentMethods()
}

const submitOrder = async () => {
  if (isSubmittingOrder.value || !pickedProducts.value.length) return
  const isValid = await checkoutFormRef.value?.validate().catch(() => false)
  if (!isValid) return

  const customerId = user.value?._id || user.value?.id
  if (!customerId) {
    ElMessage.error(t('storefront.errors.customerNotFound'))
    return
  }

  const items = pickedProducts.value.map((order) => {
    const product = getCheckoutProduct(order)
    return {
      product: getPickedProductId(order.product),
      quantity: Math.max(Number(order.quantity || 1), 1),
      unitPrice: Number(product?.unitPrice || 0),
      discount: Number(product?.discount || 0),
      note: ''
    }
  })

  if (items.some((item) => !item.product)) {
    ElMessage.error(t('storefront.errors.invalidCart'))
    return
  }

  isSubmittingOrder.value = true
  try {
    await $fetch(salesEndpoint.value, {
      method: 'POST',
      headers: requestHeaders.value,
      body: {
        code: checkoutForm.code.trim(),
        customer: customerId,
        salingDate: new Date().toISOString(),
        status: 'pending',
        paymentMethod: checkoutForm.paymentMethod,
        address: checkoutForm.address.trim(),
        note: checkoutForm.note.trim(),
        items
      }
    })

    const ordersToRemove = [...pickedProducts.value]
    await Promise.allSettled(ordersToRemove.map((order) => removePickedProduct(order)))
    await fetchPickedProducts()
    isCheckoutVisible.value = false
    checkoutForm.paymentMethod = ''
    checkoutForm.note = ''
    ElMessage.success(t('storefront.messages.orderPlaced'))
  } catch (error) {
    ElMessage.error(getErrorMessage(error, t('storefront.errors.placeOrder')))
  } finally {
    isSubmittingOrder.value = false
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
  fetchPickedProducts().catch(console.error)

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
