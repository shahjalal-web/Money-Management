'use client';

import { useEffect, useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import type { IncomeSource, ExpenseCategory } from '@/types';
import toast from 'react-hot-toast';
import { RiAddLine, RiEditLine, RiDeleteBinLine, RiArrowUpLine, RiArrowDownLine } from 'react-icons/ri';

type Tab = 'income' | 'expense';

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('income');
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<IncomeSource | ExpenseCategory | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    try {
      const [sources, categories] = await Promise.all([apiGet<IncomeSource[]>('/income-sources'), apiGet<ExpenseCategory[]>('/expense-categories')]);
      setIncomeSources(sources); setExpenseCategories(categories);
    } catch { /* handled */ } finally { setLoading(false); }
  }
  useEffect(() => { fetchData(); }, []);

  function openCreate() { setEditItem(null); setName(''); setModalOpen(true); }
  function openEdit(item: IncomeSource | ExpenseCategory) { setEditItem(item); setName(item.name); setModalOpen(true); }

  const apiPath = activeTab === 'income' ? '/income-sources' : '/expense-categories';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editItem) { await apiPut(`${apiPath}/${editItem._id}`, { name }); toast.success('Updated'); }
      else { await apiPost(apiPath, { name }); toast.success('Created'); }
      setModalOpen(false); fetchData();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed'); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this item?')) return;
    try { await apiDelete(`${apiPath}/${id}`); toast.success('Deleted'); fetchData(); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  }

  const items = activeTab === 'income' ? incomeSources : expenseCategories;

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-64" /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Categories</h1>
        <Button onClick={openCreate} size="sm"><RiAddLine className="w-4 h-4" /> Add {activeTab === 'income' ? 'Source' : 'Category'}</Button>
      </div>

      <div className="flex gap-2 p-1 bg-surface rounded-xl w-fit border border-border">
        <button onClick={() => setActiveTab('income')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'text-muted hover:text-foreground'}`}>
          <RiArrowUpLine className="w-4 h-4" /> Income Sources
        </button>
        <button onClick={() => setActiveTab('expense')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'expense' ? 'bg-red-500/10 text-red-500' : 'text-muted hover:text-foreground'}`}>
          <RiArrowDownLine className="w-4 h-4" /> Expense Categories
        </button>
      </div>

      {items.length === 0 ? (
        <Card><div className="text-center py-12"><p className="text-muted mb-4">No {activeTab === 'income' ? 'income sources' : 'expense categories'} yet</p><Button onClick={openCreate} size="sm">Create First {activeTab === 'income' ? 'Source' : 'Category'}</Button></div></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <motion.div key={item._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card hover>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === 'income' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      {activeTab === 'income' ? <RiArrowUpLine className="w-5 h-5 text-emerald-400" /> : <RiArrowDownLine className="w-5 h-5 text-red-400" />}
                    </div>
                    <p className="font-medium text-foreground">{item.name}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"><RiEditLine className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors"><RiDeleteBinLine className="w-4 h-4" /></button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit' : `New ${activeTab === 'income' ? 'Income Source' : 'Expense Category'}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" placeholder={activeTab === 'income' ? 'e.g., Fiverr, Upwork' : 'e.g., Food, Rent, Software'} value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">{editItem ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
