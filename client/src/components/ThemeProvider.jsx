import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { getDesignTokens } from '../theme';

// Create a context for the color mode
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
  mode: 'light',
});

// Custom hook to use the color mode context
export const useColorMode = () => useContext(ColorModeContext);

export const ThemeProvider = ({ children }) => {
  // Read from localStorage or default to 'dark'
  const storedMode = localStorage.getItem('colorMode') || 'dark';
  const [mode, setMode] = useState(storedMode);

  // Color mode context value
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        setMode(newMode);
        localStorage.setItem('colorMode', newMode);
      },
      mode,
    }),
    [mode]
  );

  // Create a theme based on the mode
  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default ThemeProvider; 