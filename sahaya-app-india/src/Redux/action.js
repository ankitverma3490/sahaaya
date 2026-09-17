import {
  TOKEN,
  USER,
  LOG_OUT,
  SKIP,
  AUTH,
  LANGUAGE_CODE,USERTYPE
} from './constant';

export const isAuth = status => ({
  type: AUTH,
  payload: {
    isAuth: status,
  },
});
export const skipData = status => ({
  type: SKIP,
  payload: {
    skipData: status,
  },
});
export const userDetails = status => ({
  type: USER,
  payload: {
    userDetails: status,
  },
});
export const userType= status => ({
  type: USERTYPE,
  payload: {
    userType: status,
  },
});
export const Token = status => ({
  type: TOKEN,
  payload: {
    Token: status,
  },
});
export const logOut = () => ({
  type: LOG_OUT,
});

export const langCode = data => ({
  type: LANGUAGE_CODE,
  payload: {
    language_code: data,
  },
});
