<template>
  <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div class="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-base font-semibold">{{ t('sales.title') }}</h2>
        <p class="text-sm text-slate-500">{{ t('sales.description') }}</p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <el-input v-model="search" class="w-full sm:w-64" :placeholder="t('common.search')" clearable>
          <template #prefix>
            <Icon name="lucide:search" class="h-4 w-4 text-slate-400" />
          </template>
        </el-input>
        <el-button v-if="canCreateSale" type="primary" @click="openCreateDialog">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          {{ t('sales.actions.new') }}
        </el-button>
      </div>
    </div>

    <div class="p-5">
      <el-table v-loading="isLoading" :data="sales" stripe class="w-full">
        <el-table-column prop="code" :label="t('sales.code')" min-width="130" />
        <el-table-column :label="t('sales.customer')" min-width="180">
          <template #default="{ row }">
            {{ getCustomerLabel(row.customer) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('sales.salingDate')" min-width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.salingDate) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('sales.paymentMethod')" min-width="180">
          <template #default="{ row }">
            {{ getPaymentMethodLabel(row.paymentMethod) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('sales.status.label')" min-width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ t(`sales.status.${row.status || 'pending'}`) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('sales.itemCount')" min-width="110" align="right">
          <template #default="{ row }">
            {{ getSaleItems(row).length }}
          </template>
        </el-table-column>
        <el-table-column :label="t('sales.total')" min-width="130" align="right">
          <template #default="{ row }">
            {{ formatMoney(getSaleTotal(row)) }}
          </template>
        </el-table-column>
        <el-table-column prop="address" :label="t('sales.address')" min-width="180" show-overflow-tooltip />
        <el-table-column prop="note" :label="t('sales.note')" min-width="180" show-overflow-tooltip />
        <el-table-column v-if="canUpdateSale || canDeleteSale" fixed="right" :label="t('common.actions')" width="130">
          <template #default="{ row }">
            <div class="flex items-center gap-1">
              <el-tooltip v-if="canUpdateSale" :content="t('sales.actions.edit')" placement="top">
                <el-button circle text @click="openEditDialog(row)">
                  <Icon name="lucide:pencil" class="h-4 w-4" />
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="canDeleteSale" :content="t('sales.actions.delete')" placement="top">
                <el-button circle text type="danger" @click="deleteSale(row)">
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
      :title="isEditing ? t('sales.dialog.editTitle') : t('sales.dialog.createTitle')"
      fullscreen
      destroy-on-close
      draggable
    >
      <el-form
        ref="saleFormRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="submitSale"
      >
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <el-form-item :label="t('sales.code')" prop="code">
            <el-input v-model="form.code" :placeholder="t('sales.placeholders.code')" />
          </el-form-item>

          <el-form-item :label="t('sales.salingDate')" prop="salingDate">
            <el-date-picker
              v-model="form.salingDate"
              class="!w-full"
              format="YYYY-MM-DD HH:mm"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ss.SSS[Z]"
              :placeholder="t('sales.placeholders.salingDate')"
            />
          </el-form-item>

          <el-form-item :label="t('sales.status.label')" prop="status">
            <el-select v-model="form.status" class="w-full" :placeholder="t('sales.placeholders.status')">
              <el-option
                v-for="status in statusOptions"
                :key="status"
                :label="t(`sales.status.${status}`)"
                :value="status"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="t('sales.paymentMethod')" prop="paymentMethod">
            <el-select
              v-model="form.paymentMethod"
              class="w-full"
              filterable
              :loading="isLoadingPaymentMethods"
              :placeholder="t('sales.placeholders.paymentMethod')"
            >
              <el-option
                v-for="paymentMethod in paymentMethodOptions"
                :key="paymentMethod._id"
                :label="getPaymentMethodOptionLabel(paymentMethod)"
                :value="paymentMethod._id"
              />
            </el-select>
          </el-form-item>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <el-form-item :label="t('sales.customer')" prop="customer">
            <el-select
              v-model="form.customer"
              class="w-full"
              filterable
              clearable
              :loading="isLoadingCustomers"
              :placeholder="t('sales.placeholders.customer')"
            >
              <el-option
                v-for="customer in customerOptions"
                :key="customer._id"
                :label="customer.label"
                :value="customer._id"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="t('sales.address')" prop="address">
            <el-input v-model="form.address" :placeholder="t('sales.placeholders.address')" />
          </el-form-item>
        </div>

        <el-form-item :label="t('sales.note')" prop="note">
          <el-input v-model="form.note" :placeholder="t('sales.placeholders.note')" :rows="2" type="textarea" />
        </el-form-item>

        <div class="grid gap-4 md:grid-cols-2">
          <el-form-item :label="t('sales.totalAmount')">
            <el-input :model-value="formatMoney(formTotalAmount)" readonly />
          </el-form-item>

          <el-form-item :label="t('sales.amountAfterDiscount')">
            <el-input :model-value="formatMoney(formAmountAfterDiscount)" readonly />
          </el-form-item>
        </div>

        <el-tabs type="border-card">
          <el-tab-pane :label="t('sales.items')">
            <div class="mb-2 flex items-center justify-between gap-3">
              <div class="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-700">
                <span>{{ t('sales.totalAmount') }}: {{ formatMoney(formTotalAmount) }}</span>
                <span>{{ t('sales.amountAfterDiscount') }}: {{ formatMoney(formAmountAfterDiscount) }}</span>
              </div>
              <el-button @click="addItem">
                <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
                {{ t('sales.actions.addItem') }}
              </el-button>
            </div>

            <el-table :data="form.items" border class="sale-items-table w-full">
              <el-table-column type="index" :label="t('sales.no')" width="64" align="center" />
              <el-table-column :label="t('sales.product')" min-width="260">
                <template #default="{ row, $index }">
                  <el-form-item class="mb-0" :prop="`items.${$index}.product`" :rules="getProductRules($index)">
                    <el-select
                      v-model="row.product"
                      class="w-full"
                      filterable
                      :loading="isLoadingProducts"
                      :placeholder="t('sales.placeholders.product')"
                      @change="handleProductChange(row)"
                    >
                      <el-option
                        v-for="product in productOptions"
                        :key="product._id"
                        :disabled="isProductSelectedInAnotherRow(product._id, $index)"
                        :label="getProductOptionLabel(product)"
                        :value="product._id"
                      />
                    </el-select>
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column :label="t('sales.stockOnHand')" min-width="140" align="center">
                <template #default="{ row }">
                  {{ row.isStock ? formatNumber(row.stockOnHand) : '-' }}
                </template>
              </el-table-column>
              <el-table-column :label="t('sales.quantity')" min-width="140">
                <template #default="{ row, $index }">
                  <el-form-item class="mb-0" :prop="`items.${$index}.quantity`" :rules="getQuantityRules($index)">
                    <el-input-number
                      v-model="row.quantity"
                      :min="1"
                      :max="row.isStock && row.stockOnHand !== null ? row.stockOnHand : undefined"
                      :step="1"
                      class="!w-full"
                      controls-position="right"
                    />
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column :label="t('sales.unitPrice')" min-width="150">
                <template #default="{ row, $index }">
                  <el-form-item class="mb-0" :prop="`items.${$index}.unitPrice`" :rules="unitPriceRules">
                    <el-input-number
                      v-model="row.unitPrice"
                      :min="0"
                      :precision="2"
                      :step="0.5"
                      class="!w-full"
                      controls-position="right"
                    />
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column :label="t('sales.discount')" min-width="150">
                <template #default="{ row, $index }">
                  <el-form-item class="mb-0" :prop="`items.${$index}.discount`" :rules="getDiscountRules($index)">
                    <el-input-number
                      v-model="row.discount"
                      :min="0"
                      :max="row.unitPrice"
                      :precision="2"
                      :step="0.5"
                      class="!w-full"
                      controls-position="right"
                    />
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column :label="t('sales.lineTotal')" min-width="130" align="center">
                <template #default="{ row }">
                  {{ formatMoney(getItemTotal(row)) }}
                </template>
              </el-table-column>
              <el-table-column :label="t('sales.note')" min-width="220">
                <template #default="{ row, $index }">
                  <el-form-item class="mb-0" :prop="`items.${$index}.note`">
                    <el-input v-model="row.note" :placeholder="t('sales.placeholders.itemNote')" />
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column :label="t('common.actions')" width="96" align="center">
                <template #default="{ $index }">
                  <el-tooltip v-if="form.items.length > 1" :content="t('sales.actions.removeItem')" placement="top">
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
          <el-button type="primary" :loading="isSaving" @click="submitSale">
            {{ isEditing ? t('sales.actions.save') : t('sales.actions.create') }}
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
  permission: 'sale.read'
})

export type SaleStatus = "pending" | "packing" | "shipping" | "delivered" | "completed";

type CustomerOption = {
  _id: string
  label: string
  email?: string
}

type RawCustomerOption = {
  _id?: string
  id?: string
  value?: string
  label?: string
  username?: string
  email?: string
  code?: string
  firstName?: string
  lastName?: string
  fullName?: string
}

type PaymentMethodOption = {
  _id: string
  id?: string
  merchantName: string
  bankAccount?: string
}

type ProductStock = {
  _id?: string
  id?: string
  stockIn?: number | string
  stockOut?: number | string
  stockAdjustment?: number | string
  stockOnHand?: number | string
  isStock?: boolean
}

type ProductOption = {
  _id: string
  id?: string
  code?: string
  nameEn: string
  nameKh?: string
  unitPrice?: number | string
  discount?: number | string
  stock?: boolean | string | ProductStock | Array<string | ProductStock> | null
}

type ApiSaleItem = {
  _id?: string
  id?: string
  product?: string | ProductOption
  quantity?: number | string
  unitPrice?: number | string
  discount?: number | string
  note?: string
}

type ApiSale = {
  _id?: string
  id?: string
  code: string
  customer?: string | CustomerOption
  salingDate: string
  status: SaleStatus
  paymentMethod?: string | PaymentMethodOption
  address?: string
  note?: string
  items?: ApiSaleItem[]
}

type SaleFormItem = {
  key: number
  _id?: string
  id?: string
  product: string
  quantity: number
  unitPrice: number
  discount: number
  stockOnHand: number | null
  isStock: boolean
  note: string
}

type SaleForm = {
  code: string
  customer: string
  salingDate: string
  status: SaleStatus
  paymentMethod: string
  address: string
  note: string
  items: SaleFormItem[]
}

type SalePayloadItem = {
  _id?: string
  id?: string
  product: string
  quantity: number
  unitPrice: number
  discount: number
  note?: string
}

type SalePayload = Omit<SaleForm, 'items'> & {
  items: SalePayloadItem[]
}

type PaginatedSaleResponse = {
  data?: ApiSale[] | { sales?: ApiSale[]; items?: ApiSale[]; docs?: ApiSale[] }
  sales?: ApiSale[]
  items?: ApiSale[]
  docs?: ApiSale[]
  pagination?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
  message?: string
}

type SaleResponse = ApiSale[] | PaginatedSaleResponse

type CustomerOptionsResponse = RawCustomerOption[] | {
  data?: RawCustomerOption[] | {
    userProfiles?: RawCustomerOption[]
    profiles?: RawCustomerOption[]
    customers?: RawCustomerOption[]
    items?: RawCustomerOption[]
    docs?: RawCustomerOption[]
    options?: RawCustomerOption[]
    results?: RawCustomerOption[]
  }
  userProfiles?: RawCustomerOption[]
  profiles?: RawCustomerOption[]
  customers?: RawCustomerOption[]
  items?: RawCustomerOption[]
  docs?: RawCustomerOption[]
  options?: RawCustomerOption[]
  results?: RawCustomerOption[]
}

type PaymentMethodResponse = PaymentMethodOption[] | {
  data?: PaymentMethodOption[] | { paymentMethods?: PaymentMethodOption[]; items?: PaymentMethodOption[]; docs?: PaymentMethodOption[] }
  paymentMethods?: PaymentMethodOption[]
  items?: PaymentMethodOption[]
  docs?: PaymentMethodOption[]
}

type ProductResponse = ProductOption[] | {
  data?: ProductOption[] | { products?: ProductOption[]; items?: ProductOption[]; docs?: ProductOption[] }
  products?: ProductOption[]
  items?: ProductOption[]
  docs?: ProductOption[]
}

const { t } = useI18n()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('auth_token')
const { hasPermission } = useAuth()

const apiBaseUrl = computed(() => String(config.public.apiBaseUrl).replace(/\/$/, ''))
const salesEndpoint = computed(() => `${apiBaseUrl.value}/saling/sales`)
const customerOptionsEndpoint = computed(() => `${apiBaseUrl.value}/system/users/select-options`)
const paymentMethodsEndpoint = computed(() => `${apiBaseUrl.value}/system/payment-methods`)
const productsEndpoint = computed(() => `${apiBaseUrl.value}/master-data/products`)
const statusOptions: SaleStatus[] = ['pending', 'packing', 'shipping', 'delivered', 'completed']

const search = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const sales = ref<ApiSale[]>([])
const customerOptions = ref<CustomerOption[]>([])
const paymentMethodOptions = ref<PaymentMethodOption[]>([])
const productOptions = ref<ProductOption[]>([])
const isLoading = ref(false)
const isLoadingCustomers = ref(false)
const isLoadingPaymentMethods = ref(false)
const isLoadingProducts = ref(false)
const isSaving = ref(false)
const isDialogVisible = ref(false)
const editingSaleId = ref<string | null>(null)
const saleFormRef = ref<FormInstance>()

const getNowIso = () => new Date().toISOString()

const createItem = (item?: Partial<SaleFormItem>): SaleFormItem => ({
  key: Date.now() + Math.random(),
  _id: item?._id,
  id: item?.id,
  product: item?.product || '',
  quantity: Number(item?.quantity || 1),
  unitPrice: Number(item?.unitPrice || 0),
  discount: Number(item?.discount || 0),
  stockOnHand: item?.stockOnHand ?? null,
  isStock: item?.isStock || false,
  note: item?.note || ''
})

const form = reactive<SaleForm>({
  code: '',
  customer: '',
  salingDate: getNowIso(),
  status: 'pending',
  paymentMethod: '',
  address: '',
  note: '',
  items: [createItem()]
})

const isEditing = computed(() => Boolean(editingSaleId.value))
const canCreateSale = computed(() => hasPermission('sale.create'))
const canUpdateSale = computed(() => hasPermission('sale.update'))
const canDeleteSale = computed(() => hasPermission('sale.delete'))
const formTotalAmount = computed(() => form.items.reduce((total, item) => total + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0))
const formAmountAfterDiscount = computed(() => form.items.reduce((total, item) => total + getItemTotal(item), 0))

const isProductSelectedInAnotherRow = (productId: string, currentIndex: number) => {
  return form.items.some((item, index) => index !== currentIndex && item.product === productId)
}

const validateUniqueProduct = (rowIndex: number) => {
  return (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (value && isProductSelectedInAnotherRow(value, rowIndex)) {
      callback(new Error(t('sales.validation.productDuplicate')))
      return
    }

    callback()
  }
}

const validateDiscount = (rowIndex: number) => {
  return (_rule: unknown, value: number, callback: (error?: Error) => void) => {
    const item = form.items[rowIndex]
    if (item && Number(value || 0) > Number(item.unitPrice || 0)) {
      callback(new Error(t('sales.validation.discountMax')))
      return
    }

    callback()
  }
}

const validateQuantityStock = (rowIndex: number) => {
  return (_rule: unknown, value: number, callback: (error?: Error) => void) => {
    const item = form.items[rowIndex]
    if (item?.isStock && item.stockOnHand !== null && Number(value || 0) > Number(item.stockOnHand || 0)) {
      callback(new Error(t('sales.validation.quantityMaxStock', { stockOnHand: formatNumber(item.stockOnHand) })))
      return
    }

    callback()
  }
}

const getProductRules = (rowIndex: number) => [
  { required: true, message: () => t('sales.validation.productRequired'), trigger: 'change' },
  { validator: validateUniqueProduct(rowIndex), trigger: 'change' }
]

const getQuantityRules = (rowIndex: number) => [
  { required: true, message: () => t('sales.validation.quantityRequired'), trigger: 'blur' },
  { type: 'number' as const, min: 1, message: () => t('sales.validation.quantityMin'), trigger: 'change' },
  { validator: validateQuantityStock(rowIndex), trigger: 'change' }
]

const unitPriceRules = [
  { required: true, message: () => t('sales.validation.unitPriceRequired'), trigger: 'blur' },
  { type: 'number' as const, min: 0, message: () => t('sales.validation.unitPriceMin'), trigger: 'change' }
]

const getDiscountRules = (rowIndex: number) => [
  { required: true, message: () => t('sales.validation.discountRequired'), trigger: 'blur' },
  { type: 'number' as const, min: 0, message: () => t('sales.validation.discountMin'), trigger: 'change' },
  { validator: validateDiscount(rowIndex), trigger: 'change' }
]

const rules: FormRules<SaleForm> = {
  code: [
    { required: true, message: () => t('sales.validation.codeRequired'), trigger: 'blur' }
  ],
  customer: [
    { required: true, message: () => t('sales.validation.customerRequired'), trigger: 'change' }
  ],
  salingDate: [
    { required: true, message: () => t('sales.validation.salingDateRequired'), trigger: 'change' }
  ],
  status: [
    { required: true, message: () => t('sales.validation.statusRequired'), trigger: 'change' }
  ],
  paymentMethod: [
    { required: true, message: () => t('sales.validation.paymentMethodRequired'), trigger: 'change' }
  ],
  address: [
    { required: true, message: () => t('sales.validation.addressRequired'), trigger: 'blur' }
  ]
}

const requestHeaders = computed(() => ({
  ...(authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {})
}))

const getSaleId = (sale: ApiSale) => sale._id || sale.id || ''
const getCustomerId = (customer?: string | CustomerOption) => typeof customer === 'string' ? customer : customer?._id || ''
const getPaymentMethodId = (paymentMethod?: string | PaymentMethodOption) => {
  return typeof paymentMethod === 'string' ? paymentMethod : paymentMethod?._id || paymentMethod?.id || ''
}
const getProductId = (product?: string | ProductOption) => typeof product === 'string' ? product : product?._id || product?.id || ''

const getCustomerOptionLabel = (customer: CustomerOption) => {
  return customer.code ? `${customer.code} - ${customer.label}` : customer.label
}

const getCustomerLabel = (
  customer?: string | CustomerOption,
) => {
  const customerId = getCustomerId(customer)

  if (typeof customer === 'object' && customer?.label) {
    return customer.label
  }

  return (
    customerOptions.value.find(c => c._id === customerId)?.label ??
    '-'
  )
}
const getPaymentMethodOptionLabel = (paymentMethod: PaymentMethodOption) => {
  return paymentMethod.bankAccount ? `${paymentMethod.merchantName} - ${paymentMethod.bankAccount}` : paymentMethod.merchantName
}

const getPaymentMethodLabel = (paymentMethod?: string | PaymentMethodOption) => {
  const paymentMethodId = getPaymentMethodId(paymentMethod)
  if (typeof paymentMethod === 'object' && paymentMethod?.merchantName) return getPaymentMethodOptionLabel(paymentMethod)
  return paymentMethodOptions.value.find((item) => item._id === paymentMethodId || item.id === paymentMethodId)?.merchantName || paymentMethodId || '-'
}

const getProductOptionLabel = (product: ProductOption) => {
  return product.code ? `${product.code} - ${product.nameEn}` : product.nameEn
}

const toNumber = (value: number | string | undefined | null) => Number(value || 0)

const getProductStock = (product?: ProductOption): ProductStock | null => {
  if (!product?.stock || typeof product.stock === 'boolean' || typeof product.stock === 'string') return null

  if (Array.isArray(product.stock)) {
    const stock = product.stock.find((item): item is ProductStock => typeof item === 'object' && item !== null)
    return stock || null
  }

  return product.stock
}

const getStockOnHand = (stock: ProductStock) => {
  if (stock.stockOnHand !== undefined) return toNumber(stock.stockOnHand)
  return toNumber(stock.stockIn) + toNumber(stock.stockAdjustment) - toNumber(stock.stockOut)
}

const getProductStockInfo = (product?: ProductOption) => {
  const stock = getProductStock(product)
  if (!stock?.isStock) {
    return {
      isStock: false,
      stockOnHand: null as number | null
    }
  }

  return {
    isStock: true,
    stockOnHand: getStockOnHand(stock)
  }
}

const getSaleItems = (sale: ApiSale) => Array.isArray(sale.items) ? sale.items : []

const getItemTotal = (item: ApiSaleItem | SaleFormItem) => {
  const quantity = Number(item.quantity || 0)
  const unitPrice = Number(item.unitPrice || 0)
  const discount = Number(item.discount || 0)
  return quantity * Math.max(unitPrice - discount, 0)
}

const getSaleTotal = (sale: ApiSale) => getSaleItems(sale).reduce((total, item) => total + getItemTotal(item), 0)

const getStatusTagType = (status?: SaleStatus) => {
  if (status === 'confirmed') return 'success'
  if (status === 'cancelled') return 'danger'
  return 'warning'
}

const normalizeCustomerOption = (
  option: RawCustomerOption,
): CustomerOption | null => {
  const id = option._id || option.id || option.value

  const label =
    option.label ||
    option.username ||
    option.fullName ||
    [option.firstName, option.lastName]
      .filter(Boolean)
      .join(' ')

  if (!id || !label) {
    return null
  }

  return {
    _id: id,
    label,
    email: option.email,
  }
}

const extractCustomerOptions = (
  response: CustomerOptionsResponse,
): CustomerOption[] => {
  let options: RawCustomerOption[] = []

  if (Array.isArray(response))
    options = response
  else if (Array.isArray(response.data))
    options = response.data
  else if (Array.isArray(response.data?.customers))
    options = response.data.customers
  else if (Array.isArray(response.data?.userProfiles))
    options = response.data.userProfiles
  else if (Array.isArray(response.data?.profiles))
    options = response.data.profiles
  else if (Array.isArray(response.data?.items))
    options = response.data.items
  else if (Array.isArray(response.data?.docs))
    options = response.data.docs
  else if (Array.isArray(response.data?.options))
    options = response.data.options
  else if (Array.isArray(response.data?.results))
    options = response.data.results
  else if (Array.isArray(response.customers))
    options = response.customers
  else if (Array.isArray(response.userProfiles))
    options = response.userProfiles
  else if (Array.isArray(response.profiles))
    options = response.profiles
  else if (Array.isArray(response.items))
    options = response.items
  else if (Array.isArray(response.docs))
    options = response.docs
  else if (Array.isArray(response.options))
    options = response.options
  else if (Array.isArray(response.results))
    options = response.results

  return options
    .map(normalizeCustomerOption)
    .filter((item): item is CustomerOption => item !== null)
}

const extractPaymentMethods = (response: PaymentMethodResponse): PaymentMethodOption[] => {
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

const extractSales = (response: SaleResponse): ApiSale[] => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data?.sales)) return response.data.sales
  if (Array.isArray(response.data?.items)) return response.data.items
  if (Array.isArray(response.data?.docs)) return response.data.docs
  if (Array.isArray(response.sales)) return response.sales
  if (Array.isArray(response.items)) return response.items
  if (Array.isArray(response.docs)) return response.docs
  return []
}

