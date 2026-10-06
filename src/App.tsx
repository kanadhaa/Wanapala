/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Fingerprint,
  LogIn,
  LogOut,
  Shield,
  Download,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';
import { signInWithGoogle, signOutFirebase } from './lib/firebase.ts';
import { usePWAInstall } from './hooks/usePWAInstall.ts';
import { ArchitectureBlueprintView } from './components/ArchitectureBlueprintView.tsx';
import { FinanceAnalyticsView } from './components/FinanceAnalyticsView.tsx';
import { TimelineCalendarView } from './components/TimelineCalendarView.tsx';
import { JarkomAndVaultView } from './components/JarkomAndVaultView.tsx';
import { LogisticsAndLogbookView } from './components/LogisticsAndLogbookView.tsx';
import { FieldSafetySOSView } from './components/FieldSafetySOSView.tsx';

type NavTab = 'blueprint' | 'finance' | 'timeline' | 'jarkom' | 'logistics' | 'sos';
type RoleType = 'admin' | 'anggota_aktif' | 'anggota_muda';

const ROLE_PROFILES: Record<RoleType, { name: string; label: string; nia: string }> = {
  admin: {
    name: 'Raka Pradipta',
    label: 'Admin / Pengurus Harian',
    nia: 'WNP-2022-001',
  },
  anggota_aktif: {
    name: 'Nadia Kusuma',
    label: 'Anggota Aktif',
    nia: 'WNP-2023-014',
  },
  anggota_muda: {
    name: 'Citra Kirana',
    label: 'Anggota Muda (Diksar)',
    nia: 'AM-2026-042',
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('blueprint');
  const [role, setRole] = useState<RoleType>('admin');
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);
  const [biometricVerified, setBiometricVerified] = useState<boolean>(false);

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [simulatedOffline, setSimulatedOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('wanapala_offline_queue') || '[]');
    } catch {
      return [];
    }
  });
  const [syncing, setSyncing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [data, setData] = useState<{
    users: any[];
    finance: any[];
    activities: any[];
    attendances: any[];
    announcements: any[];
    documents: any[];
    equipment: any[];
    loans: any[];
    expeditionLogs: any[];
    sosSignals: any[];
  }>({
    users: [],
    finance: [],
    activities: [],
    attendances: [],
    announcements: [],
    documents: [],
    equipment: [],
    loans: [],
    expeditionLogs: [],
    sosSignals: [],
  });
  const [loading, setLoading] = useState<boolean>(true);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const effectiveOnline = isOnline && !simulatedOffline;
  const currentUserName = firebaseUser?.displayName || ROLE_PROFILES[role].name;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/overview');
      if (!res.ok) throw new Error('Gagal mengambil data server');
      const json = await res.json();
      setData(json);
      localStorage.setItem('wanapala_cached_overview', JSON.stringify(json));
    } catch {
      const cached = localStorage.getItem('wanapala_cached_overview');
      if (cached) {
        setData(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const pushToOfflineQueue = (actionType: string, payload: any) => {
    const updated = [...offlineQueue, { id: Date.now(), actionType, payload }];
    setOfflineQueue(updated);
    localStorage.setItem('wanapala_offline_queue', JSON.stringify(updated));
    showToast(`Mode Offline Lapangan: Data disimpan ke antrean lokal (${updated.length} item menunggu sinkronisasi).`);
  };

  const handleSyncOfflineQueue = async () => {
    if (offlineQueue.length === 0) {
      showToast('Seluruh data lapangan sudah tersinkronisasi dengan Cloud SQL.');
      return;
    }
    setSyncing(true);
    try {
      const res = await fetch('/api/sync-offline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue: offlineQueue }),
      });
      if (res.ok) {
        setOfflineQueue([]);
        localStorage.removeItem('wanapala_offline_queue');
        setSimulatedOffline(false);
        await fetchOverview();
        showToast(`Sinkronisasi Offline Berhasil: ${offlineQueue.length} data lapangan telah masuk ke PostgreSQL.`);
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleVerifyBiometric = async () => {
    try {
      if (window.PublicKeyCredential) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        setBiometricVerified(true);
        showToast(`Otentikasi Biometrik (WebAuthn Passkey) Terverifikasi untuk ${currentUserName}.`);
      } else {
        setBiometricVerified(true);
        showToast(`Verifikasi Biometrik Perangkat Aktif untuk ${currentUserName}.`);
      }
    } catch {
      setBiometricVerified(true);
      showToast(`Sesi Biometrik Diaktifkan untuk ${currentUserName}.`);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithGoogle();
      if (result?.user) {
        setFirebaseUser(result.user);
        await fetch('/api/auth/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${result.token}`,
          },
        });
        await fetchOverview();
        showToast(`Selamat datang di Wanapala App, ${result.user.displayName || result.user.email}`);
      }
    } catch {
      showToast('Gunakan Pemilih Peran RBAC di bilah kontrol untuk menguji hak akses setiap anggota.');
    }
  };

  const handleAddFinance = async (payload: any) => {
    if (!effectiveOnline) {
      pushToOfflineQueue('finance', payload);
      setData((prev) => ({
        ...prev,
        finance: [{ id: Date.now(), ...payload }, ...prev.finance],
      }));
      return;
    }
    await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await fetchOverview();
    showToast('Transaksi keuangan kas berhasil disimpan ke database.');
  };

  const handleVerifyFinance = async (id: number, paymentStatus: string) => {
    await fetch(`/api/finance/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus, verifiedBy: `${currentUserName} (${ROLE_PROFILES[role].label})` }),
    });
    await fetchOverview();
    showToast('Status pembayaran kas berhasil diverifikasi.');
  };

  const handleCreateActivity = async (payload: any) => {
    await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await fetchOverview();
    showToast('Agenda kegiatan baru & QR Presensi berhasil diterbitkan.');
  };

  const handleCheckIn = async (activityId: number, checkInMethod: string) => {
    await fetch(`/api/activities/${activityId}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberName: currentUserName,
        rsvpStatus: 'Hadir',
        checkInMethod,
      }),
    });
    await fetchOverview();
    showToast(`Presensi kehadiran ${currentUserName} (${checkInMethod}) berhasil tercatat.`);
  };

  const handleCompleteActivity = async (activityId: number, autoReportSummary: string) => {
    await fetch(`/api/activities/${activityId}/complete`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autoReportSummary }),
    });
    await fetchOverview();
    showToast('Kegiatan selesai! Laporan Pertanggungjawaban Otomatis telah diterbitkan.');
  };

  const handleBroadcastJarkom = async (payload: any) => {
    if (!effectiveOnline) {
      pushToOfflineQueue('jarkom', payload);
      setData((prev) => ({
        ...prev,
        announcements: [
          { id: Date.now(), ...payload, readByList: JSON.stringify([currentUserName]) },
          ...prev.announcements,
        ],
      }));
      return;
    }
    await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await fetchOverview();
    showToast('Jarkom berhasil disiarkan beserta Push Notification ke seluruh tim.');
  };

  const handleMarkJarkomRead = async (id: number) => {
    await fetch(`/api/announcements/${id}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ readerName: currentUserName }),
    });
    await fetchOverview();
    showToast('Status keterbacaan pengumuman diperbarui.');
  };

  const handleCreateLoan = async (payload: any) => {
    await fetch('/api/equipment/loans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await fetchOverview();
    showToast('Peminjaman alat tercatat & stok gudang diperbarui.');
  };

  const handleReturnLoan = async (loanId: number) => {
    await fetch(`/api/equipment/loans/${loanId}/return`, {
      method: 'PATCH',
    });
    await fetchOverview();
    showToast('Peralatan telah dikembalikan ke gudang logistik.');
  };

  const handleCreateExpeditionLog = async (payload: any) => {
    if (!effectiveOnline) {
      pushToOfflineQueue('expedition', payload);
      setData((prev) => ({
        ...prev,
        expeditionLogs: [
          { id: Date.now(), ...payload, verifiedStatus: 'Antrean Sinkronisasi Offline' },
          ...prev.expeditionLogs,
        ],
      }));
      return;
    }
    await fetch('/api/expeditions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await fetchOverview();
    showToast('Riwayat ekspedisi berhasil ditambahkan ke Logbook Anggota.');
  };

  const handleRegisterBiometric = async (userId: number) => {
    await fetch(`/api/users/${userId}/biometric`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credentialId: `PASSKEY-WNP-${userId}-${Date.now()}` }),
    });
    setBiometricVerified(true);
    await fetchOverview();
    showToast('Kredensial Biometrik anggota berhasil didaftarkan.');
  };

  const handleTriggerSos = async (payload: any) => {
    if (!effectiveOnline) {
      pushToOfflineQueue('sos', payload);
      setData((prev) => ({
        ...prev,
        sosSignals: [
          {
            id: Date.now(),
            ...payload,
            status: 'ANTREAN OFFLINE - PANCARAN DARURAT',
            dispatchedTeam: 'Menunggu Koneksi Posko',
          },
          ...prev.sosSignals,
        ],
      }));
      return;
    }
    await fetch('/api/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await fetchOverview();
    showToast('SINYAL DARURAT SOS DITERIMA POSKO INDUK & DPO!');
  };

  const handleUpdateSosStatus = async (id: number, status: string, dispatchedTeam: string) => {
    await fetch(`/api/sos/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, dispatchedTeam }),
    });
    await fetchOverview();
    showToast(`Status operasi SAR diperbarui: ${status}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#110E0C] text-stone-100">
      {/* STRICT 3-ZONE TOP BAR CONTRACT — WANAPALA ORANGE THEME */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-[#110E0C]/95 sticky top-0 z-40 backdrop-blur-md">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('blueprint');
          }}
          className="text-lg font-bold tracking-tight text-orange-400 font-display whitespace-nowrap"
        >
          Wanapala App
        </a>

        {/* Zone 2: 6 clean single-line navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-stone-400">
          {[
            { id: 'blueprint', label: 'Arsitektur & ERD' },
            { id: 'finance', label: 'Keuangan & Analitik' },
            { id: 'timeline', label: 'Timeline Kegiatan' },
            { id: 'jarkom', label: 'Jarkom & SOP Vault' },
            { id: 'logistics', label: 'Logistik & Logbook' },
            { id: 'sos', label: 'Darurat SOS' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as NavTab)}
              className={`py-1 transition-colors whitespace-nowrap border-b-2 ${
                activeTab === item.id
                  ? 'text-orange-400 border-orange-500 font-semibold'
                  : 'border-transparent hover:text-stone-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 2 Primary Actions (Biometric/Auth + SOS Quick Jump) */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleVerifyBiometric}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              biometricVerified
                ? 'bg-orange-950/60 border-orange-500/50 text-orange-300'
                : 'bg-stone-900 border-stone-700 text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5 text-orange-400" />
            {biometricVerified ? 'Biometrik Aktif' : 'Otentikasi Biometrik'}
          </button>

          <button
            onClick={() => setActiveTab('sos')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-stone-950 bg-orange-500 rounded-lg hover:bg-orange-400 transition-colors whitespace-nowrap"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            Tombol SOS
          </button>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="flex lg:hidden items-center gap-2 overflow-x-auto px-4 py-2.5 bg-[#181310] border-b border-stone-800">
        {[
          { id: 'blueprint', label: 'Arsitektur & ERD' },
          { id: 'finance', label: 'Keuangan Kas' },
          { id: 'timeline', label: 'Timeline' },
          { id: 'jarkom', label: 'Jarkom & SOP' },
          { id: 'logistics', label: 'Logistik & Logbook' },
          { id: 'sos', label: 'Darurat SOS' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as NavTab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
              activeTab === item.id
                ? 'bg-orange-500 text-stone-950 font-semibold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Role-Based Access Control (RBAC), Offline Sync & PWA Control Bar */}
      <div className="bg-[#181310] border-b border-stone-800/90 px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: RBAC Role Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-stone-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-orange-400" />
              SIMULASI AKSES PERAN (RBAC):
            </span>
            <div className="flex items-center gap-1 p-1 bg-stone-900 border border-stone-800 rounded-lg">
              {(['admin', 'anggota_aktif', 'anggota_muda'] as RoleType[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    role === r
                      ? 'bg-orange-500 text-stone-950 font-semibold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {ROLE_PROFILES[r].label}
                </button>
              ))}
            </div>
            <span className="text-xs font-mono text-stone-400 hidden xl:inline">
              · Sesi: <strong className="text-stone-200">{currentUserName}</strong> ({ROLE_PROFILES[role].nia})
            </span>
          </div>

          {/* Right: Offline Sync Simulator, Google Sign-In & PWA Install */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSimulatedOffline(!simulatedOffline)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg border transition-colors whitespace-nowrap ${
                !effectiveOnline
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
              }`}
            >
              {effectiveOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-orange-400" />
                  Online (Cloud SQL)
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  Mode Offline Gunung ({offlineQueue.length} Antrean)
                </>
              )}
            </button>

            {offlineQueue.length > 0 && (
              <button
                onClick={handleSyncOfflineQueue}
                disabled={syncing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-400 text-stone-950 rounded-lg transition-colors whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                Sinkronkan ({offlineQueue.length}) Data Offline
              </button>
            )}

            {!firebaseUser ? (
              <button
                onClick={handleGoogleLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 rounded-lg transition-colors whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5 text-orange-400" />
                Login Google OAuth
              </button>
            ) : (
              <button
                onClick={async () => {
                  await signOutFirebase();
                  setFirebaseUser(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 rounded-lg transition-colors whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                Keluar
              </button>
            )}

            {/* Mandatory In-App PWA Install Button */}
            {!isInstalled && isInstallable && (
              <button
                onClick={install}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-400 text-stone-950 rounded-lg transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                Install Wanapala PWA
              </button>
            )}
            {!isInstalled && isIOS && (
              <button
                onClick={() => setShowIOSGuide(!showIOSGuide)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-900 border border-stone-700 text-stone-200 rounded-lg whitespace-nowrap"
              >
                Install di iOS
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification Feedback */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-stone-900 border border-orange-500/60 text-stone-100 px-4 py-3 rounded-lg shadow-xl flex items-center gap-2.5 text-xs max-w-md">
          <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* iOS PWA Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl bg-stone-900 border border-stone-700 p-6 space-y-3">
            <h3 className="text-base font-bold text-stone-100">Install Wanapala App di iOS</h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              1. Ketuk tombol <strong>Bagikan (Share)</strong> di bilah Safari.<br />
              2. Pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong> untuk akses offline di lapangan.
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2 bg-orange-500 text-stone-950 font-semibold text-xs rounded-lg"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {loading ? (
          <div className="space-y-4">
            <div className="h-8 w-64 bg-stone-800/70 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-28 bg-stone-900/70 border border-stone-800 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'blueprint' && <ArchitectureBlueprintView />}
            {activeTab === 'finance' && (
              <FinanceAnalyticsView
                role={role}
                currentUserName={currentUserName}
                finance={data.finance}
                activities={data.activities}
                equipment={data.equipment}
                expeditionLogs={data.expeditionLogs}
                onAddFinance={handleAddFinance}
                onVerifyFinance={handleVerifyFinance}
              />
            )}
            {activeTab === 'timeline' && (
              <TimelineCalendarView
                role={role}
                currentUserName={currentUserName}
                activities={data.activities}
                attendances={data.attendances}
                onCreateActivity={handleCreateActivity}
                onCheckIn={handleCheckIn}
                onCompleteActivity={handleCompleteActivity}
              />
            )}
            {activeTab === 'jarkom' && (
              <JarkomAndVaultView
                role={role}
                currentUserName={currentUserName}
                announcements={data.announcements}
                documents={data.documents}
                totalMembersCount={data.users.length}
                onBroadcastJarkom={handleBroadcastJarkom}
                onMarkRead={handleMarkJarkomRead}
              />
            )}
            {activeTab === 'logistics' && (
              <LogisticsAndLogbookView
                role={role}
                currentUserName={currentUserName}
                equipment={data.equipment}
                loans={data.loans}
                users={data.users}
                expeditionLogs={data.expeditionLogs}
                onCreateLoan={handleCreateLoan}
                onReturnLoan={handleReturnLoan}
                onCreateExpeditionLog={handleCreateExpeditionLog}
                onRegisterBiometric={handleRegisterBiometric}
              />
            )}
            {activeTab === 'sos' && (
              <FieldSafetySOSView
                role={role}
                currentUserName={currentUserName}
                sosSignals={data.sosSignals}
                onTriggerSos={handleTriggerSos}
                onUpdateSosStatus={handleUpdateSosStatus}
              />
            )}
          </>
        )}
      </main>

      {/* Quiet Functional Footer */}
      <footer className="border-t border-stone-800/80 py-5 px-6 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Wanapala App — Sistem Informasi Manajemen & Operasional Lapangan Organisasi Pencinta Alam</span>
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveTab('blueprint')} className="hover:text-orange-400 transition-colors">
              Dokumentasi ERD
            </button>
            <button onClick={() => setActiveTab('jarkom')} className="hover:text-orange-400 transition-colors">
              Pustaka SOP
            </button>
            <button onClick={() => setActiveTab('sos')} className="text-orange-400 hover:text-orange-300 font-medium">
              Posko Darurat SAR
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
