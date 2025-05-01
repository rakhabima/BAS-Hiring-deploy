import { ArrowBack, ArrowForward, CloudUpload } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobApplicationService, jobVacancyService } from '../../services/api';

// Styled components for file upload
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const FilePreview = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(1),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const JobApplicationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [jobData, setJobData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [navigateBackConfirmOpen, setNavigateBackConfirmOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Personal Information
    nama_ktp: '',
    jenis_kelamin: '',
    nik: '',
    tanggal_lahir: null,
    agama: '',
    pendidikan_terakhir: '',

    // Contact Information
    email: '',
    no_hp: '',
    no_hp_darurat: '',
    pemilik_no_hp_darurat: '',
    hubungan_dgn_pemilik_no_hp_darurat: '',

    // Address
    kota: '',
    kecamatan: '',
    kelurahan: '',
    alamat: '',

    // Vehicle Information
    no_sim: '',
    tipe_sim: '',
    masa_berlaku_sim: null,
    merk_kendaraan: '',
    tahun_produksi_kendaraan: '',
    no_pol_kendaraan: '',
    no_stnk: '',
    masa_berlaku_stnk: null,
    masa_berlaku_pajak_kendaraan: null,

    // Bank Information
    no_rekening: '',
    nama_pemilik_rekening: '',
    nama_bank: '',

    // Job Information
    jobPostingId: id,
    posisi_dilamar: '',
    lama_pengalaman_kerja: '',
    ekspektasi_lama_bekerja: '',

    // Document uploads will be handled separately
    foto_diri: null,
    foto_ktp: null,
    foto_sim: null,
    foto_stnk_hal_1: null,
    foto_stnk_hal_2: null,
    foto_ijazah: null,
  });

  // Form validation
  const [formErrors, setFormErrors] = useState({});

  // Document preview states
  const [documentPreviews, setDocumentPreviews] = useState({
    foto_diri: null,
    foto_ktp: null,
    foto_sim: null,
    foto_stnk_hal_1: null,
    foto_stnk_hal_2: null,
    foto_ijazah: null,
  });

  // Steps configuration
  const steps = ['Data Diri', 'Dokumen', 'Tinjau dan Kirim'];

  // Fetch job data
  useEffect(() => {
    const fetchJobData = async () => {
      try {
        setLoading(true);
        const response = await jobVacancyService.getJobVacancyById(id);

        // Check if job is active
        if (response.data.status !== 'ACTIVE') {
          setError('Lowongan pekerjaan ini sudah tidak aktif');
          return;
        }

        setJobData(response.data);

        // Pre-fill some job data
        setFormData(prev => ({
          ...prev,
          posisi_dilamar: response.data.jobPosition
        }));
      } catch (err) {
        console.error('Error fetching job data:', err);
        setError('Gagal memuat detail lowongan kerja');
      } finally {
        setLoading(false);
      }
    };

    fetchJobData();
  }, [id]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // Handle date changes
  const handleDateChange = (name, date) => {
    setFormData({
      ...formData,
      [name]: date
    });

    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // Handle file uploads
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];

      // Update form data
      setFormData({
        ...formData,
        [name]: file
      });

      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setDocumentPreviews({
        ...documentPreviews,
        [name]: previewUrl
      });

      // Clear error for this field if it exists
      if (formErrors[name]) {
        setFormErrors({
          ...formErrors,
          [name]: ''
        });
      }
    }
  };

  // Handle step navigation
  const handleNext = () => {
    // Validate current step
    if (validateStep(activeStep)) {
      if (activeStep === steps.length - 1) {
        // Final step, show confirmation dialog
        setConfirmOpen(true);
      } else {
        setActiveStep(activeStep + 1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  // Validate each step
  const validateStep = (step) => {
    let errors = {};
    let isValid = true;

    if (step === 0) {
      // Validate personal information
      if (!formData.nama_ktp) {
        errors.nama_ktp = 'Nama lengkap wajib diisi';
        isValid = false;
      }

      if (!formData.jenis_kelamin) {
        errors.jenis_kelamin = 'Jenis kelamin wajib dipilih';
        isValid = false;
      }

      if (!formData.nik) {
        errors.nik = 'NIK wajib diisi';
        isValid = false;
      } else if (formData.nik.length !== 16) {
        errors.nik = 'NIK harus 16 digit';
        isValid = false;
      }

      if (!formData.tanggal_lahir) {
        errors.tanggal_lahir = 'Tanggal lahir wajib diisi';
        isValid = false;
      }

      if (!formData.agama) {
        errors.agama = 'Agama wajib dipilih';
        isValid = false;
      }

      if (!formData.pendidikan_terakhir) {
        errors.pendidikan_terakhir = 'Pendidikan terakhir wajib dipilih';
        isValid = false;
      }

      // Validate contact information
      if (!formData.email) {
        errors.email = 'Email wajib diisi';
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Format email tidak valid';
        isValid = false;
      }

      if (!formData.no_hp) {
        errors.no_hp = 'Nomor telepon wajib diisi';
        isValid = false;
      }

      if (!formData.no_hp_darurat) {
        errors.no_hp_darurat = 'Nomor telepon darurat wajib diisi';
        isValid = false;
      }

      if (!formData.pemilik_no_hp_darurat) {
        errors.pemilik_no_hp_darurat = 'Nama pemilik kontak darurat wajib diisi';
        isValid = false;
      }

      if (!formData.hubungan_dgn_pemilik_no_hp_darurat) {
        errors.hubungan_dgn_pemilik_no_hp_darurat = 'Hubungan dengan pemilik kontak darurat wajib diisi';
        isValid = false;
      }

      // Validate address
      if (!formData.kota) {
        errors.kota = 'Kota/Kabupaten wajib diisi';
        isValid = false;
      }

      if (!formData.kecamatan) {
        errors.kecamatan = 'Kecamatan wajib diisi';
        isValid = false;
      }

      if (!formData.kelurahan) {
        errors.kelurahan = 'Kelurahan wajib diisi';
        isValid = false;
      }

      if (!formData.alamat) {
        errors.alamat = 'Alamat lengkap wajib diisi';
        isValid = false;
      }

      // Check if position is courier
      const isCourierPosition = jobData?.jobPosition?.toLowerCase().includes('kurir');

      // Only validate SIM for courier positions
      if (isCourierPosition && !formData.tipe_sim) {
        errors.tipe_sim = 'Tipe SIM wajib dipilih';
        isValid = false;
      }

      // Only validate vehicle details if SIM is available and position is courier
      if (formData.tipe_sim !== 'Tidak Punya' && isCourierPosition) {
        if (!formData.no_sim) {
          errors.no_sim = 'Nomor SIM wajib diisi';
          isValid = false;
        }

        if (!formData.masa_berlaku_sim) {
          errors.masa_berlaku_sim = 'Masa berlaku SIM wajib diisi';
          isValid = false;
        }

        if (!formData.merk_kendaraan) {
          errors.merk_kendaraan = 'Jenis & merk kendaraan wajib diisi';
          isValid = false;
        }

        if (!formData.tahun_produksi_kendaraan) {
          errors.tahun_produksi_kendaraan = 'Tahun produksi kendaraan wajib diisi';
          isValid = false;
        }

        if (!formData.no_pol_kendaraan) {
          errors.no_pol_kendaraan = 'Nomor polisi kendaraan wajib diisi';
          isValid = false;
        }

        if (!formData.no_stnk) {
          errors.no_stnk = 'Nomor STNK wajib diisi';
          isValid = false;
        }

        if (!formData.masa_berlaku_stnk) {
          errors.masa_berlaku_stnk = 'Masa berlaku STNK wajib diisi';
          isValid = false;
        }

        if (!formData.masa_berlaku_pajak_kendaraan) {
          errors.masa_berlaku_pajak_kendaraan = 'Masa berlaku pajak kendaraan wajib diisi';
          isValid = false;
        }
      }

      // Validate bank information
      if (!formData.no_rekening) {
        errors.no_rekening = 'Nomor rekening wajib diisi';
        isValid = false;
      }

      if (!formData.nama_pemilik_rekening) {
        errors.nama_pemilik_rekening = 'Nama pemilik rekening wajib diisi';
        isValid = false;
      }

      if (!formData.nama_bank) {
        errors.nama_bank = 'Nama bank wajib diisi';
        isValid = false;
      }
    } else if (step === 1) {
      // Validate document uploads
      if (!formData.foto_diri) {
        errors.foto_diri = 'Foto pribadi wajib diunggah';
        isValid = false;
      }

      if (!formData.foto_ktp) {
        errors.foto_ktp = 'Foto KTP wajib diunggah';
        isValid = false;
      }

      // Check if position is courier for SIM and STNK requirements
      const isCourierPosition = jobData?.jobPosition?.toLowerCase().includes('kurir');

      if (formData.tipe_sim !== 'Tidak Punya' && isCourierPosition && !formData.foto_sim) {
        errors.foto_sim = 'Foto SIM wajib diunggah';
        isValid = false;
      }

      if (formData.tipe_sim !== 'Tidak Punya' && isCourierPosition && !formData.foto_stnk_hal_1) {
        errors.foto_stnk_hal_1 = 'Foto STNK halaman depan wajib diunggah';
        isValid = false;
      }

      if (formData.tipe_sim !== 'Tidak Punya' && isCourierPosition && !formData.foto_stnk_hal_2) {
        errors.foto_stnk_hal_2 = 'Foto STNK halaman belakang wajib diunggah';
        isValid = false;
      }

      if (!formData.foto_ijazah) {
        errors.foto_ijazah = 'Foto ijazah wajib diunggah';
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async () => {
    setConfirmOpen(false);
    setSubmitting(true);

    try {
      // Get current user info
      const user = JSON.parse(localStorage.getItem('user'));

      // Prepare form data for submission
      const submissionData = {
        ...formData,
        candidateId: user.uuid,
        time_stamp: new Date().toISOString()
      };

      // Submit the form
      await jobApplicationService.submitApplication(submissionData);

      // Show success dialog
      setSuccessOpen(true);
    } catch (error) {
      console.error('Error submitting application:', error);
      setError('Gagal mengirim lamaran. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle closing the success dialog
  const handleSuccessClose = () => {
    setSuccessOpen(false);
    navigate('/candidate/portal-informasi');
  };

  // Handle navigation back to job details with confirmation
  const handleNavigateBack = () => {
    // If there are unsaved changes, show a confirmation dialog
    if (Object.keys(formData).some(key => formData[key])) {
      setNavigateBackConfirmOpen(true);
    } else {
      // Otherwise just navigate back
      navigate(`/lowongan/${id}`);
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            {error}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate('/lowongan')}
            startIcon={<ArrowBack />}
            sx={{ mt: 2 }}
          >
            Kembali ke Daftar Lowongan
          </Button>
        </Paper>
      </Container>
    );
  }

  // Render the form based on the active step
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Formulir Data Diri
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Harap mengisi formulir data diri ini dengan data yang sebenar-benarnya.
            </Typography>

            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Informasi Pribadi
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    id="nama_ktp"
                    name="nama_ktp"
                    label="Nama Lengkap (sesuai KTP)"
                    fullWidth
                    value={formData.nama_ktp}
                    onChange={handleChange}
                    error={!!formErrors.nama_ktp}
                    helperText={formErrors.nama_ktp}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required error={!!formErrors.jenis_kelamin}>
                    <InputLabel id="jenis-kelamin-label">Jenis Kelamin</InputLabel>
                    <Select
                      labelId="jenis-kelamin-label"
                      id="jenis_kelamin"
                      name="jenis_kelamin"
                      value={formData.jenis_kelamin}
                      onChange={handleChange}
                      label="Jenis Kelamin"
                    >
                      <MenuItem value="Laki - Laki">Laki - Laki</MenuItem>
                      <MenuItem value="Perempuan">Perempuan</MenuItem>
                    </Select>
                    {formErrors.jenis_kelamin && (
                      <FormHelperText>{formErrors.jenis_kelamin}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    id="nik"
                    name="nik"
                    label="NIK"
                    fullWidth
                    value={formData.nik}
                    onChange={handleChange}
                    error={!!formErrors.nik}
                    helperText={formErrors.nik}
                    inputProps={{ maxLength: 16 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Tanggal Lahir"
                      value={formData.tanggal_lahir}
                      onChange={(date) => handleDateChange('tanggal_lahir', date)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          error: !!formErrors.tanggal_lahir,
                          helperText: formErrors.tanggal_lahir
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required error={!!formErrors.agama}>
                    <InputLabel id="agama-label">Agama</InputLabel>
                    <Select
                      labelId="agama-label"
                      id="agama"
                      name="agama"
                      value={formData.agama}
                      onChange={handleChange}
                      label="Agama"
                    >
                      <MenuItem value="Islam">Islam</MenuItem>
                      <MenuItem value="Kristen">Kristen</MenuItem>
                      <MenuItem value="Katolik">Katolik</MenuItem>
                      <MenuItem value="Hindu">Hindu</MenuItem>
                      <MenuItem value="Buddha">Buddha</MenuItem>
                      <MenuItem value="Konghucu">Konghucu</MenuItem>
                      <MenuItem value="Lainnya">Lainnya</MenuItem>
                    </Select>
                    {formErrors.agama && (
                      <FormHelperText>{formErrors.agama}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required error={!!formErrors.pendidikan_terakhir}>
                    <InputLabel id="pendidikan-label">Pendidikan Terakhir</InputLabel>
                    <Select
                      labelId="pendidikan-label"
                      id="pendidikan_terakhir"
                      name="pendidikan_terakhir"
                      value={formData.pendidikan_terakhir}
                      onChange={handleChange}
                      label="Pendidikan Terakhir"
                    >
                      <MenuItem value="SD">SD</MenuItem>
                      <MenuItem value="SMP">SMP</MenuItem>
                      <MenuItem value="SMA/SMK">SMA/SMK</MenuItem>
                      <MenuItem value="D1">D1</MenuItem>
                      <MenuItem value="D2">D2</MenuItem>
                      <MenuItem value="D3">D3</MenuItem>
                      <MenuItem value="D4/S1">D4/S1</MenuItem>
                      <MenuItem value="S2">S2</MenuItem>
                      <MenuItem value="S3">S3</MenuItem>
                    </Select>
                    {formErrors.pendidikan_terakhir && (
                      <FormHelperText>{formErrors.pendidikan_terakhir}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Kontak
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    id="email"
                    name="email"
                    label="Alamat Email"
                    fullWidth
                    value={formData.email}
                    onChange={handleChange}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                    type="email"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    id="no_hp"
                    name="no_hp"
                    label="Nomor Telepon"
                    fullWidth
                    value={formData.no_hp}
                    onChange={handleChange}
                    error={!!formErrors.no_hp}
                    helperText={formErrors.no_hp}
                    InputProps={{
                      startAdornment: <Typography>+62</Typography>,
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    id="no_hp_darurat"
                    name="no_hp_darurat"
                    label="Nomor Telepon Darurat"
                    fullWidth
                    value={formData.no_hp_darurat}
                    onChange={handleChange}
                    error={!!formErrors.no_hp_darurat}
                    helperText={formErrors.no_hp_darurat}
                    InputProps={{
                      startAdornment: <Typography>+62</Typography>,
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    id="pemilik_no_hp_darurat"
                    name="pemilik_no_hp_darurat"
                    label="Nama Pemilik Kontak Darurat"
                    fullWidth
                    value={formData.pemilik_no_hp_darurat}
                    onChange={handleChange}
                    error={!!formErrors.pemilik_no_hp_darurat}
                    helperText={formErrors.pemilik_no_hp_darurat}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    required
                    id="hubungan_dgn_pemilik_no_hp_darurat"
                    name="hubungan_dgn_pemilik_no_hp_darurat"
                    label="Hubungan dengan Pemilik Kontak Darurat"
                    fullWidth
                    value={formData.hubungan_dgn_pemilik_no_hp_darurat}
                    onChange={handleChange}
                    error={!!formErrors.hubungan_dgn_pemilik_no_hp_darurat}
                    helperText={formErrors.hubungan_dgn_pemilik_no_hp_darurat}
                  />
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Domisili
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    required
                    id="kota"
                    name="kota"
                    label="Kota/Kabupaten"
                    fullWidth
                    value={formData.kota}
                    onChange={handleChange}
                    error={!!formErrors.kota}
                    helperText={formErrors.kota}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    required
                    id="kecamatan"
                    name="kecamatan"
                    label="Kecamatan"
                    fullWidth
                    value={formData.kecamatan}
                    onChange={handleChange}
                    error={!!formErrors.kecamatan}
                    helperText={formErrors.kecamatan}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    required
                    id="kelurahan"
                    name="kelurahan"
                    label="Kelurahan"
                    fullWidth
                    value={formData.kelurahan}
                    onChange={handleChange}
                    error={!!formErrors.kelurahan}
                    helperText={formErrors.kelurahan}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    required
                    id="alamat"
                    name="alamat"
                    label="Detail Alamat"
                    fullWidth
                    value={formData.alamat}
                    onChange={handleChange}
                    error={!!formErrors.alamat}
                    helperText={formErrors.alamat}
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Informasi Kendaraan
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Informasi kendaraan hanya wajib diisi untuk posisi kurir. Untuk posisi lain, Anda dapat melewati bagian ini.
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={!!formErrors.tipe_sim}>
                    <InputLabel id="tipe-sim-label">Tipe SIM</InputLabel>
                    <Select
                      labelId="tipe-sim-label"
                      id="tipe_sim"
                      name="tipe_sim"
                      value={formData.tipe_sim}
                      onChange={handleChange}
                      label="Tipe SIM"
                    >
                      <MenuItem value="SIM A">SIM A</MenuItem>
                      <MenuItem value="SIM B1">SIM B1</MenuItem>
                      <MenuItem value="SIM B2">SIM B2</MenuItem>
                      <MenuItem value="SIM C">SIM C</MenuItem>
                      <MenuItem value="Tidak Punya">Tidak Punya</MenuItem>
                    </Select>
                    {formErrors.tipe_sim && (
                      <FormHelperText>{formErrors.tipe_sim}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    id="no_sim"
                    name="no_sim"
                    label="Nomor SIM"
                    fullWidth
                    value={formData.no_sim}
                    onChange={handleChange}
                    error={!!formErrors.no_sim}
                    helperText={formErrors.no_sim}
                    disabled={formData.tipe_sim === 'Tidak Punya'}
                    required={formData.tipe_sim !== 'Tidak Punya' && jobData?.jobPosition?.toLowerCase().includes('kurir')}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Masa Berlaku SIM"
                      value={formData.masa_berlaku_sim}
                      onChange={(date) => handleDateChange('masa_berlaku_sim', date)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!formErrors.masa_berlaku_sim,
                          helperText: formErrors.masa_berlaku_sim,
                          disabled: formData.tipe_sim === 'Tidak Punya',
                          required: formData.tipe_sim !== 'Tidak Punya' && jobData?.jobPosition?.toLowerCase().includes('kurir')
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    id="merk_kendaraan"
                    name="merk_kendaraan"
                    label="Jenis & Merk Kendaraan"
                    fullWidth
                    value={formData.merk_kendaraan}
                    onChange={handleChange}
                    error={!!formErrors.merk_kendaraan}
                    helperText={formErrors.merk_kendaraan}
                    disabled={formData.tipe_sim === 'Tidak Punya'}
                    required={formData.tipe_sim !== 'Tidak Punya' && jobData?.jobPosition?.toLowerCase().includes('kurir')}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    id="tahun_produksi_kendaraan"
                    name="tahun_produksi_kendaraan"
                    label="Tahun Pembuatan Kendaraan"
                    fullWidth
                    value={formData.tahun_produksi_kendaraan}
                    onChange={handleChange}
                    error={!!formErrors.tahun_produksi_kendaraan}
                    helperText={formErrors.tahun_produksi_kendaraan}
                    disabled={formData.tipe_sim === 'Tidak Punya'}
                    required={formData.tipe_sim !== 'Tidak Punya' && jobData?.jobPosition?.toLowerCase().includes('kurir')}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    id="no_pol_kendaraan"
                    name="no_pol_kendaraan"
                    label="Nomor Polisi Kendaraan"
                    fullWidth
                    value={formData.no_pol_kendaraan}
                    onChange={handleChange}
                    error={!!formErrors.no_pol_kendaraan}
                    helperText={formErrors.no_pol_kendaraan}
                    disabled={formData.tipe_sim === 'Tidak Punya'}
                    required={formData.tipe_sim !== 'Tidak Punya' && jobData?.jobPosition?.toLowerCase().includes('kurir')}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    id="no_stnk"
                    name="no_stnk"
                    label="Nomor STNK"
                    fullWidth
                    value={formData.no_stnk}
                    onChange={handleChange}
                    error={!!formErrors.no_stnk}
                    helperText={formErrors.no_stnk}
                    disabled={formData.tipe_sim === 'Tidak Punya'}
                    required={formData.tipe_sim !== 'Tidak Punya' && jobData?.jobPosition?.toLowerCase().includes('kurir')}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Masa Berlaku STNK"
                      value={formData.masa_berlaku_stnk}
                      onChange={(date) => handleDateChange('masa_berlaku_stnk', date)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!formErrors.masa_berlaku_stnk,
                          helperText: formErrors.masa_berlaku_stnk,
                          disabled: formData.tipe_sim === 'Tidak Punya',
                          required: formData.tipe_sim !== 'Tidak Punya' && jobData?.jobPosition?.toLowerCase().includes('kurir')
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Masa Berlaku Pajak Kendaraan"
                      value={formData.masa_berlaku_pajak_kendaraan}
                      onChange={(date) => handleDateChange('masa_berlaku_pajak_kendaraan', date)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!formErrors.masa_berlaku_pajak_kendaraan,
                          helperText: formErrors.masa_berlaku_pajak_kendaraan,
                          disabled: formData.tipe_sim === 'Tidak Punya',
                          required: formData.tipe_sim !== 'Tidak Punya' && jobData?.jobPosition?.toLowerCase().includes('kurir')
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Informasi Rekening Bank
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    id="no_rekening"
                    name="no_rekening"
                    label="Nomor Rekening"
                    fullWidth
                    value={formData.no_rekening}
                    onChange={handleChange}
                    error={!!formErrors.no_rekening}
                    helperText={formErrors.no_rekening}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    id="nama_pemilik_rekening"
                    name="nama_pemilik_rekening"
                    label="Nama Pemilik Rekening"
                    fullWidth
                    value={formData.nama_pemilik_rekening}
                    onChange={handleChange}
                    error={!!formErrors.nama_pemilik_rekening}
                    helperText={formErrors.nama_pemilik_rekening}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    id="nama_bank"
                    name="nama_bank"
                    label="Nama Bank"
                    fullWidth
                    value={formData.nama_bank}
                    onChange={handleChange}
                    error={!!formErrors.nama_bank}
                    helperText={formErrors.nama_bank}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Kelengkapan Dokumen
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Lengkapi dokumen untuk mempermudah proses pendaftaran magang.
            </Typography>

            <Box sx={{ mt: 4 }}>
              <Grid container spacing={4}>
                {/* Foto Pribadi */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Foto Pribadi
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Foto yang dilampirkan harus menampilkan bagian muka dengan jelas
                  </Typography>

                  {documentPreviews.foto_diri ? (
                    <Box sx={{ mb: 2 }}>
                      <img
                        src={documentPreviews.foto_diri}
                        alt="Foto Pribadi"
                        style={{
                          width: '100%',
                          maxHeight: '200px',
                          objectFit: 'contain',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          padding: '4px'
                        }}
                      />
                    </Box>
                  ) : null}

                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    fullWidth
                    sx={{ mb: 1 }}
                  >
                    {documentPreviews.foto_diri ? 'Ganti Foto' : 'Unggah Foto'}
                    <VisuallyHiddenInput
                      type="file"
                      name="foto_diri"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </Button>

                  {formErrors.foto_diri && (
                    <FormHelperText error>{formErrors.foto_diri}</FormHelperText>
                  )}
                </Grid>

                {/* KTP */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    KTP
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Lampirkan KTP Anda bagian depan
                  </Typography>

                  {documentPreviews.foto_ktp ? (
                    <Box sx={{ mb: 2 }}>
                      <img
                        src={documentPreviews.foto_ktp}
                        alt="KTP"
                        style={{
                          width: '100%',
                          maxHeight: '200px',
                          objectFit: 'contain',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          padding: '4px'
                        }}
                      />
                    </Box>
                  ) : null}

                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    fullWidth
                    sx={{ mb: 1 }}
                  >
                    {documentPreviews.foto_ktp ? 'Ganti Foto' : 'Unggah Foto'}
                    <VisuallyHiddenInput
                      type="file"
                      name="foto_ktp"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </Button>

                  {formErrors.foto_ktp && (
                    <FormHelperText error>{formErrors.foto_ktp}</FormHelperText>
                  )}
                </Grid>

                {/* SIM */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    SIM
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Sesuaikan SIM dengan syarat posisi yang dilamar
                  </Typography>

                  {documentPreviews.foto_sim ? (
                    <Box sx={{ mb: 2 }}>
                      <img
                        src={documentPreviews.foto_sim}
                        alt="SIM"
                        style={{
                          width: '100%',
                          maxHeight: '200px',
                          objectFit: 'contain',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          padding: '4px'
                        }}
                      />
                    </Box>
                  ) : null}

                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    fullWidth
                    sx={{ mb: 1 }}
                    disabled={formData.tipe_sim === 'Tidak Punya'}
                  >
                    {documentPreviews.foto_sim ? 'Ganti Foto' : 'Unggah Foto'}
                    <VisuallyHiddenInput
                      type="file"
                      name="foto_sim"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={formData.tipe_sim === 'Tidak Punya'}
                    />
                  </Button>

                  {formErrors.foto_sim && (
                    <FormHelperText error>{formErrors.foto_sim}</FormHelperText>
                  )}
                </Grid>

                {/* STNK Halaman 1 */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    STNK
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Lampirkan STNK Anda halaman depan & belakang
                  </Typography>

                  {documentPreviews.foto_stnk_hal_1 ? (
                    <Box sx={{ mb: 2 }}>
                      <img
                        src={documentPreviews.foto_stnk_hal_1}
                        alt="STNK Halaman Depan"
                        style={{
                          width: '100%',
                          maxHeight: '200px',
                          objectFit: 'contain',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          padding: '4px'
                        }}
                      />
                    </Box>
                  ) : null}

                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    fullWidth
                    sx={{ mb: 1 }}
                    disabled={formData.tipe_sim === 'Tidak Punya'}
                  >
                    {documentPreviews.foto_stnk_hal_1 ? 'Ganti Halaman Depan' : 'Unggah Halaman Depan'}
                    <VisuallyHiddenInput
                      type="file"
                      name="foto_stnk_hal_1"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={formData.tipe_sim === 'Tidak Punya'}
                    />
                  </Button>

                  {formErrors.foto_stnk_hal_1 && (
                    <FormHelperText error>{formErrors.foto_stnk_hal_1}</FormHelperText>
                  )}

                  {documentPreviews.foto_stnk_hal_2 ? (
                    <Box sx={{ my: 2 }}>
                      <img
                        src={documentPreviews.foto_stnk_hal_2}
                        alt="STNK Halaman Belakang"
                        style={{
                          width: '100%',
                          maxHeight: '200px',
                          objectFit: 'contain',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          padding: '4px'
                        }}
                      />
                    </Box>
                  ) : null}

                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    fullWidth
                    disabled={formData.tipe_sim === 'Tidak Punya'}
                  >
                    {documentPreviews.foto_stnk_hal_2 ? 'Ganti Halaman Belakang' : 'Unggah Halaman Belakang'}
                    <VisuallyHiddenInput
                      type="file"
                      name="foto_stnk_hal_2"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={formData.tipe_sim === 'Tidak Punya'}
                    />
                  </Button>

                  {formErrors.foto_stnk_hal_2 && (
                    <FormHelperText error>{formErrors.foto_stnk_hal_2}</FormHelperText>
                  )}
                </Grid>

                {/* Ijazah */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Ijazah
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Minimal Ijazah SMP
                  </Typography>

                  {documentPreviews.foto_ijazah ? (
                    <Box sx={{ mb: 2 }}>
                      <img
                        src={documentPreviews.foto_ijazah}
                        alt="Ijazah"
                        style={{
                          width: '100%',
                          maxHeight: '200px',
                          objectFit: 'contain',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          padding: '4px'
                        }}
                      />
                    </Box>
                  ) : null}

                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    fullWidth
                    sx={{ mb: 1 }}
                  >
                    {documentPreviews.foto_ijazah ? 'Ganti Foto' : 'Unggah Foto'}
                    <VisuallyHiddenInput
                      type="file"
                      name="foto_ijazah"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </Button>

                  {formErrors.foto_ijazah && (
                    <FormHelperText error>{formErrors.foto_ijazah}</FormHelperText>
                  )}
                </Grid>
              </Grid>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Ringkasan Formulir
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Harap periksa ulang data diri dan dokumen yang sudah diunggah
            </Typography>

            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Informasi Pribadi
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Nama Lengkap (sesuai KTP)
                  </Typography>
                  <Typography variant="body1">{formData.nama_ktp || '-'}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Jenis Kelamin
                  </Typography>
                  <Typography variant="body1">{formData.jenis_kelamin || '-'}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    NIK
                  </Typography>
                  <Typography variant="body1">{formData.nik || '-'}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Tanggal Lahir
                  </Typography>
                  <Typography variant="body1">
                    {formData.tanggal_lahir ? new Date(formData.tanggal_lahir).toLocaleDateString('id-ID') : '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Agama
                  </Typography>
                  <Typography variant="body1">{formData.agama || '-'}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Pendidikan Terakhir
                  </Typography>
                  <Typography variant="body1">{formData.pendidikan_terakhir || '-'}</Typography>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Kontak
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Alamat Email
                  </Typography>
                  <Typography variant="body1">{formData.email || '-'}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Nomor Telepon
                  </Typography>
                  <Typography variant="body1">+62 {formData.no_hp || '-'}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Nomor Telepon Darurat
                  </Typography>
                  <Typography variant="body1">+62 {formData.no_hp_darurat || '-'}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Nama Pemilik Kontak Darurat
                  </Typography>
                  <Typography variant="body1">{formData.pemilik_no_hp_darurat || '-'}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Hubungan dengan Pemilik Kontak Darurat
                  </Typography>
                  <Typography variant="body1">{formData.hubungan_dgn_pemilik_no_hp_darurat || '-'}</Typography>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Domisili
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Kota/Kabupaten
                  </Typography>
                  <Typography variant="body1">{formData.kota || '-'}</Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Kecamatan
                  </Typography>
                  <Typography variant="body1">{formData.kecamatan || '-'}</Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Kelurahan
                  </Typography>
                  <Typography variant="body1">{formData.kelurahan || '-'}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Detail Alamat
                  </Typography>
                  <Typography variant="body1">{formData.alamat || '-'}</Typography>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Informasi Kendaraan
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Tipe SIM
                  </Typography>
                  <Typography variant="body1">{formData.tipe_sim || '-'}</Typography>
                </Grid>

                {formData.tipe_sim !== 'Tidak Punya' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Nomor SIM
                      </Typography>
                      <Typography variant="body1">{formData.no_sim || '-'}</Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Masa Berlaku SIM
                      </Typography>
                      <Typography variant="body1">
                        {formData.masa_berlaku_sim ? new Date(formData.masa_berlaku_sim).toLocaleDateString('id-ID') : '-'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Jenis & Merk Kendaraan
                      </Typography>
                      <Typography variant="body1">{formData.merk_kendaraan || '-'}</Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Tahun Pembuatan Kendaraan
                      </Typography>
                      <Typography variant="body1">{formData.tahun_produksi_kendaraan || '-'}</Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Nomor Polisi Kendaraan
                      </Typography>
                      <Typography variant="body1">{formData.no_pol_kendaraan || '-'}</Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Nomor STNK
                      </Typography>
                      <Typography variant="body1">{formData.no_stnk || '-'}</Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Masa Berlaku STNK
                      </Typography>
                      <Typography variant="body1">
                        {formData.masa_berlaku_stnk ? new Date(formData.masa_berlaku_stnk).toLocaleDateString('id-ID') : '-'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Masa Berlaku Pajak Kendaraan
                      </Typography>
                      <Typography variant="body1">
                        {formData.masa_berlaku_pajak_kendaraan ? new Date(formData.masa_berlaku_pajak_kendaraan).toLocaleDateString('id-ID') : '-'}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Informasi Rekening Bank
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Nomor Rekening
                  </Typography>
                  <Typography variant="body1">{formData.no_rekening || '-'}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Nama Pemilik Rekening
                  </Typography>
                  <Typography variant="body1">{formData.nama_pemilik_rekening || '-'}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Nama Bank
                  </Typography>
                  <Typography variant="body1">{formData.nama_bank || '-'}</Typography>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Dokumen
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6} sm={4} md={2}>
                  <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                    Foto Pribadi
                  </Typography>
                  {documentPreviews.foto_diri ? (
                    <img
                      src={documentPreviews.foto_diri}
                      alt="Foto Pribadi"
                      style={{
                        width: '100%',
                        height: '100px',
                        objectFit: 'cover',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100px',
                        border: '1px dashed #ddd',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'text.disabled'
                      }}
                    >
                      <Typography variant="caption">Tidak ada file</Typography>
                    </Box>
                  )}
                </Grid>

                <Grid item xs={6} sm={4} md={2}>
                  <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                    KTP
                  </Typography>
                  {documentPreviews.foto_ktp ? (
                    <img
                      src={documentPreviews.foto_ktp}
                      alt="KTP"
                      style={{
                        width: '100%',
                        height: '100px',
                        objectFit: 'cover',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100px',
                        border: '1px dashed #ddd',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'text.disabled'
                      }}
                    >
                      <Typography variant="caption">Tidak ada file</Typography>
                    </Box>
                  )}
                </Grid>

                {formData.tipe_sim !== 'Tidak Punya' && (
                  <>
                    <Grid item xs={6} sm={4} md={2}>
                      <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                        SIM
                      </Typography>
                      {documentPreviews.foto_sim ? (
                        <img
                          src={documentPreviews.foto_sim}
                          alt="SIM"
                          style={{
                            width: '100%',
                            height: '100px',
                            objectFit: 'cover',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: '100px',
                            border: '1px dashed #ddd',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'text.disabled'
                          }}
                        >
                          <Typography variant="caption">Tidak ada file</Typography>
                        </Box>
                      )}
                    </Grid>

                    <Grid item xs={6} sm={4} md={2}>
                      <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                        STNK (depan)
                      </Typography>
                      {documentPreviews.foto_stnk_hal_1 ? (
                        <img
                          src={documentPreviews.foto_stnk_hal_1}
                          alt="STNK Depan"
                          style={{
                            width: '100%',
                            height: '100px',
                            objectFit: 'cover',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: '100px',
                            border: '1px dashed #ddd',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'text.disabled'
                          }}
                        >
                          <Typography variant="caption">Tidak ada file</Typography>
                        </Box>
                      )}
                    </Grid>

                    <Grid item xs={6} sm={4} md={2}>
                      <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                        STNK (belakang)
                      </Typography>
                      {documentPreviews.foto_stnk_hal_2 ? (
                        <img
                          src={documentPreviews.foto_stnk_hal_2}
                          alt="STNK Belakang"
                          style={{
                            width: '100%',
                            height: '100px',
                            objectFit: 'cover',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: '100px',
                            border: '1px dashed #ddd',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'text.disabled'
                          }}
                        >
                          <Typography variant="caption">Tidak ada file</Typography>
                        </Box>
                      )}
                    </Grid>
                  </>
                )}

                <Grid item xs={6} sm={4} md={2}>
                  <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                    Ijazah
                  </Typography>
                  {documentPreviews.foto_ijazah ? (
                    <img
                      src={documentPreviews.foto_ijazah}
                      alt="Ijazah"
                      style={{
                        width: '100%',
                        height: '100px',
                        objectFit: 'cover',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100px',
                        border: '1px dashed #ddd',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'text.disabled'
                      }}
                    >
                      <Typography variant="caption">Tidak ada file</Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
        <Box sx={{ mb: 3 }}>
          <IconButton
            onClick={() => {
              if (activeStep === 0) {
                // If on first step, confirm before navigating back to job detail
                handleNavigateBack();
              } else {
                // If on a later step, go back to previous step
                handleBack();
              }
            }}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="body2" component="span" color="text.secondary">
            {activeStep === 0 ? 'Kembali ke detail lowongan' : 'Kembali ke langkah sebelumnya'}
          </Typography>
        </Box>

        <Typography variant="h4" component="h1" gutterBottom>
          Formulir Lamaran Kerja
        </Typography>

        <Typography variant="subtitle1" color="primary" gutterBottom>
          {jobData && jobData.title} - {jobData && jobData.jobPosition}
        </Typography>

        <Box sx={{ width: '100%', mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Box>
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            color="inherit"
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            Kembali
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            endIcon={activeStep === steps.length - 1 ? null : <ArrowForward />}
          >
            {activeStep === steps.length - 1 ? 'Kirim Lamaran' : 'Lanjut'}
          </Button>
        </Box>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
      >
        <DialogTitle>Konfirmasi Pengiriman</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apakah Anda yakin ingin mengirimkan lamaran ini? Pastikan semua data yang Anda masukkan sudah benar.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="primary">
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            color="primary"
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Ya, Kirim Lamaran'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <Dialog
        open={successOpen}
        onClose={handleSuccessClose}
      >
        <DialogTitle>Lamaran Berhasil Dikirim</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
            <img
              src="/assets/success-cloud.png"
              alt="Success"
              style={{ width: '200px', height: 'auto', marginBottom: '16px' }}
            />
            <Typography variant="h5" align="center" gutterBottom>
              Selamat!
            </Typography>
            <Typography variant="body1" align="center">
              Lamaran Anda berhasil diterima
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary">
              Cek detail lamaran di profil Anda.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleSuccessClose}
            color="primary"
            variant="contained"
            fullWidth
          >
            Selanjutnya
          </Button>
        </DialogActions>
      </Dialog>

      {/* Navigate Back Confirmation Dialog */}
      <Dialog
        open={navigateBackConfirmOpen}
        onClose={() => setNavigateBackConfirmOpen(false)}
      >
        <DialogTitle>Konfirmasi</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apakah Anda yakin ingin kembali? Data yang sudah diisi akan hilang.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNavigateBackConfirmOpen(false)} color="primary">
            Batal
          </Button>
          <Button
            onClick={() => navigate(`/lowongan/${id}`)}
            color="error"
          >
            Ya, Kembali
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default JobApplicationForm; 