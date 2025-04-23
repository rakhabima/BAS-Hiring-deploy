import { ArrowBack, CloudUpload } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobVacancyService } from '../../services/api';

// Styled components
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

const ImagePreview = styled('img')(({ theme }) => ({
  width: '100%',
  height: 400,
  objectFit: 'contain',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  marginTop: theme.spacing(2),
}));

const EditJobPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    jobPosition: '',
    description: '',
    location: '',
    jobType: 'FULL_TIME',
    deadline: new Date(),
    imageUrl: null,
    status: 'ACTIVE'
  });
  const [imagePreview, setImagePreview] = useState('/assets/baslogo.png');
  const [errors, setErrors] = useState({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // Hardcoded location and position options
  const locations = ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Makassar', 'Bali'];
  const jobPositions = ['Kurir', 'Office Boy', 'Security', 'Receptionist', 'Driver'];

  // Check user role
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'RECRUITER') {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch job data
  useEffect(() => {
    const fetchJobData = async () => {
      try {
        setLoadingData(true);
        const response = await jobVacancyService.getJobVacancyById(id);
        const job = response.data;
        
        if (!job) {
          navigate('/recruiter/job-publications');
          return;
        }
        
        setFormData({
          title: job.title || '',
          jobPosition: job.jobPosition || '',
          description: job.description || '',
          location: job.location || '',
          jobType: job.jobType || 'FULL_TIME',
          deadline: job.deadline ? new Date(job.deadline) : new Date(),
          status: job.status || 'ACTIVE'
        });
        
        if (job.imageUrl) {
          setImagePreview(job.imageUrl);
        }
      } catch (error) {
        console.error('Error fetching job data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (id) {
      fetchJobData();
    }
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      deadline: date
    });

    // Clear error when deadline is changed
    if (errors.deadline) {
      setErrors({
        ...errors,
        deadline: null
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        imageUrl: file
      });

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Judul harus diisi';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Deskripsi harus diisi';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Lokasi harus diisi';
    }

    if (!formData.jobPosition.trim()) {
      newErrors.jobPosition = 'Posisi pekerjaan harus diisi';
    }

    if (!formData.jobType) {
      newErrors.jobType = 'Durasi harus dipilih';
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Tanggal penutupan harus diisi';
    } else {
      // Validate that deadline is not before today
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time part for date comparison
      
      const deadlineDate = new Date(formData.deadline);
      deadlineDate.setHours(0, 0, 0, 0); // Reset time part for date comparison
      
      if (deadlineDate < today) {
        newErrors.deadline = 'Tanggal penutupan tidak boleh sebelum hari ini';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Open confirmation dialog instead of saving immediately
    setConfirmDialogOpen(true);
  };

  const handleConfirmSave = async () => {
    setLoading(true);

    try {
      // Remove auto-allocate status based on deadline
      // Status only changes if recruiter changes it manually
      // or if the real-time date passes the deadline (handled elsewhere)
      
      await jobVacancyService.updateJobVacancy(id, formData);
      navigate('/recruiter/job-publications');
    } catch (error) {
      console.error('Error updating job vacancy:', error);
    } finally {
      setLoading(false);
      setConfirmDialogOpen(false);
    }
  };

  if (loadingData) {
    return (
      <Container sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <IconButton onClick={() => navigate('/recruiter/job-publications')} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Perbarui Publikasi Lowongan Kerja
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Judul"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  error={Boolean(errors.title)}
                  helperText={errors.title}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Deskripsi"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  error={Boolean(errors.description)}
                  helperText={errors.description}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={Boolean(errors.location)}>
                  <InputLabel id="location-label">Lokasi</InputLabel>
                  <Select
                    labelId="location-label"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    label="Lokasi"
                    required
                  >
                    {locations.map((location) => (
                      <MenuItem key={location} value={location}>{location}</MenuItem>
                    ))}
                  </Select>
                  {errors.location && (
                    <Typography variant="caption" color="error">
                      {errors.location}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={Boolean(errors.jobPosition)}>
                  <InputLabel id="job-position-label">Posisi Pekerjaan</InputLabel>
                  <Select
                    labelId="job-position-label"
                    name="jobPosition"
                    value={formData.jobPosition}
                    onChange={handleChange}
                    label="Posisi Pekerjaan"
                    required
                  >
                    {jobPositions.map((position) => (
                      <MenuItem key={position} value={position}>{position}</MenuItem>
                    ))}
                  </Select>
                  {errors.jobPosition && (
                    <Typography variant="caption" color="error">
                      {errors.jobPosition}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={Boolean(errors.jobType)}>
                  <InputLabel id="job-type-label">Durasi</InputLabel>
                  <Select
                    labelId="job-type-label"
                    name="jobType"
                    value={formData.jobType}
                    onChange={handleChange}
                    label="Durasi"
                    required
                  >
                    <MenuItem value="FULL_TIME">Full Time</MenuItem>
                    <MenuItem value="PART_TIME">Part Time</MenuItem>
                    <MenuItem value="CONTRACT">Contract</MenuItem>
                  </Select>
                  {errors.jobType && (
                    <Typography variant="caption" color="error">
                      {errors.jobType}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Tanggal Penutupan"
                  value={formData.deadline}
                  onChange={handleDateChange}
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: Boolean(errors.deadline),
                      helperText: errors.deadline,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    label="Status"
                  >
                    <MenuItem value="ACTIVE">Aktif</MenuItem>
                    <MenuItem value="CLOSED">Tutup</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Unggah Gambar
                </Typography>
                <Button
                  component="label"
                  variant="contained"
                  startIcon={<CloudUpload />}
                >
                  Pilih File
                  <VisuallyHiddenInput type="file" accept="image/*" onChange={handleImageChange} />
                </Button>
                <ImagePreview src={imagePreview} alt="Preview" />
              </Grid>

              <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading}
                  sx={{ minWidth: 150 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Simpan'}
                </Button>
              </Grid>
            </Grid>
          </form>

          {/* Confirmation Dialog */}
          <Dialog
            open={confirmDialogOpen}
            onClose={() => setConfirmDialogOpen(false)}
            aria-labelledby="confirm-dialog-title"
          >
            <DialogTitle id="confirm-dialog-title">
              Konfirmasi Perubahan
            </DialogTitle>
            <DialogContent>
              <Typography>
                Apakah Anda yakin ingin menyimpan perubahan pada lowongan pekerjaan ini?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmDialogOpen(false)} color="primary">
                Batal
              </Button>
              <Button onClick={handleConfirmSave} color="primary" variant="contained" autoFocus>
                Simpan Perubahan
              </Button>
            </DialogActions>
          </Dialog>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default EditJobPage; 