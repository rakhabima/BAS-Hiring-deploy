import { createTheme } from '@mui/material/styles';

export const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light mode
          primary: {
            main: '#3f51b5',
            light: '#757de8',
            dark: '#002984',
            contrastText: '#fff',
          },
          secondary: {
            main: '#f50057',
            light: '#ff4081',
            dark: '#c51162',
            contrastText: '#fff',
          },
          background: {
            default: '#f8f9fa',
            paper: '#ffffff',
            card: '#ffffff',
            gradient: 'linear-gradient(135deg, #ffffff 0%, #e3f2fd 100%)',
          },
          text: {
            primary: '#212121',
            secondary: '#757575',
          },
          divider: 'rgba(0, 0, 0, 0.12)',
        }
      : {
          // Dark mode
          primary: {
            main: '#90caf9',
            light: '#e3f2fd',
            dark: '#42a5f5',
            contrastText: '#000',
          },
          secondary: {
            main: '#f48fb1',
            light: '#f8bbd0',
            dark: '#c2185b',
            contrastText: '#000',
          },
          background: {
            default: '#121212',
            paper: '#1e1e1e',
            card: '#2d2d2d',
            gradient: 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)',
          },
          text: {
            primary: '#ffffff',
            secondary: '#b0b0b0',
          },
          divider: 'rgba(255, 255, 255, 0.12)',
        }),
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
          },
        },
        containedPrimary: ({ theme }) => ({
          backgroundColor: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: theme.palette.primary.dark,
          },
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.background.card,
          borderRadius: 12,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 16px rgba(0, 0, 0, 0.4)' 
            : '0 8px 16px rgba(0, 0, 0, 0.1)',
          transition: 'transform 0.3s, box-shadow 0.3s',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 12px 20px rgba(0, 0, 0, 0.6)' 
              : '0 12px 20px rgba(0, 0, 0, 0.15)',
          },
        }),
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 8px rgba(0, 0, 0, 0.5)' 
            : '0 4px 8px rgba(0, 0, 0, 0.1)',
        }),
      },
    },
  },
});

// Create a theme instance.
const theme = createTheme(getDesignTokens('light'));

export default theme;
