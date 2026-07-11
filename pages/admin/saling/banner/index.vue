<template>
  <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div class="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-base font-semibold">{{ t('banners.title') }}</h2>
        <p class="text-sm text-slate-500">{{ t('banners.description') }}</p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <el-input v-model="search" class="w-full sm:w-64" :placeholder="t('common.search')" clearable>
          <template #prefix>
            <Icon name="lucide:search" class="h-4 w-4 text-slate-400" />
          </template>
        </el-input>
        <el-button v-if="canCreateBanner" type="primary" @click="openCreateDialog">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          {{ t('banners.actions.new') }}
        </el-button>
      </div>
    </div>

    <div class="p-5">
      <el-table v-loading="isLoading" :data="banners" stripe class="w-full">
        <el-table-column :label="t('banners.thumbnail')" width="150">
          <template #default="{ row }">
            <div class="grid h-16 w-28 place-items-center overflow-hidden rounded border border-slate-200 bg-slate-50">
              <img
                v-if="getBannerThumbnailUrl(row.thumbnail)"
                :alt="row.title"
                class="h-full w-full object-cover"
                :src="getBannerThumbnailUrl(row.thumbnail)"
              >
              <Icon v-else name="lucide:image" class="h-5 w-5 text-slate-400" />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="title" :label="t('banners.bannerTitle')" min-width="180" />
        <el-table-column :label="t('banners.product')" min-width="200">
          <template #default="{ row }">
            {{ getProductLabel(row.product) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" :label="t('common.description')" min-width="240" show-overflow-tooltip />
        <el-table-column :label="t('common.status')" min-width="120">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'">
              {{ row.isActive ? t('banners.status.active') : t('banners.status.inactive') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="canUpdateBanner || canDeleteBanner" fixed="right" :label="t('common.actions')" width="130">
          <template #default="{ row }">
            <div class="flex items-center gap-1">
              <el-tooltip v-if="canUpdateBanner" :content="t('banners.actions.edit')" placement="top">
                <el-button circle text @click="openEditDialog(row)">
                  <Icon name="lucide:pencil" class="h-4 w-4" />
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="canDeleteBanner" :content="t('banners.actions.delete')" placement="top">
                <el-button circle text type="danger" @click="deleteBanner(row)">
                  <Icon name="lucide:trash-2" class="h-4 w-4" />
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-5 flex justify-end">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20, 50]"
          :total="totalItems"
          background
          layout="total, sizes, prev, pager, next"
        />
      </div>
    </div>

    <el-dialog
      v-model="isDialogVisible"
      :title="isEditing ? t('banners.dialog.editTitle') : t('banners.dialog.createTitle')"
      width="760px"
      destroy-on-close
      draggable
    >
      <el-form
        ref="bannerFormRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="submitBanner"
      >
          <el-form-item :label="t('banners.product')" prop="product">
            <el-select
              v-model="form.product"
              class="w-full"
              filterable
              clearable
              :loading="isLoadingProducts"
              :placeholder="t('banners.placeholders.product')"
            >
              <el-option
                v-for="product in productOptions"
                :key="product._id"
                :label="getProductOptionLabel(product)"
                :value="product._id"
              />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('banners.bannerTitle')" prop="title">
            <el-input v-model="form.title" :placeholder="t('banners.placeholders.title')" />
          </el-form-item>
          <el-form-item :label="t('banners.thumbnail')" prop="thumbnail">
            <SingleUpload v-model="form.thumbnail" class="w-full" />
          </el-form-item>

        <el-form-item :label="t('common.description')" prop="description">
          <el-input
            v-model="form.description"
            :placeholder="t('banners.placeholders.description')"
            :rows="3"
            type="textarea"
          />
        </el-form-item>

        <el-form-item :label="t('banners.isActive')">
          <el-switch v-model="form.isActive" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="isDialogVisible = false">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="isSaving" @click="submitBanner">
            {{ isEditing ? t('banners.actions.save') : t('banners.actions.create') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </section>
</template>

<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import SingleUpload from '~/@core/components/SingleUpload.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  permission: 'banner.read'
})

type ApiBanner = {
  _id?: string
  id?: string
  title: string
  product?: string | ProductOption
  description?: string
  thumbnail?: BannerThumbnail
  isActive?: boolean
}

type BannerForm = {
  title: string
  product: string
  description: string
  thumbnail: BannerThumbnail
  isActive: boolean
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
  data?: BannerThumbnail
}

type BannerThumbnail = string | MinioUploadObject | null

type BannerPayload = Omit<BannerForm, 'description' | 'thumbnail'> & {
  description?: string
  thumbnail: string
}

type ProductOption = {
  _id: string
  id?: string
  code?: string
  nameEn?: string
  nameKh?: string
}

type PaginatedResponse = {
  data?: ApiBanner[] | { banners?: ApiBanner[]; items?: ApiBanner[]; docs?: ApiBanner[] }
  banners?: ApiBanner[]
  items?: ApiBanner[]
  docs?: ApiBanner[]
  pagination?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
  message?: string
}

type BannerResponse = ApiBanner[] | PaginatedResponse

type ProductOptionsResponse = ProductOption[] | {
  data?: ProductOption[] | {
    products?: ProductOption[]
    items?: ProductOption[]
    docs?: ProductOption[]
    options?: ProductOption[]
    results?: ProductOption[]
  }
  products?: ProductOption[]
  items?: ProductOption[]
  docs?: ProductOption[]
  options?: ProductOption[]
  results?: ProductOption[]
}

const { t } = useI18n()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('auth_token')
const { hasPermission } = useAuth()

const apiBaseUrl = computed(() => String(config.public.apiBaseUrl).replace(/\/$/, ''))
const bannersEndpoint = computed(() => `${apiBaseUrl.value}/saling/banners`)
const productOptionsEndpoint = computed(() => `${apiBaseUrl.value}/master-data/products/select-options`)

const search = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const banners = ref<ApiBanner[]>([])
const productOptions = ref<ProductOption[]>([])
const isLoading = ref(false)
const isLoadingProducts = ref(false)
const isSaving = ref(false)
const isDialogVisible = ref(false)
const editingBannerId = ref<string | null>(null)
const bannerFormRef = ref<FormInstance>()
const thumbnailUrlCache = ref<Record<string, string>>({})

const form = reactive<BannerForm>({
  title: '',
  product: '',
  description: '',
  thumbnail: null,
  isActive: true
})

const isEditing = computed(() => Boolean(editingBannerId.value))
const canCreateBanner = computed(() => hasPermission('banner.create'))
const canUpdateBanner = computed(() => hasPermission('banner.update'))
const canDeleteBanner = computed(() => hasPermission('banner.delete'))
const minioBucketPathPattern = /\/order-management\/(.+?)(?:\?.*)?$/

const rules: FormRules<BannerForm> = {
  title: [
    { required: true, message: () => t('banners.validation.titleRequired'), trigger: 'blur' }
  ],
  product: [
    { required: true, message: () => t('banners.validation.productRequired'), trigger: 'change' }
  ],
  thumbnail: [
    { required: true, message: () => t('banners.validation.thumbnailRequired'), trigger: 'blur' }
  ]
}

const requestHeaders = computed(() => ({
  ...(authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {})
}))

const getBannerId = (banner: ApiBanner) => banner._id || banner.id || ''
const getProductId = (product?: string | ProductOption) => typeof product === 'string' ? product : product?._id || product?.id || ''

const getProductOptionLabel = (product: ProductOption) => {
  const name = product.nameEn || product.nameKh || product._id
  return product.code ? `${product.code} - ${name}` : name
}

const getProductLabel = (product?: string | ProductOption) => {
  const productId = getProductId(product)

  if (typeof product === 'object' && product) {
    return getProductOptionLabel({ ...product, _id: productId })
  }

  const option = productOptions.value.find((item) => item._id === productId || item.id === productId)
  return option ? getProductOptionLabel(option) : productId || '-'
}

const extractBanners = (response: BannerResponse): ApiBanner[] => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data?.banners)) return response.data.banners
  if (Array.isArray(response.data?.items)) return response.data.items
  if (Array.isArray(response.data?.docs)) return response.data.docs
  if (Array.isArray(response.banners)) return response.banners
  if (Array.isArray(response.items)) return response.items
  if (Array.isArray(response.docs)) return response.docs
  return []
}

const extractProductOptions = (response: ProductOptionsResponse): ProductOption[] => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data?.products)) return response.data.products
  if (Array.isArray(response.data?.items)) return response.data.items
  if (Array.isArray(response.data?.docs)) return response.data.docs
  if (Array.isArray(response.data?.options)) return response.data.options
  if (Array.isArray(response.data?.results)) return response.data.results
  if (Array.isArray(response.products)) return response.products
  if (Array.isArray(response.items)) return response.items
  if (Array.isArray(response.docs)) return response.docs
  if (Array.isArray(response.options)) return response.options
  if (Array.isArray(response.results)) return response.results
  return []
}

