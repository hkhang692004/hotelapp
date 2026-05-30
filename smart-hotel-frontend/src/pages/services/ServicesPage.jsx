import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { fetchBookings } from '../../api/bookings'
import {
  cancelServiceOrder,
  confirmServiceOrder,
  createService,
  createServiceCategory,
  createServiceOrder,
  deleteService,
  fetchServiceCategories,
  fetchServiceOrders,
  fetchServices,
  updateService,
} from '../../api/services'
import { Header } from '../../components/layout/Header'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Select'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Tabs } from '../../components/ui/Tabs'
import { Textarea } from '../../components/ui/Textarea'
import { useAuth } from '../../contexts/AuthContext'
import { getErrorMessage } from '../../hooks/useAsync'
import { formatDateTime, formatMoney } from '../../utils/format'
import { SERVICE_ORDER_STATUS } from '../../utils/status'
import { hasRole } from '../../utils/roles'

export function ServicesPage() {
  const { user } = useAuth()
  const isManager = hasRole(user, ['manager'])
  const [tab, setTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({})
  const [orderOpen, setOrderOpen] = useState(false)
  const [serviceModal, setServiceModal] = useState(null)
  const [categoryModal, setCategoryModal] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [orderForm, setOrderForm] = useState({ booking_id: '', service_id: '', quantity: 1, note: '' })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (tab === 'orders') {
        const result = await fetchServiceOrders({ page, page_size: 20 })
        setOrders(result.items)
        setMeta(result.meta)
      } else {
        const [svc, cats] = await Promise.all([
          fetchServices({ is_active: '', include_staff_only: isManager ? true : undefined }),
          fetchServiceCategories(),
        ])
        setServices(Array.isArray(svc) ? svc : [])
        setCategories(Array.isArray(cats) ? cats : [])
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [tab, page])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (orderOpen) {
      Promise.all([
        fetchBookings({ page_size: 100, status: 'checked_in' }),
        fetchServices({ is_active: true }),
      ]).then(([b, s]) => {
        setBookings(b.items)
        setServices(Array.isArray(s) ? s : [])
      }).catch(() => {})
    }
  }, [orderOpen])

  async function handleOrder(e) {
    e.preventDefault()
    setError('')
    try {
      await createServiceOrder({
        booking_id: orderForm.booking_id,
        items: [{ service_id: orderForm.service_id, quantity: Number(orderForm.quantity) }],
        note: orderForm.note,
      })
      setOrderOpen(false)
      setOrderForm({ booking_id: '', service_id: '', quantity: 1, note: '' })
      load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function saveCategory(e) {
    e.preventDefault()
    setError('')
    try {
      await createServiceCategory({ name: categoryName.trim() })
      setCategoryModal(false)
      setCategoryName('')
      load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function saveService(e) {
    e.preventDefault()
    const form = new FormData(e.target)
    const payload = {
      category_id: form.get('category_id'),
      name: form.get('name'),
      description: form.get('description'),
      price: form.get('price'),
      unit: form.get('unit') || 'per_person',
      is_active: form.get('is_active') === 'true',
      is_staff_only: form.get('is_staff_only') === 'true',
    }
    try {
      if (serviceModal?.id) await updateService(serviceModal.id, payload)
      else await createService(payload)
      setServiceModal(null)
      load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function runOrderAction(id, action) {
    try {
      if (action === 'confirm') await confirmServiceOrder(id)
      if (action === 'cancel') await cancelServiceOrder(id)
      load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const orderColumns = [
    { key: 'booking_code', label: 'Booking' },
    { key: 'status', label: 'Trạng thái', render: (r) => <StatusBadge map={SERVICE_ORDER_STATUS} value={r.status} /> },
    { key: 'total_amount', label: 'Tổng', render: (r) => formatMoney(r.total_amount) },
    { key: 'created_at', label: 'Tạo lúc', render: (r) => formatDateTime(r.created_at) },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex gap-2">
          {r.status === 'pending' && <Button variant="ghost" onClick={() => runOrderAction(r.id, 'confirm')}>Xác nhận</Button>}
          {r.status !== 'cancelled' && r.status !== 'completed' && (
            <Button variant="ghost" onClick={() => runOrderAction(r.id, 'cancel')}>Hủy</Button>
          )}
        </div>
      ),
    },
  ]

  const serviceColumns = [
    { key: 'name', label: 'Tên dịch vụ' },
    { key: 'category', label: 'Danh mục', render: (r) => r.category?.name },
    { key: 'price', label: 'Giá', render: (r) => formatMoney(r.price) },
    { key: 'is_staff_only', label: 'Nội bộ', render: (r) => (r.is_staff_only ? 'Có' : '—') },
    { key: 'is_active', label: 'Hoạt động', render: (r) => (r.is_active ? 'Có' : 'Không') },
    ...(isManager ? [{
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setServiceModal(r)}>Sửa</Button>
          <Button variant="ghost" onClick={() => deleteService(r.id).then(load)}>Xóa</Button>
        </div>
      ),
    }] : []),
  ]

  const tabs = [
    { key: 'orders', label: 'Đơn dịch vụ' },
    ...(isManager ? [{ key: 'catalog', label: 'Danh mục dịch vụ' }] : []),
  ]

  return (
    <>
      <Header title="Dịch vụ" subtitle="Đơn dịch vụ và catalog khách sạn" />
      <div className="flex-1 space-y-6 p-8">
        <Tabs tabs={tabs} active={tab} onChange={(key) => { setTab(key); setPage(1) }} />

        <div className="flex justify-end">
          {tab === 'orders' ? (
            <Button onClick={() => setOrderOpen(true)}>
              <Plus className="h-4 w-4" />
              Tạo đơn
            </Button>
          ) : isManager ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setCategoryModal(true)}>
                <Plus className="h-4 w-4" />
                Thêm danh mục
              </Button>
              <Button onClick={() => setServiceModal({})}>
                <Plus className="h-4 w-4" />
                Thêm dịch vụ
              </Button>
            </div>
          ) : null}
        </div>

        {error && <Alert>{error}</Alert>}

        {tab === 'orders' ? (
          <>
            <DataTable columns={orderColumns} rows={orders} loading={loading} />
            <Pagination page={page} totalPages={meta.total_pages} onPageChange={setPage} />
          </>
        ) : (
          <>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <span
                    key={c.id}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            )}
            <DataTable columns={serviceColumns} rows={services} loading={loading} />
          </>
        )}
      </div>

      <Modal open={orderOpen} onClose={() => setOrderOpen(false)} title="Tạo đơn dịch vụ">
        <form className="space-y-4" onSubmit={handleOrder}>
          <Select label="Booking" value={orderForm.booking_id} onChange={(e) => setOrderForm({ ...orderForm, booking_id: e.target.value })} required>
            <option value="">Chọn booking</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>{b.booking_code} — {b.customer_name}</option>
            ))}
          </Select>
          <Select label="Dịch vụ" value={orderForm.service_id} onChange={(e) => setOrderForm({ ...orderForm, service_id: e.target.value })} required>
            <option value="">Chọn dịch vụ</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name} — {formatMoney(s.price)}</option>
            ))}
          </Select>
          <Input label="Số lượng" type="number" min="1" value={orderForm.quantity} onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })} />
          <Textarea label="Ghi chú" value={orderForm.note} onChange={(e) => setOrderForm({ ...orderForm, note: e.target.value })} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setOrderOpen(false)}>Hủy</Button>
            <Button type="submit">Tạo</Button>
          </div>
        </form>
      </Modal>

      <Modal open={categoryModal} onClose={() => setCategoryModal(false)} title="Thêm danh mục dịch vụ">
        <form className="space-y-4" onSubmit={saveCategory}>
          <Input
            label="Tên danh mục"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="VD: Giặt là, Tour, Sự kiện…"
            required
          />
          <p className="text-xs text-slate-500">
            Sau khi tạo, chọn danh mục này khi thêm dịch vụ mới.
          </p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setCategoryModal(false)}>Hủy</Button>
            <Button type="submit">Lưu danh mục</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(serviceModal)} onClose={() => setServiceModal(null)} title={serviceModal?.id ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}>
        <form className="space-y-4" onSubmit={saveService}>
          <Select name="category_id" label="Danh mục" defaultValue={serviceModal?.category?.id} required>
            <option value="">Chọn danh mục</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input name="name" label="Tên" defaultValue={serviceModal?.name} required />
          <Textarea name="description" label="Mô tả" defaultValue={serviceModal?.description} />
          <Input name="price" label="Giá" defaultValue={serviceModal?.price} required />
          <Select name="unit" label="Đơn vị tính" defaultValue={serviceModal?.unit || 'per_person'}>
            <option value="per_person">Theo người</option>
            <option value="per_trip">Theo chuyến</option>
            <option value="per_booking">Theo booking</option>
            <option value="per_item">Theo mục</option>
            <option value="per_night">Theo đêm</option>
          </Select>
          <Select name="is_staff_only" label="Chỉ nhân viên (khách không thấy)" defaultValue={String(serviceModal?.is_staff_only ?? false)}>
            <option value="false">Không</option>
            <option value="true">Có (cọc, minibar, hư hỏng…)</option>
          </Select>
          <Select name="is_active" label="Hoạt động" defaultValue={String(serviceModal?.is_active ?? true)}>
            <option value="true">Có</option>
            <option value="false">Không</option>
          </Select>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setServiceModal(null)}>Hủy</Button>
            <Button type="submit">Lưu</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
