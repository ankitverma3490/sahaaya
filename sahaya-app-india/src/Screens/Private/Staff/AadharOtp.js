import { StyleSheet, View, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { OtpInput } from 'react-native-otp-entry';
import CommanView from '../../../Component/CommanView';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import { ImageConstant } from '../../../Constants/ImageConstant';
import Button from '../../../Component/Button';
import HeaderForUser from '../../../Component/HeaderForUser';
import { POST_FORM_DATA } from '../../../Backend/Backend';
import { AADHAR_SAVE, AADHAR_VERFIY } from '../../../Backend/api_routes';
import LocalizedStrings from '../../../Constants/localization';
import { useDispatch } from 'react-redux';
import { userDetails } from '../../../Redux/action';

const AadharOtp = ({ navigation, route }) => {
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(30); // 30 sec timer
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { mobile, aadhar_number, user_id, is_staff_add } = route?.params || {};
  const effectiveAadhaar = aadhar_number || mobile;
  const last4 = effectiveAadhaar?.toString()?.slice(-4);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  // Resend OTP function
  const handleResend = () => {
    let data = new FormData();
    if (effectiveAadhaar) {
      data?.append('aadhar_number', String(effectiveAadhaar));
    }
    if (user_id) {
      data?.append('user_id', String(user_id));
    }
    if (is_staff_add !== undefined) {
      data?.append('is_staff_add', String(is_staff_add));
    }

    POST_FORM_DATA(
      AADHAR_SAVE,
      data,
      sucess => {
        setOtpError('');
        setResendTimer(30);
      },
      error => {
        let errorMsg = 'Failed to resend OTP. Please try again.';
        if (error?.data?.message) {
          errorMsg = error.data.message;
        } else if (error?.data?.error) {
          errorMsg = error.data.error;
        }
        setOtpError(errorMsg);
      },
      fail => {
        setOtpError('Network error. Please try again.');
      },
    );
  };

  // Verify OTP function
  const handleVerify = () => {
    if (loading) return;

    if (otp.length !== 6) {
      setOtpError(
        LocalizedStrings.AddStaff?.OTP_Placeholders ||
        'Please enter a valid 6-digit OTP',
      );
      return;
    }

    setLoading(true);
    setOtpError('');

    let data = new FormData();
    data?.append('otp', String(otp));
    if (effectiveAadhaar) {
      data?.append('aadhar_number', String(effectiveAadhaar));
    }
    if (user_id) {
      data?.append('user_id', String(user_id));
    }
    if (is_staff_add !== undefined) {
      data?.append('is_staff_add', String(is_staff_add));
    }

    try {
      POST_FORM_DATA(
        AADHAR_VERFIY,
        data,
        success => {
          try {
            setLoading(false);
            if (success?.status === false || success?.success === false) {
              const errMsg = success?.message || success?.error || 'Invalid OTP. Please try again.';
              setOtpError(errMsg);
              return;
            }
            const verifiedUser = success?.user || success?.data?.user || success?.data;
            if (verifiedUser && typeof verifiedUser === 'object') {
              dispatch(userDetails(verifiedUser));
            }
            navigation?.navigate('StepFirst');
          } catch (e) {
            setLoading(false);
            console.log('Aadhaar verify success handler error:', e);
            setOtpError('Something went wrong. Please try again.');
          }
        },
        error => {
          setLoading(false);
          let errorMsg = 'Invalid OTP. Please try again.';
          if (error?.data?.message) {
            errorMsg = error.data.message;
          } else if (error?.data?.error) {
            errorMsg = error.data.error;
          } else if (error?.data?.errors) {
            const errs = error.data.errors;
            errorMsg = Object.values(errs).flat().join('\n');
          } else if (error?.message) {
            errorMsg = error.message;
          }
          if (typeof errorMsg !== 'string') {
            try { errorMsg = JSON.stringify(errorMsg); } catch (e) { errorMsg = 'An unknown error occurred'; }
          }
          setOtpError(errorMsg);
        },
        fail => {
          setLoading(false);
          setOtpError('Network error. Please try again.');
        },
      );
    } catch (e) {
      setLoading(false);
      console.log('POST_FORM_DATA call error:', e);
      setOtpError('Something went wrong. Please try again.');
    }
  };

  return (
    <CommanView>
      {/* Header */}
      <HeaderForUser
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => {
          navigation?.goBack();
        }}
        title={LocalizedStrings.AddStaff?.Verify || 'Aadhaar OTP Verification'}
        style_title={{ fontSize: 18 }}
      />
      <View style={{ flex: 0.8, justifyContent: 'center' }}>
        {/* OTP Box */}
        <View style={styles.otpBox}>
          <Typography
            size={18}
            textAlign={'center'}
            type={Font?.Poppins_Medium}
          >
            {LocalizedStrings.AddStaff?.Verify || 'Verify Aadhaar OTP'}
          </Typography>
          <Typography size={12} textAlign={'center'} style={{ marginTop: 10 }}>
            {(LocalizedStrings.AddStaff?.Description || 'OTP sent to mobile linked with Aadhaar') + (last4 ? ` (ending in ${last4})` : '')}
          </Typography>

          {/* OTP Input */}
          <OtpInput
            numberOfDigits={6}
            focusColor="#D98579"
            onTextChange={text => setOtp(text)}
            textInputProps={{
              keyboardType: 'number-pad',
            }}
            theme={{
              containerStyle: { marginTop: 10, marginBottom: 15 },
              pinCodeContainerStyle: {
                borderWidth: 1,
                borderColor: otpError ? 'red' : '#ccc',
                borderRadius: 8,
              },
              pinCodeTextStyle: {
                fontSize: 18,
                fontFamily: Font?.Poppins_Medium,
                color: '#000',
                textAlign: 'center',
              },
            }}
          />
          {otpError ? (
            <Typography
              size={12}
              color="red"
              style={{ textAlign: 'center', marginBottom: 10 }}
            >
              {otpError}
            </Typography>
          ) : null}

          {/* Resend Option */}
          <TouchableOpacity
            onPress={handleResend}
            disabled={resendTimer > 0}
            style={{ alignSelf: 'center', marginBottom: 15 }}
          >
            {resendTimer > 0 ? (
              <Typography size={14} type={Font?.Poppins_Regular} color={'#999'}>
                Resend OTP in {resendTimer}s
              </Typography>
            ) : (
              <Typography size={14} color="#D98579" type={Font?.Poppins_Medium}>
                Resend OTP
              </Typography>
            )}
          </TouchableOpacity>

          <Button
            icon={ImageConstant?.Arrow}
            title={LocalizedStrings.AddStaff?.Verify_Add_Staff || 'Verify OTP & Continue'}
            onPress={handleVerify}
            style={{ marginTop: 10 }}
            loader={loading}
            disabled={loading}
          />
        </View>
      </View>
    </CommanView>
  );
};

export default AadharOtp;

const styles = StyleSheet.create({
  otpBox: {
    borderWidth: 1,
    borderColor: '#EBEBEA',
    padding: 20,
    borderRadius: 12,
    marginTop: 10,
  },
});
