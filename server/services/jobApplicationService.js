import prisma from "../db/prisma.js";

// --- Konversi tipe ---------------------------------------------------------
// Mongoose meng-cast string jadi Date/Boolean sendiri; Prisma tidak, sementara
// form React (multipart) mengirim semuanya sebagai string.
const DATE_FIELDS = [
  "tanggal_lahir", "masa_berlaku_sim", "masa_berlaku_stnk",
  "masa_berlaku_pajak_kendaraan", "tanggal_bergabung",
  "tanggal_berakhir_kontrak", "deleted_from_employee_list_at"
];
const BOOL_FIELDS = ["status_kerja", "hidden_from_employee_list"];

// Field yang boleh datang dari req.body. Dulu applicationData/updateData
// diteruskan mentah; Prisma menolak field tak dikenal, jadi daftar ini wajib.
const APPLICATION_FIELDS = [
  "candidateId", "jobPostingId", "status",
  "nama_ktp", "jenis_kelamin", "nik", "agama", "pendidikan_terakhir",
  "email", "no_hp", "no_hp_darurat", "pemilik_no_hp_darurat",
  "hubungan_dgn_pemilik_no_hp_darurat",
  "kota", "kecamatan", "kelurahan", "alamat",
  "no_sim", "tipe_sim", "merk_kendaraan", "tahun_produksi_kendaraan",
  "no_pol_kendaraan", "no_stnk",
  "no_rekening", "nama_pemilik_rekening", "nama_bank",
  "posisi_dilamar", "lama_pengalaman_kerja", "ekspektasi_lama_bekerja",
  "divisi", "lokasi_penempatan", "deleted_from_employee_list_by",
  "foto_diri", "foto_ktp", "foto_sim", "foto_stnk_hal_1", "foto_stnk_hal_2",
  "foto_ijazah", "notes",
  ...DATE_FIELDS, ...BOOL_FIELDS
];

const isBlank = (v) => v === undefined || v === null || v === "" || v === "null";

const buildPayload = (source) => {
  const data = {};
  for (const field of APPLICATION_FIELDS) {
    if (source[field] === undefined) continue;

    if (DATE_FIELDS.includes(field)) {
      // Form mengirim "null"/"" untuk tanggal kosong.
      data[field] = isBlank(source[field]) ? null : new Date(source[field]);
    } else if (BOOL_FIELDS.includes(field)) {
      data[field] = source[field] === true || source[field] === "true";
    } else {
      data[field] = source[field];
    }
  }

  // tipe_sim wajib punya nilai enum yang valid
  if (isBlank(data.tipe_sim)) {
    data.tipe_sim = "Tidak Punya";
  }
  return data;
};

// Bentuk jobPostingId yang dikirim ke client. Dulu dibuat manual lewat query
// terpisah per aplikasi (N+1); sekarang ikut lewat relasi.
// Catatan: field `salary` disebut di kode lama tapi tidak pernah ada di schema
// JobPosting, jadi selalu undefined dan hilang saat JSON.stringify — tidak
// diikutkan di sini, payload-nya tetap sama.
const JOB_POSTING_SELECT = {
  title: true, jobPosition: true, location: true, deadline: true
};

const shapeJobPosting = (jobPosting) => jobPosting && {
  title: jobPosting.title,
  companyName: jobPosting.title, // Assuming company name is in title
  jobPosition: jobPosting.jobPosition,
  location: jobPosting.location,
  deadline: jobPosting.deadline
};

// Mengganti field relasi `jobPosting` jadi `jobPostingId` berbentuk objek,
// persis seperti yang dulu dirakit manual.
const withJobPosting = (application) => {
  if (!application) return application;
  const { jobPosting, ...rest } = application;
  return jobPosting
    ? { ...rest, jobPostingId: shapeJobPosting(jobPosting) }
    : rest;
};

/**
 * Submit a new job application
 */
export const submitApplication = async (applicationData) => {
  const data = buildPayload(applicationData);

  // Hook pre('save') Mongoose dulu membuat entri statusHistory awal secara
  // otomatis. Hook itu tidak ada lagi, jadi dibuat eksplisit di sini.
  return prisma.jobApplication.create({
    data: {
      ...data,
      statusHistory: {
        create: {
          status: data.status || "PENDING",
          notes: "Dokumen lamaran terkirim, menunggu verifikasi"
        }
      }
    }
  });
};

/**
 * Get job applications for a candidate
 */
export const getCandidateApplications = async (candidateId) => {
  // Dulu: 1 query aplikasi + 1 query JobPosting per aplikasi (N+1).
  const applications = await prisma.jobApplication.findMany({
    where: { candidateId },
    orderBy: { submissionDate: "desc" },
    include: { jobPosting: { select: JOB_POSTING_SELECT } }
  });

  return applications.map(withJobPosting);
};

/**
 * Get a job application by ID
 */
