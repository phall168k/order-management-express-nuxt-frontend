<template>
  <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div class="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-base font-semibold">{{ t('roles.title') }}</h2>
        <p class="text-sm text-slate-500">{{ t('roles.description') }}</p>
      </div>
      <el-input v-model="search" class="max-w-xs" :placeholder="t('common.search')" clearable>
        <template #prefix>
          <Icon name="lucide:search" class="h-4 w-4 text-slate-400" />
        </template>
      </el-input>
    </div>

    <div class="p-5">
      <el-table :data="paginatedRoles" stripe class="w-full">
        <el-table-column prop="name" :label="t('roles.name')" min-width="160" />
        <el-table-column prop="description" :label="t('roles.roleDescription')" min-width="240" />
        <el-table-column prop="users" :label="t('roles.users')" min-width="110" />
        <el-table-column prop="permissions" :label="t('roles.permissions')" min-width="150" />
        <el-table-column prop="status" :label="t('common.status')" min-width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'Enabled' ? 'success' : 'info'">
              {{ t(`roles.status.${row.status.toLowerCase()}`) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-5 flex justify-end">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20]"
          :total="filteredRoles.length"
          background
          layout="total, sizes, prev, pager, next"
        />
      </div>
    </div>
  </section>
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

const roles = [
  { name: 'Administrator', description: 'Full system access', users: 2, permissions: 24, status: 'Enabled' },
  { name: 'Manager', description: 'Manage orders and users', users: 5, permissions: 16, status: 'Enabled' },
  { name: 'Staff', description: 'Process daily orders', users: 18, permissions: 10, status: 'Enabled' },
  { name: 'Auditor', description: 'Read reports and logs', users: 3, permissions: 7, status: 'Enabled' },
  { name: 'Guest', description: 'Limited read-only access', users: 1, permissions: 3, status: 'Disabled' },
  { name: 'Support', description: 'Customer support tools', users: 6, permissions: 12, status: 'Enabled' },
]

const filteredRoles = computed(() => {
  const keyword = search.value.toLowerCase().trim()
  if (!keyword) return roles
  return roles.filter((role) => Object.values(role).some((value) => String(value).toLowerCase().includes(keyword)))
})

const paginatedRoles = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRoles.value.slice(start, start + pageSize.value)
})

watch(search, () => {
  currentPage.value = 1
})
</script>
