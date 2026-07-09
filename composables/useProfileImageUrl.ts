type ProfileImageObject = {
  objectName?: string
  publicId?: string
  public_id?: string
  fileName?: string
  filename?: string
  url?: string
  secureUrl?: string
  secure_url?: string
  path?: string
  data?: ProfileImageValue
}

type ProfileImageValue = string | ProfileImageObject | null | undefined | unknown

const minioBucketPathPattern = /\/order-management\/(.+?)(?:\?.*)?$/

const isProfileImageObject = (value: ProfileImageValue): value is ProfileImageObject => {
  return typeof value === 'object' && value !== null
}

export const useProfileImageUrl = (source: Ref<ProfileImageValue> | ComputedRef<ProfileImageValue>) => {
  const config = useRuntimeConfig()
  const authToken = useCookie<string | null>('auth_token')
  const imageUrl = ref('')

  const apiBaseUrl = computed(() => String(config.public.apiBaseUrl).replace(/\/$/, ''))
  const requestHeaders = computed(() => ({
    ...(authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {})
  }))

  const getObjectName = (value: ProfileImageValue): string => {
    if (!value) return ''

    if (typeof value === 'string') {
      if (value.startsWith('uploads/')) return ''

      const objectNameFromUrl = value.match(minioBucketPathPattern)?.[1]
      if (objectNameFromUrl) return decodeURIComponent(objectNameFromUrl)
      if (/^https?:\/\//.test(value)) return ''

      return value
    }

    if (!isProfileImageObject(value)) return ''
    if (value.data) return getObjectName(value.data)

    return value.objectName
      || value.publicId
      || value.public_id
      || value.fileName
      || value.filename
      || (value.url?.match(minioBucketPathPattern)?.[1]
        ? decodeURIComponent(value.url.match(minioBucketPathPattern)?.[1] || '')
        : '')
  }

  const getDirectUrl = (value: ProfileImageValue) => {
    if (!value) return ''

    if (typeof value === 'string') {
      if (/^https?:\/\//.test(value) && !getObjectName(value)) return value
      if (!value.startsWith('uploads/')) return ''

      return `${apiBaseUrl.value.replace(/\/api\/v\d+$/, '')}/${value.replace(/^\//, '')}`
    }

    if (!isProfileImageObject(value)) return ''
    if (value.data) return getDirectUrl(value.data)
    if (getObjectName(value)) return ''

    return value.secureUrl || value.secure_url || value.url || value.path || ''
  }

  const loadImageUrl = async () => {
    const value = source.value
    const directUrl = getDirectUrl(value)
    if (directUrl) {
      imageUrl.value = directUrl
      return
    }

    const objectName = getObjectName(value)
    if (!objectName) {
      imageUrl.value = ''
      return
    }

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

      imageUrl.value = response.data?.url || response.url || ''
    } catch (error) {
      console.error(error)
      imageUrl.value = ''
    }
  }

  watch(source, loadImageUrl, { immediate: true })

  return {
    imageUrl,
    loadImageUrl
  }
}
