import prisma from '../db/prisma.js';

// Field yang boleh datang dari req.body saat update.
const UPDATABLE_FIELDS = ['description', 'result', 'testLink', 'instructions', 'feedback', 'submissionFile', 'submissionNotes', 'candidateHasCompleted'];

const pick = (source, fields) => {
  const out = {};
  for (const field of fields) {
    if (source[field] !== undefined) out[field] = source[field];
  }
  return out;
};

/**
 * Create a new technical test
 */
export const createTechnicalTest = async (data) => {
  const application = await prisma.jobApplication.findUnique({ where: { uuid: data.applicationId } });
  if (!application) {
    throw new Error('Application not found');
  }

  const savedTest = await prisma.technicalTest.create({
    data: {
      applicationId: data.applicationId,
      recruiterId: data.recruiterId,
      candidateId: data.candidateId,
      description: data.description,
      dateScheduled: new Date(data.dateScheduled),
      testLink: data.testLink ?? null,
      instructions: data.instructions ?? null,
      result: 'PENDING',
      candidateHasCompleted: false
    }
  });

  // Update application status if not already in TECHNICAL_TEST
  if (application.status !== 'TECHNICAL_TEST') {
    await prisma.jobApplication.update({
      where: { uuid: data.applicationId },
      data: {
        status: 'TECHNICAL_TEST',
        statusHistory: {
          create: {
            status: 'TECHNICAL_TEST',
            notes: 'Kandidat memasuki tahap technical test',
            updatedBy: data.recruiterId
          }
        }
      }
    });
  }

  return savedTest;
};

/**
 * Get technical test by application ID (paling baru)
 */
export const getTechnicalTestByApplicationId = async (applicationId) => {
  const application = await prisma.jobApplication.findUnique({ where: { uuid: applicationId } });
  if (!application) {
    throw new Error('Application not found');
  }

  return prisma.technicalTest.findFirst({
    where: { applicationId },
    orderBy: { createdAt: 'desc' }
  });
};

/**
 * Get technical test by UUID
 */
export const getTechnicalTestById = async (uuid) => {
  return prisma.technicalTest.findUnique({ where: { uuid } });
};

/**
 * Update technical test
 */
export const updateTechnicalTest = async (uuid, updateData) => {
  const existing = await prisma.technicalTest.findUnique({ where: { uuid } });
  if (!existing) return null;

  const payload = pick(updateData, UPDATABLE_FIELDS);
  if (updateData.dateScheduled !== undefined) payload.dateScheduled = new Date(updateData.dateScheduled);
  if (updateData.score !== undefined) {
    payload.score = updateData.score === null || updateData.score === '' ? null : parseInt(updateData.score, 10);
  }

  const updatedTest = await prisma.technicalTest.update({ where: { uuid }, data: payload });

  // If updating result and it's PASSED or FAILED, update application status
  if (updateData.result === 'PASSED' || updateData.result === 'FAILED') {
    const newStatus = updateData.result === 'PASSED' ? 'ACCEPTED' : 'REJECTED';

    await prisma.jobApplication.update({
      where: { uuid: updatedTest.applicationId },
      data: {
        status: newStatus,
        statusHistory: {
          create: {
            status: newStatus,
            notes: updateData.feedback || `Kandidat ${newStatus === 'ACCEPTED' ? 'lulus' : 'tidak lulus'} technical test`,
            updatedBy: updateData.updatedBy || updatedTest.recruiterId
          }
        }
      }
    });
  }
  // result === null adalah reset evaluasi; status aplikasi diurus terpisah
  // lewat updateApplicationStatus.

  return updatedTest;
};

/**
 * Submit technical test results from candidate
 */
export const submitTechnicalTestResult = async (applicationId, submissionData) => {
  const technicalTest = await prisma.technicalTest.findFirst({
    where: { applicationId },
    orderBy: { createdAt: 'desc' }
  });
  if (!technicalTest) {
    throw new Error('Technical test not found');
  }

  const application = await prisma.jobApplication.findUnique({ where: { uuid: applicationId } });
  if (!application) {
    throw new Error('Application not found');
  }

  // Add a status history entry for test completion
  await prisma.applicationStatusHistory.create({
    data: {
      applicationId,
      status: 'TECHNICAL_TEST',
      notes: 'Kandidat telah mengerjakan technical test',
      updatedBy: application.candidateId
    }
  });

  return prisma.technicalTest.update({
    where: { uuid: technicalTest.uuid },
    data: {
      submissionDate: new Date(),
      submissionFile: submissionData.fileUrl,
      submissionNotes: submissionData.notes || null,
      result: 'PENDING', // Reset result to PENDING if it was changed
      candidateHasCompleted: true
    }
  });
};

/**
 * Get all technical tests
 */
export const getAllTechnicalTests = async () => {
  return prisma.technicalTest.findMany({ orderBy: { dateScheduled: 'desc' } });
};

/**
 * Delete technical test
 */
export const deleteTechnicalTest = async (uuid) => {
  const existing = await prisma.technicalTest.findUnique({ where: { uuid } });
  if (!existing) return null;

  return prisma.technicalTest.delete({ where: { uuid } });
};
