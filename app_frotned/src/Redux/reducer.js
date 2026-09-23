import { AUTH, TOKEN, LOG_OUT, USER, SKIP, LANGUAGE_CODE, USERTYPE } from './constant';
const initialState = {
  isAuth: false,
  isIntro: false,
  userDetails: {},
  Token: '',
  skipData: {
    intro: true,
  },
  language_code: '',
  userType: 'house',
};
const todoReducer = (state = initialState, action) => {
  switch (action.type) {
    case AUTH: {
      const status = action.payload;
      return {
        ...state,
        isAuth: status.isAuth,
      };
    }

    case SKIP: {
      const status = action.payload;
      return {
        ...state,
        skipData: status.skipData,
      };
    }

    case TOKEN: {
      const status = action.payload;
      return {
        ...state,
        Token: status.Token,
      };
    }
    case USER: {
      const status = action.payload;
      return {
        ...state,
        userDetails: status.userDetails,
      };
    }
    case LOG_OUT: {
      return initialState;
    }
    case LANGUAGE_CODE:
      return {
        ...state,
        language_code: action.payload.language_code,
      };
    case USERTYPE:{
      const status = action.payload;
      return {
        ...state,
        userType: status.userType,
      };
      }
    default:
      return state;
  }
};

export default todoReducer;
