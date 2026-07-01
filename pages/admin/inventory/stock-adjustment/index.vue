<template>
  <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div class="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-base font-semibold">{{ t('stockAdjustments.title') }}</h2>
        <p class="text-sm text-slate-500">{{ t('stockAdjustments.description') }}</p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <el-input v-model="search" class="w-full sm:w-64" :placeholder="t('common.search')" clearable>
          <template #prefix>
            <Icon name="lucide:search" class="h-4 w-4 text-slate-400" />
          </template>
        </el-input>
        <el-button v-if="canCreateStockAdjustment" type="primary" @click="openCreateDialog">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          {{ t('stockAdjustments.actions.new') }}
        </el-button>
      </div>
    </div>

    <div class="p-5">
      <el-table v-loading="isLoading" :data="stockAdjustments" stripe class="w-full">
        <el-table-column :label="t('stockAdjustments.code')" min-width="150">
          <template #default="{ row }">
            {{ getStockAdjustmentCode(row) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('stockAdjustments.stockAdjustmentDate')" min-width="150">
          <template #default="{ row }">
            {{ formatDate(row.stockAdjustmentDate) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('stockAdjustments.product')" min-width="240">
          <template #default="{ row }">
            {{ getStockAdjustmentProductLabel(row) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('stockAdjustments.quantity')" min-width="120" align="right">
          <template #default="{ row }">
            {{ formatNumber(getStockAdjustmentQuantity(row)) }}
          </template>
        </el-table-column>
        <el-table-column prop="note" :label="t('stockAdjustments.note')" min-width="240" show-overflow-tooltip />
        <el-table-column :label="t('common.createdBy')" min-width="160">
          <template #default="{ row }">
            {{ row.createdByUser?.username || row.createdByUser?.email || '-' }}
          </template>
        </el-table-column>
        <el-table-column v-if="canUpdateStockAdjustment || canDeleteStockAdjustment" fixed="right" :label="t('common.actions')" width="130">
          <template #default="{ row }">
            <div class="flex items-center gap-1">
              <el-tooltip v-if="canUpdateStockAdjustment" :content="t('stockAdjustments.actions.edit')" placement="top">
                <el-button circle text @click="openEditDialog(row)">
                  <Icon name="lucide:pencil" class="h-4 w-4" />
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="canDeleteStockAdjustment" :content="t('stockAdjustments.actions.delete')" placement="top">
                <el-button circle text type="danger" @click="deleteStockAdjustment(row)">
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
      :title="isEditing ? t('stockAdjustments.dialog.editTitle') : t('stockAdjustments.dialog.createTitle')"
      fullscreen
      destroy-on-close
      draggable
    >
      <el-form
        ref="stockAdjustmentFormRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="submitStockAdjustment"
      >
        <el-form-item v-if="isEditing" :label="t('stockAdjustments.code')" prop="code">
          <el-input
            v-model="form.code"
            :placeholder="t('stockAdjustments.code')"
            readonly
          />
        </el-form-item>
        <el-form-item :label="t('stockAdjustments.stockAdjustmentDate')" prop="stockAdjustmentDate" :rules="stockAdjustmentDateRules">
          <el-date-picker
            v-model="form.stockAdjustmentDate"
            class="!w-full"
            format="YYYY-MM-DD"
            type="date"
            value-format="YYYY-MM-DD"
            :placeholder="t('stockAdjustments.placeholders.stockAdjustmentDate')"
          />
        </el-form-item>
        <el-tabs
          type="border-card"
        >
          <el-tab-pane
            :label="$t('stockAdjustments.items')"
          >
            <div class="flex items-center justify-end my-2">
              <el-button v-if="!isEditing" @click="addItem">
                <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
                {{ t('stockAdjustments.actions.addItem') }}
              </el-button>
            </div>
            <el-table :data="form.items" border class="stock-adjustment-items-table w-full">
              <el-table-column type="index" :label="t('stockAdjustments.no')" width="64" align="center" />
              <el-table-column :label="t('stockAdjustments.product')" min-width="260">
                <template #default="{ row, $index }">
                  <el-form-item
                    class="mb-0"
                    :prop="`items.${$index}.product`"
                    :rules="getProductRules($index)"
                  >
                    <el-select
                      v-model="row.product"
                      class="w-full"
                      filterable
                      :loading="isLoadingProducts"
                      :placeholder="t('stockAdjustments.placeholders.product')"
                    >
                      <el-option
                        v-for="product in selectableProductOptions"
                        :key="product._id"
                        :disabled="isProductSelectedInAnotherRow(product._id, $index)"
                        :label="getProductOptionLabel(product)"
                        :value="product._id"
                      />
                    </el-select>
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column :label="t('stockAdjustments.quantity')" min-width="160">
                <template #default="{ row, $index }">
                  <el-form-item
                    class="mb-0"
                    :prop="`items.${$index}.quantity`"
                    :rules="quantityRules"
                  >
                    <el-input-number v-model="row.quantity" :min="1" :step="1" class="!w-full" controls-position="right" />
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column :label="t('stockAdjustments.note')" min-width="260">
                <template #default="{ row, $index }">
                  <el-form-item class="mb-0" :prop="`items.${$index}.note`">
                    <el-input
                      v-model="row.note"
                      :placeholder="t('stockAdjustments.placeholders.note')"
                    />
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column :label="t('common.actions')" width="96" align="center">
                <template #default="{ $index }">
                  <el-tooltip v-if="form.items.length > 1" :content="t('stockAdjustments.actions.removeItem')" placement="top">
                    <el-button circle text type="danger" @click="removeItem($index)">
                      <Icon name="lucide:trash-2" class="h-4 w-4" />
                    </el-button>
                  </el-tooltip>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="isDialogVisible = false">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="isSaving" @click="submitStockAdjustment">
            {{ isEditing ? t('stockAdjustments.actions.save') : t('stockAdjustments.actions.create') }}
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
  permission: 'stock-adjustment.read'
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

type ApiStockAdjustment = {
  _id?: string
  id?: string
  code?: string
  stockAdjustmentDate: string
  product?: string | ProductOption
  quantity: number
  note?: string
  items?: ApiStockAdjustmentItem[]
  createdByUser?: CreatedByUser
}

type ApiStockAdjustmentItem = {
  _id?: string
  id?: string
  stockAdjustmentDate?: string
  product?: string | ProductOption
  quantity?: number | string
  note?: string
}

type StockAdjustmentForm = {
  key: number
  _id?: string
  id?: string
  product: string
  quantity: number
  note: string
}

type StockAdjustmentFormModel = {
  code: string
  stockAdjustmentDate: string
  items: StockAdjustmentForm[]
}

type StockAdjustmentPayloadItem = {
  _id?: string
  id?: string
  stockAdjustmentDate: string
  product: string
  quantity: number
  note?: string
}

type StockAdjustmentPayload = StockAdjustmentPayloadItem[]

type StockAdjustmentUpdatePayload = StockAdjustmentPayload | StockAdjustmentPayloadItem

type ProductResponse = ProductOption[] | {
  data?: ProductOption[] | { products?: ProductOption[]; items?: ProductOption[]; docs?: ProductOption[] }
  products?: ProductOption[]
  items?: ProductOption[]
  docs?: ProductOption[]
}

type PaginatedResponse = {
  data?: ApiStockAdjustment[] | { stockAdjustments?: ApiStockAdjustment[]; stockAdjustment?: ApiStockAdjustment[]; items?: ApiStockAdjustment[]; docs?: ApiStockAdjustment[] }
  stockAdjustments?: ApiStockAdjustment[]
  stockAdjustment?: ApiStockAdjustment[]
  items?: ApiStockAdjustment[]
  docs?: ApiStockAdjustment[]
  pagination?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
  message?: string
}

type StockAdjustmentResponse = ApiStockAdjustment[] | PaginatedResponse

const { t } = useI18n()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('auth_token')
const { hasPermission } = useAuth()

const apiBaseUrl = computed(() => String(config.public.apiBaseUrl).replace(/\/$/, ''))
const stockAdjustmentsEndpoint = computed(() => `${apiBaseUrl.value}/inventory/stock-adjustments`)
const productsEndpoint = computed(() => `${apiBaseUrl.value}/master-data/products`)

const search = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const stockAdjustments = ref<ApiStockAdjustment[]>([])
const productOptions = ref<ProductOption[]>([])
const isLoading = ref(false)
const isLoadingProducts = ref(false)
const isSaving = ref(false)
const isDialogVisible = ref(false)
const editingStockAdjustmentId = ref<string | null>(null)
const editingStockAdjustment = ref<ApiStockAdjustment | null>(null)
const stockAdjustmentFormRef = ref<FormInstance>()

const getToday = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const createItem = (item?: Partial<StockAdjustmentForm>): StockAdjustmentForm => ({
  key: Date.now() + Math.random(),
  _id: item?._id,
  id: item?.id,
  product: item?.product || '',
  quantity: Number(item?.quantity || 1),
  note: item?.note || ''
})

const form = reactive<StockAdjustmentFormModel>({
  code: '',
  stockAdjustmentDate: getToday(),
  items: [createItem()]
})

const stockAdjustmentDateRules = [
  { required: true, message: () => t('stockAdjustments.validation.stockAdjustmentDateRequired'), trigger: 'change' }
]

const quantityRules = [
  { required: true, message: () => t('stockAdjustments.validation.quantityRequired'), trigger: 'blur' },
  { type: 'number' as const, min: 1, message: () => t('stockAdjustments.validation.quantityMin'), trigger: 'change' }
]

const isProductSelectedInAnotherRow = (productId: string, currentIndex: number) => {
  return form.items.some((item, index) => index !== currentIndex && item.product === productId)
}

const validateUniqueProduct = (rowIndex: number) => {
  return (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (!value) {
      callback()
      return
    }

    if (isProductSelectedInAnotherRow(value, rowIndex)) {
      callback(new Error(t('stockAdjustments.validation.productDuplicate')))
      return
    }

    callback()
  }
}

const getProductRules = (rowIndex: number) => [
  { required: true, message: () => t('stockAdjustments.validation.productRequired'), trigger: 'change' },
  { validator: validateUniqueProduct(rowIndex), trigger: 'change' }
]

const isEditing = computed(() => Boolean(editingStockAdjustmentId.value))
const canCreateStockAdjustment = computed(() => hasPermission('stock-adjustment.create'))
const canUpdateStockAdjustment = computed(() => hasPermission('stock-adjustment.update'))
const canDeleteStockAdjustment = computed(() => hasPermission('stock-adjustment.delete'))
const selectableProductOptions = computed(() => {
  if (isEditing.value) return productOptions.value
  return productOptions.value.filter(hasProductStock)
})

const rules: FormRules<StockAdjustmentFormModel> = {}

const requestHeaders = computed(() => ({
  ...(authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {})
}))

const getStockAdjustmentId = (stockAdjustment: ApiStockAdjustment) => stockAdjustment._id || stockAdjustment.id || ''

const getProductId = (product?: string | ProductOption) => {
  return typeof product === 'string' ? product : product?._id || product?.id || ''
}

const getProductOptionLabel = (product: ProductOption) => {
  return product.code ? `${product.code} - ${product.nameEn}` : product.nameEn
}

const getProductCode = (product?: string | ProductOption) => {
  const productId = getProductId(product)

  if (typeof product === 'object' && product?.code) return product.code

  return productOptions.value.find((item) => item._id === productId || item.id === productId)?.code || ''
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

const getStockAdjustmentItems = (stockAdjustment: ApiStockAdjustment) => {
  return Array.isArray(stockAdjustment.items) && stockAdjustment.items.length ? stockAdjustment.items : []
}

const getStockAdjustmentQuantity = (stockAdjustment: ApiStockAdjustment) => {
  const items = getStockAdjustmentItems(stockAdjustment)
  if (!items.length) return Number(stockAdjustment.quantity || 0)

  return items.reduce((total, item) => total + Number(item.quantity || 0), 0)
}

const getStockAdjustmentProductLabel = (stockAdjustment: ApiStockAdjustment) => {
  const items = getStockAdjustmentItems(stockAdjustment)
  if (!items.length) return getProductLabel(stockAdjustment.product)
  if (items.length === 1) return getProductLabel(items[0]?.product)

  return t('stockAdjustments.itemCount', { count: items.length })
}

const getStockAdjustmentCode = (stockAdjustment: ApiStockAdjustment) => {
  if (stockAdjustment.code) return stockAdjustment.code

  const items = getStockAdjustmentItems(stockAdjustment)
  if (!items.length) return getProductCode(stockAdjustment.product) || '-'
  if (items.length === 1) return getProductCode(items[0]?.product) || '-'

  return '-'
}

const extractStockAdjustments = (response: StockAdjustmentResponse): ApiStockAdjustment[] => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data?.stockAdjustments)) return response.data.stockAdjustments
  if (Array.isArray(response.data?.stockAdjustment)) return response.data.stockAdjustment
  if (Array.isArray(response.data?.items)) return response.data.items
  if (Array.isArray(response.data?.docs)) return response.data.docs
  if (Array.isArray(response.stockAdjustments)) return response.stockAdjustments
  if (Array.isArray(response.stockAdjustment)) return response.stockAdjustment
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

const getTotalItems = (response: StockAdjustmentResponse, items: ApiStockAdjustment[]) => {
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

const formatDate = (value?: string) => {
  if (!value) return '-'
  return value.slice(0, 10)
}

const normalizeStockAdjustment = (stockAdjustment: ApiStockAdjustment): ApiStockAdjustment => ({
  ...stockAdjustment,
  stockAdjustmentDate: formatDate(stockAdjustment.stockAdjustmentDate),
  quantity: getStockAdjustmentQuantity(stockAdjustment)
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

const refreshStockAdjustments = async () => {
  isLoading.value = true

  try {
    const response = await $fetch<StockAdjustmentResponse>(stockAdjustmentsEndpoint.value, {
      headers: requestHeaders.value,
      query: buildQuery()
    })

    const items = extractStockAdjustments(response)
    stockAdjustments.value = items.map(normalizeStockAdjustment)
    totalItems.value = getTotalItems(response, items)
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isLoading.value = false
  }
}

const addItem = () => {
  form.items.push(createItem())
  nextTick(() => {
    stockAdjustmentFormRef.value?.clearValidate()
  })
}

const removeItem = (index: number) => {
  if (form.items.length <= 1) return

  form.items.splice(index, 1)
  nextTick(() => {
    stockAdjustmentFormRef.value?.clearValidate()
  })
}

const resetForm = () => {
  editingStockAdjustmentId.value = null
  editingStockAdjustment.value = null
  form.code = ''
  form.stockAdjustmentDate = getToday()
  form.items = [createItem()]
  stockAdjustmentFormRef.value?.clearValidate()
}

const openCreateDialog = () => {
  if (!canCreateStockAdjustment.value) return

  resetForm()
  isDialogVisible.value = true
}

const openEditDialog = (stockAdjustment: ApiStockAdjustment) => {
  if (!canUpdateStockAdjustment.value) return

  editingStockAdjustmentId.value = getStockAdjustmentId(stockAdjustment)
  editingStockAdjustment.value = stockAdjustment
  form.code = getStockAdjustmentCode(stockAdjustment)
  form.stockAdjustmentDate = formatDate(stockAdjustment.stockAdjustmentDate)
  const items = getStockAdjustmentItems(stockAdjustment)
  form.items = items.length
    ? items.map((item) => createItem({
        _id: item._id,
        id: item.id,
        product: getProductId(item.product),
        quantity: Number(item.quantity || 1),
        note: item.note || ''
      }))
    : [createItem({
        product: getProductId(stockAdjustment.product),
        quantity: Number(stockAdjustment.quantity || 1),
        note: stockAdjustment.note || ''
      })]
  items.forEach((item) => ensureSelectedProductOption(item.product))
  ensureSelectedProductOption(stockAdjustment.product)
  isDialogVisible.value = true
}

const buildItemPayload = (item: StockAdjustmentForm): StockAdjustmentPayloadItem => {
  const payload: StockAdjustmentPayloadItem = {
    stockAdjustmentDate: form.stockAdjustmentDate,
    product: item.product,
    quantity: Number(item.quantity || 0)
  }

  if (item._id) payload._id = item._id
  if (item.id) payload.id = item.id

  const note = item.note.trim()
  if (note) payload.note = note

  return payload
}

const buildPayload = (): StockAdjustmentPayload => form.items.map(buildItemPayload)

const buildUpdatePayload = (): StockAdjustmentUpdatePayload => {
  if (form.items.length === 1) return buildItemPayload(form.items[0])
  return buildPayload()
}

const submitStockAdjustment = async () => {
  if (!stockAdjustmentFormRef.value) return
  if (isEditing.value && !canUpdateStockAdjustment.value) return
  if (!isEditing.value && !canCreateStockAdjustment.value) return

  const isValid = await stockAdjustmentFormRef.value.validate().catch(() => false)
  if (!isValid) return

  isSaving.value = true

  try {
    const url = isEditing.value ? `${stockAdjustmentsEndpoint.value}/${editingStockAdjustmentId.value}` : stockAdjustmentsEndpoint.value
    const method = isEditing.value ? 'PUT' : 'POST'

    await $fetch(url, {
      method,
      headers: requestHeaders.value,
      body: isEditing.value ? buildUpdatePayload() : buildPayload()
    })

    ElMessage.success(isEditing.value ? t('stockAdjustments.messages.updated') : t('stockAdjustments.messages.created'))
    isDialogVisible.value = false
    await Promise.all([
      refreshProductOptions(),
      refreshStockAdjustments()
    ])
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isSaving.value = false
  }
}

const deleteStockAdjustment = async (stockAdjustment: ApiStockAdjustment) => {
  if (!canDeleteStockAdjustment.value) return

  const stockAdjustmentId = getStockAdjustmentId(stockAdjustment)
  if (!stockAdjustmentId) {
    ElMessage.error(t('stockAdjustments.messages.missingId'))
    return
  }

  try {
    await ElMessageBox.confirm(
      t('stockAdjustments.confirmDelete.message', { product: getStockAdjustmentProductLabel(stockAdjustment) }),
      t('stockAdjustments.confirmDelete.title'),
      {
        confirmButtonText: t('stockAdjustments.actions.delete'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await $fetch(`${stockAdjustmentsEndpoint.value}/${stockAdjustmentId}`, {
      method: 'DELETE',
      headers: requestHeaders.value
    })

    ElMessage.success(t('stockAdjustments.messages.deleted'))
    await Promise.all([
      refreshProductOptions(),
      refreshStockAdjustments()
    ])
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(getErrorMessage(error))
    }
  }
}

watch([currentPage, pageSize], () => {
  refreshStockAdjustments()
})

watch(search, () => {
  currentPage.value = 1
  refreshStockAdjustments()
})

watch(productOptions, () => {
  if (isEditing.value && editingStockAdjustment.value) {
    form.code = getStockAdjustmentCode(editingStockAdjustment.value)
  }
})

onMounted(() => {
  refreshProductOptions()
  refreshStockAdjustments()
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
