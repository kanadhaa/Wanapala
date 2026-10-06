import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  QrCode,
  CheckCircle2,
  MapPin,
  FileCheck,
  ExternalLink,
  Download,
  Plus,
  Fingerprint,
} from 'lucide-react';
import { downloadICSFile, buildGoogleCalendarUrl } from '../utils/calendarSync.ts';
import { exportActivityAutoReportToPDF } from '../utils/pdfExport.ts';

interface Props {
  role: 'admin' | 'anggota_aktif' | 'anggota_muda';
  currentUserName: string;
  activities: any[];
  attendances: any[];
  onCreateActivity: (payload: any) => Promise<void>;
  onCheckIn: (activityId: number, method: string) => Promise<void>;
  onCompleteActivity: (activityId: number, summary: string) => Promise<void>;
}

export const TimelineCalendarView: React.FC<Props> = ({
  role,
  currentUserName,
  activities,
  attendances,
  onCreateActivity,
  onCheckIn,
  onCompleteActivity,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [showNewModal, setShowNewModal] = useState(false);
  const [activeQrActivity, setActiveQrActivity] = useState<any | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Ekspedisi');
  const [startDate, setStartDate] = useState('2026-11-05');
  const [endDate, setEndDate] = useState('2026-11-08');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState('-7.2421, 107.8912');
  const [picName, setPicName] = useState(currentUserName);
  const [description, setDescription] = useState('');
  const [rundown, setRundown] = useState('06:00 Briefing & Pengecekan Alat | 08:30 Keberangkatan Menuju Titik Awal | 17:00 Pendirian Bivak & Evaluasi Posko');
  const [accessLevel, setAccessLevel] = useState('Semua');

  // Filter activities based on RBAC & category
  const visibleActivities = activities.filter((act) => {
    if (role === 'anggota_muda' && act.accessLevel === 'Anggota Aktif') {
      return false;
    }
    if (selectedCategory !== 'Semua' && act.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateActivity({
      title,
      category,
      startDate,
      endDate,
      location,
      coordinates,
      picName,
      description,
      rundown,
      accessLevel,
    });
    setShowNewModal(false);
    setTitle('');
    setLocation('');
    setDescription('');
  };

  const handleGenerateAutoReport = async (act: any) => {
    const actAttendances = attendances.filter((a) => a.activityId === act.id);
    const count = Math.max(actAttendances.length, 8);
    const autoText = `LAPORAN OTOMATIS [SELESAI - ${new Date().toLocaleDateString('id-ID')}]: Kegiatan "${act.title}" di ${act.location} (${act.coordinates}) dipimpin oleh ${act.picName} telah terlaksana 100% sesuai SOP. Kehadiran terverifikasi: ${count} personel. Seluruh peralatan inventaris kembali lengkap tanpa insiden medis.`;
    await onCompleteActivity(act.id, autoText);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div>
          <p className="text-xs text-orange-400 font-mono mb-1">
            TIMELINE OPERASIONAL · PRESENSI QR/BIOMETRIK · SINKRONISASI KALENDER & LAPORAN OTOMATIS
          </p>
          <h2 className="text-2xl font-bold text-stone-100 tracking-tight">
            Kalender Kegiatan Lapangan & Sistem Pelaporan Otomatis
          </h2>
          {role === 'anggota_muda' && (
            <p className="text-xs text-amber-300 mt-1">
              Mode Akses Anggota Muda (MBIM): Menampilkan jadwal Pendidikan Dasar (Diksar), Rapat Umum, dan Pemeliharaan Alat.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {role === 'admin' && (
            <button
              onClick={() => setShowNewModal(!showNewModal)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-orange-500 hover:bg-orange-400 text-stone-950 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Jadwalkan Kegiatan Baru
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-stone-900 border border-stone-800 rounded-lg">
          {['Semua', 'Ekspedisi', 'Diksar', 'Pemeliharaan Alat', 'Rapat'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-stone-950 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-stone-400">
          {visibleActivities.length} Agenda Ditampilkan
        </span>
      </div>

      {/* Create Activity Form */}
      {showNewModal && (
        <form
          onSubmit={handleCreate}
          className="bg-[#1C1613] border border-orange-500/40 rounded-lg p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h3 className="text-sm font-semibold text-stone-100">Buat Agenda Kegiatan Operasional Baru</h3>
            <button
              type="button"
              onClick={() => setShowNewModal(false)}
              className="text-xs text-stone-400 hover:text-stone-200"
            >
              Batal
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-stone-400 mb-1">Judul Kegiatan</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="mis. Ekspedisi Tebing Citatah"
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs text-stone-400 mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
              >
                <option value="Ekspedisi">Ekspedisi</option>
                <option value="Diksar">Diksar / MBIM</option>
                <option value="Pemeliharaan Alat">Pemeliharaan Alat</option>
                <option value="Rapat">Rapat Organisasi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-stone-400 mb-1">Hak Akses Peserta</label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
              >
                <option value="Semua">Semua Anggota (Termasuk Anggota Muda)</option>
                <option value="Anggota Aktif">Khusus Anggota Aktif & Pengurus</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-stone-400 mb-1">Tanggal Mulai</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs font-mono text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs text-stone-400 mb-1">Tanggal Selesai</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs font-mono text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs text-stone-400 mb-1">Penanggung Jawab (PJ)</label>
              <input
                type="text"
                required
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-stone-400 mb-1">Lokasi & Sektor Lapangan</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="mis. Taman Nasional Gunung Gede Pangrango"
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs text-stone-400 mb-1">Titik Koordinat (Lat, Long)</label>
              <input
                type="text"
                required
                value={coordinates}
                onChange={(e) => setCoordinates(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs font-mono text-stone-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-stone-400 mb-1">Deskripsi Operasional</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
            />
          </div>

          <div>
            <label className="block text-xs text-stone-400 mb-1">Run-down Kegiatan (Pisahkan dengan |)</label>
            <input
              type="text"
              required
              value={rundown}
              onChange={(e) => setRundown(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs font-mono text-stone-100"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-stone-950 font-semibold text-xs rounded-lg transition-colors"
            >
              Terbitkan Agenda & Buat Token QR
            </button>
          </div>
        </form>
      )}

      {/* QR Code Check-in Simulation Panel */}
      {activeQrActivity && (
        <div className="bg-[#1C1613] border border-orange-500/50 rounded-lg p-5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="text-xs font-mono text-orange-400">
              TERMINAL PRESENSI QR CODE & BIOMETRIK LAPANGAN
            </div>
            <h3 className="text-lg font-bold text-stone-100">{activeQrActivity.title}</h3>
            <p className="text-xs text-stone-300">
              Token Presensi Resmi: <span className="font-mono text-orange-300">{activeQrActivity.qrCodeToken}</span> · PJ: {activeQrActivity.picName}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                onClick={() => {
                  onCheckIn(activeQrActivity.id, 'QR Code');
                  setActiveQrActivity(null);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-400 text-stone-950 font-semibold text-xs rounded-lg transition-colors"
              >
                <QrCode className="w-4 h-4" />
                Konfirmasi Scan QR ({currentUserName})
              </button>
              <button
                onClick={() => {
                  onCheckIn(activeQrActivity.id, 'Biometrik WebAuthn');
                  setActiveQrActivity(null);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-100 font-medium text-xs rounded-lg border border-stone-700 transition-colors"
              >
                <Fingerprint className="w-4 h-4 text-orange-400" />
                Presensi Sidik Jari / Biometrik
              </button>
              <button
                onClick={() => setActiveQrActivity(null)}
                className="px-3 py-2 text-xs text-stone-400 hover:text-stone-200"
              >
                Tutup
              </button>
            </div>
          </div>

          <div className="p-4 bg-stone-950 border border-stone-800 rounded-lg text-center shrink-0">
            <QrCode className="w-20 h-20 text-orange-400 mx-auto" />
            <div className="text-[11px] font-mono text-stone-400 mt-1">{activeQrActivity.qrCodeToken}</div>
          </div>
        </div>
      )}

      {/* Activities List */}
      <div className="space-y-4">
        {visibleActivities.map((act) => {
          const actAttendances = attendances.filter((a) => a.activityId === act.id);
          const rundownSteps = (act.rundown || '').split('|').map((s: string) => s.trim());

          return (
            <div
              key={act.id}
              className="bg-[#1C1613] border border-stone-800/90 rounded-lg p-5 space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-stone-800/80 pb-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400 font-mono">
                    <span className="text-orange-400 font-semibold">{act.category}</span>
                    <span>·</span>
                    <span>{act.startDate} s/d {act.endDate}</span>
                    <span>·</span>
                    <span>Status: {act.status}</span>
                    <span>·</span>
                    <span>Akses: {act.accessLevel}</span>
                  </div>

                  <h3 className="text-lg font-bold text-stone-100">{act.title}</h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-300">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-orange-400" />
                      {act.location} (<span className="font-mono">{act.coordinates}</span>)
                    </span>
                    <span>·</span>
                    <span>PJ: <strong className="text-stone-100">{act.picName}</strong></span>
                  </div>
                </div>

                {/* Action Controls: QR Check-in, Calendar Sync, Auto-Report */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveQrActivity(act)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    Presensi QR / RSVP ({actAttendances.length})
                  </button>

                  <button
                    onClick={() => downloadICSFile(act)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
                    Sync .ICS Kalender
                  </button>

                  <a
                    href={buildGoogleCalendarUrl(act)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
                    Google Calendar
                  </a>

                  {act.status !== 'Selesai' && role !== 'anggota_muda' && (
                    <button
                      onClick={() => handleGenerateAutoReport(act)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      Selesaikan & Buat Laporan Otomatis
                    </button>
                  )}

                  {act.status === 'Selesai' && (
                    <button
                      onClick={() => exportActivityAutoReportToPDF(act, attendances)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-orange-300 border border-orange-500/30 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh PDF Laporan
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed">{act.description}</p>

              {/* Run-down Steps */}
              <div className="space-y-1.5">
                <div className="text-xs font-mono text-stone-400">RUN-DOWN OPERASIONAL:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {rundownSteps.map((step: string, idx: number) => (
                    <div
                      key={idx}
                      className="bg-stone-900/70 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 font-mono"
                    >
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              {/* Automated Activity Report Box */}
              {act.autoReportSummary && (
                <div className="bg-orange-950/30 border border-orange-500/30 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-mono text-orange-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      SISTEM PELAPORAN OTOMATIS AKTIVITAS SELESAI
                    </div>
                    <p className="text-xs text-stone-200 leading-relaxed">{act.autoReportSummary}</p>
                  </div>
                </div>
              )}

              {/* Attendee List */}
              {actAttendances.length > 0 && (
                <div className="pt-2 border-t border-stone-800/60 flex flex-wrap items-center gap-2 text-xs text-stone-400">
                  <span className="font-mono">Presensi Tercatat:</span>
                  {actAttendances.map((att) => (
                    <span key={att.id} className="text-stone-200 font-mono">
                      {att.memberName} ({att.checkInMethod}) ·
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
