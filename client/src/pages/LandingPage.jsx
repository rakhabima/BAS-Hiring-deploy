import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Grid,
  Box,
  Link
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PhoneIcon from "@mui/icons-material/Phone";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import MusicNoteIcon from "@mui/icons-material/MusicNote";

import "../styles/Prinsip.css";

const LandingPage = () => {
  return (
    <Box
      sx={{
        flexGrow: 1,
        background: 'linear-gradient(135deg, #ffffff 0%, #e3f2fd 100%)',
        minHeight: '100vh',
      }}
    >
      {/* NAVBAR TRANSPARAN */}
      <AppBar
        position="static"
        sx={{
          backgroundColor: 'transparent',
          boxShadow: 'none',
          color: '#000',
          px: 2,
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          {/* BAGIAN KIRI (LOGO) */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <img
              src="/assets/baslogo.png"
              alt="BAS Logo"
              style={{ width: 100, height: 'auto' }}
            />
          </Box>

          {/* BAGIAN TENGAH (MENU NAV) */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              gap: 3,
            }}
          >
            <Button color="inherit">Beranda</Button>
            <Button color="inherit">Services</Button>
            <Button color="inherit">Solutions</Button>
            <Button color="inherit">Karir</Button>
            <Button color="inherit" href="#kontakKami">
              Kontak
            </Button>
          </Box>

          {/* BAGIAN KANAN (TOMBOL MASUK) */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              startIcon={<AccountCircleIcon />}
            >
              Masuk
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* HERO SECTION */}
      <Box sx={{ py: { xs: 4, md: 6 } }}>
        <Container>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" gutterBottom sx={{ fontWeight: '600' }}>
                Solusi Outsourcing Tepat <br /> Untuk Bisnis Anda
              </Typography>
              <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                PT. Barokah Amanah Sentosa adalah perusahaan outsourcing yang
                menyediakan layanan kurir dan staf untuk membantu operasional
                bisnis Anda. Dengan pengalaman dan jaringan luas, kami siap
                membantu Anda mencapai efisiensi dan pertumbuhan yang optimal.
              </Typography>
              <Button variant="contained" color="primary">
                Pelajari Layanan
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  width: '100%',
                  height: 250,
                  backgroundColor: '#ccc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <Typography variant="body1">[Gambar/Ilustrasi di sini]</Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* TENTANG BAS */}
      <Container sx={{ py: { xs: 4, md: 6 } }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: '600' }}>
          Tentang BAS
        </Typography>
        <Typography variant="body1" align="center" paragraph>
          Kami berkomitmen untuk menjadi mitra terbaik bagi klien dalam menyediakan
          tenaga kerja berkualitas dan layanan profesional. Dengan proses rekrutmen
          yang ketat dan pengelolaan SDM yang tepat, kami memastikan setiap
          kandidat yang kami salurkan siap memberikan performa terbaik.
        </Typography>
      </Container>

      {/* PRINSIP UTAMA KESUKSESAN KAMI */}
      <Container sx={{ py: { xs: 4, md: 6 } }}>
        <Typography
          variant="h5"
          align="center"
          gutterBottom
          sx={{ fontWeight: '600' }}
        >
          Prinsip Utama Kesuksesan Kami
        </Typography>

        <div className="prinsip-section">
          <div className="prinsip-grid">
            <div className="prinsip-card">
              <Typography variant="h6" gutterBottom>
                Commitment
              </Typography>
              <Typography variant="body2">
                Selalu berusaha memberikan yang terbaik dan tepat waktu
                untuk semua kebutuhan klien.
              </Typography>
            </div>
            <div className="prinsip-card">
              <Typography variant="h6" gutterBottom>
                Reliability
              </Typography>
              <Typography variant="body2">
                Layanan yang dapat diandalkan dan transparan dalam setiap
                proses pengerjaan.
              </Typography>
            </div>
            <div className="prinsip-card">
              <Typography variant="h6" gutterBottom>
                Competent
              </Typography>
              <Typography variant="body2">
                Didukung oleh tim profesional dan kandidat berkualitas sesuai
                kebutuhan klien.
              </Typography>
            </div>
            <div className="prinsip-card">
              <Typography variant="h6" gutterBottom>
                Adaptive
              </Typography>
              <Typography variant="body2">
                Siap beradaptasi dengan perubahan kebutuhan dan perkembangan
                industri.
              </Typography>
            </div>
          </div>
        </div>
      </Container>

      {/* KONTAK KAMI */}
      <Box 
        id="kontakKami" 
        sx={{ py: 6, display: 'flex', justifyContent: 'center' }}
      >
        <Box sx={{
          width: "80%",
          maxWidth: "900px",
          backgroundColor: "#f8f9fa",
          borderRadius: 2,
          boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
          padding: 4,
        }}>
          <Container>
            <Grid container spacing={4} alignItems="center">
              {/* BAGIAN KIRI */}
              <Grid item xs={12} md={8}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: "600" }}>
                  Kontak Kami
                </Typography>
                <Typography variant="body1" paragraph>
                  Hubungi kami untuk solusi outsourcing yang tepat dan efisien. Tim kami siap
                  membantu Anda menemukan solusi terbaik dan mencapai tujuan bisnis Anda.
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <PhoneIcon />
                  <Typography variant="body1">+62 812 8032 2191</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <EmailRoundedIcon />
                  <Link href="mailto:office@bas-indonesia.com" underline="hover" color="inherit">
                    office@bas-indonesia.com
                  </Link>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <InstagramIcon />
                  <Link href="https://instagram.com/bas.indonesia" underline="hover" color="inherit">
                    @bas.indonesia
                  </Link>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <LinkedInIcon />
                  <Typography variant="body1">Barokah Amanah Sentosa</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MusicNoteIcon />
                  <Typography variant="body1">@barokahamanahsentosa</Typography>
                </Box>
              </Grid>

              {/* BAGIAN KANAN: Google Maps Embed */}
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    width: "100%",
                    height: 200,
                    borderRadius: 2,
                    overflow: "hidden",
                    boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
                  }}
                >
                  <iframe
                    title="Lokasi BAS"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.1604786460957!2d106.84853097594366!3d-6.242570593745747!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f3da6e129b09%3A0x12de56643b067409!2sGRAHA%20PRATAMA%20BUILDING!5e0!3m2!1sen!2sid!4v1739817206859!5m2!1sen!2sid"
                  ></iframe>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>

      {/* FOOTER */}
      <Box
        sx={{
          backgroundColor: '#222',
          color: '#fff',
          py: 2,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2">
          © 2025 PT. Barokah Amanah Sentosa
        </Typography>
      </Box>
    </Box>
  );
};

export default LandingPage;
