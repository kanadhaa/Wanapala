import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// 1. Users / Anggota Organisasi (RBAC + Profil Lapangan)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  fullName: text('full_name').notNull(),
  nia: text('nia').notNull().default('WNP-2026-000'), // Nomor Induk Anggota
  role: text('role').notNull().default('anggota_aktif'), // 'admin', 'anggota_aktif', 'anggota_muda'
  division: text('division').notNull().default('Gunung Hutan'), // 'Gunung Hutan', 'Caving', 'Rock Climbing', 'Rafting', 'Konservasi'
  batchName: text('batch_name').notNull().default('Angkatan XXXII - Kabut Rimba'),
  bloodType: text('blood_type').notNull().default('O+'),
  emergencyContactName: text('emergency_contact_name').notNull().default('Keluarga / Wali'),
  emergencyContactPhone: text('emergency_contact_phone').notNull().default('+62 812-0000-0000'),
  biometricRegistered: boolean('biometric_registered').notNull().default(false),
  biometricCredentialId: text('biometric_credential_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Laporan Keuangan Kas & Iuran Anggota
export const financeTransactions = pgTable('finance_transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  memberName: text('member_name').notNull(),
  type: text('type').notNull(), // 'pemasukan' | 'pengeluaran'
  category: text('category').notNull(), // 'Kas Bulanan', 'Dana Usaha', 'Logistik Ekspedisi', 'Perawatan Alat', 'Sponsorship'
  amount: integer('amount').notNull(), // Dalam Rupiah (IDR)
  monthPeriod: text('month_period').notNull().default('Oktober 2026'),
  paymentStatus: text('payment_status').notNull().default('Lunas'), // 'Lunas' | 'Menunggak' | 'Terverifikasi'
  receiptUrl: text('receipt_url').notNull().default(''),
  description: text('description').notNull(),
  verifiedBy: text('verified_by').notNull().default('Bendahara Umum'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Timeline Kegiatan & Operasional Lapangan
export const activities = pgTable('activities', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(), // 'Rapat', 'Diksar', 'Ekspedisi', 'Pemeliharaan Alat'
  startDate: text('start_date').notNull(), // YYYY-MM-DD
  endDate: text('end_date').notNull(),
  location: text('location').notNull(),
  coordinates: text('coordinates').notNull().default('-7.1568, 107.4021'),
  picName: text('pic_name').notNull(), // Penanggung Jawab (PJ)
  description: text('description').notNull(),
  rundown: text('rundown').notNull(), // JSON atau teks terstruktur
  status: text('status').notNull().default('Terjadwal'), // 'Terjadwal', 'Berlangsung', 'Selesai'
  accessLevel: text('access_level').notNull().default('Semua'), // 'Semua' | 'Anggota Aktif'
  qrCodeToken: text('qr_code_token').notNull(),
  autoReportSummary: text('auto_report_summary'), // Diisi otomatis saat status = Selesai
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. Presensi / Absensi & RSVP Kegiatan
export const activityAttendances = pgTable('activity_attendances', {
  id: serial('id').primaryKey(),
  activityId: integer('activity_id').references(() => activities.id).notNull(),
  userId: integer('user_id').references(() => users.id),
  memberName: text('member_name').notNull(),
  rsvpStatus: text('rsvp_status').notNull().default('Hadir'), // 'Hadir', 'Izin', 'Menunggu'
  checkInMethod: text('check_in_method').notNull().default('QR Code'), // 'QR Code' | 'RSVP Manual' | 'Biometrik'
  checkInTime: timestamp('check_in_time').defaultNow(),
});

// 5. Sistem Jarkom (Jaringan Komunikasi / Broadcast Pengumuman)
export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(), // 'Darurat', 'Info Kegiatan', 'Tagihan Kas', 'Update Tugas'
  content: text('content').notNull(),
  senderName: text('sender_name').notNull(),
  senderRole: text('sender_role').notNull(),
  targetAudience: text('target_audience').notNull().default('Seluruh Anggota'),
  readByList: text('read_by_list').notNull().default('[]'), // JSON array nama/uid yang sudah baca
  createdAt: timestamp('created_at').defaultNow(),
});

// 6. SOP Administrasi & Digital Vault
export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  docType: text('doc_type').notNull(), // 'SOP Lapangan' | 'Template Surat'
  category: text('category').notNull(), // 'SOP Pendakian', 'SOP Caving', 'SOP Climbing', 'SOP Rafting', 'SOP P3K', 'Administrasi'
  codeNumber: text('code_number').notNull(),
  version: text('version').notNull().default('Rev. 2026.2'),
  accessMinimumRole: text('access_minimum_role').notNull().default('anggota_muda'),
  contentSummary: text('content_summary').notNull(),
  checklistItems: text('checklist_items').notNull(), // JSON string poin penting prosedur
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 7. Manajemen Inventaris Alat & Logistik
export const equipment = pgTable('equipment', {
  id: serial('id').primaryKey(),
  itemCode: text('item_code').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(), // 'Shelter', 'Pack', 'Vertical Gear', 'Water Sport', 'Navigasi & Medis'
  totalQty: integer('total_qty').notNull(),
  availableQty: integer('available_qty').notNull(),
  conditionGood: integer('condition_good').notNull(),
  conditionDamaged: integer('condition_damaged').notNull(),
  storageRack: text('storage_rack').notNull().default('Gudang Sekre Rak A-1'),
  lastInspectDate: text('last_inspect_date').notNull().default('2026-10-01'),
});

// 8. Peminjaman Alat (Internal / Eksternal)
export const equipmentLoans = pgTable('equipment_loans', {
  id: serial('id').primaryKey(),
  equipmentId: integer('equipment_id').references(() => equipment.id).notNull(),
  equipmentName: text('equipment_name').notNull(),
  borrowerName: text('borrower_name').notNull(),
  borrowerType: text('borrower_type').notNull().default('Internal Anggota'), // 'Internal Anggota' | 'Eksternal Mapala'
  quantity: integer('quantity').notNull(),
  purpose: text('purpose').notNull(),
  borrowDate: text('borrow_date').notNull(),
  returnDate: text('return_date').notNull(),
  status: text('status').notNull().default('Dipinjam'), // 'Dipinjam' | 'Dikembalikan'
  createdAt: timestamp('created_at').defaultNow(),
});

// 9. Logbook Ekspedisi Anggota
export const expeditionLogs = pgTable('expedition_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  memberName: text('member_name').notNull(),
  memberNia: text('member_nia').notNull(),
  expeditionTitle: text('expedition_title').notNull(),
  discipline: text('discipline').notNull(), // 'Pendakian Gunung', 'Susur Gua (Caving)', 'Panjat Tebing', 'Arung Jeram (Rafting)'
  locationName: text('location_name').notNull(),
  elevationOrDepth: text('elevation_or_depth').notNull(), // e.g., '3.428 mdpl' atau '-120m vertikal'
  dateExecuted: text('date_executed').notNull(),
  durationDays: integer('duration_days').notNull().default(3),
  weatherCondition: text('weather_condition').notNull().default('Cerah Berawan, Kabut Sore'),
  routeNotes: text('route_notes').notNull(),
  teamLeader: text('team_leader').notNull(),
  verifiedStatus: text('verified_status').notNull().default('Terverifikasi Diklat'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 10. Sinyal Darurat SOS & Manajemen Field-Safety
export const sosSignals = pgTable('sos_signals', {
  id: serial('id').primaryKey(),
  senderName: text('sender_name').notNull(),
  senderNia: text('sender_nia').notNull(),
  latitude: text('latitude').notNull(),
  longitude: text('longitude').notNull(),
  altitude: text('altitude').notNull().default('2.840 mdpl'),
  batteryLevel: text('battery_level').notNull().default('64%'),
  emergencyType: text('emergency_type').notNull(), // 'Hipotermia / Medis', 'Tersesat / Disorientasi', 'Cuaca Ekstrem / Longsor', 'Evakuasi Segera'
  message: text('message').notNull(),
  status: text('status').notNull().default('AKTIF - SIAGA SAR'), // 'AKTIF - SIAGA SAR' | 'TIM RESPON DIKERAHKAN' | 'TERTANGANI / AMAN'
  dispatchedTeam: text('dispatched_team').notNull().default('Tim Siaga SAR Wanapala & DPO'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(financeTransactions),
  attendances: many(activityAttendances),
  expeditionLogs: many(expeditionLogs),
}));

export const activitiesRelations = relations(activities, ({ many }) => ({
  attendances: many(activityAttendances),
}));

export const activityAttendancesRelations = relations(activityAttendances, ({ one }) => ({
  activity: one(activities, {
    fields: [activityAttendances.activityId],
    references: [activities.id],
  }),
  user: one(users, {
    fields: [activityAttendances.userId],
    references: [users.id],
  }),
}));
