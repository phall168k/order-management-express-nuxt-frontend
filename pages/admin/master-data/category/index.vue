<template>
  <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div class="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-base font-semibold">{{ t('categories.title') }}</h2>
        <p class="text-sm text-slate-500">{{ t('categories.description') }}</p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <el-input v-model="search" class="w-full sm:w-64" :placeholder="t('common.search')" clearable>
          <template #prefix>
            <Icon name="lucide:search" class="h-4 w-4 text-slate-400" />
          </template>
        </el-input>
        <el-button v-if="canCreateCategory" type="primary" @click="openCreateDialog">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          {{ t('categories.actions.new') }}
        </el-button>
      </div>
    </div>

    <div class="p-5">
      <el-table v-loading="isLoading" :data="categories" stripe class="w-full">
        <el-table-column prop="code" :label="t('categories.code')" min-width="130" />
        <el-table-column prop="nameEn" :label="t('categories.nameEn')" min-width="180" />
        <el-table-column prop="nameKh" :label="t('categories.nameKh')" min-width="180" />
        <el-table-column prop="description" :label="t('common.description')" min-width="240" show-overflow-tooltip />
        <el-table-column :label="t('common.createdBy')" min-width="160">
          <template #default="{ row }">
            {{ row.createdByUser?.username || row.createdByUser?.email || '-' }}
          </template>
        </el-table-column>
        <el-table-column v-if="canUpdateCategory || canDeleteCategory" fixed="right" :label="t('common.actions')" width="130">
          <template #default="{ row }">
            <div class="flex items-center gap-1">
              <el-tooltip v-if="canUpdateCategory" :content="t('categories.actions.edit')" placement="top">
                <el-button circle text @click="openEditDialog(row)">
                  <Icon name="lucide:pencil" class="h-4 w-4" />
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="canDeleteCategory" :content="t('categories.actions.delete')" placement="top">
                <el-button circle text type="danger" @click="deleteCategory(row)">
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
      :title="isEditing ? t('categories.dialog.editTitle') : t('categories.dialog.createTitle')"
      width="720px"
      destroy-on-close
      draggable
    >
      <el-form
        ref="categoryFormRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="submitCategory"
      >
        <div class="grid gap-4 md:grid-cols-2">
          <el-form-item :label="t('categories.code')" prop="code">
            <el-input v-model="form.code" :placeholder="t('categories.placeholders.code')" />
          </el-form-item>

          <el-form-item :label="t('categories.nameEn')" prop="nameEn">
            <el-input v-model="form.nameEn" :placeholder="t('categories.placeholders.nameEn')" />
          </el-form-item>
        </div>

        <el-form-item :label="t('categories.nameKh')" prop="nameKh">
          <el-input v-model="form.nameKh" :placeholder="t('categories.placeholders.nameKh')" />
        </el-form-item>

        <el-form-item :label="t('common.description')" prop="description">
          <el-input
            v-model="form.description"
            :placeholder="t('categories.placeholders.description')"
            :rows="3"
            type="textarea"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="isDialogVisible = false">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="isSaving" @click="submitCategory">
            {{ isEditing ? t('categories.actions.save') : t('categories.actions.create') }}
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
  permission: 'category.read'
})

type CreatedByUser = {
  _id?: string
  email?: string
  username?: string
}

type ApiCategory = {
  _id?: string
  id?: string
  code: string
  nameEn: string
  nameKh: string
  description?: string
  createdByUser?: CreatedByUser
}

type CategoryForm = {
  code: string
  nameEn: string
  nameKh: string
  description: string
}

type PaginatedResponse = {
  data?: ApiCategory[] | { categories?: ApiCategory[]; items?: ApiCategory[]; docs?: ApiCategory[] }
  categories?: ApiCategory[]
  items?: ApiCategory[]
  docs?: ApiCategory[]
  pagination?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
  message?: string
}

type CategoryResponse = ApiCategory[] | PaginatedResponse

const { t } = useI18n()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('auth_token')
const { hasPermission } = useAuth()

const apiBaseUrl = computed(() => String(config.public.apiBaseUrl).replace(/\/$/, ''))
const categoriesEndpoint = computed(() => `${apiBaseUrl.value}/master-data/categories`)

