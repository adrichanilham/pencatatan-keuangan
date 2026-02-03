import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { 
  Trash2, LogOut, Wallet, ArrowUpCircle, 
  ArrowDownCircle, PieChart as PieIcon, LayoutDashboard, Settings, Calendar
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import Auth from './components/Auth'
import TransactionForm from './components/TransactionForm'
import CategoryManager from './components/CategoryManager'

function App() {
  const [session, setSession] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('dashboard')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchTransactions = async () => {
    if (!session?.user) return
    const { data, error } = await supabase
      .from('transactions')
      .select('*, categories (name)')
      .order('created_at', { ascending: false })

    if (error) console.error(error.message)
    else setTransactions(data)
  }

  useEffect(() => {
    if (session) fetchTransactions()
  }, [session])

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0)
  const balance = totalIncome - totalExpense

  const chartData = [
    { name: 'Pemasukan', value: totalIncome, color: '#10b981' },
    { name: 'Pengeluaran', value: totalExpense, color: '#ef4444' }
  ].filter(item => item.value > 0)

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Hapus transaksi ini?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      alert(error.message);
    } else {
      // Memanggil ulang fetch agar UI terupdate
      fetchTransactions(); 
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-medium">Memuat Sistem Keuangan...</div>
  if (!session) return <Auth />

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 text-xl font-bold text-blue-600">
            <Wallet size={28} />
            <span>KeuanganKu</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${currentView === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <LayoutDashboard size={18} /> <span className="hidden md:inline">Dashboard</span>
            </button>
            <button 
              onClick={() => setCurrentView('categories')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${currentView === 'categories' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Settings size={18} /> <span className="hidden md:inline">Kategori</span>
            </button>
            <button onClick={() => supabase.auth.signOut()} className="ml-2 text-slate-400 hover:text-red-500 transition">
              <LogOut size={22} />
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 pt-8">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Halo, Adri!</h2>
          <p className="text-slate-500">{session.user.email}</p>
        </header>

        {currentView === 'dashboard' ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* STATS & FORM (KIRI) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Saldo Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
                  <p className="text-sm font-medium text-blue-600">Saldo Total</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">Rp {balance.toLocaleString('id-ID')}</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-600"><ArrowUpCircle size={16}/> <span className="text-sm font-medium">Pemasukan</span></div>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">Rp {totalIncome.toLocaleString('id-ID')}</p>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 shadow-sm">
                  <div className="flex items-center gap-2 text-rose-600"><ArrowDownCircle size={16}/> <span className="text-sm font-medium">Pengeluaran</span></div>
                  <p className="text-2xl font-bold text-rose-900 mt-1">Rp {totalExpense.toLocaleString('id-ID')}</p>
                </div>
              </div>

              {/* Input Form */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                <h3 className="mb-4 font-semibold text-slate-700">Catat Transaksi Baru</h3>
                <TransactionForm onTransactionAdded={fetchTransactions} />
              </div>

              {/* Visualisasi */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-700"><PieIcon size={18}/> Analisis Alokasi Dana</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                        {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* RIWAYAT (KANAN) */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
              <h3 className="mb-4 font-semibold text-slate-700">Aktivitas Terakhir</h3>
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <p className="text-center py-10 text-slate-400">Belum ada transaksi</p>
                ) : (
                  transactions.map((item) => (
                    <div key={item.id} className="group flex items-center justify-between rounded-xl p-3 hover:bg-slate-50 transition">
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {item.type === 'income' ? '+' : '-'} Rp {item.amount.toLocaleString('id-ID')}
                        </span>
                        <span className="text-sm text-slate-700 font-medium">{item.description}</span>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider">
                          <Calendar size={10} /> {new Date(item.date).toLocaleDateString('id-ID', { day:'numeric', month:'short' })}
                          <span>•</span>
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{item.categories?.name || 'Umum'}</span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // Mencegah konflik klik
                          handleDelete(item.id);
                        }} 
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all duration-200 cursor-pointer"
                        title="Hapus Transaksi"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto rounded-2xl bg-white p-8 shadow-sm border border-slate-100">
            <CategoryManager />
          </div>
        )}
      </main>
    </div>
  )
}

export default App