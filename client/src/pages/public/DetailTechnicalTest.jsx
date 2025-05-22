import LinkIcon from '@mui/icons-material/Link';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Divider,
    FormControl,
    FormHelperText,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography,
    useTheme
} from '@mui/material';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobApplicationService, technicalTestService } from '../../services/api';

const DetailTechnicalTest = () => {
  const navigate = useNavigate();
  const { uuid } = useParams();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [application, setApplication] = useState(null);
  const [technicalTest, setTechnicalTest] = useState(null);
  
  // Form state
  const [file, setFile] = useState(null);
  const [completed, setCompleted] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch application details
        const appResponse = await jobApplicationService.getApplicationById(uuid);
        if (!appResponse || !appResponse.data) {
          setError('Application not found');
          setLoading(false);
          return;
        }
        
        setApplication(appResponse.data);
        
        // Fetch technical test details if available
        try {
          const testResponse = await technicalTestService.getTechnicalTestByApplicationId(uuid);
          if (testResponse && testResponse.data) {
            setTechnicalTest(testResponse.data);
            
            // Set completed status if available
            if (testResponse.data.candidateHasCompleted) {
              setCompleted('yes');
            }
          }
        } catch (testError) {
          console.log('Technical test not found for this application');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching application details:', err);
        setError('Failed to load application details. Please try again later.');
        setLoading(false);
      }
    };

    if (uuid) {
      fetchData();
    }
  }, [uuid]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setFormError('');
  };
  
  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };
  
  const handleCompletedChange = (e) => {
    setCompleted(e.target.value);
    setFormError('');
  };
  
  const handleSubmitFile = async () => {
    if (!file) {
      setFormError('Please select a file to upload');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('submissionFile', file);
      
      if (notes) {
        formData.append('notes', notes);
      }
      
      // Submit file
      const response = await technicalTestService.submitTechnicalTestResult(uuid, formData);
      
      // Refresh data
      const testResponse = await technicalTestService.getTechnicalTestByApplicationId(uuid);
      if (testResponse && testResponse.data) {
        setTechnicalTest(testResponse.data);
      }
      
      // Keep file info and just clear notes
      setNotes('');
      setSubmitting(false);
    } catch (err) {
      console.error('Error submitting file:', err);
      setFormError('Failed to submit file. Please try again.');
      setSubmitting(false);
    }
  };
  
  const handleMarkCompleted = async () => {
    if (completed !== 'yes') {
      setFormError('Please confirm that you have completed the test');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Mark as completed
      await technicalTestService.markTechnicalTestCompleted(uuid, notes);
      
      // Refresh data
      const testResponse = await technicalTestService.getTechnicalTestByApplicationId(uuid);
      if (testResponse && testResponse.data) {
        setTechnicalTest(testResponse.data);
      }
      
      // Clear form
      setNotes('');
      setSubmitting(false);
    } catch (err) {
      console.error('Error marking as completed:', err);
      setFormError('Failed to update status. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 5 }}>
        <Alert 
          severity="error"
          sx={{ 
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.15)' : undefined,
            color: theme.palette.mode === 'dark' ? theme.palette.error.light : undefined,
            '& .MuiAlert-icon': {
              color: theme.palette.mode === 'dark' ? theme.palette.error.light : undefined
            }
          }}
        >
          {error}
        </Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 3 }} 
          onClick={() => navigate('/candidate/portal-informasi')}
        >
          Kembali
        </Button>
      </Box>
    );
  }

  if (!application) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 5 }}>
        <Alert 
          severity="warning"
          sx={{ 
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 193, 7, 0.15)' : undefined,
            color: theme.palette.mode === 'dark' ? theme.palette.warning.light : undefined,
            '& .MuiAlert-icon': {
              color: theme.palette.mode === 'dark' ? theme.palette.warning.light : undefined
            }
          }}
        >
          Data aplikasi tidak ditemukan
        </Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 3 }} 
          onClick={() => navigate('/candidate/portal-informasi')}
        >
          Kembali
        </Button>
      </Box>
    );
  }

  if (!technicalTest) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 5 }}>
        <Alert 
          severity="info"
          sx={{ 
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.15)' : undefined,
            color: theme.palette.mode === 'dark' ? theme.palette.info.light : undefined,
            '& .MuiAlert-icon': {
              color: theme.palette.mode === 'dark' ? theme.palette.info.light : undefined
            }
          }}
        >
          Informasi Technical Test masih belum tersedia. Mohon tunggu beberapa saat lagi atau hubungi admin melalui office@bas-indonesia.com atau 0812-8032-2191
        </Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 3 }} 
          onClick={() => navigate('/candidate/portal-informasi')}
        >
          Kembali
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 5 }}>
      <Typography 
        variant="h4" 
        fontWeight="bold" 
        mb={3}
        sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
      >
        Detail Technical Test
      </Typography>
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3,
          bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : undefined,
          border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none'
        }}
      >
        <Typography 
          variant="subtitle1" 
          fontWeight="bold"
          sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
        >
          Deskripsi Test
        </Typography>
        <Typography 
          variant="body2"
          sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
        >
          {technicalTest.description}
        </Typography>
        
        <Typography 
          variant="subtitle1" 
          fontWeight="bold" 
          sx={{ 
            mt: 3,
            color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined 
          }}
        >
          Instruksi
        </Typography>
        <Typography 
          variant="body2"
          sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
        >
          {technicalTest.instructions}
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mt: 3,
          mb: 2,
          p: 2,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : '#f5f5f5',
          borderRadius: 1
        }}>
          <LinkIcon 
            sx={{ 
              mr: 2, 
              color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main 
            }} 
          />
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">
              Link Technical Test
            </Typography>
            <Typography variant="body2">
              <a 
                href={technicalTest.testLink} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main
                }}
              >
                {technicalTest.testLink}
              </a>
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ 
          mt: 3, 
          mb: 2,
          p: 2,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : '#f5f5f5',
          borderRadius: 1
        }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Deadline Pengumpulan
          </Typography>
          <Typography variant="body2">
            {format(new Date(technicalTest.dateScheduled), 'dd MMMM yyyy')}
          </Typography>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        {technicalTest.candidateHasCompleted ? (
          <Alert 
            severity="success"
            sx={{ 
              mb: 3,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.15)' : undefined,
              color: theme.palette.mode === 'dark' ? theme.palette.success.light : undefined,
              '& .MuiAlert-icon': {
                color: theme.palette.mode === 'dark' ? theme.palette.success.light : undefined
              }
            }}
          >
            <Typography variant="body2" fontWeight="bold">
              Anda telah menyelesaikan technical test ini
            </Typography>
          </Alert>
        ) : (
          <>
            <Typography 
              variant="subtitle1" 
              fontWeight="bold"
              sx={{ mb: 2, color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
            >
              Status Pengerjaan
            </Typography>
            
            <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
              <InputLabel id="completed-label">Sudah mengerjakan technical test?</InputLabel>
              <Select
                labelId="completed-label"
                value={completed}
                onChange={handleCompletedChange}
                label="Sudah mengerjakan technical test?"
              >
                <MenuItem value="">
                  <em>Pilih status</em>
                </MenuItem>
                <MenuItem value="yes">Sudah</MenuItem>
                <MenuItem value="no">Belum</MenuItem>
              </Select>
              <FormHelperText>
                Pilih "Sudah" jika Anda telah menyelesaikan technical test melalui link di atas
              </FormHelperText>
            </FormControl>
            
            <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
              <TextField
                label="Catatan (opsional)"
                multiline
                rows={3}
                value={notes}
                onChange={handleNotesChange}
                placeholder="Tambahkan catatan terkait pengerjaan technical test (opsional)"
              />
            </FormControl>
            
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="subtitle1" 
                fontWeight="bold"
                sx={{ mb: 2, color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
              >
                Upload Jawaban (Opsional)
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Jika diminta untuk mengupload jawaban, silakan upload file jawaban Anda di sini. Format yang didukung: PDF, DOC, DOCX, JPG, PNG.
              </Typography>
              <Button 
                variant="outlined" 
                component="label" 
                sx={{ 
                  mr: 2,
                  color: theme.palette.mode === 'dark' ? theme.palette.primary.light : undefined,
                  borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.light : undefined,
                  '&:hover': {
                    borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : undefined,
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.1)' : undefined
                  }
                }}
              >
                Pilih File
                <input type="file" hidden onChange={handleFileChange} />
              </Button>
              {file && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mt: 1,
                    display: 'inline-block',
                    color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
                  }}
                >
                  {file.name}
                </Typography>
              )}
            </Box>
            
            {formError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {formError}
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              {file ? (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleSubmitFile}
                  disabled={submitting}
                >
                  {submitting ? <CircularProgress size={24} /> : 'Upload Jawaban'}
                </Button>
              ) : (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleMarkCompleted}
                  disabled={submitting || completed !== 'yes'}
                >
                  {submitting ? <CircularProgress size={24} /> : 'Konfirmasi Selesai'}
                </Button>
              )}
            </Box>
          </>
        )}

        {technicalTest.submissionFile && (
          <Box sx={{ 
            mt: 3, 
            p: 2, 
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : '#f5f5f5',
            borderRadius: 1,
            mb: 3
          }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              File yang telah diupload:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2">
                {technicalTest.submissionFile.split('/').pop() || 'File Jawaban'}
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                component="a"
                href={technicalTest.submissionFile}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ ml: 2 }}
              >
                Lihat File
              </Button>
            </Box>
            {technicalTest.submissionNotes && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="bold">Catatan:</Typography>
                <Typography variant="body2">
                  {technicalTest.submissionNotes}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      <Button 
        variant="contained" 
        sx={{ mt: 3 }} 
        onClick={() => navigate(`/candidate/portal-informasi/${uuid}`)}
      >
        Kembali
      </Button>
    </Box>
  );
};

export default DetailTechnicalTest;