const ensureSelectedCustomerOption = (
  customer?: string | CustomerOption,
) => {
  if (!customer || typeof customer === 'string') {
    return
  }

  const customerId = getCustomerId(customer)

  if (
    !customerOptions.value.some(c => c._id === customerId)
  ) {
    customerOptions.value.push({
      _id: customerId,
      label: customer.label,
    })
  }
}

const ensureSelectedPaymentMethodOption = (paymentMethod?: string | PaymentMethodOption) => {
  if (!paymentMethod || typeof paymentMethod === 'string') return
  const paymentMethodId = getPaymentMethodId(paymentMethod)
  if (!paymentMethodOptions.value.some((item) => item._id === paymentMethodId || item.id === paymentMethodId)) {
    paymentMethodOptions.value = [...paymentMethodOptions.value, { ...paymentMethod, _id: paymentMethodId }]
  }
}

const ensureSelectedProductOption = (product?: string | ProductOption) => {
  if (!product || typeof product === 'string') return
  const productId = getProductId(product)
  if (!productOptions.value.some((item) => item._id === productId || item.id === productId)) {
    productOptions.value = [...productOptions.value, { ...product, _id: productId }]
  }
}

const getTotalItems = (response: SaleResponse, items: ApiSale[]) => {
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

const formatMoney = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0))
}

