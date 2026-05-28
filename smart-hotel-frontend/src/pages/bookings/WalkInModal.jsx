import { useEffect, useState } from 'react'
import { createWalkIn } from '../../api/bookings'
import { fetchCustomers } from '../../api/customers'
import { fetchRooms } from '../../api/rooms'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Spinner } from '../../components/ui/Spinner'
import { Textarea } from '../../components/ui/Textarea'
import { getErrorMessage } from '../../hooks/useAsync'
import { addDaysISO, todayISO } from '../../utils/format'

export function WalkInModal({ open, onClose, onSuccess }) {
  const [customers, setCustomers] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    customer_id: '',
    check_in_date: todayISO(),
    check_out_date: addDaysISO(todayISO(), 1),
    adults: 1,
    children: 0,
    room_ids: [],
    special_request: '',
    status: 'confirmed',
  })

  useEffect(() => {
    if (!open) return
    setLoading(true)
    Promise.all([
      fetchCustomers({ page_size: 100 }),
      fetchRooms({ status: 'available', page_size: 100 }),
    ])
      .then(([customerRes, roomRes]) => {
        setCustomers(customerRes.items)
        setRooms(roomRes.items)
      })
      .finally(() => setLoading(false))
  }, [open])

  function toggleRoom(id) {
    setForm((prev) => ({
      ...prev,
      room_ids: prev.room_ids.includes(id)
        ? prev.room_ids.filter((x) => x !== id)
        : [...prev.room_ids, id],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.customer_id || !form.room_ids.length) {
      setError('Chọn khách hàng và ít nhất một phòng')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const booking = await createWalkIn(form)
      onSuccess(booking)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Tạo booking walk-in" wide>
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-8 w-8 text-brand-600" />
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Select
            label="Khách hàng"
            value={form.customer_id}
            onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
            required
          >
            <option value="">Chọn khách</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name} — {c.email}</option>
            ))}
          </Select>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Check-in"
              type="date"
              value={form.check_in_date}
              onChange={(e) => setForm({ ...form, check_in_date: e.target.value })}
              required
            />
            <Input
              label="Check-out"
              type="date"
              value={form.check_out_date}
              onChange={(e) => setForm({ ...form, check_out_date: e.target.value })}
              required
            />
            <Input
              label="Người lớn"
              type="number"
              min="1"
              value={form.adults}
              onChange={(e) => setForm({ ...form, adults: Number(e.target.value) })}
            />
            <Input
              label="Trẻ em"
              type="number"
              min="0"
              value={form.children}
              onChange={(e) => setForm({ ...form, children: Number(e.target.value) })}
            />
          </div>

          <Select
            label="Trạng thái ban đầu"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="confirmed">Đã xác nhận</option>
            <option value="pending">Chờ xác nhận</option>
          </Select>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Chọn phòng trống</p>
            <div className="grid max-h-48 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3 md:grid-cols-2">
              {rooms.map((room) => (
                <label key={room.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.room_ids.includes(room.id)}
                    onChange={() => toggleRoom(room.id)}
                  />
                  <span className="text-sm">{room.room_number} — {room.room_type?.name}</span>
                </label>
              ))}
            </div>
          </div>

          <Textarea
            label="Yêu cầu đặc biệt"
            value={form.special_request}
            onChange={(e) => setForm({ ...form, special_request: e.target.value })}
          />

          {error && <Alert>{error}</Alert>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>Hủy</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Spinner className="h-4 w-4" /> : null}
              Tạo booking
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