export const getApplicationById = async (uuid) => {
  const application = await prisma.jobApplication.findUnique({
    where: { uuid },
    include: {
      jobPosting: { select: JOB_POSTING_SELECT },
      statusHistory: { orderBy: { timestamp: "asc" } }
    }
  });

  return withJobPosting(application);
};

/**
 * Update a job application
 */
export const updateApplication = async (uuid, updateData) => {
  const currentApplication = await prisma.jobApplication.findUnique({ where: { uuid } });
  if (!currentApplication) {
    return null;
  }

  const data = buildPayload(updateData);

  // Determine if status is changing
  const isStatusChanging = data.status && data.status !== currentApplication.status;
  if (isStatusChanging) {
    data.statusHistory = {
      create: {
        status: data.status,
        notes: updateData.notes || "",
        updatedBy: updateData.updatedBy
      }
    };
  }

  const updatedApplication = await prisma.jobApplication.update({
    where: { uuid },
    data,
    include: { jobPosting: { select: JOB_POSTING_SELECT } }
  });

  // If status is ACCEPTED or ON_JOB, update the user's employment status
  if (data.status === "ACCEPTED" || data.status === "ON_JOB") {
    await prisma.user.update({
      where: { uuid: updatedApplication.candidateId },
      data: { employmentStatus: "ON_JOB" }
    });
  }

  return withJobPosting(updatedApplication);
};

// Helper function to map UI stage filter to backend statuses
const getStatusesForStage = (stage) => {
  switch (stage) {
    case 'Administrasi':
      return ['PENDING', 'REVIEWING', 'REVISION'];
    case 'Wawancara':
      return ['INTERVIEW_SCHEDULED'];
    case 'Technical Test':
      return ['TECHNICAL_TEST'];
    case 'Diterima':
      return ['ACCEPTED', 'ON_JOB'];
    case 'Ditolak':
      return ['REJECTED'];
    default:
      return null; // No specific statuses for 'all' or invalid stage
  }
};

/**
 * Get all job applications (for recruiters) with filtering and pagination.
 *
 * Dulu ini satu pipeline $facet dengan dua $lookup + $unwind, plus cache
 * buatan tangan di global.queryCache (LRU manual + setTimeout 30 detik). Cache
 * itu tidak pernah di-invalidasi saat ada perubahan status, jadi recruiter bisa
 * melihat data basi hingga 30 detik setelah mengubah kandidat. Di Postgres
 * filter+join+count ini adalah query biasa yang memakai index, jadi cache-nya
 * dibuang, bukan diporting.
 */
export const getAllApplications = async (filters = {}, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const { searchTerm, stageFilter, statusFilter, positionFilter } = filters;

  const where = {
    // Filter out soft deleted employees from employee list
    hidden_from_employee_list: false
  };

  // Status/Stage filters
  if (statusFilter && statusFilter !== 'all') {
    where.status = statusFilter;
  }
  if (stageFilter && stageFilter !== 'all') {
    const statuses = getStatusesForStage(stageFilter);
    if (statuses) {
      if (where.status && !statuses.includes(where.status)) {
        // Kombinasi status+stage yang mustahil -> hasil kosong.
        where.status = { in: [] };
      } else if (!where.status) {
        where.status = { in: statuses };
      }
    }
  }

  // Position filter
  if (positionFilter && positionFilter !== 'all') {
    where.posisi_dilamar = positionFilter;
  }

  // Search term: dulu dipecah jadi pre-lookup dan post-lookup $match karena
  // sebagian field ada di koleksi lain. Dengan JOIN semuanya jadi satu OR.
  if (searchTerm) {
    const contains = { contains: searchTerm, mode: 'insensitive' };
    where.OR = [
      { nama_ktp: contains },
      { candidate: { name: contains } },
      { candidate: { email: contains } }
    ];
    if (!where.posisi_dilamar) {
      where.OR.push({ posisi_dilamar: contains });
      where.OR.push({ jobPosting: { jobPosition: contains } });
    }
  }

  const [rows, totalCount] = await Promise.all([
    prisma.jobApplication.findMany({
      where,
      orderBy: { submissionDate: 'desc' },
      skip,
      take: limit,
      select: {
        uuid: true, candidateId: true, submissionDate: true, status: true,
        notes: true, nama_ktp: true, jenis_kelamin: true,
        email: true, no_hp: true, posisi_dilamar: true,
        statusHistory: { orderBy: { timestamp: 'asc' } },
        candidate: { select: { name: true, email: true } },
        jobPosting: { select: { title: true, jobPosition: true } }
      }
    }),
    prisma.jobApplication.count({ where })
  ]);

  // Bentuk ulang agar identik dengan $project pipeline lama.
  const applications = rows.map(({ candidate, jobPosting, ...rest }) => ({
    ...rest,
    candidateInfo: candidate || undefined,
    jobPostingId: jobPosting
      ? { jobPosition: jobPosting.jobPosition, title: jobPosting.title }
      : undefined
  }));

  return { applications, totalCount };
};

