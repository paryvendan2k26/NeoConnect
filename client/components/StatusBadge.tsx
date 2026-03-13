import { Badge } from "@/components/ui/index"

const STATUS_MAP: Record<string, { variant: any; label: string }> = {
  'New':         { variant: 'info',    label: 'New' },
  'Assigned':    { variant: 'purple',  label: 'Assigned' },
  'In Progress': { variant: 'warning', label: 'In Progress' },
  'Pending':     { variant: 'default', label: 'Pending' },
  'Resolved':    { variant: 'success', label: 'Resolved' },
  'Escalated':   { variant: 'danger',  label: 'Escalated' },
}

const SEVERITY_MAP: Record<string, { variant: any }> = {
  'Low':    { variant: 'default' },
  'Medium': { variant: 'warning' },
  'High':   { variant: 'danger' },
}

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] || { variant: 'default', label: status }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

export function SeverityBadge({ severity }: { severity: string }) {
  const cfg = SEVERITY_MAP[severity] || { variant: 'default' }
  return <Badge variant={cfg.variant}>{severity}</Badge>
}
