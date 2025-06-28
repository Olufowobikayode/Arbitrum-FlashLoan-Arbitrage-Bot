import type React from "react"
import type { ReactNode } from "react"

interface StatusCardProps {
  title: string
  value: string
  icon: ReactNode
  color: "green" | "blue" | "purple" | "orange" | "red" | "gray"
  subtitle?: string
}

const StatusCard: React.FC<StatusCardProps> = ({ title, value, icon, color, subtitle }) => {
  return (
    <div className="status-card fade-in">
      <div className="status-card-header">
        <span className="status-card-title">{title}</span>
        <div className={`status-card-icon ${color}`}>{icon}</div>
      </div>
      <div className="status-card-value">{value}</div>
      {subtitle && <div className="status-card-subtitle">{subtitle}</div>}
    </div>
  )
}

export default StatusCard
