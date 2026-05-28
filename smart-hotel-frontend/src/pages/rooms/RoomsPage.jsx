import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  createRoom,
  createRoomType,
  deleteRoom,
  deleteRoomType,
  fetchAmenities,
  fetchRoomTypes,
  fetchRooms,
  updateRoom,
  updateRoomStatus,
  updateRoomType,
} from '../../api/rooms'
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
import { formatMoney } from '../../utils/format'
import { ROOM_STATUS } from '../../utils/status'
import { hasRole } from '../../utils/roles'

export function RoomsPage() {
  const { user } = useAuth()
  const isManager = hasRole(user, ['manager'])
  const [tab, setTab] = useState('rooms')
  const [rooms, setRooms] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [amenities, setAmenities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({})
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (tab === 'rooms') {
        const result = await fetchRooms({ page, page_size: 20, status: statusFilter })
        setRooms(result.items)
        setMeta(result.meta)
      } else {
        const result = await fetchRoomTypes({ page, page_size: 20 })
        setRoomTypes(result.items)
        setMeta(result.meta)
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [tab, page, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (isManager) {
      fetchAmenities().then(setAmenities).catch(() => {})
      fetchRoomTypes({ page_size: 100 }).then((r) => setRoomTypes(r.items)).catch(() => {})
    }
  }, [isManager])

  async function saveRoom(e) {
    e.preventDefault()
    const form = new FormData(e.target)
    const payload = Object.fromEntries(form.entries())
    payload.floor = Number(payload.floor || 0)
    payload.is_active = payload.is_active === 'true'
    try {
      if (modal?.id) await updateRoom(modal.id, payload)
      else await createRoom(payload)
      setModal(null)
      load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function saveRoomType(e) {
    e.preventDefault()
    const form = new FormData(e.target)
    const payload = {
      name: form.get('name'),
      description: form.get('description'),
      max_occupancy: Number(form.get('max_occupancy') || 2),
      base_price: form.get('base_price'),
      is_active: form.get('is_active') === 'true',
      amenity_ids: form.getAll('amenity_ids'),
    }
    try {
      if (modal?.id) await updateRoomType(modal.id, payload)
      else await createRoomType(payload)
      setModal(null)
      load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function changeStatus(room, status) {
    try {
      await updateRoomStatus(room.id, status)
      load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const roomColumns = [
    { key: 'room_number', label: 'Số phòng' },
    { key: 'floor', label: 'Tầng' },
    { key: 'room_type', label: 'Loại', render: (r) => r.room_type?.name },
    { key: 'status', label: 'Trạng thái', render: (r) => <StatusBadge map={ROOM_STATUS} value={r.status} /> },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (r) => (
        <Select value={r.status} onChange={(e) => changeStatus(r, e.target.value)} onClick={(e) => e.stopPropagation()}>
          {Object.keys(ROOM_STATUS).map((s) => (
            <option key={s} value={s}>{ROOM_STATUS[s].label}</option>
          ))}
        </Select>
      ),
    },
  ]

  const typeColumns = [
    { key: 'name', label: 'Tên loại' },
    { key: 'max_occupancy', label: 'Sức chứa' },
    { key: 'base_price', label: 'Giá cơ bản', render: (r) => formatMoney(r.base_price) },
    { key: 'is_active', label: 'Hoạt động', render: (r) => (r.is_active ? 'Có' : 'Không') },
    ...(isManager ? [{
      key: 'edit',
      label: '',
      render: (r) => (
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setModal({ type: 'roomType', ...r })}>Sửa</Button>
          <Button variant="ghost" onClick={() => deleteRoomType(r.id).then(load)}>Xóa</Button>
        </div>
      ),
    }] : []),
  ]

  return (
    <>
      <Header title="Phòng" subtitle="Quản lý phòng và loại phòng" />
      <div className="flex-1 space-y-6 p-8">
        <Tabs
          tabs={[
            { key: 'rooms', label: 'Danh sách phòng' },
            ...(isManager ? [{ key: 'types', label: 'Loại phòng' }] : []),
          ]}
          active={tab}
          onChange={(key) => { setTab(key); setPage(1) }}
        />

        <div className="flex flex-wrap items-end justify-between gap-4">
          {tab === 'rooms' && (
            <Select label="Lọc trạng thái" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
              <option value="">Tất cả</option>
              {Object.keys(ROOM_STATUS).map((s) => (
                <option key={s} value={s}>{ROOM_STATUS[s].label}</option>
              ))}
            </Select>
          )}
          {isManager && (
            <Button onClick={() => setModal({ type: tab === 'rooms' ? 'room' : 'roomType' })}>
              <Plus className="h-4 w-4" />
              {tab === 'rooms' ? 'Thêm phòng' : 'Thêm loại phòng'}
            </Button>
          )}
        </div>

        {error && <Alert>{error}</Alert>}

        {tab === 'rooms' ? (
          <DataTable columns={roomColumns} rows={rooms} loading={loading} />
        ) : (
          <DataTable columns={typeColumns} rows={roomTypes} loading={loading} />
        )}
        <Pagination page={page} totalPages={meta.total_pages} onPageChange={setPage} />
      </div>

      <Modal open={modal?.type === 'room'} onClose={() => setModal(null)} title={modal?.id ? 'Sửa phòng' : 'Thêm phòng'}>
        <form className="space-y-4" onSubmit={saveRoom}>
          <Input name="room_number" label="Số phòng" defaultValue={modal?.room_number} required />
          <Input name="floor" label="Tầng" type="number" defaultValue={modal?.floor ?? 1} />
          <Select name="room_type_id" label="Loại phòng" defaultValue={modal?.room_type?.id} required>
            <option value="">Chọn loại</option>
            {roomTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
          <Select name="status" label="Trạng thái" defaultValue={modal?.status || 'available'}>
            {Object.keys(ROOM_STATUS).map((s) => <option key={s} value={s}>{ROOM_STATUS[s].label}</option>)}
          </Select>
          <Textarea name="notes" label="Ghi chú" defaultValue={modal?.notes} />
          <Select name="is_active" label="Hoạt động" defaultValue={String(modal?.is_active ?? true)}>
            <option value="true">Có</option>
            <option value="false">Không</option>
          </Select>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>Hủy</Button>
            <Button type="submit">Lưu</Button>
          </div>
        </form>
      </Modal>

      <Modal open={modal?.type === 'roomType'} onClose={() => setModal(null)} title={modal?.id ? 'Sửa loại phòng' : 'Thêm loại phòng'} wide>
        <form className="space-y-4" onSubmit={saveRoomType}>
          <Input name="name" label="Tên" defaultValue={modal?.name} required />
          <Textarea name="description" label="Mô tả" defaultValue={modal?.description} />
          <Input name="max_occupancy" label="Sức chứa" type="number" defaultValue={modal?.max_occupancy ?? 2} />
          <Input name="base_price" label="Giá cơ bản" defaultValue={modal?.base_price} required />
          <Select name="is_active" label="Hoạt động" defaultValue={String(modal?.is_active ?? true)}>
            <option value="true">Có</option>
            <option value="false">Không</option>
          </Select>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Tiện nghi</p>
            <div className="grid gap-2 md:grid-cols-2">
              {amenities.map((a) => (
                <label key={a.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="amenity_ids" value={a.id} defaultChecked={modal?.amenities?.some?.((x) => x.id === a.id)} />
                  {a.name}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>Hủy</Button>
            <Button type="submit">Lưu</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
