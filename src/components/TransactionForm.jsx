import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Plus } from 'lucide-react'

export default function TransactionForm({ onTransactionAdded }) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('expense')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [type])

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').eq('type', type)
    setCategories(data || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase
      .from('transactions')
      .insert([{ 
        amount: parseFloat(amount), 
        description, 
        type, 
        category_id: categoryId || null, 
        user_id: user.id,
        date: today
      }])

    if (!error) {
      setAmount(''); setDescription(''); setCategoryId('');
      onTransactionAdded()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Toggle Type */}
      <div className="flex p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Pengeluaran
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Pemasukan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="number"
          placeholder="Nominal (Rp)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none border transition"
          required
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none border transition appearance-none"
        >
          <option value="">Pilih Kategori</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <input
        type="text"
        placeholder="Keterangan transaksi..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-sm focus:border-blue-500 focus:ring-blue-500 outline-none border transition"
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-blue-200 disabled:opacity-50"
      >
        <Plus size={18} /> {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
      </button>
    </form>
  )
}