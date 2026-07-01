<template>
  <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div class="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-base font-semibold">{{ t('roles.title') }}</h2>
        <p class="text-sm text-slate-500">{{ t('roles.description') }}</p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <el-input v-model="search" class="w-full sm:w-64" :placeholder="t('common.search')" clearable>
          <template #prefix>
            <Icon name="lucide:search" class="h-4 w-4 text-slate-400" />
          </template>
        </el-input>
        <el-button v-if="canCreateRole" type="primary" @click="openCreateDialog">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          {{ t('roles.actions.new') }}
        </el-button>
      </div>
    </div>

    <div class="p-5">
      <el-table v-loading="isLoading" :data="paginatedRoles" stripe class="w-full">
        <el-table-column prop="name" :label="t('roles.name')" min-width="180" />
        <el-table-column :label="t('roles.permissions')" min-width="280">
          <template #default="{ row }">
            <div class="flex flex-wrap gap-1">
              <el-tag v-for="permission in row.permissions" :key="permission" effect="plain" size="small">
                {{ getPermissionLabel(permission) }}
              </el-tag>
              <span v-if="!row.permissions.length" class="text-sm text-slate-400">
                {{ t('roles.emptyPermissions') }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="canUpdateRole || canDeleteRole" fixed="right" :label="t('common.actions')" width="130">
          <template #default="{ row }">
            <div class="flex items-center gap-1">
              <el-tooltip v-if="canUpdateRole" :content="t('roles.actions.edit')" placement="top">
                <el-button circle text @click="openEditDialog(row)">
                  <Icon name="lucide:pencil" class="h-4 w-4" />
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="canDeleteRole" :content="t('roles.actions.delete')" placement="top">
                <el-button circle text type="danger" @click="deleteRole(row)">
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
          :total="filteredRoles.length"
          background
          layout="total, sizes, prev, pager, next"
        />
      </div>
    </div>

    <el-dialog
      v-model="isDialogVisible"
      :title="isEditing ? t('roles.dialog.editTitle') : t('roles.dialog.createTitle')"
      fullscreen
      destroy-on-close
      draggable
    >
      <el-form
        ref="roleFormRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="submitRole"
      >
        <el-form-item :label="t('roles.name')" prop="name">
          <el-input v-model="form.name" :placeholder="t('roles.placeholders.name')" />
        </el-form-item>

        <el-form-item :label="t('roles.permissions')" prop="permissions">
          <div class="w-full rounded-lg border border-slate-200 p-3">
            <div v-if="isLoadingPermissions" class="py-4 text-sm text-slate-500">
              {{ t('roles.loadingPermissions') }}
            </div>
            <el-checkbox-group
              v-else-if="permissionOptions.length"
              v-model="form.permissions"
              class="permission-checkboxes"
            >
              <el-checkbox
                v-for="permission in permissionOptions"
                :key="permission._id"
                :label="permission._id"
              >
                {{ permission.name }}
              </el-checkbox>
            </el-checkbox-group>
            <div v-else class="py-4 text-sm text-slate-500">
              {{ t('roles.emptyPermissionOptions') }}
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="isDialogVisible = false">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="isSaving" @click="submitRole">
            {{ isEditing ? t('roles.actions.save') : t('roles.actions.create') }}
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
  permission: 'role.read'
})

type ApiRole = {
  _id?: string
  id?: string
  name: string
  permissions?: Array<string | PermissionOption>
}

type RoleForm = {
  name: string
  permissions: string[]
}

type PermissionOption = {
  _id: string
  name: string
}

type RawPermissionOption = PermissionOption | [string, string] | {
  id?: string
  value?: string
  label?: string
  text?: string
  title?: string
}

type RolesResponse = ApiRole[] | {
  data?: ApiRole[] | { roles?: ApiRole[]; items?: ApiRole[]; docs?: ApiRole[] }
  roles?: ApiRole[]
  items?: ApiRole[]
  docs?: ApiRole[]
}

type PermissionOptionsResponse = RawPermissionOption[] | {
  data?: RawPermissionOption[] | {
    permissions?: RawPermissionOption[]
    items?: RawPermissionOption[]
    docs?: RawPermissionOption[]
    options?: RawPermissionOption[]
    results?: RawPermissionOption[]
  }
  permissions?: RawPermissionOption[]
  items?: RawPermissionOption[]
  docs?: RawPermissionOption[]
  options?: RawPermissionOption[]
  results?: RawPermissionOption[]
}

