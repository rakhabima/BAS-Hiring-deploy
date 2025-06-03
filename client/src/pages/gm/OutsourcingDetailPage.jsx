import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Typography, Grid, Box, Paper, Divider } from '@mui/material';
import { LocationOn, Email, Phone } from '@mui/icons-material';
import { outsourcingService } from '../../services/api'; // pastikan path ini sesuai

const OutsourcingDetailPage = () => {
    const { id } = useParams(); // Mendapatkan id vendor dari URL
    const [vendor, setVendor] = useState(null);
    const navigate = useNavigate();

    // Ambil data vendor berdasarkan id
    useEffect(() => {
        const fetchVendor = async () => {
            try {
                const response = await outsourcingService.getOutsourcingRequestById(id); // sesuaikan dengan API endpoint
                console.log('Vendor details:', response.data);
                setVendor(response.data.service);
            } catch (error) {
                console.error('Error fetching vendor details:', error);
            }
        };

        fetchVendor();
    }, [id]);

    if (!vendor) return <Typography>Loading...</Typography>;

    return (
        <Box sx={{ padding: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Detail Vendor
            </Typography>

            {/* Paper container with border */}
            <Paper sx={{ padding: 4, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <Grid container spacing={3}>
                    {/* Informasi Dasar (Kiri) */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Informasi Dasar</Typography>
                        <Divider sx={{ my: 2 }} />
                        <Typography><strong>Nama Vendor:</strong> {vendor.vendorName}</Typography>
                        <Typography><strong>Email:</strong> {vendor.email}</Typography>
                        <Typography><strong>Kontak:</strong> {vendor.contactInfo}</Typography>
                        <Typography><strong>Kategori Layanan:</strong> {vendor.serviceType}</Typography>
                        <Typography><strong>Status:</strong> {vendor.status}</Typography>
                    </Grid>

                    {/* Lokasi dan Pesan (Kanan) */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Lokasi dan Pesan</Typography>
                        <Divider sx={{ my: 2 }} />
                        <Typography><strong>Lokasi:</strong> {vendor.location}</Typography>
                        <Typography><strong>Pesan:</strong> {vendor.message}</Typography>
                    </Grid>

                    {/* Informasi Tambahan (Bawah) */}
                    <Grid item xs={12}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Informasi Tambahan</Typography>
                        <Divider sx={{ my: 2 }} />
                        <Typography><strong>Tanggal Permintaan:</strong> {new Date(vendor.submission).toLocaleString()}</Typography>
                        <Typography><strong>ID Permintaan:</strong> {vendor.uuid}</Typography>
                    </Grid>

                    {/* Tombol Kembali */}
                    <Grid item xs={12}>
                        <Button variant="outlined" color="primary" onClick={() => navigate(-1)}>
                            Kembali
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default OutsourcingDetailPage;
