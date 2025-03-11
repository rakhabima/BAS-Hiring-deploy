import React, { useState } from 'react';
import { 
    Box, 
    Typography, 
    Button, 
    Grid,
} from '@mui/material';

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
    animation: 'growEffect 0.5s ease-out forwards'
  };

const CARESection = () => {
  const [activeLetter, setActiveLetter] = useState('C');
  const [animationTrigger, setAnimationTrigger] = useState(0);

  const handleLetterClick = (letter) => {
    setActiveLetter(letter);
    setAnimationTrigger(new Date().getTime());
  };

  return (
    <Box sx={{ textAlign: 'center', my: 4 }}>
      <Grid container spacing={2} justifyContent="center">
        {'CARE'.split('').map((letter) => (
          <Grid item key={letter}>
            <Button
              onClick={() => handleLetterClick(letter)}
              sx={{
                fontSize: '3.5rem',
                color: activeLetter === letter ? 'primary.main' : 'grey.500',
                fontWeight: activeLetter === letter ? 'bold' : 'normal',
                minWidth: '64px',
                minHeight: '64px',
                ...(activeLetter === letter && useAnimation)
              }}
            >
              {letter}
            </Button>
          </Grid>
        ))}
      </Grid>
      {activeLetter && (
        <Box key={animationTrigger} sx={{ mt: 3, ...textAnimation}}>
          <Typography variant="h4" sx={{ fontSize: '2rem', fontWeight: 'bold', color: 'primary.main' }}>
            {details[activeLetter].title}
          </Typography>
          <Typography variant="h6" sx={{ mt: 1, fontSize: '1.25rem', fontWeight: 'normal'}}>
            {details[activeLetter].description}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CARESection;
