<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div class="bg-emerald-50 text-emerald-800">
        <div class="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 text-xs sm:px-6 lg:px-8">
          <ul class="flex items-center gap-4">
            <li class="flex items-center gap-1.5">
              <Icon name="lucide:truck" class="h-4 w-4" />
              <span class="hidden sm:inline">{{ $t('header.free_delivery_for_orders_over') }}</span>
            </li>
            <li class="hidden items-center gap-1.5 md:flex">
              <Icon name="lucide:badge-percent" class="h-4 w-4" />
              <span>{{ $t('header.daily_deals_up_to') }}</span>
            </li>
          </ul>

          <div class="flex items-center gap-3">
            <NuxtLink v-if="canShowAdminLink" to="/admin/dashboard" class="hidden font-medium hover:text-emerald-950 sm:inline">
              {{ $t('header.admin') }}
            </NuxtLink>
            <button
              class="grid h-6 w-6 place-items-center rounded-full transition hover:bg-emerald-100"
              :class="locale === 'km' ? 'bg-emerald-100 ring-1 ring-emerald-500' : ''"
              type="button"
              aria-label="Khmer language"
              :aria-pressed="locale === 'km'"
              @click="changeLocale('km')"
            >
              <Icon name="emojione:flag-for-cambodia" class="h-4 w-4" />
            </button>
            <button
              class="grid h-6 w-6 place-items-center rounded-full transition hover:bg-emerald-100"
              :class="locale === 'en' ? 'bg-emerald-100 ring-1 ring-emerald-500' : ''"
              type="button"
              aria-label="English language"
              :aria-pressed="locale === 'en'"
              @click="changeLocale('en')"
            >
              <Icon name="circle-flags:us" class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex min-h-16 items-center gap-3 py-3">
          <NuxtLink to="/" class="flex min-w-0 shrink-0 items-center gap-2">
            <span class="grid h-10 w-10 place-items-center rounded-lg bg-emerald-700 text-white">
              <Icon name="lucide:shopping-bag" class="h-6 w-6" />
            </span>
            <span class="hidden text-lg font-bold text-emerald-800 sm:inline">{{ $t('app.title') }}</span>
          </NuxtLink>

          <form class="relative hidden flex-1 md:block" @submit.prevent="submitSearch">
            <Icon name="lucide:search" class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              v-model="search"
              class="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-11 pr-28 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              type="search"
              :placeholder="$t('header.search_product_or_category')"
            >
            <button
              class="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
              type="submit"
            >
              {{ $t('header.search') }}
            </button>
          </form>

          <div class="flex items-center gap-1">
            <button
              class="relative grid h-10 w-10 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              type="button"
              aria-label="Cart"
              @click="openCartDrawer"
            >
              <Icon name="lucide:shopping-cart" class="h-5 w-5" />
              <span
                v-if="pickedProductsCount"
                class="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white"
              >
                {{ pickedProductsCount > 99 ? '99+' : pickedProductsCount }}
              </span>
            </button>
            <button
              class="relative grid h-10 w-10 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              type="button"
              aria-label="Cart"
            >
              <Icon name="solar:bell-outline" class="h-5 w-5" />
              <span
                class="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white"
              >
                10
              </span>
            </button>
            <el-dropdown trigger="click" @command="handleAccountCommand">
              <button class="grid h-10 w-10 place-items-center overflow-hidden rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950" type="button" aria-label="Account">
                <img
                  v-if="userProfileImageUrl"
                  :src="userProfileImageUrl"
                  :alt="userProfileName || 'Account'"
                  class="h-8 w-8 rounded-full object-cover"
                >
                <Icon v-else name="lucide:user-round" class="h-5 w-5" />
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <template v-if="isAuthenticated">
                    <el-dropdown-item command="view-profile">
                      <Icon name="lucide:user-round" class="mr-2 h-4 w-4" />
                      View profile
                    </el-dropdown-item>
                    <el-dropdown-item command="edit-profile">
                      <Icon name="lucide:pencil" class="mr-2 h-4 w-4" />
                      Edit profile
                    </el-dropdown-item>
                    <el-dropdown-item command="my-orders">
                      <Icon name="lucide:receipt-text" class="mr-2 h-4 w-4" />
                      My Order
                    </el-dropdown-item>
                    <el-dropdown-item command="change-password">
                      <Icon name="lucide:key-round" class="mr-2 h-4 w-4" />
                      Change password
                    </el-dropdown-item>
                    <el-dropdown-item divided command="logout">
                      <Icon name="lucide:log-out" class="mr-2 h-4 w-4" />
                      Logout
                    </el-dropdown-item>
                  </template>
                  <el-dropdown-item v-else command="login">
                    <Icon name="lucide:log-in" class="mr-2 h-4 w-4" />
                    Sign in
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <form class="relative pb-3 md:hidden" @submit.prevent="submitSearch">
          <Icon name="lucide:search" class="pointer-events-none absolute left-4 top-5 h-5 w-5 text-slate-400" />
          <input
            v-model="search"
            class="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            type="search"
            placeholder="Search products"
          >
        </form>
      </div>
    </header>

    <main>
      <slot />
    </main>

    <el-drawer v-model="isCartDrawerVisible" :title="$t('cartDrawer.title')" direction="rtl" size="420px">
      <div v-loading="isPickedProductsLoading" class="flex min-h-full flex-col">
        <div v-if="pickedProducts.length" class="flex-1 space-y-3">
          <div
            v-for="order in pickedProducts"
            :key="getPickedOrderId(order)"
            class="grid grid-cols-[72px_1fr] gap-3 rounded-lg border border-slate-200 bg-white p-3"
          >
            <div class="overflow-hidden rounded-md border border-slate-200 bg-slate-100">
              <img :src="getCartProductImage(order)" :alt="getCartProductName(order)" class="aspect-square h-full w-full object-cover">
            </div>
            <div class="min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-slate-950">{{ getCartProductName(order) }}</p>
                  <p class="mt-0.5 text-xs text-slate-500">{{ getCartProductCode(order) }}</p>
                </div>
                <button
                  class="grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  type="button"
                  :aria-label="$t('cartDrawer.removeProduct')"
                  @click="removeCartOrder(order)"
                >
                  <Icon name="lucide:trash-2" class="h-4 w-4" />
                </button>
              </div>

              <div class="mt-3 flex items-center justify-between gap-3">
                <div class="flex h-8 items-center rounded-md border border-slate-200">
                  <button
                    class="grid h-8 w-8 place-items-center text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                    type="button"
                    :disabled="Number(order.quantity || 1) <= 1"
                    :aria-label="$t('cartDrawer.decreaseQuantity')"
                    @click="updateCartQuantity(order, Number(order.quantity || 1) - 1)"
                  >
                    <Icon name="lucide:minus" class="h-4 w-4" />
                  </button>
                  <span class="grid h-8 min-w-8 place-items-center border-x border-slate-200 px-2 text-sm font-semibold text-slate-800">{{ order.quantity || 1 }}</span>
                  <button
                    class="grid h-8 w-8 place-items-center text-slate-500 hover:bg-slate-50"
                    type="button"
                    :aria-label="$t('cartDrawer.increaseQuantity')"
                    @click="updateCartQuantity(order, Number(order.quantity || 1) + 1)"
                  >
                    <Icon name="lucide:plus" class="h-4 w-4" />
                  </button>
                </div>

                <p class="text-sm font-bold text-emerald-700">{{ formatCartPrice(getCartOrderTotal(order)) }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="grid flex-1 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <div>
            <Icon name="lucide:shopping-cart" class="mx-auto h-10 w-10 text-slate-300" />
            <h3 class="mt-3 text-base font-semibold text-slate-950">{{ $t('cartDrawer.emptyTitle') }}</h3>
            <p class="mt-1 text-sm text-slate-500">{{ $t('cartDrawer.emptyDescription') }}</p>
          </div>
        </div>

        <div v-if="pickedProducts.length" class="mt-4 border-t border-slate-200 pt-4">
          <div class="flex items-center justify-between text-sm">
            <span class="font-medium text-slate-600">{{ $t('cartDrawer.total') }}</span>
            <span class="text-lg font-bold text-slate-950">{{ formatCartPrice(cartTotal) }}</span>
          </div>
        </div>
      </div>
    </el-drawer>

    <el-dialog v-model="isOrderHistoryVisible" title="My Orders" width="min(960px, 94vw)" destroy-on-close>
      <div v-loading="orderHistoryLoading" class="min-h-52">
        <div v-if="orderHistory.length" class="space-y-3">
          <article v-for="sale in orderHistory" :key="sale._id || sale.id" class="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div class="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="font-bold text-slate-950">{{ sale.code }}</h3>
                  <el-tag :type="getOrderStatusType(sale.status)" size="small">{{ formatOrderStatus(sale.status) }}</el-tag>
                </div>
                <p class="mt-1 text-xs text-slate-500">{{ formatOrderDate(sale.salingDate || sale.createdAt) }} · {{ sale.items?.length || 0 }} product{{ sale.items?.length === 1 ? '' : 's' }}</p>
              </div>
              <div class="flex items-center justify-between gap-4 sm:justify-end">
                <div class="text-left sm:text-right">
                  <p class="text-xs text-slate-500">Total</p>
                  <p class="font-bold text-emerald-700">{{ formatCartPrice(getSaleHistoryTotal(sale)) }}</p>
                </div>
                <el-button text circle :aria-label="expandedOrderId === (sale._id || sale.id) ? 'Hide details' : 'Show details'" @click="toggleOrderDetails(sale)">
                  <Icon :name="expandedOrderId === (sale._id || sale.id) ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="h-5 w-5" />
                </el-button>
              </div>
            </div>

            <div v-if="expandedOrderId === (sale._id || sale.id)" class="border-t border-slate-200 bg-slate-50 p-4">
              <dl class="mb-4 grid gap-3 text-sm sm:grid-cols-3">
                <div><dt class="text-xs text-slate-500">Payment</dt><dd class="mt-1 font-medium text-slate-800">{{ getSalePaymentLabel(sale) }}</dd></div>
                <div><dt class="text-xs text-slate-500">Delivery address</dt><dd class="mt-1 font-medium text-slate-800">{{ sale.address || '-' }}</dd></div>
                <div><dt class="text-xs text-slate-500">Note</dt><dd class="mt-1 font-medium text-slate-800">{{ sale.note || '-' }}</dd></div>
              </dl>
              <div class="overflow-x-auto rounded-md border border-slate-200 bg-white">
                <table class="w-full min-w-[560px] text-left text-sm">
                  <thead class="bg-slate-100 text-xs uppercase text-slate-500"><tr><th class="px-3 py-2">Product</th><th class="px-3 py-2 text-right">Price</th><th class="px-3 py-2 text-right">Discount</th><th class="px-3 py-2 text-right">Qty</th><th class="px-3 py-2 text-right">Subtotal</th></tr></thead>
                  <tbody><tr v-for="(item, index) in sale.items || []" :key="item._id || item.id || index" class="border-t border-slate-100"><td class="px-3 py-3"><p class="font-medium text-slate-900">{{ getSaleItemName(item) }}</p><p class="text-xs text-slate-500">{{ getSaleItemCode(item) }}</p></td><td class="px-3 py-3 text-right">{{ formatCartPrice(Number(item.unitPrice || 0)) }}</td><td class="px-3 py-3 text-right">{{ formatCartPrice(Number(item.discount || 0)) }}</td><td class="px-3 py-3 text-right">{{ item.quantity || 0 }}</td><td class="px-3 py-3 text-right font-semibold">{{ formatCartPrice(getSaleItemTotal(item)) }}</td></tr></tbody>
                </table>
              </div>
            </div>
          </article>

          <div class="flex justify-end pt-2">
            <el-pagination v-model:current-page="orderHistoryPage" :page-size="orderHistoryLimit" :total="orderHistoryTotal" background layout="total, prev, pager, next" @current-change="fetchOrderHistory" />
          </div>
        </div>
        <div v-else-if="!orderHistoryLoading" class="grid min-h-52 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <div><Icon name="lucide:receipt-text" class="mx-auto h-10 w-10 text-slate-300" /><h3 class="mt-3 font-semibold text-slate-950">No orders yet</h3><p class="mt-1 text-sm text-slate-500">Your completed checkouts will appear here.</p></div>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="isProfileViewVisible" title="Profile" width="680px" destroy-on-close>
      <div v-loading="profileLoading" class="min-h-40">
        <div v-if="profileViewData" class="grid gap-5 md:grid-cols-[120px_1fr]">
          <div class="grid place-items-start">
            <div class="grid h-24 w-24 place-items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50">
              <img
                v-if="profileViewImageUrl"
                :src="profileViewImageUrl"
                :alt="profileViewName || 'Profile'"
                class="h-full w-full object-cover"
              >
              <Icon v-else name="lucide:user-round" class="h-8 w-8 text-slate-400" />
            </div>
          </div>

          <dl class="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt class="text-xs text-slate-500">Username</dt>
              <dd class="mt-1 font-medium text-slate-950">{{ profileViewData.username || '-' }}</dd>
            </div>
            <div>
              <dt class="text-xs text-slate-500">Email</dt>
              <dd class="mt-1 font-medium text-slate-950">{{ profileViewData.email || '-' }}</dd>
            </div>
            <div>
              <dt class="text-xs text-slate-500">Full name</dt>
              <dd class="mt-1 font-medium text-slate-950">{{ profileViewName || '-' }}</dd>
            </div>
            <div>
              <dt class="text-xs text-slate-500">Gender</dt>
              <dd class="mt-1 font-medium text-slate-950">{{ profileViewData.userProfile?.gender || '-' }}</dd>
            </div>
            <div>
              <dt class="text-xs text-slate-500">Date of birth</dt>
              <dd class="mt-1 font-medium text-slate-950">{{ formatDate(profileViewData.userProfile?.dob) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-slate-500">Phone</dt>
              <dd class="mt-1 font-medium text-slate-950">{{ profileViewData.userProfile?.phoneNumber || '-' }}</dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-xs text-slate-500">Address</dt>
              <dd class="mt-1 font-medium text-slate-950">{{ profileViewData.userProfile?.address || '-' }}</dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-xs text-slate-500">Note</dt>
              <dd class="mt-1 font-medium text-slate-950">{{ profileViewData.userProfile?.note || '-' }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="isProfileEditVisible" title="Edit profile" width="760px" destroy-on-close>
      <el-form
        ref="profileFormRef"
        :model="profileForm"
        :rules="profileRules"
        label-position="top"
        @submit.prevent="submitProfile"
      >
        <div class="grid gap-x-4 md:grid-cols-2">
          <el-form-item label="Username" prop="username">
            <el-input v-model="profileForm.username" autocomplete="username" />
          </el-form-item>
          <el-form-item label="Email" prop="email">
            <el-input v-model="profileForm.email" autocomplete="email" />
          </el-form-item>
          <el-form-item label="First name" prop="firstName">
            <el-input v-model="profileForm.firstName" autocomplete="given-name" />
          </el-form-item>
          <el-form-item label="Last name" prop="lastName">
            <el-input v-model="profileForm.lastName" autocomplete="family-name" />
          </el-form-item>
          <el-form-item label="Gender" prop="gender">
            <el-select v-model="profileForm.gender" class="w-full">
              <el-option label="Male" value="male" />
              <el-option label="Female" value="female" />
              <el-option label="Other" value="other" />
            </el-select>
          </el-form-item>
          <el-form-item label="Date of birth" prop="dob">
            <el-date-picker
              v-model="profileForm.dob"
              class="!w-full"
              format="YYYY-MM-DD"
              type="date"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="Phone number" prop="phoneNumber">
            <el-input v-model="profileForm.phoneNumber" autocomplete="tel" />
          </el-form-item>
          <el-form-item label="Address" prop="address">
            <el-input v-model="profileForm.address" autocomplete="street-address" />
          </el-form-item>
          <el-form-item class="md:col-span-2" label="Note" prop="note">
            <el-input v-model="profileForm.note" :rows="3" type="textarea" />
          </el-form-item>
          <el-form-item class="md:col-span-2" label="Profile image" prop="profile">
            <SingleUpload v-model="profileUploadValue" class="w-full" />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="isProfileEditVisible = false">Cancel</el-button>
          <el-button type="primary" :loading="profileSaving" @click="submitProfile">Save</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="isPasswordDialogVisible" title="Change password" width="520px" destroy-on-close>
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-position="top"
        @submit.prevent="submitPassword"
      >
        <el-form-item label="Current password" prop="currentPassword">
          <el-input v-model="passwordForm.currentPassword" autocomplete="current-password" show-password type="password" />
        </el-form-item>
        <el-form-item label="New password" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" autocomplete="new-password" show-password type="password" />
        </el-form-item>
        <el-form-item label="Confirm password" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" autocomplete="new-password" show-password type="password" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="isPasswordDialogVisible = false">Cancel</el-button>
          <el-button type="primary" :loading="passwordSaving" @click="submitPassword">Save</el-button>
        </div>
      </template>
    </el-dialog>

    <footer class="border-t border-slate-200 bg-white">
      <div class="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <NuxtLink to="/" class="inline-flex items-center gap-2">
            <span class="grid h-10 w-10 place-items-center rounded-lg bg-emerald-700 text-white">
              <Icon name="lucide:shopping-bag" class="h-6 w-6" />
            </span>
            <span class="text-lg font-bold text-emerald-800">OrderMart</span>
          </NuxtLink>
          <p class="mt-4 max-w-sm text-sm leading-6 text-slate-600">
            {{ $t('footer.fast_ordering_for_daily_essentials_fresh_stock_and_simple_product_discovery') }}
          </p>
          <div class="mt-5 flex items-center gap-2">
            <a
              v-for="social in socialLinks"
              :key="social.label"
              :href="social.href"
              class="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              :aria-label="social.label"
            >
              <Icon :name="social.icon" class="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h3 class="text-sm font-semibold text-slate-950">{{ $t('footer.shop') }}</h3>
          <ul class="mt-4 space-y-3 text-sm text-slate-600">
            <li v-for="item in footerShopLinks" :key="item.to">
              <NuxtLink :to="item.to" class="transition hover:text-emerald-700">{{ $t(item.label) }}</NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="text-sm font-semibold text-slate-950">{{ $t('footer.support') }}</h3>
          <ul class="mt-4 space-y-3 text-sm text-slate-600">
            <li v-for="item in footerSupportLinks" :key="item.to">
              <NuxtLink :to="item.to" class="transition hover:text-emerald-700">{{ $t(item.label) }}</NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="text-sm font-semibold text-slate-950">{{ $t('footer.contact') }}</h3>
          <ul class="mt-4 space-y-3 text-sm text-slate-600">
            <li class="flex gap-2">
              <Icon name="lucide:map-pin" class="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <span>Phnom Penh, Cambodia</span>
            </li>
            <li class="flex gap-2">
              <Icon name="lucide:phone" class="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <a class="transition hover:text-emerald-700" href="tel:+85512345678">+855 12 345 678</a>
            </li>
            <li class="flex gap-2">
              <Icon name="lucide:mail" class="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <a class="transition hover:text-emerald-700" href="mailto:support@ordermart.local">support@ordermart.local</a>
            </li>
          </ul>
        </div>
      </div>

      <div class="border-t border-slate-200">
        <div class="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>{{ $t('footer.copyrice') }}</p>
          <div class="flex flex-wrap gap-x-4 gap-y-2">
            <NuxtLink to="/" class="transition hover:text-emerald-700">{{ $t('footer.privacy') }}</NuxtLink>
            <NuxtLink to="/" class="transition hover:text-emerald-700">{{ $t('footer.terms') }}</NuxtLink>
            <NuxtLink v-if="canShowAdminLink" to="/admin/dashboard" class="transition hover:text-emerald-700">{{ $t('footer.admin_console') }}</NuxtLink>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import SingleUpload from '~/@core/components/SingleUpload.vue'
import type { AuthUser, AuthUserProfile } from '~/composables/useAuth'
import type { PickedOrder, PickedProduct, PickedProductThumbnail } from '~/composables/usePickedProducts'

const route = useRoute()
const router = useRouter()
const { locale, setLocale } = useI18n()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('auth_token')
const { user, isAuthenticated, setAuth, clearAuth } = useAuth()
const {
  pickedProducts,
  pickedProductsCount,
  isPickedProductsLoading,
  fetchPickedProducts,
  updatePickedQuantity,
  removePickedProduct,
  getPickedProductId,
  getPickedOrderId
} = usePickedProducts()

const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
const apiBaseUrl = computed(() => String(config.public.apiBaseUrl).replace(/\/$/, ''))
const requestHeaders = computed(() => ({
  ...(authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {})
}))
const userProfileName = computed(() => [
  user.value?.userProfile?.firstName,
  user.value?.userProfile?.lastName
].filter(Boolean).join(' '))
const userProfileImageSource = computed(() => user.value?.userProfile?.profile)
const { imageUrl: userProfileImageUrl } = useProfileImageUrl(userProfileImageSource)
const isCustomerUser = computed(() => {
  if (user.value?.isSuperUser) return false

  return user.value?.roles?.some((role) => role.name?.toLowerCase() === 'customer') ?? false
})
const canShowAdminLink = computed(() => !isCustomerUser.value)

const navItems = [
  { label: 'Categories', to: '/#categories' },
  { label: 'Deals', to: '/#deals' },
  { label: 'Products', to: '/#products' },
]

const footerShopLinks = [
  { label: 'footer.categories', to: '/#categories' },
  { label: 'footer.products', to: '/#products' },
  { label: 'footer.daily_deals', to: '/#products' },
]

const footerSupportLinks = [
  { label: 'footer.help_center', to: '/' },
  { label: 'footer.delivery_info', to: '/' },
  { label: 'footer.order_status', to: '/' },
]

const socialLinks = [
  { label: 'Facebook', href: '#', icon: 'lucide:facebook' },
  { label: 'Instagram', href: '#', icon: 'lucide:instagram' },
  { label: 'Telegram', href: '#', icon: 'lucide:send' },
]

type MinioUploadObject = {
  bucket?: string
  objectName?: string
  originalName?: string
  mimeType?: string
  size?: number
  etag?: string
  publicId?: string
  public_id?: string
  fileName?: string
  filename?: string
  url?: string
  secureUrl?: string
  secure_url?: string
  path?: string
  data?: ProfileValue
}

type ProfileValue = string | MinioUploadObject | null

type ProfileForm = {
  username: string
  email: string
  firstName: string
  lastName: string
  gender: string
  dob: string
  phoneNumber: string
  address: string
  note: string
  profile: ProfileValue
}

type PasswordForm = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

type UserDetailResponse = {
  data?: AuthUser
  user?: AuthUser
}

type ProfileUpdateResponse = {
  data?: AuthUser | {
    user?: Partial<AuthUser>
    userProfile?: AuthUserProfile | null
  }
  user?: Partial<AuthUser>
  userProfile?: AuthUserProfile | null
  message?: string
}

type ChangePasswordResponse = {
  data?: AuthUser
  token?: string
  message?: string
}

type SaleHistoryProduct = { _id?: string; id?: string; code?: string; nameEn?: string; nameKh?: string }
type SaleHistoryItem = { _id?: string; id?: string; product?: string | SaleHistoryProduct; quantity?: number; unitPrice?: number; discount?: number; note?: string }
type SaleHistory = {
  _id?: string
  id?: string
  code?: string
  customer?: string | { _id?: string; id?: string; username?: string; email?: string }
  salingDate?: string
  createdAt?: string
  status?: string
  paymentMethod?: string | { merchantName?: string; bankAccount?: string; storeLabel?: string }
  address?: string
  note?: string
  items?: SaleHistoryItem[]
}
type SaleHistoryResponse = SaleHistory[] | {
  data?: SaleHistory[] | { sales?: SaleHistory[]; items?: SaleHistory[]; docs?: SaleHistory[] }
  sales?: SaleHistory[]
  items?: SaleHistory[]
  docs?: SaleHistory[]
  pagination?: { total?: number; page?: number; limit?: number; totalPages?: number }
}

const minioBucketPathPattern = /\/order-management\/(.+?)(?:\?.*)?$/
const isProfileViewVisible = ref(false)
const isProfileEditVisible = ref(false)
const isPasswordDialogVisible = ref(false)
const isCartDrawerVisible = ref(false)
const isOrderHistoryVisible = ref(false)
const orderHistoryLoading = ref(false)
const orderHistory = ref<SaleHistory[]>([])
const orderHistoryPage = ref(1)
const orderHistoryLimit = 10
const orderHistoryTotal = ref(0)
const expandedOrderId = ref('')
const profileLoading = ref(false)
const profileSaving = ref(false)
const passwordSaving = ref(false)
const profileViewData = ref<AuthUser | null>(null)
const profileFormRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()
const profileViewImageSource = computed(() => profileViewData.value?.userProfile?.profile)
const { imageUrl: profileViewImageUrl } = useProfileImageUrl(profileViewImageSource)

const profileForm = reactive<ProfileForm>({
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  gender: 'male',
  dob: '',
  phoneNumber: '',
  address: '',
  note: '',
  profile: null
})

const passwordForm = reactive<PasswordForm>({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const profileViewName = computed(() => [
  profileViewData.value?.userProfile?.firstName,
  profileViewData.value?.userProfile?.lastName
].filter(Boolean).join(' '))

const profileRules: FormRules<ProfileForm> = {
  username: [
    { required: true, message: 'Username is required', trigger: 'blur' }
  ],
  email: [
    { required: true, message: 'Email is required', trigger: 'blur' },
    { type: 'email', message: 'Enter a valid email address', trigger: ['blur', 'change'] }
  ],
  firstName: [
    { required: true, message: 'First name is required', trigger: 'blur' }
  ],
  lastName: [
    { required: true, message: 'Last name is required', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: 'Gender is required', trigger: 'change' }
  ],
  dob: [
    { required: true, message: 'Date of birth is required', trigger: 'change' }
  ],
  phoneNumber: [
    { required: true, message: 'Phone number is required', trigger: 'blur' }
  ],
  address: [
    { required: true, message: 'Address is required', trigger: 'blur' }
  ]
}

const validateConfirmPassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('Confirm password is required'))
    return
  }

  if (value !== passwordForm.newPassword) {
    callback(new Error('Passwords do not match'))
    return
  }

  callback()
}

const passwordRules: FormRules<PasswordForm> = {
  currentPassword: [
    { required: true, message: 'Current password is required', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: 'New password is required', trigger: 'blur' },
    { min: 6, message: 'New password must be at least 6 characters', trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validateConfirmPassword, trigger: ['blur', 'change'] }
  ]
}

watch(
  () => route.query.q,
  (value) => {
    search.value = typeof value === 'string' ? value : ''
  },
)

watch(
  () => passwordForm.newPassword,
  () => {
    if (passwordForm.confirmPassword) {
      passwordFormRef.value?.validateField('confirmPassword')
    }
  }
)

const submitSearch = async () => {
  await router.push({
    path: '/',
    query: search.value.trim() ? { q: search.value.trim() } : {},
    hash: '#products',
  })
}

const changeLocale = (value: 'en' | 'km') => {
  if (locale.value === value) return
  setLocale(value)
}

const getCurrentUserId = () => user.value?._id || user.value?.id || ''

const formatDate = (value?: string) => {
  if (!value) return '-'
  const [date] = value.split('T')
  return date || '-'
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string; error?: string } }).data
    return data?.message || data?.error || fallback
  }

  return fallback
}