const formatNumber = (value: number | null) => {
  if (value === null) return '-'

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2
  }).format(Number(value || 0))
}

const formatDateTime = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const normalizeSale = (sale: ApiSale): ApiSale => ({
  ...sale,
  status: sale.status || 'pending',
  items: getSaleItems(sale).map((item) => ({
    ...item,
    quantity: Number(item.quantity || 0),
    unitPrice: Number(item.unitPrice || 0),
    discount: Number(item.discount || 0)
  }))
})

const refreshCustomerOptions = async () => {
  isLoadingCustomers.value = true

  try {
    const response = await $fetch<CustomerOptionsResponse>(customerOptionsEndpoint.value, {
      headers: requestHeaders.value,
      query: {
        page: 1,
        limit: 1000,
        userType: 'customer'
      }
    })

    customerOptions.value = extractCustomerOptions(response)
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isLoadingCustomers.value = false
  }
}

const refreshPaymentMethodOptions = async () => {
  isLoadingPaymentMethods.value = true

  try {
    const response = await $fetch<PaymentMethodResponse>(paymentMethodsEndpoint.value, {
      headers: requestHeaders.value,
      query: {
        page: 1,
        limit: 1000
      }
    })

    paymentMethodOptions.value = extractPaymentMethods(response).map((paymentMethod) => ({
      ...paymentMethod,
      _id: paymentMethod._id || paymentMethod.id || ''
    })).filter((paymentMethod) => paymentMethod._id)
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isLoadingPaymentMethods.value = false
  }
}

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
      _id: product._id || product.id || '',
      unitPrice: Number(product.unitPrice || 0),
      discount: Number(product.discount || 0)
    })).filter((product) => product._id)

    form.items.forEach(syncItemStockFromProduct)
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isLoadingProducts.value = false
  }
}

