export type PickedProductThumbnail = string | {
  bucket?: string
  objectName?: string
  originalName?: string
  mimeType?: string
  size?: number
  etag?: string
  url?: string
  secureUrl?: string
  secure_url?: string
  path?: string
  data?: PickedProductThumbnail
} | null

export type PickedProduct = {
  _id?: string
  id?: string
  code?: string
  nameEn?: string
  nameKh?: string
  unitPrice?: number
  discount?: number
  thumbnail?: PickedProductThumbnail
}

export type PickedOrder = {
  _id?: string
  id?: string
  product?: string | PickedProduct
  quantity?: number
}

type PickedProductsResponse = {
  data?: PickedOrder[] | { items?: PickedOrder[]; docs?: PickedOrder[]; orders?: PickedOrder[] }
  items?: PickedOrder[]
  docs?: PickedOrder[]
  orders?: PickedOrder[]
  message?: string
}

type PickedProductResponse = {
  data?: PickedOrder
  message?: string
}

const extractPickedOrders = (response: PickedProductsResponse | PickedOrder[]) => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data?.items)) return response.data.items
  if (Array.isArray(response.data?.docs)) return response.data.docs
  if (Array.isArray(response.data?.orders)) return response.data.orders
  if (Array.isArray(response.items)) return response.items
  if (Array.isArray(response.docs)) return response.docs
  if (Array.isArray(response.orders)) return response.orders
  return []
}

const getPickedProductId = (product?: string | PickedProduct) => {
  if (!product) return ''
  return typeof product === 'string' ? product : product._id || product.id || ''
}

const getPickedOrderId = (order?: PickedOrder) => order?._id || order?.id || ''

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string; error?: string } }).data
    return data?.message || data?.error || fallback
  }

  return fallback
}

export const usePickedProducts = () => {
  const config = useRuntimeConfig()
  const authToken = useCookie<string | null>('auth_token')
  const { isAuthenticated } = useAuth()

  const pickedProducts = useState<PickedOrder[]>('picked-products', () => [])
  const isPickedProductsLoading = useState('picked-products-loading', () => false)
  const isPickingProduct = useState('picked-product-saving', () => false)

  const apiBaseUrl = computed(() => String(config.public.apiBaseUrl).replace(/\/$/, ''))
  const ordersEndpoint = computed(() => `${apiBaseUrl.value}/saling/orders`)
  const requestHeaders = computed(() => ({
    ...(authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {})
  }))

  const pickedProductsCount = computed(() => {
    return pickedProducts.value.reduce((total, order) => total + Number(order.quantity || 0), 0)
  })

  const findPickedOrderByProduct = (productId: string) => {
    return pickedProducts.value.find((order) => getPickedProductId(order.product) === productId)
  }

  const setPickedOrder = (order?: PickedOrder) => {
    const orderId = getPickedOrderId(order)
    if (!order || !orderId) return

    const index = pickedProducts.value.findIndex((item) => getPickedOrderId(item) === orderId)
    if (index >= 0) {
      pickedProducts.value = pickedProducts.value.map((item, itemIndex) => itemIndex === index ? order : item)
      return
    }

    pickedProducts.value = [order, ...pickedProducts.value]
  }

  const fetchPickedProducts = async () => {
    if (!isAuthenticated.value) {
      pickedProducts.value = []
      return []
    }

    isPickedProductsLoading.value = true

    try {
      const response = await $fetch<PickedProductsResponse>(`${ordersEndpoint.value}/my-products`, {
        headers: requestHeaders.value
      })
      pickedProducts.value = extractPickedOrders(response)
      return pickedProducts.value
    } finally {
      isPickedProductsLoading.value = false
    }
  }

  const updatePickedQuantity = async (order: PickedOrder, quantity: number) => {
    const orderId = getPickedOrderId(order)
    if (!orderId) return null

    const response = await $fetch<PickedProductResponse>(`${ordersEndpoint.value}/${orderId}`, {
      method: 'PUT',
      headers: requestHeaders.value,
      body: {
        quantity: Math.max(Number(quantity || 1), 1)
      }
    })

    if (response.data) setPickedOrder(response.data)
    return response.data || null
  }

  const removePickedProduct = async (order: PickedOrder) => {
    const orderId = getPickedOrderId(order)
    if (!orderId) return

    await $fetch(`${ordersEndpoint.value}/${orderId}`, {
      method: 'DELETE',
      headers: requestHeaders.value
    })

    pickedProducts.value = pickedProducts.value.filter((item) => getPickedOrderId(item) !== orderId)
  }

  const pickProduct = async (productId: string) => {
    if (!isAuthenticated.value) {
      await navigateTo('/auth/login')
      return null
    }

    if (!productId) return null
    isPickingProduct.value = true

    try {
      if (!pickedProducts.value.length) {
        await fetchPickedProducts()
      }

      const existingOrder = findPickedOrderByProduct(productId)
      if (existingOrder) {
        return updatePickedQuantity(existingOrder, Number(existingOrder.quantity || 0) + 1)
      }

      const response = await $fetch<PickedProductResponse>(ordersEndpoint.value, {
        method: 'POST',
        headers: requestHeaders.value,
        body: {
          product: productId,
          quantity: 1
        }
      })

      if (response.data) setPickedOrder(response.data)
      return response.data || null
    } catch (error) {
      if (getErrorMessage(error, '') === 'Product is already picked') {
        await fetchPickedProducts()
        const existingOrder = findPickedOrderByProduct(productId)
        if (existingOrder) {
          return updatePickedQuantity(existingOrder, Number(existingOrder.quantity || 0) + 1)
        }
      }

      throw error
    } finally {
      isPickingProduct.value = false
    }
  }

  return {
    pickedProducts,
    pickedProductsCount,
    isPickedProductsLoading,
    isPickingProduct,
    fetchPickedProducts,
    pickProduct,
    updatePickedQuantity,
    removePickedProduct,
    getPickedProductId,
    getPickedOrderId
  }
}
