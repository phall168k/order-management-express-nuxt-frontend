<template>
  <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div class="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-base font-semibold">{{ t('products.title') }}</h2>
        <p class="text-sm text-slate-500">{{ t('products.description') }}</p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <el-input v-model="search" class="w-full sm:w-64" :placeholder="t('common.search')" clearable>
          <template #prefix>
            <Icon name="lucide:search" class="h-4 w-4 text-slate-400" />
          </template>
        </el-input>
        <el-button v-if="canCreateProduct" type="primary" @click="openCreateDialog">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          {{ t('products.actions.new') }}
        </el-button>
      </div>
    </div>

    <div class="p-5">
      <el-table v-loading="isLoading" :data="products" stripe class="w-full">
        <el-table-column :label="t('products.thumbnail')" width="92">
          <template #default="{ row }">
            <div class="grid h-12 w-12 place-items-center overflow-hidden rounded border border-slate-200 bg-slate-50">
              <img
                v-if="row.thumbnail"
                :alt="row.nameEn"
                class="h-full w-full object-cover"
                :src="getThumbnailUrl(row.thumbnail)"
              >
              <Icon v-else name="lucide:image" class="h-5 w-5 text-slate-400" />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="code" :label="t('products.code')" min-width="130" />
        <el-table-column prop="nameEn" :label="t('products.nameEn')" min-width="180" />
        <el-table-column prop="nameKh" :label="t('products.nameKh')" min-width="180" />
        <el-table-column :label="t('products.category')" min-width="180">
          <template #default="{ row }">
            {{ getCategoryLabel(row.category) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('products.unitPrice')" min-width="130">
          <template #default="{ row }">
            {{ formatPrice(row.unitPrice) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" :label="t('common.description')" min-width="240" show-overflow-tooltip />
        <el-table-column v-if="canUpdateProduct || canDeleteProduct" fixed="right" :label="t('common.actions')" width="130">
          <template #default="{ row }">
            <div class="flex items-center gap-1">
              <el-tooltip v-if="canUpdateProduct" :content="t('products.actions.edit')" placement="top">
                <el-button circle text @click="openEditDialog(row)">
                  <Icon name="lucide:pencil" class="h-4 w-4" />
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="canDeleteProduct" :content="t('products.actions.delete')" placement="top">
                <el-button circle text type="danger" @click="deleteProduct(row)">
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
      :title="isEditing ? t('products.dialog.editTitle') : t('products.dialog.createTitle')"
      width="760px"
      destroy-on-close
      draggable
    >
      <el-form
        ref="productFormRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="submitProduct"
      >
        <el-form-item :label="t('products.code')" prop="code">
          <el-input v-model="form.code" :placeholder="t('products.placeholders.code')" />
        </el-form-item>

        <el-form-item :label="t('products.category')" prop="category">
          <el-select
            v-model="form.category"
            class="w-full"
            filterable
            :loading="isLoadingCategories"
            :placeholder="t('products.placeholders.category')"
          >
            <el-option
              v-for="category in categoryOptions"
              :key="category._id"
              :label="getCategoryOptionLabel(category)"
              :value="category._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('products.nameEn')" prop="nameEn">
          <el-input v-model="form.nameEn" :placeholder="t('products.placeholders.nameEn')" />
        </el-form-item>
        <el-form-item :label="t('products.nameKh')" prop="nameKh">
          <el-input v-model="form.nameKh" :placeholder="t('products.placeholders.nameKh')" />
        </el-form-item>
        <el-form-item :label="t('products.unitPrice')" prop="unitPrice">
          <el-input-number
            v-model="form.unitPrice"
            :min="0"
            :precision="2"
            :step="0.5"
            class="!w-full"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item :label="t('products.thumbnail')" prop="thumbnail">
          <el-input v-model="form.thumbnail" :placeholder="t('products.placeholders.thumbnail')" />
        </el-form-item>

        <el-form-item :label="t('common.description')" prop="description">
          <el-input
            v-model="form.description"
            :placeholder="t('products.placeholders.description')"
            :rows="3"
            type="textarea"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="isDialogVisible = false">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="isSaving" @click="submitProduct">
            {{ isEditing ? t('products.actions.save') : t('products.actions.create') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </section>
</template>

<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  permission: 'product.read'
})

type ApiProduct = {
  _id?: string
  id?: string
  code: string
  nameEn: string
  nameKh: string
  category?: string | CategoryOption
  unitPrice: number
  description?: string
  thumbnail?: string
}

type CategoryOption = {
  _id: string
  code?: string
  nameEn: string
  nameKh?: string
}

type ProductForm = {
  code: string
  nameEn: string
  nameKh: string
  category: string
  unitPrice: number
  description: string
  thumbnail: string
}

type CategoryResponse = CategoryOption[] | {
  data?: CategoryOption[] | { categories?: CategoryOption[]; items?: CategoryOption[]; docs?: CategoryOption[] }
  categories?: CategoryOption[]
  items?: CategoryOption[]
  docs?: CategoryOption[]
}

type PaginatedResponse = {
  data?: ApiProduct[] | { products?: ApiProduct[]; items?: ApiProduct[]; docs?: ApiProduct[] }
  products?: ApiProduct[]
  items?: ApiProduct[]
  docs?: ApiProduct[]
  pagination?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
  message?: string
}

type ProductResponse = ApiProduct[] | PaginatedResponse

const { t } = useI18n()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('auth_token')
const { hasPermission } = useAuth()

const apiBaseUrl = computed(() => String(config.public.apiBaseUrl).replace(/\/$/, ''))
const productsEndpoint = computed(() => `${apiBaseUrl.value}/master-data/products`)
const categoriesEndpoint = computed(() => `${apiBaseUrl.value}/master-data/categories`)

const search = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const products = ref<ApiProduct[]>([])
const categoryOptions = ref<CategoryOption[]>([])
const isLoading = ref(false)
const isLoadingCategories = ref(false)
const isSaving = ref(false)
const isDialogVisible = ref(false)
const editingProductId = ref<string | null>(null)
const productFormRef = ref<FormInstance>()

const form = reactive<ProductForm>({
  code: '',
  nameEn: '',
  nameKh: '',
  category: '',
  unitPrice: 0,
  description: '',
  thumbnail: ''
})

const isEditing = computed(() => Boolean(editingProductId.value))
const canCreateProduct = computed(() => hasPermission('product.create'))
const canUpdateProduct = computed(() => hasPermission('product.update'))
const canDeleteProduct = computed(() => hasPermission('product.delete'))

const rules: FormRules<ProductForm> = {
  code: [
    { required: true, message: () => t('products.validation.codeRequired'), trigger: 'blur' }
  ],
  nameEn: [
    { required: true, message: () => t('products.validation.nameEnRequired'), trigger: 'blur' }
  ],
  nameKh: [
    { required: true, message: () => t('products.validation.nameKhRequired'), trigger: 'blur' }
  ],
  category: [
    { required: true, message: () => t('products.validation.categoryRequired'), trigger: 'change' }
  ],
  unitPrice: [
    { required: true, message: () => t('products.validation.unitPriceRequired'), trigger: 'blur' },
    { type: 'number', min: 0, message: () => t('products.validation.unitPriceMin'), trigger: 'change' }
  ]
}

const requestHeaders = computed(() => ({
  ...(authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {})
}))

const getProductId = (product: ApiProduct) => product._id || product.id || ''
const getCategoryId = (category?: string | CategoryOption) => {
  return typeof category === 'string' ? category : category?._id || ''
}

const getCategoryOptionLabel = (category: CategoryOption) => {
  return category.code ? `${category.code} - ${category.nameEn}` : category.nameEn
}

const getCategoryLabel = (category?: string | CategoryOption) => {
  const categoryId = getCategoryId(category)

  if (typeof category === 'object' && category?.nameEn) {
    return getCategoryOptionLabel(category)
  }

  return categoryOptions.value.find((item) => item._id === categoryId)?.nameEn || categoryId || '-'
}

const extractProducts = (response: ProductResponse): ApiProduct[] => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data?.products)) return response.data.products
  if (Array.isArray(response.data?.items)) return response.data.items
  if (Array.isArray(response.data?.docs)) return response.data.docs
  if (Array.isArray(response.products)) return response.products
  if (Array.isArray(response.items)) return response.items
  if (Array.isArray(response.docs)) return response.docs
  return []
}

const extractCategories = (response: CategoryResponse): CategoryOption[] => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data?.categories)) return response.data.categories
  if (Array.isArray(response.data?.items)) return response.data.items
  if (Array.isArray(response.data?.docs)) return response.data.docs
  if (Array.isArray(response.categories)) return response.categories
  if (Array.isArray(response.items)) return response.items
  if (Array.isArray(response.docs)) return response.docs
  return []
}

