import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs) => twMerge(clsx(inputs))

export const gradeLabels = {
  5: "A'lo", 4: 'Yaxshi', 3: 'Qoniqarli', 2: 'Qoniqarsiz',
}

export const fileTypeIcons = { PDF: '📄', DOCX: '📝', XLSX: '📊' }

export const statusColors = {
  UPLOADED:   'bg-gray-100 text-gray-700 border-gray-200',
  PROCESSING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  TESTED:     'bg-blue-100 text-blue-700 border-blue-200',
  GRADED:     'bg-green-100 text-green-700 border-green-200',
  FAILED:     'bg-red-100 text-red-700 border-red-200',
}

export const statusLabels = {
  UPLOADED:   'Yuklandi',
  PROCESSING: 'Qayta ishlanmoqda',
  TESTED:     'Test kutilmoqda',
  GRADED:     'Baholandi',
  FAILED:     'Xatolik',
}

export const formatDate = (date) => {
  if (!date) return '—'
  return new Intl.DateTimeFormat('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))
}
