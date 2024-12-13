import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { Box, CircularProgress, Snackbar } from '@mui/material';
import { createPortal } from 'react-dom';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export interface SnackbarModalHandles {
  openSnackbar: (message: string, isopen: boolean) => void;
  setViewProgress: (show: boolean) => void;
}

interface SnackbarModalProps {
  onViewProgress: () => void;
}
let globalSetMessageIsOpen: (MessageParams: string, isopen: boolean) => void = () => {
  console.error('SnackbarModal component is not mounted yet.');
};
const SnackbarModal = forwardRef<SnackbarModalHandles, SnackbarModalProps>(({ onViewProgress }, ref) => {
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageInfo, setMessageInfo] = useState<string>('');
  const localRef = useRef<HTMLDivElement>(null);
  const [isshowViewProgress, setisshowViewProgress] = React.useState(false);
  useImperativeHandle(ref, () => ({
    openSnackbar: (message: string, isopen: boolean) => {
      setMessageIsOpen(message, isopen);
    },
    setViewProgress: (show: boolean) => {
      setisshowViewProgress(show);
    },
  }));

  const setMessageIsOpen = (message: string, isopen: boolean): void => {
    setMessageOpen(isopen);
    setMessageInfo(message);
  };

  const handleMessageClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setMessageOpen(false);
  };

  useEffect(() => {
    globalSetMessageIsOpen = setMessageIsOpen;
  }, []);

  return createPortal(
    <Snackbar
      ref={localRef}
      open={messageOpen}
      autoHideDuration={null}
      key={'openRightBox'}
      disableWindowBlurListener
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ width: '300px', overflow: 'unset', zIndex: 9999 }}
    >
      <Box>
        <div style={{ position: 'fixed', top: '90px', right: '10px', display: messageOpen ? '' : 'none' }}>
          <div onClick={handleMessageClose} style={{ position: 'absolute', right: '8px', top: '5px' }}>
            <CloseIcon sx={{ color: '#fff', cursor: 'pointer', fontSize: '23px' }} />
          </div>
          <div
            style={{
              padding: '10px 10px 10px 10px',
              backgroundColor: '#1f2946',
              minWidth: '250px',
              maxWidth: '400px',
              borderRadius: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'start',
            }}
          >
            <div>
              <div style={{ position: 'relative' }}>
                <CircularProgress
                  thickness={2}
                  size={50}
                  sx={{ color: '#fff', background: '#746cec', borderRadius: '50%' }}
                />
                <AccessTimeIcon
                  sx={{ color: '#fff', position: 'absolute', top: '9.5px', right: '10.5px', fontSize: '30px' }}
                />
              </div>
            </div>
            <div style={{ marginLeft: '10px', maxWidth: '320px', marginRight: '25px' }}>
              <div style={{ color: '#fff' }}>{messageInfo}</div>
              <div
                style={{ color: '#5f56bf', cursor: 'pointer', display: isshowViewProgress ? 'none' : '' }}
                onClick={onViewProgress}
              >
                View progress
              </div>
            </div>
          </div>
        </div>
      </Box>
    </Snackbar>,
    document.body,
  );
});

export default SnackbarModal;
export { globalSetMessageIsOpen };
