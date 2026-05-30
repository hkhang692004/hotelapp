import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { LoginPage } from '../pages/auth/LoginPage'
import { AnalyticsPage } from '../pages/analytics/AnalyticsPage'
import { BookingDetailPage } from '../pages/bookings/BookingDetailPage'
import { BookingsPage } from '../pages/bookings/BookingsPage'
import { CustomersPage } from '../pages/customers/CustomersPage'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { HousekeepingPage } from '../pages/housekeeping/HousekeepingPage'
import { PaymentsPage } from '../pages/payments/PaymentsPage'
import { VNPayReturnPage } from '../pages/payments/VNPayReturnPage'
import { RoomsPage } from '../pages/rooms/RoomsPage'
import { ServicesPage } from '../pages/services/ServicesPage'
import { StaffPage } from '../pages/staff/StaffPage'
import { GuestRoute, ProtectedRoute, RoleRoute } from './ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route path="/payments/vnpay/return" element={<VNPayReturnPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="bookings/:id" element={<BookingDetailPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="housekeeping" element={<HousekeepingPage />} />
          <Route
            path="analytics"
            element={
              <RoleRoute roles={['manager']}>
                <AnalyticsPage />
              </RoleRoute>
            }
          />
          <Route
            path="staff"
            element={
              <RoleRoute roles={['manager']}>
                <StaffPage />
              </RoleRoute>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
