export const WEB_ROLES = ['receptionist', 'manager']

export const ROLE_LABELS = {
  manager: 'Quản lý',
  receptionist: 'Lễ tân',
  superuser: 'Super Admin',
}

export function canAccessWeb(user) {
  if (!user) return false
  if (user.is_superuser) return true
  return WEB_ROLES.includes(user.role)
}

export function getRoleLabel(user) {
  if (user?.is_superuser) return ROLE_LABELS.superuser
  return ROLE_LABELS[user?.role] || user?.role
}

export function hasRole(user, roles) {
  if (!user) return false
  if (user.is_superuser) return true
  return roles.includes(user.role)
}
