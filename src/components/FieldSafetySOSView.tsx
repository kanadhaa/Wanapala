import React, { useState } from 'react';
import {
  AlertOctagon,
  Radio,
  MapPin,
  ShieldAlert,
  CheckCircle2,
  Navigation,
  BatteryCharging,
} from 'lucide-react';

interface Props {
  role: 'admin' | 'anggota_aktif' | 'anggota_muda';
  currentUserName: string;
  sosSignals: any[];
  onTriggerSos: (payload: any) => Promise<void>;
  onUpdateSosStatus: (id: number, status: string, dispatchedTeam: string) => Promise<void>;
}

export const FieldSafetySOSView: React.FC<Props> = ({
  role,
  currentUserName,
  sosSignals,
  onTriggerSos,
  onUpdateSosStatus,
}) => {
  const [latitude, setLatitude] = useState('-7.1582');
  const [longitude, setLongitude] = useState('107.4059');
  const [altitude, setAltitude] = useState('2.340 mdpl');
  const [emergencyType, setEmergencyType] = useState('Hipotermia / Medis');
  const [message, setMessage] = useState('');
  const [locating, setLocating] = useState(false);
  const [sending, setSending] = useState(false);

  const handleGetGPS = () => {
    if (!('geolocation' in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(5));
        setLongitude(pos.coords.longitude.toFixed(5));
        if (pos.coords.altitude) {
          setAltitude(`${Math.round(pos.coords.altitude)} mdpl`);
        }
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleSendSOS = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await onTriggerSos({
        senderName: currentUserName,
        senderNia: 'WNP-2023-014',
        latitude,
        longitude,
        altitude,
        batteryLevel: '74%',
        emergencyType,
        message:
          message ||
          `Sinyal darurat lapangan dikirim oleh ${currentUserName} pada koordinat ${latitude}, ${longitude}. Mohon bantuan evakuasi segera.`,
      });
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-stone-800 pb-5">
        <p className="text-xs text-orange-400 font-mono mb-1">
          MANAJEMEN DARURAT LAPANGAN (FIELD-SAFETY) · KOMANDO SAR & DEWAN PENASEHAT ORGANISASI (DPO)
        </p>
        <h2 className="text-2xl font-bold text-stone-100 tracking-tight">
          Beacon Sinyal Darurat SOS & Pemantauan Koordinat Tim Lapangan
        </h2>
        <p className="text-xs text-stone-400 mt-1 max-w-3xl">
          Pancarkan titik koordinat GPS terkini beserta kondisi darurat langsung ke layar Pengurus Harian, Tim Siaga SAR Wanapala, dan DPO. Mendukung penyimpanan antrean offline apabila perangkat berada di area blank-spot.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-[#1C1613] border border-orange-500/40 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h3 className="text-sm font-bold text-orange-300 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-orange-500" />
              Transmiter Sinyal Darurat (SOS)
            </h3>
            <span className="text-[11px] font-mono text-orange-400">VHF 143.550 MHz</span>
          </div>

          <form onSubmit={handleSendSOS} className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-300">Koordinat GPS Saat Ini</span>
              <button
                type="button"
                onClick={handleGetGPS}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono bg-stone-800 hover:bg-stone-700 text-orange-400 rounded border border-stone-700 transition-colors"
              >
                <Navigation className="w-3 h-3" />
                {locating ? 'Mengunci Satelit...' : 'Ambil GPS Perangkat'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-stone-400 mb-1">Latitude</label>
                <input
                  type="text"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs font-mono text-stone-100"
                />
              </div>
              <div>
                <label className="block text-[11px] text-stone-400 mb-1">Longitude</label>
                <input
                  type="text"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs font-mono text-stone-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-stone-400 mb-1">Elevasi / Mdpl</label>
                <input
                  type="text"
                  required
                  value={altitude}
                  onChange={(e) => setAltitude(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs font-mono text-stone-100"
                />
              </div>
              <div>
                <label className="block text-[11px] text-stone-400 mb-1">Klasifikasi Insiden</label>
                <select
                  value={emergencyType}
                  onChange={(e) => setEmergencyType(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
                >
                  <option value="Hipotermia / Medis">Hipotermia / Medis</option>
                  <option value="Tersesat / Disorientasi">Tersesat / Disorientasi</option>
                  <option value="Cuaca Ekstrem / Longsor">Cuaca Ekstrem / Longsor</option>
                  <option value="Evakuasi Segera">Cedera Berat / Evakuasi</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-stone-400 mb-1">
                Laporan Situasi Lapangan & Kondisi Korban
              </label>
              <textarea
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Sebutkan jumlah personel, kondisi medis korban, dan ciri lokasi..."
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              {sending ? 'MEMANCARKAN SINYAL DARURAT...' : 'KIRIM SINYAL DARURAT SOS KE POSKO & DPO'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-stone-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              Monitor Sinyal SOS & Operasi Penyelamatan (SAR)
            </h3>
            <span className="text-xs font-mono text-stone-400">
              Total Log Darurat: {sosSignals.length}
            </span>
          </div>

          <div className="space-y-4">
            {sosSignals.map((sig) => (
              <div
                key={sig.id}
                className={`bg-[#1C1613] border rounded-lg p-5 space-y-3 ${
                  sig.status.includes('TERTANGANI')
                    ? 'border-stone-800'
                    : 'border-orange-500/60'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        sig.status.includes('TERTANGANI')
                          ? 'text-emerald-400 font-semibold'
                          : 'text-orange-400 font-bold'
                      }
                    >
                      [{sig.status}]
                    </span>
                    <span className="text-stone-500">·</span>
                    <span className="text-amber-300">{sig.emergencyType}</span>
                  </div>

                  <span className="flex items-center gap-1 text-stone-400">
                    <BatteryCharging className="w-3.5 h-3.5 text-orange-400" />
                    Baterai Perangkat: {sig.batteryLevel}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-base font-bold text-stone-100">
                    Pengirim: {sig.senderName} ({sig.senderNia})
                  </h4>
                  <span className="text-xs font-mono text-orange-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    Koordinat: {sig.latitude}, {sig.longitude} ({sig.altitude})
                  </span>
                </div>

                <p className="text-xs text-stone-200 leading-relaxed bg-stone-900/70 border border-stone-800 rounded p-3">
                  {sig.message}
                </p>

                <div className="pt-2 border-t border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-stone-400">
                    Unit Respon SAR / DPO:{' '}
                    <strong className="text-stone-200 font-mono">{sig.dispatchedTeam}</strong>
                  </div>

                  {role === 'admin' && (
                    <div className="flex flex-wrap items-center gap-2">
                      {sig.status !== 'TIM RESPON DIKERAHKAN' && !sig.status.includes('TERTANGANI') && (
                        <button
                          onClick={() =>
                            onUpdateSosStatus(
                              sig.id,
                              'TIM RESPON DIKERAHKAN',
                              `Tim SAR Wanapala & DPO (Dikerahkan oleh ${currentUserName})`
                            )
                          }
                          className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg transition-colors"
                        >
                          Kerahkan Tim Respon SAR
                        </button>
                      )}
                      {!sig.status.includes('TERTANGANI') && (
                        <button
                          onClick={() =>
                            onUpdateSosStatus(
                              sig.id,
                              'TERTANGANI / AMAN',
                              `Evakuasi Selesai — Diverifikasi ${currentUserName}`
                            )
                          }
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-400 text-stone-950 rounded-lg transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Tandai Evakuasi Selesai
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
