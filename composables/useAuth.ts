export type AuthRole = {
  _id?: string
  id?: string
  name?: string
  permissions?: Array<string | { name?: string }>
}

export type AuthUserProfile = {
  _id?: string
  id?: string
  code?: string
  userType?: string
  firstName?: string
  lastName?: string
  gender?: string
  dob?: string
  phoneNumber?: string
  address?: string
  profile?: unknown
  createdAt?: string
  updatedAt?: string
}

export type AuthUser = {
  _id?: string
  id?: string
  username?: string
  email?: string
  isActive?: boolean
  isSuperUser?: boolean
  roles?: AuthRole[]
  userProfile?: AuthUserProfile | null
  permission?: string[]
  permissions?: string[]
}

type LoginLikeResponse = {
  token?: string
  accessToken?: string
  access_token?: string
  data?: AuthUser & {
    token?: string
    accessToken?: string
    access_token?: string
  }
}

const cookieOptions = {
  maxAge: 60 * 60 * 24 * 7,
  sameSite: 'lax' as const
}

const getTokenFromResponse = (response: LoginLikeResponse) => {
  return response.token
    || response.accessToken
    || response.access_token
    || response.data?.token
    || response.data?.accessToken
    || response.data?.access_token
}

const getPermissionsFromUser = (user: AuthUser | null | undefined) => {
  const directPermissions = user?.permission || user?.permissions || []
  const rolePermissions = (user?.roles || []).flatMap((role) => role.permissions || [])
    .map((permission) => typeof permission === 'string' ? permission : permission.name || '')
    .filter(Boolean)

  return [...new Set([...directPermissions, ...rolePermissions])]
}

const normalizeAuthUser = (user: AuthUser): AuthUser => ({
  _id: user._id || user.id,
  id: user.id || user._id,
  username: user.username,
  email: user.email,
  isActive: user.isActive !== false,
  isSuperUser: Boolean(user.isSuperUser),
  roles: user.roles || [],
  userProfile: user.userProfile || null,
  permission: getPermissionsFromUser(user)
})

export const useAuth = () => {
  const token = useCookie<string | null>('auth_token', cookieOptions)
  const user = useCookie<AuthUser | null>('auth_user', cookieOptions)

  const isAuthenticated = computed(() => Boolean(token.value))
  const isSuperUser = computed(() => Boolean(user.value?.isSuperUser))
  const permissions = computed(() => getPermissionsFromUser(user.value))

  const hasPermission = (permission?: string | string[]) => {
    if (!permission || (Array.isArray(permission) && !permission.length)) return true
    if (isSuperUser.value) return true

    const requiredPermissions = Array.isArray(permission) ? permission : [permission]
    return requiredPermissions.every((item) => permissions.value.includes(item))
  }

  const hasAnyPermission = (permission?: string | string[]) => {
    if (!permission || (Array.isArray(permission) && !permission.length)) return true
    if (isSuperUser.value) return true

    const requiredPermissions = Array.isArray(permission) ? permission : [permission]
    return requiredPermissions.some((item) => permissions.value.includes(item))
  }

  const setAuth = (response: LoginLikeResponse) => {
    const nextToken = getTokenFromResponse(response)
    if (!nextToken) return false

    token.value = nextToken
    user.value = response.data ? normalizeAuthUser(response.data) : null

    return true
  }

  const clearAuth = () => {
    token.value = null
    user.value = null
  }

  return {
    token,
    user,
    permissions,
    isAuthenticated,
    isSuperUser,
    hasPermission,
    hasAnyPermission,
    setAuth,
    clearAuth
  }
}