const refreshSales = async () => {
  isLoading.value = true

  try {
    const response = await $fetch<SaleResponse>(salesEndpoint.value, {
      headers: requestHeaders.value,
      query: buildQuery()
    })

    const items = extractSales(response)
    sales.value = items.map(normalizeSale)
    totalItems.value = getTotalItems(response, items)
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isLoading.value = false
  }
}

const handleProductChange = (item: SaleFormItem) => {
  const product = productOptions.value.find((option) => option._id === item.product || option.id === item.product)
  if (!product) return

  item.unitPrice = Number(product.unitPrice || 0)
  item.discount = Number(product.discount || 0)
  const stockInfo = getProductStockInfo(product)
  item.isStock = stockInfo.isStock
  item.stockOnHand = stockInfo.stockOnHand
  nextTick(() => {
    saleFormRef.value?.clearValidate()
  })
}

const syncItemStockFromProduct = (item: SaleFormItem) => {
  const product = productOptions.value.find((option) => option._id === item.product || option.id === item.product)
  if (!product) return

  const stockInfo = getProductStockInfo(product)
  item.isStock = stockInfo.isStock
  item.stockOnHand = stockInfo.stockOnHand
}

const addItem = () => {
  form.items.push(createItem())
  nextTick(() => {
    saleFormRef.value?.clearValidate()
  })
}

