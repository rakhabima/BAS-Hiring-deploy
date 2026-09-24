import prisma from "../db/prisma.js";

// Mongoose dulu meng-cast string jadi Date/Number sendiri; Prisma tidak, dan
// form React mengirim keduanya sebagai string. Konversi dipusatkan di sini.
const toDate = (v) => (v === undefined || v === null || v === "" ? undefined : new Date(v));

// Field yang boleh datang dari req.body. Dulu updateData diteruskan mentah ke
// $set — Prisma menolak field tak dikenal, jadi whitelist ini sekaligus
// mencegah kolom lain (isDeleted, createdBy) ditimpa dari luar.
const UPDATABLE_FIELDS = ["title", "description", "location", "jobType", "jobPosition", "status", "imageUrl"];

export const createJobVacancy = async (jobData) => {
  const { title, description, location, jobType, jobPosition, deadline, createdBy, status } = jobData;

  if (!title || !description || !location || !jobType || !jobPosition || !deadline || !createdBy) {
    throw new Error("Field yang diperlukan belum lengkap.");
  }

  return prisma.jobPosting.create({
    data: {
      title,
      description,
      location,
      jobType,
      jobPosition,
      deadline: toDate(deadline),
      createdBy,
      imageUrl: jobData.imageUrl || null,
      status: status || "ACTIVE"
    }
  });
};

export const updateJobVacancy = async (uuid, updateData) => {
  if (!uuid) {
    throw new Error("ID job vacancy diperlukan untuk update.");
  }

  const job = await prisma.jobPosting.findFirst({ where: { uuid, isDeleted: false } });
  if (!job) {
    throw new Error("Job vacancy tidak ditemukan.");
  }

  const data = {};
  for (const field of UPDATABLE_FIELDS) {
    if (updateData[field] !== undefined) {
      data[field] = updateData[field];
    }
  }
  if (updateData.deadline !== undefined) {
    data.deadline = toDate(updateData.deadline);
  }

  return prisma.jobPosting.update({ where: { uuid }, data });
};

export const getAllJobVacancies = async () => {
  return prisma.jobPosting.findMany({ where: { isDeleted: false } });
};

export const getJobVacancyById = async (uuid) => {
  return prisma.jobPosting.findFirst({ where: { uuid, isDeleted: false } });
};

export const softDeleteJobVacancy = async (uuid) => {
  const job = await prisma.jobPosting.findFirst({ where: { uuid, isDeleted: false } });
  if (!job) {
    throw new Error("Job vacancy tidak ditemukan atau sudah dihapus.");
  }

  return prisma.jobPosting.update({
    where: { uuid },
    data: { isDeleted: true, deletedAt: new Date() }
  });
};