const { t } = useI18n()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('auth_token')
const { hasPermission } = useAuth()

const apiBaseUrl = computed(() => String(config.public.apiBaseUrl).replace(/\/$/, ''))
const rolesEndpoint = computed(() => `${apiBaseUrl.value}/system/roles`)
const permissionOptionsEndpoint = computed(() => `${apiBaseUrl.value}/system/permissions/select-options`)

const search = ref('')
const currentPage = ref(1)
const pageSize = ref(5)
const roles = ref<ApiRole[]>([])
const permissionOptions = ref<PermissionOption[]>([])
const isLoading = ref(false)
const isLoadingPermissions = ref(false)
const isSaving = ref(false)
const isDialogVisible = ref(false)
const editingRoleId = ref<string | null>(null)
const roleFormRef = ref<FormInstance>()

const form = reactive<RoleForm>({
  name: '',
  permissions: []
})

const isEditing = computed(() => Boolean(editingRoleId.value))
const canCreateRole = computed(() => hasPermission('role.create'))
const canUpdateRole = computed(() => hasPermission('role.update'))
const canDeleteRole = computed(() => hasPermission('role.delete'))

const rules: FormRules<RoleForm> = {
  name: [
    { required: true, message: () => t('roles.validation.nameRequired'), trigger: 'blur' }
  ],
  permissions: [
    { type: 'array', required: true, min: 1, message: () => t('roles.validation.permissionsRequired'), trigger: 'change' }
  ]
}

const requestHeaders = computed(() => ({
  ...(authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {})
}))

const getRoleId = (role: ApiRole) => role._id || role.id || ''
const getPermissionId = (permission: string | PermissionOption) => typeof permission === 'string' ? permission : permission._id
const getPermissionLabel = (permissionId: string) => {
  return permissionOptions.value.find((permission) => permission._id === permissionId)?.name || permissionId
}

const extractRoles = (response: RolesResponse): ApiRole[] => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data?.roles)) return response.data.roles
  if (Array.isArray(response.data?.items)) return response.data.items
  if (Array.isArray(response.data?.docs)) return response.data.docs
  if (Array.isArray(response.roles)) return response.roles
  if (Array.isArray(response.items)) return response.items
  if (Array.isArray(response.docs)) return response.docs
  return []
}

const normalizePermissionOption = (option: RawPermissionOption): PermissionOption | null => {
  if (Array.isArray(option)) {
    const [_id, name] = option
    return _id && name ? { _id, name } : null
  }

  const _id = option._id || option.id || option.value
  const name = option.name || option.label || option.text || option.title

  return _id && name ? { _id, name } : null
}

const extractPermissionOptions = (response: PermissionOptionsResponse): PermissionOption[] => {
  let options: RawPermissionOption[] = []

  if (Array.isArray(response)) options = response
  else if (Array.isArray(response.data)) options = response.data
  else if (Array.isArray(response.data?.permissions)) options = response.data.permissions
  else if (Array.isArray(response.data?.items)) options = response.data.items
  else if (Array.isArray(response.data?.docs)) options = response.data.docs
  else if (Array.isArray(response.data?.options)) options = response.data.options
  else if (Array.isArray(response.data?.results)) options = response.data.results
  else if (Array.isArray(response.permissions)) options = response.permissions
  else if (Array.isArray(response.items)) options = response.items
  else if (Array.isArray(response.docs)) options = response.docs
  else if (Array.isArray(response.options)) options = response.options
  else if (Array.isArray(response.results)) options = response.results

  return options
    .map(normalizePermissionOption)
    .filter((option): option is PermissionOption => Boolean(option))
}

const ensureSelectedPermissionOptions = (permissionIds: string[]) => {
  const existingPermissionIds = new Set(permissionOptions.value.map((permission) => permission._id))
  const missingPermissionOptions = permissionIds
    .filter((permissionId) => permissionId && !existingPermissionIds.has(permissionId))
    .map((permissionId) => ({ _id: permissionId, name: permissionId }))

  if (missingPermissionOptions.length) {
    permissionOptions.value = [...permissionOptions.value, ...missingPermissionOptions]
  }
}

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string; error?: string } }).data
    return data?.message || data?.error || t('common.errors.generic')
  }

  return t('common.errors.generic')
}

