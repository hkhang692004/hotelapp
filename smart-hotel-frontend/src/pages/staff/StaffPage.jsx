import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { createStaff, deleteStaff, fetchStaff, updateStaff } from '../../api/staff'
import { Header } from '../../components/layout/Header'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Select'
import { getErrorMessage } from '../../hooks/useAsync'
import { STAFF_ROLE } from '../../utils/status'

export function StaffPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({})
  const [role, setRole] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await fetchStaff({ page, page_size: 20, role, search })
      setRows(result.items)
      setMeta(result.meta)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, role, search])

  useEffect(() => {
    load()
  }, [load])

  async function handleSubmit(e) {
    e.preventDefault()
    const form = new FormData(e.target)
    const payload = Object.fromEntries(form.entries())
    try {
      if (modal?.id) {
        await updateStaff(modal.id, {
          full_name: payload.full_name,
          phone: payload.phone,
          department: payload.department,
          hire_date: payload.hire_date || undefined,
        })
      } else {
        await createStaff(payload)
      }
      setModal(null)
      load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const columns = [
    { key: 'full_name', label: 'Họ tên' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Vai trò', render: (r) => STAFF_ROLE[r.role] || r.role },
    { key: 'employee_code', label: 'Mã NV' },
    { key: 'department', label: 'Phòng ban' },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (r) => <Badge tone={r.is_active ? 'success' : 'danger'}>{r.is_active ? 'Hoạt động' : 'Ngưng'}</Badge>,
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setModal(r)}>Sửa</Button>
          {r.is_active && (
            <Button variant="ghost" onClick={() => deleteStaff(r.id).then(load)}>Vô hiệu</Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <Header title="Nhân viên" subtitle="Quản lý tài khoản nhân viên" />
      <div className="flex-1 space-y-6 p-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Tìm kiếm" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Tên, email..." />
          <Select label="Vai trò" value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }}>
            <option value="">Tất cả</option>
            {Object.entries(STAFF_ROLE).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <div className="flex items-end">
            <Button onClick={() => setModal({})}>
              <Plus className="h-4 w-4" />
              Thêm nhân viên
            </Button>
          </div>
        </div>

        {error && <Alert>{error}</Alert>}
        <DataTable columns={columns} rows={rows} loading={loading} />
        <Pagination page={page} totalPages={meta.total_pages} onPageChange={setPage} />
      </div>

      <Modal open={Boolean(modal)} onClose={() => setModal(null)} title={modal?.id ? 'Sửa nhân viên' : 'Thêm nhân viên'} wide>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {!modal?.id && (
            <>
              <Input name="email" label="Email" type="email" required />
              <Input name="password" label="Mật khẩu" type="password" required />
              <Select name="role" label="Vai trò" defaultValue="receptionist" required>
                {Object.entries(STAFF_ROLE).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
              <Input name="employee_code" label="Mã nhân viên" required />
            </>
          )}
          <Input name="full_name" label="Họ tên" defaultValue={modal?.full_name} required />
          <Input name="phone" label="Điện thoại" defaultValue={modal?.phone} />
          <Input name="department" label="Phòng ban" defaultValue={modal?.department} />
          <Input name="hire_date" label="Ngày vào làm" type="date" defaultValue={modal?.hire_date} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>Hủy</Button>
            <Button type="submit">Lưu</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
