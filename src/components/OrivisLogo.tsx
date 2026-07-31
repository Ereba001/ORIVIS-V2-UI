import logoUrl from "../assets/images/orivis-logo.svg"

interface Props {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

const sizeMap = {
  sm: 64,
  md: 90,
  lg: 120,
  xl: 130,
}

const heightMap = {
  sm: 28,
  md: 36,
  lg: 44,
  xl: 130,
}

export default function OrivisLogo({ className = "", size = "md" }: Props) {
  return (
    <span
      className={`orivis-logo inline-flex items-center ${className}`}
      style={{ height: heightMap[size] }}
    >
      <img
        src={logoUrl}
        alt="ORIVIS"
        className="w-auto"
        style={{ height: sizeMap[size] }}
      />
    </span>
  )
}
