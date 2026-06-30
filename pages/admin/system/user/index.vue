<template>
  <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div class="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-base font-semibold">{{ t('users.title') }}</h2>
        <p class="text-sm text-slate-500">{{ t('users.description') }}</p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <el-input v-model="search" class="w-full sm:w-64" :placeholder="t('common.search')" clearable>
          <template #prefix>
            <Icon name="lucide:search" class="h-4 w-4 text-slate-400" />
          </template>
        </el-input>
        <el-button type="primary" @click="openCreateDialog">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          {{ t('users.actions.new') }}
        </el-button>
      </div>
    </div>

    <div class="p-5">
      <el-table v-loading="isLoading" :data="paginatedUsers" stripe class="w-full">
        <el-table-column prop="username" :label="t('users.username')" min-width="150" />
        <el-table-column prop="email" :label="t('users.email')" min-width="220" />
        <el-table-column :label="t('users.roles')" min-width="220">
          <template #default="{ row }">
            <div class="flex flex-wrap gap-1">
              <el-tag v-for="role in row.roles" :key="role" effect="plain" size="small">
                {{ getRoleLabel(role) }}
              </el-tag>
              <span v-if="!row.roles.length" class="text-sm text-slate-400">{{ t('users.emptyRoles') }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('users.isSuperUser')" min-width="120">
          <template #default="{ row }">
            <el-tag :type="row.isSuperUser ? 'warning' : 'info'">
              {{ row.isSuperUser ? t('common.yes') : t('common.no') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.status')" min-width="120">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'">
              {{ row.isActive ? t('users.status.active') : t('users.status.inactive') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column fixed="right" :label="t('common.actions')" width="130">
          <template #default="{ row }">
            <div class="flex items-center gap-1">
              <el-tooltip :content="t('users.actions.edit')" placement="top">
                <el-button circle text @click="openEditDialog(row)">
                  <Icon name="lucide:pencil" class="h-4 w-4" />
                </el-button>
              </el-tooltip>
              <el-tooltip :content="t('users.actions.delete')" placement="top">
                <el-button circle text type="danger" @click="deleteUser(row)">
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
          :page-sizes="[5, 10, 20]"
          :total="filteredUsers.length"
          background
          layout="total, sizes, prev, pager, next"
        />
      </div>
    </div>

    <el-dialog
      v-model="isDialogVisible"
      :title="isEditing ? t('users.dialog.editTitle') : t('users.dialog.createTitle')"
      width="560px"
      destroy-on-close
    >
      <el-form
        ref="userFormRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="submitUser"
      >
        <div class="grid gap-4 md:grid-cols-2">
          <el-form-item :label="t('users.username')" prop="username">
            <el-input v-model="form.username" autocomplete="username" :placeholder="t('users.placeholders.username')" />
          </el-form-item>

          <el-form-item :label="t('users.email')" prop="email">
            <el-input v-model="form.email" autocomplete="email" :placeholder="t('users.placeholders.email')" />
          </el-form-item>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <el-form-item :label="isEditing ? t('users.passwordOptional') : t('users.password')" prop="password">
            <el-input
              v-model="form.password"
              autocomplete="new-password"
              :placeholder="t('users.placeholders.password')"
              show-password
              type="password"
            />
          </el-form-item>

          <el-form-item :label="t('users.confirmPassword')" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              autocomplete="new-password"
              :placeholder="t('users.placeholders.confirmPassword')"
              show-password
              type="password"
            />
          </el-form-item>
        </div>

        <el-form-item :label="t('users.roles')" prop="roles">
          <el-select
            v-model="form.roles"
            default-first-option
            filterable
            :loading="isLoadingRoles"
            multiple
            :placeholder="t('users.placeholders.roles')"
            class="w-full"
          >
            <el-option
              v-for="role in roleOptions"
              :key="role._id"
              :label="role.name"
              :value="role._id"
            />
          </el-select>
        </el-form-item>

        <div class="grid gap-4 md:grid-cols-2">
          <el-form-item :label="t('users.isSuperUser')">
            <el-switch v-model="form.isSuperUser" />
          </el-form-item>

          <el-form-item :label="t('users.isActive')">
            <el-switch v-model="form.isActive" />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="isDialogVisible = false">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="isSaving" @click="submitUser">
            {{ isEditing ? t('users.actions.save') : t('users.actions.create') }}
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
  middleware: 'auth'
})

type ApiUser = {
  _id?: string
  id?: string
  username: string
  email: string
  roles?: Array<string | RoleOption>
  isSuperUser?: boolean
  isActive?: boolean
}

type UserForm = {
  username: string
  email: string
  password: string
  confirmPassword: string
  roles: string[]
  isSuperUser: boolean
  isActive: boolean
}

type UserPayload = Omit<UserForm, 'confirmPassword'>

type RawRoleOption = RoleOption | [string, string] | {
  id?: string
  value?: string
  label?: string
  text?: string
  title?: string
}

type RoleOption = {
  _id: string
  name: string
}

type UserResponse = ApiUser[] | {
  data?: ApiUser[] | { users?: ApiUser[]; items?: ApiUser[]; docs?: ApiUser[] }
  users?: ApiUser[]
  items?: ApiUser[]
  docs?: ApiUser[]
  message?: string
}

type RoleOptionsResponse = RawRoleOption[] | {
  data?: RawRoleOption[] | {
    roles?: RawRoleOption[]
    items?: RawRoleOption[]
    docs?: RawRoleOption[]
    options?: RawRoleOption[]
    results?: RawRoleOption[]
  }
  roles?: RawRoleOption[]
  items?: RawRoleOption[]
  docs?: RawRoleOption[]
  options?: RawRoleOption[]
  results?: RawRoleOption[]
}

const { t } = useI18n()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('auth_token')

const apiBaseUrl = computed(() => String(config.public.apiBaseUrl).replace(/\/$/, ''))
const usersEndpoint = computed(() => `${apiBaseUrl.value}/system/users`)
const roleOptionsEndpoint = computed(() => `${apiBaseUrl.value}/system/roles/select-options`)

const search = ref('')
const currentPage = ref(1)
const pageSize = ref(5)
const users = ref<ApiUser[]>([])
const roleOptions = ref<RoleOption[]>([])
const isLoading = ref(false)
const isLoadingRoles = ref(false)
const isSaving = ref(false)
const isDialogVisible = ref(false)
const editingUserId = ref<string | null>(null)
const userFormRef = ref<FormInstance>()

const form = reactive<UserForm>({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  roles: [],
  isSuperUser: false,
  isActive: true
})

const isEditing = computed(() => Boolean(editingUserId.value))

const validatePassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!isEditing.value && !value) {
    callback(new Error(t('users.validation.passwordRequired')))
    return
  }

  if (value && value.length < 6) {
    callback(new Error(t('users.validation.passwordMin')))
    return
  }

  if (form.confirmPassword) {
    userFormRef.value?.validateField('confirmPassword')
  }

  callback()
}

const validateConfirmPassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!isEditing.value && !value) {
    callback(new Error(t('users.validation.confirmPasswordRequired')))
    return
  }

  if ((form.password || value) && value !== form.password) {
    callback(new Error(t('users.validation.passwordsDoNotMatch')))
    return
  }

  callback()
}

