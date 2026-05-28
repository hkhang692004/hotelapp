import {
  LayoutDashboard,
  CalendarDays,
  BedDouble,
  Users,
  CreditCard,
  Sparkles,
  ClipboardList,
  BarChart3,
  UserCog,
  ExternalLink,
} from 'lucide-react'

export const NAV_ITEMS = [
  { path: '/', label: 'Tổng quan', icon: LayoutDashboard, roles: ['receptionist', 'manager'] },
  { path: '/bookings', label: 'Đặt phòng', icon: CalendarDays, roles: ['receptionist', 'manager'] },
  { path: '/rooms', label: 'Phòng', icon: BedDouble, roles: ['receptionist', 'manager'] },
  { path: '/customers', label: 'Khách hàng', icon: Users, roles: ['receptionist', 'manager'] },
  { path: '/payments', label: 'Thanh toán', icon: CreditCard, roles: ['receptionist', 'manager'] },
  { path: '/services', label: 'Dịch vụ', icon: Sparkles, roles: ['receptionist', 'manager'] },
  { path: '/housekeeping', label: 'Dọn phòng', icon: ClipboardList, roles: ['receptionist', 'manager'] },
  { path: '/analytics', label: 'Báo cáo', icon: BarChart3, roles: ['manager'] },
  { path: '/staff', label: 'Nhân viên', icon: UserCog, roles: ['manager'] },
  { path: '/admin', label: 'Django Admin', icon: ExternalLink, roles: ['manager'], external: true, superuserOnly: true },
]

export function getNavForUser(user) {
  return NAV_ITEMS.filter((item) => {
    if (item.superuserOnly && !user?.is_superuser) return false
    if (user?.is_superuser) return true
    return item.roles.includes(user?.role)
  })
}
