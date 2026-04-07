import Sidebar from './Sidebar'

export default function DashboardLayout({ children, title }) {
  return (
    <div className="min-h-screen min-h-dvh bg-slate-50">
      <Sidebar />
      <div className="lg:ml-64 pt-14 lg:pt-0 min-h-screen flex flex-col">
        {title && (
          <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 sticky top-14 lg:top-0 z-30">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">{title}</h1>
          </header>
        )}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">{children}</div>
      </div>
    </div>
  )
}
