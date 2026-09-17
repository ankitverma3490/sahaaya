import SimpleToast from 'react-native-simple-toast';

const showToast = (message, type = 'error') => {
  const prefix = type === 'error' ? '' : '';
  SimpleToast.show(`${prefix}${message}`, SimpleToast.SHORT);
};

export const VALIDATE = {
  EMAIL:
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  ALPHABET_ONLY: /^[a-zA-Z \s]*$/,
  NUMBER: /^[0-9]+$/,
  MOBILE: /^\+?[0-9\s\-()]{1,20}$/,
  STREET: /^[a-zA-Z0-9 '-.~!@#$%^&*()_+={}[];':"<>,.\s]*$/,
  PASSWORD: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
  URL: /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i,
  OTP: /^\d{6}$/,
  // /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g,
};

export const validators = {
  // Lenient name check — allows letters, numbers, spaces, hyphens, apostrophes,
  // dots. Covers real names (O'Brien, Jean-Pierre) and test entries (test 3).
  // Backend only requires `string|max:255` so we should not be stricter.
  checkName: (name, min, max, value) => {
    var min = min || 2;
    var max = max || 50;
    if (value && value.trim()) {
      if (value.trim().length < min || value.trim().length > max) {
        return `${name} must be between ${min} to ${max} characters.`;
      }
      return null;
    } else {
      return `${name} field is required.`;
    }
  },

  checkAlphabet: (name, min, max, value) => {
    var min = min || 2;
    var max = max || 30;
    if (value) {
      if (!VALIDATE.ALPHABET_ONLY.test(value)) {
        return `${name} field is invalid.`;
      } else if (value.length < min || value.length > max) {
        return `${name} must be between ${min} to ${max} characters.`;
      }
      return null;
    } else {
      return `${name} field is required.`;
    }
  },

  checkAlphabetMaxLen: (name, max, value) => {
    var max = max || 30;
    if (value) {
      if (!VALIDATE.ALPHABET_ONLY.test(value)) {
        return `${name} field is invalid.`;
      } else if (value.length > max) {
        return `${name} can have at most ${max} characters.`;
      }
      return null;
    } else {
      return `${name} field is required.`;
    }
  },

  checkEmail: (name, value) => {
    if (value) {
      if (!VALIDATE.EMAIL.test(value)) {
        return `${name} field is invalid.`;
      } else {
        return null;
      }
    } else {
      return `${name} field is required.`;
    }
  },

  checkNumber: (name, value) => {
    if (value) {
      if (!VALIDATE.MOBILE.test(value)) {
        return `${name} field is invalid.`;
      }
      return null;
    } else {
      return `${name} field is required.`;
    }
  },

  checkDigits: (name, value) => {
    if (value) {
      if (!VALIDATE.NUMBER.test(value)) {
        return `${name} field is invalid.`;
      }
      return null;
    } else {
      return `${name} field is required.`;
    }
  },

  checkPhoneNumberWithFixLength: (name, max, value) => {
    var max = max || 10;
    if (value) {
      if (!VALIDATE.MOBILE.test(value)) {
        return `${name} field is invalid.`;
      } else if (value.length !== max) {
        return `${name} should be ${max} digits.`;
      }
      return null;
    } else {
      return `${name} field is required.`;
    }
  },

  checkPhoneNumber: (name, min, max, value) => {
    var min = min || 7;
    var max = max || 15;
    if (value) {
      if (!VALIDATE.MOBILE.test(value)) {
        return `${name} field is invalid.`;
      }
      return null;
    } else {
      return `${name} field is required.`;
    }
  },

  checkOptionalPhoneNumberWithFixLength: (name, max, value) => {
    var max = max || 10;
    if (value) {
      if (!VALIDATE.MOBILE.test(value)) {
        return `${name} field is invalid.`;
      } else if (value.length !== max) {
        return `${name} should be ${max} digits.`;
      }
      return null;
    } else {
      return null;
    }
  },
  checkFixPhoneNumber: (name, value, min = 10, max = 15) => {
    if (!value) {
      return `${name} field is required.`;
    }

    if (!VALIDATE.MOBILE.test(value)) {
      return `${name} field is invalid.`;
    }

    if (value.length < min || value.length > max) {
      return `${name} should be between ${min} and ${max} digits.`;
    }

    return null; // Valid case
  },
  wordCount: (name, value, min, max, words) => {
    var min = min || 1;
    var max = max || 300;
    var words = words || 50;
    if (value) {
      if (value.length < min || value.length > max) {
        return `${name} must be between ${min} to ${max} characters.`;
        // return false;
      }
      if (value.trim().split(/\s+/).length > words) {
        return `${name} must be between ${words} words.`;
        // return false;
      }
      return null;
    } else {
      return `${name} field is required.`;
      // return false;
    }
  },

  priceCheck: (name, value) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      const num = Number(value);
      if (isNaN(num)) {
        return `${name} must be a valid number.`;
      }
      if (num <= 0) {
        return `${name} must be greater than zero.`;
      }
      return null;
    } else {
      return `${name} field is required.`;
    }
  },

  checkNotNull: (name, min, max, value) => {
    var min = min || 10;
    var max = max || 100;

    if (value) {
      if (value < min || value > max) {
        return `${name} must be between ${min} to ${max}.`;
      }
      return null;
    } else {
      return `${name} field is required.`;
    }
  },

  checkRequire: (name, value) => {
    if (value !== null && value !== undefined && value !== '') {
      return null;
    } else {
      return `${name} field is required.`;
    }
  },
  checkMultiple: (name, value) => {
    if (value) {
      const arr = Array.isArray(value) ? value : [value];
      if (arr.length > 0) {
        return null;
      } else {
        return `${name} field is required.`;
      }
    } else {
      return `${name} field is required.`;
    }
  },

  checkPassword: (name, value) => {
    if (value) {
      if (!VALIDATE.PASSWORD.test(value)) {
        return `${name} must be at least 8 characters with one uppercase, one lowercase, one number, and one special character.`;
      }
      return null;
    } else {
      return `${name} field is required.`;
    }
  },

  checkMatch: (name, value, name2, value2) => {
    if (value2) {
      if (value === value2) {
        return null;
      } else {
        return `${name} and ${name2} do not match.`;
      }
    } else {
      return `${name2} field is required.`;
    }
  },

  checkStreet: (name, min, max, value) => {
    var min = min || 7;
    var max = max || 15;
    if (value) {
      if (!VALIDATE.STREET.test(value)) {
        showToast(`${name} field is invalid.`, 'error');
        return false;
      } else if (value.length < min || value.length > max) {
        showToast(
          `${name} entered must be between ${min} to ${max} characters.`,
          'error',
        );
        return false;
      }
      return true;
    } else {
      showToast(`${name} field is required.`, 'error');
      return false;
    }
  },

  checkUrl: (name, value) => {
    if (value) {
      if (!VALIDATE.URL.test(value)) {
        return `${name} field is invalid.`;
      }
      return null;
    } else {
      return `${name} field is required.`;
    }
  },
  checkOtp: (name, value) => {
    if (!value || value.trim() === '') {
      return `${name} field is required.`;
    }

    const trimmedValue = value.trim();

    // Check if the value is exactly 6 digits
    const OTP_REGEX = /^\d{6}$/;
    if (!OTP_REGEX.test(trimmedValue)) {
      return `${name} must be a 6-digit number.`;
    }

    return null; // valid
  },
  checkArrayLength: (name, value) => {
    if (value?.length > 0) {
      return null;
    } else {
      return `${name} field is required.`;
    }
  },
};
