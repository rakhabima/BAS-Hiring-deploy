import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import PhoneIcon from "@mui/icons-material/Phone";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  IconButton,
  Link,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';
import Navbar from '../components/Navbar';
import { useColorMode } from '../components/ThemeProvider';
import CARESection from '../components/CARESection';
import "../styles/Prinsip.css";

const LandingPage = () => {
  const theme = useTheme();
  const { mode } = useColorMode();

  return (
    <Box
      sx={{
        flexGrow: 1,
        background: theme.palette.background.gradient,
        minHeight: '100vh',
      }}
    >
      <Navbar />
      {/* HERO SECTION */}
      <Box
        id="home"
        sx={{
          pt: { xs: 10, md: 15 },
          pb: { xs: 8, md: 12 },
          px: 2,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: "linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url('/assets/hero-image.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '2.5rem', md: '4rem' },
              fontWeight: 800,
              mb: 2,
              background: 'linear-gradient(45deg, #3f51b5 30%, #f50057 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            BAS Hiring Solutions
          </Typography>
          <Typography
            variant="h5"
            component="p"
            sx={{
              mb: 4,
              maxWidth: '1000px',
              mx: 'auto',
              color: theme.palette.text.secondary,
            }}
          >
            Solusi rekrutmen terpercaya untuk kebutuhan SDM perusahaan Anda
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{ mb: 8 }}
          >
            <Button
              variant="contained"
              color="primary"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{ px: 4, py: 1.5, borderRadius: '50px' }}
            >
              Mulai Sekarang
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              sx={{ px: 4, py: 1.5, borderRadius: '50px' }}
            >
              Pelajari Lebih Lanjut
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* ABOUT SECTION */}
      <Box
        id="about"
        sx={{
          py: 10,
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(0,0,0,0.2)' 
            : 'rgba(248, 249, 250, 0.9)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="/assets/about-image.jpg"
                alt="About Us"
                sx={{
                  width: '100%',
                  borderRadius: '16px',
                  boxShadow: theme.shadows[10],
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                component="h2"
                sx={{
                  mb: 3,
                  position: 'relative',
                  '&:after': {
                    content: '""',
                    position: 'absolute',
                    bottom: '-10px',
                    left: 0,
                    width: '60px',
                    height: '4px',
                    backgroundColor: theme.palette.primary.main,
                  }
                }}
              >
                Tentang Kami
              </Typography>
              <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                BAS Hiring adalah perusahaan rekrutmen yang berfokus pada penyediaan
                talenta berkualitas untuk berbagai industri. Kami memahami bahwa
                setiap perusahaan memiliki kebutuhan yang unik, dan kami berkomitmen
                untuk memberikan solusi rekrutmen yang tepat.
              </Typography>
              <Typography variant="body1" paragraph>
                Dengan pengalaman dan jaringan yang luas, kami mampu mengidentifikasi
                dan menarik kandidat terbaik yang tidak hanya memiliki keterampilan
                yang dibutuhkan, tetapi juga sesuai dengan budaya perusahaan Anda.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* PRINSIP/CARE SECTION */}
      <CARESection />

      {/* SERVICES SECTION */}
      <Box
        id="services"
        sx={{
          py: 10,
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(0,0,0,0.2)' 
            : 'rgba(255,255,255,0.7)',
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            component="h2"
            align="center"
            sx={{ mb: 6 }}
          >
            Layanan Kami
          </Typography>
          
          <Grid container spacing={4}>
            {[
              {
                title: "Rekrutmen Permanen",
                description: "Layanan rekrutmen untuk posisi tetap dengan garansi penggantian.",
                icon: "🔍"
              },
              {
                title: "Penyediaan Tenaga Kontrak",
                description: "Penyediaan tenaga kerja kontrak untuk proyek jangka pendek atau menengah.",
                icon: "📝"
              },
              {
                title: "Pencarian Eksekutif",
                description: "Pencarian eksekutif dan profesional senior untuk posisi strategis.",
                icon: "👔"
              },
              {
                title: "Konsultasi SDM",
                description: "Konsultasi strategi SDM untuk mengoptimalkan kinerja organisasi.",
                icon: "💼"
              }
            ].map((service, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: theme.shadows[10],
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                    <Typography variant="h1" component="div" sx={{ mb: 2, fontSize: '3rem' }}>
                      {service.icon}
                    </Typography>
                    <Typography variant="h5" component="h3" gutterBottom>
                      {service.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {service.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CONTACT SECTION */}
      <Box 
        id="contact" 
        sx={{ 
          py: 10,
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(0,0,0,0.2)' 
            : 'rgba(248, 249, 250, 0.9)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h2" sx={{ mb: 4 }}>
                Hubungi Kami
              </Typography>
              <Typography variant="body1" paragraph>
              Hubungi kami untuk solusi outsourcing yang tepat dan efisien. 
              <br />
              Tim kami siap membantu Anda menemukan solusi terbaik dan mencapai tujuan bisnis Anda.
              </Typography>
              
              <Stack spacing={3} sx={{ mt: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                    <PhoneIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Telepon
                    </Typography>
                    <Typography variant="body2">
                     0812 8032 2191
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                    <EmailRoundedIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Email
                    </Typography>
                    <Typography variant="body2">
                     office@bas-indonesia.com
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 4, 
                  borderRadius: '16px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h4" component="h3" gutterBottom>
                  Kantor Kami
                </Typography>
                <Typography variant="body1" paragraph>
                  Gedung Menara BAS, Lantai 12
                  Jl. Jendral Sudirman 
                  <br />
                  Kav. 45-46,
                  Jakarta Selatan, 12190
                  Indonesia
                </Typography>
                
                <Box 
                  component="iframe"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.2904357243586!2d106.8230581!3d-6.2295736!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f3f193a942ab%3A0x6e7ef2c4a0d8a30!2sJl.%20Jend.%20Sudirman%2C%20Kota%20Jakarta%20Selatan%2C%20Daerah%20Khusus%20Ibukota%20Jakarta!5e0!3m2!1sen!2sid!4v1645432615267!5m2!1sen!2sid"
                  width="100%"
                  height="300"
                  style={{ border: 0, borderRadius: '8px', marginTop: '16px' }}
                  allowFullScreen=""
                  loading="lazy"
                />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* FOOTER */}
      <Box
        component="footer"
        sx={{
          py: 6,
          backgroundColor: theme.palette.mode === 'dark' 
            ? '#121212' 
            : '#1e1e1e',
          color: '#fff',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 2 }}>
                <Link href="/">
                  <img
                    src="/assets/baslogo.png"
                    alt="BAS Logo"
                    style={{ 
                      width: 120, 
                      height: 'auto',
                      filter: 'brightness(0) invert(1)'
                    }}
                  />
                </Link>
              </Box>
              <Typography variant="body2" sx={{ mb: 2, opacity: 0.7 }}>
                BAS Hiring adalah perusahaan rekrutmen terpercaya yang berfokus pada penyediaan
                SDM berkualitas untuk berbagai industri di Indonesia.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <IconButton color="inherit" aria-label="Instagram">
                  <InstagramIcon />
                </IconButton>
                <IconButton color="inherit" aria-label="LinkedIn">
                  <LinkedInIcon />
                </IconButton>
                <IconButton color="inherit" aria-label="Email">
                  <EmailRoundedIcon />
                </IconButton>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3} md={2}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Perusahaan
              </Typography>
              <Stack spacing={1}>
                <Link href="#about" color="inherit" underline="hover" sx={{ opacity: 0.7 }}>
                  Tentang Kami
                </Link>
                <Link href="#" color="inherit" underline="hover" sx={{ opacity: 0.7 }}>
                  Karir
                </Link>
              </Stack>
            </Grid>
            
            <Grid item xs={6} sm={3} md={2}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Layanan
              </Typography>
              <Stack spacing={1}>
                <Link href="#services" color="inherit" underline="hover" sx={{ opacity: 0.7 }}>
                  Rekrutmen
                </Link>
                <Link href="#services" color="inherit" underline="hover" sx={{ opacity: 0.7 }}>
                  Penyediaan Tenaga
                </Link>
              </Stack>
            </Grid>
            
            <Grid item xs={6} sm={3} md={2}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Support
              </Typography>
              <Stack spacing={1}>
                <Link href="#contact" color="inherit" underline="hover" sx={{ opacity: 0.7 }}>
                  Kontak
                </Link>
              </Stack>
            </Grid>
            
            <Grid item xs={6} sm={3} md={2}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Legal
              </Typography>
              <Stack spacing={1}>
                <Link href="#" color="inherit" underline="hover" sx={{ opacity: 0.7 }}>
                  Privasi
                </Link>
                <Link href="#" color="inherit" underline="hover" sx={{ opacity: 0.7 }}>
                  Syarat & Ketentuan
                </Link>
              </Stack>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }} />
          
          <Typography variant="body2" align="center" sx={{ opacity: 0.5 }}>
            © {new Date().getFullYear()} PT Barokah Amanah Sentosa. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
