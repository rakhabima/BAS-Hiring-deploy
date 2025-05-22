import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WorkIcon from '@mui/icons-material/Work';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
  useTheme
} from '@mui/material';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobApplicationService } from '../../services/api';

const DetailOnJob = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [application, setApplication] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await jobApplicationService.getApplicationById(uuid);
        
        if (!response || !response.data) {
          setError('Aplikasi tidak ditemukan');
          setLoading(false);
          return;
        }
        
        if (response.data.status !== 'ON_JOB' && response.data.status !== 'ACCEPTED') {
          setError('Status aplikasi tidak sesuai');
          setLoading(false);
          return;
        }
        
        setApplication(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching application data:', err);
        setError('Gagal memuat data aplikasi. Silakan coba lagi nanti.');
        setLoading(false);
      }
    };
    
    if (uuid) {
      fetchData();
    }
  }, [uuid]);
  
  const handleBack = () => {
    navigate(`/candidate/portal-informasi/${uuid}`);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMMM yyyy');
    } catch (error) {
      return dateString;
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
  
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 5, mb: 8 }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={handleBack} 
        sx={{ mb: 3 }}
      >
        Kembali
      </Button>
      
      <Paper 
        elevation={3} 
        sx={{ 
          p: 0, 
          borderRadius: 2, 
          overflow: 'hidden', 
          mb: 4,
          bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'white'
        }}
      >
        <Box 
          sx={{ 
            bgcolor: theme.palette.success.main, 
            color: 'white', 
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Selamat! Anda Diterima di PT BAS
          </Typography>
          <Typography variant="body1">
            Status: <strong>On Job</strong> | Posisi: <strong>{application.jobPostingId?.jobPosition || application.posisi_dilamar}</strong>
          </Typography>
        </Box>
        
        <Box sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Kami akan segera menghubungi Anda untuk langkah selanjutnya. Jika dalam 3 hari kerja Anda belum mendapatkan kabar, 
              mohon hubungi admin@bas-indonesia.id atau +62 821-1240-2200.
            </Typography>
          </Alert>
          
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Detail Informasi Karyawan
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Informasi Pribadi
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary, width: '40%' }}>
                        Nama Lengkap
                      </TableCell>
                      <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                        {application.nama_ktp}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary }}>
                        NIK
                      </TableCell>
                      <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                        {application.nik}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary }}>
                        Tanggal Lahir
                      </TableCell>
                      <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                        {formatDate(application.tanggal_lahir)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary }}>
                        Jenis Kelamin
                      </TableCell>
                      <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                        {application.jenis_kelamin}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary }}>
                        Agama
                      </TableCell>
                      <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                        {application.agama}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary }}>
                        Pendidikan Terakhir
                      </TableCell>
                      <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                        {application.pendidikan_terakhir}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Kontak
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary, width: '40%' }}>
                        Email
                      </TableCell>
                      <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                        {application.email}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary }}>
                        No. Handphone
                      </TableCell>
                      <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                        {application.no_hp}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary }}>
                        No. Handphone Darurat
                      </TableCell>
                      <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                        {application.no_hp_darurat}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary }}>
                        Pemilik Kontak Darurat
                      </TableCell>
                      <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                        {application.pemilik_no_hp_darurat}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary }}>
                        Hubungan
                      </TableCell>
                      <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                        {application.hubungan_dgn_pemilik_no_hp_darurat}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Grid>
          </Grid>
          
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Alamat
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary, width: '20%' }}>
                        Alamat Lengkap
                      </TableCell>
                      <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                        {application.alamat}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary }}>
                        Kelurahan
                      </TableCell>
                      <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                        {application.kelurahan}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary }}>
                        Kecamatan
                      </TableCell>
                      <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                        {application.kecamatan}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary }}>
                        Kota
                      </TableCell>
                      <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                        {application.kota}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Grid>
          </Grid>
          
          {application.tipe_sim !== 'Tidak Punya' && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Informasi Kendaraan
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary, width: '30%' }}>
                          Tipe SIM
                        </TableCell>
                        <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                          {application.tipe_sim}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary }}>
                          Nomor SIM
                        </TableCell>
                        <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                          {application.no_sim}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary }}>
                          Masa Berlaku SIM
                        </TableCell>
                        <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                          {formatDate(application.masa_berlaku_sim)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary }}>
                          Jenis & Merk Kendaraan
                        </TableCell>
                        <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                          {application.merk_kendaraan}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary }}>
                          Tahun Produksi Kendaraan
                        </TableCell>
                        <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                          {application.tahun_produksi_kendaraan}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary }}>
                          Nomor Polisi Kendaraan
                        </TableCell>
                        <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                          {application.no_pol_kendaraan}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary }}>
                          Nomor STNK
                        </TableCell>
                        <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                          {application.no_stnk}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary }}>
                          Masa Berlaku STNK
                        </TableCell>
                        <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                          {formatDate(application.masa_berlaku_stnk)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary }}>
                          Masa Berlaku Pajak Kendaraan
                        </TableCell>
                        <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                          {formatDate(application.masa_berlaku_pajak_kendaraan)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              </Grid>
            </Grid>
          )}
          
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Informasi Bank
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary, width: '30%' }}>
                        Nama Bank
                      </TableCell>
                      <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                        {application.nama_bank}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary }}>
                        Nomor Rekening
                      </TableCell>
                      <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                        {application.no_rekening}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ border: 'none', pl: 0, color: theme.palette.text.secondary }}>
                        Nama Pemilik Rekening
                      </TableCell>
                      <TableCell sx={{ border: 'none', fontWeight: 'medium' }}>
                        {application.nama_pemilik_rekening}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Posisi dan Informasi Pekerjaan
          </Typography>
          
          <Box sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : '#f5f5f5', borderRadius: 1, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <WorkIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Posisi yang Diterima</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {application.jobPostingId?.jobPosition || application.posisi_dilamar}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Lokasi Penempatan</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {application.jobPostingId?.location || 'Jakarta'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Tanggal Bergabung</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {application.statusHistory && 
                     application.statusHistory.find(item => item.status === 'ON_JOB') ? 
                      formatDate(application.statusHistory.find(item => item.status === 'ON_JOB').timestamp) : 
                      'Akan dikonfirmasi'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Departemen</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {application.jobPostingId?.department || 'Akan dikonfirmasi'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
          
          <Alert 
            severity="warning"
            sx={{ mb: 3 }}
          >
            <Typography variant="body2">
              Informasi di atas adalah ringkasan dari data yang Anda kirimkan saat pendaftaran. Jika ada informasi yang perlu diperbaiki,
              silakan hubungi admin@bas-indonesia.id secepat mungkin.
            </Typography>
          </Alert>
        </Box>
      </Paper>
      
      <Box sx={{ textAlign: 'center' }}>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleBack}
          sx={{ mr: 2 }}
        >
          Kembali ke Portal Informasi
        </Button>
        
        <Button 
          variant="outlined"
          onClick={() => navigate('/candidate/portal-informasi')}
        >
          Ke Daftar Lamaran
        </Button>
      </Box>
    </Box>
  );
};

export default DetailOnJob;