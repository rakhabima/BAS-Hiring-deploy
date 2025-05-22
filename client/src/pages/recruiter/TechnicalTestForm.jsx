import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    FormControl,
    FormHelperText,
    Paper,
    TextField,
    Typography
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobApplicationService, technicalTestService } from '../../services/api';

const TechnicalTestForm = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [application, setApplication] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    description: '',
    dateScheduled: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default: 7 days from now
    instructions: '',
    testLink: ''
  });
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState({
    description: '',
    dateScheduled: '',
    instructions: '',
    testLink: ''
  });
  
  // Fetch application data
  useEffect(() => {
    const fetchApplicationData = async () => {
      if (!applicationId) {
        navigate('/recruiter/candidates');
        return;
      }
      
      try {
        setLoading(true);
        const response = await jobApplicationService.getApplicationById(applicationId);
        
        if (!response || !response.data) {
          setError('Application not found');
          setLoading(false);
          return;
        }
        
        setApplication(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching application:', err);
        setError('Failed to load application data');
        setLoading(false);
      }
    };
    
    fetchApplicationData();
  }, [applicationId, navigate]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear validation error when user types
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };
  
  // Handle date change from date picker
  const handleDateChange = (date) => {
    setFormData({ ...formData, dateScheduled: date });
    
    // Clear validation error when user selects date
    if (formErrors.dateScheduled) {
      setFormErrors({ ...formErrors, dateScheduled: '' });
    }
  };
  
  // Validate form before submission
  const validateForm = () => {
    const errors = {
      description: '',
      dateScheduled: '',
      instructions: '',
      testLink: ''
    };
    let isValid = true;
    
    // Description is required
    if (!formData.description.trim()) {
      errors.description = 'Deskripsi wajib diisi';
      isValid = false;
    }
    
    // Date is required and must be valid
    if (!formData.dateScheduled || !(formData.dateScheduled instanceof Date && !isNaN(formData.dateScheduled))) {
      errors.dateScheduled = 'Tanggal deadline wajib diisi dengan tanggal yang valid';
      isValid = false;
    }
    
    // Instructions are required
    if (!formData.instructions.trim()) {
      errors.instructions = 'Instruksi wajib diisi';
      isValid = false;
    }
    
    // Test link is required
    if (!formData.testLink.trim()) {
      errors.testLink = 'Link test wajib diisi';
      isValid = false;
    } else if (!formData.testLink.startsWith('http')) {
      errors.testLink = 'Link test harus berupa URL yang valid (dimulai dengan http:// atau https://)';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Prepare submission data
    const testData = {
      ...formData,
      candidateId: application.candidateId,
      dateScheduled: formData.dateScheduled.toISOString().split('T')[0]
    };
    
    try {
      setSubmitting(true);
      
      // Submit technical test
      await technicalTestService.createTechnicalTest(applicationId, testData);
      
      // Navigate back to preview page on success
      navigate(`/recruiter/technical-test-preview/${applicationId}`);
    } catch (err) {
      console.error('Error creating technical test:', err);
      setError('Failed to create technical test');
      setSubmitting(false);
    }
  };
  
  // Handle cancel/back
  const handleCancel = () => {
    navigate(`/recruiter/technical-test-preview/${applicationId}`);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleCancel}
        sx={{ mb: 3 }}
      >
        Kembali
      </Button>
      
      <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
        Buat Technical Test
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {application && (
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            Kandidat: {application.nama_ktp}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Posisi: {application.jobPostingId?.jobPosition || application.posisi_dilamar}
          </Typography>
          
          <form onSubmit={handleSubmit}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <TextField
                label="Deskripsi Test"
                name="description"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                error={!!formErrors.description}
                helperText={formErrors.description}
                required
              />
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Tanggal Deadline"
                  value={formData.dateScheduled}
                  onChange={handleDateChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      error={!!formErrors.dateScheduled}
                      helperText={formErrors.dateScheduled}
                      required
                    />
                  )}
                  disablePast
                />
              </LocalizationProvider>
              {formErrors.dateScheduled && (
                <FormHelperText error>{formErrors.dateScheduled}</FormHelperText>
              )}
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <TextField
                label="Instruksi Test"
                name="instructions"
                multiline
                rows={4}
                value={formData.instructions}
                onChange={handleInputChange}
                error={!!formErrors.instructions}
                helperText={formErrors.instructions}
                required
              />
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <TextField
                label="Link Technical Test"
                name="testLink"
                value={formData.testLink}
                onChange={handleInputChange}
                error={!!formErrors.testLink}
                helperText={formErrors.testLink}
                required
              />
            </FormControl>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={24} /> : 'Simpan'}
              </Button>
            </Box>
          </form>
        </Paper>
      )}
    </Container>
  );
};

export default TechnicalTestForm; 