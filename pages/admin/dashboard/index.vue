<template>
  <div v-loading="isLoading" class="min-h-96 space-y-6">
    <section class="overflow-hidden rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 p-5 text-white shadow-sm sm:p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-sm font-medium text-emerald-100">{{ t('dashboard.overview') }}</p>
          <h2 class="mt-1 text-2xl font-bold">{{ t('dashboard.title', { year: selectedYear }) }}</h2>
          <p class="mt-1 text-sm text-emerald-100">{{ t('dashboard.description') }}</p>
        </div>

        <div class="flex items-center gap-2 rounded-lg bg-white/10 p-2 backdrop-blur">
          <Icon name="lucide:calendar-days" class="h-5 w-5 text-emerald-100" />
          <el-select v-model="selectedYear" class="year-select !w-28" :aria-label="t('dashboard.selectYear')">
            <el-option v-for="year in yearOptions" :key="year" :label="String(year)" :value="year" />
          </el-select>
        </div>
      </div>
    </section>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="card in statCards"
        :key="card.key"
        class="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-slate-500">{{ t(card.label) }}</p>
            <p class="mt-2 text-2xl font-bold tracking-tight text-slate-900">{{ card.value }}</p>
          </div>
          <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl" :class="card.iconClass">
            <Icon :name="card.icon" class="h-5 w-5" />
          </span>
        </div>
      </article>
    </div>

    <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-col gap-2 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="font-semibold text-slate-900">{{ t('dashboard.salesReport') }}</h2>
          <p class="mt-0.5 text-sm text-slate-500">{{ t('dashboard.salesReportHelp', { year: selectedYear }) }}</p>
        </div>
        <div class="flex items-center gap-4 text-xs text-slate-500">
          <span class="flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-sm bg-emerald-500" />{{ t('dashboard.income') }}</span>
          <span class="flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-full bg-sky-500" />{{ t('dashboard.orders') }}</span>
        </div>
      </div>

      <div class="overflow-x-auto p-5">
        <div class="grid min-w-[720px] grid-cols-12 gap-3">
          <div v-for="month in salesReport" :key="month.month" class="flex min-w-0 flex-col items-center">
            <div class="mb-2 flex h-7 items-center text-xs font-semibold text-slate-700">
              {{ formatCurrency(month.income) }}
            </div>
            <div class="relative flex h-52 w-full items-end justify-center rounded-t-lg bg-slate-50 px-2">
              <div
                class="w-full min-h-1 rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-500"
                :style="{ height: `${getIncomeBarHeight(month.income)}%` }"
              />
              <span class="absolute right-1 top-1 grid h-6 min-w-6 place-items-center rounded-full bg-sky-100 px-1 text-[11px] font-bold text-sky-700">
                {{ month.orders }}
              </span>
            </div>
            <p class="mt-2 truncate text-xs font-medium text-slate-500">{{ getMonthLabel(month.month) }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="font-semibold text-slate-900">{{ t('dashboard.recentOrders') }}</h2>
          <p class="mt-0.5 text-sm text-slate-500">{{ t('dashboard.recentOrdersHelp') }}</p>
        </div>
        <el-input v-model="search" class="w-full md:w-72" :placeholder="t('common.search')" clearable>
          <template #prefix><Icon name="lucide:search" class="h-4 w-4 text-slate-400" /></template>
        </el-input>
      </div>

      <div class="p-5">
        <el-table :data="paginatedOrders" stripe class="w-full" empty-text="No data">
          <el-table-column prop="code" :label="t('orders.code')" min-width="190" />
          <el-table-column :label="t('orders.customer')" min-width="210">
            <template #default="{ row }">
              <div>
                <p class="font-medium text-slate-900">{{ getCustomerName(row.customer) }}</p>
                <p class="text-xs text-slate-500">{{ row.customer?.email || '-' }}</p>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="t('orders.total')" min-width="120" align="right">
            <template #default="{ row }"><span class="font-semibold">{{ formatCurrency(row.totalAmount, row.paymentMethod?.currency) }}</span></template>
          </el-table-column>
          <el-table-column :label="t('dashboard.items')" min-width="90" align="center">
            <template #default="{ row }">{{ row.totalItems ?? getTotalItems(row) }}</template>
          </el-table-column>
          <el-table-column :label="t('common.status')" min-width="120">
            <template #default="{ row }"><el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag></template>
          </el-table-column>
          <el-table-column :label="t('common.date')" min-width="150">
            <template #default="{ row }">{{ formatDate(row.salingDate || row.createdAt) }}</template>
          </el-table-column>
        </el-table>

        <div v-if="filteredOrders.length" class="mt-5 flex justify-end">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[5, 10, 20]"
            :total="filteredOrders.length"
            background
            layout="total, sizes, prev, pager, next"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

type DashboardSummary = {
  totalIncome: number
  totalPendingItem: number
  totalCustomer: number
  totalUser: number
  totalCategory: number
  totalProduct: number
}

type SalesReportItem = { month: number; label?: string; income: number; orders: number }
type Customer = { username?: string; email?: string; userProfile?: { firstName?: string; lastName?: string } }
type RecentOrder = {
  _id?: string
  code?: string
  customer?: Customer
  salingDate?: string
  createdAt?: string
  status?: string
  paymentMethod?: { currency?: string }
  items?: Array<{ quantity?: number }>
  totalAmount?: number
  totalItems?: number
}
type DashboardData = { year: number; summary: DashboardSummary; salesReport: SalesReportItem[]; recentOrders: RecentOrder[] }
type DashboardResponse = { success?: boolean; message?: string; data?: DashboardData } | DashboardData

const { t, locale } = useI18n()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('auth_token')
const currentYear = new Date().getFullYear()

const selectedYear = ref(currentYear)
const isLoading = ref(false)
const search = ref('')
const currentPage = ref(1)
const pageSize = ref(5)
const dashboard = ref<DashboardData | null>(null)

const apiBaseUrl = computed(() => String(config.public.apiBaseUrl).replace(/\/$/, ''))
const yearOptions = computed(() => Array.from({ length: 7 }, (_, index) => currentYear + 1 - index))
const summary = computed<DashboardSummary>(() => dashboard.value?.summary || {
  totalIncome: 0,
  totalPendingItem: 0,
  totalCustomer: 0,
  totalUser: 0,
  totalCategory: 0,
  totalProduct: 0
})
const salesReport = computed(() => Array.from({ length: 12 }, (_, index) => {
  return dashboard.value?.salesReport?.find((item) => item.month === index + 1)
    || { month: index + 1, income: 0, orders: 0 }
}))
const recentOrders = computed(() => dashboard.value?.recentOrders || [])
const maxIncome = computed(() => Math.max(...salesReport.value.map((item) => Number(item.income || 0)), 1))

const statCards = computed(() => [
  { key: 'income', label: 'dashboard.totalIncome', value: formatCurrency(summary.value.totalIncome), icon: 'lucide:circle-dollar-sign', iconClass: 'bg-emerald-50 text-emerald-600' },
  { key: 'pending', label: 'dashboard.totalPendingItem', value: formatNumber(summary.value.totalPendingItem), icon: 'lucide:clock-3', iconClass: 'bg-amber-50 text-amber-600' },
  { key: 'customers', label: 'dashboard.totalCustomer', value: formatNumber(summary.value.totalCustomer), icon: 'lucide:user-round', iconClass: 'bg-sky-50 text-sky-600' },
  { key: 'users', label: 'dashboard.totalUser', value: formatNumber(summary.value.totalUser), icon: 'lucide:users', iconClass: 'bg-violet-50 text-violet-600' },
  { key: 'categories', label: 'dashboard.totalCategory', value: formatNumber(summary.value.totalCategory), icon: 'lucide:tags', iconClass: 'bg-rose-50 text-rose-600' },
  { key: 'products', label: 'dashboard.totalProduct', value: formatNumber(summary.value.totalProduct), icon: 'lucide:package', iconClass: 'bg-indigo-50 text-indigo-600' }
])

const filteredOrders = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  if (!keyword) return recentOrders.value
  return recentOrders.value.filter((order) => [
    order.code,
    order.customer?.username,
    order.customer?.email,
    getCustomerName(order.customer),
    order.status
  ].some((value) => String(value || '').toLowerCase().includes(keyword)))
})

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredOrders.value.slice(start, start + pageSize.value)
})

