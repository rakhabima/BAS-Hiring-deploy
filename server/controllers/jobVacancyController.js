import { createJobVacancy, getAllJobVacancies, getJobVacancyById, softDeleteJobVacancy, updateJobVacancy } from "../services/jobVacancyService.js";

export const createJobVacancyController = async (req, res) => {
  try {
    const jobData = { ...req.body };
    
    // Handle file upload if present
    if (req.file) {
      jobData.imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
    
    const createdJob = await createJobVacancy(jobData);
    res.status(201).json({
      message: "Lowongan pekerjaan berhasil dibuat",
      data: createdJob,
    });
  } catch (error) {
    console.error("Gagal membuat lowongan pekerjaan:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateJobVacancyController = async (req, res) => {
  try {
    const { uuid } = req.params;
    const updateData = { ...req.body };
    
    // Handle file upload if present
    if (req.file) {
      updateData.imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
    
    // Auto-update status based on deadline
    if (updateData.deadline) {
      const deadline = new Date(updateData.deadline);
      const now = new Date();
      
      if (deadline < now) {
        updateData.status = "CLOSED";
      }
    }
    
    const updatedJob = await updateJobVacancy(uuid, updateData);
    res.status(200).json({
      message: "Lowongan pekerjaan berhasil diupdate",
      data: updatedJob,
    });
  } catch (error) {
    console.error("Gagal mengupdate lowongan pekerjaan:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllJobVacanciesController = async (req, res) => {
  try {
    const jobs = await getAllJobVacancies();
    res.status(200).json({
      message: "Berhasil mengambil data lowongan pekerjaan",
      data: jobs,
    });
  } catch (error) {
    console.error("Gagal mengambil data lowongan pekerjaan:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getJobVacancyByIdController = async (req, res) => {
  try {
    const { uuid } = req.params;
    const job = await getJobVacancyById(uuid);
    
    if (!job) {
      return res.status(404).json({ message: "Lowongan pekerjaan tidak ditemukan" });
    }
    
    res.status(200).json({
      message: "Berhasil mengambil data lowongan pekerjaan",
      data: job,
    });
  } catch (error) {
    console.error("Gagal mengambil data lowongan pekerjaan:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteJobVacancyController = async (req, res) => {
  try {
    const { uuid } = req.params;
    const deletedJob = await softDeleteJobVacancy(uuid);
    
    res.status(200).json({
      message: "Lowongan pekerjaan berhasil dihapus",
      data: deletedJob,
    });
  } catch (error) {
    console.error("Gagal menghapus lowongan pekerjaan:", error);
    res.status(500).json({ message: error.message });
  }
};