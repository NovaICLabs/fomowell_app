import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import classNames from 'classnames';
import styles from './index.module.less';

interface ImagePreviewProps {
  src: string;
  alt?: string;
  className?: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ src, alt, className }) => {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <img
        className={classNames(`${className}`)}
        src={src}
        alt={alt}
        style={{ cursor: 'pointer' }}
        onClick={handleClickOpen}
      />
      <Dialog open={open} onClose={handleClose} maxWidth="lg">
        <DialogTitle sx={{ backgroundColor: '#1b1d28', paddingBottom: '25px' }}>
          {alt}
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 4,
              top: 0,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          className={styles.customScrollbar}
          sx={{
            backgroundColor: '#1b1d28',
            paddingTop: '10px',
          }}
        >
          <img src={src} alt={alt} style={{ width: '100%' }} />
        </DialogContent>
        {/* <DialogActions sx={{ backgroundColor: '#1b1d28' }}>
          <Button
            onClick={handleClose}
            color="primary"
            sx={{ textTransform: 'unset', fontWeight: '600', fontSize: '14px' }}
          >
            Close
          </Button>
        </DialogActions> */}
      </Dialog>
    </div>
  );
};

interface ImagePreviewGridProps {
  images: { src: string; alt: string }[];
}
export default ImagePreview;
