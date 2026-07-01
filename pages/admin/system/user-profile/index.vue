<template>
  <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div class="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-base font-semibold">{{ t('userProfiles.title') }}</h2>
        <p class="text-sm text-slate-500">{{ t('userProfiles.description') }}</p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <el-input v-model="search" class="w-full sm:w-64" :placeholder="t('common.search')" clearable>
          <template #prefix>
            <Icon name="lucide:search" class="h-4 w-4 text-slate-400" />
          </template>
        </el-input>
        <el-button v-if="canCreateUserProfile" type="primary" @click="openCreateDialog">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          {{ t('userProfiles.actions.new') }}
        </el-button>
      </div>
    </div>

    <div class="p-5">
      <el-table v-loading="isLoading" :data="userProfiles" stripe class="w-full">
        <el-table-column :label="t('userProfiles.profile')" width="120">
          <template #default="{ row }">
            <div class="grid h-12 w-12 place-items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50">
              <img
                v-if="row.profile"
                :alt="getFullName(row)"
                class="h-full w-full object-cover"
                :src="getProfileUrl(row.profile)"
              >
              <Icon v-else name="lucide:user-round" class="h-5 w-5 text-slate-400" />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="code" :label="t('userProfiles.code')" min-width="130" />
        <el-table-column :label="t('userProfiles.fullName')" min-width="180">
          <template #default="{ row }">
            {{ getFullName(row) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('userProfiles.userType')" min-width="120">
          <template #default="{ row }">
            <el-tag effect="plain">{{ getUserTypeLabel(row.userType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('userProfiles.gender')" min-width="110">
          <template #default="{ row }">
            {{ getGenderLabel(row.gender) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('userProfiles.dob')" min-width="130">
          <template #default="{ row }">
            {{ formatDate(row.dob) }}
          </template>
        </el-table-column>
        <el-table-column prop="phoneNumber" :label="t('userProfiles.phoneNumber')" min-width="150" />
        <el-table-column prop="address" :label="t('userProfiles.address')" min-width="180" show-overflow-tooltip />
        <el-table-column prop="note" :label="t('userProfiles.note')" min-width="220" show-overflow-tooltip />
        <el-table-column v-if="canUpdateUserProfile || canDeleteUserProfile" fixed="right" :label="t('common.actions')" width="130">
          <template #default="{ row }">
            <div class="flex items-center gap-1">
              <el-tooltip v-if="canUpdateUserProfile" :content="t('userProfiles.actions.edit')" placement="top">
                <el-button circle text @click="openEditDialog(row)">
                  <Icon name="lucide:pencil" class="h-4 w-4" />
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="canDeleteUserProfile" :content="t('userProfiles.actions.delete')" placement="top">
                <el-button circle text type="danger" @click="deleteUserProfile(row)">
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
      :title="isEditing ? t('userProfiles.dialog.editTitle') : t('userProfiles.dialog.createTitle')"
      width="760px"
      destroy-on-close
      draggable
    >
      <el-form
        ref="userProfileFormRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="submitUserProfile"
      >
        <div class="grid gap-4 md:grid-cols-2">
          <el-form-item :label="t('userProfiles.code')" prop="code">
            <el-input v-model="form.code" :placeholder="t('userProfiles.placeholders.code')" />
          </el-form-item>

          <el-form-item :label="t('userProfiles.userType')" prop="userType">
            <el-select v-model="form.userType" class="w-full" :placeholder="t('userProfiles.placeholders.userType')">
              <el-option
                v-for="option in userTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <el-form-item :label="t('userProfiles.firstName')" prop="firstName">
            <el-input v-model="form.firstName" :placeholder="t('userProfiles.placeholders.firstName')" />
          </el-form-item>

          <el-form-item :label="t('userProfiles.lastName')" prop="lastName">
            <el-input v-model="form.lastName" :placeholder="t('userProfiles.placeholders.lastName')" />
          </el-form-item>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <el-form-item :label="t('userProfiles.gender')" prop="gender">
            <el-select v-model="form.gender" class="w-full" :placeholder="t('userProfiles.placeholders.gender')">
              <el-option
                v-for="option in genderOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="t('userProfiles.dob')" prop="dob">
            <el-date-picker
              v-model="form.dob"
              class="!w-full"
              format="YYYY-MM-DD"
              type="date"
              value-format="YYYY-MM-DD"
              :placeholder="t('userProfiles.placeholders.dob')"
            />
          </el-form-item>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <el-form-item :label="t('userProfiles.phoneNumber')" prop="phoneNumber">
            <el-input v-model="form.phoneNumber" :placeholder="t('userProfiles.placeholders.phoneNumber')" />
          </el-form-item>
        </div>

        <el-form-item :label="t('userProfiles.address')" prop="address">
          <el-input v-model="form.address" :placeholder="t('userProfiles.placeholders.address')" />
        </el-form-item>

        <el-form-item :label="t('userProfiles.profile')" prop="profile">
          <el-input v-model="form.profile" :placeholder="t('userProfiles.placeholders.profile')" />
        </el-form-item>

        <el-form-item :label="t('userProfiles.note')" prop="note">
          <el-input
            v-model="form.note"
            :placeholder="t('userProfiles.placeholders.note')"
            :rows="3"
            type="textarea"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="isDialogVisible = false">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="isSaving" @click="submitUserProfile">
            {{ isEditing ? t('userProfiles.actions.save') : t('userProfiles.actions.create') }}
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
  permission: 'user-profile.read'
})

type UserType = 'staff' | 'customer' | 'admin' | 'supplier' | string
type Gender = 'male' | 'female' | 'other' | string

type ApiUserProfile = {
  _id?: string
  id?: string
  code: string
  userType: UserType
  firstName: string
  lastName: string
  gender: Gender
  dob: string
  phoneNumber?: string
  address?: string
  note?: string
  profile?: string
}

type UserProfileForm = {
  code: string
  userType: string
  firstName: string
  lastName: string
  gender: string
  dob: string
  phoneNumber: string
  address: string
  note: string
  profile: string
}

type UserProfilePayload = Omit<UserProfileForm, 'phoneNumber' | 'address' | 'profile'> & {
  phoneNumber?: string
  address?: string
  profile?: string
}

type PaginatedResponse = {
  data?: ApiUserProfile[] | { userProfiles?: ApiUserProfile[]; profiles?: ApiUserProfile[]; items?: ApiUserProfile[]; docs?: ApiUserProfile[] }
  userProfiles?: ApiUserProfile[]
  profiles?: ApiUserProfile[]
  items?: ApiUserProfile[]
  docs?: ApiUserProfile[]
  pagination?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
  message?: string
}

type UserProfileResponse = ApiUserProfile[] | PaginatedResponse

const { t } = useI18n()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('auth_token')
const { hasPermission } = useAuth()

const apiBaseUrl = computed(() => String(config.public.apiBaseUrl).replace(/\/$/, ''))
const userProfilesEndpoint = computed(() => `${apiBaseUrl.value}/system/user-profiles`)

const search = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const userProfiles = ref<ApiUserProfile[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const isDialogVisible = ref(false)
const editingUserProfileId = ref<string | null>(null)
const userProfileFormRef = ref<FormInstance>()

const form = reactive<UserProfileForm>({
  code: '',
  userType: 'staff',
  firstName: '',
  lastName: '',
  gender: 'male',
  dob: '',
  phoneNumber: '',
  address: '',
  note: '',
  profile: ''
})

const isEditing = computed(() => Boolean(editingUserProfileId.value))
const canCreateUserProfile = computed(() => hasPermission('user-profile.create'))
const canUpdateUserProfile = computed(() => hasPermission('user-profile.update'))
const canDeleteUserProfile = computed(() => hasPermission('user-profile.delete'))

const userTypeOptions = computed(() => [
  { value: 'staff', label: t('userProfiles.userTypes.staff') },
  { value: 'customer', label: t('userProfiles.userTypes.customer') },
  { value: 'admin', label: t('userProfiles.userTypes.admin') },
  { value: 'supplier', label: t('userProfiles.userTypes.supplier') }
])

const genderOptions = computed(() => [
  { value: 'male', label: t('userProfiles.genders.male') },
  { value: 'female', label: t('userProfiles.genders.female') },
  { value: 'other', label: t('userProfiles.genders.other') }
])

const rules: FormRules<UserProfileForm> = {
  code: [
    { required: true, message: () => t('userProfiles.validation.codeRequired'), trigger: 'blur' }
  ],
  userType: [
    { required: true, message: () => t('userProfiles.validation.userTypeRequired'), trigger: 'change' }
  ],
  firstName: [
    { required: true, message: () => t('userProfiles.validation.firstNameRequired'), trigger: 'blur' }
  ],
  lastName: [
    { required: true, message: () => t('userProfiles.validation.lastNameRequired'), trigger: 'blur' }
  ],
  gender: [
    { required: true, message: () => t('userProfiles.validation.genderRequired'), trigger: 'change' }
  ],
  dob: [
    { required: true, message: () => t('userProfiles.validation.dobRequired'), trigger: 'change' }
  ]
}

const requestHeaders = computed(() => ({
  ...(authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {})
}))

const getUserProfileId = (userProfile: ApiUserProfile) => userProfile._id || userProfile.id || ''

const getFullName = (userProfile: Pick<ApiUserProfile, 'firstName' | 'lastName'>) => {
  return [userProfile.firstName, userProfile.lastName].filter(Boolean).join(' ') || '-'
}

const getUserTypeLabel = (userType: string) => {
  return userTypeOptions.value.find((option) => option.value === userType)?.label || userType || '-'
}

const getGenderLabel = (gender: string) => {
  return genderOptions.value.find((option) => option.value === gender)?.label || gender || '-'
}

const extractUserProfiles = (response: UserProfileResponse): ApiUserProfile[] => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data?.userProfiles)) return response.data.userProfiles
  if (Array.isArray(response.data?.profiles)) return response.data.profiles
  if (Array.isArray(response.data?.items)) return response.data.items
  if (Array.isArray(response.data?.docs)) return response.data.docs
  if (Array.isArray(response.userProfiles)) return response.userProfiles
  if (Array.isArray(response.profiles)) return response.profiles
  if (Array.isArray(response.items)) return response.items
  if (Array.isArray(response.docs)) return response.docs
  return []
}

const getTotalItems = (response: UserProfileResponse, items: ApiUserProfile[]) => {
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

const getProfileUrl = (profile: string) => {
  if (/^https?:\/\//.test(profile)) return profile
  return `${apiBaseUrl.value.replace(/\/api\/v\d+$/, '')}/${profile.replace(/^\//, '')}`
}

const formatDate = (value?: string) => {
  if (!value) return '-'
  const [date] = value.split('T')
  return date || '-'
}

const refreshUserProfiles = async () => {
  isLoading.value = true

  try {
    const response = await $fetch<UserProfileResponse>(userProfilesEndpoint.value, {
      headers: requestHeaders.value,
      query: buildQuery()
    })

    const items = extractUserProfiles(response)
    userProfiles.value = items
    totalItems.value = getTotalItems(response, items)
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  editingUserProfileId.value = null
  Object.assign(form, {
    code: '',
    userType: 'staff',
    firstName: '',
    lastName: '',
    gender: 'male',
    dob: '',
    phoneNumber: '',
    address: '',
    note: '',
    profile: ''
  })
  userProfileFormRef.value?.clearValidate()
}

const openCreateDialog = () => {
  if (!canCreateUserProfile.value) return

  resetForm()
  isDialogVisible.value = true
}

const openEditDialog = (userProfile: ApiUserProfile) => {
  if (!canUpdateUserProfile.value) return

  editingUserProfileId.value = getUserProfileId(userProfile)
  Object.assign(form, {
    code: userProfile.code,
    userType: userProfile.userType || 'staff',
    firstName: userProfile.firstName,
    lastName: userProfile.lastName,
    gender: userProfile.gender || 'male',
    dob: formatDate(userProfile.dob),
    phoneNumber: userProfile.phoneNumber || '',
    address: userProfile.address || '',
    note: userProfile.note || '',
    profile: userProfile.profile || ''
  })
  isDialogVisible.value = true
}

const buildPayload = (): UserProfilePayload => {
  const payload: UserProfilePayload = {
    code: form.code.trim(),
    userType: form.userType,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    gender: form.gender,
    dob: form.dob,
    note: form.note.trim()
  }

  const phoneNumber = form.phoneNumber.trim()
  const address = form.address.trim()
  const profile = form.profile.trim()

  if (phoneNumber) payload.phoneNumber = phoneNumber
  if (address) payload.address = address
  if (profile) payload.profile = profile

  return payload
}

const submitUserProfile = async () => {
  if (!userProfileFormRef.value) return
  if (isEditing.value && !canUpdateUserProfile.value) return
  if (!isEditing.value && !canCreateUserProfile.value) return

  const isValid = await userProfileFormRef.value.validate().catch(() => false)
  if (!isValid) return

  isSaving.value = true

  try {
    const url = isEditing.value ? `${userProfilesEndpoint.value}/${editingUserProfileId.value}` : userProfilesEndpoint.value
    const method = isEditing.value ? 'PUT' : 'POST'

    await $fetch(url, {
      method,
      headers: requestHeaders.value,
      body: buildPayload()
    })

    ElMessage.success(isEditing.value ? t('userProfiles.messages.updated') : t('userProfiles.messages.created'))
    isDialogVisible.value = false
    await refreshUserProfiles()
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isSaving.value = false
  }
}

const deleteUserProfile = async (userProfile: ApiUserProfile) => {
  if (!canDeleteUserProfile.value) return

  const userProfileId = getUserProfileId(userProfile)
  if (!userProfileId) {
    ElMessage.error(t('userProfiles.messages.missingId'))
    return
  }

  try {
    await ElMessageBox.confirm(
      t('userProfiles.confirmDelete.message', { code: userProfile.code }),
      t('userProfiles.confirmDelete.title'),
      {
        confirmButtonText: t('userProfiles.actions.delete'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await $fetch(`${userProfilesEndpoint.value}/${userProfileId}`, {
      method: 'DELETE',
      headers: requestHeaders.value
    })

    ElMessage.success(t('userProfiles.messages.deleted'))
    await refreshUserProfiles()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(getErrorMessage(error))
    }
  }
}

watch([currentPage, pageSize], () => {
  refreshUserProfiles()
})

watch(search, () => {
  currentPage.value = 1
  refreshUserProfiles()
})

onMounted(() => {
  refreshUserProfiles()
})
</script>

<style scoped>
:deep(.el-button--primary) {
  --el-button-bg-color: #059669;
  --el-button-border-color: #059669;
  --el-button-hover-bg-color: #047857;
  --el-button-hover-border-color: #047857;
}
</style>
