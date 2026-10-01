'use client';

import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { apiPost, apiPut, apiDelete, errorMessage } from '@/lib/api';
import { useLookups } from '@/lib/useLookups';
import { useAuth } from '@/contexts/AuthContext';
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
  const { accounts, loading } = useLookups();
  const [modalOpen, setModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [form, setForm] = useState({ name: '', currency: 'BDT', color: '#6366f1', openingBalance: '' });
  const [saving, setSaving] = useState(false);
  const { profile } = useAuth();

  function openCreate() { setEditAccount(null); setForm({ name: '', currency: profile?.defaultCurrency || 'BDT', color: ACCOUNT_COLORS[accounts.length % ACCOUNT_COLORS.length], openingBalance: '' }); setModalOpen(true); }
  function openEdit(account: Account) { setEditAccount(account); setForm({ name: account.name, currency: account.currency, color: account.color || '#6366f1', openingBalance: account.openingBalance ? String(account.openingBalance) : '' }); setModalOpen(true); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    const openingBalance = form.openingBalance.trim() === '' ? 0 : Number(form.openingBalance);
    if (!Number.isFinite(openingBalance)) { toast.error('Previous balance must be a number'); return; }
    const body = { ...form, openingBalance };
    setSaving(true);
    try {
      if (editAccount) { await apiPut(`/accounts/${editAccount._id}`, body); toast.success('Account updated'); }
      else { await apiPost('/accounts', body); toast.success('Account created'); }
      setModalOpen(false);
    } catch (err: unknown) { toast.error(errorMessage(err, 'Failed to save')); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this account? Its transactions stay in your history, but the account will no longer appear in lists.')) return;
    try { await apiDelete(`/accounts/${id}`); toast.success('Account deleted'); }
    catch (err: unknown) { toast.error(errorMessage(err, 'Failed to delete')); }
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
          {accounts.map((account) => (
            <motion.div key={account._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
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
                    <button onClick={() => openEdit(account)} aria-label="Edit account" className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"><RiEditLine className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(account._id)} aria-label="Delete account" className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors"><RiDeleteBinLine className="w-4 h-4" /></button>
                  </div>
                </div>
                <p className={`text-2xl font-bold ${account.balance < 0 ? 'text-red-500' : 'text-foreground'}`}>{formatCurrency(account.balance, account.currency)}</p>
                {!!account.openingBalance && <p className="text-xs text-muted mt-1">Previous balance: {formatCurrency(account.openingBalance, account.currency)}</p>}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editAccount ? 'Edit Account' : 'New Account'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Account Name" placeholder="e.g., Payoneer, bKash, Cash" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div>
            <Input
              label="Previous balance (আগের ব্যালেন্স)"
              type="number" step="0.01" inputMode="decimal" placeholder="0"
              value={form.openingBalance}
              onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
            />
            <p className="mt-1 text-xs text-muted">
              {editAccount
                ? 'Money already in this account before you started using the app. Changing it moves the current balance by the same difference.'
                : 'Money already in this account before you started using the app. Not counted as income.'}
            </p>
          </div>
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
