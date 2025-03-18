import { Alert, Snackbar } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { SHOW_NOTIFICATION } from '../services/api';

const NotificationSnackbar = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('success');

  useEffect(() => {
    const handleNotification = (event) => {
      const { message, severity } = event.detail;
      setMessage(message);
      setSeverity(severity);
      setOpen(true);
    };

    // Add event listener
    window.addEventListener(SHOW_NOTIFICATION, handleNotification);

    // Cleanup
    return () => {
      window.removeEventListener(SHOW_NOTIFICATION, handleNotification);
    };
  }, []);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert 
        onClose={handleClose} 
        severity={severity} 
        sx={{ width: '100%' }}
        elevation={6}
        variant="filled"
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationSnackbar; 