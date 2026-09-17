import { StyleSheet, Text, View, Platform } from 'react-native';
import React, { useState } from 'react';
import CommanView from '../../../Component/CommanView';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import Input from '../../../Component/Input';
import HeaderForUser from '../../../Component/HeaderForUser';
import Button from '../../../Component/Button';
import { useNavigation } from '@react-navigation/native';
import { ImageConstant } from '../../../Constants/ImageConstant';
import LocalizedStrings from '../../../Constants/localization';
import { validators } from '../../../Backend/Validator';
import { POST_FORM_DATA } from '../../../Backend/Backend';
import { AADHAR_SAVE } from '../../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';

const buildSafeStaffPayload = rawUser => {
  const user = rawUser && typeof rawUser === 'object' ? rawUser : {};
  let rawPhone = user?.phone_number || user?.mobile_number || user?.mobile || user?.phone || user?.contact_number || '';
  let cleanPhone = String(rawPhone || '').replace(/\D/g, '');
  if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) {
    cleanPhone = cleanPhone.slice(2);
  }

  return {
    id: user?.id || user?.user_id,
    user_id: user?.user_id || user?.id,
    name: user?.name,
    first_name: user?.first_name,
    last_name: user?.last_name,
    email: String(user?.email || '').replace(/_deleted_\d+$/, ''),
    phone_number: cleanPhone,
    mobile_number: cleanPhone,
    phone_number_prefix:
      user?.phone_number_prefix ||
      user?.phone_number_country_code ||
      user?.country_code ||
      '+91',
    gender: user?.gender || user?.sex || user?.aadhaar_details?.gender || user?.aadhaar_details?.sex || null,
    dob: user?.dob || user?.date_of_birth || user?.birthdate || user?.birth_date || user?.aadhaar_details?.dob || user?.aadhaar_details?.date_of_birth || null,
    aadhar_number: user?.aadhar_number || user?.aadhaar,
    aadhar__verify: user?.aadhar__verify,
    image: user?.image,
    upi_id: user?.upi_id,
    addresses: Array.isArray(user?.addresses) ? user.addresses : [],
    user_work_info: user?.user_work_info || user?.userWorkInfo || null,
    kyc_information: user?.kyc_information || user?.kycInformation || null,
    aadhar_front: user?.aadhar_front || user?.aadhaar_front || null,
    aadhar_back: user?.aadhar_back || user?.aadhaar_back || null,
    verification_certificate: user?.verification_certificate || null,
    relation: user?.relation || null,
    emergency_contact_name: user?.emergency_contact_name || user?.user_work_info?.emergency_contact_name || user?.userWorkInfo?.emergency_contact_name || user?.work_info?.emergency_contact_name || null,
    emergency_contact_number: user?.emergency_contact_number || user?.user_work_info?.emergency_contact_number || user?.userWorkInfo?.emergency_contact_number || user?.work_info?.emergency_contact_number || null,
  };
};

const Aadhar = ({ route }) => {
  const navigation = useNavigation();
  const { job_id, job_compensation, job_title, job_compensation_type } = route?.params || {};
  const [adharNumber, setAdharNumber] = useState('');
  const [error, setError] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const submit = () => {
    if (isLoading) return;

    if (!adharNumber || !adharNumber.trim()) {
      setError({ add_error: 'Aadhaar number is required' });
      return;
    }
    if (!/^[0-9]{12}$/.test(adharNumber)) {
      setError({ add_error: 'Aadhaar number must be exactly 12 digits' });
      return;
    }
    if (/^0{12}$/.test(adharNumber) || /^(\d)\1{11}$/.test(adharNumber)) {
      setError({ add_error: 'Please enter a valid Aadhaar number' });
      return;
    }

    setError({});
    setIsLoading(true);

    const body = {
      aadhar_number: adharNumber,
      is_staff_add: 1,
    };

    POST_FORM_DATA(
      AADHAR_SAVE,
      body,
      sucess => {
        setIsLoading(false);
        SimpleToast.show(sucess?.message, SimpleToast.SHORT);
        navigation?.navigate('StaffVerifection', {
          adharNumber: adharNumber,
          userData: buildSafeStaffPayload(sucess?.data),
          otpAlreadySent: true,
          job_id,
          job_compensation,
          job_title,
          job_compensation_type,
        });
      },
      error => {
        setIsLoading(false);
        setError({
          add_error: error?.data?.errors?.aadhar_number?.[0] || error?.data?.message || error?.message || 'Something went wrong',
        });
      },
      fail => {
        setIsLoading(false);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  return (
    <CommanView>
      <HeaderForUser
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => {
          navigation?.goBack();
        }}
        title={LocalizedStrings.AddStaff?.title || 'Aadhaar Number'}
        style_title={styles.headerTitle}
      />

      <View style={styles.centerContainer}>
        <View style={styles.formContainer}>
          <Typography type={Font?.Poppins_SemiBold} style={styles.fieldLabel}>
            {LocalizedStrings.AddStaff?.Aadhaar_Number || 'Aadhaar Number'}
          </Typography>

          <Input
            placeholder={LocalizedStrings.AddStaff?.Aadhaar_Placeholder || 'Enter 12-digit Aadhaar Number'}
            keyboardType="number-pad"
            maxLength={12}
            value={adharNumber}
            onChange={text => {
              setAdharNumber(text);
              if (error?.add_error) setError({});
            }}
            error={error?.add_error}
          />

          <View style={{ marginTop: 20 }}>
            <Button
              onPress={() => submit()}
              title={LocalizedStrings.AddStaff?.Submit || 'Submit'}
              main_style={styles.buttonStyle}
              icon={ImageConstant?.Arrow}
              disabled={isLoading}
              loader={isLoading}
            />
          </View>

          <Typography type={Font?.Poppins_Regular} style={styles.noteText}>
            {LocalizedStrings.AddStaff?.Aadhaar_Info ||
              'We use Aadhaar for identity verification and to prevent fraudulent listings, enhancing trust within the Sahayya community.'}
          </Typography>
        </View>
      </View>
    </CommanView>
  );
};

export default Aadhar;

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 18,
    fontFamily: Font?.Poppins_SemiBold,
  },
  centerContainer: {
    paddingTop: 30,
    paddingHorizontal: 16,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  fieldLabel: {
    fontSize: 15,
    fontFamily: Font?.Poppins_Medium,
    color: '#666666',
    marginBottom: 8,
  },
  buttonStyle: {
    width: '100%',
    height: 48,
    borderRadius: 12,
  },
  noteText: {
    fontSize: 12,
    color: '#8C8D8B',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
    paddingHorizontal: 6,
  },
});
