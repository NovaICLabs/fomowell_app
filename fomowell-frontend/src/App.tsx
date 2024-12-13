window.global ||= window;
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Routing from './routes/Routing';
import Header from './layout/home/header';
// import Layout from '@/layout';
import { Provider } from 'react-redux';
import store from '@/store/app/store';
import React from 'react';
import { AppThemeProvider } from './themes/AppThemeProvider';
import { Alert, Button, IconButton, Snackbar } from '@mui/material';
import { messageInfo } from '@/utils/appType';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/layout/theme';
import CloseIcon from '@mui/icons-material/Close';
import SnackbarModal from '@/components/Snackbar/Snackbar';
const App = () => {
  // const [Num, setNum] = React.useState([false]);
  // const setNums = (num: Array<boolean>) => {
  //   setNum(num);
  // };

  const [MessageOpen, setMessageOpen] = React.useState(false);
  const [MessageInfo, setMessageInfo] = React.useState<messageInfo>({
    type: 'success',
    content: 'Success!',
  });
  const [OpenSelectWell, setOpenSelectWell] = React.useState<Boolean>(false);
  const editOpenSelectWell = (value: Boolean) => {
    setOpenSelectWell(value);
  };
  const handleMessageClose = (event: any, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setMessageOpen(false);
  };
  const setMessageIsOpen = (MessageParams: messageInfo): void => {
    setMessageOpen(true);
    setMessageInfo(MessageParams);
  };
  // const action = (
  //   <React.Fragment>
  //     <Alert severity={MessageInfo.type} sx={{ width: '100%' }}>
  //       {MessageInfo.content}
  //     </Alert>
  //     <IconButton size="small" aria-label="close" color="inherit" onClick={handleMessageClose}>
  //       <CloseIcon fontSize="small" />
  //     </IconButton>
  //   </React.Fragment>
  // );
  return (
    // <BrowserRouter>
    // {/* onSetNums={setNums} */}
    // {/* <Header></Header> */}
    // {/* onNum={Num} */}
    // {/* <Routing /> */}
    // <Routes>
    //   <Route path="*" element={<Layout />} />
    // </Routes>
    // </BrowserRouter>

    <Provider store={store}>
      <ThemeProvider theme={theme}>
        {/* <AppThemeProvider> */}
        <BrowserRouter>
          {/* message under components/Snackbar is no longer used */}
          <Snackbar
            open={MessageOpen}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            autoHideDuration={4000}
            onClose={handleMessageClose}
            sx={{
              zIndex: '100',
              '.MuiPaper-root': {
                display: 'flex',
                alignItems: 'center',
              },
            }}
            // message="Note archived"
            // action={action}
          >
            <Alert severity={MessageInfo.type} sx={{ width: '100%', display: 'flex', alignItemsL: 'center' }}>
              <div style={{ marginRight: '10px' }}>{MessageInfo.content}</div>
              {/* <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                sx={{ position: 'absolute', right: '0', top: '10px' }}
                onClick={handleMessageClose}
              >
                <CloseIcon fontSize="small" />
              </IconButton> */}
            </Alert>
          </Snackbar>
          <SnackbarModal></SnackbarModal>
          {/* onSetNums={setNums} */}
          <div className="LayoutHeader">
            <Header
              onMessageModal={setMessageIsOpen}
              openSelectWell={OpenSelectWell}
              editOpenSelectWell={editOpenSelectWell}
            ></Header>
          </div>
          {/* onNum={Num} */}
          <div className="LayouContent">
            <Routing
              onMessageModal={setMessageIsOpen}
              onEditWellOpen={editOpenSelectWell}
              openSelectWell={OpenSelectWell}
            />
          </div>
        </BrowserRouter>
        {/* </AppThemeProvider> */}
      </ThemeProvider>
    </Provider>
  );
};

export default App;
