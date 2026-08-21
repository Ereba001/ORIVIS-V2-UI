import { ChevronRight, Home } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface Crumb { label: string; href?: string }

interface Props {
  items: Crumb[]
}

export default function Breadcrumbs({ items }: Props) {
  const navigate = useNavigate()
  return (
    <nav className="flex items-center gap-1.5 text-[11px] text-brand-text-muted mb-4">
      <button onClick={() => navigate("/platform")} className="hover:text-brand-text-primary transition-colors cursor-pointer flex items-center gap-1">
        <Home size={12} />
        <span>Platform</span>
      </button>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight size={10} />
          {item.href ? (
            <button onClick={() => navigate(item.href!)} className="hover:text-brand-text-primary transition-colors cursor-pointer">{item.label}</button>
          ) : (
            <span className="text-brand-text-primary font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
