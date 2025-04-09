import * as React from 'react';
import Snackbar from '@mui/material/Snackbar';
import Grow from '@mui/material/Grow';
import Alert from '@mui/material/Alert';

function GrowTransition(props) {
  return <Grow {...props} />;
}

// Create a context for the toast
const ToastContext = React.createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = React.useState({
    open: false,
    message: '',
    severity: 'info', // 'success', 'error', 'warning', 'info'
    duration: 3000,
  });

  const showToast = (message, severity = 'info', duration = 3000) => {
    setToast({
      open: true,
      message,
      severity,
      duration,
    });
  };

  const handleClose = () => {
    setToast(prev => ({ ...prev, open: false }));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={toast.open}
        onClose={handleClose}
        TransitionComponent={GrowTransition}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        autoHideDuration={null}
        ClickAwayListenerProps={{ mouseEvent: false }}
      >
        <Alert 
          onClose={handleClose} 
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

// Custom hook to use the toast
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}