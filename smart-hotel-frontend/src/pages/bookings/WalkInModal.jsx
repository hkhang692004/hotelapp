import { useEffect, useState } from 'react'
import { createWalkIn } from '../../api/bookings'
import { fetchRooms } from '../../api/rooms'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { Textarea } from '../../components/ui/Textarea'
import { getErrorMessage } from '../../hooks/useAsync'
import { addDaysISO, todayISO } from '../../utils/format'

const initialForm = () => ({
  guest: {
    full_name: '',
    national_id: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  },
  check_in_date: todayISO(),
  check_out_date: addDaysISO(todayISO(), 1),
  adults: 1,
  children: 0,
  room_ids: [],
  special_request: '',
})

export function WalkInModal({ open, onClose, onSuccess }) {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    if (!open) return
    setForm(initialForm())
    setLoading(true)
    fetchRooms({ status: 'available', page_size: 100 })
      .then((roomRes) => setRooms(roomRes.items))
      .finally(() => setLoading(false))
  }, [open])

  function updateGuest(field, value) {
    setForm((prev) => ({
      ...prev,
      guest: { ...prev.guest, [field]: value },
    }))
  }

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
    const { guest, room_ids } = form
    if (!guest.full_name.trim() || !guest.national_id.trim()) {
      setError('Nhập họ tên và CCCD/Passport')
      return
    }
    if (!room_ids.length) {
      setError('Chọn ít nhất một phòng')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const booking = await createWalkIn({
        guest: {
          full_name: guest.full_name.trim(),
          national_id: guest.national_id.trim(),
          phone: guest.phone.trim(),
          email: guest.email.trim(),
          address: guest.address.trim(),
          notes: guest.notes.trim(),
        },
        check_in_date: form.check_in_date,
        check_out_date: form.check_out_date,
        adults: form.adults,
        children: form.children,
        room_ids: form.room_ids,
        special_request: form.special_request,
      })
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
          <p className="text-sm text-slate-500">
            Nhập thông tin khách — hệ thống tự tạo hồ sơ khách, không cần đăng ký tài khoản.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Họ và tên"
              value={form.guest.full_name}
              onChange={(e) => updateGuest('full_name', e.target.value)}
              required
            />
            <Input
              label="CCCD / Passport"
              value={form.guest.national_id}
              onChange={(e) => updateGuest('national_id', e.target.value)}
              required
            />
            <Input
              label="Số điện thoại"
              value={form.guest.phone}
              onChange={(e) => updateGuest('phone', e.target.value)}
            />
            <Input
              label="Email (không bắt buộc)"
              type="email"
              value={form.guest.email}
              onChange={(e) => updateGuest('email', e.target.value)}
            />
          </div>

          <Textarea
            label="Địa chỉ / Ghi chú (không bắt buộc)"
            value={form.guest.address}
            onChange={(e) => updateGuest('address', e.target.value)}
          />

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