const filteredRoles = computed(() => {
  const keyword = search.value.toLowerCase().trim()
  if (!keyword) return roles.value

  return roles.value.filter((role) => {
    const values = [
      role.name,
      ...(role.permissions || []),
      ...(role.permissions || []).map((permission) => getPermissionLabel(getPermissionId(permission)))
    ]

    return values.some((value) => String(value).toLowerCase().includes(keyword))
  })
})

const paginatedRoles = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRoles.value.slice(start, start + pageSize.value)
})

const resetForm = () => {
  editingRoleId.value = null
  Object.assign(form, {
    name: '',
    permissions: []
  })
  roleFormRef.value?.clearValidate()
}

const refreshRoles = async () => {
  isLoading.value = true

  try {
    const response = await $fetch<RolesResponse>(rolesEndpoint.value, {
      headers: requestHeaders.value
    })

    roles.value = extractRoles(response).map((role) => ({
      ...role,
      permissions: (role.permissions || []).map(getPermissionId)
    }))
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isLoading.value = false
  }
}

const refreshPermissionOptions = async () => {
  isLoadingPermissions.value = true

  try {
    const response = await $fetch<PermissionOptionsResponse>(permissionOptionsEndpoint.value, {
      headers: requestHeaders.value
    })

    permissionOptions.value = extractPermissionOptions(response)
    ensureSelectedPermissionOptions(form.permissions)
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isLoadingPermissions.value = false
  }
}

const openCreateDialog = () => {
  if (!canCreateRole.value) return

  resetForm()
  isDialogVisible.value = true
}

const openEditDialog = (role: ApiRole) => {
  if (!canUpdateRole.value) return

  editingRoleId.value = getRoleId(role)
  const permissions = (role.permissions || []).map(getPermissionId)

  Object.assign(form, {
    name: role.name,
    permissions
  })
  ensureSelectedPermissionOptions(permissions)
  isDialogVisible.value = true
}

const buildPayload = (): RoleForm => ({
  name: form.name.trim(),
  permissions: form.permissions
})

const submitRole = async () => {
  if (!roleFormRef.value) return
  if (isEditing.value && !canUpdateRole.value) return
  if (!isEditing.value && !canCreateRole.value) return

  const isValid = await roleFormRef.value.validate().catch(() => false)
  if (!isValid) return

  isSaving.value = true

  try {
    const url = isEditing.value ? `${rolesEndpoint.value}/${editingRoleId.value}` : rolesEndpoint.value
    const method = isEditing.value ? 'PUT' : 'POST'

    await $fetch(url, {
      method,
      headers: requestHeaders.value,
      body: buildPayload()
    })

    ElMessage.success(isEditing.value ? t('roles.messages.updated') : t('roles.messages.created'))
    isDialogVisible.value = false
    await refreshRoles()
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isSaving.value = false
  }
}

const deleteRole = async (role: ApiRole) => {
  if (!canDeleteRole.value) return

  const roleId = getRoleId(role)
  if (!roleId) {
    ElMessage.error(t('roles.messages.missingId'))
    return
  }

  try {
    await ElMessageBox.confirm(
      t('roles.confirmDelete.message', { name: role.name }),
      t('roles.confirmDelete.title'),
      {
        confirmButtonText: t('roles.actions.delete'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await $fetch(`${rolesEndpoint.value}/${roleId}`, {
      method: 'DELETE',
      headers: requestHeaders.value
    })

    ElMessage.success(t('roles.messages.deleted'))
    await refreshRoles()
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
  refreshPermissionOptions()
  refreshRoles()
})
</script>

<style scoped>
:deep(.el-button--primary) {
  --el-button-bg-color: #059669;
  --el-button-border-color: #059669;
  --el-button-hover-bg-color: #047857;
  --el-button-hover-border-color: #047857;
}

:deep(.permission-checkboxes) {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  width: 100%;
}

:deep(.permission-checkboxes .el-checkbox) {
  align-items: flex-start;
  height: auto;
  margin-right: 0;
  white-space: normal;
}

@media (min-width: 768px) {
  :deep(.permission-checkboxes) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  :deep(.permission-checkboxes) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
