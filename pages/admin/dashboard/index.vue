<template>
  <div class="space-y-6">
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div v-for="card in statCards" :key="card.label" class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-sm text-slate-500">{{ t(card.label) }}</p>
          <Icon :name="card.icon" class="h-5 w-5 text-emerald-600" />
        </div>
        <p class="mt-3 text-2xl font-semibold">{{ card.value }}</p>
        <p class="mt-1 text-xs text-slate-500">{{ t(card.caption) }}</p>
      </div>
    </div>

    <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-base font-semibold">{{ t('dashboard.recentOrders') }}</h2>
          <p class="text-sm text-slate-500">{{ t('dashboard.recentOrdersHelp') }}</p>
        </div>
        <el-input v-model="search" class="max-w-xs" :placeholder="t('common.search')" clearable>
          <template #prefix>
            <Icon name="lucide:search" class="h-4 w-4 text-slate-400" />
          </template>
        </el-input>
      </div>

      <div class="p-5">
        <el-table :data="paginatedOrders" stripe class="w-full">
          <el-table-column prop="code" :label="t('orders.code')" min-width="120" />
          <el-table-column prop="customer" :label="t('orders.customer')" min-width="160" />
          <el-table-column prop="total" :label="t('orders.total')" min-width="120" />
          <el-table-column prop="status" :label="t('common.status')" min-width="130">
            <template #default="{ row }">
              <el-tag :type="row.status === 'Completed' ? 'success' : row.status === 'Pending' ? 'warning' : 'info'">
                {{ t(`orders.status.${row.status.toLowerCase()}`) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="date" :label="t('common.date')" min-width="130" />
        </el-table>

        <div class="mt-5 flex justify-end">
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
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const { t } = useI18n()

const search = ref('')
const currentPage = ref(1)
const pageSize = ref(5)

const statCards = [
  { label: 'dashboard.totalOrders', value: '1,284', caption: 'dashboard.totalOrdersCaption', icon: 'lucide:shopping-cart' },
  { label: 'dashboard.activeUsers', value: '326', caption: 'dashboard.activeUsersCaption', icon: 'lucide:users' },
  { label: 'dashboard.revenue', value: '$48,920', caption: 'dashboard.revenueCaption', icon: 'lucide:banknote' },
  { label: 'dashboard.pendingTasks', value: '18', caption: 'dashboard.pendingTasksCaption', icon: 'lucide:clock-3' },
]

const orders = [
  { code: 'ORD-1001', customer: 'Sok Dara', total: '$240.00', status: 'Completed', date: '2026-06-25' },
  { code: 'ORD-1002', customer: 'Malis Chen', total: '$128.50', status: 'Pending', date: '2026-06-25' },
  { code: 'ORD-1003', customer: 'Nita Kim', total: '$560.00', status: 'Processing', date: '2026-06-24' },
  { code: 'ORD-1004', customer: 'Chan Rotha', total: '$89.90', status: 'Completed', date: '2026-06-24' },
  { code: 'ORD-1005', customer: 'Vireak Long', total: '$310.40', status: 'Pending', date: '2026-06-23' },
  { code: 'ORD-1006', customer: 'Srey Pov', total: '$72.00', status: 'Completed', date: '2026-06-23' },
  { code: 'ORD-1007', customer: 'Piseth Orn', total: '$645.75', status: 'Processing', date: '2026-06-22' },
]

const filteredOrders = computed(() => {
  const keyword = search.value.toLowerCase().trim()
  if (!keyword) return orders
  return orders.filter((order) => Object.values(order).some((value) => value.toLowerCase().includes(keyword)))
})

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredOrders.value.slice(start, start + pageSize.value)
})

watch(search, () => {
  currentPage.value = 1
})
</script>
