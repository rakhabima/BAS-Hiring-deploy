import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import EventIcon from '@mui/icons-material/Event';
import InfoIcon from '@mui/icons-material/Info';
import LinkIcon from '@mui/icons-material/Link';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {
  Alert,
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
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobApplicationService, technicalTestService } from '../../services/api';

// Steps for the progress bar
const steps = ['Administrasi', 'Wawancara', 'Technical Test', 'On Job'];

const TechnicalTestPreview = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [application, setApplication] = useState(null);
  const [technicalTest, setTechnicalTest] = useState(null);
  const [evaluation, setEvaluation] = useState('');
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [confirmationError, setConfirmationError] = useState('');
  const [processingDecision, setProcessingDecision] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Set to Technical Test stage (index 2)
  const activeStep = 2;

  useEffect(() => {
    const fetchData = async () => {
      if (!applicationId) {
        navigate('/recruiter/dashboard');
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch application data
        const appResponse = await jobApplicationService.getApplicationById(applicationId);
        if (!appResponse || !appResponse.data) {
          setError('Application not found');
          setLoading(false);
          return;
        }
        
        setApplication(appResponse.data);
        
        // Fetch technical test data
        try {
          const testResponse = await technicalTestService.getTechnicalTestByApplicationId(applicationId);
          if (testResponse && testResponse.data) {
            setTechnicalTest(testResponse.data);
          }
        } catch (testError) {
          console.log('No technical test found for this application');
          // Not a fatal error, as we'll show a button to create one
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [applicationId, navigate]);

  const handleBack = () => {
    navigate('/recruiter/dashboard');
  };
  
  const handleCreateTest = () => {
    navigate(`/recruiter/technical-test/${applicationId}`);
  };
  
  const handleEditTest = () => {
    navigate(`/recruiter/technical-test/${applicationId}`);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMMM yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const handleEvaluationChange = (event) => {
    setEvaluation(event.target.value);
  };

  const handleOpenConfirmation = () => {
    setConfirmationText('');
    setConfirmationError('');
    setConfirmationOpen(true);
  };

  const handleCloseConfirmation = () => {
    setConfirmationOpen(false);
  };

  const handleConfirmationTextChange = (event) => {
    setConfirmationText(event.target.value);
    setConfirmationError('');
  };

  const handleConfirmDecision = async () => {
    // Validate confirmation text
    const expectedText = evaluation === 'PASSED' ? 'Lolos' : 'Ditolak';
    
    if (confirmationText !== expectedText) {
      setConfirmationError(`Ketik "${expectedText}" untuk mengonfirmasi keputusan Anda`);
      return;
    }

    try {
      setProcessingDecision(true);
      
      // Update technical test result
      const updateData = {
        result: evaluation,
        feedback: evaluation === 'PASSED' 
          ? 'Kandidat lolos technical test' 
          : 'Kandidat tidak lolos technical test'
      };
      
      // Update technical test first
      await technicalTestService.updateTechnicalTest(technicalTest.uuid, updateData);
      
      // Update application status - use ACCEPTED instead of ON_JOB for backend compatibility
      const newStatus = evaluation === 'PASSED' ? 'ACCEPTED' : 'REJECTED';
      await jobApplicationService.updateApplicationStatus(applicationId, {
        status: newStatus,
        notes: evaluation === 'PASSED' 
          ? 'Kandidat diterima untuk bekerja' 
          : 'Kandidat tidak lulus technical test'
      });
      
      // Close dialog
      setConfirmationOpen(false);
      setProcessingDecision(false);
      
      // Navigate to application summary page with clear status
      navigate(`/recruiter/candidate-detail/${applicationId}`, { 
        state: { 
          evaluationComplete: true,
          evaluationResult: evaluation 
        }
      });
      
    } catch (error) {
      console.error('Error updating decision:', error);
      setConfirmationError('Gagal memproses keputusan. Silakan coba lagi.');
      setProcessingDecision(false);
    }
  };

  // Function to handle reset evaluation
  const handleResetEvaluation = async () => {
    setResetConfirmOpen(true);
  };
  
  const confirmResetEvaluation = async () => {
    try {
      setResetting(true);
      
      // Reset the technical test result
      await technicalTestService.updateTechnicalTest(technicalTest.uuid, {
        result: null,
        feedback: null
      });
      
      // Change application status back to TECHNICAL_TEST
      await jobApplicationService.updateApplicationStatus(applicationId, {
        status: 'TECHNICAL_TEST',
        notes: 'Reset evaluasi technical test untuk penilaian ulang'
      });
      
      // Reload the page to show updated status
      window.location.reload();
    } catch (error) {
      console.error('Error resetting evaluation:', error);
      window.dispatchEvent(new CustomEvent('SHOW_NOTIFICATION', {
        detail: { message: 'Gagal mereset evaluasi', severity: 'error' }
      }));
    } finally {
      setResetting(false);
      setResetConfirmOpen(false);
    }
  };
  
  const closeResetDialog = () => {
    setResetConfirmOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/recruiter/dashboard')}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Progress Stepper */}
      <Stepper activeStep={activeStep}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 3 }}
        >
          Kembali
        </Button>
        
        <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
          Technical Test Preview
        </Typography>
        
        {/* Candidate Info Card */}
        <Paper elevation={3} sx={{ mb: 3, p: 0, borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ bgcolor: '#182f5d', p: 2, color: 'white' }}>
            <Typography variant="h6" fontWeight="bold">
              {application?.nama_ktp || 'Candidate Name'}
            </Typography>
            <Typography variant="body2">
              {application?.jobPostingId?.jobPosition || application?.posisi_dilamar || 'Position'}
            </Typography>
          </Box>
          
          <Box p={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Email</Typography>
                <Typography variant="body1" gutterBottom fontWeight="medium">
                  {application?.email || '-'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Phone</Typography>
                <Typography variant="body1" gutterBottom fontWeight="medium">
                  {application?.no_hp || '-'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Paper>
        
        {/* Technical Test Details */}
        {technicalTest ? (
          <Paper elevation={3} sx={{ mb: 3, p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Technical Test Detail
              </Typography>
              <Button
                startIcon={<EditIcon />}
                onClick={handleEditTest}
                size="small"
              >
                Edit
              </Button>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            {/* Test Status Alert */}
            {technicalTest.candidateHasCompleted ? (
              <Alert 
                severity="success" 
                sx={{ 
                  mb: 3,
                  backgroundColor: theme.palette.success.light,
                  color: theme.palette.success.contrastText
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  Kandidat sudah mengerjakan technical test, harap periksa jawaban atau file submisi
                </Typography>
              </Alert>
            ) : (
              <Alert 
                severity="info" 
                sx={{ 
                  mb: 3,
                  backgroundColor: theme.palette.info.light,
                  color: theme.palette.info.contrastText
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  Menunggu submisi kandidat
                </Typography>
              </Alert>
            )}
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" fontWeight="bold">Deadline</Typography>
                    <Typography variant="body2">
                      {technicalTest.dateScheduled 
                        ? format(new Date(technicalTest.dateScheduled), 'dd MMMM yyyy')
                        : '-'
                      }
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LinkIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" fontWeight="bold">Link Test</Typography>
                    <Typography variant="body2">
                      {technicalTest.testLink ? (
                        <a 
                          href={technicalTest.testLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: theme.palette.primary.main }}
                        >
                          {technicalTest.testLink}
                        </a>
                      ) : '-'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Deskripsi
              </Typography>
              <Typography variant="body2" paragraph>
                {technicalTest.description}
              </Typography>
              
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Instruksi
              </Typography>
              <Typography variant="body2" paragraph>
                {technicalTest.instructions || '-'}
              </Typography>
            </Box>
            
            {/* Submission Details */}
            {technicalTest.submissionFile && (
              <Box sx={{ 
                mt: 3, 
                p: 3, 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(50, 205, 50, 0.1)' : 'rgba(76, 175, 80, 0.1)', 
                borderRadius: 2, 
                border: '1px solid', 
                borderColor: theme.palette.success.main
              }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: theme.palette.success.main }}>
                  File Submisi Kandidat
                </Typography>
                
                <Divider sx={{ mb: 2 }}/>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <InfoIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                      <Typography variant="subtitle1" fontWeight="medium">
                        Detail Submisi
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" fontWeight="bold">Nama File:</Typography>
                    <Typography variant="body2">
                      {technicalTest.submissionFile.split('/').pop() || 'File Jawaban'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" fontWeight="bold">Waktu Submisi:</Typography>
                    <Typography variant="body2">
                      {technicalTest.submissionDate ? format(new Date(technicalTest.submissionDate), 'dd MMMM yyyy HH:mm') : '-'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="body2" fontWeight="bold">Catatan dari Kandidat:</Typography>
                    <Box sx={{ 
                      mt: 1, 
                      p: 2, 
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.7)',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
                    }}>
                      <Typography variant="body2">
                        {technicalTest.submissionNotes || 'Kandidat tidak memberikan catatan tambahan'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    component="a"
                    href={technicalTest.submissionFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="large"
                    sx={{ px: 4 }}
                  >
                    Lihat File Submisi
                  </Button>
                </Box>
              </Box>
            )}

            {/* Evaluation Section (only show if test is completed) */}
            {technicalTest.candidateHasCompleted && (!technicalTest.result || technicalTest.result === 'PENDING') && (
              <Box sx={{ mt: 4, p: 3, border: '1px dashed', borderColor: 'primary.main', borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Evaluasi Technical Test
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 3 }}>
                  Tentukan keputusan untuk kandidat ini berdasarkan performa technical test. Pilih "Lolos" atau "Ditolak" dari dropdown di bawah.
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel id="evaluation-select-label">Keputusan</InputLabel>
                  <Select
                    labelId="evaluation-select-label"
                    id="evaluation-select"
                    value={evaluation}
                    label="Keputusan"
                    onChange={handleEvaluationChange}
                  >
                    <MenuItem value="">- Pilih keputusan -</MenuItem>
                    <MenuItem value="PASSED">Lolos</MenuItem>
                    <MenuItem value="FAILED">Ditolak</MenuItem>
                  </Select>
                </FormControl>
                
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!evaluation}
                    onClick={handleOpenConfirmation}
                  >
                    {evaluation ? 'Konfirmasi Keputusan' : 'Evaluasi Test'}
                  </Button>
                </Box>
              </Box>
            )}

            {/* Show readonly result if already evaluated */}
            {technicalTest.result && technicalTest.result !== 'PENDING' && (
              <Box sx={{ 
                mt: 4, 
                p: 3, 
                bgcolor: technicalTest.result === 'PASSED' 
                  ? 'rgba(76, 175, 80, 0.1)' 
                  : 'rgba(244, 67, 54, 0.1)',
                border: '1px solid',
                borderColor: technicalTest.result === 'PASSED' 
                  ? theme.palette.success.main 
                  : theme.palette.error.main,
                borderRadius: 2
              }}>
                <Typography 
                  variant="h6" 
                  fontWeight="bold" 
                  gutterBottom
                  sx={{ 
                    color: technicalTest.result === 'PASSED' 
                      ? theme.palette.success.main 
                      : theme.palette.error.main 
                  }}
                >
                  Hasil Evaluasi: {technicalTest.result === 'PASSED' ? 'Lolos' : 'Ditolak'}
                </Typography>
                
                <Typography variant="body2" paragraph>
                  {technicalTest.feedback || (technicalTest.result === 'PASSED' 
                    ? 'Kandidat lolos technical test' 
                    : 'Kandidat tidak lolos technical test'
                  )}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<RestartAltIcon />}
                    onClick={handleResetEvaluation}
                  >
                    Reset Evaluasi
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        ) : (
          <Paper elevation={3} sx={{ mb: 3, p: 3, borderRadius: 2 }}>
            <Alert 
              severity="error"
              sx={{ mb: 3 }}
            >
              <Typography variant="subtitle2" fontWeight="bold">
                Belum memberikan rincian Technical Test, perlu tindak lanjut
              </Typography>
            </Alert>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateTest}
              >
                Buat Technical Test untuk peserta ini
              </Button>
            </Box>
          </Paper>
        )}
        
        {/* Action Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={handleBack}
          >
            Kembali
          </Button>
        </Box>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={confirmationOpen} onClose={handleCloseConfirmation}>
        <DialogTitle>
          Konfirmasi Keputusan {evaluation === 'PASSED' ? 'Lolos' : 'Ditolak'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Anda akan {evaluation === 'PASSED' ? 'menerima' : 'menolak'} kandidat ini. Tindakan ini akan {evaluation === 'PASSED' ? 'mengubah status kandidat menjadi On Job' : 'menolak kandidat dan tidak dapat diubah'}.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
            Untuk konfirmasi, ketik "{evaluation === 'PASSED' ? 'Lolos' : 'Ditolak'}" di bawah ini:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="confirmation"
            label="Konfirmasi"
            type="text"
            fullWidth
            variant="outlined"
            value={confirmationText}
            onChange={handleConfirmationTextChange}
            error={!!confirmationError}
            helperText={confirmationError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmation} disabled={processingDecision}>
            Batal
          </Button>
          <Button 
            onClick={handleConfirmDecision} 
            variant="contained" 
            color={evaluation === 'PASSED' ? 'success' : 'error'}
            disabled={processingDecision}
          >
            {processingDecision ? <CircularProgress size={24} /> : 'Konfirmasi'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetConfirmOpen} onClose={closeResetDialog}>
        <DialogTitle>Reset Evaluasi Technical Test</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apakah Anda yakin ingin mereset evaluasi technical test ini? Status kandidat akan dikembalikan ke "Technical Test" dan Anda dapat melakukan evaluasi ulang.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeResetDialog} disabled={resetting}>
            Batal
          </Button>
          <Button 
            onClick={confirmResetEvaluation} 
            variant="contained" 
            color="warning"
            disabled={resetting}
          >
            {resetting ? <CircularProgress size={24} /> : 'Reset Evaluasi'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TechnicalTestPreview; 