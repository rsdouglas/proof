import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'error' | 'success'
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  const bg = type === 'error' ? '#ef4444' : '#10b981'

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 9999,
      background: bg,
      color: '#fff',
      borderRadius: 8,
      padding: '12px 20px',
      fontSize: 14,
      fontWeight: 500,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      maxWidth: 360,
      animation: 'slideIn 0.2s ease',
    }}>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 18,
          lineHeight: 1,
          padding: 0,
          opacity: 0.8,
        }}
      >×</button>
    </div>
  )
}
