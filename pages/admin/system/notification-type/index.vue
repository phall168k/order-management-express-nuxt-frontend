<template>
  <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div class="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-base font-semibold">{{ t('notificationTypes.title') }}</h2>
        <p class="text-sm text-slate-500">{{ t('notificationTypes.description') }}</p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <el-input v-model="search" class="w-full sm:w-64" :placeholder="t('common.search')" clearable>
          <template #prefix><Icon name="lucide:search" class="h-4 w-4 text-slate-400" /></template>
        </el-input>
        <el-button v-if="canCreate" type="primary" @click="openCreateDialog">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          {{ t('notificationTypes.actions.new') }}
        </el-button>
      </div>
    </div>

    <div class="p-5">
      <el-table v-loading="isLoading" :data="notificationTypes" stripe class="w-full">
        <el-table-column :label="t('notificationTypes.icon')" width="100" align="center">
          <template #default="{ row }">
            <span class="inline-grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
              <Icon :name="row.icon || 'lucide:bell'" class="h-5 w-5" />
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="name" :label="t('notificationTypes.name')" min-width="220" />
        <el-table-column :label="t('notificationTypes.createdBy')" min-width="200">
          <template #default="{ row }">
            <div v-if="row.createdByUser">
              <p class="font-medium text-slate-800">{{ row.createdByUser.username || row.createdByUser.email }}</p>
              <p v-if="row.createdByUser.username && row.createdByUser.email" class="text-xs text-slate-500">{{ row.createdByUser.email }}</p>
            </div>
            <span v-else class="text-slate-400">—</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('notificationTypes.createdAt')" min-width="180">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column v-if="canUpdate || canDelete" fixed="right" :label="t('common.actions')" width="130">
          <template #default="{ row }">
            <div class="flex items-center gap-1">
              <el-tooltip v-if="canUpdate" :content="t('notificationTypes.actions.edit')" placement="top">
                <el-button circle text @click="openEditDialog(row)"><Icon name="lucide:pencil" class="h-4 w-4" /></el-button>
              </el-tooltip>
              <el-tooltip v-if="canDelete" :content="t('notificationTypes.actions.delete')" placement="top">
                <el-button circle text type="danger" @click="deleteNotificationType(row)"><Icon name="lucide:trash-2" class="h-4 w-4" /></el-button>
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
      :title="isEditing ? t('notificationTypes.dialog.editTitle') : t('notificationTypes.dialog.createTitle')"
      width="520px"
      destroy-on-close
      draggable
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submitNotificationType">
        <el-form-item :label="t('notificationTypes.name')" prop="name">
          <el-input v-model="form.name" :placeholder="t('notificationTypes.placeholders.name')" />
        </el-form-item>
        <el-form-item :label="t('notificationTypes.icon')" prop="icon">
          <el-input v-model="form.icon" :placeholder="t('notificationTypes.placeholders.icon')">
            <template #prefix><Icon :name="form.icon || 'lucide:bell'" class="h-4 w-4" /></template>
          </el-input>
          <p class="mt-1 text-xs text-slate-500">{{ t('notificationTypes.iconHelp') }}</p>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="isDialogVisible = false">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="isSaving" @click="submitNotificationType">
            {{ isEditing ? t('notificationTypes.actions.save') : t('notificationTypes.actions.create') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  permission: 'notification-type.read'
})

type CreatedByUser = { _id?: string; id?: string; email?: string; username?: string }
type NotificationType = {
  _id?: string
  id?: string
  name: string
  icon: string
  createdByUser?: CreatedByUser | null
  createdAt?: string
  updatedAt?: string
}
type NotificationTypeForm = { name: string; icon: string }
type NotificationTypeResponse = NotificationType[] | {
  data?: NotificationType[] | { notificationTypes?: NotificationType[]; items?: NotificationType[]; docs?: NotificationType[] }
  notificationTypes?: NotificationType[]
  items?: NotificationType[]
  docs?: NotificationType[]
  pagination?: { total?: number; page?: number; limit?: number; totalPages?: number }
}

const { t, locale } = useI18n()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('auth_token')
const { hasPermission } = useAuth()

const endpoint = computed(() => `${String(config.public.apiBaseUrl).replace(/\/$/, '')}/system/notification-types`)
const requestHeaders = computed(() => ({ ...(authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {}) }))
const notificationTypes = ref<NotificationType[]>([])
const search = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const isLoading = ref(false)
const isSaving = ref(false)
const isDialogVisible = ref(false)
const editingId = ref<string | null>(null)
const formRef = ref<FormInstance>()
const form = reactive<NotificationTypeForm>({ name: '', icon: '' })
let searchTimer: ReturnType<typeof setTimeout> | undefined

