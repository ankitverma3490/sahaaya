import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Text,
} from 'react-native';
import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import Input from '../../../Component/Input';
import DropdownComponent from '../../../Component/DropdownComponent';
import Date_Picker from '../../../Component/Date_Picker';
import { ImageConstant } from '../../../Constants/ImageConstant';
import ImageModal from '../../../Component/Modals/ImageModal';
import { POST_FORM_DATA } from '../../../Backend/Backend';
import { PROFILE_UPDATE } from '../../../Backend/api_routes';
import { formatDateWithDashes } from '../../../Backend/Utility';
import SimpleToast from 'react-native-simple-toast';
import { useDispatch, useSelector } from 'react-redux';
import { userDetails } from '../../../Redux/action';
import moment from 'moment';

const StepBasicInfoStaff = forwardRef((props, ref) => {
  const userDetail = useSelector(store => store?.userDetails);
  const dispatch = useDispatch();

  const [profileImage, setProfileImage] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState(null);
  const [dob, setDob] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (userDetail && Object.keys(userDetail).length > 0) {
      // First Name & Last Name prefill from Aadhaar / Profile
      const rawFn = userDetail?.first_name || userDetail?.user_detail?.first_name || '';
      const rawLn = userDetail?.last_name || userDetail?.user_detail?.last_name || '';
      const rawFullName = userDetail?.name || userDetail?.user_detail?.name || userDetail?.kycInformation?.name || '';
      let userEm = userDetail?.email || userDetail?.user_detail?.email || '';
      userEm = userEm.replace(/_deleted_\d+$/, '');

      if (userEm) setEmail(userEm);
      
      const isPlaceholderName = (str) => !str || str.toLowerCase() === 'user' || str.toLowerCase() === 'staff member';

      if (!isPlaceholderName(rawFn)) {
        setFirstName(rawFn);
        if (rawLn && !isPlaceholderName(rawLn)) setLastName(rawLn);
      } else if (!isPlaceholderName(rawFullName)) {
        const parts = rawFullName.trim().split(' ');
        setFirstName(parts[0]);
        if (parts.length > 1) {
          setLastName(parts.slice(1).join(' '));
        }
      } else {
        setFirstName('');
        setLastName('');
      }

      // Gender prefill from Aadhaar / Profile
      const userGender = userDetail?.gender || userDetail?.user_detail?.gender || userDetail?.kycInformation?.gender;
      if (userGender) {
        const cleanGender = String(userGender).trim().toLowerCase();
        setGender({
          label: cleanGender.charAt(0).toUpperCase() + cleanGender.slice(1),
          value: cleanGender,
        });
      }

      // DOB prefill from Aadhaar / Profile
      const userDob = userDetail?.dob || userDetail?.date_of_birth || userDetail?.user_detail?.dob || userDetail?.kycInformation?.dob;
      if (userDob) {
        const parsedDate = moment(userDob).toDate();
        if (parsedDate && !isNaN(parsedDate.getTime())) setDob(parsedDate);
      }

      // Profile Picture
      const imgPath = userDetail?.image || userDetail?.profile_picture || userDetail?.user_detail?.profile_picture;
      if (imgPath) {
        const imgUrl = String(imgPath).toLowerCase();
        const isDefault =
          imgUrl.includes('noimage') ||
          imgUrl.includes('no_image') ||
          imgUrl.includes('default') ||
          imgUrl.includes('placeholder');
        if (!isDefault) {
          setProfileImage({ uri: imgPath });
        }
      }
    }
  }, [userDetail]);

  useImperativeHandle(ref, () => ({
    saveBasicInfo: () => {
      return new Promise((resolve, reject) => {
        let errs = {};
        if (!firstName || firstName.trim() === '') {
          errs.firstName = 'First Name is required';
        } else if (firstName.trim().length < 2) {
          errs.firstName = 'First Name must be at least 2 characters';
        }
        if (!lastName || lastName.trim() === '') {
          errs.lastName = 'Last Name is required';
        } else if (lastName.trim().length < 2) {
          errs.lastName = 'Last Name must be at least 2 characters';
        }
        if (!gender || !gender.value) {
          errs.gender = 'Please select gender';
        }
        if (!dob) {
          errs.dob = 'Date of Birth is required';
        } else {
          const dobDate = new Date(dob);
          if (dobDate > new Date()) {
            errs.dob = 'Date of Birth cannot be in the future';
          }
        }
        if (email && email.trim() !== '') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email.trim())) {
            errs.email = 'Please enter a valid email address';
          }
        }

        if (Object.keys(errs).length > 0) {
          setErrors(errs);
          const firstErr = Object.values(errs)[0];
          SimpleToast.show(firstErr, SimpleToast.SHORT);
          return reject(new Error(firstErr));
        }

        setErrors({});
        const formData = new FormData();
        formData.append('first_name', firstName.trim());
        if (lastName && lastName.trim() !== '') {
          formData.append('last_name', lastName.trim());
        }
        if (email && email.trim() !== '') {
          formData.append('email', email.trim());
        }
        if (gender?.value) {
          formData.append('gender', gender.value);
        }
        if (dob) {
          const formattedDob = formatDateWithDashes(dob);
          if (formattedDob) formData.append('dob', formattedDob);
        }

        const imgUri = profileImage?.uri || profileImage?.path;
        if (imgUri && !imgUri.startsWith('http')) {
          formData.append('profile_picture', {
            uri: imgUri,
            name: profileImage.name || `profile_${Date.now()}.jpg`,
            type: profileImage.type || profileImage.mime || 'image/jpeg',
          });
        }

        formData.append('is_edit', '1');

        POST_FORM_DATA(
          PROFILE_UPDATE,
          formData,
          success => {
            if (success?.data) {
              dispatch(userDetails(success.data));
            }
            resolve(true);
          },
          error => {
            let msg = 'Failed to save basic information';
            if (error?.message && !error.message.includes('422')) {
              msg = error.message;
            } else if (error?.data?.message) {
              msg = error.data.message;
            } else if (error?.errors) {
              const errsList = Object.values(error.errors).flat();
              if (errsList.length > 0) msg = errsList[0];
            } else if (error?.error) {
              msg = typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
            }
            SimpleToast.show(msg, SimpleToast.LONG);
            reject(new Error(msg));
          },
          fail => {
            SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
            reject(new Error('Network error'));
          },
          { timeout: 30000 },
        );
      });
    },
  }));

  const handleImageSelected = images => {
    if (images && images.length > 0) {
      const selected = images[0];
      const uri = selected?.uri || selected?.path;
      setProfileImage({
        uri: uri,
        path: uri,
        name: selected?.fileName || selected?.filename || `profile_${Date.now()}.jpg`,
        type: selected?.type || selected?.mime || 'image/jpeg',
      });
    }
    setShowImageModal(false);
  };

  return (
    <View style={styles.container}>
      <Typography style={styles.sectionTitle} type={Font?.Manrope_Bold} size={18}>
        Basic Information
      </Typography>

      <View style={styles.profileContainer}>
        <View style={styles.profileWrapper}>
          <Image
            source={
              profileImage?.uri
                ? { uri: profileImage.path || profileImage.uri }
                : ImageConstant.user
            }
            style={styles.profileImage}
            onError={() => setProfileImage(null)}
          />
        </View>
        <TouchableOpacity
          style={styles.changePhotoBtn}
          onPress={() => setShowImageModal(true)}
        >
          <Image source={ImageConstant?.Camera} style={styles.changePhotoIcon} />
          <Typography
            type={Font?.Poppins_Medium}
            color={'#D98579'}
            style={styles.changePhotoText}
          >
            Upload Profile Photo
          </Typography>
        </TouchableOpacity>
      </View>

      <Input
        placeholder="Enter First Name"
        title="First Name *"
        value={firstName}
        onChange={text => {
          setFirstName(text);
          if (errors.firstName) setErrors({ ...errors, firstName: null });
        }}
        error={errors.firstName}
      />

      <Input
        placeholder="Enter Last Name"
        title="Last Name"
        value={lastName}
        onChange={text => setLastName(text)}
      />

      <Input
        placeholder="e.g. name@example.com"
        title="Email Address"
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
        onChange={text => {
          setEmail(text);
          if (errors.email) setErrors({ ...errors, email: null });
        }}
        error={errors.email}
      />

      <DropdownComponent
        title="Gender *"
        placeholder="Select Gender"
        width={'100%'}
        style_dropdown={{ marginHorizontal: 0 }}
        selectedTextStyleNew={{ marginLeft: 10 }}
        marginHorizontal={0}
        style_title={{ textAlign: 'left' }}
        value={gender}
        onChange={item => {
          setGender(item);
          if (errors.gender) setErrors({ ...errors, gender: null });
        }}
        error={errors.gender}
        data={[
          { label: 'Male', value: 'male' },
          { label: 'Female', value: 'female' },
          { label: 'Other', value: 'other' },
        ]}
      />

      <Date_Picker
        title="Date of Birth *"
        placeholder="Select DOB"
        selected_date={dob}
        allowFutureDates={false}
        disablePastDates={false}
        onConfirm={date => {
          setDob(date);
          if (errors.dob) setErrors({ ...errors, dob: null });
        }}
        error={errors.dob}
      />

      <ImageModal
        showModal={showImageModal}
        title={'Upload Profile Photo'}
        close={() => setShowImageModal(false)}
        selected={handleImageSelected}
        document={false}
      />
    </View>
  );
});

export default StepBasicInfoStaff;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontFamily: Font?.Manrope_Bold,
    fontSize: 18,
    marginBottom: 16,
    color: '#111',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileWrapper: {
    height: 100,
    width: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#D98579',
    backgroundColor: '#F7F7F7',
  },
  profileImage: {
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF5F3',
    borderWidth: 1,
    borderColor: '#D98579',
  },
  changePhotoIcon: {
    height: 16,
    width: 16,
    marginRight: 6,
    tintColor: '#D98579',
    resizeMode: 'contain',
  },
  changePhotoText: {
    fontSize: 13,
  },
});