const removeItem = (index: number) => {
  if (form.items.length <= 1) return

  form.items.splice(index, 1)
  nextTick(() => {
    saleFormRef.value?.clearValidate()
  })
}

const resetForm = () => {
  editingSaleId.value = null
  Object.assign(form, {
    code: '',
    customer: '',
    salingDate: getNowIso(),
    status: 'pending',
    paymentMethod: '',
    address: '',
    note: '',
    items: [createItem()]
  })
  saleFormRef.value?.clearValidate()
}

const openCreateDialog = () => {
  if (!canCreateSale.value) return

  resetForm()
  isDialogVisible.value = true
}

const openEditDialog = (sale: ApiSale) => {
  if (!canUpdateSale.value) return

  editingSaleId.value = getSaleId(sale)
  const items = getSaleItems(sale)
  Object.assign(form, {
    code: sale.code || '',
    customer: getCustomerId(sale.customer),
    salingDate: sale.salingDate || getNowIso(),
    status: sale.status || 'pending',
    paymentMethod: getPaymentMethodId(sale.paymentMethod),
    address: sale.address || '',
    note: sale.note || '',
    items: items.length
      ? items.map((item) => {
          const stockInfo = typeof item.product === 'object' ? getProductStockInfo(item.product) : { isStock: false, stockOnHand: null }

          return createItem({
            _id: item._id,
            id: item.id,
            product: getProductId(item.product),
            quantity: Number(item.quantity || 1),
            unitPrice: Number(item.unitPrice || 0),
            discount: Number(item.discount || 0),
            stockOnHand: stockInfo.stockOnHand,
            isStock: stockInfo.isStock,
            note: item.note || ''
          })
        })
      : [createItem()]
  })
  ensureSelectedCustomerOption(sale.customer)
  ensureSelectedPaymentMethodOption(sale.paymentMethod)
  items.forEach((item) => ensureSelectedProductOption(item.product))
  isDialogVisible.value = true
}

