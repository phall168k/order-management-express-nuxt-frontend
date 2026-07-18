<template>
  <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div class="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-base font-semibold">{{ t('notifications.title') }}</h2>
        <p class="text-sm text-slate-500">{{ t('notifications.description') }}</p>
      </div>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <el-input v-model="search" class="w-full sm:w-64" :placeholder="t('common.search')" clearable>
          <template #prefix><Icon name="lucide:search" class="h-4 w-4 text-slate-400" /></template>
        </el-input>
        <el-button v-if="canCreate" type="primary" @click="openCreateDialog">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />{{ t('notifications.actions.new') }}
        </el-button>
      </div>
    </div>

    <div class="p-5">
      <el-table v-loading="isLoading" :data="notifications" stripe class="w-full">
        <el-table-column :label="t('notifications.notification')" min-width="260">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <span class="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                <Icon :name="getNotificationType(row.notificationType)?.icon || 'lucide:bell'" class="h-5 w-5" />
              </span>
              <div class="min-w-0">
                <p class="truncate font-semibold text-slate-900">{{ row.title }}</p>
                <p class="truncate text-xs text-slate-500">{{ row.subject }}</p>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('notifications.type')" min-width="150">
          <template #default="{ row }">{{ getNotificationTypeLabel(row.notificationType) }}</template>
        </el-table-column>
        <el-table-column :label="t('notifications.sender')" min-width="180">
          <template #default="{ row }"><UserCell :user="getUser(row.sender)" /></template>
        </el-table-column>
        <el-table-column :label="t('notifications.receiver')" min-width="180">
          <template #default="{ row }"><UserCell :user="getUser(row.reciever)" /></template>
        </el-table-column>
        <el-table-column :label="t('common.status')" width="120">
          <template #default="{ row }">
            <el-tag :type="row.isSeen ? 'success' : 'warning'">{{ row.isSeen ? t('notifications.status.seen') : t('notifications.status.unseen') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('notifications.createdAt')" min-width="180">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column v-if="canUpdate || canDelete" fixed="right" :label="t('common.actions')" width="130">
          <template #default="{ row }">
            <div class="flex items-center gap-1">
              <el-tooltip v-if="canUpdate" :content="t('notifications.actions.edit')" placement="top">
                <el-button circle text @click="openEditDialog(row)"><Icon name="lucide:pencil" class="h-4 w-4" /></el-button>
              </el-tooltip>
              <el-tooltip v-if="canDelete" :content="t('notifications.actions.delete')" placement="top">
                <el-button circle text type="danger" @click="deleteNotification(row)"><Icon name="lucide:trash-2" class="h-4 w-4" /></el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-5 flex justify-end">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]" :total="totalItems" background layout="total, sizes, prev, pager, next" />
      </div>
    </div>

    <el-dialog v-model="isDialogVisible" :title="isEditing ? t('notifications.dialog.editTitle') : t('notifications.dialog.createTitle')" width="680px" destroy-on-close draggable>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submitNotification">
        <div class="grid gap-4 sm:grid-cols-2">
          <el-form-item :label="t('notifications.form.title')" prop="title">
            <el-input v-model="form.title" :placeholder="t('notifications.placeholders.title')" />
          </el-form-item>
          <el-form-item :label="t('notifications.type')" prop="notificationType">
            <el-select v-model="form.notificationType" class="w-full" filterable :loading="optionsLoading" :placeholder="t('notifications.placeholders.type')">
              <el-option v-for="option in notificationTypeOptions" :key="getOptionId(option)" :label="option.name" :value="getOptionId(option)">
                <span class="flex items-center gap-2"><Icon :name="option.icon || 'lucide:bell'" class="h-4 w-4" />{{ option.name }}</span>
              </el-option>
            </el-select>
          </el-form-item>
        </div>
        <el-form-item :label="t('notifications.subject')" prop="subject">
          <el-input v-model="form.subject" type="textarea" :rows="3" :placeholder="t('notifications.placeholders.subject')" />
        </el-form-item>
        <div class="grid gap-4 sm:grid-cols-2">
          <el-form-item :label="t('notifications.receiver')" prop="reciever">
            <el-select v-model="form.reciever" class="w-full" filterable :loading="optionsLoading" :placeholder="t('notifications.placeholders.receiver')">
              <el-option v-for="option in userOptions" :key="option.id" :label="getUserLabel(option)" :value="option.id" />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('notifications.link')" prop="link">
            <el-input v-model="form.link" :placeholder="t('notifications.placeholders.link')" />
          </el-form-item>
        </div>
        <el-form-item :label="t('notifications.isSeen')">
          <el-switch v-model="form.isSeen" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="isDialogVisible = false">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="isSaving" @click="submitNotification">{{ isEditing ? t('notifications.actions.save') : t('notifications.actions.create') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

definePageMeta({ layout: 'admin', middleware: 'auth', permission: 'notification.read' })

type ApiUser = { _id?: string; id?: string; value?: string; label?: string; username?: string; email?: string }
type UserOption = { id: string; username?: string; email?: string; label?: string }
type NotificationTypeOption = { _id?: string; id?: string; value?: string; name: string; icon?: string }
type ApiNotification = {
  _id?: string; id?: string; title: string; subject: string
  sender?: string | ApiUser; reciever?: string | ApiUser
  notificationType?: string | NotificationTypeOption; link?: string; isSeen?: boolean
  createdAt?: string; updatedAt?: string
}
type NotificationForm = { title: string; subject: string; reciever: string; notificationType: string; link: string; isSeen: boolean }
type CollectionResponse<T> = T[] | { data?: T[] | { notifications?: T[]; notificationTypes?: T[]; users?: T[]; items?: T[]; docs?: T[]; options?: T[]; results?: T[] }; notifications?: T[]; notificationTypes?: T[]; users?: T[]; items?: T[]; docs?: T[]; options?: T[]; results?: T[]; pagination?: { total?: number } }

const UserCell = defineComponent({
  props: { user: { type: Object as PropType<ApiUser | null>, default: null } },
  setup(props) {
    return () => h('div', props.user ? [
      h('p', { class: 'font-medium text-slate-800' }, props.user.username || props.user.email || '—'),
      props.user.username && props.user.email ? h('p', { class: 'text-xs text-slate-500' }, props.user.email) : null
    ] : [h('span', { class: 'text-slate-400' }, '—')])
  }
})

const { t, locale } = useI18n()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('auth_token')
const { hasPermission } = useAuth()
const apiBaseUrl = computed(() => String(config.public.apiBaseUrl).replace(/\/$/, ''))
const endpoint = computed(() => `${apiBaseUrl.value}/system/notifications`)
const typeOptionsEndpoint = computed(() => `${apiBaseUrl.value}/system/notification-types/select-options`)
const userOptionsEndpoint = computed(() => `${apiBaseUrl.value}/system/users/select-options`)
const requestHeaders = computed(() => ({ ...(authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {}) }))

const notifications = ref<ApiNotification[]>([])
const notificationTypeOptions = ref<NotificationTypeOption[]>([])
const userOptions = ref<UserOption[]>([])
const search = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const isLoading = ref(false)
const isSaving = ref(false)
const optionsLoading = ref(false)
const isDialogVisible = ref(false)
const editingId = ref<string | null>(null)
const formRef = ref<FormInstance>()
const form = reactive<NotificationForm>({ title: '', subject: '', reciever: '', notificationType: '', link: '', isSeen: false })
let searchTimer: ReturnType<typeof setTimeout> | undefined

const isEditing = computed(() => Boolean(editingId.value))
const canCreate = computed(() => hasPermission('notification.create'))
const canUpdate = computed(() => hasPermission('notification.update'))
const canDelete = computed(() => hasPermission('notification.delete'))
const rules: FormRules<NotificationForm> = {
  title: [{ required: true, message: () => t('notifications.validation.titleRequired'), trigger: 'blur' }],
  subject: [{ required: true, message: () => t('notifications.validation.subjectRequired'), trigger: 'blur' }],
  reciever: [{ required: true, message: () => t('notifications.validation.receiverRequired'), trigger: 'change' }],
  notificationType: [{ required: true, message: () => t('notifications.validation.typeRequired'), trigger: 'change' }]
}

const getId = (item: ApiNotification) => item._id || item.id || ''
const getOptionId = (item?: NotificationTypeOption) => item?._id || item?.id || item?.value || ''
const getUserId = (item?: string | ApiUser) => typeof item === 'string' ? item : item?._id || item?.id || item?.value || ''
const getUser = (item?: string | ApiUser): ApiUser | null => typeof item === 'object' && item ? item : userOptions.value.find(option => option.id === item) || null
const getNotificationType = (item?: string | NotificationTypeOption): NotificationTypeOption | null => typeof item === 'object' && item ? item : notificationTypeOptions.value.find(option => getOptionId(option) === item) || null
const getNotificationTypeLabel = (item?: string | NotificationTypeOption) => getNotificationType(item)?.name || (typeof item === 'string' ? item : '') || '—'
const getUserLabel = (item: UserOption) => item.label || item.username || item.email || item.id
const formatDate = (value?: string) => value ? new Intl.DateTimeFormat(locale.value === 'km' ? 'km-KH' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
const extract = <T>(response: CollectionResponse<T>, keys: ('notifications' | 'notificationTypes' | 'users')[] = []): T[] => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  for (const key of keys) {
    const nested = response.data?.[key] ?? response[key]
    if (Array.isArray(nested)) return nested
  }
  for (const key of ['items', 'docs', 'options', 'results'] as const) {
    const nested = response.data?.[key] ?? response[key]
    if (Array.isArray(nested)) return nested
  }
  return []
}
const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string; error?: string } }).data
    return data?.message || data?.error || t('common.errors.generic')
  }
  return t('common.errors.generic')
}