const isEditing = computed(() => Boolean(editingId.value))
const canCreate = computed(() => hasPermission('notification-type.create'))
const canUpdate = computed(() => hasPermission('notification-type.update'))
const canDelete = computed(() => hasPermission('notification-type.delete'))
const rules: FormRules<NotificationTypeForm> = {
  name: [{ required: true, message: () => t('notificationTypes.validation.nameRequired'), trigger: 'blur' }],
  icon: [{ required: true, message: () => t('notificationTypes.validation.iconRequired'), trigger: 'blur' }]
}

const getId = (item: NotificationType) => item._id || item.id || ''
const extractItems = (response: NotificationTypeResponse): NotificationType[] => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data?.notificationTypes)) return response.data.notificationTypes
  if (Array.isArray(response.data?.items)) return response.data.items
  if (Array.isArray(response.data?.docs)) return response.data.docs
  if (Array.isArray(response.notificationTypes)) return response.notificationTypes
  if (Array.isArray(response.items)) return response.items
  if (Array.isArray(response.docs)) return response.docs
  return []
}
const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string; error?: string } }).data
    return data?.message || data?.error || t('common.errors.generic')
  }
  return t('common.errors.generic')
}
const formatDate = (value?: string) => value
  ? new Intl.DateTimeFormat(locale.value === 'km' ? 'km-KH' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '—'

const refreshNotificationTypes = async () => {
  isLoading.value = true
  try {
    const response = await $fetch<NotificationTypeResponse>(endpoint.value, {
      headers: requestHeaders.value,
      query: { page: currentPage.value, limit: pageSize.value, ...(search.value.trim() ? { search: search.value.trim() } : {}) }
    })
    notificationTypes.value = extractItems(response)
    totalItems.value = Array.isArray(response) ? notificationTypes.value.length : response.pagination?.total ?? notificationTypes.value.length
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  editingId.value = null
  Object.assign(form, { name: '', icon: '' })
  formRef.value?.clearValidate()
}
const openCreateDialog = () => {
  if (!canCreate.value) return
  resetForm()
  isDialogVisible.value = true
}
const openEditDialog = (item: NotificationType) => {
  if (!canUpdate.value) return
  editingId.value = getId(item)
  Object.assign(form, { name: item.name || '', icon: item.icon || '' })
  isDialogVisible.value = true
}
const submitNotificationType = async () => {
  if (!formRef.value || (isEditing.value ? !canUpdate.value : !canCreate.value)) return
  if (!await formRef.value.validate().catch(() => false)) return
  isSaving.value = true
  try {
    await $fetch(isEditing.value ? `${endpoint.value}/${editingId.value}` : endpoint.value, {
      method: isEditing.value ? 'PUT' : 'POST',
      headers: requestHeaders.value,
      body: { name: form.name.trim(), icon: form.icon.trim() }
    })
    ElMessage.success(t(isEditing.value ? 'notificationTypes.messages.updated' : 'notificationTypes.messages.created'))
    isDialogVisible.value = false
    await refreshNotificationTypes()
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isSaving.value = false
  }
}
const deleteNotificationType = async (item: NotificationType) => {
  if (!canDelete.value) return
  const id = getId(item)
  if (!id) return ElMessage.error(t('notificationTypes.messages.missingId'))
  try {
    await ElMessageBox.confirm(t('notificationTypes.confirmDelete.message', { name: item.name }), t('notificationTypes.confirmDelete.title'), {
      confirmButtonText: t('notificationTypes.actions.delete'), cancelButtonText: t('common.cancel'), type: 'warning', confirmButtonClass: 'el-button--danger'
    })
    await $fetch(`${endpoint.value}/${id}`, { method: 'DELETE', headers: requestHeaders.value })
    ElMessage.success(t('notificationTypes.messages.deleted'))
    if (notificationTypes.value.length === 1 && currentPage.value > 1) currentPage.value--
    else await refreshNotificationTypes()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(getErrorMessage(error))
  }
}

watch([currentPage, pageSize], refreshNotificationTypes)
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (currentPage.value === 1) refreshNotificationTypes()
    else currentPage.value = 1
  }, 350)
})
onMounted(refreshNotificationTypes)
onBeforeUnmount(() => { if (searchTimer) clearTimeout(searchTimer) })
</script>

<style scoped>
:deep(.el-button--primary) {
  --el-button-bg-color: #059669;
  --el-button-border-color: #059669;
  --el-button-hover-bg-color: #047857;
  --el-button-hover-border-color: #047857;
}
</style>
