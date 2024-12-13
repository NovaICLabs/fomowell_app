import { Alert, Box, IconButton, LinearProgress, Snackbar } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { messageInfo } from '@/utils/appType';
import CloseIcon from '@mui/icons-material/Close';
import ErrorIcon from '@mui/icons-material/Error';
import Styles from './index.module.less'
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

let globalSetMessageIsOpen: (MessageParams: messageInfo) => void = () => {
  console.error('SnackbarModal component is not mounted yet.');
};

const SnackbarModal = () => {
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageInfo, setMessageInfo] = useState<messageInfo>({
    type: 'error',
    content: 'Success!',
  });
  const typeIcon = {
    'success': <CheckCircleIcon fontSize="inherit" sx={{ color: `#49C73F`, fontSize: '30px' }} />,
    'error': <ErrorIcon fontSize="inherit" sx={{ color: `#FF7575`, fontSize: '30px' }} />,
    "info": <ErrorIcon fontSize="inherit" sx={{ color: `#FF7575`, fontSize: '30px' }} />,
    'warning': <ErrorIcon fontSize="inherit" sx={{ color: `#FF7575`, fontSize: '30px' }} />
  }
  const handleMessageClose = (event: Event | React.SyntheticEvent<any, Event>, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setMessageOpen(false);
  };

  const setMessageIsOpen = (MessageParams: messageInfo): void => {
    setProgress(100);
    setMessageOpen(true);
    setMessageInfo(MessageParams);
  };
  const [progress, setProgress] = React.useState(100);
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (messageOpen) {
      timer = setInterval(() => {
        setProgress((prevProgress) => (prevProgress - 1 >= 0 ? prevProgress - 1 : 0));
      }, 52); // Adjust this value to control the speed of the progress bar
    } else {
      clearInterval(timer);
    }
    return () => {
      clearInterval(timer);
    };
  }, [messageOpen, messageInfo]);
  useEffect(() => {
    globalSetMessageIsOpen = setMessageIsOpen;
  }, []);

  return createPortal(
    <Snackbar
      className={Styles.SnackbarMadal}
      open={messageOpen}
      autoHideDuration={6000}
      key={messageInfo.content}
      onClose={handleMessageClose}
      disableWindowBlurListener
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ width: '300px', overflow: 'unset' }}
    >
      <Box sx={{ position: 'relative', width: '100%', overflow: 'unset' }}>
        <Alert
          onClose={handleMessageClose}
          severity={messageInfo.type}
          icon={typeIcon[messageInfo.type]}
          action={
            <IconButton aria-label="close" color="inherit" size='medium' onClick={handleMessageClose}>
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{
            backgroundColor: '#2B3759', color: '#fff', alignItems: 'center', '.MuiAlert-message': {
              overflow: 'unset',
              wordWrap: 'break-word'
            }
          }}
        >
          {messageInfo.content}
        </Alert>
        <LinearProgress
          variant="determinate"
          color={messageInfo.type}
          value={progress}
          sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
        />
      </Box>
    </Snackbar>,
    document.body,
  );
};

export default SnackbarModal;
export { globalSetMessageIsOpen };
