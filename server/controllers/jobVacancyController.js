import { createJobVacancy, updateJobVacancy } from "../service/jobVacancyService.js";

export const createJobVacancyController = async (req, res) => {
  try {
    const jobData = req.body;
    const createdJob = await createJobVacancy(jobData);
    res.status(201).json({
      message: "Job vacancy berhasil dibuat",
      data: createdJob,
    });
  } catch (error) {
    console.error("Gagal membuat job vacancy:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateJobVacancyController = async (req, res) => {
  try {
    const { uuid } = req.params;
    const updateData = req.body;
    const updatedJob = await updateJobVacancy(uuid, updateData);
    res.status(200).json({
      message: "Job vacancy berhasil diupdate.",
      data: updatedJob,
    });
  } catch (error) {
    console.error("Gagal mengupdate job vacancy:", error);
    res.status(500).json({ message: error.message });
  }
};