const ensureSelectedCategoryOption = (category?: string | CategoryOption) => {
  if (!category || typeof category === 'string') return

  const categoryId = getCategoryId(category)
  const hasCategory = categoryOptions.value.some((item) => item._id === categoryId)
  if (!hasCategory) {
    categoryOptions.value = [...categoryOptions.value, category]
  }
}

const getTotalItems = (response: ProductResponse, items: ApiProduct[]) => {
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

const getThumbnailUrl = (thumbnail: string) => {
  if (/^https?:\/\//.test(thumbnail)) return thumbnail
  return `${apiBaseUrl.value.replace(/\/api\/v\d+$/, '')}/${thumbnail.replace(/^\//, '')}`
}

const formatPrice = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0))
}

const refreshCategoryOptions = async () => {
  isLoadingCategories.value = true

  try {
    const response = await $fetch<CategoryResponse>(categoriesEndpoint.value, {
      headers: requestHeaders.value,
      query: {
        page: 1,
        limit: 1000
      }
    })

    categoryOptions.value = extractCategories(response)
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isLoadingCategories.value = false
  }
}

const refreshProducts = async () => {
  isLoading.value = true

  try {
    const response = await $fetch<ProductResponse>(productsEndpoint.value, {
      headers: requestHeaders.value,
      query: buildQuery()
    })

    const items = extractProducts(response)
    products.value = items.map((product) => ({
      ...product,
      unitPrice: Number(product.unitPrice || 0)
    }))
    totalItems.value = getTotalItems(response, items)
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  editingProductId.value = null
  Object.assign(form, {
    code: '',
    nameEn: '',
    nameKh: '',
    category: '',
    unitPrice: 0,
    description: '',
    thumbnail: ''
  })
  productFormRef.value?.clearValidate()
}

const openCreateDialog = () => {
  if (!canCreateProduct.value) return

  resetForm()
  isDialogVisible.value = true
}

const openEditDialog = (product: ApiProduct) => {
  if (!canUpdateProduct.value) return

  editingProductId.value = getProductId(product)
  Object.assign(form, {
    code: product.code,
    nameEn: product.nameEn,
    nameKh: product.nameKh,
    category: getCategoryId(product.category),
    unitPrice: Number(product.unitPrice || 0),
    description: product.description || '',
    thumbnail: product.thumbnail || ''
  })
  ensureSelectedCategoryOption(product.category)
  isDialogVisible.value = true
}

const buildPayload = (): ProductForm => ({
  code: form.code.trim(),
  nameEn: form.nameEn.trim(),
  nameKh: form.nameKh.trim(),
  category: form.category,
  unitPrice: Number(form.unitPrice || 0),
  description: form.description.trim(),
  thumbnail: form.thumbnail.trim()
})

const submitProduct = async () => {
  if (!productFormRef.value) return
  if (isEditing.value && !canUpdateProduct.value) return
  if (!isEditing.value && !canCreateProduct.value) return

  const isValid = await productFormRef.value.validate().catch(() => false)
  if (!isValid) return

  isSaving.value = true

  try {
    const url = isEditing.value ? `${productsEndpoint.value}/${editingProductId.value}` : productsEndpoint.value
    const method = isEditing.value ? 'PUT' : 'POST'

    await $fetch(url, {
      method,
      headers: requestHeaders.value,
      body: buildPayload()
    })

    ElMessage.success(isEditing.value ? t('products.messages.updated') : t('products.messages.created'))
    isDialogVisible.value = false
    await refreshProducts()
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isSaving.value = false
  }
}

const deleteProduct = async (product: ApiProduct) => {
  if (!canDeleteProduct.value) return

  const productId = getProductId(product)
  if (!productId) {
    ElMessage.error(t('products.messages.missingId'))
    return
  }

  try {
    await ElMessageBox.confirm(
      t('products.confirmDelete.message', { code: product.code }),
      t('products.confirmDelete.title'),
      {
        confirmButtonText: t('products.actions.delete'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await $fetch(`${productsEndpoint.value}/${productId}`, {
      method: 'DELETE',
      headers: requestHeaders.value
    })

    ElMessage.success(t('products.messages.deleted'))
    await refreshProducts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(getErrorMessage(error))
    }
  }
}

watch([currentPage, pageSize], () => {
  refreshProducts()
})

watch(search, () => {
  currentPage.value = 1
  refreshProducts()
})

onMounted(() => {
  refreshCategoryOptions()
  refreshProducts()
})
</script>

<style scoped>
:deep(.el-button--primary) {
  --el-button-bg-color: #059669;
  --el-button-border-color: #059669;
  --el-button-hover-bg-color: #047857;
  --el-button-hover-border-color: #047857;
}

:deep(.el-input-number .el-input__wrapper) {
  width: 100%;
}
</style>
