import { StyleSheet, View, ScrollView, Image, TouchableOpacity, Text, Alert, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import CommanView from '../../../Component/CommanView';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import Input from '../../../Component/Input';
import HeaderForUser from '../../../Component/HeaderForUser';
import Button from '../../../Component/Button';
import DropdownComponent from '../../../Component/DropdownComponent';
import UploadBox from '../../../Component/UploadBox';
import Date_Picker from '../../../Component/Date_Picker';
import GooglePlacesInput from '../../../Component/GooglePlacesInput';
import MapLocationPicker from '../../../Component/MapLocationPicker';
import { ImageConstant } from '../../../Constants/ImageConstant';
import { isPlaceholderImage } from '../../../Utils/ImageUtils';
import LocalizedStrings from '../../../Constants/localization';
import { POST_FORM_DATA, GET_WITH_TOKEN, POST_WITH_TOKEN } from '../../../Backend/Backend';
import ImageModal from '../../../Component/Modals/ImageModal';
import { validators } from '../../../Backend/Validator';
import { fetchPincodeDetails } from '../../../Backend/Utility';
import SimpleToast from 'react-native-simple-toast';
import moment from 'moment';
import { launchImageLibrary } from 'react-native-image-picker';
import { 
  AddStaff, 
  UpdateStaff, 
  CATEGORY, 
  SUBSCRIPTION_CREATE_EXTRA_STAFF_ORDER, 
  SUBSCRIPTION_VERIFY_EXTRA_STAFF_PAYMENT 
} from '../../../Backend/api_routes';
import { initiatePayment } from '../../../Backend/razorpay';
import ProfileStepRoller from '../../../Component/UI/ProfileStepRoller';
import { useSelector } from 'react-redux';

const NewStaffForm = ({ navigation, route }) => {

  const data = route?.params?.userData;
  const userDetail = useSelector(state => state.userDetails);
  const adharNumber = route?.params?.adharNumber;
  const kycInfo = data?.kyc_information || data?.kycInformation || {};
  const existingPoliceClearance =
    data?.verification_certificate ||
    data?.police_clearance_certificate ||
    kycInfo?.police_verification_path ||
    kycInfo?.verification_certificate ||
    '';
  const existingAadharFront =
    data?.aadhar_front || data?.aadhaar_front || kycInfo?.aadhaar_front_path || '';
  const existingAadharBack =
    data?.aadhar_back || data?.aadhaar_back || kycInfo?.aadhaar_back_path || '';
  const cleanPhone = num => {
    if (!num) return '';
    let str = String(num).replace(/\D/g, '');
    if (str.length > 10 && str.startsWith('91')) {
      str = str.slice(2);
    }
    return str;
  };

  const existingPhoneNumber = cleanPhone(
    data?.phone_number ||
    data?.mobile_number ||
    data?.mobile ||
    data?.phone ||
    data?.contact_number ||
    data?.aadhaar_details?.mobile_number ||
    ''
  );
  const existingPhoneCountryCode =
    data?.phone_number_country_code ||
    data?.phone_number_prefix ||
    data?.country_code ||
    '+91';

  // Personal Details States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(existingPhoneNumber || '');
  const [phoneNumberCountryCode, setPhoneNumberCountryCode] = useState(
    existingPhoneCountryCode.startsWith('+') ? existingPhoneCountryCode : `+${existingPhoneCountryCode}`
  );
  const [aadharNumber, setAadharNumber] = useState(adharNumber || '');
  const [gender, setGender] = useState(null);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  // renamed to avoid confusion with React state
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [areaLocality, setAreaLocality] = useState('');
  const [googleLocation, setGoogleLocation] = useState('');
  const [lat, setLat] = useState('');
  const [long, setLong] = useState('');
  // Permanent Address States
  const [permStreet, setPermStreet] = useState('');
  const [permCity, setPermCity] = useState('');
  const [permStateName, setPermStateName] = useState('');
  const [permPincode, setPermPincode] = useState('');
  // Previous Owner Contact States
  const [prevOwnerName, setPrevOwnerName] = useState('');
  const [prevOwnerPhone, setPrevOwnerPhone] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactNumber, setEmergencyContactNumber] = useState('');
  const [relation, setRelation] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentPickerType, setCurrentPickerType] = useState(null);

  // Work Details States
  const [roleDesignation, setRoleDesignation] = useState([]); // array for multi-select
  const [selectedSkills, setSelectedSkills] = useState([]); // array of skills
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [joiningDate, setJoiningDate] = useState('');
  const [salary, setSalary] = useState(
    data?.user_work_info?.salary
      ? String(data?.user_work_info?.salary)
      : route?.params?.job_compensation
        ? String(route?.params?.job_compensation)
        : ''
  );
  const [upiId, setUpiId] = useState('');
  const [payFrequency, setPayFrequency] = useState(null);
  const [workingDays, setWorkingDays] = useState([]); // array of values
  const [salaryClosingDate, setSalaryClosingDate] = useState(null);
  const [preferredWorkCities, setPreferredWorkCities] = useState([]); // array of cities
  const [selectedLanguages, setSelectedLanguages] = useState([]); // array of languages

  // Document States
  const [staffPhoto, setStaffPhoto] = useState(null);
  const [policeClearance, setPoliceClearance] = useState(null);
  const [aadharCard, setAadharCard] = useState(null);
  const [aadharBack, setAadharBack] = useState(null);

  // API States
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Error States
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    aadharNumber: '',
    gender: '',
    dateOfBirth: '',
    street: '',
    city: '',
    stateName: '',
    pincode: '',
    areaLocality: '',
    googleLocation: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    relation: '',
    roleDesignation: '',
    joiningDate: '',
    salary: '',
    payFrequency: '',
    workingDays: '',
  });

  // Gender Options
  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ];

  // Pay Frequency Options
  const payFrequencyOptions = [
    { label: 'Monthly', value: 'monthly' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Daily', value: 'daily' },
  ];

  const getOrdinalSuffix = num => {
    const j = num % 10,
      k = num % 100;
    if (j === 1 && k !== 11) return `${num}st`;
    if (j === 2 && k !== 12) return `${num}nd`;
    if (j === 3 && k !== 13) return `${num}rd`;
    return `${num}th`;
  };

  // Salary Closing Date Options (End of month + 1st to 31st)
  const salaryClosingDateOptions = [
    { label: 'End of month (Last day of month)', value: 31 },
    ...Array.from({ length: 31 }, (_, i) => {
      const day = i + 1;
      return {
        label: day === 31 ? '31st of each month (End of month)' : `${getOrdinalSuffix(day)} of each month`,
        value: day,
      };
    }),
  ];

  // Working Days Options
  const workingDaysOptions = [
    { label: 'Mon', value: 'Monday' },
    { label: 'Tue', value: 'Tuesday' },
    { label: 'Wed', value: 'Wednesday' },
    { label: 'Thu', value: 'Thursday' },
    { label: 'Fri', value: 'Friday' },
    { label: 'Sat', value: 'Saturday' },
    { label: 'Sun', value: 'Sunday' },
  ];

  // Languages list for multi-select
  const languagesList = [
    'English',
    'Hindi',
    'Telugu',
    'Tamil',
    'Kannada',
    'Malayalam',
    'Marathi',
    'Gujarati',
    'Bengali',
    'Punjabi',
    'Odia',
    'Assamese',
    'Urdu',
    'Nepali',
  ];

  // Relation Options — project-appropriate for Indian household staff emergency contacts
  const relationOptions = [
    { label: 'Father', value: 'father' },
    { label: 'Mother', value: 'mother' },
    { label: 'Husband', value: 'husband' },
    { label: 'Wife', value: 'wife' },
    { label: 'Brother', value: 'brother' },
    { label: 'Sister', value: 'sister' },
    { label: 'Son', value: 'son' },
    { label: 'Daughter', value: 'daughter' },
    { label: 'Grandfather', value: 'grandfather' },
    { label: 'Grandmother', value: 'grandmother' },
    { label: 'Uncle', value: 'uncle' },
    { label: 'Aunt', value: 'aunt' },
    { label: 'Cousin', value: 'cousin' },
    { label: 'Nephew', value: 'nephew' },
    { label: 'Niece', value: 'niece' },
    { label: 'Father-in-law', value: 'father_in_law' },
    { label: 'Mother-in-law', value: 'mother_in_law' },
    { label: 'Brother-in-law', value: 'brother_in_law' },
    { label: 'Sister-in-law', value: 'sister_in_law' },
    { label: 'Friend', value: 'friend' },
    { label: 'Neighbour', value: 'neighbour' },
    { label: 'Colleague', value: 'colleague' },
    { label: 'Guardian', value: 'guardian' },
    { label: 'Other', value: 'other' },
  ];

  // Check if editing mode - only true when explicitly passed as edit
  const isEditMode = !!route?.params?.isEdit;
  const staffId = route?.params?.staffId || data?.staff_id || data?.id;

  // Populate form with existing data when editing or Aadhaar pre-fill
  useEffect(() => {
    if (data && (data.id || data.user_id || data.first_name || data.name || data.aadhar_number || data.phone_number || data.mobile_number)) {
      // Personal Details
      if (data.first_name) setFirstName(data.first_name);
      if (data.last_name) setLastName(data.last_name);

      // If first_name is missing but name or full_name is present (common in Aadhaar verified data), split it
      const displayName = data.name || data.full_name || data.fullname;
      if (displayName && !data.first_name && !firstName) {
        const nameParts = String(displayName).trim().split(/\s+/);
        if (nameParts.length > 0) {
          setFirstName(nameParts[0]);
          if (nameParts.length > 1) {
            setLastName(nameParts.slice(1).join(' '));
          }
        }
      }

      if (data.email) setEmail(data.email);
      if (existingPhoneNumber) setPhoneNumber(existingPhoneNumber);
      if (existingPhoneCountryCode) {
        setPhoneNumberCountryCode(
          existingPhoneCountryCode.startsWith('+') ? existingPhoneCountryCode : `+${existingPhoneCountryCode}`
        );
      }
      if (data.aadhar_number || data.aadhaar) setAadharNumber(data.aadhar_number || data.aadhaar);

      // Gender - find matching option
      const userGender =
        data?.gender ||
        data?.sex ||
        data?.aadhaar_details?.gender ||
        data?.aadhaar_details?.sex ||
        data?.aadhaar_data?.gender ||
        data?.kyc_information?.gender ||
        '';
      if (userGender) {
        const gStr = String(userGender).trim().toLowerCase();
        let genderOption = null;
        if (gStr === 'm' || gStr === 'male' || gStr.startsWith('m')) {
          genderOption = { label: 'Male', value: 'male' };
        } else if (gStr === 'f' || gStr === 'female' || gStr.startsWith('f')) {
          genderOption = { label: 'Female', value: 'female' };
        } else if (gStr === 'o' || gStr === 'other' || gStr.startsWith('o')) {
          genderOption = { label: 'Other', value: 'other' };
        } else {
          genderOption = genderOptions.find(
            opt =>
              opt.value === gStr ||
              opt.value.toLowerCase() === gStr ||
              opt.label.toLowerCase() === gStr,
          ) || {
            label: String(userGender).charAt(0).toUpperCase() + String(userGender).slice(1),
            value: gStr,
          };
        }
        if (genderOption) {
          setGender(genderOption);
        }
      }

      // Date of Birth
      const userDob =
        data?.dob ||
        data?.birthdate ||
        data?.date_of_birth ||
        data?.birth_date ||
        data?.aadhaar_details?.dob ||
        data?.aadhaar_details?.date_of_birth ||
        data?.aadhaar_data?.dob ||
        data?.kyc_information?.dob ||
        '';
      if (userDob) {
        // Handle different date formats
        const dobMoment = moment(
          String(userDob).trim(),
          ['YYYY-MM-DD', 'DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY/MM/DD', moment.ISO_8601],
          false,
        );
        if (dobMoment.isValid()) {
          setDateOfBirth(dobMoment.format('YYYY-MM-DD'));
        } else if (/^\d{4}$/.test(String(userDob).trim())) {
          setDateOfBirth(`${String(userDob).trim()}-01-01`);
        } else {
          setDateOfBirth(String(userDob));
        }
      }

      // Address from addresses array - split present vs permanent by address_type
      if (data.addresses && data.addresses.length > 0) {
        const presentAddr =
          data.addresses.find(a => a.address_type === 'present') ||
          data.addresses.find(a => a.google_location) ||
          null;
        const permAddr = data.addresses.find(a => a.address_type === 'permanent');

        // Present address (Google-based)
        if (presentAddr) {
          if (presentAddr.street) setStreet(presentAddr.street);
          if (presentAddr.city) setCity(presentAddr.city);
          if (presentAddr.state) setStateName(presentAddr.state);
          if (presentAddr.pincode) setPincode(String(presentAddr.pincode));
          if (presentAddr.area_locality) setAreaLocality(presentAddr.area_locality);
          if (presentAddr.google_location) setGoogleLocation(presentAddr.google_location);
          if (presentAddr.lat || presentAddr.latitude) setLat(String(presentAddr.lat || presentAddr.latitude));
          if (presentAddr.long || presentAddr.longitude) setLong(String(presentAddr.long || presentAddr.longitude));
        }

        // Permanent address (Aadhaar)
        if (permAddr) {
          if (permAddr.street) setPermStreet(permAddr.street);
          if (permAddr.city) setPermCity(permAddr.city);
          if (permAddr.state) setPermStateName(permAddr.state);
          if (permAddr.pincode) setPermPincode(String(permAddr.pincode));
        }
      }

      // Relation
      const contactRelation = data.relation || data.user_work_info?.emergency_contact_relation || data.work_info?.emergency_contact_relation;
      if (contactRelation) {
        // Check if it's a string (name) or needs to be mapped to option
        const relationOption = relationOptions.find(
          opt => opt.value === contactRelation || opt.label === contactRelation,
        );
        if (relationOption) {
          setRelation(relationOption);
        } else {
          // If relation is a name string, try to find or create option
          setRelation({
            label: String(contactRelation),
            value: String(contactRelation).toLowerCase(),
          });
        }
      }

      // UPI ID
      if (data.upi_id) setUpiId(data.upi_id);

      const workInfo = data.user_work_info || data.userWorkInfo || data.work_info;
      // Role / Designation prefill
      const rawRole =
        workInfo?.primary_role ||
        workInfo?.role_designation ||
        data?.primary_role ||
        data?.role_designation ||
        data?.role ||
        '';
      if (rawRole) {
        const roleArr = Array.isArray(rawRole)
          ? rawRole
          : typeof rawRole === 'string'
            ? rawRole.split(',').map(r => r.trim()).filter(Boolean)
            : [];
        if (roleArr.length > 0) {
          setRoleDesignation(roleArr);
        }
      }

      // Skills & Expertise prefill
      const rawSkills =
        workInfo?.skills ||
        data?.skills ||
        '';
      if (rawSkills) {
        const skillArr = Array.isArray(rawSkills)
          ? rawSkills
          : typeof rawSkills === 'string'
            ? rawSkills.split(',').map(s => s.trim()).filter(Boolean)
            : [];
        if (skillArr.length > 0) {
          setSelectedSkills(skillArr);
        }
      }

      // Previous Owner Contact prefill
      const prevName = workInfo?.previous_owner_name || workInfo?.prev_owner_name || data?.previous_owner_name || data?.prev_owner_name;
      if (prevName) setPrevOwnerName(prevName);
      const prevPhone = workInfo?.previous_owner_phone || workInfo?.prev_owner_phone || data?.previous_owner_phone || data?.prev_owner_phone;
      if (prevPhone) setPrevOwnerPhone(String(prevPhone));

      // Emergency Contact prefill
      const emName =
        workInfo?.emergency_contact_name ||
        data?.emergency_contact_name ||
        data?.user_detail?.emergency_contact_name ||
        data?.user_work_info?.emergency_contact_name ||
        '';
      if (emName) setEmergencyContactName(emName);

      const rawEmPhone =
        workInfo?.emergency_contact_number ||
        workInfo?.emergency_contact_phone ||
        workInfo?.emergency_phone ||
        workInfo?.emergency_number ||
        data?.emergency_contact_number ||
        data?.emergency_contact_phone ||
        data?.emergency_phone ||
        data?.emergency_number ||
        data?.user_detail?.emergency_contact_number ||
        data?.user_detail?.emergency_contact_phone ||
        data?.user_work_info?.emergency_contact_number ||
        data?.user_work_info?.emergency_contact_phone ||
        '';
      if (rawEmPhone) {
        let clean = String(rawEmPhone).replace(/\D/g, '');
        if (clean.length > 10 && clean.startsWith('91')) clean = clean.slice(2);
        setEmergencyContactNumber(clean.slice(0, 10));
      }

      if (workInfo) {
        if (workInfo.salary) {
          const sNum = Number(workInfo.salary);
          setSalary(!isNaN(sNum) ? (sNum % 1 === 0 ? String(Math.round(sNum)) : String(sNum)) : String(workInfo.salary));
        }
        if (workInfo.pay_frequency) {
          const freqOption = payFrequencyOptions.find(opt => opt.value === workInfo.pay_frequency);
          setPayFrequency(freqOption || { label: workInfo.pay_frequency, value: workInfo.pay_frequency });
        }
        if (workInfo.working_days) {
          try {
            const days = typeof workInfo.working_days === 'string' 
              ? JSON.parse(workInfo.working_days) 
              : workInfo.working_days;
            setWorkingDays(Array.isArray(days) ? days : []);
          } catch (e) {
            setWorkingDays([]);
          }
        }
        if (
          workInfo.salary_closing_date !== undefined &&
          workInfo.salary_closing_date !== null &&
          workInfo.salary_closing_date !== ''
        ) {
          const val = Number(workInfo.salary_closing_date);
          const closingOption = salaryClosingDateOptions.find(
            opt => opt.value === val,
          );
          setSalaryClosingDate(
            closingOption || {
              label:
                val === 31
                  ? 'End of month (Last day of month)'
                  : `${getOrdinalSuffix(val)} of each month`,
              value: val,
            },
          );
        }
        if (workInfo.preferred_work_location) {
          const raw = workInfo.preferred_work_location;
          const parsed = raw.split(',').map(s => s.trim()).filter(Boolean);
          setPreferredWorkCities(parsed);
        }
        if (workInfo.languages_spoken) {
          const langs = Array.isArray(workInfo.languages_spoken)
            ? workInfo.languages_spoken.filter(l => l)
            : typeof workInfo.languages_spoken === 'string'
              ? workInfo.languages_spoken.split(',').map(l => l.trim()).filter(l => l)
              : [];
          setSelectedLanguages(langs);
        }
      }

      // Images - only set if it's a real image and not a placeholder
      if (data.image && !isPlaceholderImage(data.image)) {
        setStaffPhoto({ uri: data.image });
      }
      if (existingAadharFront && !isPlaceholderImage(existingAadharFront)) {
        setAadharCard({ uri: existingAadharFront });
      }
      if (existingAadharBack && !isPlaceholderImage(existingAadharBack)) {
        setAadharBack({ uri: existingAadharBack });
      }
      if (existingPoliceClearance && !isPlaceholderImage(existingPoliceClearance)) {
        setPoliceClearance({ uri: existingPoliceClearance });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Clear city and state when pincode is cleared
  useEffect(() => {
    if (!pincode || pincode.length < 6) {
      setCity('');
      setStateName('');
      setErrors(prev => ({ ...prev, city: '', stateName: '' }));
    }
  }, [pincode]);

  // Fetch pincode details and auto-fill city and state
  useEffect(() => {
    const fetchDetails = async () => {
      if (pincode && pincode.length === 6) {
        try {
          const details = await fetchPincodeDetails(pincode);
          if (details && details.city) {
            setCity(details.city);
            setErrors(prev => (prev?.city ? { ...prev, city: null } : prev));
          }
          if (details && details.state) {
            setStateName(details.state);
            setErrors(prev =>
              prev?.stateName ? { ...prev, stateName: null } : prev,
            );
          }
        } catch (error) {
          console.error('Error fetching pincode details:', error);
        }
      }
    };

    // Small delay to avoid multiple calls (matching StepLocation)
    const timer = setTimeout(() => {
      fetchDetails();
    }, 300);

    return () => clearTimeout(timer);
  }, [pincode]);

  // Fetch roles from CATEGORY API on mount
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = () => {
    setRolesLoading(true);
    GET_WITH_TOKEN(
      CATEGORY,
      success => {
        setRolesLoading(false);
        let rolesData = [];

        if (success?.data && Array.isArray(success.data)) {
          rolesData = success.data.map(role => ({
            label:
              role?.name ||
              role?.title ||
              role?.category_name ||
              role?.category ||
              String(role),
            value: role?.id || role?.value || role?.role_id || role?.name,
            id: role?.id || role?.value || role?.role_id,
          }));
        } else if (success?.roles && Array.isArray(success.roles)) {
          rolesData = success.roles.map(role => ({
            label:
              role?.name ||
              role?.title ||
              role?.category_name ||
              role?.category ||
              String(role),
            value: role?.id || role?.value || role?.role_id || role?.name,
            id: role?.id || role?.value || role?.role_id,
          }));
        } else if (Array.isArray(success)) {
          rolesData = success.map(role => ({
            label:
              role?.name ||
              role?.title ||
              role?.category_name ||
              role?.category ||
              String(role),
            value: role?.id || role?.value || role?.role_id || role?.name,
            id: role?.id || role?.value || role?.role_id,
          }));
        }

        setRoles(rolesData);
      },
      error => {
        setRolesLoading(false);
        SimpleToast.show('Failed to load roles', SimpleToast.SHORT);
      },
    );
  };

  // Match role name to dropdown value when roles are loaded (for edit mode)
  useEffect(() => {
    if (roles.length > 0 && roleDesignation && typeof roleDesignation === 'string') {
      const roleObj = roles.find(
        role =>
          role.label === roleDesignation ||
          role.label?.toLowerCase() === roleDesignation?.toLowerCase() ||
          role.label?.includes(roleDesignation) ||
          roleDesignation?.includes(role.label),
      );
      if (roleObj) {
        setRoleDesignation(roleObj.value || roleObj.id);
      }
    }
  }, [roleDesignation, roles]);

  // Clear error handlers
  const clearError = field => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Image picker handler
  const handleImagePicker = type => {
    setCurrentPickerType(type);
    setShowImageModal(true);
  };

  const handleImageSelected = (images) => {
    if (images && images.length > 0) {
      const asset = images[0];
      const imageData = {
        uri: asset.uri || asset.path,
        type: asset.type || asset.mime || 'image/jpeg',
        name: asset.fileName || asset.filename || `${currentPickerType}_${Date.now()}.jpg`,
        path: asset.path || asset.uri,
      };

      if (currentPickerType === 'staffPhoto') {
        setStaffPhoto(imageData);
      } else if (currentPickerType === 'policeClearance') {
        setPoliceClearance(imageData);
      } else if (currentPickerType === 'aadharCard') {
        setAadharCard(imageData);
      } else if (currentPickerType === 'aadharBack') {
        setAadharBack(imageData);
      }
    }
  };

  // toggle working day for multi-select
  const toggleWorkingDay = dayValue => {
    setWorkingDays(prev => {
      if (prev.includes(dayValue)) {
        return prev.filter(d => d !== dayValue);
      }
      return [...prev, dayValue];
    });
    clearError('workingDays');
  };

  const isAllIndiaSelected = preferredWorkCities.includes('All India');

  const togglePreferredCity = city => {
    if (city === 'All India') {
      setPreferredWorkCities(['All India']);
      return;
    }
    setPreferredWorkCities(prev => {
      const without = prev.filter(c => c !== 'All India');
      if (without.includes(city)) {
        return without.filter(c => c !== city);
      }
      return [...without, city];
    });
  };

  const addCityFromText = city => {
    const trimmed = city.trim();
    if (!trimmed) return;
    setPreferredWorkCities(prev => {
      const without = prev.filter(c => c !== 'All India');
      if (without.includes(trimmed)) return without;
      return [...without, trimmed];
    });
  };

  // toggle language for multi-select
  const toggleLanguage = lang => {
    setSelectedLanguages(prev => {
      if (prev.includes(lang)) {
        return prev.filter(l => l !== lang);
      }
      return [...prev, lang];
    });
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      aadharNumber: '',
      gender: '',
      dateOfBirth: '',
      street: '',
      city: '',
      stateName: '',
      pincode: '',
      areaLocality: '',
      googleLocation: '',
      emergencyContactName: '',
      emergencyContactNumber: '',
      relation: '',
      roleDesignation: '',
      joiningDate: '',
      salary: '',
      payFrequency: '',
      workingDays: '',
    };

    let hasError = false;

    // Validate First Name — minimum 1 char
    const firstNameError = validators.checkName(
      'First Name',
      1,
      50,
      firstName,
    );
    if (firstNameError) {
      newErrors.firstName = firstNameError;
      hasError = true;
    }

    // Validate Last Name (optional — only validate if provided)
    if (lastName && lastName.trim() !== '') {
      const lastNameError = validators.checkName(
        'Last Name',
        1,
        50,
        lastName,
      );
      if (lastNameError) {
        newErrors.lastName = lastNameError;
        hasError = true;
      }
    }

    // Validate Email (optional - only validate format if provided)
    if (email && email.trim() !== '') {
      const emailError = validators.checkEmail('Email', email);
      if (emailError) {
        newErrors.email = emailError;
        hasError = true;
      }
    }

    // Validate Phone Number
    const cleanPhone = (phoneNumber || '').replace(/\D/g, '');
    const phoneError = validators.checkFixPhoneNumber(
      'Phone Number',
      cleanPhone,
      10,
      10,
    );
    if (phoneError) {
      newErrors.phoneNumber = phoneError;
      hasError = true;
    }

    // Validate Aadhaar Number — strip spaces first
    const cleanAadhaar = (aadharNumber || '').replace(/\s+/g, '');
    if (!cleanAadhaar) {
      if (!data) {
        newErrors.aadharNumber = 'Aadhaar Number is required.';
        hasError = true;
      }
    } else if (!/^\d{12}$/.test(cleanAadhaar)) {
      newErrors.aadharNumber = 'Aadhaar Number must be 12 digits.';
      hasError = true;
    }

    // Validate Gender
    const gVal = gender?.value || (typeof gender === 'string' ? gender : '');
    if (!gVal || !String(gVal).trim()) {
      newErrors.gender = 'Please select gender';
      hasError = true;
    }

    // Validate Date of Birth
    if (!dateOfBirth) {
      if (!data) {
        newErrors.dateOfBirth = 'Date of birth field is required.';
        hasError = true;
      }
    } else {
      const selectedDate = moment(
        String(dateOfBirth).trim(),
        ['YYYY-MM-DD', 'DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY/MM/DD', moment.ISO_8601],
        false,
      );
      if (!selectedDate.isValid()) {
        newErrors.dateOfBirth = 'Invalid date format for Date of Birth.';
        hasError = true;
      } else if (selectedDate.isAfter(moment())) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future.';
        hasError = true;
      }
    }

    // Validate Emergency Contact Name (optional - only if provided)
    if (emergencyContactName && emergencyContactName.trim()) {
      const emergencyNameError = validators.checkName(
        'Emergency Contact Name',
        1,
        50,
        emergencyContactName,
      );
      if (emergencyNameError) {
        newErrors.emergencyContactName = emergencyNameError;
        hasError = true;
      }
    }

    // Validate Emergency Contact Number (optional - only if provided)
    if (emergencyContactNumber && emergencyContactNumber.trim()) {
      const cleanEmPhone = emergencyContactNumber.replace(/\D/g, '');
      if (cleanEmPhone.length !== 10) {
        newErrors.emergencyContactNumber = 'Emergency Contact Number must be 10 digits.';
        hasError = true;
      }
    }

    // Validate Present Address — backend requires these (street/city/state/pincode)
    if (!street || !street.trim()) {
      newErrors.street = 'Street / address line is required.';
      hasError = true;
    }
    if (!city || !city.trim()) {
      newErrors.city = 'City is required.';
      hasError = true;
    }
    if (!stateName || !stateName.trim()) {
      newErrors.stateName = 'State is required.';
      hasError = true;
    }
    if (!pincode || !String(pincode).trim()) {
      newErrors.pincode = 'Pincode is required.';
      hasError = true;
    } else if (!/^\d{4,6}$/.test(String(pincode).trim())) {
      newErrors.pincode = 'Pincode must be 4 to 6 digits.';
      hasError = true;
    }

    // Validate Joining Date only if provided
    if (joiningDate) {
      const joinDateParsed = moment(
        String(joiningDate).trim(),
        ['YYYY-MM-DD', 'DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY/MM/DD', moment.ISO_8601],
        false,
      );
      if (!joinDateParsed.isValid()) {
        newErrors.joiningDate = 'Invalid joining date format.';
        hasError = true;
      }
    }

    // Validate Salary only if provided
    if (salary && String(salary).trim() !== '') {
      const salNum = Number(salary);
      if (isNaN(salNum) || salNum < 0) {
        newErrors.salary = 'Please enter a valid salary amount.';
        hasError = true;
      }
    }

    setErrors(newErrors);
    return { isValid: !hasError, errors: newErrors };
  };

  const validateStep0 = () => {
    const newErrors = {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      aadharNumber: '',
      gender: '',
      dateOfBirth: '',
    };

    let hasError = false;

    const firstNameError = validators.checkName('First Name', 1, 50, firstName);
    if (firstNameError) { newErrors.firstName = firstNameError; hasError = true; }

    if (lastName && lastName.trim() !== '') {
      const lastNameError = validators.checkName('Last Name', 1, 50, lastName);
      if (lastNameError) { newErrors.lastName = lastNameError; hasError = true; }
    }

    const cleanPhone = (phoneNumber || '').replace(/\D/g, '');
    const phoneError = validators.checkFixPhoneNumber('Phone Number', cleanPhone, 10, 10);
    if (phoneError) { newErrors.phoneNumber = phoneError; hasError = true; }

    const cleanAadhaar = (aadharNumber || '').replace(/\s+/g, '');
    if (!cleanAadhaar) {
      if (!data) {
        newErrors.aadharNumber = 'Aadhaar Number is required.';
        hasError = true;
      }
    } else if (!/^\d{12}$/.test(cleanAadhaar)) {
      newErrors.aadharNumber = 'Aadhaar Number must be 12 digits.';
      hasError = true;
    }

    const gVal = gender?.value || (typeof gender === 'string' ? gender : '');
    if (!gVal || !String(gVal).trim()) {
      newErrors.gender = 'Please select gender.';
      hasError = true;
    }

    if (!dateOfBirth) {
      if (!data) {
        newErrors.dateOfBirth = 'Date of birth is required.';
        hasError = true;
      }
    } else {
      const selectedDate = moment(
        String(dateOfBirth).trim(),
        ['YYYY-MM-DD', 'DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY/MM/DD', moment.ISO_8601],
        false,
      );
      if (!selectedDate.isValid()) {
        newErrors.dateOfBirth = 'Invalid date format for Date of Birth.';
        hasError = true;
      }
    }

    // Present Address — required by backend
    newErrors.street = '';
    newErrors.city = '';
    newErrors.stateName = '';
    newErrors.pincode = '';
    if (!street || !street.trim()) {
      newErrors.street = 'Street / address line is required.';
      hasError = true;
    }
    if (!city || !city.trim()) {
      newErrors.city = 'City is required.';
      hasError = true;
    }
    if (!stateName || !stateName.trim()) {
      newErrors.stateName = 'State is required.';
      hasError = true;
    }
    if (!pincode || !String(pincode).trim()) {
      newErrors.pincode = 'Pincode is required.';
      hasError = true;
    } else if (!/^\d{4,6}$/.test(String(pincode).trim())) {
      newErrors.pincode = 'Pincode must be 4 to 6 digits.';
      hasError = true;
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return { isValid: !hasError, errors: newErrors };
  };

  // Handle form submission
  const handleSubmit = () => {
    if (loading) return;

    const validationRes = validateForm();
    if (!validationRes.isValid) {
      const firstError = Object.values(validationRes.errors).find(err => err && err.trim() !== '');
      SimpleToast.show(
        firstError || 'Please fill all required fields correctly',
        SimpleToast.SHORT,
      );
      return;
    }

    setLoading(true);

    const formData = new FormData();

    // Personal Details - ensure all values are trimmed and not empty
    formData.append('first_name', firstName?.trim() || '');
    formData.append('last_name', lastName?.trim() || '');
    formData.append('email', email?.trim() || '');

    formData.append('phone_number', phoneNumber?.trim() || '');
    formData.append(
      'phone_number_country_code',
      phoneNumberCountryCode || '+91',
    );

    // Handle gender - extract value from dropdown object
    const genderValue = gender?.value || gender || '';
    formData.append('gender', genderValue);

    // Format date of birth properly - should already be in YYYY-MM-DD format from Date_Picker
    if (
      !dateOfBirth ||
      (typeof dateOfBirth === 'string' && dateOfBirth.trim() === '')
    ) {
      SimpleToast.show('Date of birth is required', SimpleToast.SHORT);
      setLoading(false);
      return;
    }
    const dobValue =
      typeof dateOfBirth === 'string'
        ? dateOfBirth.trim()
        : moment(dateOfBirth).format('YYYY-MM-DD');
    formData.append('dob', dobValue);

    formData.append('street', street?.trim() || '');
    formData.append('city', city?.trim() || '');
    formData.append('state', stateName?.trim() || '');
    formData.append('pincode', pincode?.trim() || '');
    formData.append('area_locality', areaLocality?.trim() || '');
    formData.append('google_location', googleLocation?.trim() || '');
    formData.append('lat', lat || '');
    formData.append('long', long || '');

    // Permanent Address
    formData.append('perm_street', permStreet?.trim() || '');
    formData.append('perm_city', permCity?.trim() || '');
    formData.append('perm_state', permStateName?.trim() || '');
    formData.append('perm_pincode', permPincode?.trim() || '');

    // Previous Owner Contact
    formData.append('prev_owner_name', prevOwnerName?.trim() || '');
    formData.append('prev_owner_phone', prevOwnerPhone?.trim() || '');

    formData.append(
      'emergency_contact_name',
      emergencyContactName?.trim() || '',
    );
    formData.append(
      'emergency_contact_number',
      emergencyContactNumber?.trim() || '',
    );

    // Handle relation - extract value from dropdown object
    const relationValue = relation?.value || relation || '';
    formData.append('relation', relationValue);

    // Normalize Aadhaar (strip ALL whitespace) so backend exact/normalized match hits
    formData.append('aadhar_number', (aadharNumber || '').replace(/\s+/g, ''));

    // Work Details - all optional (staff can be a fresher)

    // Role designation - handle multi-select array or single string
    if (Array.isArray(roleDesignation) && roleDesignation.length > 0) {
      roleDesignation.forEach((r, idx) => {
        const selectedRoleObj = roles.find(
          role => String(role.value) === String(r) || String(role.id) === String(r) || role.label === String(r)
        );
        const roleName = selectedRoleObj?.label || r?.label || String(r);
        formData.append(`role_designation[${idx}]`, roleName);
      });
    } else if (roleDesignation) {
      const selectedRoleObj = roles.find(
        role => role.value === (roleDesignation?.value || roleDesignation) ||
                role.id === (roleDesignation?.value || roleDesignation),
      );
      const roleName = selectedRoleObj?.label || roleDesignation?.label || roleDesignation || '';
      if (roleName) formData.append('role_designation[0]', String(roleName).trim());
    }

    // Skills & Expertise
    if (selectedSkills.length > 0) {
      selectedSkills.forEach((skill, idx) => {
        formData.append(`required_skills[${idx}]`, skill);
      });
    }

    // Joining date - send default (today) if not provided, backend requires it
    if (joiningDate && (typeof joiningDate !== 'string' || joiningDate.trim() !== '')) {
      const joinDateValue =
        typeof joiningDate === 'string'
          ? joiningDate.trim()
          : moment(joiningDate).format('YYYY-MM-DD');
      formData.append('joining_date', joinDateValue);
    } else {
      formData.append('joining_date', moment().format('YYYY-MM-DD'));
    }

    // Salary - send 0 as default if not provided
    formData.append('salary', salary?.trim() || '0');

    // Salary closing date
    formData.append('salary_closing_date', salaryClosingDate?.value || '');

    if (upiId?.trim()) {
      formData.append('upi_id', upiId.trim());
    }

    // Pay frequency - send default if not selected
    const payFreqValue = payFrequency?.value || payFrequency || 'monthly';
    formData.append('pay_frequency', payFreqValue);

    // Working Days — always use full English names (Monday, Tuesday, …)
    // so backend comparison (strtolower) works correctly.
    // If user selected nothing, default to Mon–Sat (no Sunday).
    const daysToSend =
      Array.isArray(workingDays) && workingDays.length > 0
        ? workingDays
        : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    daysToSend.forEach((day, index) => {
      formData.append(`working_days[${index}]`, day);
    });

    if (preferredWorkCities.length > 0) {
      formData.append('preferred_work_location', preferredWorkCities.join(', '));
    }

    if (selectedLanguages.length > 0) {
      selectedLanguages.forEach((lang, index) => {
        formData.append(`languages_spoken[${index}]`, lang);
      });
    }

    // Documents - only send newly picked images (they have a .type from image picker)
    // Don't re-send existing server URLs as file uploads
    if (staffPhoto && staffPhoto.uri && staffPhoto.type) {
      formData.append('staff_photo', {
        uri: staffPhoto.uri,
        name: staffPhoto.name || 'staff_photo.jpg',
        type: staffPhoto.type || 'image/jpeg',
      });
    }

    if (!existingPoliceClearance && policeClearance && policeClearance.uri && policeClearance.type) {
      formData.append('police_clearance_certificate', {
        uri: policeClearance.uri,
        name: policeClearance.name || 'police_clearance_certificate.jpg',
        type: policeClearance.type || 'image/jpeg',
      });
    }

    if (!existingAadharFront && aadharCard && aadharCard.uri && aadharCard.type) {
      formData.append('aadhar_front', {
        uri: aadharCard.uri,
        name: aadharCard.name || 'aadhar_front.jpg',
        type: aadharCard.type || 'image/jpeg',
      });
    }

    if (!existingAadharBack && aadharBack && aadharBack.uri && aadharBack.type) {
      formData.append('aadhar_back', {
        uri: aadharBack.uri,
        name: aadharBack.name || 'aadhar_back.jpg',
        type: aadharBack.type || 'image/jpeg',
      });
    }

    formData.append('is_staff_added', 1);

    const jobId = route?.params?.job_id || data?.job_id || data?.job?.id;
    if (jobId) {
      formData.append('job_id', String(jobId));
    }

    // If adding an existing user as staff, pass their user_id
    if (data?.id && !isEditMode) {
      formData.append('user_id', String(data.id));
    }

    // Determine API endpoint and add staff_id for update
    const apiEndpoint = isEditMode ? `${UpdateStaff}/${staffId}` : AddStaff;

    if (isEditMode) {
      formData.append('staff_id', String(staffId));
    }
    console.log('apiEndpoint----', apiEndpoint, 'user_id:', data?.id);

    POST_FORM_DATA(
      apiEndpoint,
      formData,
      success => {
        setLoading(false);
        SimpleToast.show(
          success?.message ||
          (isEditMode
            ? 'Staff updated successfully!'
            : 'Staff added successfully!'),
          SimpleToast.SHORT,
        );
        navigation.navigate('TabNavigation', {
          screen: 'Dashboard',
        });
      },
      error => {
        setLoading(false);
        console.log('API Error Full:', JSON.stringify(error));

        if (error?.error_code === 'LIMIT_EXCEEDED' || error?.data?.error_code === 'LIMIT_EXCEEDED') {
          const price = error?.extra_staff_price || error?.data?.extra_staff_price || 500;
          const gstTotal = Math.round(price * 1.18 * 100) / 100;
          const gstAmount = Math.round((price * 0.18) * 100) / 100;
          Alert.alert(
            "Staff Limit Exceeded",
            `Your subscription's staff limit has been reached.\n\nBase: ₹${price}\nGST (18%): ₹${gstAmount}\nTotal: ₹${gstTotal}`,
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Pay & Add", 
                onPress: () => processExtraStaffPayment(price, formData)
              }
            ],
            { cancelable: true }
          );
          return;
        }

        if (error?.limit_reached || error?.data?.limit_reached || error?.status === 403) {
          Alert.alert(
            "Limit Reached",
            error?.message || error?.data?.message || "Staff limit reached. Please upgrade your plan.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Upgrade Plan", onPress: () => navigation.navigate("HouseholdManager") }
            ]
          );
          return;
        }

        // Extract Laravel validation errors
        const validationErrors = error?.errors || error?.data?.errors;
        if (validationErrors && typeof validationErrors === 'object') {
          // Get first validation error message for each field
          const fieldErrors = Object.entries(validationErrors)
            .map(([field, messages]) => {
              const msg = Array.isArray(messages) ? messages[0] : messages;
              return `${field}: ${msg}`;
            })
            .join('\n');
          console.log('Validation errors:', fieldErrors);
          SimpleToast.show(fieldErrors, SimpleToast.LONG);
        } else {
          const errorMessage =
            error?.message ||
            error?.data?.message ||
            error?.response?.data?.message ||
            (isEditMode
              ? 'Failed to update staff. Please try again.'
              : 'Failed to add staff. Please try again.');
          SimpleToast.show(errorMessage, SimpleToast.LONG);
        }
      },
      fail => {
        setLoading(false);
        SimpleToast.show(
          'Network error. Please check your connection and try again.',
          SimpleToast.SHORT,
        );
        console.log('Network Error:-----', fail);
      },
    );
  };

  const processExtraStaffPayment = (price, originalFormData) => {
    setLoading(true);
    POST_WITH_TOKEN(
      SUBSCRIPTION_CREATE_EXTRA_STAFF_ORDER,
      { amount: price },
      async success => {
        if ((success?.success || success?.status) && success?.free) {
          const apiEndpoint = isEditMode ? `${UpdateStaff}/${staffId}` : AddStaff;
          POST_FORM_DATA(
            apiEndpoint,
            originalFormData,
            () => {
              setLoading(false);
              SimpleToast.show('Extra staff limit added. Staff added successfully!', SimpleToast.SHORT);
              navigation.navigate('TabNavigation', {
                screen: 'Dashboard',
              });
            },
            () => {
              setLoading(false);
              SimpleToast.show('Extra staff limit added. Please try adding the staff again.', SimpleToast.SHORT);
            },
            () => {
              setLoading(false);
              SimpleToast.show('Extra staff limit added. Please try adding the staff again.', SimpleToast.SHORT);
            }
          );
          return;
        }

        if ((!success?.success && !success?.status) || !success?.order_id) {
          setLoading(false);
          SimpleToast.show(success?.message || 'Failed to create payment order', SimpleToast.SHORT);
          return;
        }

        try {
          const result = await initiatePayment({
            amount: success.amount || (price * 100),
            currency: success.currency || 'INR',
            orderId: success.order_id,
            key: success.razorpay_key || 'rzp_test_Rcx3E3rF2dNmEc',
            description: 'Extra Staff Limit Purchase',
            prefill: {
              name: userDetail?.first_name ? `${userDetail.first_name} ${userDetail.last_name || ''}` : userDetail?.name || '',
              email: String(userDetail?.email || '').replace(/_deleted_\d+$/, ''),
              contact: userDetail?.phone || userDetail?.mobile || '',
            },
          });

          if (result.success) {
            verifyExtraStaffPayment(result, originalFormData);
          } else {
            setLoading(false);
            if (result.code === 0 || result.code === 2) {
              SimpleToast.show('Payment cancelled', SimpleToast.SHORT);
            } else {
              SimpleToast.show(result.description || 'Payment failed. Please try again.', SimpleToast.SHORT);
            }
          }
        } catch (paymentErr) {
          setLoading(false);
          SimpleToast.show('Payment checkout error. Please try again.', SimpleToast.SHORT);
        }
      },
      error => {
        setLoading(false);
        SimpleToast.show(error?.message || 'Failed to initialize payment', SimpleToast.SHORT);
      },
      fail => {
        setLoading(false);
        SimpleToast.show('Network error during payment initialization', SimpleToast.SHORT);
      }
    );
  };

  const verifyExtraStaffPayment = (paymentResult, originalFormData) => {
    POST_WITH_TOKEN(
      SUBSCRIPTION_VERIFY_EXTRA_STAFF_PAYMENT,
      {
        razorpay_order_id: paymentResult.orderId,
        razorpay_payment_id: paymentResult.paymentId,
        razorpay_signature: paymentResult.signature,
      },
      success => {
        if (success?.success || success?.status) {
          SimpleToast.show('Payment verified! Adding staff...', SimpleToast.SHORT);
          const apiEndpoint = isEditMode ? `${UpdateStaff}/${staffId}` : AddStaff;
          POST_FORM_DATA(
            apiEndpoint,
            originalFormData,
            postSuccess => {
              SimpleToast.show('Staff added successfully!', SimpleToast.SHORT);
              setLoading(false);
              navigation.navigate('TabNavigation', {
                screen: 'Dashboard',
              });
            },
            postErr => {
              setLoading(false);
              SimpleToast.show('Failed to add staff after payment', SimpleToast.SHORT);
            },
            postFail => {
              setLoading(false);
              SimpleToast.show('Network error adding staff after payment', SimpleToast.SHORT);
            }
          );
        } else {
          setLoading(false);
          SimpleToast.show(success?.message || 'Payment verification failed', SimpleToast.SHORT);
        }
      },
      error => {
        setLoading(false);
        SimpleToast.show(error?.message || 'Payment verification failed', SimpleToast.SHORT);
      },
      fail => {
        setLoading(false);
        SimpleToast.show('Network error verifying payment', SimpleToast.SHORT);
      }
    );
  };

  return (
    <CommanView>
      <HeaderForUser
        source_arrow={ImageConstant?.BackArrow}
        title={isEditMode ? 'Edit Staff' : (LocalizedStrings.NewStaffForm.title || 'Add New Staff')}
        style_title={styles.headerTitle}
        containerStyle={styles.headerContainer}
        onPressLeftIcon={() => {
          navigation?.goBack();
        }}
      />
      <ProfileStepRoller
        steps={[
          { id: 0, title: 'Personal Info', icon: ImageConstant.person },
          { id: 1, title: 'Role & Pay', icon: ImageConstant.Briefcase },
          { id: 2, title: 'Verification', icon: ImageConstant.Verify },
        ]}
        activeStep={currentStep}
        onStepPress={(idx) => {
          if (idx < currentStep) setCurrentStep(idx);
        }}
      />

        {/* Step 0: Personal Details */}
        <View style={{ display: currentStep === 0 ? 'flex' : 'none' }}>
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={ImageConstant.person}
              style={{ height: 20, width: 20, marginRight: 8 }}
              resizeMode="contain"
            />
            <Typography
              type={Font?.Poppins_SemiBold}
              style={styles.sectionTitle}
            >
              {LocalizedStrings.NewStaffForm.Personal_Details}
            </Typography>
          </View>

          <Input
            style_title={{ color: '#8C8D8B' }}
            placeholder={
              LocalizedStrings.NewStaffForm.First_Name || 'First Name'
            }
            title={LocalizedStrings.NewStaffForm.First_Name || 'First Name'}
            value={firstName}
            onChange={value => {
              setFirstName(value);
              clearError('firstName');
            }}
            error={errors.firstName}
          />

          <Input
            style_title={{ color: '#8C8D8B' }}
            placeholder={LocalizedStrings.NewStaffForm.Last_Name || 'Last Name'}
            title={LocalizedStrings.NewStaffForm.Last_Name || 'Last Name'}
            value={lastName}
            onChange={value => {
              setLastName(value);
              clearError('lastName');
            }}
            error={errors.lastName}
          />



          <Input
            style_title={{ color: '#8C8D8B' }}
            placeholder={
              LocalizedStrings.NewStaffForm.Mobile_Placeholder || '9876543210'
            }
            title={
              LocalizedStrings.NewStaffForm.Mobile_Number || 'Mobile Number'
            }
            value={phoneNumber}
            onChange={value => {
              const digitsOnly = value.replace(/[^0-9]/g, '').slice(0, 10);
              setPhoneNumber(digitsOnly);
              clearError('phoneNumber');
            }}
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.phoneNumber}
          />

          <Input
            editable={false}
            style_title={{ color: '#8C8D8B' }}
            placeholder={
              LocalizedStrings.NewStaffForm.Aadhaar_Placeholder ||
              '123456789012'
            }
            title={
              LocalizedStrings.NewStaffForm.Aadhaar_Number || 'Aadhaar Number'
            }
            value={aadharNumber}
            onChange={value => {
              setAadharNumber(value);
              clearError('aadharNumber');
            }}
            keyboardType="number-pad"
            maxLength={12}
            error={errors.aadharNumber}
          />

          <DropdownComponent
            title={LocalizedStrings.NewStaffForm.Gender || 'Gender'}
            placeholder={
              LocalizedStrings.NewStaffForm.Select_Gender || 'Select Gender'
            }
            width={'100%'}
            style_dropdown={{ marginHorizontal: 0 }}
            selectedTextStyleNew={{ marginLeft: 10 }}
            marginHorizontal={0}
            style_title={{ textAlign: 'left' }}
            data={genderOptions}
            value={gender}
            onChange={item => {
              setGender(item);
              clearError('gender');
            }}
            error={errors.gender}
          />

          <Date_Picker
            title={
              LocalizedStrings.NewStaffForm.Date_of_Birth || 'Date of Birth'
            }
            placeholder="DD-MM-YYYY"
            selected_date={dateOfBirth}
            onConfirm={date => {
              // Store as Date object or formatted string
              const formattedDate = moment(date).format('YYYY-MM-DD');
              setDateOfBirth(formattedDate);
              clearError('dateOfBirth');
            }}
            allowFutureDates={false}
            error={errors.dateOfBirth}
          />

          {/* Present Address — backend requires street/city/state/pincode */}
          <Typography
            type={Font?.Poppins_SemiBold}
            style={[styles.sectionTitle, { marginTop: 12, marginBottom: 8 }]}
          >
            Present Address
          </Typography>

          <Input
            style_title={{ color: '#8C8D8B' }}
            placeholder={'House / Flat / Street / Area'}
            title={'Street / Address Line'}
            value={street}
            onChange={value => {
              setStreet(value);
              clearError('street');
            }}
            error={errors.street}
          />

          <Input
            style_title={{ color: '#8C8D8B' }}
            placeholder={'Enter 6-digit pincode'}
            title={'Pincode'}
            value={pincode}
            onChange={value => {
              const digits = value.replace(/[^0-9]/g, '').slice(0, 6);
              setPincode(digits);
              clearError('pincode');
            }}
            keyboardType="number-pad"
            maxLength={6}
            error={errors.pincode}
          />

          <Input
            style_title={{ color: '#8C8D8B' }}
            placeholder={'City'}
            title={'City'}
            value={city}
            onChange={value => {
              setCity(value);
              clearError('city');
            }}
            error={errors.city}
          />

          <Input
            style_title={{ color: '#8C8D8B' }}
            placeholder={'State'}
            title={'State'}
            value={stateName}
            onChange={value => {
              setStateName(value);
              clearError('stateName');
            }}
            error={errors.stateName}
          />

        </View>
        </View>

        

        {/* Step 1: Role & Pay */}
        <View style={{ display: currentStep === 1 ? 'flex' : 'none' }}>
        <View style={styles.section}>
          <Typography type={Font?.Poppins_SemiBold} style={styles.sectionTitle}>
            Emergency Contact
          </Typography>

          <Input
            style_title={{ color: '#8C8D8B' }}
            placeholder={
              LocalizedStrings.NewStaffForm
                .Emergency_Contact_Name_Placeholder || 'Emergency Contact Name'
            }
            title={
              LocalizedStrings.NewStaffForm.Emergency_Contact_Name ||
              'Emergency Contact Name'
            }
            value={emergencyContactName}
            onChange={value => {
              setEmergencyContactName(value);
              clearError('emergencyContactName');
            }}
            error={errors.emergencyContactName}
          />

          <Input
            style_title={{ color: '#8C8D8B' }}
            placeholder={
              LocalizedStrings.NewStaffForm
                .Emergency_Contact_Number_Placeholder || '9123456780'
            }
            title={
              LocalizedStrings.NewStaffForm.Emergency_Contact_Number ||
              'Emergency Contact Number'
            }
            value={emergencyContactNumber}
            onChange={value => {
              const digitsOnly = value.replace(/[^0-9]/g, '').slice(0, 10);
              setEmergencyContactNumber(digitsOnly);
              clearError('emergencyContactNumber');
            }}
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.emergencyContactNumber}
          />
        </View>

        {/* Step 1: Role & Pay Details */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={ImageConstant.Verify}
              style={{ height: 20, width: 20, marginRight: 8 }}
              resizeMode="contain"
            />
            <Typography
              type={Font?.Poppins_SemiBold}
              style={styles.sectionTitle}
            >
              {LocalizedStrings.NewStaffForm.Work_Details}
            </Typography>
          </View>

          <DropdownComponent
            title={LocalizedStrings.NewStaffForm.Role_Designation || 'Role/Designation (Multi-Select)'}
            placeholder={
              rolesLoading
                ? 'Loading roles...'
                : LocalizedStrings.NewStaffForm.Role_Placeholder || 'Select Roles'
            }
            width={'100%'}
            style_dropdown={{ marginHorizontal: 0 }}
            selectedTextStyleNew={{ marginLeft: 10 }}
            marginHorizontal={0}
            style_title={{ textAlign: 'left' }}
            multiSelect={true}
            selectedValues={roleDesignation}
            onChange={item => {
              const val = item?.value || item?.label;
              if (!val) return;
              setRoleDesignation(prev =>
                Array.isArray(prev)
                  ? (prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])
                  : [val]
              );
              clearError('roleDesignation');
            }}
            data={roles}
            disable={rolesLoading}
            error={errors.roleDesignation}
          />
          {Array.isArray(roleDesignation) && roleDesignation.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, marginBottom: 10 }}>
              {roleDesignation.map((r, i) => {
                const rVal = r?.value ?? r?.id ?? r;
                const roleObj = roles.find(rl => String(rl.value) === String(rVal) || String(rl.id) === String(rVal) || rl.label === String(rVal));
                const roleLabel = roleObj?.label || r?.label || String(rVal);
                return (
                  <View key={i} style={{ backgroundColor: '#FFF5F3', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5, marginRight: 8, marginBottom: 6, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D98579' }}>
                    <Typography size={12} color="#D98579" type={Font?.Poppins_Medium}>{roleLabel}</Typography>
                    <TouchableOpacity onPress={() => setRoleDesignation(prev => prev.filter(v => (v?.value ?? v?.id ?? v) !== rVal))} style={{ marginLeft: 6 }}>
                      <Typography size={12} color="#999">✕</Typography>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          <Date_Picker
            title={LocalizedStrings.NewStaffForm.Joining_Date || 'Joining Date'}
            placeholder="DD-MM-YYYY"
            selected_date={joiningDate}
            onConfirm={date => {
              // Store as Date object or formatted string
              const formattedDate = moment(date).format('YYYY-MM-DD');
              setJoiningDate(formattedDate);
              clearError('joiningDate');
            }}
            allowFutureDates={true}
            error={errors.joiningDate}
          />

          <Input
            style_title={{ color: '#8C8D8B' }}
            placeholder={
              LocalizedStrings.NewStaffForm.Salary_Placeholder || 'e.g. 10000'
            }
            title={LocalizedStrings.NewStaffForm.Salary}
            value={salary}
            onChange={value => {
              setSalary(value);
              clearError('salary');
            }}
            keyboardType="numeric"
            error={errors.salary}
          />

          <Input
            style_title={{ color: '#8C8D8B' }}
            placeholder={'e.g. name@upi'}
            title={'UPI ID'}
            value={upiId}
            onChange={value => setUpiId(value)}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <DropdownComponent
            title={LocalizedStrings.NewStaffForm.Pay_Frequency}
            placeholder={
              LocalizedStrings.NewStaffForm.Select_Frequency ||
              'Select Frequency'
            }
            width={'100%'}
            style_dropdown={{ marginHorizontal: 0 }}
            selectedTextStyleNew={{ marginLeft: 10 }}
            marginHorizontal={0}
            style_title={{ textAlign: 'left' }}
            data={payFrequencyOptions}
            value={payFrequency}
            onChange={item => {
              setPayFrequency(item);
              clearError('payFrequency');
            }}
            error={errors.payFrequency}
          />

          {payFrequency?.value === 'monthly' && (
            <DropdownComponent
              title={'Salary Closing Date'}
              placeholder={'Select closing day of month'}
              width={'100%'}
              style_dropdown={{ marginHorizontal: 0 }}
              selectedTextStyleNew={{ marginLeft: 10 }}
              marginHorizontal={0}
              style_title={{ textAlign: 'left' }}
              data={salaryClosingDateOptions}
              value={salaryClosingDate}
              onChange={item => {
                setSalaryClosingDate(item);
              }}
            />
          )}

        </View>
      </View>

        {/* Step 2: Verification & Schedule */}
        <View style={{ display: currentStep === 2 ? 'flex' : 'none' }}>
        <View>
        <View style={styles.section}>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, marginBottom: 4 }}>
            <Typography
              type={Font?.Poppins_Bold}
              size={14}
            >
              {LocalizedStrings.NewStaffForm.Working_Days || 'Working Schedule'}
            </Typography>
            <TouchableOpacity
              onPress={() => {
                const allDays = workingDaysOptions.map(d => d.value);
                if (workingDays.length === allDays.length) {
                  setWorkingDays([]);
                } else {
                  setWorkingDays(allDays);
                }
              }}
            >
              <Typography size={12} color="#D98579" type={Font?.Poppins_Medium}>
                {workingDays.length === workingDaysOptions.length ? 'Deselect All' : 'Select All'}
              </Typography>
            </TouchableOpacity>
          </View>
          <Typography size={11} color="#888" style={{ marginBottom: 8 }}>
            Selected days will be used for staff attendance & leave tracking.
          </Typography>

          <View style={styles.daysContainer}>
            {workingDaysOptions.map((day, index) => {
              const isSelected = workingDays.includes(day.value);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayChip,
                    isSelected && styles.dayChipSelected,
                  ]}
                  onPress={() => toggleWorkingDay(day.value)}
                >
                  {isSelected && (
                    <Image
                      source={ImageConstant?.check}
                      style={{
                        width: 12,
                        height: 12,
                        tintColor: '#fff',
                        marginRight: 4,
                      }}
                    />
                  )}
                  <Text style={[
                    styles.dayChipText,
                    isSelected && styles.dayChipTextSelected,
                  ]}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.workingDays ? (
            <Typography
              textAlign={'right'}
              style={{ color: 'red', fontSize: 12, marginTop: 5 }}
            >
              {errors.workingDays}
            </Typography>
          ) : null}
        </View>





        <View style={styles.section}>
          <Typography type={Font?.Poppins_SemiBold} style={styles.sectionTitle}>
            {LocalizedStrings.NewStaffForm.KYC_Documents}
          </Typography>

          {/* Police Clearance & Aadhaar - show read-only if staff already uploaded them */}
          {(!isPlaceholderImage(existingAadharFront) || !isPlaceholderImage(existingPoliceClearance)) ? (
            <>
              {!isPlaceholderImage(existingPoliceClearance) && (
                <View style={styles.readOnlyDocRow}>
                  <Typography type={Font?.Poppins_Medium} style={styles.readOnlyDocLabel}>
                    {LocalizedStrings.NewStaffForm.Police_Clearance_Certificate || 'Police Clearance'}
                  </Typography>
                  <Image
                    source={{ uri: existingPoliceClearance }}
                    style={styles.readOnlyDocImage}
                    resizeMode="cover"
                  />
                </View>
              )}
              <View style={styles.uploadRow}>
                {!isPlaceholderImage(existingAadharFront) ? (
                  <View style={[styles.uploadBox, styles.readOnlyDocContainer]}>
                    <Typography type={Font?.Poppins_Medium} style={styles.readOnlyDocLabel}>
                      {LocalizedStrings.NewStaffForm.Aadhaar_Card_Details || 'Aadhaar Front'}
                    </Typography>
                    <Image
                      source={{ uri: existingAadharFront }}
                      style={styles.readOnlyDocImage}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <UploadBox
                    title={LocalizedStrings.NewStaffForm.Aadhaar_Card_Details || 'Aadhaar Front'}
                    icon={ImageConstant.Doc}
                    styles_container={styles.uploadBox}
                    onPress={() => handleImagePicker('aadharCard')}
                    image={aadharCard}
                  />
                )}
                {!isPlaceholderImage(existingAadharBack) ? (
                  <View style={[styles.uploadBox, styles.readOnlyDocContainer]}>
                    <Typography type={Font?.Poppins_Medium} style={styles.readOnlyDocLabel}>
                      {'Aadhaar Card Back'}
                    </Typography>
                    <Image
                      source={{ uri: existingAadharBack }}
                      style={styles.readOnlyDocImage}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <UploadBox
                    title={'Aadhaar Card Back'}
                    icon={ImageConstant.Doc}
                    styles_container={styles.uploadBox}
                    onPress={() => handleImagePicker('aadharBack')}
                    image={aadharBack}
                  />
                )}
              </View>
            </>
          ) : (
            <>
              <View style={styles.uploadRow}>
                <UploadBox
                  title={'Staff Photo'}
                  icon={ImageConstant.person}
                  styles_container={styles.uploadBox}
                  onPress={() => handleImagePicker('staffPhoto')}
                  image={staffPhoto}
                />
                <UploadBox
                  title={LocalizedStrings.NewStaffForm.Police_Clearance_Certificate || 'Police Verification'}
                  icon={ImageConstant.Verify}
                  styles_container={styles.uploadBox}
                  onPress={() => handleImagePicker('policeClearance')}
                  image={policeClearance}
                />
              </View>
              <View style={styles.uploadRow}>
                <UploadBox
                  title={LocalizedStrings.NewStaffForm.Aadhaar_Card_Details || 'Aadhaar Front'}
                  icon={ImageConstant.Doc}
                  styles_container={styles.uploadBox}
                  onPress={() => handleImagePicker('aadharCard')}
                  image={aadharCard}
                />
                <UploadBox
                  title={'Aadhaar Card Back'}
                  icon={ImageConstant.Doc}
                  styles_container={styles.uploadBox}
                  onPress={() => handleImagePicker('aadharBack')}
                  image={aadharBack}
                />
              </View>
            </>
          )}

      </View>
      </View>
      </View>

      {/* Bottom Navigation Buttons */}
      <View style={styles.bottomButton}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, width: '90%' }}>
          {currentStep > 0 && (
            <TouchableOpacity
              onPress={() => setCurrentStep(prev => prev - 1)}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#FFFFFF',
                borderWidth: 1.5,
                borderColor: '#D98579',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography size={15} color="#D98579" type={Font?.Poppins_SemiBold}>
                Back
              </Typography>
            </TouchableOpacity>
          )}
          <View style={{ flex: currentStep > 0 ? 1.2 : 1, height: 48, justifyContent: 'center' }}>
            <Button
              loader={loading}
              title={
                currentStep < 2
                  ? LocalizedStrings.Auth?.next || 'Next'
                  : isEditMode
                    ? LocalizedStrings.NewStaffForm.Update_Staff || 'Update Staff'
                    : LocalizedStrings.NewStaffForm.Add_Staff || 'Add Staff'
              }
              onPress={() => {
                if (currentStep < 2) {
                  if (currentStep === 0) {
                    const step0Res = validateStep0();
                    if (!step0Res.isValid) {
                      const firstErr = Object.values(step0Res.errors).find(err => err && err.trim() !== '');
                      SimpleToast.show(firstErr || 'Please fill all required fields', SimpleToast.SHORT);
                      return;
                    }
                  }
                  setCurrentStep(prev => prev + 1);
                } else {
                  handleSubmit();
                }
              }}
              main_style={{ width: '100%', height: 48, justifyContent: 'center' }}
              style={{ marginVertical: 0, height: 48, borderRadius: 24 }}
              loader={loading}
            />
          </View>
        </View>
      </View>

      <ImageModal
        showModal={showImageModal}
        title={'Upload Document'}
        close={() => setShowImageModal(false)}
        selected={handleImageSelected}
        document={true}
      />
    </CommanView>
  );
};

