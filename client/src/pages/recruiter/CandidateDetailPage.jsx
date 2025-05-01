import { Close, PictureAsPdf } from '@mui/icons-material';
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
    Grid,
    IconButton,
    MenuItem,
    Modal,
    Paper,
    Step,
    StepLabel,
    Stepper,
    TextField,
    Typography
} from '@mui/material';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobApplicationService } from '../../services/api';

// Steps for the progress bar
const steps = ['Administrasi', 'Wawancara', 'Technical Test', 'On Job'];

// Map status to step index
const getStepFromStatus = (status) => {
    switch (status) {
        case 'PENDING':
        case 'REVIEWING':
        case 'REVISION':
        case 'REJECTED':
            return 0; // Administrasi
        case 'INTERVIEW_SCHEDULED':
            return 1; // Wawancara
        case 'TECHNICAL_TEST':
            return 2; // Technical Test
        case 'ACCEPTED':
        case 'ON_JOB':
            return 3; // On Job
        default:
            return 0;
    }
};

const CandidateDetailPage = () => {
    const navigate = useNavigate();
    const { candidateId } = useParams();
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [status, setStatus] = useState('REVIEWING');
    const [notes, setNotes] = useState('');
    const [previewImage, setPreviewImage] = useState(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    // Fetch application data
    useEffect(() => {
        const fetchApplication = async () => {
            if (!candidateId) {
                navigate('/recruiter/candidates');
                return;
            }

            try {
                setLoading(true);
                const response = await jobApplicationService.getApplicationById(candidateId);
                if (response && response.data) {
                    setApplication(response.data);

                    // Set active step based on application status
                    const stepIndex = getStepFromStatus(response.data.status);
                    setActiveStep(stepIndex);

                    // Default the status selection based on current status
                    if (response.data.status === 'PENDING') {
                        setStatus('REVIEWING');
                    } else {
                        setStatus(response.data.status);
                    }
                } else {
                    navigate('/recruiter/candidates');
                }
            } catch (error) {
                console.error('Error fetching application details:', error);
                navigate('/recruiter/candidates');
            } finally {
                setLoading(false);
            }
        };

        fetchApplication();
    }, [candidateId, navigate]);

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return format(new Date(dateString), 'dd/MM/yyyy');
        } catch (error) {
            return dateString;
        }
    };

    // Handle view document
    const handleViewDocument = (documentUrl) => {
        if (documentUrl) {
            setPreviewImage(documentUrl);
        }
    };

    // Handle close preview
    const handleClosePreview = () => {
        setPreviewImage(null);
    };

    // Open confirm dialog
    const handleConfirmUpdate = () => {
        setConfirmDialogOpen(true);
    };

    // Close confirm dialog
    const handleCloseConfirm = () => {
        setConfirmDialogOpen(false);
    };

    // Handle status update
    const handleUpdateStatus = async () => {
        try {
            setSubmitting(true);
            setConfirmDialogOpen(false);

            // Prepare update data
            const updateData = {
                status: status,
                notes: notes
            };

            // Call API to update application status
            await jobApplicationService.updateApplicationStatus(candidateId, updateData);

            // If status is for interview, navigate to interview scheduling
            if (status === 'INTERVIEW_SCHEDULED') {
                navigate(`/recruiter/candidate-interview/${candidateId}`);
            } else {
                // Otherwise go back to candidates list
                navigate('/recruiter/candidates');
            }
        } catch (error) {
            console.error('Error updating application status:', error);
        } finally {
            setSubmitting(false);
        }
    };

    // Handle cancel button
    const handleCancel = () => {
        navigate('/recruiter/dashboard');
    };

    // Get appropriate button text based on status
    const getButtonText = () => {
        switch (status) {
            case 'REJECTED':
                return 'Tolak Kandidat';
            case 'REVIEWING':
                return 'Simpan Status Review';
            case 'REVISION':
                return 'Minta Revisi';
            case 'INTERVIEW_SCHEDULED':
                return 'Jadwalkan Wawancara';
            default:
                return 'Perbarui Status';
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {/* Progress Stepper */}
            <Box sx={{ width: '100%', mb: 4 }}>
                <Stepper activeStep={activeStep} alternativeLabel>
                    {steps.map((label, index) => (
                        <Step key={label} completed={index < activeStep}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Box>

            {/* Main content */}
            <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                <Typography variant="h5" component="h2" fontWeight="bold" sx={{ mb: 3 }}>
                    Pengecekan Formulir
                </Typography>
                <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary' }}>
                    Harap periksa ulang data diri dan dokumen yang sudah diunggah
                </Typography>

                {/* Personal Information */}
                <Typography variant="h6" component="h3" fontWeight="bold" sx={{ mb: 2 }}>
                    Informasi Pribadi
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={4} sm={3} md={2}>
                        <Typography variant="body2" color="text.secondary">Nama Lengkap (sesuai KTP)</Typography>
                    </Grid>
                    <Grid item xs={8} sm={9} md={4}>
                        <Typography variant="body2">{application?.nama_ktp || '-'}</Typography>
                    </Grid>

                    <Grid item xs={4} sm={3} md={2}>
                        <Typography variant="body2" color="text.secondary">Jenis Kelamin</Typography>
                    </Grid>
                    <Grid item xs={8} sm={9} md={4}>
                        <Typography variant="body2">{application?.jenis_kelamin || '-'}</Typography>
                    </Grid>

                    <Grid item xs={4} sm={3} md={2}>
                        <Typography variant="body2" color="text.secondary">NIK</Typography>
                    </Grid>
                    <Grid item xs={8} sm={9} md={4}>
                        <Typography variant="body2">{application?.nik || '-'}</Typography>
                    </Grid>

                    <Grid item xs={4} sm={3} md={2}>
                        <Typography variant="body2" color="text.secondary">Tanggal Lahir</Typography>
                    </Grid>
                    <Grid item xs={8} sm={9} md={4}>
                        <Typography variant="body2">{formatDate(application?.tanggal_lahir)}</Typography>
                    </Grid>

                    <Grid item xs={4} sm={3} md={2}>
                        <Typography variant="body2" color="text.secondary">Agama</Typography>
                    </Grid>
                    <Grid item xs={8} sm={9} md={4}>
                        <Typography variant="body2">{application?.agama || '-'}</Typography>
                    </Grid>

                    <Grid item xs={4} sm={3} md={2}>
                        <Typography variant="body2" color="text.secondary">Pendidikan Terakhir</Typography>
                    </Grid>
                    <Grid item xs={8} sm={9} md={4}>
                        <Typography variant="body2">{application?.pendidikan_terakhir || '-'}</Typography>
                    </Grid>
                </Grid>

                {/* Contact Information */}
                <Typography variant="h6" component="h3" fontWeight="bold" sx={{ mb: 2 }}>
                    Kontak
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={4} sm={3} md={2}>
                        <Typography variant="body2" color="text.secondary">Alamat Email</Typography>
                    </Grid>
                    <Grid item xs={8} sm={9} md={4}>
                        <Typography variant="body2">{application?.email || '-'}</Typography>
                    </Grid>

                    <Grid item xs={4} sm={3} md={2}>
                        <Typography variant="body2" color="text.secondary">Nomor Telepon</Typography>
                    </Grid>
                    <Grid item xs={8} sm={9} md={4}>
                        <Typography variant="body2">{application?.no_hp || '-'}</Typography>
                    </Grid>

                    <Grid item xs={4} sm={3} md={2}>
                        <Typography variant="body2" color="text.secondary">Kontak Darurat</Typography>
                    </Grid>
                    <Grid item xs={8} sm={9} md={4}>
                        <Typography variant="body2">{application?.no_hp_darurat || '-'}</Typography>
                    </Grid>

                    <Grid item xs={4} sm={3} md={2}>
                        <Typography variant="body2" color="text.secondary">Nama Pemilik Kontak Darurat</Typography>
                    </Grid>
                    <Grid item xs={8} sm={9} md={4}>
                        <Typography variant="body2">{application?.pemilik_no_hp_darurat || '-'}</Typography>
                    </Grid>

                    <Grid item xs={4} sm={3} md={2}>
                        <Typography variant="body2" color="text.secondary">Hubungan dengan Pemilik Kontak Darurat</Typography>
                    </Grid>
                    <Grid item xs={8} sm={9} md={4}>
                        <Typography variant="body2">{application?.hubungan_dgn_pemilik_no_hp_darurat || '-'}</Typography>
                    </Grid>
                </Grid>

                {/* Address Information */}
                <Typography variant="h6" component="h3" fontWeight="bold" sx={{ mb: 2 }}>
                    Domisili
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={4} sm={3} md={2}>
                        <Typography variant="body2" color="text.secondary">Kota/Kabupaten</Typography>
                    </Grid>
                    <Grid item xs={8} sm={9} md={4}>
                        <Typography variant="body2">{application?.kota || '-'}</Typography>
                    </Grid>

                    <Grid item xs={4} sm={3} md={2}>
                        <Typography variant="body2" color="text.secondary">Kecamatan</Typography>
                    </Grid>
                    <Grid item xs={8} sm={9} md={4}>
                        <Typography variant="body2">{application?.kecamatan || '-'}</Typography>
                    </Grid>

                    <Grid item xs={4} sm={3} md={2}>
                        <Typography variant="body2" color="text.secondary">Kelurahan</Typography>
                    </Grid>
                    <Grid item xs={8} sm={9} md={4}>
                        <Typography variant="body2">{application?.kelurahan || '-'}</Typography>
                    </Grid>

                    <Grid item xs={4} sm={3} md={2}>
                        <Typography variant="body2" color="text.secondary">Detail Alamat</Typography>
                    </Grid>
                    <Grid item xs={8} sm={9} md={4}>
                        <Typography variant="body2">{application?.alamat || '-'}</Typography>
                    </Grid>
                </Grid>

                {/* Job Information */}
                <Typography variant="h6" component="h3" fontWeight="bold" sx={{ mb: 2 }}>
                    Jenis Lowongan
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={4} sm={3} md={2}>
                        <Typography variant="body2" color="text.secondary">Posisi yang Dilamar</Typography>
                    </Grid>
                    <Grid item xs={8} sm={9} md={4}>
                        <Typography variant="body2">{application?.posisi_dilamar || application?.jobPostingId?.jobPosition || '-'}</Typography>
                    </Grid>

                    <Grid item xs={4} sm={3} md={2}>
                        <Typography variant="body2" color="text.secondary">Lokasi yang Dilamar</Typography>
                    </Grid>
                    <Grid item xs={8} sm={9} md={4}>
                        <Typography variant="body2">{application?.jobPostingId?.location || '-'}</Typography>
                    </Grid>

                    <Grid item xs={4} sm={3} md={2}>
                        <Typography variant="body2" color="text.secondary">Tanggal Aplikasi</Typography>
                    </Grid>
                    <Grid item xs={8} sm={9} md={4}>
                        <Typography variant="body2">{formatDate(application?.submissionDate)}</Typography>
                    </Grid>
                </Grid>

                {/* Vehicle Information */}
                {application && (application.tipe_sim !== 'Tidak Punya' || application.no_sim) && (
                    <>
                        <Typography variant="h6" component="h3" fontWeight="bold" sx={{ mb: 2 }}>
                            Informasi Kendaraan
                        </Typography>

                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={4} sm={3} md={2}>
                                <Typography variant="body2" color="text.secondary">Tipe SIM</Typography>
                            </Grid>
                            <Grid item xs={8} sm={9} md={4}>
                                <Typography variant="body2">{application?.tipe_sim || '-'}</Typography>
                            </Grid>

                            <Grid item xs={4} sm={3} md={2}>
                                <Typography variant="body2" color="text.secondary">No SIM</Typography>
                            </Grid>
                            <Grid item xs={8} sm={9} md={4}>
                                <Typography variant="body2">{application?.no_sim || '-'}</Typography>
                            </Grid>

                            <Grid item xs={4} sm={3} md={2}>
                                <Typography variant="body2" color="text.secondary">Masa Berlaku SIM</Typography>
                            </Grid>
                            <Grid item xs={8} sm={9} md={4}>
                                <Typography variant="body2">{formatDate(application?.masa_berlaku_sim)}</Typography>
                            </Grid>

                            <Grid item xs={4} sm={3} md={2}>
                                <Typography variant="body2" color="text.secondary">Jenis & Merk Kendaraan</Typography>
                            </Grid>
                            <Grid item xs={8} sm={9} md={4}>
                                <Typography variant="body2">{application?.merk_kendaraan || '-'}</Typography>
                            </Grid>

                            <Grid item xs={4} sm={3} md={2}>
                                <Typography variant="body2" color="text.secondary">Nomor Polisi</Typography>
                            </Grid>
                            <Grid item xs={8} sm={9} md={4}>
                                <Typography variant="body2">{application?.no_pol_kendaraan || '-'}</Typography>
                            </Grid>

                            <Grid item xs={4} sm={3} md={2}>
                                <Typography variant="body2" color="text.secondary">Nomor STNK</Typography>
                            </Grid>
                            <Grid item xs={8} sm={9} md={4}>
                                <Typography variant="body2">{application?.no_stnk || '-'}</Typography>
                            </Grid>

                            <Grid item xs={4} sm={3} md={2}>
                                <Typography variant="body2" color="text.secondary">Masa Berlaku STNK</Typography>
                            </Grid>
                            <Grid item xs={8} sm={9} md={4}>
                                <Typography variant="body2">{formatDate(application?.masa_berlaku_stnk)}</Typography>
                            </Grid>

                            <Grid item xs={4} sm={3} md={2}>
                                <Typography variant="body2" color="text.secondary">Masa Berlaku Pajak</Typography>
                            </Grid>
                            <Grid item xs={8} sm={9} md={4}>
                                <Typography variant="body2">{formatDate(application?.masa_berlaku_pajak_kendaraan)}</Typography>
                            </Grid>
                        </Grid>
                    </>
                )}

                {/* Bank Information */}
                <Typography variant="h6" component="h3" fontWeight="bold" sx={{ mb: 2 }}>
                    Informasi Rekening Bank
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={4} sm={3} md={2}>
                        <Typography variant="body2" color="text.secondary">No. Rekening</Typography>
                    </Grid>
                    <Grid item xs={8} sm={9} md={4}>
                        <Typography variant="body2">{application?.no_rekening || '-'}</Typography>
                    </Grid>

                    <Grid item xs={4} sm={3} md={2}>
                        <Typography variant="body2" color="text.secondary">Nama Pemilik Rekening</Typography>
                    </Grid>
                    <Grid item xs={8} sm={9} md={4}>
                        <Typography variant="body2">{application?.nama_pemilik_rekening || '-'}</Typography>
                    </Grid>

                    <Grid item xs={4} sm={3} md={2}>
                        <Typography variant="body2" color="text.secondary">Nama Bank</Typography>
                    </Grid>
                    <Grid item xs={8} sm={9} md={4}>
                        <Typography variant="body2">{application?.nama_bank || '-'}</Typography>
                    </Grid>
                </Grid>

                {/* Documents */}
                <Typography variant="h6" component="h3" fontWeight="bold" sx={{ mb: 2 }}>
                    Dokumen
                </Typography>

                <Grid container spacing={2} sx={{ mb: 4 }}>
                    {application?.foto_diri && (
                        <Grid item xs={12} sm={6} md={4}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    p: 1,
                                    border: '1px solid #ddd',
                                    borderRadius: 1,
                                    '&:hover': { bgcolor: '#f5f5f5' }
                                }}
                            >
                                <PictureAsPdf color="error" />
                                <Typography sx={{ flexGrow: 1 }}>Foto Diri</Typography>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    sx={{ borderRadius: 4 }}
                                    onClick={() => handleViewDocument(application.foto_diri)}
                                >
                                    Lihat
                                </Button>
                            </Box>
                        </Grid>
                    )}

                    {application?.foto_ktp && (
                        <Grid item xs={12} sm={6} md={4}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    p: 1,
                                    border: '1px solid #ddd',
                                    borderRadius: 1,
                                    '&:hover': { bgcolor: '#f5f5f5' }
                                }}
                            >
                                <PictureAsPdf color="error" />
                                <Typography sx={{ flexGrow: 1 }}>Foto KTP</Typography>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    sx={{ borderRadius: 4 }}
                                    onClick={() => handleViewDocument(application.foto_ktp)}
                                >
                                    Lihat
                                </Button>
                            </Box>
                        </Grid>
                    )}

                    {application?.foto_ijazah && (
                        <Grid item xs={12} sm={6} md={4}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    p: 1,
                                    border: '1px solid #ddd',
                                    borderRadius: 1,
                                    '&:hover': { bgcolor: '#f5f5f5' }
                                }}
                            >
                                <PictureAsPdf color="error" />
                                <Typography sx={{ flexGrow: 1 }}>Foto Ijazah</Typography>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    sx={{ borderRadius: 4 }}
                                    onClick={() => handleViewDocument(application.foto_ijazah)}
                                >
                                    Lihat
                                </Button>
                            </Box>
                        </Grid>
                    )}

                    {application?.foto_sim && (
                        <Grid item xs={12} sm={6} md={4}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    p: 1,
                                    border: '1px solid #ddd',
                                    borderRadius: 1,
                                    '&:hover': { bgcolor: '#f5f5f5' }
                                }}
                            >
                                <PictureAsPdf color="error" />
                                <Typography sx={{ flexGrow: 1 }}>Foto SIM</Typography>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    sx={{ borderRadius: 4 }}
                                    onClick={() => handleViewDocument(application.foto_sim)}
                                >
                                    Lihat
                                </Button>
                            </Box>
                        </Grid>
                    )}

                    {application?.foto_stnk_hal_1 && (
                        <Grid item xs={12} sm={6} md={4}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    p: 1,
                                    border: '1px solid #ddd',
                                    borderRadius: 1,
                                    '&:hover': { bgcolor: '#f5f5f5' }
                                }}
                            >
                                <PictureAsPdf color="error" />
                                <Typography sx={{ flexGrow: 1 }}>Foto STNK (Halaman 1)</Typography>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    sx={{ borderRadius: 4 }}
                                    onClick={() => handleViewDocument(application.foto_stnk_hal_1)}
                                >
                                    Lihat
                                </Button>
                            </Box>
                        </Grid>
                    )}

                    {application?.foto_stnk_hal_2 && (
                        <Grid item xs={12} sm={6} md={4}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    p: 1,
                                    border: '1px solid #ddd',
                                    borderRadius: 1,
                                    '&:hover': { bgcolor: '#f5f5f5' }
                                }}
                            >
                                <PictureAsPdf color="error" />
                                <Typography sx={{ flexGrow: 1 }}>Foto STNK (Halaman 2)</Typography>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    sx={{ borderRadius: 4 }}
                                    onClick={() => handleViewDocument(application.foto_stnk_hal_2)}
                                >
                                    Lihat
                                </Button>
                            </Box>
                        </Grid>
                    )}
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Status Selection */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">Status</Typography>
                    <TextField
                        select
                        fullWidth
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        sx={{ maxWidth: 300 }}
                    >
                        <MenuItem value="REVIEWING">Sedang Ditinjau</MenuItem>
                        <MenuItem value="INTERVIEW_SCHEDULED">Jadwalkan Wawancara</MenuItem>
                        <MenuItem value="REVISION">Perlu Revisi</MenuItem>
                        <MenuItem value="REJECTED">Ditolak</MenuItem>
                    </TextField>
                </Box>

                {/* Notes */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" fontWeight="bold">Keterangan</Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Tambahkan keterangan (opsional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        required={status === 'REVISION'}
                        helperText={status === 'REVISION' ? "Catatan wajib diisi untuk permintaan revisi" : ""}
                    />
                </Box>

                {/* Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={handleCancel}
                    >
                        Kembali
                    </Button>
                    <Button
                        variant="contained"
                        color={status === 'REJECTED' ? "error" : "primary"}
                        onClick={handleConfirmUpdate}
                        disabled={submitting || (status === 'REVISION' && !notes)}
                    >
                        {getButtonText()}
                    </Button>
                </Box>
            </Paper>

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmDialogOpen}
                onClose={handleCloseConfirm}
            >
                <DialogTitle>
                    Konfirmasi Perubahan Status
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {status === 'REJECTED' ?
                            'Apakah Anda yakin ingin menolak lamaran ini? Tindakan ini tidak dapat dibatalkan.' :
                            status === 'REVISION' ?
                                'Kirim permintaan revisi kepada kandidat? Kandidat akan mendapatkan notifikasi untuk melakukan revisi.' :
                                status === 'INTERVIEW_SCHEDULED' ?
                                    'Lanjutkan ke penjadwalan wawancara untuk kandidat ini?' :
                                    'Apakah Anda yakin ingin mengubah status lamaran ini?'}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseConfirm}>Batal</Button>
                    <Button
                        onClick={handleUpdateStatus}
                        variant="contained"
                        color={status === 'REJECTED' ? "error" : "primary"}
                        autoFocus
                    >
                        Konfirmasi
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Document Preview Modal */}
            <Modal
                open={!!previewImage}
                onClose={handleClosePreview}
                aria-labelledby="document-preview"
                aria-describedby="preview of uploaded document"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '80%',
                    maxWidth: '1000px',
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 2,
                    borderRadius: 2,
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Preview Dokumen</Typography>
                        <IconButton onClick={handleClosePreview}>
                            <Close />
                        </IconButton>
                    </Box>
                    <Box sx={{ flexGrow: 1, overflow: 'auto', textAlign: 'center' }}>
                        <img
                            src={previewImage}
                            alt="Document Preview"
                            style={{
                                maxWidth: '100%',
                                maxHeight: 'calc(90vh - 80px)',
                                objectFit: 'contain'
                            }}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Button
                            variant="contained"
                            onClick={() => window.open(previewImage, '_blank')}
                        >
                            Buka dalam Tab Baru
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </Container>
    );
};

export default CandidateDetailPage; 