const refreshNotifications = async () => {
  isLoading.value = true
  try {
    const response = await $fetch<CollectionResponse<ApiNotification>>(endpoint.value, { headers: requestHeaders.value, query: { page: currentPage.value, limit: pageSize.value, ...(search.value.trim() ? { search: search.value.trim() } : {}) } })
    notifications.value = extract(response, ['notifications'])
    totalItems.value = Array.isArray(response) ? notifications.value.length : response.pagination?.total ?? notifications.value.length
  } catch (error) { ElMessage.error(getErrorMessage(error)) } finally { isLoading.value = false }
}
const loadOptions = async () => {
  if (optionsLoading.value || (notificationTypeOptions.value.length && userOptions.value.length)) return
  optionsLoading.value = true
  try {
    const [typesResponse, usersResponse] = await Promise.all([
      $fetch<CollectionResponse<NotificationTypeOption>>(typeOptionsEndpoint.value, { headers: requestHeaders.value, query: { page: 1, limit: 1000 } }),
      $fetch<CollectionResponse<ApiUser>>(userOptionsEndpoint.value, { headers: requestHeaders.value, query: { page: 1, limit: 1000 } })
    ])
    notificationTypeOptions.value = extract(typesResponse, ['notificationTypes'])
    userOptions.value = extract(usersResponse, ['users']).map(user => ({ id: getUserId(user), username: user.username, email: user.email, label: user.label })).filter(user => user.id)
  } catch (error) { ElMessage.error(getErrorMessage(error)) } finally { optionsLoading.value = false }
}
const ensureEditOptions = (item: ApiNotification) => {
  const type = getNotificationType(item.notificationType)
  if (type && !notificationTypeOptions.value.some(option => getOptionId(option) === getOptionId(type))) notificationTypeOptions.value.push(type)
  const receiver = getUser(item.reciever)
  const receiverId = getUserId(item.reciever)
  if (receiverId && !userOptions.value.some(option => option.id === receiverId)) userOptions.value.push({ id: receiverId, username: receiver?.username, email: receiver?.email })
}
const resetForm = () => { editingId.value = null; Object.assign(form, { title: '', subject: '', reciever: '', notificationType: '', link: '', isSeen: false }); formRef.value?.clearValidate() }
const openCreateDialog = async () => { if (!canCreate.value) return; resetForm(); isDialogVisible.value = true; await loadOptions() }
const openEditDialog = async (item: ApiNotification) => {
  if (!canUpdate.value) return
  editingId.value = getId(item); ensureEditOptions(item)
  Object.assign(form, { title: item.title || '', subject: item.subject || '', reciever: getUserId(item.reciever), notificationType: typeof item.notificationType === 'string' ? item.notificationType : getOptionId(item.notificationType), link: item.link || '', isSeen: Boolean(item.isSeen) })
  isDialogVisible.value = true; await loadOptions()
}
const submitNotification = async () => {
  if (!formRef.value || (isEditing.value ? !canUpdate.value : !canCreate.value) || !await formRef.value.validate().catch(() => false)) return
  isSaving.value = true
  try {
    await $fetch(isEditing.value ? `${endpoint.value}/${editingId.value}` : endpoint.value, { method: isEditing.value ? 'PUT' : 'POST', headers: requestHeaders.value, body: { title: form.title.trim(), subject: form.subject.trim(), reciever: form.reciever, notificationType: form.notificationType, link: form.link.trim(), isSeen: form.isSeen } })
    ElMessage.success(t(isEditing.value ? 'notifications.messages.updated' : 'notifications.messages.created')); isDialogVisible.value = false; await refreshNotifications()
  } catch (error) { ElMessage.error(getErrorMessage(error)) } finally { isSaving.value = false }
}
const deleteNotification = async (item: ApiNotification) => {
  if (!canDelete.value) return
  const id = getId(item); if (!id) return ElMessage.error(t('notifications.messages.missingId'))
  try {
    await ElMessageBox.confirm(t('notifications.confirmDelete.message', { title: item.title }), t('notifications.confirmDelete.title'), { confirmButtonText: t('notifications.actions.delete'), cancelButtonText: t('common.cancel'), type: 'warning', confirmButtonClass: 'el-button--danger' })
    await $fetch(`${endpoint.value}/${id}`, { method: 'DELETE', headers: requestHeaders.value }); ElMessage.success(t('notifications.messages.deleted'))
    if (notifications.value.length === 1 && currentPage.value > 1) currentPage.value--; else await refreshNotifications()
  } catch (error) { if (error !== 'cancel') ElMessage.error(getErrorMessage(error)) }
}

watch([currentPage, pageSize], refreshNotifications)
watch(search, () => { if (searchTimer) clearTimeout(searchTimer); searchTimer = setTimeout(() => { if (currentPage.value === 1) refreshNotifications(); else currentPage.value = 1 }, 350) })
onMounted(refreshNotifications)
onBeforeUnmount(() => { if (searchTimer) clearTimeout(searchTimer) })
</script>

<style scoped>
:deep(.el-button--primary) { --el-button-bg-color: #059669; --el-button-border-color: #059669; --el-button-hover-bg-color: #047857; --el-button-hover-border-color: #047857; }
</style>
