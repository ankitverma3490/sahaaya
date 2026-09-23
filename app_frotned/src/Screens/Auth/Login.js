import { StyleSheet, TouchableOpacity, View, Alert, Modal } from 'react-native';
import React, { useState } from 'react';
import CommanView from '../../Component/CommanView';
import Header from '../../Component/Header';
import { Font } from '../../Constants/Font';
import { ImageConstant } from '../../Constants/ImageConstant';
import Input from '../../Component/Input';
import Typography from '../../Component/UI/Typography';
import Button from '../../Component/Button';
import LocalizedStrings from '../../Constants/localization';
import { validators } from './../../Backend/Validator';
import { isValidForm } from '../../Backend/Utility';
import { LOGIN } from './../../Backend/api_routes';
import { POST } from '../../Backend/Backend';

const Login = ({ navigation }) => {
  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [pendingLoginData, setPendingLoginData] = useState(null);

  const [selectedCountry, setSelectedCountry] = useState({
    flag: '🇮🇳',
    dial_code: '+91',
    name: 'India',
    code: 'IN',
  });

  const handleMobileChange = text => {
    const digitsOnly = text.replace(/[^0-9]/g, '').slice(0, 10);
    setMobile(digitsOnly);
    if (mobileError) setMobileError('');
  };

  const handleCountrySelect = country => {
    setSelectedCountry(country);
  };

  const handleVerify = () => {
    if (isLoading) return;

    let error = {
      number: validators?.checkPhoneNumberWithFixLength('Mobile', 10, mobile),
    };
    setMobileError(error?.number);

    if (isValidForm(error)) {
      var payload = {
        phone_number: mobile,
        country_code: selectedCountry.dial_code,
      };
      proceedLogin(payload, 0);
    }
  };

  const proceedLogin = (payload, retryCount = 0) => {
    setIsLoading(true);
    POST(
      LOGIN,
      payload,
      response => {
        setIsLoading(false);
        if (response?.status === true) {
          if (response?.is_deactivated) {
            setPendingLoginData({ response, payload });
            setShowActivateModal(true);
            return;
          }
          navigation?.navigate('Otp', {
            type: 'login',
            mobile: mobile,
            countryCode: selectedCountry.dial_code,
            user_id: response?.user_id,
            testOtp: response?.otp,
          });
        } else {
          setMobileError(
            response?.message ||
              LocalizedStrings.Auth?.mobile_invalid ||
              'Login failed. Please try again.',
          );
        }
      },
      error => {
        setIsLoading(false);
        if (error?.data?.message) {
          setMobileError(error?.data?.message);
        } else if (error?.message) {
          setMobileError(error.message);
        } else {
          setMobileError(
            LocalizedStrings.Auth?.mobile_invalid ||
              'Something went wrong. Please try again.',
          );
        }
      },
      fail => {
        console.log('Login Network Fail:', fail?.code, fail?.message, 'retry:', retryCount);
        if (retryCount < 2) {
          setTimeout(() => proceedLogin(payload, retryCount + 1), 2000);
          return;
        }
        setIsLoading(false);
        const failMsg = fail?.msg || fail?.message || '';
        if (failMsg.includes('timeout') || failMsg.includes('taking too long')) {
          setMobileError('Server is busy. Please try again in a moment.');
        } else {
          setMobileError('Network error. Please check your connection.');
        }
      },
    );
  };

  const handleActivateAccount = () => {
    setShowActivateModal(false);
    if (pendingLoginData) {
      const { response } = pendingLoginData;
      navigation?.navigate('Otp', {
        type: 'login',
        mobile: mobile,
        countryCode: selectedCountry.dial_code,
        user_id: response?.user_id,
        testOtp: response?.otp,
      });
    }
    setPendingLoginData(null);
  };

  const handleCancelActivate = () => {
    setShowActivateModal(false);
    setPendingLoginData(null);
  };

  return (
    <CommanView>
      <Header
        title={LocalizedStrings.Auth.login}
        style_title={{ fontFamily: Font?.Manrope_SemiBold }}
        centerIcon={true}
        centerIconSource={ImageConstant?.logo}
      />
      <View
        style={{
          borderWidth: 1,
          borderColor: '#EBEBEA',
          padding: 20,
          borderRadius: 12,
        }}
      >
        <Input
          countryPicker
          showTitle
          placeholder={LocalizedStrings.Auth.mobile_placeholder}
          value={mobile}
          onChange={handleMobileChange}
          style_input={[styles.inputText]}
          title={LocalizedStrings.Auth.enter_mobile}
          placeholderTextColor={'#00000080'}
          keyboardType="number-pad"
          maxLength={10}
          error={mobileError}
          country={selectedCountry}
          onCountryPress={handleCountrySelect}
        />

        <Typography size={14} style={{ marginTop: mobileError ? 5 : 0 }}>
          {LocalizedStrings.Auth.otp_message}
        </Typography>

        <Button
          title="Log In"
          onPress={handleVerify}
          style={{ marginTop: 20 }}
          icon={ImageConstant?.Arrow}
          disabled={isLoading}
          loader={isLoading}
        />

        <View style={styles.createAccountContainer}>
          <Typography style={{ textAlign: 'center' }}>
            {LocalizedStrings.Auth.no_account}
          </Typography>
          <TouchableOpacity
            onPress={() => navigation?.navigate('SiginUp')}
            style={styles.createAccountButton}
          >
            <Typography color="#D98579" type={Font?.Poppins_SemiBold}>
              {LocalizedStrings.Auth.create_account}
            </Typography>
          </TouchableOpacity>
        </View>

        <Typography size={13} style={styles.welcomeText}>
          Welcome again to Sahaya
        </Typography>
      </View>

      {/* Activate Account Modal */}
      <Modal
        transparent={true}
        visible={showActivateModal}
        animationType="fade"
        onRequestClose={handleCancelActivate}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCancelActivate}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalIconContainer}>
              <Typography style={styles.modalEmoji}>🔒</Typography>
            </View>
            <Typography
              type={Font?.Poppins_SemiBold}
              size={20}
              style={styles.modalTitle}
            >
              Activate Your Account
            </Typography>
            <Typography
              type={Font?.Poppins_Regular}
              size={14}
              style={styles.modalMessage}
              color="#666"
            >
              Your account is currently deactivated. Would you like to activate it and continue?
            </Typography>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalNoButton}
                onPress={handleCancelActivate}
              >
                <Typography
                  type={Font?.Poppins_Medium}
                  size={16}
                  color="#666"
                >
                  No
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalYesButton}
                onPress={handleActivateAccount}
                disabled={isLoading}
              >
                <Typography
                  type={Font?.Poppins_Medium}
                  size={16}
                  color="#fff"
                >
                  {isLoading ? 'Activating...' : 'Yes'}
                </Typography>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </CommanView>
  );
};

export default Login;

const styles = StyleSheet.create({
  inputText: {
    color: '#000',
  },
  inputError: {
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  createAccountContainer: {
    marginTop: 18,
    alignItems: 'center',
  },
  createAccountButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: '#FFF5F4',
    borderWidth: 1,
    borderColor: '#F1C3BC',
  },
  welcomeText: {
    marginTop: 18,
    textAlign: 'center',
    color: '#8C8D8B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF5F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalEmoji: {
    fontSize: 28,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalNoButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  modalYesButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#D98579',
    alignItems: 'center',
  },
});
