import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { fetchRooms } from '../../api/rooms'
import {
  assignHousekeepingTask,
  createHousekeepingTask,
  fetchHousekeepingTasks,
  fetchStaff,
  updateHousekeepingTask,
} from '../../api/staff'
import { Header } from '../../components/layout/Header'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Textarea } from '../../components/ui/Textarea'
import { getErrorMessage } from '../../hooks/useAsync'
import { formatDateTime } from '../../utils/format'
import { HK_PRIORITY, HK_STATUS } from '../../utils/status'

export function HousekeepingPage() {
  const [rows, setRows] = useState([])
  const [rooms, setRooms] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [assignTarget, setAssignTarget] = useState(null)
  const [form, setForm] = useState({ room_id: '', priority: 'normal', task_type: 'checkout_clean', notes: '' })
  const [assignId, setAssignId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await fetchHousekeepingTasks({ status, assigned_to: assignedTo || undefined })
      setRows(result.items)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [status, assignedTo])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (createOpen) {
      fetchRooms({ page_size: 100 }).then((r) => setRooms(r.items)).catch(() => {})
    }
  }, [createOpen])

  useEffect(() => {
    fetchStaff({ role: 'housekeeping', page_size: 100 }).then((r) => setStaff(r.items)).catch(() => {})
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    try {
      await createHousekeepingTask(form)
      setCreateOpen(false)
      setForm({ room_id: '', priority: 'normal', task_type: 'checkout_clean', notes: '' })
      load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleAssign(e) {
    e.preventDefault()
    setError('')
    try {
      await assignHousekeepingTask(assignTarget.id, assignId)
      setAssignTarget(null)
      setAssignId('')
      load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function changeStatus(task, newStatus) {
    try {
      await updateHousekeepingTask(task.id, { status: newStatus })
      load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const columns = [
    { key: 'room', label: 'Phòng', render: (r) => r.room?.room_number },
    { key: 'task_type', label: 'Loại' },
    { key: 'priority', label: 'Ưu tiên', render: (r) => <StatusBadge map={HK_PRIORITY} value={r.priority} /> },
    { key: 'status', label: 'Trạng thái', render: (r) => <StatusBadge map={HK_STATUS} value={r.status} /> },
    { key: 'assigned_to', label: 'Nhân viên', render: (r) => r.assigned_to?.full_name || 'Chưa gán' },
    { key: 'created_at', label: 'Tạo lúc', render: (r) => formatDateTime(r.created_at) },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex flex-wrap gap-2">
          {!r.assigned_to && (
            <Button variant="ghost" onClick={() => setAssignTarget(r)}>Gán</Button>
          )}
          {r.status === 'pending' && (
            <Button variant="ghost" onClick={() => changeStatus(r, 'in_progress')}>Bắt đầu</Button>
          )}
          {r.status === 'in_progress' && (
            <Button variant="ghost" onClick={() => changeStatus(r, 'completed')}>Hoàn thành</Button>
          )}
          {r.status !== 'cancelled' && r.status !== 'completed' && (
            <Button variant="ghost" onClick={() => changeStatus(r, 'cancelled')}>Hủy</Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <Header title="Dọn phòng" subtitle="Phân công và theo dõi công việc" />
      <div className="flex-1 space-y-6 p-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Select label="Trạng thái" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tất cả</option>
            {Object.keys(HK_STATUS).map((s) => (
              <option key={s} value={s}>{HK_STATUS[s].label}</option>
            ))}
          </Select>
          <Select label="Phân công" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="me">Của tôi</option>
            <option value="unassigned">Chưa gán</option>
          </Select>
          <div className="flex items-end">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Tạo task
            </Button>
          </div>
        </div>

        {error && <Alert>{error}</Alert>}
        <DataTable columns={columns} rows={rows} loading={loading} />
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Tạo task dọn phòng">
        <form className="space-y-4" onSubmit={handleCreate}>
          <Select label="Phòng" value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })} required>
            <option value="">Chọn phòng</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.room_number} — Tầng {r.floor}</option>
            ))}
          </Select>
          <Select label="Loại công việc" value={form.task_type} onChange={(e) => setForm({ ...form, task_type: e.target.value })}>
            <option value="checkout_clean">Dọn sau checkout</option>
            <option value="daily_clean">Dọn hàng ngày</option>
            <option value="maintenance">Bảo trì</option>
          </Select>
          <Select label="Ưu tiên" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {Object.keys(HK_PRIORITY).map((p) => (
              <option key={p} value={p}>{HK_PRIORITY[p].label}</option>
            ))}
          </Select>
          <Textarea label="Ghi chú" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button type="submit">Tạo</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(assignTarget)} onClose={() => setAssignTarget(null)} title="Gán nhân viên">
        <form className="space-y-4" onSubmit={handleAssign}>
          <Select label="Nhân viên dọn phòng" value={assignId} onChange={(e) => setAssignId(e.target.value)} required>
            <option value="">Chọn nhân viên</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </Select>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setAssignTarget(null)}>Hủy</Button>
            <Button type="submit">Gán</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
