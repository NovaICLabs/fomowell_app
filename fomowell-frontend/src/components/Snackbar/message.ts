import { globalSetMessageIsOpen } from './Snackbar';

const Message = {
  success: (content: string) => {
    globalSetMessageIsOpen({ type: 'success', content });
  },
  error: (content: string) => {
    globalSetMessageIsOpen({ type: 'error', content });
  },
  info: (content: string) => {
    globalSetMessageIsOpen({ type: 'info', content });
  },
  warning: (content: string) => {
    globalSetMessageIsOpen({ type: 'warning', content });
  },
};

export default Message;
