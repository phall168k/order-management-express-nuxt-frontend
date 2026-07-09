<template>
  <div class="grid min-h-screen place-items-center bg-slate-100 px-4 py-10 text-slate-900">
    <section class="w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-6">
        <NuxtLink to="/" class="mb-4 inline-grid h-12 w-12 place-items-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
          OM
        </NuxtLink>
        <h1 class="text-xl font-semibold">Create account</h1>
        <p class="mt-1 text-sm text-slate-500">Register a customer profile for faster ordering.</p>
      </div>

      <el-form
        ref="registerFormRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="submitRegister"
      >
        <div class="grid gap-x-4 md:grid-cols-2">
          <el-form-item label="Username" prop="username">
            <el-input v-model="form.username" autocomplete="username" placeholder="customer01" size="large">
              <template #prefix>
                <Icon name="lucide:user" class="h-4 w-4 text-slate-400" />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="Email" prop="email">
            <el-input v-model="form.email" autocomplete="email" placeholder="customer01@example.com" size="large">
              <template #prefix>
                <Icon name="lucide:mail" class="h-4 w-4 text-slate-400" />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="Password" prop="password">
            <el-input
              v-model="form.password"
              autocomplete="new-password"
              placeholder="Password@123"
              show-password
              size="large"
              type="password"
            >
              <template #prefix>
                <Icon name="lucide:lock-keyhole" class="h-4 w-4 text-slate-400" />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="Confirm password" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              autocomplete="new-password"
              placeholder="Confirm your password"
              show-password
              size="large"
              type="password"
            >
              <template #prefix>
                <Icon name="lucide:lock-keyhole" class="h-4 w-4 text-slate-400" />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="Gender" prop="gender">
            <el-select v-model="form.gender" class="w-full" placeholder="Select gender" size="large">
              <el-option v-for="option in genderOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </el-form-item>

          <el-form-item label="First name" prop="firstName">
            <el-input v-model="form.firstName" autocomplete="given-name" placeholder="Sok" size="large" />
          </el-form-item>

          <el-form-item label="Last name" prop="lastName">
            <el-input v-model="form.lastName" autocomplete="family-name" placeholder="Dara" size="large" />
          </el-form-item>

          <el-form-item label="Date of birth" prop="dob">
            <el-date-picker
              v-model="form.dob"
              class="!w-full"
              format="YYYY-MM-DD"
              placeholder="1998-01-15"
              size="large"
              type="date"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>

          <el-form-item label="Phone number" prop="phoneNumber">
            <el-input v-model="form.phoneNumber" autocomplete="tel" placeholder="+85512345678" size="large">
              <template #prefix>
                <Icon name="lucide:phone" class="h-4 w-4 text-slate-400" />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item class="md:col-span-2" label="Address" prop="address">
            <el-input v-model="form.address" autocomplete="street-address" placeholder="Phnom Penh" size="large" />
          </el-form-item>

          <el-form-item class="md:col-span-2" label="Profile image" prop="profile">
            <SingleUpload v-model="profileUploadValue" class="w-full"/>
          </el-form-item>
        </div>

        <el-button
          class="mt-2 w-full"
          :loading="isSubmitting"
          native-type="submit"
          size="large"
          type="primary"
        >
          Create account
        </el-button>
      </el-form>

      <p class="mt-5 text-center text-sm text-slate-500">
        Already have an account?
        <NuxtLink to="/auth/login" class="font-semibold text-emerald-700 hover:text-emerald-800">
          Sign in
        </NuxtLink>
      </p>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import SingleUpload from '~/@core/components/SingleUpload.vue'

definePageMeta({
  layout: 'auth',
  middleware: 'auth'
})

type Gender = 'male' | 'female' | 'other'

type RegisterForm = {
  username: string
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  gender: Gender
  dob: string
  phoneNumber: string
  address: string
  profile: ProfileValue
}

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

type RegisterResponse = {
  success?: boolean
  message?: string
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
    userProfile?: unknown
    token?: string
    accessToken?: string
    access_token?: string
  }
}

const config = useRuntimeConfig()
const { setAuth } = useAuth()

const registerFormRef = ref<FormInstance>()
const isSubmitting = ref(false)

const form = reactive<RegisterForm>({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  gender: 'male',
  dob: '',
  phoneNumber: '',
  address: '',
  profile: null
})

const genderOptions: Array<{ label: string; value: Gender }> = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' }
]

const apiBaseUrl = computed(() => String(config.public.apiBaseUrl).replace(/\/$/, ''))
const minioBucketPathPattern = /\/order-management\/(.+?)(?:\?.*)?$/

const validateConfirmPassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('Confirm password is required'))
    return
  }

  if (value !== form.password) {
    callback(new Error('Passwords do not match'))
    return
  }

  callback()
}

const rules: FormRules<RegisterForm> = {
  username: [
    { required: true, message: 'Username is required', trigger: 'blur' },
    { min: 3, message: 'Username must be at least 3 characters', trigger: 'blur' }
  ],
  email: [
    { required: true, message: 'Email is required', trigger: 'blur' },
    { type: 'email', message: 'Enter a valid email address', trigger: ['blur', 'change'] }
  ],
  password: [
    { required: true, message: 'Password is required', trigger: 'blur' },
    { min: 8, message: 'Password must be at least 8 characters', trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validateConfirmPassword, trigger: ['blur', 'change'] }
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

watch(
  () => form.password,
  () => {
    if (form.confirmPassword) {
      registerFormRef.value?.validateField('confirmPassword')
    }
  }
)

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string; error?: string } }).data
    return data?.message || data?.error || 'Unable to register. Please try again.'
  }

  return 'Unable to register. Please try again.'
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
  get: () => form.profile || null,
  set: (value) => {
    form.profile = normalizeProfileValue(value) || null
  }
})

const buildPayload = () => {
  const profile = normalizeProfileForPayload(form.profile)

  return {
    username: form.username.trim(),
    email: form.email.trim(),
    password: form.password,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    gender: form.gender,
    dob: form.dob,
    phoneNumber: form.phoneNumber.trim(),
    address: form.address.trim(),
    ...(profile ? { profile } : {})
  }
}

const submitRegister = async () => {
  if (!registerFormRef.value) return

  const isValid = await registerFormRef.value.validate().catch(() => false)
  if (!isValid) return

  isSubmitting.value = true

  try {
    const response = await $fetch<RegisterResponse>(`${apiBaseUrl.value}/auth/register`, {
      method: 'POST',
      body: buildPayload()
    })

    if (!setAuth(response)) {
      ElMessage.success(response.message || 'Account created successfully')
      await navigateTo('/auth/login')
      return
    }

    ElMessage.success(response.message || 'Account created successfully')
    await navigateTo('/')
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
