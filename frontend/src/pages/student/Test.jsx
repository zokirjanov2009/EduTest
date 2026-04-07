import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import GradeBadge from '../../components/GradeBadge'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { Brain, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react'
import { cn } from '../../lib/utils'
import { PageLoader } from '../../components/Spinner'

export default function StudentTest() {
  const { testId }    = useParams()
  const navigate      = useNavigate()
  const [test, setTest]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [answers, setAnswers]   = useState({})
  const [currentQ, setCurrentQ] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult]     = useState(null)

  useEffect(() => {
    api.get(`/student/tests/${testId}`)
      .then(({ data }) => setTest(data.data))
      .catch((err) => {
        toast.error(err?.response?.data?.message || 'Test topilmadi')
        navigate('/student/submissions')
      })
      .finally(() => setLoading(false))
  }, [testId])

  const selectAnswer = (qi, ans) => {
    setAnswers(prev => ({ ...prev, [qi]: ans }))
    // Auto-advance on mobile after short delay
    if (qi < (test?.questions?.length || 0) - 1) {
      setTimeout(() => setCurrentQ(qi + 1), 300)
    }
  }

  const handleSubmit = async () => {
    const unanswered = test.questions.findIndex((_, i) => !answers[i])
    if (unanswered !== -1) {
      setCurrentQ(unanswered)
      toast.error(`${unanswered + 1}-savolga javob bering!`)
      return
    }
    setSubmitting(true)
    try {
      const formatted = test.questions.map((_, i) => ({ questionIndex: i, selectedAnswer: answers[i] }))
      const { data }  = await api.post(`/student/tests/${testId}/submit`, { answers: formatted })
      setResult(data.data)
      toast.success('Test topshirildi!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi')
    } finally { setSubmitting(false) }
  }

  if (loading) return <DashboardLayout title="Test topshirish"><PageLoader /></DashboardLayout>

  // Result screen
  if (result) {
    const passed = result.gradeNumber >= 3
    return (
      <DashboardLayout title="Test Natijasi">
        <div className="max-w-xl mx-auto space-y-4 pb-6">
          {/* Score */}
          <div className={cn('card p-6 text-center', passed ? 'border-emerald-200' : 'border-red-200')}>
            <div className={cn('w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4', passed ? 'bg-emerald-50' : 'bg-red-50')}>
              <span className="text-4xl font-black text-slate-800">{result.gradeNumber}</span>
            </div>
            <GradeBadge grade={result.gradeNumber} large />
            <p className="text-4xl font-bold text-slate-800 mt-3">{result.score}/{result.totalQuestions}</p>
            <p className="text-slate-500 text-sm mt-1">to'g'ri javob • {result.percentage.toFixed(0)}%</p>
            <div className="w-full bg-slate-100 rounded-full h-2.5 mt-4">
              <div className={cn('h-2.5 rounded-full transition-all duration-700', passed ? 'bg-emerald-500' : 'bg-red-400')}
                style={{ width: `${result.percentage}%` }} />
            </div>
            {result.feedback && (
              <div className="mt-4 bg-slate-50 rounded-2xl p-4 text-left">
                <div className="flex items-center gap-2 mb-1.5">
                  <Brain className="w-4 h-4 text-primary-600" />
                  <span className="text-xs font-semibold text-slate-600">AI Sharhi</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{result.feedback}</p>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">Batafsil Natijalar</h3>
            </div>
            {result.detailedResults.map((r, i) => (
              <div key={i} className={cn('p-4 border-b border-slate-50 last:border-0', r.isCorrect ? 'bg-emerald-50/40' : 'bg-red-50/40')}>
                <div className="flex items-start gap-2.5">
                  {r.isCorrect
                    ? <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    : <XCircle    className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm mb-2">{i + 1}. {r.question}</p>
                    <div className="grid grid-cols-2 gap-1.5 text-xs mb-2">
                      <div className={cn('px-2.5 py-1.5 rounded-lg', r.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
                        Sizning: <strong>{r.studentAnswer || '—'}</strong>
                      </div>
                      <div className="bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-lg">
                        To'g'ri: <strong>{r.correctAnswer}</strong>
                      </div>
                    </div>
                    {r.explanation && (
                      <p className="text-xs text-slate-500 bg-white rounded-lg px-2.5 py-1.5">{r.explanation}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/student/history')} className="btn-secondary w-full py-3">
            Tarixga qaytish <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </DashboardLayout>
    )
  }

  if (!test) return null
  const q        = test.questions[currentQ]
  const answered = Object.keys(answers).length
  const total    = test.questions.length

  return (
    <DashboardLayout title="Test Topshirish">
      <div className="max-w-xl mx-auto space-y-4 pb-6">
        {/* Progress */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary-600" />
              <span className="font-semibold text-slate-700 text-sm truncate max-w-[180px] sm:max-w-xs">{test.submissionTitle}</span>
            </div>
            <span className="text-sm text-slate-500 flex-shrink-0">{answered}/{total}</span>
          </div>
          {/* Dot progress */}
          <div className="flex gap-1.5">
            {test.questions.map((_, i) => (
              <button key={i} onClick={() => setCurrentQ(i)}
                className={cn('flex-1 h-2 rounded-full transition-all touch-manipulation', {
                  'bg-primary-600':  i === currentQ,
                  'bg-emerald-400':  answers[i] && i !== currentQ,
                  'bg-slate-200':    !answers[i] && i !== currentQ,
                })} />
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              {currentQ + 1}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ {total} savol</span>
          </div>
          <p className="text-sm sm:text-base font-semibold text-slate-800 mb-5 leading-relaxed">{q.question}</p>
          <div className="space-y-2.5">
            {['A','B','C','D'].map((opt) => (
              <button key={opt} onClick={() => selectAnswer(currentQ, opt)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all touch-manipulation active:scale-[0.98]',
                  answers[currentQ] === opt
                    ? 'border-primary-600 bg-primary-50 text-primary-800'
                    : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                )}>
                <span className={cn('w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                  answers[currentQ] === opt ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600')}>
                  {opt}
                </span>
                <span className="text-sm font-medium leading-snug">{q.options[opt]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Nav buttons */}
        <div className="flex gap-2.5">
          {currentQ > 0 && (
            <button onClick={() => setCurrentQ(currentQ - 1)} className="btn-secondary flex-1 py-3">← Oldingi</button>
          )}
          {currentQ < total - 1 ? (
            <button onClick={() => setCurrentQ(currentQ + 1)} className="btn-primary flex-1 py-3">Keyingi →</button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting || answered < total}
              className="btn-primary flex-1 py-3">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {submitting ? 'Topshirilmoqda...' : 'Topshirish'}
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
