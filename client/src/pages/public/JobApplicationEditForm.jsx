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
import axios from 'axios';
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
    foto_ijazah: null,
    tipe_sim: '',
    no_sim: '',
    masa_berlaku_sim: null,
    merk_kendaraan: '',
    tahun_produksi_kendaraan: '',
    no_pol_kendaraan: '',
    no_stnk: '',
    masa_berlaku_stnk: null,
    masa_berlaku_pajak_kendaraan: null
  });
  const [uploadedFiles, setUploadedFiles] = useState({
    foto_diri: false,
    foto_ktp: false,
    foto_sim: false,
    foto_stnk_hal_1: false,
    foto_stnk_hal_2: false,
    foto_ijazah: false
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
          foto_ijazah: null,
          tipe_sim: response.data.tipe_sim || '',
          no_sim: response.data.no_sim || '',
          masa_berlaku_sim: response.data.masa_berlaku_sim ? new Date(response.data.masa_berlaku_sim) : null,
          merk_kendaraan: response.data.merk_kendaraan || '',
          tahun_produksi_kendaraan: response.data.tahun_produksi_kendaraan || '',
          no_pol_kendaraan: response.data.no_pol_kendaraan || '',
          no_stnk: response.data.no_stnk || '',
          masa_berlaku_stnk: response.data.masa_berlaku_stnk ? new Date(response.data.masa_berlaku_stnk) : null,
          masa_berlaku_pajak_kendaraan: response.data.masa_berlaku_pajak_kendaraan ? new Date(response.data.masa_berlaku_pajak_kendaraan) : null
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
      setUploadedFiles({ ...uploadedFiles, [name]: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Verify application is in REVISION status before proceeding
      if (application.status !== 'REVISION') {
        setError('Lamaran tidak dalam status revisi. Status saat ini: ' + application.status);
        setSubmitting(false);
        return;
      }
      
      // Log what we're submitting for debugging
      console.log('Submitting updated form data:', formData);
      console.log('Files to upload:', uploadedFiles);
      
      // Prepare data in the same format that the API service expects
      // Create a new FormData object directly here instead of relying on the API service
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append('nama_ktp', formData.nama_ktp || '');
      formDataToSend.append('nik', formData.nik || '');
      formDataToSend.append('jenis_kelamin', formData.jenis_kelamin || '');
      formDataToSend.append('tanggal_lahir', formData.tanggal_lahir ? formData.tanggal_lahir.toISOString() : '');
      formDataToSend.append('agama', formData.agama || '');
      
      // Vehicle info fields
      formDataToSend.append('tipe_sim', formData.tipe_sim || 'Tidak Punya');
      formDataToSend.append('no_sim', formData.no_sim || '');
      formDataToSend.append('masa_berlaku_sim', formData.masa_berlaku_sim ? formData.masa_berlaku_sim.toISOString() : 'null');
      formDataToSend.append('merk_kendaraan', formData.merk_kendaraan || '');
      formDataToSend.append('tahun_produksi_kendaraan', formData.tahun_produksi_kendaraan || '');
      formDataToSend.append('no_pol_kendaraan', formData.no_pol_kendaraan || '');
      formDataToSend.append('no_stnk', formData.no_stnk || '');
      formDataToSend.append('masa_berlaku_stnk', formData.masa_berlaku_stnk ? formData.masa_berlaku_stnk.toISOString() : 'null');
      formDataToSend.append('masa_berlaku_pajak_kendaraan', formData.masa_berlaku_pajak_kendaraan ? formData.masa_berlaku_pajak_kendaraan.toISOString() : 'null');
      
      // Critical: Set status back to REVIEWING to indicate revision is complete
      formDataToSend.append('status', 'REVIEWING');
      
      // Add file uploads
      if (formData.foto_diri instanceof File) {
        formDataToSend.append('foto_diri', formData.foto_diri);
        console.log('Adding foto_diri file to upload');
      }
      
      if (formData.foto_ktp instanceof File) {
        formDataToSend.append('foto_ktp', formData.foto_ktp);
        console.log('Adding foto_ktp file to upload');
      }
      
      if (formData.foto_sim instanceof File) {
        formDataToSend.append('foto_sim', formData.foto_sim);
        console.log('Adding foto_sim file to upload');
      }
      
      if (formData.foto_stnk_hal_1 instanceof File) {
        formDataToSend.append('foto_stnk_hal_1', formData.foto_stnk_hal_1);
        console.log('Adding foto_stnk_hal_1 file to upload');
      }
      
      if (formData.foto_stnk_hal_2 instanceof File) {
        formDataToSend.append('foto_stnk_hal_2', formData.foto_stnk_hal_2);
        console.log('Adding foto_stnk_hal_2 file to upload');
      }
      
      if (formData.foto_ijazah instanceof File) {
        formDataToSend.append('foto_ijazah', formData.foto_ijazah);
        console.log('Adding foto_ijazah file to upload');
      }
      
      // Directly use the API endpoint
      const api = axios.create({
        baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
        withCredentials: true,
      });
      
      console.log(`Sending update to /jobApplication/${uuid}/update`);
      
      const response = await api.put(`/jobApplication/${uuid}/update`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Update response:', response.data);
      
      // After successful update, redirect the user
      setOpenDialog(true);
      setSubmitting(false);
      
    } catch (err) {
      console.error('Error updating application:', err);
      setError(`Gagal memperbarui lamaran: ${err.response?.data?.message || err.message}`);
      setSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    // Always redirect to portal-informasi after successful submission
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
          Lamaran ini tidak dalam status revisi dan tidak dapat diedit. Status saat ini: {application.status === 'REVIEWING' ? 'Menunggu Verifikasi' : application.status}
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
              Informasi Kendaraan
            </Typography>
            
            <Typography 
              variant="body2"
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              Informasi kendaraan terutama wajib untuk posisi kurir. Silakan perbaiki data kendaraan jika diperlukan.
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl 
                  fullWidth
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
                  <InputLabel id="tipe-sim-label">Tipe SIM</InputLabel>
                  <Select
                    labelId="tipe-sim-label"
                    label="Tipe SIM"
                    name="tipe_sim"
                    value={formData.tipe_sim || ''}
                    onChange={handleInputChange}
                  >
                    <MenuItem value="Tidak Punya">Tidak Punya</MenuItem>
                    <MenuItem value="SIM A">SIM A</MenuItem>
                    <MenuItem value="SIM B1">SIM B1</MenuItem>
                    <MenuItem value="SIM B2">SIM B2</MenuItem>
                    <MenuItem value="SIM C">SIM C</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nomor SIM"
                  name="no_sim"
                  value={formData.no_sim || ''}
                  onChange={handleInputChange}
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
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Masa Berlaku SIM"
                    value={formData.masa_berlaku_sim ? new Date(formData.masa_berlaku_sim) : null}
                    onChange={(date) => setFormData({...formData, masa_berlaku_sim: date})}
                    slotProps={{
                      textField: {
                        fullWidth: true,
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
                <TextField
                  fullWidth
                  label="Jenis & Merk Kendaraan"
                  name="merk_kendaraan"
                  value={formData.merk_kendaraan || ''}
                  onChange={handleInputChange}
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
                  label="Tahun Pembuatan Kendaraan"
                  name="tahun_produksi_kendaraan"
                  value={formData.tahun_produksi_kendaraan || ''}
                  onChange={handleInputChange}
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
                  label="Nomor Polisi Kendaraan"
                  name="no_pol_kendaraan"
                  value={formData.no_pol_kendaraan || ''}
                  onChange={handleInputChange}
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
                  label="Nomor STNK"
                  name="no_stnk"
                  value={formData.no_stnk || ''}
                  onChange={handleInputChange}
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
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Masa Berlaku STNK"
                    value={formData.masa_berlaku_stnk ? new Date(formData.masa_berlaku_stnk) : null}
                    onChange={(date) => setFormData({...formData, masa_berlaku_stnk: date})}
                    slotProps={{
                      textField: {
                        fullWidth: true,
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
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Masa Berlaku Pajak Kendaraan"
                    value={formData.masa_berlaku_pajak_kendaraan ? new Date(formData.masa_berlaku_pajak_kendaraan) : null}
                    onChange={(date) => setFormData({...formData, masa_berlaku_pajak_kendaraan: date})}
                    slotProps={{
                      textField: {
                        fullWidth: true,
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
                    {application.foto_diri && !uploadedFiles.foto_diri && (
                      <img 
                        src={`${application.foto_diri}?t=${new Date().getTime()}`} 
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
                    {uploadedFiles.foto_diri && formData.foto_diri && (
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="primary">
                          Foto baru dipilih
                        </Typography>
                        <Typography variant="body2">
                          {formData.foto_diri.name}
                        </Typography>
                      </Box>
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
                    {uploadedFiles.foto_diri ? 'Ganti Foto' : 'Unggah Foto Baru'}
                    <VisuallyHiddenInput type="file" name="foto_diri" accept="image/*" onChange={handleFileChange} />
                  </Button>
                  {uploadedFiles.foto_diri && formData.foto_diri && (
                    <Button 
                      size="small" 
                      color="error" 
                      onClick={() => {
                        setFormData({...formData, foto_diri: null});
                        setUploadedFiles({...uploadedFiles, foto_diri: false});
                      }}
                      sx={{ mt: 1, width: '100%' }}
                    >
                      Batal
                    </Button>
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
                    {application.foto_ktp && !uploadedFiles.foto_ktp && (
                      <img 
                        src={`${application.foto_ktp}?t=${new Date().getTime()}`} 
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
                    {uploadedFiles.foto_ktp && formData.foto_ktp && (
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="primary">
                          Foto baru dipilih
                        </Typography>
                        <Typography variant="body2">
                          {formData.foto_ktp.name}
                        </Typography>
                      </Box>
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
                    {uploadedFiles.foto_ktp ? 'Ganti Foto' : 'Unggah Foto Baru'}
                    <VisuallyHiddenInput type="file" name="foto_ktp" accept="image/*" onChange={handleFileChange} />
                  </Button>
                  {uploadedFiles.foto_ktp && formData.foto_ktp && (
                    <Button 
                      size="small" 
                      color="error" 
                      onClick={() => {
                        setFormData({...formData, foto_ktp: null});
                        setUploadedFiles({...uploadedFiles, foto_ktp: false});
                      }}
                      sx={{ mt: 1, width: '100%' }}
                    >
                      Batal
                    </Button>
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
                    {application.foto_ijazah && !uploadedFiles.foto_ijazah && (
                      <img 
                        src={`${application.foto_ijazah}?t=${new Date().getTime()}`} 
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
                    {uploadedFiles.foto_ijazah && formData.foto_ijazah && (
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="primary">
                          Foto baru dipilih
                        </Typography>
                        <Typography variant="body2">
                          {formData.foto_ijazah.name}
                        </Typography>
                      </Box>
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
                    {uploadedFiles.foto_ijazah ? 'Ganti Foto' : 'Unggah Foto Baru'}
                    <VisuallyHiddenInput type="file" name="foto_ijazah" accept="image/*" onChange={handleFileChange} />
                  </Button>
                  {uploadedFiles.foto_ijazah && formData.foto_ijazah && (
                    <Button 
                      size="small" 
                      color="error" 
                      onClick={() => {
                        setFormData({...formData, foto_ijazah: null});
                        setUploadedFiles({...uploadedFiles, foto_ijazah: false});
                      }}
                      sx={{ mt: 1, width: '100%' }}
                    >
                      Batal
                    </Button>
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
                    Foto SIM
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    {application.foto_sim && !uploadedFiles.foto_sim && (
                      <img 
                        src={`${application.foto_sim}?t=${new Date().getTime()}`} 
                        alt="Foto SIM" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100px', 
                          objectFit: 'contain',
                          marginBottom: '8px',
                          border: theme.palette.mode === 'dark' ? '1px solid #555' : 'none'
                        }} 
                      />
                    )}
                    {uploadedFiles.foto_sim && formData.foto_sim && (
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="primary">
                          Foto baru dipilih
                        </Typography>
                        <Typography variant="body2">
                          {formData.foto_sim.name}
                        </Typography>
                      </Box>
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
                    {uploadedFiles.foto_sim ? 'Ganti Foto' : 'Unggah Foto Baru'}
                    <VisuallyHiddenInput type="file" name="foto_sim" accept="image/*" onChange={handleFileChange} />
                  </Button>
                  {uploadedFiles.foto_sim && formData.foto_sim && (
                    <Button 
                      size="small" 
                      color="error" 
                      onClick={() => {
                        setFormData({...formData, foto_sim: null});
                        setUploadedFiles({...uploadedFiles, foto_sim: false});
                      }}
                      sx={{ mt: 1, width: '100%' }}
                    >
                      Batal
                    </Button>
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
                    Foto STNK (Halaman 1)
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    {application.foto_stnk_hal_1 && !uploadedFiles.foto_stnk_hal_1 && (
                      <img 
                        src={`${application.foto_stnk_hal_1}?t=${new Date().getTime()}`} 
                        alt="Foto STNK Halaman 1" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100px', 
                          objectFit: 'contain',
                          marginBottom: '8px',
                          border: theme.palette.mode === 'dark' ? '1px solid #555' : 'none'
                        }} 
                      />
                    )}
                    {uploadedFiles.foto_stnk_hal_1 && formData.foto_stnk_hal_1 && (
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="primary">
                          Foto baru dipilih
                        </Typography>
                        <Typography variant="body2">
                          {formData.foto_stnk_hal_1.name}
                        </Typography>
                      </Box>
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
                    {uploadedFiles.foto_stnk_hal_1 ? 'Ganti Foto' : 'Unggah Foto Baru'}
                    <VisuallyHiddenInput type="file" name="foto_stnk_hal_1" accept="image/*" onChange={handleFileChange} />
                  </Button>
                  {uploadedFiles.foto_stnk_hal_1 && formData.foto_stnk_hal_1 && (
                    <Button 
                      size="small" 
                      color="error" 
                      onClick={() => {
                        setFormData({...formData, foto_stnk_hal_1: null});
                        setUploadedFiles({...uploadedFiles, foto_stnk_hal_1: false});
                      }}
                      sx={{ mt: 1, width: '100%' }}
                    >
                      Batal
                    </Button>
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
                    Foto STNK (Halaman 2)
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    {application.foto_stnk_hal_2 && !uploadedFiles.foto_stnk_hal_2 && (
                      <img 
                        src={`${application.foto_stnk_hal_2}?t=${new Date().getTime()}`} 
                        alt="Foto STNK Halaman 2" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100px', 
                          objectFit: 'contain',
                          marginBottom: '8px',
                          border: theme.palette.mode === 'dark' ? '1px solid #555' : 'none'
                        }} 
                      />
                    )}
                    {uploadedFiles.foto_stnk_hal_2 && formData.foto_stnk_hal_2 && (
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="primary">
                          Foto baru dipilih
                        </Typography>
                        <Typography variant="body2">
                          {formData.foto_stnk_hal_2.name}
                        </Typography>
                      </Box>
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
                    {uploadedFiles.foto_stnk_hal_2 ? 'Ganti Foto' : 'Unggah Foto Baru'}
                    <VisuallyHiddenInput type="file" name="foto_stnk_hal_2" accept="image/*" onChange={handleFileChange} />
                  </Button>
                  {uploadedFiles.foto_stnk_hal_2 && formData.foto_stnk_hal_2 && (
                    <Button 
                      size="small" 
                      color="error" 
                      onClick={() => {
                        setFormData({...formData, foto_stnk_hal_2: null});
                        setUploadedFiles({...uploadedFiles, foto_stnk_hal_2: false});
                      }}
                      sx={{ mt: 1, width: '100%' }}
                    >
                      Batal
                    </Button>
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
            Lamaran Anda telah berhasil diperbarui dan status lamaran telah berubah menjadi "Menunggu Verifikasi". Tim rekrutmen kami akan segera memeriksa revisi yang Anda kirimkan.
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