import Modal from './Modal'
import { Loader2 } from 'lucide-react'

export default function StatsModal({ isOpen, onClose, title, loading, children }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : children}
    </Modal>
  )
}
