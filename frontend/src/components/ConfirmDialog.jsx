import Modal from './Modal'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, danger = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="text-center py-2">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
          <AlertTriangle className={`w-7 h-7 ${danger ? 'text-red-600' : 'text-amber-600'}`} />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
        {message && <p className="text-sm text-slate-500 mb-5">{message}</p>}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="btn-secondary flex-1 py-2.5">
            Yo'q
          </button>
          <button onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 py-2.5 font-semibold rounded-xl transition-all text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'}`}>
            Ha
          </button>
        </div>
      </div>
    </Modal>
  )
}
