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
            <el-icon class="menu-icon">
              <Icon :name="item.icon" />
            </el-icon>
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

          <div class="flex items-center gap-2 sm:gap-3">
            <div class="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1" :aria-label="t('account.language')">
              <button
                v-for="localeItem in languageOptions"
                :key="localeItem.code"
                class="grid h-8 w-8 place-items-center rounded-md transition"
                :class="locale === localeItem.code
                  ? 'bg-white shadow-sm ring-1 ring-slate-200'
                  : 'opacity-60 hover:bg-white hover:opacity-100'"
                type="button"
                :title="t(localeItem.label)"
                :aria-label="t(localeItem.label)"
                :aria-pressed="locale === localeItem.code"
                @click="changeLocale(localeItem.code)"
              >
                <Icon :name="localeItem.icon" class="h-5 w-5" />
              </button>
            </div>

            <el-dropdown trigger="click" placement="bottom-end" @command="handleAccountCommand">
              <button
                class="flex min-w-0 items-center gap-2 rounded-lg border border-transparent p-1.5 text-left transition hover:border-slate-200 hover:bg-slate-50 sm:pr-2"
                type="button"
                :aria-label="t('account.menu')"
              >
                <el-avatar :size="36" :src="userProfileImageUrl" class="shrink-0 bg-emerald-600">
                  {{ userInitial }}
                </el-avatar>
                <span class="hidden min-w-0 sm:block">
                  <span class="block max-w-36 truncate text-sm font-semibold text-slate-800">{{ userDisplayName }}</span>
                  <span class="block max-w-36 truncate text-xs text-slate-500">{{ userSubtitle }}</span>
                </span>
                <Icon name="lucide:chevron-down" class="hidden h-4 w-4 shrink-0 text-slate-400 sm:block" />
              </button>

              <template #dropdown>
                <el-dropdown-menu class="admin-account-menu">
                  <div class="min-w-60 border-b border-slate-100 px-4 py-3">
                    <p class="truncate text-sm font-semibold text-slate-900">{{ userDisplayName }}</p>
                    <p class="mt-0.5 truncate text-xs text-slate-500">{{ user?.email || t('account.administrator') }}</p>
                  </div>
                  <el-dropdown-item v-if="canManageProfiles" command="profile">
                    <Icon name="lucide:user-round" class="mr-2 h-4 w-4" />
                    {{ t('account.profile') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="storefront">
                    <Icon name="lucide:store" class="mr-2 h-4 w-4" />
                    {{ t('account.storefront') }}
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout">
                    <Icon name="lucide:log-out" class="mr-2 h-4 w-4 text-rose-500" />
                    <span class="text-rose-600">{{ t('account.logout') }}</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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
const { t, locale, setLocale } = useI18n()
const { user, hasAnyPermission, clearAuth } = useAuth()

const isCollapsed = ref(false)
const userProfileImageSource = computed(() => user.value?.userProfile?.profile)
const { imageUrl: userProfileImageUrl } = useProfileImageUrl(userProfileImageSource)

const languageOptions = [
  { code: 'km' as const, label: 'account.languages.khmer', icon: 'emojione:flag-for-cambodia' },
  { code: 'en' as const, label: 'account.languages.english', icon: 'circle-flags:us' }
]

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

const canManageProfiles = computed(() => hasAnyPermission('user-profile.read'))

const currentTitle = computed(() => {
  const activeItem = [...menuItems]
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) => route.path.startsWith(item.path))
  return activeItem ? t(activeItem.label) : t('app.admin')
})

const userInitial = computed(() => {
  const profileName = [
    user.value?.userProfile?.firstName,
    user.value?.userProfile?.lastName
  ].filter(Boolean).join(' ')

  return (profileName || user.value?.username || user.value?.email || 'A').charAt(0).toUpperCase()
})

const userDisplayName = computed(() => {
  const profileName = [
    user.value?.userProfile?.firstName,
    user.value?.userProfile?.lastName
  ].filter(Boolean).join(' ')

  return profileName || user.value?.username || t('account.administrator')
})

const userSubtitle = computed(() => user.value?.email || t('account.administrator'))

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

const changeLocale = (value: 'en' | 'km') => {
  if (locale.value === value) return
  setLocale(value)
}

const handleAccountCommand = async (command: string | number | object) => {
  if (command === 'profile') {
    await navigateTo('/admin/system/user-profile')
    return
  }

  if (command === 'storefront') {
    await navigateTo('/')
    return
  }

  if (command === 'logout') await logout()
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

:deep(.admin-menu .menu-icon) {
  height: 20px;
  width: 20px;
  margin-right: 0;
  font-size: 20px;
}

:deep(.admin-menu .el-menu-item.is-active) {
  background: #ecfdf5;
  color: #047857;
}
</style>
