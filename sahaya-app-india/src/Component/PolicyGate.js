import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { GET_WITH_TOKEN, POST_WITH_TOKEN } from '../Backend/Backend';
import { PolicyStatus, PolicyAccept } from '../Backend/api_routes';
import TermsAcceptanceModal from './TermsAcceptanceModal';

const POLICY_ACCEPTED_KEY = 'policy_accepted_v1';

const PolicyGate = ({ children }) => {
  const [needsAcceptance, setNeedsAcceptance] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  const userDetail = useSelector(state => state?.userDetails);
  const currentUserType = useSelector(state => state?.userType);

  // Check if user is still in onboarding steps vs on Dashboard
  const isStaffOnboardingComplete =
    userDetail?.is_staff_added == 1 ||
    (userDetail?.step && Number(userDetail?.step) >= 5) ||
    Boolean(userDetail?.user_work_info || userDetail?.work_info);

  const isAadhaarVerified =
    userDetail?.aadhar__verify == 1 ||
    userDetail?.aadhar__verify === true ||
    userDetail?.is_aadhar_verified == 1 ||
    userDetail?.is_aadhar_verified === true ||
    userDetail?.user_detail?.aadhar__verify == 1 ||
    userDetail?.user_detail?.is_aadhar_verified == 1;

  const isHouseOwnerOnboardingComplete =
    userDetail?.is_profile_completed == 1 ||
    (userDetail?.step && Number(userDetail?.step) >= 4) ||
    Boolean(userDetail?.addresses && userDetail?.addresses?.length > 0);

  const isOnboardingComplete =
    String(currentUserType) === '2'
      ? isStaffOnboardingComplete && isAadhaarVerified
      : isHouseOwnerOnboardingComplete;

  const checkPolicyStatus = useCallback(async () => {
    // Only check and trigger updated terms modal if user has completed onboarding and reached Dashboard
    if (!isOnboardingComplete) {
      setNeedsAcceptance(false);
      setIsChecking(false);
      return;
    }

    try {
      const cached = await AsyncStorage.getItem(POLICY_ACCEPTED_KEY);
      if (cached === 'true') {
        setIsChecking(false);
        return;
      }
    } catch (e) {
      // AsyncStorage read failed, continue to API check
    }

    GET_WITH_TOKEN(
      PolicyStatus,
      (success) => {
        const policies = success?.data || [];
        const pendingPolicies = policies.filter(p => !p.accepted);
        if (pendingPolicies.length > 0) {
          setNeedsAcceptance(true);
        } else {
          AsyncStorage.setItem(POLICY_ACCEPTED_KEY, 'true').catch(() => {});
        }
        setIsChecking(false);
      },
      () => {
        setIsChecking(false);
      },
      () => {
        setIsChecking(false);
      },
    );
  }, [isOnboardingComplete]);

  useEffect(() => {
    checkPolicyStatus();
  }, [checkPolicyStatus]);

  const handleAccept = useCallback(() => {
    setIsAccepting(true);

    const acceptPolicy = (type) => {
      return new Promise((resolve, reject) => {
        POST_WITH_TOKEN(
          PolicyAccept,
          { policy_type: type },
          (success) => resolve(success),
          (error) => reject(error),
          () => reject(new Error('Network error')),
        );
      });
    };

    Promise.all([
      acceptPolicy('terms_and_conditions'),
      acceptPolicy('privacy_policy'),
    ]).then(() => {
      AsyncStorage.setItem(POLICY_ACCEPTED_KEY, 'true').catch(() => {});
      setNeedsAcceptance(false);
      setIsAccepting(false);
    }).catch(() => {
      setIsAccepting(false);
    });
  }, []);

  if (isChecking) {
    return null;
  }

  return (
    <>
      {children}
      <TermsAcceptanceModal
        visible={needsAcceptance}
        onAccept={handleAccept}
        isLoading={isAccepting}
      />
    </>
  );
};

export default PolicyGate;