const rules: FormRules<UserForm> = {
  username: [
    { required: true, message: () => t('users.validation.usernameRequired'), trigger: 'blur' }
  ],
  email: [
    { required: true, message: () => t('users.validation.emailRequired'), trigger: 'blur' },
    { type: 'email', message: () => t('users.validation.emailInvalid'), trigger: ['blur', 'change'] }
  ],
  password: [
    { validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  roles: [
    { type: 'array', required: true, min: 1, message: () => t('users.validation.rolesRequired'), trigger: 'change' }
  ]
}

const requestHeaders = computed(() => ({
  ...(authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {})
}))

const getUserId = (user: ApiUser) => user._id || user.id || ''
const getRoleId = (role: string | RoleOption) => typeof role === 'string' ? role : role._id
const getRoleLabel = (roleId: string) => roleOptions.value.find((role) => role._id === roleId)?.name || roleId

const extractUsers = (response: UserResponse): ApiUser[] => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data?.users)) return response.data.users
  if (Array.isArray(response.data?.items)) return response.data.items
  if (Array.isArray(response.data?.docs)) return response.data.docs
  if (Array.isArray(response.users)) return response.users
  if (Array.isArray(response.items)) return response.items
  if (Array.isArray(response.docs)) return response.docs
  return []
}

const normalizeRoleOption = (option: RawRoleOption): RoleOption | null => {
  if (Array.isArray(option)) {
    const [_id, name] = option
    return _id && name ? { _id, name } : null
  }

  const _id = option._id || option.id || option.value
  const name = option.name || option.label || option.text || option.title

  return _id && name ? { _id, name } : null
}

const extractRoleOptions = (response: RoleOptionsResponse): RoleOption[] => {
  let options: RawRoleOption[] = []

  if (Array.isArray(response)) options = response
  else if (Array.isArray(response.data)) options = response.data
  else if (Array.isArray(response.data?.roles)) options = response.data.roles
  else if (Array.isArray(response.data?.items)) options = response.data.items
  else if (Array.isArray(response.data?.docs)) options = response.data.docs
  else if (Array.isArray(response.data?.options)) options = response.data.options
  else if (Array.isArray(response.data?.results)) options = response.data.results
  else if (Array.isArray(response.roles)) options = response.roles
  else if (Array.isArray(response.items)) options = response.items
  else if (Array.isArray(response.docs)) options = response.docs
  else if (Array.isArray(response.options)) options = response.options
  else if (Array.isArray(response.results)) options = response.results

  return options
    .map(normalizeRoleOption)
    .filter((option): option is RoleOption => Boolean(option))
}