const cartThumbnailUrlCache = ref<Record<string, string>>({})

const getCartProduct = (order?: PickedOrder): PickedProduct | null => {
  return typeof order?.product === 'object' && order.product !== null ? order.product : null
}

const getCartProductName = (order?: PickedOrder) => {
  const product = getCartProduct(order)
  return product?.nameEn || product?.nameKh || getPickedProductId(order?.product) || 'Product'
}

const getCartProductCode = (order?: PickedOrder) => {
  return getCartProduct(order)?.code || getPickedProductId(order?.product) || '-'
}

const getCartProductPrice = (order?: PickedOrder) => {
  const product = getCartProduct(order)
  return Math.max(Number(product?.unitPrice || 0) - Number(product?.discount || 0), 0)
}

const getCartOrderTotal = (order?: PickedOrder) => getCartProductPrice(order) * Number(order?.quantity || 1)

const cartTotal = computed(() => pickedProducts.value.reduce((total, order) => total + getCartOrderTotal(order), 0))

const extractOrderHistory = (response: SaleHistoryResponse): SaleHistory[] => {
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

const getSaleCustomerId = (sale: SaleHistory) => typeof sale.customer === 'string' ? sale.customer : sale.customer?._id || sale.customer?.id || ''
const getSaleItemProduct = (item: SaleHistoryItem) => typeof item.product === 'object' && item.product !== null ? item.product : null
const getSaleItemName = (item: SaleHistoryItem) => getSaleItemProduct(item)?.nameEn || getSaleItemProduct(item)?.nameKh || 'Product'
const getSaleItemCode = (item: SaleHistoryItem) => getSaleItemProduct(item)?.code || (typeof item.product === 'string' ? item.product : '-')
const getSaleItemTotal = (item: SaleHistoryItem) => Math.max(Number(item.unitPrice || 0) - Number(item.discount || 0), 0) * Number(item.quantity || 0)
const getSaleHistoryTotal = (sale: SaleHistory) => (sale.items || []).reduce((total, item) => total + getSaleItemTotal(item), 0)
const getSalePaymentLabel = (sale: SaleHistory) => {
  if (typeof sale.paymentMethod === 'string') return sale.paymentMethod
  return [sale.paymentMethod?.merchantName || sale.paymentMethod?.storeLabel, sale.paymentMethod?.bankAccount].filter(Boolean).join(' — ') || '-'
}
const formatOrderDate = (value?: string) => value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '-'
const formatOrderStatus = (status?: string) => status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending'
const getOrderStatusType = (status?: string) => {
  if (status === 'completed' || status === 'delivered') return 'success'
  if (status === 'shipping' || status === 'packing') return 'warning'
  return 'info'
}
const toggleOrderDetails = (sale: SaleHistory) => {
  const id = sale._id || sale.id || ''
  expandedOrderId.value = expandedOrderId.value === id ? '' : id
}

const fetchOrderHistory = async () => {
  const customerId = getCurrentUserId()
  if (!customerId) return
  orderHistoryLoading.value = true
  try {
    const response = await $fetch<SaleHistoryResponse>(`${apiBaseUrl.value}/saling/sales`, {
      headers: requestHeaders.value,
      query: { page: orderHistoryPage.value, limit: orderHistoryLimit, customer: customerId }
    })
    const records = extractOrderHistory(response)
    // Keep the UI customer-scoped even if an older backend ignores the customer query.
    orderHistory.value = records.filter((sale) => !getSaleCustomerId(sale) || getSaleCustomerId(sale) === customerId)
    orderHistoryTotal.value = Array.isArray(response) ? orderHistory.value.length : response.pagination?.total ?? orderHistory.value.length
  } catch (error) {
    orderHistory.value = []
    orderHistoryTotal.value = 0
    ElMessage.error(getErrorMessage(error, 'Failed to load your orders.'))
  } finally {
    orderHistoryLoading.value = false
  }
}

const openOrderHistory = async () => {
  orderHistoryPage.value = 1
  expandedOrderId.value = ''
  isOrderHistoryVisible.value = true
  await fetchOrderHistory()
}

const formatCartPrice = (value = 0) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(Number(value || 0))
}