const buildItemPayload = (item: SaleFormItem): SalePayloadItem => {
  const payload: SalePayloadItem = {
    product: item.product,
    quantity: Number(item.quantity || 0),
    unitPrice: Number(item.unitPrice || 0),
    discount: Number(item.discount || 0)
  }

  if (item._id) payload._id = item._id
  if (item.id) payload.id = item.id

  const note = item.note.trim()
  if (note) payload.note = note

  return payload
}

const buildPayload = (): SalePayload => ({
  code: form.code.trim(),
  customer: form.customer,
  salingDate: form.salingDate,
  status: form.status,
  paymentMethod: form.paymentMethod,
  address: form.address.trim(),
  note: form.note.trim(),
  items: form.items.map(buildItemPayload)
})

const submitSale = async () => {
  if (!saleFormRef.value) return
  if (isEditing.value && !canUpdateSale.value) return
  if (!isEditing.value && !canCreateSale.value) return

  const isValid = await saleFormRef.value.validate().catch(() => false)
  if (!isValid) return

  isSaving.value = true

  try {
    const url = isEditing.value ? `${salesEndpoint.value}/${editingSaleId.value}` : salesEndpoint.value
    const method = isEditing.value ? 'PUT' : 'POST'

    await $fetch(url, {
      method,
      headers: requestHeaders.value,
      body: buildPayload()
    })

    ElMessage.success(isEditing.value ? t('sales.messages.updated') : t('sales.messages.created'))
    isDialogVisible.value = false
    await refreshSales()
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isSaving.value = false
  }
}

const deleteSale = async (sale: ApiSale) => {
  if (!canDeleteSale.value) return

  const saleId = getSaleId(sale)
  if (!saleId) {
    ElMessage.error(t('sales.messages.missingId'))
    return
  }

  try {
    await ElMessageBox.confirm(
      t('sales.confirmDelete.message', { code: sale.code }),
      t('sales.confirmDelete.title'),
      {
        confirmButtonText: t('sales.actions.delete'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await $fetch(`${salesEndpoint.value}/${saleId}`, {
      method: 'DELETE',
      headers: requestHeaders.value
    })

    ElMessage.success(t('sales.messages.deleted'))
    await refreshSales()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(getErrorMessage(error))
    }
  }
}

watch([currentPage, pageSize], () => {
  refreshSales()
})

watch(search, () => {
  currentPage.value = 1
  refreshSales()
})

onMounted(() => {
  refreshCustomerOptions()
  refreshPaymentMethodOptions()
  refreshProductOptions()
  refreshSales()
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
