// Validation utility functions for form inputs

export const validateMobileNumber = (mobile) => {
  const errors = [];
  
  // Remove any non-digit characters
  const cleanMobile = mobile.replace(/\D/g, '');
  
  // Check if mobile number is empty
  if (!cleanMobile || cleanMobile.length === 0) {
    errors.push('mobile_required');
    return { isValid: false, errors, cleanMobile: '' };
  }
  
  // Check if mobile number contains only digits
  if (!/^\d+$/.test(cleanMobile)) {
    errors.push('mobile_invalid_format');
    return { isValid: false, errors, cleanMobile };
  }
  
  // Check mobile number length
  if (cleanMobile.length < 10) {
    errors.push('mobile_too_short');
    return { isValid: false, errors, cleanMobile };
  }
  
  if (cleanMobile.length > 10) {
    errors.push('mobile_too_long');
    return { isValid: false, errors, cleanMobile };
  }
  
  // Check if it's a valid Indian mobile number (starts with 6, 7, 8, or 9)
  if (!/^[6-9]/.test(cleanMobile)) {
    errors.push('mobile_invalid');
    return { isValid: false, errors, cleanMobile };
  }
  
  return { isValid: true, errors: [], cleanMobile };
};

export const validateEmail = (email) => {
  const errors = [];
  
  if (!email || email.trim().length === 0) {
    errors.push('email_required');
    return { isValid: false, errors };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    errors.push('email_invalid');
    return { isValid: false, errors };
  }
  
  return { isValid: true, errors: [] };
};

export const validateName = (name) => {
  const errors = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('name_required');
    return { isValid: false, errors };
  }
  
  if (name.trim().length < 2) {
    errors.push('name_too_short');
    return { isValid: false, errors };
  }
  
  if (name.trim().length > 50) {
    errors.push('name_too_long');
    return { isValid: false, errors };
  }
  
  return { isValid: true, errors: [] };
};

export const validateOTP = (otp) => {
  const errors = [];
  
  if (!otp || otp.length === 0) {
    errors.push('otp_required');
    return { isValid: false, errors };
  }
  
  if (otp.length !== 6) {
    errors.push('otp_invalid_length');
    return { isValid: false, errors };
  }
  
  if (!/^\d+$/.test(otp)) {
    errors.push('otp_invalid_format');
    return { isValid: false, errors };
  }
  
  return { isValid: true, errors: [] };
};

