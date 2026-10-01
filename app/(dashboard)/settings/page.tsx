'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { errorMessage } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import { CURRENCIES } from '@/lib/constants';
import toast from 'react-hot-toast';
import { RiUser3Line, RiPaletteLine } from 'react-icons/ri';

export default function SettingsPage() {
  const { user, profile } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <RiUser3Line className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Profile</h2>
            <p className="text-sm text-muted">{user?.email}</p>
          </div>
        </div>
        {profile ? (
          // Remount when the profile arrives so the form starts from saved values
          <ProfileForm
            key={profile._id}
            initialName={profile.displayName || user?.displayName || ''}
            initialCurrency={profile.defaultCurrency || 'BDT'}
          />
        ) : (
          <div className="space-y-4"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
        )}
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <RiPaletteLine className="w-5 h-5 text-violet-400" />
          </div>
          <h2 className="font-semibold text-foreground">Appearance</h2>
        </div>
        <div className="flex gap-3">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button key={t} onClick={() => setTheme(t)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium capitalize transition-all ${
                theme === t
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  : 'bg-surface text-muted hover:text-foreground border border-border'
              }`}>
              {t}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ProfileForm({ initialName, initialCurrency }: { initialName: string; initialCurrency: string }) {
  const { updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(initialName);
  const [defaultCurrency, setDefaultCurrency] = useState(initialCurrency);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) { toast.error('Display name cannot be empty'); return; }
    setSaving(true);
    try {
      await updateProfile({ displayName: displayName.trim(), defaultCurrency });
      toast.success('Settings saved');
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to save'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <Input label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      <div>
        <Select label="Default Currency" value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value)} options={CURRENCIES.map(c => ({ value: c.code, label: `${c.code} - ${c.name}` }))} />
        <p className="mt-1 text-xs text-muted">Used as the starting currency when you create a new account.</p>
      </div>
      <Button type="submit" loading={saving}>Save Changes</Button>
    </form>
  );
}
