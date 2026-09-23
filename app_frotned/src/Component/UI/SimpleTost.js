import SimpleToast from 'react-native-simple-toast';
export const ToastMsg = (message, time = 100) => {
  let timeout = setTimeout(() => {
    SimpleToast.show(message ? message : 'Sorry, Something went wrong. Please try again later.',SimpleToast.LONG);
    clearTimeout(timeout);
  }, 500);
};
