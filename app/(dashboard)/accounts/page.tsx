'use client';

import { useEffect, useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils';
import { CURRENCIES, ACCOUNT_COLORS } from '@/lib/constants';
import type { Account } from '@/types';
import toast from 'react-hot-toast';
import { RiWalletLine, RiAddLine, RiEditLine, RiDeleteBinLine } from 'react-icons/ri';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [form, setForm] = useState({ name: '', currency: 'BDT', color: '#6366f1' });
  const [saving, setSaving] = useState(false);

  async function fetchAccounts() {
    try { setAccounts(await apiGet<Account[]>('/accounts')); } catch { /* handled */ } finally { setLoading(false); }
  }
  useEffect(() => { fetchAccounts(); }, []);

  function openCreate() { setEditAccount(null); setForm({ name: '', currency: 'BDT', color: '#6366f1' }); setModalOpen(true); }
  function openEdit(account: Account) { setEditAccount(account); setForm({ name: account.name, currency: account.currency, color: account.color || '#6366f1' }); setModalOpen(true); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editAccount) { await apiPut(`/accounts/${editAccount._id}`, form); toast.success('Account updated'); }
      else { await apiPost('/accounts', form); toast.success('Account created'); }
      setModalOpen(false); fetchAccounts();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to save'); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this account?')) return;
    try { await apiDelete(`/accounts/${id}`); toast.success('Account deleted'); fetchAccounts(); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to delete'); }
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Accounts</h1>
        <Button onClick={openCreate} size="sm"><RiAddLine className="w-4 h-4" /> Add Account</Button>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <RiWalletLine className="w-16 h-16 text-muted/20 mx-auto mb-4" />
            <p className="text-muted mb-2">No accounts yet</p>
            <p className="text-sm text-muted/60 mb-4">Create accounts like Payoneer, bKash, Bank, Cash</p>
            <Button onClick={openCreate} size="sm">Create First Account</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account, i) => (
            <motion.div key={account._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card hover>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: (account.color || '#6366f1') + '15' }}>
                      <RiWalletLine className="w-6 h-6" style={{ color: account.color || '#6366f1' }} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{account.name}</p>
                      <p className="text-xs text-muted">{account.currency}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(account)} className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"><RiEditLine className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(account._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors"><RiDeleteBinLine className="w-4 h-4" /></button>
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(account.balance, account.currency)}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editAccount ? 'Edit Account' : 'New Account'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Account Name" placeholder="e.g., Payoneer, bKash, Cash" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} - ${c.name}` }))} />
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Color</label>
            <div className="flex gap-2 flex-wrap">
              {ACCOUNT_COLORS.map((color) => (
                <button key={color} type="button" onClick={() => setForm({ ...form, color })}
                  className={`w-8 h-8 rounded-lg transition-all ${form.color === color ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-background scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">{editAccount ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