const getLocaleCode = () => locale.value === 'km' ? 'km-KH' : 'en-US'
const formatNumber = (value?: number) => new Intl.NumberFormat(getLocaleCode()).format(Number(value || 0))
const formatCurrency = (value?: number, currency = 'USD') => new Intl.NumberFormat(getLocaleCode(), {
  style: 'currency',
  currency: String(currency || 'USD').toUpperCase(),
  maximumFractionDigits: 2
}).format(Number(value || 0))
const getMonthLabel = (month: number) => new Intl.DateTimeFormat(getLocaleCode(), { month: 'short' }).format(new Date(2024, month - 1, 1))
const formatDate = (value?: string) => value
  ? new Intl.DateTimeFormat(getLocaleCode(), { year: 'numeric', month: 'short', day: '2-digit' }).format(new Date(value))
  : '-'
const getIncomeBarHeight = (income: number) => income > 0 ? Math.max((Number(income) / maxIncome.value) * 100, 4) : 1
const getCustomerName = (customer?: Customer) => [customer?.userProfile?.firstName, customer?.userProfile?.lastName].filter(Boolean).join(' ') || customer?.username || '-'
const getTotalItems = (order: RecentOrder) => (order.items || []).reduce((total, item) => total + Number(item.quantity || 0), 0)
const getStatusType = (status?: string) => ({ completed: 'success', pending: 'warning', shipping: 'primary', cancelled: 'danger' }[String(status || '').toLowerCase()] || 'info') as 'success' | 'warning' | 'primary' | 'danger' | 'info'
const getStatusLabel = (status?: string) => {
  const key = String(status || 'unknown').toLowerCase()
  const translationKey = `orders.status.${key}`
  return t(translationKey) === translationKey ? key.charAt(0).toUpperCase() + key.slice(1) : t(translationKey)
}
const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string; error?: string } }).data
    return data?.message || data?.error || t('common.errors.generic')
  }
  return t('common.errors.generic')
}

const fetchDashboard = async () => {
  isLoading.value = true
  try {
    const response = await $fetch<DashboardResponse>(`${apiBaseUrl.value}/dashboard`, {
      headers: authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {},
      query: { year: selectedYear.value }
    })
    dashboard.value = 'data' in response && response.data ? response.data : response as DashboardData
    currentPage.value = 1
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isLoading.value = false
  }
}

watch(selectedYear, fetchDashboard)
watch(search, () => { currentPage.value = 1 })
onMounted(fetchDashboard)
</script>

<style scoped>
:deep(.year-select .el-select__wrapper) {
  background: white;
  box-shadow: none;
}
</style>
