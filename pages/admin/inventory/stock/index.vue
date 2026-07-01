<template>
  <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div class="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-base font-semibold">{{ t('stocks.title') }}</h2>
        <p class="text-sm text-slate-500">{{ t('stocks.description') }}</p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <el-input v-model="search" class="w-full sm:w-64" :placeholder="t('common.search')" clearable>
          <template #prefix>
            <Icon name="lucide:search" class="h-4 w-4 text-slate-400" />
          </template>
        </el-input>
        <el-button v-if="canCreateStock" type="primary" @click="openCreateDialog">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          {{ t('stocks.actions.new') }}
        </el-button>
      </div>
    </div>

    <div class="p-5">
      <el-table v-loading="isLoading" :data="stocks" stripe class="w-full">
        <el-table-column :label="t('stocks.product')" min-width="220">
          <template #default="{ row }">
            {{ getProductLabel(row.product) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('stocks.minStock')" min-width="110" align="right">
          <template #default="{ row }">
            {{ formatNumber(row.minStock) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('stocks.stockIn')" min-width="110" align="right">
          <template #default="{ row }">
            {{ formatNumber(row.stockIn) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('stocks.stockOut')" min-width="110" align="right">
          <template #default="{ row }">
            {{ formatNumber(row.stockOut) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('stocks.stockAdjustment')" min-width="150" align="right">
          <template #default="{ row }">
            {{ formatNumber(row.stockAdjustment) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('stocks.stockOnHand')" min-width="150" align="right">
          <template #default="{ row }">
            <el-tag :type="getStockOnHand(row) <= row.minStock ? 'warning' : 'success'" effect="light">
              {{ formatNumber(getStockOnHand(row)) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('stocks.isStock')" min-width="120">
          <template #default="{ row }">
            <el-tag :type="row.isStock ? 'success' : 'info'" effect="light">
              {{ row.isStock ? t('common.yes') : t('common.no') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="note" :label="t('stocks.note')" min-width="220" show-overflow-tooltip />
        <el-table-column :label="t('common.createdBy')" min-width="160">
          <template #default="{ row }">
            {{ row.createdByUser?.username || row.createdByUser?.email || '-' }}
          </template>
        </el-table-column>
        <el-table-column v-if="canUpdateStock || canDeleteStock" fixed="right" :label="t('common.actions')" width="130">
          <template #default="{ row }">
            <div class="flex items-center gap-1">
              <el-tooltip v-if="canUpdateStock" :content="t('stocks.actions.edit')" placement="top">
                <el-button circle text @click="openEditDialog(row)">
                  <Icon name="lucide:pencil" class="h-4 w-4" />
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="canDeleteStock" :content="t('stocks.actions.delete')" placement="top">
                <el-button circle text type="danger" @click="deleteStock(row)">
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
      :title="isEditing ? t('stocks.dialog.editTitle') : t('stocks.dialog.createTitle')"
      width="760px"
      destroy-on-close
      draggable
    >
      <el-form
        ref="stockFormRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="submitStock"
      >
        <el-form-item :label="t('stocks.product')" prop="product">
          <el-select
            v-model="form.product"
            class="w-full"
            filterable
            :loading="isLoadingProducts"
            :placeholder="t('stocks.placeholders.product')"
          >
            <el-option
              v-for="product in selectableProductOptions"
              :key="product._id"
              :label="getProductOptionLabel(product)"
              :value="product._id"
            />
          </el-select>
        </el-form-item>

        <div class="grid gap-4 md:grid-cols-2">
          <el-form-item :label="t('stocks.minStock')" prop="minStock">
            <el-input-number v-model="form.minStock" :min="0" :step="1" class="!w-full" controls-position="right" />
          </el-form-item>
          <el-form-item :label="t('stocks.stockIn')" prop="stockIn">
            <el-input-number v-model="form.stockIn" :min="0" :step="1" class="!w-full" controls-position="right" />
          </el-form-item>
          <el-form-item :label="t('stocks.stockOut')" prop="stockOut">
            <el-input-number v-model="form.stockOut" :min="0" :step="1" class="!w-full" controls-position="right" />
          </el-form-item>
          <el-form-item :label="t('stocks.stockAdjustment')" prop="stockAdjustment">
            <el-input-number v-model="form.stockAdjustment" :step="1" class="!w-full" controls-position="right" />
          </el-form-item>
        </div>

        <el-form-item :label="t('stocks.isStock')" prop="isStock">
          <el-switch v-model="form.isStock" :active-text="t('common.yes')" :inactive-text="t('common.no')" />
        </el-form-item>

        <el-form-item :label="t('stocks.note')" prop="note">
          <el-input
            v-model="form.note"
            :placeholder="t('stocks.placeholders.note')"
            :rows="3"
            type="textarea"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="isDialogVisible = false">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="isSaving" @click="submitStock">
            {{ isEditing ? t('stocks.actions.save') : t('stocks.actions.create') }}
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
  permission: 'stock.read'
})

type CreatedByUser = {
  _id?: string
  email?: string
  username?: string
}

type ProductOption = {
  _id: string
  id?: string
  code?: string
  nameEn: string
  nameKh?: string
  stock?: boolean | string | { _id?: string; id?: string } | Array<string | { _id?: string; id?: string }> | null
}

type ApiStock = {
  _id?: string
  id?: string
  product?: string | ProductOption
  minStock: number
  stockIn: number
  stockOut: number
  stockAdjustment: number
  stockOnHand?: number | string
  isStock: boolean
  note?: string
  createdByUser?: CreatedByUser
}

type StockForm = {
  product: string
  minStock: number
  stockIn: number
  stockOut: number
  stockAdjustment: number
  isStock: boolean
  note: string
}

type StockPayload = Omit<StockForm, 'note'> & {
  note?: string
}

type ProductResponse = ProductOption[] | {
  data?: ProductOption[] | { products?: ProductOption[]; items?: ProductOption[]; docs?: ProductOption[] }
  products?: ProductOption[]
  items?: ProductOption[]
  docs?: ProductOption[]
}

type PaginatedResponse = {
  data?: ApiStock[] | { stocks?: ApiStock[]; stock?: ApiStock[]; items?: ApiStock[]; docs?: ApiStock[] }
  stocks?: ApiStock[]
  stock?: ApiStock[]
  items?: ApiStock[]
  docs?: ApiStock[]
  pagination?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
  message?: string
}

type StockResponse = ApiStock[] | PaginatedResponse

const { t } = useI18n()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('auth_token')
const { hasPermission } = useAuth()

const apiBaseUrl = computed(() => String(config.public.apiBaseUrl).replace(/\/$/, ''))
const stocksEndpoint = computed(() => `${apiBaseUrl.value}/inventory/stocks`)
const productsEndpoint = computed(() => `${apiBaseUrl.value}/master-data/products`)

const search = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const stocks = ref<ApiStock[]>([])
const productOptions = ref<ProductOption[]>([])
const isLoading = ref(false)
const isLoadingProducts = ref(false)
const isSaving = ref(false)
const isDialogVisible = ref(false)
const editingStockId = ref<string | null>(null)
const stockFormRef = ref<FormInstance>()

const form = reactive<StockForm>({
  product: '',
  minStock: 0,
  stockIn: 0,
  stockOut: 0,
  stockAdjustment: 0,
  isStock: true,
  note: ''
})

const isEditing = computed(() => Boolean(editingStockId.value))
const canCreateStock = computed(() => hasPermission('stock.create'))
const canUpdateStock = computed(() => hasPermission('stock.update'))
const canDeleteStock = computed(() => hasPermission('stock.delete'))
const selectableProductOptions = computed(() => {
  if (isEditing.value) return productOptions.value
  return productOptions.value.filter((product) => !hasProductStock(product))
})

const rules: FormRules<StockForm> = {
  product: [
    { required: true, message: () => t('stocks.validation.productRequired'), trigger: 'change' }
  ],
  minStock: [
    { required: true, message: () => t('stocks.validation.minStockRequired'), trigger: 'blur' },
    { type: 'number', min: 0, message: () => t('stocks.validation.minStockMin'), trigger: 'change' }
  ],
  stockIn: [
    { required: true, message: () => t('stocks.validation.stockInRequired'), trigger: 'blur' },
    { type: 'number', min: 0, message: () => t('stocks.validation.stockInMin'), trigger: 'change' }
  ],
  stockOut: [
    { required: true, message: () => t('stocks.validation.stockOutRequired'), trigger: 'blur' },
    { type: 'number', min: 0, message: () => t('stocks.validation.stockOutMin'), trigger: 'change' }
  ],
  stockAdjustment: [
    { required: true, message: () => t('stocks.validation.stockAdjustmentRequired'), trigger: 'blur' }
  ]
}

const requestHeaders = computed(() => ({
  ...(authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {})
}))

const getStockId = (stock: ApiStock) => stock._id || stock.id || ''

const getProductId = (product?: string | ProductOption) => {
  return typeof product === 'string' ? product : product?._id || product?.id || ''
}

const getProductOptionLabel = (product: ProductOption) => {
  return product.code ? `${product.code} - ${product.nameEn}` : product.nameEn
}

const hasProductStock = (product: ProductOption) => {
  if (Array.isArray(product.stock)) return product.stock.length > 0
  return Boolean(product.stock)
}

const getProductLabel = (product?: string | ProductOption) => {
  const productId = getProductId(product)

  if (typeof product === 'object' && product?.nameEn) {
    return getProductOptionLabel(product)
  }

  return productOptions.value.find((item) => item._id === productId || item.id === productId)?.nameEn || productId || '-'
}

const extractStocks = (response: StockResponse): ApiStock[] => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data?.stocks)) return response.data.stocks
  if (Array.isArray(response.data?.stock)) return response.data.stock
  if (Array.isArray(response.data?.items)) return response.data.items
  if (Array.isArray(response.data?.docs)) return response.data.docs
  if (Array.isArray(response.stocks)) return response.stocks
  if (Array.isArray(response.stock)) return response.stock
  if (Array.isArray(response.items)) return response.items
  if (Array.isArray(response.docs)) return response.docs
  return []
}

const extractProducts = (response: ProductResponse): ProductOption[] => {
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

const ensureSelectedProductOption = (product?: string | ProductOption) => {
  if (!product || typeof product === 'string') return

  const productId = getProductId(product)
  const hasProduct = productOptions.value.some((item) => item._id === productId || item.id === productId)
  if (!hasProduct) {
    productOptions.value = [...productOptions.value, { ...product, _id: productId }]
  }
}

const getTotalItems = (response: StockResponse, items: ApiStock[]) => {
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

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2
  }).format(Number(value || 0))
}

const toNumber = (value: number | string | undefined) => Number(value || 0)

const calculateStockOnHand = (stock: Pick<ApiStock, 'stockIn' | 'stockOut' | 'stockAdjustment'>) => {
  return toNumber(stock.stockIn) - toNumber(stock.stockOut) + toNumber(stock.stockAdjustment)
}

const getStockOnHand = (stock: ApiStock) => {
  return stock.stockOnHand !== undefined ? toNumber(stock.stockOnHand) : calculateStockOnHand(stock)
}

const normalizeStock = (stock: ApiStock): ApiStock => ({
  ...stock,
  minStock: Number(stock.minStock || 0),
  stockIn: Number(stock.stockIn || 0),
  stockOut: Number(stock.stockOut || 0),
  stockAdjustment: Number(stock.stockAdjustment || 0),
  stockOnHand: getStockOnHand(stock),
  isStock: stock.isStock !== false
})

const refreshProductOptions = async () => {
  isLoadingProducts.value = true

  try {
    const response = await $fetch<ProductResponse>(productsEndpoint.value, {
      headers: requestHeaders.value,
      query: {
        page: 1,
        limit: 1000
      }
    })

    productOptions.value = extractProducts(response).map((product) => ({
      ...product,
      _id: product._id || product.id || ''
    })).filter((product) => product._id)
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isLoadingProducts.value = false
  }
}

const refreshStocks = async () => {
  isLoading.value = true

  try {
    const response = await $fetch<StockResponse>(stocksEndpoint.value, {
      headers: requestHeaders.value,
      query: buildQuery()
    })

    const items = extractStocks(response)
    stocks.value = items.map(normalizeStock)
    totalItems.value = getTotalItems(response, items)
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  editingStockId.value = null
  Object.assign(form, {
    product: '',
    minStock: 0,
    stockIn: 0,
    stockOut: 0,
    stockAdjustment: 0,
    isStock: true,
    note: ''
  })
  stockFormRef.value?.clearValidate()
}

const openCreateDialog = () => {
  if (!canCreateStock.value) return

  resetForm()
  isDialogVisible.value = true
}

const openEditDialog = (stock: ApiStock) => {
  if (!canUpdateStock.value) return

  editingStockId.value = getStockId(stock)
  Object.assign(form, {
    product: getProductId(stock.product),
    minStock: Number(stock.minStock || 0),
    stockIn: Number(stock.stockIn || 0),
    stockOut: Number(stock.stockOut || 0),
    stockAdjustment: Number(stock.stockAdjustment || 0),
    isStock: stock.isStock !== false,
    note: stock.note || ''
  })
  ensureSelectedProductOption(stock.product)
  isDialogVisible.value = true
}

const buildPayload = (): StockPayload => {
  const payload: StockPayload = {
    product: form.product,
    minStock: Number(form.minStock || 0),
    stockIn: Number(form.stockIn || 0),
    stockOut: Number(form.stockOut || 0),
    stockAdjustment: Number(form.stockAdjustment || 0),
    isStock: form.isStock
  }

  const note = form.note.trim()
  if (note) payload.note = note

  return payload
}

const submitStock = async () => {
  if (!stockFormRef.value) return
  if (isEditing.value && !canUpdateStock.value) return
  if (!isEditing.value && !canCreateStock.value) return

  const isValid = await stockFormRef.value.validate().catch(() => false)
  if (!isValid) return

  isSaving.value = true

  try {
    const url = isEditing.value ? `${stocksEndpoint.value}/${editingStockId.value}` : stocksEndpoint.value
    const method = isEditing.value ? 'PUT' : 'POST'

    await $fetch(url, {
      method,
      headers: requestHeaders.value,
      body: buildPayload()
    })

    ElMessage.success(isEditing.value ? t('stocks.messages.updated') : t('stocks.messages.created'))
    isDialogVisible.value = false
    await Promise.all([
      refreshProductOptions(),
      refreshStocks()
    ])
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isSaving.value = false
  }
}

const deleteStock = async (stock: ApiStock) => {
  if (!canDeleteStock.value) return

  const stockId = getStockId(stock)
  if (!stockId) {
    ElMessage.error(t('stocks.messages.missingId'))
    return
  }

  try {
    await ElMessageBox.confirm(
      t('stocks.confirmDelete.message', { product: getProductLabel(stock.product) }),
      t('stocks.confirmDelete.title'),
      {
        confirmButtonText: t('stocks.actions.delete'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await $fetch(`${stocksEndpoint.value}/${stockId}`, {
      method: 'DELETE',
      headers: requestHeaders.value
    })

    ElMessage.success(t('stocks.messages.deleted'))
    await refreshStocks()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(getErrorMessage(error))
    }
  }
}

watch([currentPage, pageSize], () => {
  refreshStocks()
})

watch(search, () => {
  currentPage.value = 1
  refreshStocks()
})

onMounted(() => {
  refreshProductOptions()
  refreshStocks()
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
