export const BOOKING_STATUS = {
  pending: { label: 'Chờ xác nhận', tone: 'warning' },
  confirmed: { label: 'Đã xác nhận', tone: 'info' },
  checked_in: { label: 'Đã check-in', tone: 'success' },
  checked_out: { label: 'Đã check-out', tone: 'default' },
  cancelled: { label: 'Đã hủy', tone: 'danger' },
}

export const ROOM_STATUS = {
  available: { label: 'Trống', tone: 'success' },
  reserved: { label: 'Đã đặt', tone: 'info' },
  occupied: { label: 'Có khách', tone: 'warning' },
  cleaning: { label: 'Đang dọn', tone: 'default' },
  maintenance: { label: 'Bảo trì', tone: 'danger' },
}

export const BOOKING_PAYMENT_STATUS = {
  unpaid: { label: 'Chưa thanh toán', tone: 'warning' },
  partial: { label: 'Thanh toán một phần', tone: 'info' },
  paid: { label: 'Đã thanh toán', tone: 'success' },
}

export const PAYMENT_STATUS = {
  pending: { label: 'Chờ thanh toán', tone: 'warning' },
  completed: { label: 'Hoàn tất', tone: 'success' },
  failed: { label: 'Thất bại', tone: 'danger' },
  refunded: { label: 'Đã hoàn', tone: 'default' },
}

export const PAYMENT_METHOD = {
  cash: 'Tiền mặt',
  card: 'Thẻ',
  bank_transfer: 'Chuyển khoản',
  momo: 'MoMo',
  vnpay: 'VNPay',
}

export const SERVICE_ORDER_STATUS = {
  pending: { label: 'Chờ xử lý', tone: 'warning' },
  confirmed: { label: 'Đã xác nhận', tone: 'info' },
  completed: { label: 'Hoàn tất', tone: 'success' },
  cancelled: { label: 'Đã hủy', tone: 'danger' },
}

export const HK_STATUS = {
  pending: { label: 'Chờ làm', tone: 'warning' },
  in_progress: { label: 'Đang làm', tone: 'info' },
  completed: { label: 'Hoàn tất', tone: 'success' },
  cancelled: { label: 'Đã hủy', tone: 'danger' },
}

export const HK_PRIORITY = {
  low: { label: 'Thấp', tone: 'default' },
  normal: { label: 'Bình thường', tone: 'info' },
  high: { label: 'Cao', tone: 'danger' },
}

export const STAFF_ROLE = {
  manager: 'Quản lý',
  receptionist: 'Lễ tân',
  housekeeping: 'Dọn phòng',
}

export function getStatusMeta(map, value) {
  return map[value] || { label: value, tone: 'default' }
}
