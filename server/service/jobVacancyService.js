import JobPosting from "../models/jobPostingModel.js";

export const createJobVacancy = async (jobData) => {
  const { title, description, location, jobType, deadline, createdBy, status } = jobData;

  if (!title || !description || !location || !jobType || !deadline || !createdBy) {
    throw new Error("Field yang diperlukan belum lengkap.");
  }

  const newJob = new JobPosting({
    title,
    description,
    location,
    jobType,
    deadline,
    createdBy,
    status: status || "DRAFT"
  });

  return await newJob.save();
};

export const updateJobVacancy = async (uuid, updateData) => {
    if (!uuid) {
      throw new Error("ID job vacancy diperlukan untuk update.");
    }
  
    const updatedJob = await JobPosting.findOneAndUpdate(
      { uuid },
      { $set: updateData },
      { new: true, runValidators: true }
    );
  
    if (!updatedJob) {
      throw new Error("Job vacancy tidak ditemukan.");
    }
    return updatedJob;
  };
