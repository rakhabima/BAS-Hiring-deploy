import { ArrowBack } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    Divider,
    Grid,
    Paper,
    Typography,
    useTheme
} from '@mui/material';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobApplicationService } from '../../services/api';

const RingkasanFormulir = () => {
  const navigate = useNavigate();
  const { uuid } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [application, setApplication] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        setLoading(true);
        const response = await jobApplicationService.getApplicationById(uuid);
        setApplication(response.data);
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
  
  const handleBackToDetail = () => {
    navigate(`/candidate/portal-informasi/${uuid}`);
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
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
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
          onClick={handleBackToDetail}
        >Kembali</Button>
      </Container>
    );
  }
  
  if (!application) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
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
          onClick={handleBackToDetail}
        >Kembali</Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={handleBackToDetail}
        sx={{ 
          mb: 3,
          color: theme.palette.mode === 'dark' ? theme.palette.primary.light : undefined
        }}
      >
        Kembali ke Detail Lamaran
      </Button>
      
      <Typography 
        variant="h5" 
        fontWeight="bold" 
        gutterBottom
        sx={{ 
          color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
        }}
      >
        Ringkasan Formulir Lamaran
      </Typography>
      
      <Typography 
        variant="subtitle1" 
        color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'} 
        gutterBottom
      >
        {application.jobPostingId?.jobPosition || 'Posisi tidak tersedia'} - Submitted on {format(new Date(application.submissionDate), 'dd MMMM yyyy')}
      </Typography>
      
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          mt: 3,
          bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : undefined,
          border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none'
        }}
      >
        <Typography 
          variant="h6" 
          fontWeight="bold" 
          gutterBottom
          sx={{ 
            color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
          }}
        >
          Informasi Pribadi
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>Nama Lengkap</Typography>
            <Typography variant="body1" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>{application.nama_ktp}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>NIK</Typography>
            <Typography variant="body1" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>{application.nik}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>Jenis Kelamin</Typography>
            <Typography variant="body1" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>{application.jenis_kelamin}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>Tanggal Lahir</Typography>
            <Typography variant="body1" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>
              {application.tanggal_lahir ? format(new Date(application.tanggal_lahir), 'dd MMMM yyyy') : '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>Agama</Typography>
            <Typography variant="body1" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>{application.agama}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>Pendidikan Terakhir</Typography>
            <Typography variant="body1" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>{application.pendidikan_terakhir}</Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography 
          variant="h6" 
          fontWeight="bold" 
          gutterBottom
          sx={{ 
            color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
          }}
        >
          Informasi Kontak
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>Email</Typography>
            <Typography variant="body1" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>{application.email}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>No. HP</Typography>
            <Typography variant="body1" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>{application.no_hp}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>No. HP Darurat</Typography>
            <Typography variant="body1" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>{application.no_hp_darurat}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>Pemilik No. HP Darurat</Typography>
            <Typography variant="body1" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>{application.pemilik_no_hp_darurat}</Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography 
          variant="h6" 
          fontWeight="bold" 
          gutterBottom
          sx={{ 
            color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
          }}
        >
          Alamat
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>Kota</Typography>
            <Typography variant="body1" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>{application.kota}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>Kecamatan</Typography>
            <Typography variant="body1" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>{application.kecamatan}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>Kelurahan</Typography>
            <Typography variant="body1" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>{application.kelurahan}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>Alamat Lengkap</Typography>
            <Typography variant="body1" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>{application.alamat}</Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        {application.tipe_sim && application.tipe_sim !== 'Tidak Punya' && (
          <>
            <Typography 
              variant="h6" 
              fontWeight="bold" 
              gutterBottom
              sx={{ 
                color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
              }}
            >
              Informasi Kendaraan
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>Tipe SIM</Typography>
                <Typography variant="body1" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>{application.tipe_sim || '-'}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>Nomor SIM</Typography>
                <Typography variant="body1" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>{application.no_sim || '-'}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>Masa Berlaku SIM</Typography>
                <Typography variant="body1" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>
                  {application.masa_berlaku_sim ? format(new Date(application.masa_berlaku_sim), 'dd MMMM yyyy') : '-'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>Merk Kendaraan</Typography>
                <Typography variant="body1" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>{application.merk_kendaraan || '-'}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>Tahun Produksi</Typography>
                <Typography variant="body1" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>{application.tahun_produksi_kendaraan || '-'}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>Nomor Polisi</Typography>
                <Typography variant="body1" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>{application.no_pol_kendaraan || '-'}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>Nomor STNK</Typography>
                <Typography variant="body1" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>{application.no_stnk || '-'}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>Masa Berlaku STNK</Typography>
                <Typography variant="body1" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>
                  {application.masa_berlaku_stnk ? format(new Date(application.masa_berlaku_stnk), 'dd MMMM yyyy') : '-'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>Masa Berlaku Pajak</Typography>
                <Typography variant="body1" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>
                  {application.masa_berlaku_pajak_kendaraan ? format(new Date(application.masa_berlaku_pajak_kendaraan), 'dd MMMM yyyy') : '-'}
                </Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
          </>
        )}
        
        <Typography 
          variant="h6" 
          fontWeight="bold" 
          gutterBottom
          sx={{ 
            color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
          }}
        >
          Dokumen
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Box 
              sx={{ 
                p: 2, 
                border: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.divider : '#e0e0e0'}`, 
                borderRadius: 1, 
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(66, 66, 66, 0.6)' : undefined
              }}
            >
              <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'} gutterBottom>
                Foto Diri
              </Typography>
              {application.foto_diri ? (
                <img 
                  src={application.foto_diri} 
                  alt="Foto Diri" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '120px', 
                    objectFit: 'contain',
                    border: theme.palette.mode === 'dark' ? '1px solid #555' : 'none'
                  }} 
                />
              ) : (
                <Typography variant="body2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>Tidak ada foto</Typography>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Box 
              sx={{ 
                p: 2, 
                border: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.divider : '#e0e0e0'}`, 
                borderRadius: 1, 
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(66, 66, 66, 0.6)' : undefined
              }}
            >
              <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'} gutterBottom>
                Foto KTP
              </Typography>
              {application.foto_ktp ? (
                <img 
                  src={application.foto_ktp} 
                  alt="Foto KTP" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '120px', 
                    objectFit: 'contain',
                    border: theme.palette.mode === 'dark' ? '1px solid #555' : 'none'
                  }} 
                />
              ) : (
                <Typography variant="body2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>Tidak ada foto</Typography>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Box 
              sx={{ 
                p: 2, 
                border: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.divider : '#e0e0e0'}`, 
                borderRadius: 1, 
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(66, 66, 66, 0.6)' : undefined
              }}
            >
              <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'} gutterBottom>
                Foto Ijazah
              </Typography>
              {application.foto_ijazah ? (
                <img 
                  src={application.foto_ijazah} 
                  alt="Foto Ijazah" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '120px', 
                    objectFit: 'contain',
                    border: theme.palette.mode === 'dark' ? '1px solid #555' : 'none'
                  }} 
                />
              ) : (
                <Typography variant="body2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'}>Tidak ada foto</Typography>
              )}
            </Box>
          </Grid>

          {/* SIM Document */}
          {application.foto_sim && (
            <Grid item xs={12} sm={6} md={4}>
              <Box 
                sx={{ 
                  p: 2, 
                  border: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.divider : '#e0e0e0'}`, 
                  borderRadius: 1, 
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(66, 66, 66, 0.6)' : undefined
                }}
              >
                <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'} gutterBottom>
                  Foto SIM
                </Typography>
                <img 
                  src={application.foto_sim} 
                  alt="Foto SIM" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '120px', 
                    objectFit: 'contain',
                    border: theme.palette.mode === 'dark' ? '1px solid #555' : 'none'
                  }} 
                />
              </Box>
            </Grid>
          )}
          
          {/* STNK Front */}
          {application.foto_stnk_hal_1 && (
            <Grid item xs={12} sm={6} md={4}>
              <Box 
                sx={{ 
                  p: 2, 
                  border: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.divider : '#e0e0e0'}`, 
                  borderRadius: 1, 
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(66, 66, 66, 0.6)' : undefined
                }}
              >
                <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'} gutterBottom>
                  Foto STNK (Depan)
                </Typography>
                <img 
                  src={application.foto_stnk_hal_1} 
                  alt="Foto STNK Depan" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '120px', 
                    objectFit: 'contain',
                    border: theme.palette.mode === 'dark' ? '1px solid #555' : 'none'
                  }} 
                />
              </Box>
            </Grid>
          )}
          
          {/* STNK Back */}
          {application.foto_stnk_hal_2 && (
            <Grid item xs={12} sm={6} md={4}>
              <Box 
                sx={{ 
                  p: 2, 
                  border: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.divider : '#e0e0e0'}`, 
                  borderRadius: 1, 
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(66, 66, 66, 0.6)' : undefined
                }}
              >
                <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary'} gutterBottom>
                  Foto STNK (Belakang)
                </Typography>
                <img 
                  src={application.foto_stnk_hal_2} 
                  alt="Foto STNK Belakang" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '120px', 
                    objectFit: 'contain',
                    border: theme.palette.mode === 'dark' ? '1px solid #555' : 'none'
                  }} 
                />
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>
      
      {application.status === 'REVISION' && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate(`/candidate/portal-informasi/edit-formulir/${uuid}`)}
          >
            Perbaiki Lamaran
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default RingkasanFormulir;