/**
 * Get total counts for each main application stage.
 */
export const getApplicationStageStats = async () => {
  const grouped = await prisma.jobApplication.groupBy({
    by: ['status'],
    _count: { _all: true }
  });

  const counts = {
    PENDING: 0, REVIEWING: 0, REVISION: 0,
    INTERVIEW_SCHEDULED: 0, TECHNICAL_TEST: 0,
    ACCEPTED: 0, ON_JOB: 0, REJECTED: 0
  };

  grouped.forEach(item => {
    if (Object.prototype.hasOwnProperty.call(counts, item.status)) {
      counts[item.status] = item._count._all;
    }
  });

  // Gabungkan hitungan berdasarkan tahapan UI
  return {
    pending: counts.PENDING + counts.REVIEWING + counts.REVISION,
    interview: counts.INTERVIEW_SCHEDULED,
    technicalTest: counts.TECHNICAL_TEST,
    accepted: counts.ACCEPTED + counts.ON_JOB,
    rejected: counts.REJECTED
  };
};

// Awal rentang waktu untuk filter periode.
const startOfPeriod = (period, offsets) => {
  const today = new Date();
  const startDate = new Date(today);
  if (period === 'week') startDate.setDate(today.getDate() - offsets.week);
  else if (period === 'month') startDate.setMonth(today.getMonth() - offsets.month);
  else if (period === 'year') startDate.setFullYear(today.getFullYear() - offsets.year);
  return startDate;
};

/**
 * Get application counts grouped by status, optionally filtered by time period.
 */
export const getApplicationStatusDistribution = async (period = 'all') => {
  const where = {};
  if (period !== 'all') {
    where.submissionDate = { gte: startOfPeriod(period, { week: 7, month: 1, year: 1 }) };
  }

  const grouped = await prisma.jobApplication.groupBy({
    by: ['status'],
    where,
    _count: { _all: true }
  });

  const distribution = {};
  grouped.forEach(item => {
    distribution[item.status] = item._count._all;
  });

  return distribution;
};

/**
 * Get application counts grouped by time unit (day, week, month).
 *
 * Dulu memakai $dateToString dengan timezone "+07:00". Padanannya di Postgres
 * adalah to_char() atas timestamp yang sudah digeser ke Asia/Jakarta. Format
 * string dipilih dari konstanta di bawah — tidak pernah dari input user —
 * sehingga tidak bisa jadi jalur SQL injection.
 */
export const getApplicationTrends = async (period = 'week') => {
  const startDate = startOfPeriod(period, { week: 28, month: 6, year: 2 });

  let rows;
  if (period === 'month') {
    rows = await prisma.$queryRaw`
      SELECT to_char("submissionDate" AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM') AS label,
             count(*)::int AS count
      FROM "JobApplication" WHERE "submissionDate" >= ${startDate}
      GROUP BY 1 ORDER BY 1`;
  } else if (period === 'year') {
    rows = await prisma.$queryRaw`
      SELECT to_char("submissionDate" AT TIME ZONE 'Asia/Jakarta', 'YYYY') AS label,
             count(*)::int AS count
      FROM "JobApplication" WHERE "submissionDate" >= ${startDate}
      GROUP BY 1 ORDER BY 1`;
  } else {
    // Mongo memakai %U (minggu dimulai Minggu); padanan terdekat di Postgres
    // adalah WW. Penomoran minggunya bisa berbeda 1 di awal/akhir tahun.
    rows = await prisma.$queryRaw`
      SELECT to_char("submissionDate" AT TIME ZONE 'Asia/Jakarta', 'YYYY-"W"WW') AS label,
             count(*)::int AS count
      FROM "JobApplication" WHERE "submissionDate" >= ${startDate}
      GROUP BY 1 ORDER BY 1`;
  }

  const trends = {};
  rows.forEach(item => {
    trends[item.label] = item.count;
  });

  return trends;
};

/**
 * Hard delete a job application
 */
export const hardDeleteApplication = async (uuid) => {
  const application = await prisma.jobApplication.findUnique({ where: { uuid } });
  if (!application) {
    throw new Error('Application not found');
  }

  // statusHistory ikut terhapus lewat onDelete: Cascade. Interview dan
  // TechnicalTest punya foreign key ke aplikasi ini, jadi harus dihapus lebih
  // dulu. Kode lama hanya menghapus Interview — technical test-nya jadi yatim
  // di Mongo; di Postgres itu akan menolak penghapusan, dan sekarang ikut
  // dibersihkan.
  const [, , deletedApplication] = await prisma.$transaction([
    prisma.interview.deleteMany({ where: { applicationId: uuid } }),
    prisma.technicalTest.deleteMany({ where: { applicationId: uuid } }),
    prisma.jobApplication.delete({ where: { uuid } })
  ]);

  return deletedApplication;
};
