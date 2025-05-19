import React, { useState, useEffect } from 'react';
import { Alert, Snackbar } from '@mui/material';

interface AuthMessageProps {
  message: {
    type: 'success' | 'error' | 'info' | 'warning';
    text: string;
  } | null;
  onClose?: () => void;
  autoHideDuration?: number;
}

const AuthMessage: React.FC<AuthMessageProps> = ({ 
  message, 
  onClose, 
  autoHideDuration = 6000 
}) => {
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    if (message) {
      setOpen(true);
    }
  }, [message?.text]);
  
  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    
    setOpen(false);
    
    if (onClose) {
      setTimeout(() => {
        onClose();
      }, 100);
    }
  };
  
  if (!message) {
    return null;
  }
  
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert 
        onClose={handleClose} 
        severity={message.type} 
        sx={{ width: '100%' }}
        variant="filled"
      >
        {message.text}
      </Alert>
    </Snackbar>
  );
};

export default AuthMessage;