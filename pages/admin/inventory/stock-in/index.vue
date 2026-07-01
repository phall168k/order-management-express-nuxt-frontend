<template>
  <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div class="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-base font-semibold">{{ t('stockIns.title') }}</h2>
        <p class="text-sm text-slate-500">{{ t('stockIns.description') }}</p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <el-input v-model="search" class="w-full sm:w-64" :placeholder="t('common.search')" clearable>
          <template #prefix>
            <Icon name="lucide:search" class="h-4 w-4 text-slate-400" />
          </template>
        </el-input>
        <el-button v-if="canCreateStockIn" type="primary" @click="openCreateDialog">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          {{ t('stockIns.actions.new') }}
        </el-button>
      </div>
    </div>

    <div class="p-5">
      <el-table v-loading="isLoading" :data="stockIns" stripe class="w-full">
        <el-table-column :label="t('stockIns.code')" min-width="150">
          <template #default="{ row }">
            {{ getStockInCode(row) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('stockIns.stockInDate')" min-width="150">
          <template #default="{ row }">
            {{ formatDate(row.stockInDate) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('stockIns.product')" min-width="240">
          <template #default="{ row }">
            {{ getStockInProductLabel(row) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('stockIns.quantity')" min-width="120" align="right">
          <template #default="{ row }">
            {{ formatNumber(getStockInQuantity(row)) }}
          </template>
        </el-table-column>
        <el-table-column prop="note" :label="t('stockIns.note')" min-width="240" show-overflow-tooltip />
        <el-table-column :label="t('common.createdBy')" min-width="160">
          <template #default="{ row }">
            {{ row.createdByUser?.username || row.createdByUser?.email || '-' }}
          </template>
        </el-table-column>
        <el-table-column v-if="canUpdateStockIn || canDeleteStockIn" fixed="right" :label="t('common.actions')" width="130">
          <template #default="{ row }">
            <div class="flex items-center gap-1">
              <el-tooltip v-if="canUpdateStockIn" :content="t('stockIns.actions.edit')" placement="top">
                <el-button circle text @click="openEditDialog(row)">
                  <Icon name="lucide:pencil" class="h-4 w-4" />
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="canDeleteStockIn" :content="t('stockIns.actions.delete')" placement="top">
                <el-button circle text type="danger" @click="deleteStockIn(row)">
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
      :title="isEditing ? t('stockIns.dialog.editTitle') : t('stockIns.dialog.createTitle')"
      fullscreen
      destroy-on-close
      draggable
    >
      <el-form
        ref="stockInFormRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="submitStockIn"
      >
        <el-form-item v-if="isEditing" :label="t('stockIns.code')" prop="code">
          <el-input
            v-model="form.code"
            :placeholder="t('stockIns.code')"
            readonly
          />
        </el-form-item>
        <el-form-item :label="t('stockIns.stockInDate')" prop="stockInDate" :rules="stockInDateRules">
          <el-date-picker
            v-model="form.stockInDate"
            class="!w-full"
            format="YYYY-MM-DD"
            type="date"
            value-format="YYYY-MM-DD"
            :placeholder="t('stockIns.placeholders.stockInDate')"
          />
        </el-form-item>
        <el-tabs
          type="border-card"
        >
          <el-tab-pane
            :label="$t('stockIns.items')"
          >
            <div class="flex items-center justify-end my-2">
              <el-button v-if="!isEditing" @click="addItem">
                <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
                {{ t('stockIns.actions.addItem') }}
              </el-button>
            </div>
            <el-table :data="form.items" border class="stock-in-items-table w-full">
              <el-table-column type="index" :label="t('stockIns.no')" width="64" align="center" />
              <el-table-column :label="t('stockIns.product')" min-width="260">
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
                      :placeholder="t('stockIns.placeholders.product')"
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
              <el-table-column :label="t('stockIns.quantity')" min-width="160">
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
              <el-table-column :label="t('stockIns.note')" min-width="260">
                <template #default="{ row, $index }">
                  <el-form-item class="mb-0" :prop="`items.${$index}.note`">
                    <el-input
                      v-model="row.note"
                      :placeholder="t('stockIns.placeholders.note')"
                    />
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column :label="t('common.actions')" width="96" align="center">
                <template #default="{ $index }">
                  <el-tooltip v-if="form.items.length > 1" :content="t('stockIns.actions.removeItem')" placement="top">
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
          <el-button type="primary" :loading="isSaving" @click="submitStockIn">
            {{ isEditing ? t('stockIns.actions.save') : t('stockIns.actions.create') }}
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
  permission: 'stock-in.read'
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

type ApiStockIn = {
  _id?: string
  id?: string
  code?: string
  stockInDate: string
  product?: string | ProductOption
  quantity: number
  note?: string
  items?: ApiStockInItem[]
  createdByUser?: CreatedByUser
}

type ApiStockInItem = {
  _id?: string
  id?: string
  stockInDate?: string
  product?: string | ProductOption
  quantity?: number | string
  note?: string
}

type StockInForm = {
  key: number
  _id?: string
  id?: string
  product: string
  quantity: number
  note: string
}

type StockInFormModel = {
  code: string
  stockInDate: string
  items: StockInForm[]
}

type StockInPayloadItem = {
  _id?: string
  id?: string
  stockInDate: string
  product: string
  quantity: number
  note?: string
}

type StockInPayload = {
  stockInDate: string
  items: StockInPayloadItem[]
}

type StockInUpdatePayload = StockInPayload | StockInPayloadItem

type ProductResponse = ProductOption[] | {
  data?: ProductOption[] | { products?: ProductOption[]; items?: ProductOption[]; docs?: ProductOption[] }
  products?: ProductOption[]
  items?: ProductOption[]
  docs?: ProductOption[]
}

type PaginatedResponse = {
  data?: ApiStockIn[] | { stockIns?: ApiStockIn[]; stockIn?: ApiStockIn[]; items?: ApiStockIn[]; docs?: ApiStockIn[] }
  stockIns?: ApiStockIn[]
  stockIn?: ApiStockIn[]
  items?: ApiStockIn[]
  docs?: ApiStockIn[]
  pagination?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
  message?: string
}

type StockInResponse = ApiStockIn[] | PaginatedResponse

const { t } = useI18n()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('auth_token')
const { hasPermission } = useAuth()

const apiBaseUrl = computed(() => String(config.public.apiBaseUrl).replace(/\/$/, ''))
const stockInsEndpoint = computed(() => `${apiBaseUrl.value}/inventory/stock-ins`)
const productsEndpoint = computed(() => `${apiBaseUrl.value}/master-data/products`)

const search = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const stockIns = ref<ApiStockIn[]>([])
const productOptions = ref<ProductOption[]>([])
const isLoading = ref(false)
const isLoadingProducts = ref(false)
const isSaving = ref(false)
const isDialogVisible = ref(false)
const editingStockInId = ref<string | null>(null)
const editingStockIn = ref<ApiStockIn | null>(null)
const stockInFormRef = ref<FormInstance>()

const getToday = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const createItem = (item?: Partial<StockInForm>): StockInForm => ({
  key: Date.now() + Math.random(),
  _id: item?._id,
  id: item?.id,
  product: item?.product || '',
  quantity: Number(item?.quantity || 1),
  note: item?.note || ''
})

const form = reactive<StockInFormModel>({
  code: '',
  stockInDate: getToday(),
  items: [createItem()]
})

const stockInDateRules = [
  { required: true, message: () => t('stockIns.validation.stockInDateRequired'), trigger: 'change' }
]

const quantityRules = [
  { required: true, message: () => t('stockIns.validation.quantityRequired'), trigger: 'blur' },
  { type: 'number' as const, min: 1, message: () => t('stockIns.validation.quantityMin'), trigger: 'change' }
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
      callback(new Error(t('stockIns.validation.productDuplicate')))
      return
    }

    callback()
  }
}

const getProductRules = (rowIndex: number) => [
  { required: true, message: () => t('stockIns.validation.productRequired'), trigger: 'change' },
  { validator: validateUniqueProduct(rowIndex), trigger: 'change' }
]

const isEditing = computed(() => Boolean(editingStockInId.value))
const canCreateStockIn = computed(() => hasPermission('stock-in.create'))
const canUpdateStockIn = computed(() => hasPermission('stock-in.update'))
const canDeleteStockIn = computed(() => hasPermission('stock-in.delete'))
const selectableProductOptions = computed(() => {
  if (isEditing.value) return productOptions.value
  return productOptions.value.filter(hasProductStock)
})

const rules: FormRules<StockInFormModel> = {}

const requestHeaders = computed(() => ({
  ...(authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {})
}))

const getStockInId = (stockIn: ApiStockIn) => stockIn._id || stockIn.id || ''

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

const getStockInItems = (stockIn: ApiStockIn) => {
  return Array.isArray(stockIn.items) && stockIn.items.length ? stockIn.items : []
}

const getStockInQuantity = (stockIn: ApiStockIn) => {
  const items = getStockInItems(stockIn)
  if (!items.length) return Number(stockIn.quantity || 0)

  return items.reduce((total, item) => total + Number(item.quantity || 0), 0)
}

const getStockInProductLabel = (stockIn: ApiStockIn) => {
  const items = getStockInItems(stockIn)
  if (!items.length) return getProductLabel(stockIn.product)
  if (items.length === 1) return getProductLabel(items[0]?.product)

  return t('stockIns.itemCount', { count: items.length })
}

const getStockInCode = (stockIn: ApiStockIn) => {
  if (stockIn.code) return stockIn.code

  const items = getStockInItems(stockIn)
  if (!items.length) return getProductCode(stockIn.product) || '-'
  if (items.length === 1) return getProductCode(items[0]?.product) || '-'

  return '-'
}

const extractStockIns = (response: StockInResponse): ApiStockIn[] => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data?.stockIns)) return response.data.stockIns
  if (Array.isArray(response.data?.stockIn)) return response.data.stockIn
  if (Array.isArray(response.data?.items)) return response.data.items
  if (Array.isArray(response.data?.docs)) return response.data.docs
  if (Array.isArray(response.stockIns)) return response.stockIns
  if (Array.isArray(response.stockIn)) return response.stockIn
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

const getTotalItems = (response: StockInResponse, items: ApiStockIn[]) => {
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

const normalizeStockIn = (stockIn: ApiStockIn): ApiStockIn => ({
  ...stockIn,
  stockInDate: formatDate(stockIn.stockInDate),
  quantity: getStockInQuantity(stockIn)
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

const refreshStockIns = async () => {
  isLoading.value = true

  try {
    const response = await $fetch<StockInResponse>(stockInsEndpoint.value, {
      headers: requestHeaders.value,
      query: buildQuery()
    })

    const items = extractStockIns(response)
    stockIns.value = items.map(normalizeStockIn)
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
    stockInFormRef.value?.clearValidate()
  })
}

const removeItem = (index: number) => {
  if (form.items.length <= 1) return

  form.items.splice(index, 1)
  nextTick(() => {
    stockInFormRef.value?.clearValidate()
  })
}

const resetForm = () => {
  editingStockInId.value = null
  editingStockIn.value = null
  form.code = ''
  form.stockInDate = getToday()
  form.items = [createItem()]
  stockInFormRef.value?.clearValidate()
}

const openCreateDialog = () => {
  if (!canCreateStockIn.value) return

  resetForm()
  isDialogVisible.value = true
}

const openEditDialog = (stockIn: ApiStockIn) => {
  if (!canUpdateStockIn.value) return

  editingStockInId.value = getStockInId(stockIn)
  editingStockIn.value = stockIn
  form.code = getStockInCode(stockIn)
  form.stockInDate = formatDate(stockIn.stockInDate)
  const items = getStockInItems(stockIn)
  form.items = items.length
    ? items.map((item) => createItem({
        _id: item._id,
        id: item.id,
        product: getProductId(item.product),
        quantity: Number(item.quantity || 1),
        note: item.note || ''
      }))
    : [createItem({
        product: getProductId(stockIn.product),
        quantity: Number(stockIn.quantity || 1),
        note: stockIn.note || ''
      })]
  items.forEach((item) => ensureSelectedProductOption(item.product))
  ensureSelectedProductOption(stockIn.product)
  isDialogVisible.value = true
}

const buildItemPayload = (item: StockInForm): StockInPayloadItem => {
  const payload: StockInPayloadItem = {
    stockInDate: form.stockInDate,
    product: item.product,
    quantity: Number(item.quantity || 0)
  }

  if (item._id) payload._id = item._id
  if (item.id) payload.id = item.id

  const note = item.note.trim()
  if (note) payload.note = note

  return payload
}

const buildPayload = (): StockInPayload => {
  return {
    stockInDate: form.stockInDate,
    items: form.items.map(buildItemPayload)
  }
}

const buildUpdatePayload = (): StockInUpdatePayload => {
  if (form.items.length === 1) return buildItemPayload(form.items[0])
  return buildPayload()
}

const submitStockIn = async () => {
  if (!stockInFormRef.value) return
  if (isEditing.value && !canUpdateStockIn.value) return
  if (!isEditing.value && !canCreateStockIn.value) return

  const isValid = await stockInFormRef.value.validate().catch(() => false)
  if (!isValid) return

  isSaving.value = true

  try {
    const url = isEditing.value ? `${stockInsEndpoint.value}/${editingStockInId.value}` : stockInsEndpoint.value
    const method = isEditing.value ? 'PUT' : 'POST'

    await $fetch(url, {
      method,
      headers: requestHeaders.value,
      body: isEditing.value ? buildUpdatePayload() : buildPayload()
    })

    ElMessage.success(isEditing.value ? t('stockIns.messages.updated') : t('stockIns.messages.created'))
    isDialogVisible.value = false
    await Promise.all([
      refreshProductOptions(),
      refreshStockIns()
    ])
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isSaving.value = false
  }
}

const deleteStockIn = async (stockIn: ApiStockIn) => {
  if (!canDeleteStockIn.value) return

  const stockInId = getStockInId(stockIn)
  if (!stockInId) {
    ElMessage.error(t('stockIns.messages.missingId'))
    return
  }

  try {
    await ElMessageBox.confirm(
      t('stockIns.confirmDelete.message', { product: getProductLabel(stockIn.product) }),
      t('stockIns.confirmDelete.title'),
      {
        confirmButtonText: t('stockIns.actions.delete'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await $fetch(`${stockInsEndpoint.value}/${stockInId}`, {
      method: 'DELETE',
      headers: requestHeaders.value
    })

    ElMessage.success(t('stockIns.messages.deleted'))
    await Promise.all([
      refreshProductOptions(),
      refreshStockIns()
    ])
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(getErrorMessage(error))
    }
  }
}

watch([currentPage, pageSize], () => {
  refreshStockIns()
})

watch(search, () => {
  currentPage.value = 1
  refreshStockIns()
})

watch(productOptions, () => {
  if (isEditing.value && editingStockIn.value) {
    form.code = getStockInCode(editingStockIn.value)
  }
})

onMounted(() => {
  refreshProductOptions()
  refreshStockIns()
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
