import { StyleSheet, View, Alert, TouchableOpacity } from 'react-native';
import React, { useState, useRef } from 'react';
import CommanView from '../../../Component/CommanView';
import Header from '../../../Component/Header';
import { Font } from '../../../Constants/Font';
import { ImageConstant } from '../../../Constants/ImageConstant';
import Button from '../../../Component/Button';
import Typography from '../../../Component/UI/Typography';
import { useDispatch, useSelector } from 'react-redux';
import { isAuth, userDetails } from '../../../Redux/action';
import StepBasicInfoStaff from './StepBasicInfoStaff';
import KYCVerificationStaff from './KYCVerificationStaff';
import StepLoactionStaff from './StepLoactionStaff';
import StepWokInfo from './StepWokInfo';
import UpdateProfile from '../../Staff/UpdateProfile';
import { POST_WITH_TOKEN } from '../../../Backend/Backend';
import { DELETE_ACCOUNT } from '../../../Backend/api_routes';
import LocalizedStrings from '../../../Constants/localization';
import SimpleToast from 'react-native-simple-toast';

import ProfileStepRoller from '../../../Component/UI/ProfileStepRoller';

const StepFirst = () => {
  const staffSteps = [
    { id: 1, title: 'Personal', icon: ImageConstant.person },
    { id: 2, title: 'KYC', icon: ImageConstant.Verify },
    { id: 3, title: 'Location', icon: ImageConstant.Location },
    { id: 4, title: 'Work Details', icon: ImageConstant.Briefcase },
    { id: 5, title: 'Experience', icon: ImageConstant.fileText },
  ];
  const userTypes = useSelector(store => store?.userType);
  const userDetail = useSelector(store => store?.userDetails);
  const [activeTab, setActiveTab] = useState(1); // Step 1: Basic Info (Photo, Name, Gender, DOB)
  const [loader, setLoader] = useState(false);
  const [kycImages, setKycImages] = useState(null);
  
  const basicInfoRef = useRef(null);
  const kycRef = useRef(null);
  const locationRef = useRef(null);
  const workInfoRef = useRef(null);
  const lastWorkRef = useRef(null);
  const Dispatch = useDispatch();

  const renderContent = () => {
    switch (activeTab) {
      case 1:
        return (
          <StepBasicInfoStaff ref={basicInfoRef} />
        );
      case 2:
        return (
          <KYCVerificationStaff
            ref={kycRef}
            userDetail={userDetail}
            prefillFromProfile={false}
          />
        );
      case 3:
        return (
          <StepLoactionStaff ref={locationRef} />
        );
      case 4:
        return (
          <StepWokInfo ref={workInfoRef} />
        );
      case 5:
        return (
          <UpdateProfile ref={lastWorkRef} />
        );
      default:
        return null;
    }
  };

  const completeProfileFlow = () => {
    SimpleToast.show(
      LocalizedStrings.EditProfile?.profile_completed ||
      'Profile completed successfully',
      SimpleToast.SHORT,
    );
    if (global.Profile) global.Profile();
    Dispatch(userDetails({ ...userDetail, is_staff_added: 1, step: 5 }));
  };

  return (
    <CommanView>
      <Header
        source_arrow={ImageConstant?.BackArrow}
        onBackPressFun={() => {
          if (activeTab === 1) {
            Alert.alert(
              'Exit Profile Setup',
              'Are you sure you want to go back? Your progress will not be saved.',
              [
                { text: 'Stay', style: 'cancel' },
                {
                  text: 'Go Back',
                  style: 'destructive',
                  onPress: () => {
                    Dispatch(isAuth(false));
                    Dispatch(userDetails({}));
                  },
                },
              ],
            );
          } else {
            setActiveTab(activeTab - 1);
          }
        }}
        title={LocalizedStrings.EditProfile?.title || 'Complete Profile'}
        style_title={{ fontFamily: Font?.Manrope_SemiBold }}
        onBackPress
      />
      <ProfileStepRoller
        steps={staffSteps}
        activeStep={activeTab - 1}
        onStepPress={index => setActiveTab(index + 1)}
      />
      <View style={{ flex: 1 }}>
        {activeTab === 1 && (
          <StepBasicInfoStaff ref={basicInfoRef} />
        )}
        {activeTab === 2 && (
          <KYCVerificationStaff
            ref={kycRef}
            userDetail={userDetail}
            prefillFromProfile={false}
          />
        )}
        {activeTab === 3 && (
          <StepLoactionStaff ref={locationRef} />
        )}
        {activeTab === 4 && (
          <StepWokInfo ref={workInfoRef} />
        )}
        {activeTab === 5 && (
          <UpdateProfile ref={lastWorkRef} />
        )}
      </View>

      <View style={styles.bottomButtonsRow}>
        {activeTab === 5 ? (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.skipButton}
            onPress={completeProfileFlow}
            disabled={loader}
          >
            <Typography
              size={13}
              type={Font?.Poppins_Medium}
              color="#737373"
            >
              Skip Now
            </Typography>
          </TouchableOpacity>
        ) : <View />}

        <Button
          title={
            activeTab == 5
              ? LocalizedStrings.EditProfile?.Save_Changes || 'Save & Complete'
              : LocalizedStrings.Auth?.next || 'Next'
          }
          onPress={async () => {
            if (activeTab == 1) {
              // Save Basic Info (Photo, Name, Gender, DOB) and move to next step
              try {
                setLoader(true);
                await basicInfoRef.current?.saveBasicInfo();
                setActiveTab(2);
              } catch (error) {
                SimpleToast.show(
                  error?.message || 'Please fill all required basic information fields.',
                  SimpleToast.SHORT,
                );
              } finally {
                setLoader(false);
              }
            } else if (activeTab == 2) {
              // Save KYC images and details
              const images = kycRef.current?.getUploadedImages?.();
              if (images) setKycImages(images);
              try {
                setLoader(true);
                await kycRef.current?.saveKYC();
                setActiveTab(3);
              } catch (error) {
                SimpleToast.show(
                  error?.message || 'Failed to save KYC details. Please fill all required fields.',
                  SimpleToast.SHORT,
                );
              } finally {
                setLoader(false);
              }
            } else if (activeTab == 3) {
              // Save addresses
              try {
                setLoader(true);
                await locationRef.current?.saveAddresses();
                setActiveTab(4);
              } catch (error) {
                const msg = error?.message || 'Please fill all required address fields including Google Location.';
                SimpleToast.show(msg, SimpleToast.SHORT);
              } finally {
                setLoader(false);
              }
            } else if (activeTab == 4) {
              // Save work info
              try {
                setLoader(true);
                await workInfoRef.current?.saveWorkInfo();
                setActiveTab(5);
              } catch (error) {
                SimpleToast.show(
                  error?.message || 'Failed to save work info. Please fill all required fields.',
                  SimpleToast.SHORT,
                );
              } finally {
                setLoader(false);
              }
            } else if (activeTab == 5) {
              // Final step — last work experience is optional
              try {
                setLoader(true);
                await lastWorkRef.current?.saveLastWorkExperience();
              } catch (error) {
                console.log('Last work exp optional save:', error);
              } finally {
                setLoader(false);
                completeProfileFlow();
              }
            }
          }}
          style={{ width: 150 }}
          disabled={loader}
          loader={loader}
        />
      </View>
    </CommanView>
  );
};

export default StepFirst;

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: Font?.Manrope_Bold,
    fontSize: 16,
    marginBottom: 10,
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});
