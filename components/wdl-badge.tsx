interface Props {
  result: 'W' | 'D' | 'L'
}

const map = {
  W: { label: 'G', color: '#02B906', bg: 'rgba(2,185,6,0.12)' },
  D: { label: 'E', color: '#6b6d75', bg: 'rgba(107,109,117,0.12)' },
  L: { label: 'P', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
}

export default function WdlBadge({ result }: Props) {
  const { label, color, bg } = map[result]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 22,
      height: 22,
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      color,
      background: bg,
    }}>
      {label}
    </span>
  )
}
