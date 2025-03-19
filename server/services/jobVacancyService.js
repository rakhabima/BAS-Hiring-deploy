import JobPosting from "../models/jobPostingModel.js";

export const createJobVacancy = async (jobData) => {
  const { title, description, location, jobType, jobPosition, deadline, createdBy, status } = jobData;

  if (!title || !description || !location || !jobType || !jobPosition || !deadline || !createdBy) {
    throw new Error("Field yang diperlukan belum lengkap.");
  }

  let imageUrl = null;
  if (jobData.imageUrl) {
    imageUrl = jobData.imageUrl;
  }

  const newJob = new JobPosting({
    title,
    description,
    location,
    jobType,
    jobPosition,
    deadline,
    createdBy,
    imageUrl,
    status: status || "ACTIVE"
  });

  return await newJob.save();
};

export const updateJobVacancy = async (uuid, updateData) => {
  if (!uuid) {
    throw new Error("ID job vacancy diperlukan untuk update.");
  }

  const job = await JobPosting.findOne({ uuid, isDeleted: false });
  if (!job) {
    throw new Error("Job vacancy tidak ditemukan.");
  }

  const updatedJob = await JobPosting.findOneAndUpdate(
    { uuid, isDeleted: false },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  return updatedJob;
};

export const getAllJobVacancies = async () => {
  const jobs = await JobPosting.find({ isDeleted: false });
  return jobs;
};

export const getJobVacancyById = async (uuid) => {
  const job = await JobPosting.findOne({ uuid, isDeleted: false });
  return job;
};

export const softDeleteJobVacancy = async (uuid) => {
  const updatedJob = await JobPosting.findOneAndUpdate(
    { uuid, isDeleted: false },
    { 
      isDeleted: true, 
      deletedAt: new Date() 
    },
    { new: true }
  );
  
  if (!updatedJob) {
    throw new Error("Job vacancy tidak ditemukan atau sudah dihapus.");
  }
  
  return updatedJob;
};
