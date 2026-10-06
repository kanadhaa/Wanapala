import React, { useState } from 'react';
import {
  Package,
  Compass,
  Plus,
  RotateCcw,
  Fingerprint,
  PhoneCall,
  HeartPulse,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  role: 'admin' | 'anggota_aktif' | 'anggota_muda';
  currentUserName: string;
  equipment: any[];
  loans: any[];
  users: any[];
  expeditionLogs: any[];
  onCreateLoan: (payload: any) => Promise<void>;
  onReturnLoan: (loanId: number) => Promise<void>;
  onCreateExpeditionLog: (payload: any) => Promise<void>;
  onRegisterBiometric: (userId: number) => Promise<void>;
}

export const LogisticsAndLogbookView: React.FC<Props> = ({
  role,
  currentUserName,
  equipment,
  loans,
  users,
  expeditionLogs,
  onCreateLoan,
  onReturnLoan,
  onCreateExpeditionLog,
  onRegisterBiometric,
}) => {
  const [subTab, setSubTab] = useState<'inventory' | 'members_logbook'>('inventory');
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);

  const [selectedEqId, setSelectedEqId] = useState<number>(equipment[0]?.id || 1);
  const [borrowerName, setBorrowerName] = useState(currentUserName);
  const [borrowerType, setBorrowerType] = useState('Internal Anggota');
  const [quantity, setQuantity] = useState('1');
  const [purpose, setPurpose] = useState('Latihan Pemantapan Teknis Divisi');
  const [borrowDate, setBorrowDate] = useState('2026-10-18');
  const [returnDate, setReturnDate] = useState('2026-10-22');

  const [expeditionTitle, setExpeditionTitle] = useState('');
  const [discipline, setDiscipline] = useState('Pendakian Gunung');
  const [locationName, setLocationName] = useState('');
  const [elevationOrDepth, setElevationOrDepth] = useState('3.142 mdpl');
  const [dateExecuted, setDateExecuted] = useState('2026-10-10');
  const [durationDays, setDurationDays] = useState('3');
  const [weatherCondition] = useState('Cerah Berawan, Angin Lembah');
  const [routeNotes, setRouteNotes] = useState('');

  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eqObj = equipment.find((x) => x.id === Number(selectedEqId));
    await onCreateLoan({
      equipmentId: Number(selectedEqId),
      equipmentName: eqObj ? eqObj.name : 'Alat Operasional',
      borrowerName,
      borrowerType,
      quantity: Number(quantity),
      purpose,
      borrowDate,
      returnDate,
    });
    setShowLoanForm(false);
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateExpeditionLog({
      memberName: currentUserName,
      memberNia: 'WNP-2023-014',
      expeditionTitle,
      discipline,
      locationName,
      elevationOrDepth,
      dateExecuted,
      durationDays: Number(durationDays),
      weatherCondition,
      routeNotes,
      teamLeader: currentUserName,
    });
    setShowLogForm(false);
    setExpeditionTitle('');
    setLocationName('');
    setRouteNotes('');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div>
          <p className="text-xs text-orange-400 font-mono mb-1">
            INVENTARIS ALAT & LOGISTIK · DATABASE ANGGOTA · LOGBOOK EKSPEDISI
          </p>
          <h2 className="text-2xl font-bold text-stone-100 tracking-tight">
            Manajemen Logistik Peralatan & Logbook Ekspedisi Anggota
          </h2>
        </div>

        <div className="flex items-center gap-1 p-1 bg-stone-900 border border-stone-800 rounded-lg w-fit">
          <button
            onClick={() => setSubTab('inventory')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              subTab === 'inventory'
                ? 'bg-orange-500 text-stone-950 font-semibold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            1. Katalog Alat & Peminjaman ({equipment.length})
          </button>
          <button
            onClick={() => setSubTab('members_logbook')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              subTab === 'members_logbook'
                ? 'bg-orange-500 text-stone-950 font-semibold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            2. Database Anggota & Logbook ({expeditionLogs.length})
          </button>
        </div>
      </div>

      {subTab === 'inventory' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-stone-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-400" />
              Katalog Inventaris Alat Organisasi (Kondisi Baik / Rusak)
            </h3>
            {role !== 'anggota_muda' && (
              <button
                onClick={() => setShowLoanForm(!showLoanForm)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-400 text-stone-950 font-semibold text-xs rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Form Peminjaman Alat (Internal/Eksternal)
              </button>
            )}
          </div>

          {showLoanForm && (
            <form
              onSubmit={handleLoanSubmit}
              className="bg-[#1C1613] border border-orange-500/40 rounded-lg p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <h4 className="text-sm font-semibold text-stone-100">
                  Formulir Peminjaman Peralatan Operasional
                </h4>
                <button
                  type="button"
                  onClick={() => setShowLoanForm(false)}
                  className="text-xs text-stone-400 hover:text-stone-200"
                >
                  Tutup
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Pilih Alat Inventaris</label>
                  <select
                    value={selectedEqId}
                    onChange={(e) => setSelectedEqId(Number(e.target.value))}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
                  >
                    {equipment.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        [{eq.itemCode}] {eq.name} (Tersedia: {eq.availableQty})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-stone-400 mb-1">Nama Peminjam / Instansi</label>
                  <input
                    type="text"
                    required
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs text-stone-400 mb-1">Status Peminjam</label>
                  <select
                    value={borrowerType}
                    onChange={(e) => setBorrowerType(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
                  >
                    <option value="Internal Anggota">Internal Anggota Wanapala</option>
                    <option value="Eksternal Mapala">Eksternal Mapala / UKM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-stone-400 mb-1">Jumlah Unit</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs font-mono text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs text-stone-400 mb-1">Tanggal Pinjam</label>
                  <input
                    type="date"
                    required
                    value={borrowDate}
                    onChange={(e) => setBorrowDate(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs font-mono text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs text-stone-400 mb-1">Batas Tanggal Kembali</label>
                  <input
                    type="date"
                    required
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs font-mono text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-stone-400 mb-1">Keperluan Kegiatan</label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-stone-950 font-semibold text-xs rounded-lg transition-colors"
                >
                  Catat Peminjaman & Kurangi Stok Gudang
                </button>
              </div>
            </form>
          )}

          <div className="bg-[#1C1613] border border-stone-800/90 rounded-lg overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-800 bg-stone-900/60 text-stone-400 font-mono">
                  <th className="py-3 px-4">Kode Alat</th>
                  <th className="py-3 px-4">Nama Peralatan Teknis</th>
                  <th className="py-3 px-4">Kategori · Rak Gudang</th>
                  <th className="py-3 px-4 text-right">Total Unit</th>
                  <th className="py-3 px-4 text-right">Siap Pakai</th>
                  <th className="py-3 px-4 text-right">Kondisi Baik</th>
                  <th className="py-3 px-4 text-right">Kondisi Rusak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/70">
                {equipment.map((eq) => (
                  <tr key={eq.id} className="hover:bg-stone-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-orange-400 font-semibold">{eq.itemCode}</td>
                    <td className="py-3 px-4 font-medium text-stone-100">{eq.name}</td>
                    <td className="py-3 px-4 text-stone-300">
                      {eq.category} · <span className="text-stone-400 font-mono">{eq.storageRack}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-stone-200">{eq.totalQty}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-orange-400">
                      {eq.availableQty}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-stone-200">
                      {eq.conditionGood}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {eq.conditionDamaged > 0 ? (
                        <span className="text-amber-400 font-semibold">{eq.conditionDamaged} Aus/Rusak</span>
                      ) : (
                        <span className="text-stone-500">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-stone-100">
              Riwayat Peminjaman Alat Internal & Eksternal
            </h4>
            <div className="bg-[#1C1613] border border-stone-800/90 rounded-lg overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-800 bg-stone-900/60 text-stone-400 font-mono">
                    <th className="py-3 px-4">Peralatan</th>
                    <th className="py-3 px-4">Peminjam · Jenis</th>
                    <th className="py-3 px-4">Keperluan</th>
                    <th className="py-3 px-4 text-right">Qty</th>
                    <th className="py-3 px-4">Tgl Pinjam s/d Kembali</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi Gudang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/70">
                  {loans.map((ln) => (
                    <tr key={ln.id} className="hover:bg-stone-900/40">
                      <td className="py-3 px-4 font-medium text-stone-100">{ln.equipmentName}</td>
                      <td className="py-3 px-4 text-stone-300">
                        {ln.borrowerName} · <span className="text-stone-400 font-mono">{ln.borrowerType}</span>
                      </td>
                      <td className="py-3 px-4 text-stone-300">{ln.purpose}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-orange-400 font-semibold">
                        {ln.quantity}
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-300">
                        {ln.borrowDate} → {ln.returnDate}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono font-semibold ${
                            ln.status === 'Dipinjam' ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {ln.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {ln.status === 'Dipinjam' && role !== 'anggota_muda' ? (
                          <button
                            onClick={() => onReturnLoan(ln.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 rounded transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Kembalikan Alat
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono text-stone-500">Selesai</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-stone-100">
                Database Profil Anggota, Golongan Darah, Kontak Darurat & Otentikasi Biometrik
              </h3>
              <span className="text-xs font-mono text-stone-400">
                WebAuthn Passkey / Biometric Ready
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="bg-[#1C1613] border border-stone-800/90 rounded-lg p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-orange-400 font-semibold">{u.nia}</span>
                      <span className="text-stone-400">{u.role.toUpperCase()}</span>
                    </div>
                    <h4 className="text-base font-bold text-stone-100">{u.fullName}</h4>
                    <div className="text-xs text-stone-300">
                      Divisi: <strong className="text-stone-100">{u.division}</strong> · {u.batchName}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-800/70 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-stone-300">
                      <span className="flex items-center gap-1 text-stone-400">
                        <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                        Golongan Darah:
                      </span>
                      <span className="font-mono font-bold text-rose-400">{u.bloodType}</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-300">
                      <span className="flex items-center gap-1 text-stone-400">
                        <PhoneCall className="w-3.5 h-3.5 text-orange-400" />
                        Kontak Darurat:
                      </span>
                      <span className="font-mono text-stone-200">{u.emergencyContactPhone}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-800/70 flex items-center justify-between">
                    {u.biometricRegistered ? (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Biometrik Aktif
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Belum Terdaftar
                      </span>
                    )}

                    {!u.biometricRegistered && (
                      <button
                        onClick={() => onRegisterBiometric(u.id)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded transition-colors"
                      >
                        <Fingerprint className="w-3 h-3 text-orange-400" />
                        Daftarkan Biometrik
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-stone-100 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-orange-400" />
                  Logbook Digital Riwayat Ekspedisi & Jam Terbang Lapangan
                </h3>
                <p className="text-xs text-stone-400">
                  Catatan resmi pendakian gunung, penelusuran gua (caving), panjat tebing, dan pengarungan sungai.
                </p>
              </div>
              <button
                onClick={() => setShowLogForm(!showLogForm)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-400 text-stone-950 font-semibold text-xs rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Catat Logbook Ekspedisi Baru
              </button>
            </div>

            {showLogForm && (
              <form
                onSubmit={handleLogSubmit}
                className="bg-[#1C1613] border border-orange-500/40 rounded-lg p-5 space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Judul Perjalanan / Ekspedisi</label>
                    <input
                      type="text"
                      required
                      value={expeditionTitle}
                      onChange={(e) => setExpeditionTitle(e.target.value)}
                      placeholder="mis. Pendakian Gunung Rinjani via Sembalun"
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Disiplin / Divisi</label>
                    <select
                      value={discipline}
                      onChange={(e) => setDiscipline(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
                    >
                      <option value="Pendakian Gunung">Pendakian Gunung (Mountaineering)</option>
                      <option value="Susur Gua (Caving)">Susur Gua (Caving)</option>
                      <option value="Panjat Tebing">Panjat Tebing (Rock Climbing)</option>
                      <option value="Arung Jeram (Rafting)">Arung Jeram (Rafting)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Lokasi / Kawasan</label>
                    <input
                      type="text"
                      required
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="mis. TN Gunung Rinjani, NTB"
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Elevasi / Kedalaman / Grade</label>
                    <input
                      type="text"
                      required
                      value={elevationOrDepth}
                      onChange={(e) => setElevationOrDepth(e.target.value)}
                      placeholder="mis. 3.726 mdpl atau -110m"
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs font-mono text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Tanggal Pelaksanaan</label>
                    <input
                      type="date"
                      required
                      value={dateExecuted}
                      onChange={(e) => setDateExecuted(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs font-mono text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Durasi (Hari)</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={durationDays}
                      onChange={(e) => setDurationDays(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs font-mono text-stone-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-stone-400 mb-1">Catatan Jalur, Sumber Air & Evaluasi Teknis</label>
                  <textarea
                    rows={3}
                    required
                    value={routeNotes}
                    onChange={(e) => setRouteNotes(e.target.value)}
                    placeholder="Catat kondisi jalur, titik bivak, sumber air, atau pemasangan anchor..."
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-stone-950 font-semibold text-xs rounded-lg transition-colors"
                  >
                    Simpan ke Logbook Anggota
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {expeditionLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-[#1C1613] border border-stone-800/90 rounded-lg p-5 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs font-mono text-stone-400">
                    <span className="text-orange-400 font-semibold">{log.discipline}</span>
                    <span>
                      {log.dateExecuted} · {log.durationDays} Hari · {log.elevationOrDepth}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-stone-100">{log.expeditionTitle}</h4>

                  <div className="text-xs text-stone-300">
                    Personel: <strong className="text-stone-100">{log.memberName}</strong> ({log.memberNia}) · Lokasi: {log.locationName}
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed bg-stone-900/60 border border-stone-800 rounded p-3">
                    {log.routeNotes}
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 pt-1">
                    <span>Cuaca: {log.weatherCondition}</span>
                    <span className="text-orange-400">{log.verifiedStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