const getCartObjectNameFromThumbnail = (thumbnail?: PickedProductThumbnail): string => {
  if (!thumbnail) return ''

  if (typeof thumbnail === 'string') {
    if (thumbnail.startsWith('uploads/')) return ''

    const objectNameFromUrl = thumbnail.match(minioBucketPathPattern)?.[1]
    if (objectNameFromUrl) return decodeURIComponent(objectNameFromUrl)
    if (/^https?:\/\//.test(thumbnail)) return ''

    return thumbnail
  }

  if (thumbnail.data) return getCartObjectNameFromThumbnail(thumbnail.data)

  return thumbnail.objectName
    || (thumbnail.url?.match(minioBucketPathPattern)?.[1]
      ? decodeURIComponent(thumbnail.url.match(minioBucketPathPattern)?.[1] || '')
      : '')
}

const getCartDirectAssetUrl = (thumbnail?: PickedProductThumbnail) => {
  if (!thumbnail) return ''

  if (typeof thumbnail !== 'string') {
    if (getCartObjectNameFromThumbnail(thumbnail)) return ''
    return thumbnail.secureUrl || thumbnail.secure_url || thumbnail.url || thumbnail.path || ''
  }

  if (getCartObjectNameFromThumbnail(thumbnail)) return ''
  if (/^https?:\/\//.test(thumbnail)) return thumbnail
  if (!thumbnail.startsWith('uploads/')) return ''

  return `${apiBaseUrl.value.replace(/\/api\/v\d+$/, '')}/${thumbnail.replace(/^\//, '')}`
}

const getCartProductImage = (order?: PickedOrder) => {
  const thumbnail = getCartProduct(order)?.thumbnail
  const objectName = getCartObjectNameFromThumbnail(thumbnail)
  const directUrl = getCartDirectAssetUrl(thumbnail)
  return (objectName ? cartThumbnailUrlCache.value[objectName] : '') || directUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80'
}

const loadCartThumbnailUrl = async (thumbnail?: PickedProductThumbnail) => {
  const objectName = getCartObjectNameFromThumbnail(thumbnail)
  if (!objectName || cartThumbnailUrlCache.value[objectName]) return

  try {
    const response = await $fetch<{ data?: { url?: string }; url?: string }>('minio/presigned-get', {
      baseURL: `${apiBaseUrl.value}/`,
      method: 'post',
      headers: requestHeaders.value,
      body: {
        objectName,
        expiresInSeconds: 3600
      }
    })

    const url = response.data?.url || response.url
    if (url) {
      cartThumbnailUrlCache.value = {
        ...cartThumbnailUrlCache.value,
        [objectName]: url
      }
    }
  } catch (error) {
    console.error(error)
  }
}

const loadCartProductImages = () => {
  pickedProducts.value.forEach((order) => loadCartThumbnailUrl(getCartProduct(order)?.thumbnail))
}

const openCartDrawer = async () => {
  if (!isAuthenticated.value) {
    await navigateTo('/auth/login')
    return
  }

  isCartDrawerVisible.value = true

  try {
    await fetchPickedProducts()
    loadCartProductImages()
  } catch (error) {
    ElMessage.error(getErrorMessage(error, 'Failed to load picked products.'))
  }
}

const updateCartQuantity = async (order: PickedOrder, quantity: number) => {
  try {
    await updatePickedQuantity(order, quantity)
  } catch (error) {
    ElMessage.error(getErrorMessage(error, 'Failed to update quantity.'))
  }
}

const removeCartOrder = async (order: PickedOrder) => {
  try {
    await removePickedProduct(order)
  } catch (error) {
    ElMessage.error(getErrorMessage(error, 'Failed to remove product.'))
  }
}

const normalizeProfileValue = (value?: ProfileValue): ProfileValue | '' => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (value.data) return normalizeProfileValue(value.data)

  return value
}

const getProfileObjectName = (profile?: ProfileValue) => {
  if (!profile) return ''

  if (typeof profile !== 'string') {
    if (profile.data) return getProfileObjectName(profile.data)

    return profile.objectName
      || profile.publicId
      || profile.public_id
      || profile.fileName
      || profile.filename
      || (profile.url?.match(minioBucketPathPattern)?.[1]
        ? decodeURIComponent(profile.url.match(minioBucketPathPattern)?.[1] || '')
        : '')
  }

  if (profile.startsWith('uploads/')) return ''

  const objectNameFromUrl = profile.match(minioBucketPathPattern)?.[1]
  if (objectNameFromUrl) return decodeURIComponent(objectNameFromUrl)
  if (/^https?:\/\//.test(profile)) return ''

  return profile
}

const normalizeProfileForPayload = (value?: ProfileValue): MinioUploadObject | null => {
  const profile = normalizeProfileValue(value)
  if (!profile || typeof profile === 'string') return null

  const objectName = getProfileObjectName(profile)
  if (!objectName) return null

  return {
    ...profile,
    objectName
  }
}

const profileUploadValue = computed<ProfileValue>({
  get: () => profileForm.profile || null,
  set: (value) => {
    profileForm.profile = normalizeProfileValue(value) || null
  }
})

const syncProfileForm = (authUser: AuthUser | null | undefined = user.value) => {
  Object.assign(profileForm, {
    username: authUser?.username || '',
    email: authUser?.email || '',
    firstName: authUser?.userProfile?.firstName || '',
    lastName: authUser?.userProfile?.lastName || '',
    gender: authUser?.userProfile?.gender || 'male',
    dob: formatDate(authUser?.userProfile?.dob) === '-' ? '' : formatDate(authUser?.userProfile?.dob),
    phoneNumber: authUser?.userProfile?.phoneNumber || '',
    address: authUser?.userProfile?.address || '',
    note: authUser?.userProfile?.note || '',
    profile: normalizeProfileValue(authUser?.userProfile?.profile as ProfileValue) || null
  })
}

const resetPasswordForm = () => {
  Object.assign(passwordForm, {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  passwordFormRef.value?.clearValidate()
}

const loadCurrentUser = async () => {
  const userId = getCurrentUserId()
  if (!userId) return user.value || null

  profileLoading.value = true

  try {
    const response = await $fetch<UserDetailResponse>(`${apiBaseUrl.value}/system/users/${userId}`, {
      headers: requestHeaders.value
    })
    const nextUser = response.data || response.user || null

    if (nextUser) {
      user.value = {
        ...user.value,
        ...nextUser,
        userProfile: nextUser.userProfile || null
      }
      profileViewData.value = user.value
      return user.value
    }
  } catch (error) {
    ElMessage.error(getErrorMessage(error, 'Failed to load profile.'))
  } finally {
    profileLoading.value = false
  }

  return user.value || null
}

const openProfileView = async () => {
  if (!isAuthenticated.value) {
    await navigateTo('/auth/login')
    return
  }

  profileViewData.value = user.value || null
  isProfileViewVisible.value = true
  await loadCurrentUser()
}

const openProfileEdit = async () => {
  if (!isAuthenticated.value) {
    await navigateTo('/auth/login')
    return
  }

  const loadedUser = await loadCurrentUser()
  syncProfileForm(loadedUser)
  profileFormRef.value?.clearValidate()
  isProfileEditVisible.value = true
}

const openPasswordDialog = () => {
  resetPasswordForm()
  isPasswordDialogVisible.value = true
}

const mergeProfileUpdate = (response: ProfileUpdateResponse) => {
  const responseData = response.data
  const responseUser = response.user || (responseData && 'user' in responseData ? responseData.user : undefined)
  const responseUserProfile = response.userProfile || (responseData && 'userProfile' in responseData ? responseData.userProfile : undefined)
  const directUser = responseData && ('username' in responseData || 'email' in responseData || 'userProfile' in responseData)
    ? responseData as AuthUser
    : null

  user.value = {
    ...user.value,
    ...(directUser || {}),
    ...(responseUser || {}),
    username: responseUser?.username || directUser?.username || profileForm.username,
    email: responseUser?.email || directUser?.email || profileForm.email,
    userProfile: responseUserProfile !== undefined
      ? responseUserProfile
      : directUser?.userProfile || {
        ...(user.value?.userProfile || {}),
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        gender: profileForm.gender,
        dob: profileForm.dob,
        phoneNumber: profileForm.phoneNumber,
        address: profileForm.address,
        note: profileForm.note,
        profile: normalizeProfileValue(profileForm.profile) || null
      }
  } as AuthUser
}

const buildProfilePayload = () => {
  const profile = normalizeProfileForPayload(profileForm.profile)

  return {
    user: {
      username: profileForm.username.trim(),
      email: profileForm.email.trim()
    },
    userProfile: {
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim(),
      gender: profileForm.gender,
      dob: profileForm.dob,
      phoneNumber: profileForm.phoneNumber.trim(),
      address: profileForm.address.trim(),
      note: profileForm.note.trim(),
      ...(profile ? { profile } : {})
    }
  }
}

const submitProfile = async () => {
  if (!profileFormRef.value) return

  const isValid = await profileFormRef.value.validate().catch(() => false)
  if (!isValid) return

  profileSaving.value = true

  try {
    const response = await $fetch<ProfileUpdateResponse>(`${apiBaseUrl.value}/auth/profile`, {
      method: 'PUT',
      headers: requestHeaders.value,
      body: buildProfilePayload()
    })

    mergeProfileUpdate(response)
    profileViewData.value = user.value || null
    ElMessage.success(response.message || 'Profile updated')
    isProfileEditVisible.value = false
  } catch (error) {
    ElMessage.error(getErrorMessage(error, 'Failed to update profile.'))
  } finally {
    profileSaving.value = false
  }
}

const submitPassword = async () => {
  if (!passwordFormRef.value) return

  const isValid = await passwordFormRef.value.validate().catch(() => false)
  if (!isValid) return

  passwordSaving.value = true

  try {
    const response = await $fetch<ChangePasswordResponse>(`${apiBaseUrl.value}/auth/change-password`, {
      method: 'POST',
      headers: requestHeaders.value,
      body: {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      }
    })

    if (response.token && response.data) {
      setAuth(response)
    }

    ElMessage.success(response.message || 'Password changed')
    isPasswordDialogVisible.value = false
    resetPasswordForm()
  } catch (error) {
    ElMessage.error(getErrorMessage(error, 'Failed to change password.'))
  } finally {
    passwordSaving.value = false
  }
}

const logout = async () => {
  try {
    await $fetch(`${apiBaseUrl.value}/auth/logout`, {
      method: 'POST',
      headers: requestHeaders.value
    })
  } catch (error) {
    console.error(error)
  } finally {
    pickedProducts.value = []
    clearAuth()
    await navigateTo('/auth/login')
  }
}

const handleAccountCommand = async (command: string | number | object) => {
  if (command === 'login') {
    await navigateTo('/auth/login')
    return
  }

  if (command === 'view-profile') {
    await openProfileView()
    return
  }

  if (command === 'edit-profile') {
    await openProfileEdit()
    return
  }

  if (command === 'my-orders') {
    await openOrderHistory()
    return
  }

  if (command === 'change-password') {
    openPasswordDialog()
    return
  }

  if (command === 'logout') {
    await logout()
  }
}

watch(
  pickedProducts,
  () => loadCartProductImages(),
  { deep: true }
)

watch(
  isAuthenticated,
  (value) => {
    if (value) {
      fetchPickedProducts().then(loadCartProductImages).catch(console.error)
      return
    }

    pickedProducts.value = []
  },
  { immediate: true }
)
</script>
