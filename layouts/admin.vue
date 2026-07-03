<template>
  <div class="min-h-screen bg-slate-100 text-slate-900">
    <el-container class="min-h-screen">
      <el-aside
        :width="isCollapsed ? '76px' : '248px'"
        class="admin-sidebar hidden border-r border-slate-200 bg-white transition-all duration-200 lg:block"
      >
        <div class="flex h-16 items-center gap-3 border-b border-slate-200 px-4">
          <div class="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
            OM
          </div>
          <div v-show="!isCollapsed" class="min-w-0">
            <p class="truncate text-sm font-semibold">{{ t('app.name') }}</p>
            <p class="truncate text-xs text-slate-500">{{ t('app.admin') }}</p>
          </div>
        </div>

        <el-menu
          :collapse="isCollapsed"
          :default-active="route.path"
          class="admin-menu border-r-0"
          router
        >
          <el-menu-item v-for="item in visibleMenuItems" :key="item.path" :index="item.path">
            <Icon :name="item.icon" class="h-5 w-5" />
            <template #title>{{ t(item.label) }}</template>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
          <div class="flex items-center gap-3">
            <el-button circle text @click="toggleSidebar">
              <Icon :name="isCollapsed ? 'lucide:panel-left-open' : 'lucide:panel-left-close'" class="h-5 w-5" />
            </el-button>
            <div>
              <h1 class="text-base font-semibold leading-6">{{ currentTitle }}</h1>
              <p class="text-xs text-slate-500">{{ t('app.subtitle') }}</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <el-select v-model="selectedLocale" class="w-32" size="small" @change="changeLocale">
              <el-option
                v-for="localeItem in locales"
                :key="localeItem.code"
                :label="localeItem.name || localeItem.code"
                :value="localeItem.code"
              />
            </el-select>
            <el-avatar :size="34" class="bg-emerald-600">{{ userInitial }}</el-avatar>
            <el-tooltip content="Logout" placement="bottom">
              <el-button circle text type="danger" @click="logout">
                <Icon name="lucide:log-out" class="h-5 w-5" />
              </el-button>
            </el-tooltip>
          </div>
        </el-header>

        <el-main class="p-4 lg:p-6">
          <slot />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { t, locale, locales, setLocale } = useI18n()
const { user, hasAnyPermission, clearAuth } = useAuth()

const isCollapsed = ref(false)
const selectedLocale = ref(locale.value)

const menuItems = [
  { path: '/admin/dashboard', label: 'menu.dashboard', icon: 'lucide:layout-dashboard' },
  { path: '/admin/master-data/category', label: 'menu.categories', icon: 'lucide:tags', permission: 'category.read' },
  { path: '/admin/master-data/product', label: 'menu.products', icon: 'lucide:package', permission: 'product.read' },
  { path: '/admin/inventory/stock', label: 'menu.stocks', icon: 'lucide:boxes', permission: 'stock.read' },
  { path: '/admin/inventory/stock-in', label: 'menu.stockIns', icon: 'lucide:package-plus', permission: 'stock-in.read' },
  { path: '/admin/inventory/stock-adjustment', label: 'menu.stockAdjustments', icon: 'lucide:package-check', permission: 'stock-adjustment.read' },
  { path: '/admin/saling/banner', label: 'menu.banners', icon: 'lucide:image', permission: 'banner.read' },
  { path: '/admin/saling/sale', label: 'menu.sales', icon: 'lucide:shopping-cart', permission: 'sale.read' },
  { path: '/admin/system/payment-method', label: 'menu.paymentMethods', icon: 'lucide:credit-card', permission: 'payment-method.read' },
  { path: '/admin/system/user-profile', label: 'menu.userProfiles', icon: 'lucide:id-card', permission: 'user-profile.read' },
  { path: '/admin/system/user', label: 'menu.users', icon: 'lucide:users', permission: 'user.read' },
  { path: '/admin/system/role', label: 'menu.roles', icon: 'lucide:shield-check', permission: 'role.read' },
]

const visibleMenuItems = computed(() => {
  return menuItems.filter((item) => hasAnyPermission(item.permission))
})

const currentTitle = computed(() => {
  const activeItem = [...menuItems]
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) => route.path.startsWith(item.path))
  return activeItem ? t(activeItem.label) : t('app.admin')
})

const userInitial = computed(() => {
  return (user.value?.username || user.value?.email || 'A').charAt(0).toUpperCase()
})

watch(locale, (value) => {
  selectedLocale.value = value
})

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

const changeLocale = (value: string) => {
  setLocale(value)
}

const logout = async () => {
  clearAuth()
  await navigateTo('/auth/login')
}
</script>

<style scoped>
.admin-sidebar {
  box-shadow: 0 10px 30px rgb(15 23 42 / 0.04);
}

:deep(.admin-menu) {
  --el-menu-item-height: 48px;
  padding: 12px;
}

:deep(.admin-menu .el-menu-item) {
  border-radius: 8px;
  gap: 12px;
  margin-bottom: 4px;
}

:deep(.admin-menu .el-menu-item.is-active) {
  background: #ecfdf5;
  color: #047857;
}
</style>