export default NewStaffForm;

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Font?.Poppins_SemiBold,
    color: '#1A1A1A',
  },
  uploadRowSingle: {
    alignItems: 'center',
    marginTop: 12,
  },
  uploadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  uploadBoxFull: {
    width: '80%',
  },
  uploadBoxHalf: {
    width: '48%',
  },
  uploadBox: {
    flex: 1,
    marginHorizontal: 6,
  },
  readOnlyDocRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  readOnlyDocContainer: {
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
  },
  readOnlyDocLabel: {
    fontSize: 12,
    color: '#8C8D8B',
    marginBottom: 6,
    textAlign: 'center',
  },
  readOnlyDocImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    backgroundColor: '#F9F9F9',
  },
  bottomButton: {
    marginTop: 30,
    marginBottom: 30,
    alignItems: 'center',
  },
  buttonStyle: {
    width: '90%',
  },
  docBox: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    alignItems: 'center',
  },
  docLink: {
    fontSize: 13,
    color: '#D98579',
    fontFamily: Font.Poppins_SemiBold,
    marginTop: 4,
  },
  docGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 12,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  dayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EBEBEA',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9F9F9',
  },
  dayChipSelected: {
    borderColor: '#D98579',
    backgroundColor: '#D98579',
  },
  dayChipText: {
    fontSize: 13,
    color: '#333',
  },
  dayChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  nextSectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F3',
    borderWidth: 1,
    borderColor: '#D98579',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  nextSectionText: {
    color: '#D98579',
    fontSize: 14,
    fontFamily: Font?.Poppins_SemiBold,
  },
});







