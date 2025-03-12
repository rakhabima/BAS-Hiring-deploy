import React, { useState } from 'react';
import { 
    Box, 
    Typography, 
    Button, 
    Grid,
    Card,
    CardContent,
    IconButton,
} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { useColorMode } from '../components/ThemeProvider';

const details = {
  C: {
    title: "Commitment",
    description: "Kami menjunjung tinggi rasa bertanggung jawab terhadap klien, masyarakat dan lingkungan."
  },
  A: {
    title: "Adaptive",
    description: "Kami terus berinovasi dan antusias dalam setiap perubahan serta berorientasi pada pertumbuhan."
  },
  R: {
    title: "Reliability",
    description: "Kami cermat dalam mengelola dan mengembangkan hubungan untuk menjadi mitra yang dapat diandalkan."
  },
  E: {
    title: "Expertise",
    description: "Kami berpengalaman dalam bidang outsourcing sehingga efektif dan efisien dalam memberikan pelayanan berkualitas."
  }
};

const useAnimation = {
  '@keyframes scaleWiggle': {
    '0%, 100%': { transform: 'scale(1.3) rotate(0deg)' },
    '10%, 90%': { transform: 'scale(1.5) rotate(-3deg)' },
    '20%, 80%': { transform: 'scale(1.5) rotate(3deg)' },
    '30%, 70%': { transform: 'scale(1.5) rotate(-3deg)' },
    '40%, 60%': { transform: 'scale(1.5) rotate(3deg)' },
    '50%': { transform: 'scale(1.5) rotate(-3deg)' }
  },
  animation: 'scaleWiggle 1.5s ease-in-out forwards'
};

const textAnimation = {
    '@keyframes growEffect': {
      '0%': { transform: 'scale(0.5)', opacity: 0 },
      '100%': { transform: 'scale(1)', opacity: 1 }
    },
    animation: 'growEffect 1s ease-out forwards'
  };

const CARESection = () => {
  const [activeLetter, setActiveLetter] = useState('C');
  const [animationTrigger, setAnimationTrigger] = useState(0);
  const letters = ['C', 'A', 'R', 'E'];
  const currentIndex = letters.indexOf(activeLetter);

  const handleLetterClick = (letter) => {
    setActiveLetter(letter);
    setAnimationTrigger(new Date().getTime());
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % letters.length;
    setActiveLetter(letters[nextIndex]);
    setAnimationTrigger(new Date().getTime());
  };

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + letters.length) % letters.length;
    setActiveLetter(letters[prevIndex]);
    setAnimationTrigger(new Date().getTime());
  };

  return (
    <Box sx={{ 
      position: 'relative', 
      textAlign: 'center', 
      my: 7, 
      px: 2, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center'
      }}
    >
      <Card sx={{ maxWidth: 1000, textAlign: 'center', p: 3, boxShadow: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', my: -13, mb: 5, px: 2 }}>
        <Typography variant="h3" component="h3" sx={{ fontWeight: 'bold' }}>
          Tentang BAS
        </Typography>
      </Card>  
      <Typography variant="h4" sx={{ mb: 2 }}>
        Prinsip Utama Kesuksesan Kami
      </Typography>
      <Typography sx={{ mb: 4, maxWidth: 1000 }}>
        Organisasi yang baik memiliki nilai-nilai yang tertanam kuat sebagai pedoman dalam tugasnya. BAS merumuskan empat nilai perusahaan yang dirangkum menjadi C.A.R.E.
      </Typography>
      <Box sx={{ maxWidth: 800, position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <IconButton onClick={handlePrev} sx={{ mr: 2 }}>
          <ArrowBackIosIcon />
        </IconButton>
        <Card sx={{ width: '100%', boxShadow: 3, textAlign: 'center' }}>
          <CardContent>
            <Grid container spacing={2} justifyContent="center">
              {letters.map((letter) => (
                <Grid item key={letter}>
                  <Button
                    onClick={() => handleLetterClick(letter)}
                    sx={{
                      fontSize: '3rem',
                      color: activeLetter === letter ? 'primary.main' : 'grey.500',
                      fontWeight: activeLetter === letter ? 'bold' : 'normal',
                      ...(activeLetter === letter && useAnimation)
                    }}
                  >
                    {letter}
                  </Button>
                </Grid>
              ))}
            </Grid>
            <Box key={animationTrigger} sx={{ ...textAnimation, mt: 2 }}>
              <Typography variant="h4" sx={{fontSize: '2rem', fontWeight: 'bold', color: 'primary.main' }}>
                {details[activeLetter].title}
              </Typography>
              <Typography sx={{fontSize: '1rem', mt: 1 }}>
                {details[activeLetter].description}
              </Typography>
            </Box>
          </CardContent>
        </Card>
        <IconButton onClick={handleNext} sx={{ ml: 2 }}>
          <ArrowForwardIosIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default CARESection;