import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../lib/utils'

const sizes = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative bg-white w-full shadow-2xl overflow-y-auto',
        'rounded-t-3xl sm:rounded-2xl',
        'max-h-[92vh] sm:max-h-[85vh]',
        sizes[size]
      )}>
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors touch-manipulation">
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
