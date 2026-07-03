<template>
  <div class="grid min-h-screen place-items-center bg-slate-100 px-4 py-10 text-slate-900">
    <section class="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-6">
        <div class="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
          OM
        </div>
        <h1 class="text-xl font-semibold">Sign in</h1>
        <p class="mt-1 text-sm text-slate-500">Access your order management dashboard.</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="submitLogin"
      >
        <el-form-item
          label="Username or email"
          prop="usernameOrEmail"
        >
          <el-input
            v-model="form.usernameOrEmail"
            autocomplete="username"
            placeholder="admin@example.com"
            size="large"
          >
            <template #prefix>
              <Icon name="lucide:user" class="h-4 w-4 text-slate-400" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="Password" prop="password">
          <el-input
            v-model="form.password"
            autocomplete="current-password"
            placeholder="Enter your password"
            show-password
            size="large"
            type="password"
          >
            <template #prefix>
              <Icon name="lucide:lock-keyhole" class="h-4 w-4 text-slate-400" />
            </template>
          </el-input>
        </el-form-item>

        <el-button
          class="mt-2 w-full"
          :loading="isSubmitting"
          native-type="submit"
          size="large"
          type="primary"
        >
          Login
        </el-button>
      </el-form>

      <div class="mt-5 border-t border-slate-200 pt-5">
        <p class="text-center text-sm text-slate-500">Need a customer account?</p>
        <NuxtLink
          to="/auth/register"
          class="mt-3 flex h-10 w-full items-center justify-center rounded-md border border-emerald-200 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 hover:text-emerald-800"
        >
          Create account
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

definePageMeta({
  layout: 'auth',
  middleware: 'auth'
})

type LoginResponse = {
  token?: string
  accessToken?: string
  access_token?: string
  data?: {
    _id?: string
    id?: string
    username?: string
    email?: string
    isActive?: boolean
    isSuperUser?: boolean
    roles?: Array<{
      _id?: string
      id?: string
      name?: string
    }>
    permission?: string[]
    permissions?: string[]
    token?: string
    accessToken?: string
    access_token?: string
  }
  message?: string
}

const config = useRuntimeConfig()
const { setAuth } = useAuth()

const loginFormRef = ref<FormInstance>()
const isSubmitting = ref(false)

const form = reactive({
  usernameOrEmail: 'admin@example.com',
  password: 'Password@123'
})

const rules: FormRules<typeof form> = {
  usernameOrEmail: [
    { required: true, message: 'Username or email is required', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Password is required', trigger: 'blur' }
  ]
}

const apiBaseUrl = computed(() => String(config.public.apiBaseUrl).replace(/\/$/, ''))

const isCustomerUser = (user?: LoginResponse['data']) => {
  if (!user || user.isSuperUser) return false
  return user.roles?.some((role) => role.name?.toLowerCase() === 'customer') ?? false
}

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string; error?: string } }).data
    return data?.message || data?.error || 'Unable to login. Please check your credentials.'
  }

  return 'Unable to login. Please check your credentials.'
}

const submitLogin = async () => {
  if (!loginFormRef.value) return

  const isValid = await loginFormRef.value.validate().catch(() => false)
  if (!isValid) return

  isSubmitting.value = true

  try {
    const response = await $fetch<LoginResponse>(`${apiBaseUrl.value}/auth/login`, {
      method: 'POST',
      body: {
        usernameOrEmail: form.usernameOrEmail,
        password: form.password
      }
    })

    if (!setAuth(response)) {
      ElMessage.error('Login succeeded but no access token was returned.')
      return
    }

    ElMessage.success(response.message || 'Login successful')
    await navigateTo(isCustomerUser(response.data) ? '/' : '/admin/dashboard')
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
:deep(.el-button--primary) {
  --el-button-bg-color: #059669;
  --el-button-border-color: #059669;
  --el-button-hover-bg-color: #047857;
  --el-button-hover-border-color: #047857;
}
</style>