const ensureSelectedProductOption = (product?: string | ProductOption) => {
  if (!product || typeof product === 'string') return

  const productId = getProductId(product)
  if (!productOptions.value.some((item) => item._id === productId || item.id === productId)) {
    productOptions.value = [...productOptions.value, { ...product, _id: productId }]
  }
}

const getTotalItems = (response: BannerResponse, items: ApiBanner[]) => {
  if (Array.isArray(response)) return items.length
  return response.pagination?.total ?? items.length
}

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string; error?: string } }).data
    return data?.message || data?.error || t('common.errors.generic')
  }

  return t('common.errors.generic')
}

const buildQuery = () => ({
  page: currentPage.value,
  limit: pageSize.value,
  ...(search.value.trim() ? { search: search.value.trim() } : {})
})

const normalizeThumbnailValue = (value?: BannerThumbnail): BannerThumbnail | '' => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (value.data) return normalizeThumbnailValue(value.data)

  return value
}

const getThumbnailObjectName = (thumbnail?: BannerThumbnail) => {
  if (!thumbnail) return ''

  if (typeof thumbnail !== 'string') {
    if (thumbnail.data) return getThumbnailObjectName(thumbnail.data)

    return thumbnail.objectName
      || thumbnail.publicId
      || thumbnail.public_id
      || thumbnail.fileName
      || thumbnail.filename
      || (thumbnail.url?.match(minioBucketPathPattern)?.[1]
        ? decodeURIComponent(thumbnail.url.match(minioBucketPathPattern)?.[1] || '')
        : '')
  }

  if (thumbnail.startsWith('uploads/')) return ''

  const objectNameFromUrl = thumbnail.match(minioBucketPathPattern)?.[1]
  if (objectNameFromUrl) return decodeURIComponent(objectNameFromUrl)
  if (/^https?:\/\//.test(thumbnail)) return ''

  return thumbnail
}

const normalizeThumbnailForPayload = (value?: BannerThumbnail): string => {
  const thumbnail = normalizeThumbnailValue(value)
  if (!thumbnail) return ''
  if (typeof thumbnail === 'string') return thumbnail.trim()

  return getThumbnailObjectName(thumbnail)
}

const thumbnailUploadValue = computed<BannerThumbnail>({
  get: () => form.thumbnail,
  set: (value) => {
    form.thumbnail = normalizeThumbnailValue(value) || null
    bannerFormRef.value?.validateField('thumbnail').catch(() => undefined)
  }
})

const getThumbnailUrl = (thumbnail?: BannerThumbnail) => {
  if (!thumbnail) return ''

  if (typeof thumbnail !== 'string') {
    if (getThumbnailObjectName(thumbnail)) return ''
    return thumbnail.secureUrl || thumbnail.secure_url || thumbnail.url || thumbnail.path || ''
  }

  if (/^https?:\/\//.test(thumbnail)) return thumbnail
  if (!thumbnail.startsWith('uploads/')) return ''
  return `${apiBaseUrl.value.replace(/\/api\/v\d+$/, '')}/${thumbnail.replace(/^\//, '')}`
}

const getBannerThumbnailUrl = (thumbnail?: BannerThumbnail) => {
  const objectName = getThumbnailObjectName(thumbnail)
  return (objectName ? thumbnailUrlCache.value[objectName] : '') || getThumbnailUrl(thumbnail)
}

const loadThumbnailUrl = async (thumbnail?: BannerThumbnail) => {
  const objectName = getThumbnailObjectName(thumbnail)
  if (!objectName || thumbnailUrlCache.value[objectName]) return

  try {
    const response = await $fetch<{ data?: { url?: string }; url?: string }>('minio/presigned-get', {
      baseURL: `${apiBaseUrl.value}/`,
      method: 'POST',
      headers: requestHeaders.value,
      body: { objectName, expiresInSeconds: 3600 }
    })
    const url = response.data?.url || response.url
    if (url) thumbnailUrlCache.value = { ...thumbnailUrlCache.value, [objectName]: url }
  } catch (error) {
    console.error(error)
  }
}

const refreshProductOptions = async () => {
  isLoadingProducts.value = true

  try {
    const response = await $fetch<ProductOptionsResponse>(productOptionsEndpoint.value, {
      headers: requestHeaders.value
    })

    productOptions.value = extractProductOptions(response).map((product) => ({
      ...product,
      _id: product._id || product.id || ''
    })).filter((product) => product._id)
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isLoadingProducts.value = false
  }
}

const refreshBanners = async () => {
  isLoading.value = true

  try {
    const response = await $fetch<BannerResponse>(bannersEndpoint.value, {
      headers: requestHeaders.value,
      query: buildQuery()
    })

    const items = extractBanners(response)
    banners.value = items.map((banner) => ({
      ...banner,
      isActive: banner.isActive ?? true
    }))
    banners.value.forEach((banner) => loadThumbnailUrl(banner.thumbnail))
    totalItems.value = getTotalItems(response, items)
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  editingBannerId.value = null
  Object.assign(form, {
    title: '',
    product: '',
    description: '',
    thumbnail: null,
    isActive: true
  })
  bannerFormRef.value?.clearValidate()
}

const openCreateDialog = () => {
  if (!canCreateBanner.value) return

  resetForm()
  isDialogVisible.value = true
}

const openEditDialog = (banner: ApiBanner) => {
  if (!canUpdateBanner.value) return

  editingBannerId.value = getBannerId(banner)
  Object.assign(form, {
    title: banner.title || '',
    product: getProductId(banner.product),
    description: banner.description || '',
    thumbnail: normalizeThumbnailValue(banner.thumbnail) || null,
    isActive: banner.isActive ?? true
  })
  ensureSelectedProductOption(banner.product)
  isDialogVisible.value = true
}

const buildPayload = (): BannerPayload => {
  const payload: BannerPayload = {
    title: form.title.trim(),
    product: form.product,
    thumbnail: normalizeThumbnailForPayload(form.thumbnail),
    isActive: form.isActive
  }

  const description = form.description.trim()
  if (description) payload.description = description

  return payload
}

const submitBanner = async () => {
  if (!bannerFormRef.value) return
  if (isEditing.value && !canUpdateBanner.value) return
  if (!isEditing.value && !canCreateBanner.value) return

  const isValid = await bannerFormRef.value.validate().catch(() => false)
  if (!isValid) return

  isSaving.value = true

  try {
    const url = isEditing.value ? `${bannersEndpoint.value}/${editingBannerId.value}` : bannersEndpoint.value
    const method = isEditing.value ? 'PUT' : 'POST'

    await $fetch(url, {
      method,
      headers: requestHeaders.value,
      body: buildPayload()
    })

    ElMessage.success(isEditing.value ? t('banners.messages.updated') : t('banners.messages.created'))
    isDialogVisible.value = false
    await refreshBanners()
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isSaving.value = false
  }
}

const deleteBanner = async (banner: ApiBanner) => {
  if (!canDeleteBanner.value) return

  const bannerId = getBannerId(banner)
  if (!bannerId) {
    ElMessage.error(t('banners.messages.missingId'))
    return
  }

  try {
    await ElMessageBox.confirm(
      t('banners.confirmDelete.message', { title: banner.title }),
      t('banners.confirmDelete.title'),
      {
        confirmButtonText: t('banners.actions.delete'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await $fetch(`${bannersEndpoint.value}/${bannerId}`, {
      method: 'DELETE',
      headers: requestHeaders.value
    })

    ElMessage.success(t('banners.messages.deleted'))
    await refreshBanners()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(getErrorMessage(error))
    }
  }
}

watch([currentPage, pageSize], () => {
  refreshBanners()
})

watch(search, () => {
  currentPage.value = 1
  refreshBanners()
})

onMounted(() => {
  refreshProductOptions()
  refreshBanners()
})
</script>

<style scoped>
:deep(.el-button--primary) {
  --el-button-bg-color: #059669;
  --el-button-border-color: #059669;
  --el-button-hover-bg-color: #047857;
  --el-button-hover-border-color: #047857;
}

</style>