const search = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const categories = ref<ApiCategory[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const isDialogVisible = ref(false)
const editingCategoryId = ref<string | null>(null)
const categoryFormRef = ref<FormInstance>()

const form = reactive<CategoryForm>({
  code: '',
  nameEn: '',
  nameKh: '',
  description: ''
})

const isEditing = computed(() => Boolean(editingCategoryId.value))
const canCreateCategory = computed(() => hasPermission('category.create'))
const canUpdateCategory = computed(() => hasPermission('category.update'))
const canDeleteCategory = computed(() => hasPermission('category.delete'))

const rules: FormRules<CategoryForm> = {
  code: [
    { required: true, message: () => t('categories.validation.codeRequired'), trigger: 'blur' }
  ],
  nameEn: [
    { required: true, message: () => t('categories.validation.nameEnRequired'), trigger: 'blur' }
  ],
  nameKh: [
    { required: true, message: () => t('categories.validation.nameKhRequired'), trigger: 'blur' }
  ]
}

const requestHeaders = computed(() => ({
  ...(authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {})
}))

const getCategoryId = (category: ApiCategory) => category._id || category.id || ''

const extractCategories = (response: CategoryResponse): ApiCategory[] => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data?.categories)) return response.data.categories
  if (Array.isArray(response.data?.items)) return response.data.items
  if (Array.isArray(response.data?.docs)) return response.data.docs
  if (Array.isArray(response.categories)) return response.categories
  if (Array.isArray(response.items)) return response.items
  if (Array.isArray(response.docs)) return response.docs
  return []
}

const getTotalItems = (response: CategoryResponse, items: ApiCategory[]) => {
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

const refreshCategories = async () => {
  isLoading.value = true

  try {
    const response = await $fetch<CategoryResponse>(categoriesEndpoint.value, {
      headers: requestHeaders.value,
      query: buildQuery()
    })

    const items = extractCategories(response)
    categories.value = items
    totalItems.value = getTotalItems(response, items)
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  editingCategoryId.value = null
  Object.assign(form, {
    code: '',
    nameEn: '',
    nameKh: '',
    description: ''
  })
  categoryFormRef.value?.clearValidate()
}

const openCreateDialog = () => {
  if (!canCreateCategory.value) return

  resetForm()
  isDialogVisible.value = true
}

const openEditDialog = (category: ApiCategory) => {
  if (!canUpdateCategory.value) return

  editingCategoryId.value = getCategoryId(category)
  Object.assign(form, {
    code: category.code,
    nameEn: category.nameEn,
    nameKh: category.nameKh,
    description: category.description || ''
  })
  isDialogVisible.value = true
}

const buildPayload = (): CategoryForm => ({
  code: form.code.trim(),
  nameEn: form.nameEn.trim(),
  nameKh: form.nameKh.trim(),
  description: form.description.trim()
})

const submitCategory = async () => {
  if (!categoryFormRef.value) return
  if (isEditing.value && !canUpdateCategory.value) return
  if (!isEditing.value && !canCreateCategory.value) return

  const isValid = await categoryFormRef.value.validate().catch(() => false)
  if (!isValid) return

  isSaving.value = true

  try {
    const url = isEditing.value ? `${categoriesEndpoint.value}/${editingCategoryId.value}` : categoriesEndpoint.value
    const method = isEditing.value ? 'PUT' : 'POST'

    await $fetch(url, {
      method,
      headers: requestHeaders.value,
      body: buildPayload()
    })

    ElMessage.success(isEditing.value ? t('categories.messages.updated') : t('categories.messages.created'))
    isDialogVisible.value = false
    await refreshCategories()
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    isSaving.value = false
  }
}

const deleteCategory = async (category: ApiCategory) => {
  if (!canDeleteCategory.value) return

  const categoryId = getCategoryId(category)
  if (!categoryId) {
    ElMessage.error(t('categories.messages.missingId'))
    return
  }

  try {
    await ElMessageBox.confirm(
      t('categories.confirmDelete.message', { code: category.code }),
      t('categories.confirmDelete.title'),
      {
        confirmButtonText: t('categories.actions.delete'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await $fetch(`${categoriesEndpoint.value}/${categoryId}`, {
      method: 'DELETE',
      headers: requestHeaders.value
    })

    ElMessage.success(t('categories.messages.deleted'))
    await refreshCategories()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(getErrorMessage(error))
    }
  }
}

watch([currentPage, pageSize], () => {
  refreshCategories()
})

watch(search, () => {
  currentPage.value = 1
  refreshCategories()
})

onMounted(() => {
  refreshCategories()
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
