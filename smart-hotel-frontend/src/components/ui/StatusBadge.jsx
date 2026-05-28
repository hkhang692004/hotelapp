import { Badge } from './Badge'
import { getStatusMeta } from '../../utils/status'

export function StatusBadge({ map, value }) {
  const meta = getStatusMeta(map, value)
  return <Badge tone={meta.tone}>{meta.label}</Badge>
}
