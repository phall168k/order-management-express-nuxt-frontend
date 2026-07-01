<template>
  <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div class="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-base font-semibold">{{ t('paymentMethods.title') }}</h2>
        <p class="text-sm text-slate-500">{{ t('paymentMethods.description') }}</p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <el-input v-model="search" class="w-full sm:w-64" :placeholder="t('common.search')" clearable>
          <template #prefix>
            <Icon name="lucide:search" class="h-4 w-4 text-slate-400" />
          </template>
        </el-input>
        <el-button v-if="canCreatePaymentMethod" type="primary" @click="openCreateDialog">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          {{ t('paymentMethods.actions.new') }}
        </el-button>
      </div>
    </div>

    <div class="p-5">
      <el-table v-loading="isLoading" :data="paymentMethods" stripe class="w-full">
        <el-table-column :label="t('paymentMethods.logo')" width="92">
          <template #default="{ row }">
            <div class="grid h-12 w-12 place-items-center overflow-hidden rounded border border-slate-200 bg-slate-50">
              <img
                v-if="row.logo"
                :alt="row.merchantName"
                class="h-full w-full object-cover"
                :src="getLogoUrl(row.logo)"
              >
              <Icon v-else name="lucide:image" class="h-5 w-5 text-slate-400" />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="merchantName" :label="t('paymentMethods.merchantName')" min-width="180" />
        <el-table-column prop="bankAccount" :label="t('paymentMethods.bankAccount')" min-width="150" />
        <el-table-column prop="merchantCity" :label="t('paymentMethods.merchantCity')" min-width="150" />
        <el-table-column :label="t('paymentMethods.amount')" min-width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('paymentMethods.currency')" min-width="110">
          <template #default="{ row }">
            <el-tag effect="plain">{{ String(row.currency || '').toUpperCase() }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="storeLabel" :label="t('paymentMethods.storeLabel')" min-width="150" />
        <el-table-column prop="terminalLabel" :label="t('paymentMethods.terminalLabel')" min-width="130" />
        <el-table-column :label="t('common.status')" min-width="120">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'">
              {{ row.isActive ? t('paymentMethods.status.active') : t('paymentMethods.status.inactive') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="canUpdatePaymentMethod || canDeletePaymentMethod" fixed="right" :label="t('common.actions')" width="130">
          <template #default="{ row }">
            <div class="flex items-center gap-1">
              <el-tooltip v-if="canUpdatePaymentMethod" :content="t('paymentMethods.actions.edit')" placement="top">
                <el-button circle text @click="openEditDialog(row)">
                  <Icon name="lucide:pencil" class="h-4 w-4" />
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="canDeletePaymentMethod" :content="t('paymentMethods.actions.delete')" placement="top">
                <el-button circle text type="danger" @click="deletePaymentMethod(row)">
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
      :title="isEditing ? t('paymentMethods.dialog.editTitle') : t('paymentMethods.dialog.createTitle')"
      width="860px"
      destroy-on-close
      draggable
    >
      <el-form
        ref="paymentMethodFormRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="submitPaymentMethod"
      >
        <el-form-item :label="t('paymentMethods.logo')" prop="logo">
          <el-input v-model="form.logo" :placeholder="t('paymentMethods.placeholders.logo')" />
        </el-form-item>

        <div class="grid gap-4 md:grid-cols-2">
          <el-form-item :label="t('paymentMethods.bankAccount')" prop="bankAccount">
            <el-input v-model="form.bankAccount" :placeholder="t('paymentMethods.placeholders.bankAccount')" />
          </el-form-item>

          <el-form-item :label="t('paymentMethods.phoneNumber')" prop="phoneNumber">
            <el-input v-model="form.phoneNumber" :placeholder="t('paymentMethods.placeholders.phoneNumber')" />
          </el-form-item>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <el-form-item :label="t('paymentMethods.merchantName')" prop="merchantName">
            <el-input v-model="form.merchantName" :placeholder="t('paymentMethods.placeholders.merchantName')" />
          </el-form-item>

          <el-form-item :label="t('paymentMethods.merchantCity')" prop="merchantCity">
            <el-input v-model="form.merchantCity" :placeholder="t('paymentMethods.placeholders.merchantCity')" />
          </el-form-item>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <el-form-item :label="t('paymentMethods.amount')" prop="amount">
            <el-input-number
              v-model="form.amount"
              :min="0"
              :precision="2"
              :step="0.5"
              class="!w-full"
              controls-position="right"
            />
          </el-form-item>

          <el-form-item :label="t('paymentMethods.currency')" prop="currency">
            <el-select v-model="form.currency" class="w-full" :placeholder="t('paymentMethods.placeholders.currency')">
              <el-option
                v-for="currency in currencyOptions"
                :key="currency"
                :label="currency.toUpperCase()"
                :value="currency"
              />
            </el-select>
          </el-form-item>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <el-form-item :label="t('paymentMethods.storeLabel')" prop="storeLabel">
            <el-input v-model="form.storeLabel" :placeholder="t('paymentMethods.placeholders.storeLabel')" />
          </el-form-item>

          <el-form-item :label="t('paymentMethods.terminalLabel')" prop="terminalLabel">
            <el-input v-model="form.terminalLabel" :placeholder="t('paymentMethods.placeholders.terminalLabel')" />
          </el-form-item>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <el-form-item :label="t('paymentMethods.billNumber')" prop="billNumber">
            <el-input v-model="form.billNumber" :placeholder="t('paymentMethods.placeholders.billNumber')" />
          </el-form-item>

          <el-form-item :label="t('paymentMethods.isActive')">
            <el-switch v-model="form.isActive" />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="isDialogVisible = false">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="isSaving" @click="submitPaymentMethod">
            {{ isEditing ? t('paymentMethods.actions.save') : t('paymentMethods.actions.create') }}
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
  permission: 'payment-method.read'
})

type Currency = 'usd' | 'khr'

type ApiPaymentMethod = {
  _id?: string
  id?: string
  logo?: string
  bankAccount: string
  merchantName: string
  merchantCity: string
  amount: number
  currency: Currency
  storeLabel: string
  phoneNumber: string
  billNumber: string
  terminalLabel: string
  isActive?: boolean
}

type PaymentMethodForm = {
  logo: string
  bankAccount: string
  merchantName: string
  merchantCity: string
  amount: number
  currency: Currency
  storeLabel: string
  phoneNumber: string
  billNumber: string
  terminalLabel: string
  isActive: boolean
}

type PaginatedResponse = {
  data?: ApiPaymentMethod[] | { paymentMethods?: ApiPaymentMethod[]; items?: ApiPaymentMethod[]; docs?: ApiPaymentMethod[] }
  paymentMethods?: ApiPaymentMethod[]
  items?: ApiPaymentMethod[]
  docs?: ApiPaymentMethod[]
  pagination?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
  message?: string
}

type PaymentMethodResponse = ApiPaymentMethod[] | PaginatedResponse

const { t } = useI18n()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('auth_token')
const { hasPermission } = useAuth()

const apiBaseUrl = computed(() => String(config.public.apiBaseUrl).replace(/\/$/, ''))
const paymentMethodsEndpoint = computed(() => `${apiBaseUrl.value}/system/payment-methods`)
const currencyOptions: Currency[] = ['usd', 'khr']

const search = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const paymentMethods = ref<ApiPaymentMethod[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const isDialogVisible = ref(false)
const editingPaymentMethodId = ref<string | null>(null)
const paymentMethodFormRef = ref<FormInstance>()

const form = reactive<PaymentMethodForm>({
  logo: '',
  bankAccount: '',
  merchantName: '',
  merchantCity: '',
  amount: 0,
  currency: 'usd',
  storeLabel: '',
  phoneNumber: '',
  billNumber: '',
  terminalLabel: '',
  isActive: true
})

const isEditing = computed(() => Boolean(editingPaymentMethodId.value))
const canCreatePaymentMethod = computed(() => hasPermission('payment-method.create'))
const canUpdatePaymentMethod = computed(() => hasPermission('payment-method.update'))
const canDeletePaymentMethod = computed(() => hasPermission('payment-method.delete'))

const rules: FormRules<PaymentMethodForm> = {
  logo: [
    { required: true, message: () => t('paymentMethods.validation.logoRequired'), trigger: 'blur' }
  ],
  bankAccount: [
    { required: true, message: () => t('paymentMethods.validation.bankAccountRequired'), trigger: 'blur' }
  ],
  merchantName: [
    { required: true, message: () => t('paymentMethods.validation.merchantNameRequired'), trigger: 'blur' }
  ],
  merchantCity: [
    { required: true, message: () => t('paymentMethods.validation.merchantCityRequired'), trigger: 'blur' }
  ],
  amount: [
    { required: true, message: () => t('paymentMethods.validation.amountRequired'), trigger: 'blur' },
    { type: 'number', min: 0, message: () => t('paymentMethods.validation.amountMin'), trigger: 'change' }
  ],
  currency: [
    { required: true, message: () => t('paymentMethods.validation.currencyRequired'), trigger: 'change' }
  ],
  storeLabel: [
    { required: true, message: () => t('paymentMethods.validation.storeLabelRequired'), trigger: 'blur' }
  ],
  phoneNumber: [
    { required: true, message: () => t('paymentMethods.validation.phoneNumberRequired'), trigger: 'blur' }
  ],
  billNumber: [
    { required: true, message: () => t('paymentMethods.validation.billNumberRequired'), trigger: 'blur' }
  ],
  terminalLabel: [
    { required: true, message: () => t('paymentMethods.validation.terminalLabelRequired'), trigger: 'blur' }
  ]
}

const requestHeaders = computed(() => ({
  ...(authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {})
}))

const getPaymentMethodId = (paymentMethod: ApiPaymentMethod) => paymentMethod._id || paymentMethod.id || ''

const extractPaymentMethods = (response: PaymentMethodResponse): ApiPaymentMethod[] => {
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

const getTotalItems = (response: PaymentMethodResponse, items: ApiPaymentMethod[]) => {
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

const getLogoUrl = (logo: string) => {
  if (/^https?:\/\//.test(logo)) return logo
  return `${apiBaseUrl.value.replace(/\/api\/v\d+$/, '')}/${logo.replace(/^\//, '')}`
}

const formatAmount = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0))
}

const refreshPaymentMethods = async () => {
  isLoading.value = true

  try {
    const response = await $fetch<PaymentMethodResponse>(paymentMethodsEndpoint.value, {
      headers: requestHeaders.value,
      query: buildQuery()
    })

    const items = extractPaymentMethods(response)
    paymentMethods.value = items.map((paymentMethod) => ({
      ...paymentMethod,
      amount: Number(paymentMethod.amount || 0),
      currency: paymentMethod.currency || 'usd',
      isActive: Boolean(paymentMethod.isActive)
    }))
    totalItems.value = getTotalItems(response, items)
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  editingPaymentMethodId.value = null
  Object.assign(form, {
    logo: '',
    bankAccount: '',
    merchantName: '',
    merchantCity: '',
    amount: 0,
    currency: 'usd',
    storeLabel: '',
    phoneNumber: '',
    billNumber: '',
    terminalLabel: '',
    isActive: true
  })
  paymentMethodFormRef.value?.clearValidate()
}

const openCreateDialog = () => {
  if (!canCreatePaymentMethod.value) return

  resetForm()
  isDialogVisible.value = true
}

const openEditDialog = (paymentMethod: ApiPaymentMethod) => {
  if (!canUpdatePaymentMethod.value) return

  editingPaymentMethodId.value = getPaymentMethodId(paymentMethod)
  Object.assign(form, {
    logo: paymentMethod.logo || '',
    bankAccount: paymentMethod.bankAccount || '',
    merchantName: paymentMethod.merchantName || '',
    merchantCity: paymentMethod.merchantCity || '',
    amount: Number(paymentMethod.amount || 0),
    currency: paymentMethod.currency || 'usd',
    storeLabel: paymentMethod.storeLabel || '',
    phoneNumber: paymentMethod.phoneNumber || '',
    billNumber: paymentMethod.billNumber || '',
    terminalLabel: paymentMethod.terminalLabel || '',
    isActive: Boolean(paymentMethod.isActive)
  })
  isDialogVisible.value = true
}

const buildPayload = (): PaymentMethodForm => ({
  logo: form.logo.trim(),
  bankAccount: form.bankAccount.trim(),
  merchantName: form.merchantName.trim(),
  merchantCity: form.merchantCity.trim(),
  amount: Number(form.amount || 0),
  currency: form.currency,
  storeLabel: form.storeLabel.trim(),
  phoneNumber: form.phoneNumber.trim(),
  billNumber: form.billNumber.trim(),
  terminalLabel: form.terminalLabel.trim(),
  isActive: form.isActive
})

const submitPaymentMethod = async () => {
  if (!paymentMethodFormRef.value) return
  if (isEditing.value && !canUpdatePaymentMethod.value) return
  if (!isEditing.value && !canCreatePaymentMethod.value) return

  const isValid = await paymentMethodFormRef.value.validate().catch(() => false)
  if (!isValid) return

  isSaving.value = true

  try {
    const url = isEditing.value ? `${paymentMethodsEndpoint.value}/${editingPaymentMethodId.value}` : paymentMethodsEndpoint.value
    const method = isEditing.value ? 'PUT' : 'POST'

    await $fetch(url, {
      method,
      headers: requestHeaders.value,
      body: buildPayload()
    })

    ElMessage.success(isEditing.value ? t('paymentMethods.messages.updated') : t('paymentMethods.messages.created'))
    isDialogVisible.value = false
    await refreshPaymentMethods()
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isSaving.value = false
  }
}

const deletePaymentMethod = async (paymentMethod: ApiPaymentMethod) => {
  if (!canDeletePaymentMethod.value) return

  const paymentMethodId = getPaymentMethodId(paymentMethod)
  if (!paymentMethodId) {
    ElMessage.error(t('paymentMethods.messages.missingId'))
    return
  }

  try {
    await ElMessageBox.confirm(
      t('paymentMethods.confirmDelete.message', { merchantName: paymentMethod.merchantName }),
      t('paymentMethods.confirmDelete.title'),
      {
        confirmButtonText: t('paymentMethods.actions.delete'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await $fetch(`${paymentMethodsEndpoint.value}/${paymentMethodId}`, {
      method: 'DELETE',
      headers: requestHeaders.value
    })

    ElMessage.success(t('paymentMethods.messages.deleted'))
    await refreshPaymentMethods()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(getErrorMessage(error))
    }
  }
}

watch([currentPage, pageSize], () => {
  refreshPaymentMethods()
})

watch(search, () => {
  currentPage.value = 1
  refreshPaymentMethods()
})

onMounted(() => {
  refreshPaymentMethods()
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
