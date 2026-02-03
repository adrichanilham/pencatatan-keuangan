import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Plus, Trash2, Tag } from 'lucide-react'

export default function CategoryManager() {
  const [categories, setCategories] = useState([])
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('expense')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })
    if (data) setCategories(data)
  }

  async function addCategory(e) {
    e.preventDefault()
    if (!newName) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('categories')
      .insert([{ name: newName, type: newType, user_id: user.id }])

    if (error) alert(error.message)
    else {
      setNewName('')
      fetchCategories()
    }
    setLoading(false)
  }

  async function deleteCategory(id) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) alert("Kategori ini mungkin sedang digunakan di transaksi lain.")
    else fetchCategories()
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '12px', marginTop: '20px' }}>
      <h4><Tag size={18} /> Kelola Kategori</h4>
      
      <form onSubmit={addCategory} className="flex gap-3 mb-6">
        <input 
          type="text" 
          placeholder="Nama Kategori Baru" 
          value={newName} 
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 rounded-xl border-slate-200 bg-slate-50 p-2 text-sm outline-none border focus:border-blue-500"
        />
        <select value={newType} onChange={(e) => setNewType(e.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500">
          <option value="expense">Pengeluaran</option>
          <option value="income">Pemasukan</option>
        </select>
        <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition disabled:opacity-50">
          <Plus size={16} />
        </button>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <small>📦 Kategori Pengeluaran</small>
          {categories.filter(c => c.type === 'expense').map(cat => (
            <div key={cat.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 transition group">
              <span className="text-sm">{cat.name}</span>
              <Trash2 size={14} onClick={() => deleteCategory(cat.id)} className="opacity-0 group-hover:opacity-100 cursor-pointer text-slate-400 hover:text-red-500 transition" />
            </div>
          ))}
        </div>
        <div>
          <small>💰 Kategori Pemasukan</small>
          {categories.filter(c => c.type === 'income').map(cat => (
            <div key={cat.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 transition group">
              <span className="text-sm">{cat.name}</span>
              <Trash2 size={14} onClick={() => deleteCategory(cat.id)} className="opacity-0 group-hover:opacity-100 cursor-pointer text-slate-400 hover:text-red-500 transition" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}