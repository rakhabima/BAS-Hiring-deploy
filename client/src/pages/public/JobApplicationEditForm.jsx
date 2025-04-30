import { ArrowBack, CloudUpload } from '@mui/icons-material';
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
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobApplicationService } from '../../services/api';

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

const JobApplicationEditForm = () => {
  const navigate = useNavigate();
  const { uuid } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [application, setApplication] = useState(null);
  const theme = useTheme();
  const [formData, setFormData] = useState({
    nama_ktp: '',
    nik: '',
    jenis_kelamin: '',
    tanggal_lahir: null,
    agama: '',
    foto_diri: null,
    foto_ktp: null,
    foto_sim: null,
    foto_stnk_hal_1: null,
    foto_stnk_hal_2: null,
    foto_ijazah: null
  });
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        setLoading(true);
        const response = await jobApplicationService.getApplicationById(uuid);
        setApplication(response.data);
        
        // Set form data from application
        setFormData({
          nama_ktp: response.data.nama_ktp || '',
          nik: response.data.nik || '',
          jenis_kelamin: response.data.jenis_kelamin || '',
          tanggal_lahir: response.data.tanggal_lahir ? new Date(response.data.tanggal_lahir) : null,
          agama: response.data.agama || '',
          foto_diri: null,
          foto_ktp: null,
          foto_sim: null,
          foto_stnk_hal_1: null,
          foto_stnk_hal_2: null,
          foto_ijazah: null
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching application details:', err);
        setError('Gagal memuat detail lamaran. Silakan coba lagi nanti.');
        setLoading(false);
      }
    };

    if (uuid) {
      fetchApplicationDetails();
    }
  }, [uuid]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, tanggal_lahir: date });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData({ ...formData, [name]: files[0] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Update application with revised data
      await jobApplicationService.updateApplication(uuid, formData);
      
      // Open success dialog
      setOpenDialog(true);
      setSubmitting(false);
    } catch (err) {
      console.error('Error updating application:', err);
      setError('Gagal memperbarui lamaran. Silakan coba lagi.');
      setSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    navigate('/candidate/portal-informasi');
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
      <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 5, px: 2 }}>
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
      <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 5, px: 2 }}>
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

  if (application.status !== 'REVISION') {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 5, px: 2 }}>
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
          Lamaran ini tidak dalam status revisi dan tidak dapat diedit
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
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <IconButton 
          aria-label="back" 
          onClick={() => navigate('/candidate/portal-informasi')} 
          sx={{ 
            mb: 2,
            color: theme.palette.mode === 'dark' ? theme.palette.primary.light : undefined 
          }}
        >
          <ArrowBack />
        </IconButton>
        
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
          }}
        >
          Edit Formulir Lamaran
        </Typography>
        
        <Typography 
          variant="subtitle1" 
          color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}
          sx={{ mb: 4 }}
        >
          Perbaiki data lamaran Anda sesuai dengan catatan dari tim rekrutmen
        </Typography>
        
        {application.notes && (
          <Alert 
            severity="info" 
            sx={{ 
              mb: 4,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.15)' : undefined,
              color: theme.palette.mode === 'dark' ? theme.palette.info.light : undefined,
              '& .MuiAlert-icon': {
                color: theme.palette.mode === 'dark' ? theme.palette.info.light : undefined
              }
            }}
          >
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: theme.palette.mode === 'dark' ? theme.palette.info.light : undefined,
                fontWeight: 'bold'
              }}
            >
              Catatan Tim Rekrutmen:
            </Typography>
            <Typography 
              variant="body2"
              sx={{ 
                mt: 1,
                color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
              }}
            >
              {application.notes}
            </Typography>
          </Alert>
        )}
        
        <Paper 
          elevation={2} 
          sx={{ 
            p: 4,
            bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : undefined,
            border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none'
          }}
        >
          <form onSubmit={handleSubmit}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2,
                color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
              }}
            >
              Informasi Pribadi
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nama Lengkap (sesuai KTP)"
                  name="nama_ktp"
                  value={formData.nama_ktp}
                  onChange={handleInputChange}
                  required
                  sx={{
                    '& .MuiInputLabel-root': {
                      color: theme.palette.mode === 'dark' ? theme.palette.text.secondary : undefined
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? theme.palette.divider : undefined
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? theme.palette.action.hover : undefined
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : undefined
                      },
                      '& input': {
                        color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
                      }
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="NIK"
                  name="nik"
                  value={formData.nik}
                  onChange={handleInputChange}
                  required
                  inputProps={{ maxLength: 16 }}
                  sx={{
                    '& .MuiInputLabel-root': {
                      color: theme.palette.mode === 'dark' ? theme.palette.text.secondary : undefined
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? theme.palette.divider : undefined
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? theme.palette.action.hover : undefined
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : undefined
                      },
                      '& input': {
                        color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
                      }
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl 
                  fullWidth 
                  required
                  sx={{
                    '& .MuiInputLabel-root': {
                      color: theme.palette.mode === 'dark' ? theme.palette.text.secondary : undefined
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? theme.palette.divider : undefined
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? theme.palette.action.hover : undefined
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : undefined
                      }
                    },
                    '& .MuiSelect-select': {
                      color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
                    }
                  }}
                >
                  <InputLabel id="gender-label">Jenis Kelamin</InputLabel>
                  <Select
                    labelId="gender-label"
                    label="Jenis Kelamin"
                    name="jenis_kelamin"
                    value={formData.jenis_kelamin}
                    onChange={handleInputChange}
                  >
                    <MenuItem value="Laki - Laki">Laki - Laki</MenuItem>
                    <MenuItem value="Perempuan">Perempuan</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Tanggal Lahir"
                    value={formData.tanggal_lahir}
                    onChange={handleDateChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        sx: {
                          '& .MuiInputLabel-root': {
                            color: theme.palette.mode === 'dark' ? theme.palette.text.secondary : undefined
                          },
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: theme.palette.mode === 'dark' ? theme.palette.divider : undefined
                            },
                            '&:hover fieldset': {
                              borderColor: theme.palette.mode === 'dark' ? theme.palette.action.hover : undefined
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : undefined
                            },
                            '& input': {
                              color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
                            }
                          }
                        }
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl 
                  fullWidth 
                  required
                  sx={{
                    '& .MuiInputLabel-root': {
                      color: theme.palette.mode === 'dark' ? theme.palette.text.secondary : undefined
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? theme.palette.divider : undefined
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? theme.palette.action.hover : undefined
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : undefined
                      }
                    },
                    '& .MuiSelect-select': {
                      color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
                    }
                  }}
                >
                  <InputLabel id="religion-label">Agama</InputLabel>
                  <Select
                    labelId="religion-label"
                    label="Agama"
                    name="agama"
                    value={formData.agama}
                    onChange={handleInputChange}
                  >
                    <MenuItem value="Islam">Islam</MenuItem>
                    <MenuItem value="Kristen">Kristen</MenuItem>
                    <MenuItem value="Katolik">Katolik</MenuItem>
                    <MenuItem value="Hindu">Hindu</MenuItem>
                    <MenuItem value="Buddha">Buddha</MenuItem>
                    <MenuItem value="Konghucu">Konghucu</MenuItem>
                    <MenuItem value="Lainnya">Lainnya</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 4 }} />
            
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2,
                color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
              }}
            >
              Dokumen
            </Typography>
            
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 3,
                color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
              }}
            >
              Silakan unggah ulang dokumen yang perlu diperbaiki
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <Box 
                  sx={{ 
                    p: 3, 
                    border: `1px dashed ${theme.palette.mode === 'dark' ? theme.palette.divider : '#e0e0e0'}`, 
                    borderRadius: 1,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(66, 66, 66, 0.6)' : '#f9f9f9'
                  }}
                >
                  <Typography 
                    variant="subtitle2" 
                    align="center" 
                    gutterBottom
                    sx={{ 
                      color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
                    }}
                  >
                    Foto Diri
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    {application.foto_diri && (
                      <img 
                        src={application.foto_diri} 
                        alt="Foto Diri" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100px', 
                          objectFit: 'contain',
                          marginBottom: '8px',
                          border: theme.palette.mode === 'dark' ? '1px solid #555' : 'none'
                        }} 
                      />
                    )}
                  </Box>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    fullWidth
                    sx={{
                      color: theme.palette.mode === 'dark' ? theme.palette.primary.light : undefined,
                      borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.light : undefined,
                      '&:hover': {
                        borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : undefined,
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.1)' : undefined
                      }
                    }}
                  >
                    Unggah Foto Baru
                    <VisuallyHiddenInput type="file" name="foto_diri" onChange={handleFileChange} />
                  </Button>
                  {formData.foto_diri && (
                    <Typography 
                      variant="caption" 
                      display="block" 
                      align="center" 
                      sx={{ 
                        mt: 1,
                        color: theme.palette.mode === 'dark' ? theme.palette.text.secondary : undefined
                      }}
                    >
                      {formData.foto_diri.name}
                    </Typography>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Box 
                  sx={{ 
                    p: 3, 
                    border: `1px dashed ${theme.palette.mode === 'dark' ? theme.palette.divider : '#e0e0e0'}`, 
                    borderRadius: 1,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(66, 66, 66, 0.6)' : '#f9f9f9'
                  }}
                >
                  <Typography 
                    variant="subtitle2" 
                    align="center" 
                    gutterBottom
                    sx={{ 
                      color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
                    }}
                  >
                    Foto KTP
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    {application.foto_ktp && (
                      <img 
                        src={application.foto_ktp} 
                        alt="Foto KTP" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100px', 
                          objectFit: 'contain',
                          marginBottom: '8px',
                          border: theme.palette.mode === 'dark' ? '1px solid #555' : 'none'
                        }} 
                      />
                    )}
                  </Box>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    fullWidth
                    sx={{
                      color: theme.palette.mode === 'dark' ? theme.palette.primary.light : undefined,
                      borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.light : undefined,
                      '&:hover': {
                        borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : undefined,
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.1)' : undefined
                      }
                    }}
                  >
                    Unggah Foto Baru
                    <VisuallyHiddenInput type="file" name="foto_ktp" onChange={handleFileChange} />
                  </Button>
                  {formData.foto_ktp && (
                    <Typography 
                      variant="caption" 
                      display="block" 
                      align="center" 
                      sx={{ 
                        mt: 1,
                        color: theme.palette.mode === 'dark' ? theme.palette.text.secondary : undefined
                      }}
                    >
                      {formData.foto_ktp.name}
                    </Typography>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Box 
                  sx={{ 
                    p: 3, 
                    border: `1px dashed ${theme.palette.mode === 'dark' ? theme.palette.divider : '#e0e0e0'}`, 
                    borderRadius: 1,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(66, 66, 66, 0.6)' : '#f9f9f9'
                  }}
                >
                  <Typography 
                    variant="subtitle2" 
                    align="center" 
                    gutterBottom
                    sx={{ 
                      color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
                    }}
                  >
                    Foto Ijazah
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    {application.foto_ijazah && (
                      <img 
                        src={application.foto_ijazah} 
                        alt="Foto Ijazah" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100px', 
                          objectFit: 'contain',
                          marginBottom: '8px',
                          border: theme.palette.mode === 'dark' ? '1px solid #555' : 'none'
                        }} 
                      />
                    )}
                  </Box>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    fullWidth
                    sx={{
                      color: theme.palette.mode === 'dark' ? theme.palette.primary.light : undefined,
                      borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.light : undefined,
                      '&:hover': {
                        borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : undefined,
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.1)' : undefined
                      }
                    }}
                  >
                    Unggah Foto Baru
                    <VisuallyHiddenInput type="file" name="foto_ijazah" onChange={handleFileChange} />
                  </Button>
                  {formData.foto_ijazah && (
                    <Typography 
                      variant="caption" 
                      display="block" 
                      align="center" 
                      sx={{ 
                        mt: 1,
                        color: theme.palette.mode === 'dark' ? theme.palette.text.secondary : undefined
                      }}
                    >
                      {formData.foto_ijazah.name}
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                type="button" 
                onClick={() => navigate('/candidate/portal-informasi')} 
                sx={{ 
                  mr: 2,
                  color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined 
                }}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={24} /> : 'Simpan Perubahan'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
      
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>
          Perubahan Berhasil Disimpan
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.secondary : undefined }}>
            Lamaran Anda telah berhasil diperbarui dan akan segera ditinjau oleh tim rekrutmen kami.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} autoFocus>
            Kembali ke Portal Informasi
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default JobApplicationEditForm; 