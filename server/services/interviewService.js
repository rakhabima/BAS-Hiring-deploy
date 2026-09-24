import prisma from '../db/prisma.js';

const ONE_HOUR_MS = 3600000;

// Helper: Cek bentrok jadwal wawancara (±1 jam).
// Dulu seluruh tabel Interview ditarik ke memori lalu di-scan satu per satu;
// sekarang cukup satu range query yang memakai index applicationId/interviewDate.
const checkSchedulingConflicts = async (interviewDate, excludeInterviewId = null) => {
  const target = new Date(interviewDate).getTime();

  return prisma.interview.findFirst({
    where: {
      interviewDate: {
        gt: new Date(target - ONE_HOUR_MS),
        lt: new Date(target + ONE_HOUR_MS)
      },
      ...(excludeInterviewId ? { id: { not: excludeInterviewId } } : {})
    }
  });
};

// Field yang boleh datang dari req.body.
const INTERVIEW_FIELDS = ['applicationId', 'location', 'isOnline', 'meetingLink', 'status', 'notes'];

const pick = (source, fields) => {
  const out = {};
  for (const field of fields) {
    if (source[field] !== undefined) out[field] = source[field];
  }
  return out;
};

// ✅ Create
export const createInterview = async (data) => {
  const application = await prisma.jobApplication.findUnique({ where: { uuid: data.applicationId } });
  if (!application) throw new Error('Application not found');

  const conflict = await checkSchedulingConflicts(data.interviewDate);
  if (conflict) throw new Error('Scheduling conflict: Another interview is scheduled within 1 hour');

  const savedInterview = await prisma.interview.create({
    data: {
      ...pick(data, INTERVIEW_FIELDS),
      applicationId: data.applicationId,
      interviewDate: new Date(data.interviewDate)
    }
  });

  if (application.status !== 'INTERVIEW_SCHEDULED') {
    // Hook pre('save') Mongoose dulu menambah entri statusHistory sendiri saat
    // status berubah. Hook itu tidak ada lagi, jadi entrinya ditulis eksplisit.
    await prisma.jobApplication.update({
      where: { uuid: application.uuid },
      data: {
        status: 'INTERVIEW_SCHEDULED',
        notes: 'Wawancara dijadwalkan',
        statusHistory: {
          create: { status: 'INTERVIEW_SCHEDULED', notes: 'Wawancara dijadwalkan' }
        }
      }
    });
  }

  return savedInterview;
};

// ✅ Read - Get by ID
export const getInterviewById = async (id) => {
  return prisma.interview.findUnique({ where: { id } });
};

// ✅ Read - Get by application ID
export const getInterviewByApplicationId = async (applicationId) => {
  const application = await prisma.jobApplication.findUnique({ where: { uuid: applicationId } });
  if (!application) throw new Error('Application not found');

  return prisma.interview.findFirst({
    where: { applicationId },
    orderBy: { created_at: 'desc' }
  });
};

// ✅ Read - All
export const getAllInterviews = async () => {
  return prisma.interview.findMany({ orderBy: { interviewDate: 'desc' } });
};

// ✅ Update
export const updateInterview = async (id, data) => {
  const interview = await prisma.interview.findUnique({ where: { id } });
  if (!interview) throw new Error('Interview not found');

  if (data.interviewDate) {
    const conflict = await checkSchedulingConflicts(data.interviewDate, id);
    if (conflict) throw new Error('Scheduling conflict: Another interview is scheduled within 1 hour');
  }

  const payload = pick(data, INTERVIEW_FIELDS);
  if (data.interviewDate !== undefined) payload.interviewDate = new Date(data.interviewDate);

  return prisma.interview.update({ where: { id }, data: payload });
};

// ✅ Update candidate response
export const updateInterviewResponse = async (id, data) => {
  const interview = await prisma.interview.findUnique({ where: { id } });
  if (!interview) throw new Error('Interview not found');

  const fields = {};
  // candidateAttendance dulu enum ["hadir","tidak_hadir",""] dengan default "".
  // Postgres tidak bisa menampung string kosong, jadi "" dipetakan ke null.
  if (data.candidateAttendance !== undefined) {
    fields.candidateAttendance = data.candidateAttendance === '' ? null : data.candidateAttendance;
  }
  if (data.candidateResponse !== undefined) fields.candidateResponse = data.candidateResponse;
  if (data.rescheduleRequest !== undefined) fields.rescheduleRequest = data.rescheduleRequest;

  return prisma.interview.update({ where: { id }, data: fields });
};

// ✅ Delete
export const deleteInterview = async (id) => {
  const interview = await prisma.interview.findUnique({ where: { id } });
  if (!interview) throw new Error('Interview not found');

  return prisma.interview.delete({ where: { id } });
};
