import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Logo } from './Logo';
import {
  ArrowLeft, Users, HardDrive, FileText, Shield, RefreshCcw,
  Server
} from 'lucide-react';

type StorageEntry = { id: string; hash: string; size: number; created_at: string };

export function AdminDashboard({ onBack }: { onBack: () => void }) {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<{ email: string; role: string; created_at: string }[]>([]);
  const [storage, setStorage] = useState<StorageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchData = async () => {
    setLoading(true);
    try {
      const h = { Authorization: `Bearer ${token}` };
      const [u, s] = await Promise.all([
        fetch(`${API}/admin/users`, { headers: h }).then(r => r.json()),
        fetch(`${API}/admin/storage`, { headers: h }).then(r => r.json()),
      ]);
      setUsers(u.users || []);
      setStorage(s.entries || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const totalSize = storage.reduce((a, s) => a + s.size, 0);
  const formatMB = (b: number) => (b / 1024 / 1024).toFixed(1);

  const stats = [
    { label: 'Identities',    value: users.length, icon: <Users size={18} strokeWidth={1.5} />,     color: 'text-primary' },
    { label: 'Sealed Blobs',  value: storage.length, icon: <FileText size={18} strokeWidth={1.5} />,  color: 'text-sky-400' },
    { label: 'Vault Size',    value: `${formatMB(totalSize)} MB`, icon: <HardDrive size={18} strokeWidth={1.5} />, color: 'text-amber-400' },
    { label: 'System Status', value: 'Active', icon: <Shield size={18} strokeWidth={1.5} />,            color: 'text-emerald-400' },
  ];

  return (
    <div className="fixed inset-0 bg-background text-foreground flex flex-col font-['Inter'] animate-fadeIn">

      {/* Header */}
      <header className="flex-shrink-0 h-[72px] flex items-center px-8 gap-4 border-b border-white/[0.04] bg-card/60 backdrop-blur-xl z-50">
        <button onClick={onBack}
          className="flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-medium text-muted-foreground hover:text-white hover:bg-secondary border border-white/[0.04] transition-all duration-300 shadow-sm cursor-pointer">
          <ArrowLeft size={16} /> Retreat
        </button>
        <div className="h-6 w-px bg-white/[0.04] mx-2" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm">
            <Logo size={18} />
          </div>
          <div>
            <span className="text-[15px] font-bold text-foreground tracking-tight block">Zero-Trust Administration</span>
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">Command Center</span>
          </div>
        </div>
        <div className="flex-1" />
        <button onClick={fetchData} className="w-10 h-10 rounded-xl border border-white/[0.04] bg-card hover:bg-secondary text-muted-foreground hover:text-white flex items-center justify-center shadow-sm cursor-pointer transition-all duration-300">
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scroll-thin">
        <div className="max-w-6xl mx-auto p-12 space-y-10">

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map(s => (
              <div key={s.label} className="p-6 rounded-2xl border border-white/[0.04] bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg bg-secondary/80 border border-white/[0.02] ${s.color}`}>
                    {s.icon}
                  </div>
                  <span className="text-[12px] text-muted-foreground font-semibold uppercase tracking-widest">{s.label}</span>
                </div>
                <p className="text-[32px] font-bold text-foreground leading-none tracking-tight">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Users table */}
          <div>
            <h2 className="text-[16px] font-bold tracking-tight text-foreground mb-4 flex items-center gap-2">
              <Users size={18} className="text-primary" /> Active Identities
            </h2>
            <div className="rounded-2xl border border-white/[0.04] bg-card/40 overflow-hidden shadow-inner">
              {/* Header */}
              <div className="flex items-center gap-4 px-6 py-4 bg-secondary/40 text-[11px] font-bold text-muted-foreground uppercase tracking-widest border-b border-white/[0.02]">
                <span className="flex-1">Cryptographic Identity (Email)</span>
                <span className="w-24 text-center">Clearance</span>
                <span className="w-32 text-right">Provisioned</span>
              </div>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-[60px] animate-pulse bg-secondary/20 border-b border-white/[0.02] last:border-0" />
                ))
              ) : users.length === 0 ? (
                <p className="p-8 text-[13px] text-muted-foreground text-center font-medium">No identities recorded in secure enclave</p>
              ) : (
                <div className="divide-y divide-white/[0.02]">
                  {users.map(u => (
                    <div key={u.email} className="flex items-center gap-4 px-6 py-4 bg-transparent hover:bg-secondary/40 transition-colors">
                      <span className="flex-1 text-[14px] font-medium text-foreground truncate">{u.email}</span>
                      <span className={`w-24 text-center text-[10px] uppercase font-bold tracking-widest rounded-lg px-2.5 py-1.5 border
                        ${u.role === 'admin' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-secondary text-muted-foreground border-white/[0.02]'}`}>
                        {u.role}
                      </span>
                      <span className="w-32 text-right text-[12px] text-muted-foreground font-mono">
                        {new Date(u.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Storage table */}
          <div>
            <h2 className="text-[16px] font-bold tracking-tight text-foreground mb-4 flex items-center gap-2">
              <HardDrive size={18} className="text-sky-400" /> AES-256-GCM Encrypted Blob Storage
            </h2>
            <div className="rounded-2xl border border-white/[0.04] bg-card/40 overflow-hidden shadow-inner">
              <div className="flex items-center gap-4 px-6 py-4 bg-secondary/40 text-[11px] font-bold text-muted-foreground uppercase tracking-widest border-b border-white/[0.02]">
                <span className="flex-1">SHA-256 Checksum Identifier</span>
                <span className="w-24 text-right">Ciphertext Size</span>
                <span className="w-32 text-right">Ingested On</span>
              </div>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-[60px] animate-pulse bg-secondary/20 border-b border-white/[0.02] last:border-0" />
                ))
              ) : storage.length === 0 ? (
                <p className="p-8 text-[13px] text-muted-foreground text-center font-medium">Vault architecture contains no blobs</p>
              ) : (
                <div className="divide-y divide-white/[0.02]">
                  {storage.slice(0, 50).map(e => (
                    <div key={e.id} className="flex items-center gap-4 px-6 py-4 bg-transparent hover:bg-secondary/40 transition-colors">
                      <code className="flex-1 text-[13px] font-mono text-primary truncate max-w-[500px]">
                        {e.hash}
                      </code>
                      <span className="w-24 text-right text-[12px] font-mono text-muted-foreground">
                        {e.size < 1024 ? `${e.size} B` : e.size < 1048576 ? `${(e.size/1024).toFixed(0)} KB` : `${(e.size/1048576).toFixed(1)} MB`}
                      </span>
                      <span className="w-32 text-right text-[12px] text-muted-foreground font-mono">
                        {new Date(e.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ZK notice */}
          <div className="flex items-start gap-4 p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] shadow-sm">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex-shrink-0 mt-0.5">
               <Server size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-[14px] font-bold tracking-tight text-emerald-400 mb-1">Cryptographic Immutability Guaranteed</p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                The administrative layer acts strictly as a dumb data store for AES-256-GCM ciphertexts. Decryption key material and plaintext vectors are never transmitted over the wire, effectively isolating system administrators from client payload data by mathematical design constraint.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
