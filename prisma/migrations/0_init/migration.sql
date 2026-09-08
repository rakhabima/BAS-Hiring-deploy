-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'RECRUITER', 'GENERAL_MANAGER', 'CANDIDATE', 'KOORDINATOR_LAPANGAN', 'KARYAWAN', 'GUEST');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('NONE', 'ON_JOB');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('ACTIVE', 'CLOSED', 'DRAFT');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'REVIEWING', 'INTERVIEW_SCHEDULED', 'TECHNICAL_TEST', 'REJECTED', 'ACCEPTED', 'ON_JOB', 'REVISION');

-- CreateEnum
CREATE TYPE "Religion" AS ENUM ('Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "Attendance" AS ENUM ('hadir', 'tidak_hadir');

-- CreateEnum
CREATE TYPE "TestResult" AS ENUM ('PENDING', 'PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPLICATION_STATUS', 'INTERVIEW', 'TECHNICAL_TEST', 'OUTSOURCING_REQUEST', 'SYSTEM');

-- CreateEnum
CREATE TYPE "RelatedModel" AS ENUM ('JobApplication', 'InterviewSchedule', 'TechnicalTest', 'OutsourcingRequest');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateTable
CREATE TABLE "User" (
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'GUEST',
    "status" BOOLEAN NOT NULL DEFAULT true,
    "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'NONE',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "datePosted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "location" TEXT NOT NULL,
    "jobType" "JobType" NOT NULL,
    "jobPosition" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "imageUrl" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "uuid" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "submissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "nama_ktp" TEXT NOT NULL,
    "jenis_kelamin" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "tanggal_lahir" TIMESTAMP(3) NOT NULL,
    "agama" "Religion" NOT NULL,
    "pendidikan_terakhir" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "no_hp" TEXT NOT NULL,
    "no_hp_darurat" TEXT NOT NULL,
    "pemilik_no_hp_darurat" TEXT NOT NULL,
    "hubungan_dgn_pemilik_no_hp_darurat" TEXT NOT NULL,
    "kota" TEXT NOT NULL,
    "kecamatan" TEXT NOT NULL,
    "kelurahan" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "no_sim" TEXT,
    "tipe_sim" TEXT NOT NULL DEFAULT 'Tidak Punya',
    "masa_berlaku_sim" TIMESTAMP(3),
    "merk_kendaraan" TEXT,
    "tahun_produksi_kendaraan" TEXT,
    "no_pol_kendaraan" TEXT,
    "no_stnk" TEXT,
    "masa_berlaku_stnk" TIMESTAMP(3),
    "masa_berlaku_pajak_kendaraan" TIMESTAMP(3),
    "no_rekening" TEXT NOT NULL,
    "nama_pemilik_rekening" TEXT NOT NULL,
    "nama_bank" TEXT NOT NULL,
    "posisi_dilamar" TEXT NOT NULL,
    "lama_pengalaman_kerja" TEXT,
    "ekspektasi_lama_bekerja" TEXT,
    "divisi" TEXT,
    "tanggal_bergabung" TIMESTAMP(3),
    "tanggal_berakhir_kontrak" TIMESTAMP(3),
    "status_kerja" BOOLEAN NOT NULL DEFAULT true,
    "lokasi_penempatan" TEXT,
    "hidden_from_employee_list" BOOLEAN NOT NULL DEFAULT false,
    "deleted_from_employee_list_by" TEXT,
    "deleted_from_employee_list_at" TIMESTAMP(3),
    "foto_diri" TEXT NOT NULL,
    "foto_ktp" TEXT NOT NULL,
    "foto_sim" TEXT,
    "foto_stnk_hal_1" TEXT,
    "foto_stnk_hal_2" TEXT,
    "foto_ijazah" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "ApplicationStatusHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "ApplicationStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "interviewDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "meetingLink" TEXT,
    "status" "InterviewStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "candidateAttendance" "Attendance",
    "candidateResponse" BOOLEAN NOT NULL DEFAULT false,
    "rescheduleRequest" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicalTest" (
    "uuid" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dateScheduled" TIMESTAMP(3) NOT NULL,
    "result" "TestResult" NOT NULL DEFAULT 'PENDING',
    "testLink" TEXT,
    "instructions" TEXT,
    "score" INTEGER,
    "feedback" TEXT,
    "submissionDate" TIMESTAMP(3),
    "submissionFile" TEXT,
    "submissionNotes" TEXT,
    "candidateHasCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechnicalTest_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "OutsourcingService" (
    "uuid" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "availabilityStatus" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "imageUrl" TEXT,
    "capacity" INTEGER,
    "price" INTEGER,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutsourcingService_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "OutsourcingRequest" (
    "uuid" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "contactInfo" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "submission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "serviceType" TEXT NOT NULL,
    "serviceId" TEXT,
    "vendorId" TEXT,
    "approvedBy" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutsourcingRequest_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Notification" (
    "uuid" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readStatus" BOOLEAN NOT NULL DEFAULT false,
    "type" "NotificationType" NOT NULL,
    "relatedId" TEXT,
    "relatedModel" "RelatedModel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "LogEntry" (
    "uuid" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activity" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" JSONB,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogEntry_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Guest" (
    "uuid" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "JobPosting_status_isDeleted_idx" ON "JobPosting"("status", "isDeleted");

-- CreateIndex
CREATE INDEX "JobApplication_submissionDate_idx" ON "JobApplication"("submissionDate" DESC);

-- CreateIndex
CREATE INDEX "JobApplication_status_idx" ON "JobApplication"("status");

-- CreateIndex
CREATE INDEX "ApplicationStatusHistory_applicationId_timestamp_idx" ON "ApplicationStatusHistory"("applicationId", "timestamp");

-- CreateIndex
CREATE INDEX "Interview_applicationId_idx" ON "Interview"("applicationId");

-- CreateIndex
CREATE INDEX "TechnicalTest_applicationId_idx" ON "TechnicalTest"("applicationId");

-- CreateIndex
CREATE INDEX "TechnicalTest_candidateId_idx" ON "TechnicalTest"("candidateId");

-- CreateIndex
CREATE INDEX "OutsourcingRequest_status_idx" ON "OutsourcingRequest"("status");

-- CreateIndex
CREATE INDEX "Notification_userId_readStatus_idx" ON "Notification"("userId", "readStatus");

-- CreateIndex
CREATE INDEX "LogEntry_timestamp_idx" ON "LogEntry"("timestamp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Guest_sessionId_key" ON "Guest"("sessionId");

-- CreateIndex
CREATE INDEX "Guest_createdAt_idx" ON "Guest"("createdAt");

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_deleted_from_employee_list_by_fkey" FOREIGN KEY ("deleted_from_employee_list_by") REFERENCES "User"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicalTest" ADD CONSTRAINT "TechnicalTest_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicalTest" ADD CONSTRAINT "TechnicalTest_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicalTest" ADD CONSTRAINT "TechnicalTest_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutsourcingService" ADD CONSTRAINT "OutsourcingService_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutsourcingRequest" ADD CONSTRAINT "OutsourcingRequest_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "OutsourcingService"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutsourcingRequest" ADD CONSTRAINT "OutsourcingRequest_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutsourcingRequest" ADD CONSTRAINT "OutsourcingRequest_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;


-- Validasi yang dulu ditegakkan `enum` Mongoose. Tiga kolom ini tidak bisa jadi
-- enum Postgres lewat Prisma tanpa mengubah nilai yang dikirim ke React
-- (Prisma mengembalikan nama member, bukan nilai @map), jadi ditegakkan
-- sebagai CHECK constraint. Nilainya harus persis sama dengan yang dipakai
-- form React di client/src/pages/public/JobApplicationForm.jsx.
ALTER TABLE "JobApplication"
  ADD CONSTRAINT "JobApplication_jenis_kelamin_check"
  CHECK ("jenis_kelamin" IN ('Laki - Laki', 'Perempuan'));

ALTER TABLE "JobApplication"
  ADD CONSTRAINT "JobApplication_pendidikan_terakhir_check"
  CHECK ("pendidikan_terakhir" IN ('SD', 'SMP', 'SMA/SMK', 'D1', 'D2', 'D3', 'D4/S1', 'S2', 'S3'));

ALTER TABLE "JobApplication"
  ADD CONSTRAINT "JobApplication_tipe_sim_check"
  CHECK ("tipe_sim" IN ('Tidak Punya', 'SIM A', 'SIM B1', 'SIM B2', 'SIM C'));
