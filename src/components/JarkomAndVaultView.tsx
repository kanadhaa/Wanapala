import React, { useState } from 'react';
import { Bell, Send, CheckCheck, AlertCircle, BookOpen, Download, Eye, Lock } from 'lucide-react';
import { exportSOPDocumentToPDF } from '../utils/pdfExport.ts';

interface Props {
  role: 'admin' | 'anggota_aktif' | 'anggota_muda';
  currentUserName: string;
  announcements: any[];
  documents: any[];
  totalMembersCount: number;
  onBroadcastJarkom: (payload: any) => Promise<void>;
  onMarkRead: (id: number) => Promise<void>;
}

export const JarkomAndVaultView: React.FC<Props> = ({
  role,
  currentUserName,
  announcements,
  documents,
  totalMembersCount,
  onBroadcastJarkom,
  onMarkRead,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'jarkom' | 'vault'>('jarkom');
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [pushStatus, setPushStatus] = useState<string>('Siap Mengirim Push Notification Browser');

  // Jarkom Form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Update Tugas');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('Seluruh Anggota');

  const triggerBrowserPush = async (notifTitle: string, notifBody: string) => {
    if (!('Notification' in window)) {
      setPushStatus('Notifikasi disiarkan via In-App Real-Time Banner');
      return;
    }
    if (Notification.permission === 'granted') {
      new Notification(`WANAPALA JARKOM: ${notifTitle}`, { body: notifBody });
      setPushStatus('Push Notification Terkirim ke Perangkat Anggota');
    } else if (Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification(`WANAPALA JARKOM: ${notifTitle}`, { body: notifBody });
        setPushStatus('Izin Push Aktif & Notifikasi Terkirim');
      } else {
        setPushStatus('Disiarkan melalui In-App Jarkom Center');
      }
    }
  };

  const handleSendJarkom = async (e: React.FormEvent) => {
    e.preventDefault();
    await onBroadcastJarkom({
      title,
      category,
      content,
      senderName: currentUserName,
      senderRole: role === 'admin' ? 'Pengurus Harian' : 'Koordinator Lapangan',
      targetAudience,
    });
    await triggerBrowserPush(title, content);
    setTitle('');
    setContent('');
  };

  const canAccessDoc = (minRole: string) => {
    if (role === 'admin' || role === 'anggota_aktif') return true;
    return minRole === 'anggota_muda';
  };

  return (
    <div className="space-y-8">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div>
          <p className="text-xs text-orange-400 font-mono mb-1">
            JARINGAN KOMUNIKASI (JARKOM) · PUSH NOTIFICATION · SOP DIGITAL VAULT
          </p>
          <h2 className="text-2xl font-bold text-stone-100 tracking-tight">
            Siaran Jarkom Push Notification & Pustaka SOP Administrasi
          </h2>
        </div>

        <div className="flex items-center gap-1 p-1 bg-stone-900 border border-stone-800 rounded-lg w-fit">
          <button
            onClick={() => setActiveSubTab('jarkom')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeSubTab === 'jarkom'
                ? 'bg-orange-500 text-stone-950 font-semibold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            1. Sistem Jarkom & Push ({announcements.length})
          </button>
          <button
            onClick={() => setActiveSubTab('vault')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeSubTab === 'vault'
                ? 'bg-orange-500 text-stone-950 font-semibold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            2. SOP Administrasi & Digital Vault ({documents.length})
          </button>
        </div>
      </div>

      {activeSubTab === 'jarkom' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Broadcast Form (Admin & Anggota Aktif) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#1C1613] border border-stone-800/90 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <h3 className="text-sm font-semibold text-stone-100 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-orange-400" />
                  Broadcast Jarkom & Update Tugas
                </h3>
              </div>

              <div className="text-[11px] font-mono text-orange-300 bg-orange-950/30 border border-orange-500/30 rounded px-3 py-2">
                Status Push: {pushStatus}
              </div>

              {role === 'anggota_muda' ? (
                <p className="text-xs text-stone-400 leading-relaxed">
                  Anggota Muda (MBIM) dapat membaca pengumuman dan menekan tombol konfirmasi keterbacaan pada setiap pesan Jarkom di samping.
                </p>
              ) : (
                <form onSubmit={handleSendJarkom} className="space-y-3">
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Judul Siaran / Pembaruan Tugas</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="mis. Update Tugas Logistik Diksar"
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Kategori Jarkom</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
                    >
                      <option value="Update Tugas">Pembaruan Status Tugas Tim</option>
                      <option value="Darurat">Darurat / Cuaca Lapangan</option>
                      <option value="Info Kegiatan">Info Kegiatan Operasional</option>
                      <option value="Tagihan Kas">Tagihan Kas Bulanan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Target Penerima</label>
                    <select
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
                    >
                      <option value="Seluruh Anggota">Seluruh Anggota Wanapala</option>
                      <option value="Anggota Aktif & Pengurus">Khusus Anggota Aktif & Pengurus</option>
                      <option value="Peserta Diksar / MBIM">Peserta Diksar / Anggota Muda</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Isi Pesan Jarkom</label>
                    <textarea
                      rows={4}
                      required
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Tuliskan instruksi koordinasi lapangan atau status tugas..."
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-orange-500 hover:bg-orange-400 text-stone-950 font-semibold text-xs rounded-lg transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Kirim Siaran & Push Notification
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Jarkom Feed & Read Receipt Tracking */}
          <div className="lg:col-span-2 space-y-4">
            {announcements.map((item) => {
              let readers: string[] = [];
              try {
                readers = JSON.parse(item.readByList || '[]');
              } catch {
                readers = [];
              }
              const hasRead = readers.includes(currentUserName);

              return (
                <div
                  key={item.id}
                  className={`bg-[#1C1613] border rounded-lg p-5 space-y-3 ${
                    item.category === 'Darurat'
                      ? 'border-rose-500/50'
                      : 'border-stone-800/90'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          item.category === 'Darurat'
                            ? 'text-rose-400 font-semibold flex items-center gap-1'
                            : 'text-orange-400 font-semibold'
                        }
                      >
                        {item.category === 'Darurat' && <AlertCircle className="w-3.5 h-3.5" />}
                        [{item.category.toUpperCase()}]
                      </span>
                      <span className="text-stone-500">·</span>
                      <span className="text-stone-400">Target: {item.targetAudience}</span>
                    </div>

                    <span className="text-stone-400">
                      Pengirim: {item.senderName} ({item.senderRole})
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-stone-100">{item.title}</h3>
                  <p className="text-xs text-stone-300 leading-relaxed">{item.content}</p>

                  {/* Read-Receipt Status Bar */}
                  <div className="pt-3 border-t border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-stone-400">
                      <span className="font-mono text-orange-400 font-semibold tabular-nums">
                        Dibaca oleh {readers.length} dari {Math.max(totalMembersCount, readers.length)} anggota:
                      </span>{' '}
                      <span className="text-stone-300">{readers.join(', ')}</span>
                    </div>

                    <button
                      onClick={() => onMarkRead(item.id)}
                      disabled={hasRead}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                        hasRead
                          ? 'bg-stone-800 text-emerald-400 cursor-default'
                          : 'bg-orange-500 hover:bg-orange-400 text-stone-950 font-semibold'
                      }`}
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      {hasRead ? `Sudah Dibaca (${currentUserName})` : 'Konfirmasi Sudah Baca'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* SOP Administrasi & Digital Vault */
        <div className="space-y-6">
          {/* Preview Modal Inline */}
          {selectedDoc && (
            <div className="bg-[#1C1613] border border-orange-500/50 rounded-lg p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
                <div>
                  <div className="text-xs font-mono text-orange-400">
                    PREVIEW DOKUMEN RESMI · {selectedDoc.codeNumber} · {selectedDoc.version}
                  </div>
                  <h3 className="text-lg font-bold text-stone-100">{selectedDoc.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportSOPDocumentToPDF(selectedDoc)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-400 text-stone-950 font-semibold text-xs rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh PDF Resmi
                  </button>
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="px-3 py-2 text-xs text-stone-400 hover:text-stone-200"
                  >
                    Tutup Preview
                  </button>
                </div>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed">{selectedDoc.contentSummary}</p>

              <div className="space-y-2">
                <div className="text-xs font-mono text-stone-400">
                  DAFTAR PERIKSA PROSEDUR WAJIB (CHECKLIST):
                </div>
                <ul className="space-y-1.5 text-xs text-stone-200">
                  {(() => {
                    try {
                      return JSON.parse(selectedDoc.checklistItems || '[]').map((c: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 font-mono">
                          <span className="text-orange-400">0{i + 1}.</span>
                          <span>{c}</span>
                        </li>
                      ));
                    } catch {
                      return <li>{selectedDoc.checklistItems}</li>;
                    }
                  })()}
                </ul>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((docItem) => {
              const allowed = canAccessDoc(docItem.accessMinimumRole);

              return (
                <div
                  key={docItem.id}
                  className="bg-[#1C1613] border border-stone-800/90 rounded-lg p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-stone-400">
                      <span className="text-orange-400">{docItem.codeNumber}</span>
                      <span>
                        {docItem.docType} · {docItem.category} · {docItem.version}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-orange-400 shrink-0" />
                      {docItem.title}
                    </h3>

                    <p className="text-xs text-stone-300 leading-relaxed">
                      {allowed
                        ? docItem.contentSummary
                        : 'Dokumen SOP Teknis Lanjutan ini dikhususkan bagi Anggota Aktif & Pengurus Harian setelah lulus Pendidikan Dasar (Diksar).'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-800/70 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-stone-400">
                      Min. Akses: {docItem.accessMinimumRole === 'anggota_muda' ? 'Semua Anggota (Diksar)' : 'Anggota Aktif'}
                    </span>

                    {allowed ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedDoc(docItem)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg border border-stone-700 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-orange-400" />
                          Preview
                        </button>
                        <button
                          onClick={() => exportSOPDocumentToPDF(docItem)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-400 text-stone-950 rounded-lg transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Unduh PDF
                        </button>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-mono text-amber-400">
                        <Lock className="w-3.5 h-3.5" />
                        Terkunci (RBAC)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