const ensureSelectedRoleOptions = (roleIds: string[]) => {
  const existingRoleIds = new Set(roleOptions.value.map((role) => role._id))
  const missingRoleOptions = roleIds
    .filter((roleId) => roleId && !existingRoleIds.has(roleId))
    .map((roleId) => ({ _id: roleId, name: roleId }))

  if (missingRoleOptions.length) {
    roleOptions.value = [...roleOptions.value, ...missingRoleOptions]
  }
}

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string; error?: string } }).data
    return data?.message || data?.error || t('common.errors.generic')
  }

  return t('common.errors.generic')
}

const filteredUsers = computed(() => {
  const keyword = search.value.toLowerCase().trim()
  if (!keyword) return users.value

  return users.value.filter((user) => {
    const values = [
      user.username,
      user.email,
      ...(user.roles || []),
      ...(user.roles || []).map((roleId) => getRoleLabel(getRoleId(roleId))),
      user.isSuperUser ? t('common.yes') : t('common.no'),
      user.isActive ? t('users.status.active') : t('users.status.inactive')
    ]

    return values.some((value) => String(value).toLowerCase().includes(keyword))
  })
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredUsers.value.slice(start, start + pageSize.value)
})

const resetForm = () => {
  editingUserId.value = null
  Object.assign(form, {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    roles: roleOptions.value[0]?._id ? [roleOptions.value[0]._id] : [],
    isSuperUser: false,
    isActive: true
  })
  userFormRef.value?.clearValidate()
}

const refreshUsers = async () => {
  isLoading.value = true

  try {
    const response = await $fetch<UserResponse>(usersEndpoint.value, {
      headers: requestHeaders.value
    })

    users.value = extractUsers(response).map((user) => ({
      ...user,
      roles: (user.roles || []).map(getRoleId),
      isSuperUser: Boolean(user.isSuperUser),
      isActive: user.isActive !== false
    }))
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isLoading.value = false
  }
}

const openCreateDialog = () => {
  resetForm()
  isDialogVisible.value = true
}

const openEditDialog = (user: ApiUser) => {
  editingUserId.value = getUserId(user)
  Object.assign(form, {
    username: user.username,
    email: user.email,
    password: '',
    confirmPassword: '',
    roles: (user.roles || []).map(getRoleId),
    isSuperUser: Boolean(user.isSuperUser),
    isActive: user.isActive !== false
  })
  isDialogVisible.value = true
}

const buildPayload = () => {
  const payload: UserPayload = {
    username: form.username.trim(),
    email: form.email.trim(),
    password: form.password,
    roles: form.roles,
    isSuperUser: form.isSuperUser,
    isActive: form.isActive
  }

  if (isEditing.value && !payload.password) {
    delete (payload as Partial<UserPayload>).password
  }

  return payload
}

const refreshRoleOptions = async () => {
  isLoadingRoles.value = true

  try {
    const response = await $fetch<RoleOptionsResponse>(roleOptionsEndpoint.value, {
      headers: requestHeaders.value
    })

    roleOptions.value = extractRoleOptions(response)
    ensureSelectedRoleOptions(form.roles)
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isLoadingRoles.value = false
  }
}

const submitUser = async () => {
  if (!userFormRef.value) return

  const isValid = await userFormRef.value.validate().catch(() => false)
  if (!isValid) return

  isSaving.value = true

  try {
    const url = isEditing.value ? `${usersEndpoint.value}/${editingUserId.value}` : usersEndpoint.value
    const method = isEditing.value ? 'PUT' : 'POST'

    await $fetch(url, {
      method,
      headers: requestHeaders.value,
      body: buildPayload()
    })

    ElMessage.success(isEditing.value ? t('users.messages.updated') : t('users.messages.created'))
    isDialogVisible.value = false
    await refreshUsers()
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isSaving.value = false
  }
}

const deleteUser = async (user: ApiUser) => {
  const userId = getUserId(user)
  if (!userId) {
    ElMessage.error(t('users.messages.missingId'))
    return
  }

  try {
    await ElMessageBox.confirm(
      t('users.confirmDelete.message', { username: user.username }),
      t('users.confirmDelete.title'),
      {
        confirmButtonText: t('users.actions.delete'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await $fetch(`${usersEndpoint.value}/${userId}`, {
      method: 'DELETE',
      headers: requestHeaders.value
    })

    ElMessage.success(t('users.messages.deleted'))
    await refreshUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(getErrorMessage(error))
    }
  }
}

watch(search, () => {
  currentPage.value = 1
})

onMounted(() => {
  refreshRoleOptions()
  refreshUsers()
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
