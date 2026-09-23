import {
  CardStyleInterpolators,
  createStackNavigator,
} from '@react-navigation/stack';
import React, { useEffect, useRef } from 'react';
import { TabNavigationForStaff } from './TabNavigationForStaff';
import QuitJob from './../Screens/Staff/QuitJob';
import ApplyLeave from './../Screens/Staff/ApplyLeave';
import JobsList from './../Screens/Staff/JobsList';
import JobDetails from './../Screens/Staff/JobDetails';
import EditProfile from './../Screens/Staff/EditProfile';
import Notifications from './../Screens/Staff/Notifications';
import StaffProfileMain from './../Screens/Staff/StaffProfileMain';
import EarningSummary from './../Screens/Staff/EarningSummary';
import StaffAttendance from './../Screens/Staff/StaffAttendance';
import StaffAdvanceView from './../Screens/Staff/StaffAdvanceView';
import StaffPaymentHistory from './../Screens/Staff/StaffPaymentHistory';
import HireMeScreen from './../Screens/Staff/HireMeScreen';

import JobListing from './../Screens/Staff/JobListing';
import AIJobSearch from './../Screens/Staff/AIJobSearch';
import AIJobResults from './../Screens/Staff/AIJobResults';
import MemberShip from './../Screens/Staff/MemberShip';
import StepFirst from '../Screens/Auth/StaffProfile/StepFirst';
import PolicyScreen from '../Component/PolicyScreen';
import AppUpdate from '../Screens/Private/MoreScreens/AppUpdate';
import ReferAndEarn from '../Screens/Private/MoreScreens/ReferAndEarn';
import StaffWallet from '../Screens/Staff/StaffWallet';
import BankAccounts from '../Screens/Staff/BankAccounts';
import TrainingVideos from '../Screens/Staff/TrainingVideos';
import TicketList from '../Screens/Support/TicketList';
import CreateTicket from '../Screens/Support/CreateTicket';
import TicketDetail from '../Screens/Support/TicketDetail';
import { useDispatch, useSelector } from 'react-redux';
import Aadhaar from '../Screens/Auth/Aadhaar';
import AadharOtp from '../Screens/Private/Staff/AadharOtp';
import { GET_WITH_TOKEN } from '../Backend/Backend';
import { PROFILE } from '../Backend/api_routes';
import { userDetails } from '../Redux/action';
import { useFocusEffect } from '@react-navigation/native';

const commonOptions = {
  CardStyleInterpolators: CardStyleInterpolators.forHorizontalIOS,
  headerShown: false,
};
const Stack = createStackNavigator();

const RootStack = () => {
  const userDetail = useSelector(state => state?.userDetails);
  const Dispatch = useDispatch();

  global.Profile = async () => {
    GET_WITH_TOKEN(
      PROFILE,
      success => {
        console.log('90909', success?.data);
        Dispatch(userDetails(success?.data));
      },
      error => { },
      fail => { },
    );
  };

  useEffect(() => {
    global.Profile();
  }, []);

  const isAadhaarVerified =
    userDetail?.aadhar__verify == 1 ||
    userDetail?.aadhar__verify === true ||
    userDetail?.is_aadhar_verified == 1 ||
    userDetail?.is_aadhar_verified === true ||
    userDetail?.user_detail?.aadhar__verify == 1 ||
    userDetail?.user_detail?.is_aadhar_verified == 1;

  const isProfileComplete =
    userDetail?.is_staff_added == 1 ||
    (userDetail?.step && Number(userDetail?.step) >= 5) ||
    Boolean(userDetail?.user_work_info || userDetail?.work_info);

  // CRITICAL FIX: Lock initialRouteName in a ref computed ONCE on mount.
  // Previously initialRoute was a plain variable — every Redux dispatch
  // (e.g. global.Profile() after Aadhaar OTP verify) changed its value,
  // React re-rendered Stack.Navigator with new initialRouteName,
  // the navigator remounted mid-navigation and crashed the app.
  const initialRouteRef = useRef(null);
  if (initialRouteRef.current === null) {
    initialRouteRef.current = isProfileComplete
      ? 'TabNavigationForStaff'
      : !isAadhaarVerified
      ? 'Aadhaar'
      : 'StepFirst';
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={initialRouteRef.current}
    >
      <Stack.Screen name="TabNavigationForStaff" component={TabNavigationForStaff} options={{ ...commonOptions }} />
      <Stack.Screen options={{ headerShown: false }} name="Aadhaar" component={Aadhaar} />
      <Stack.Screen options={{ headerShown: false }} name="AadharOtp" component={AadharOtp} />
      <Stack.Screen name="StepFirst" component={StepFirst} options={{ ...commonOptions }} />
      <Stack.Screen name="QuitJob" component={QuitJob} options={{ ...commonOptions }} />
      <Stack.Screen name="ApplyLeave" component={ApplyLeave} options={{ ...commonOptions }} />
      <Stack.Screen name="ActiveJob" component={JobListing} options={{ ...commonOptions }} />
      <Stack.Screen name="JobDetails" component={JobDetails} options={{ ...commonOptions }} />
      <Stack.Screen name="Notifications" component={Notifications} options={{ ...commonOptions }} />
      <Stack.Screen name="EditProfile" component={EditProfile} options={{ ...commonOptions }} />
      <Stack.Screen name="StaffProfileMain" component={StaffProfileMain} options={{ ...commonOptions }} />
      <Stack.Screen name="JobListing" component={JobListing} options={{ ...commonOptions }} />
      <Stack.Screen name="MemberShip" component={MemberShip} options={{ ...commonOptions }} />
      <Stack.Screen name="Policy" component={PolicyScreen} options={{ ...commonOptions }} />
      <Stack.Screen name="EarningSummary" component={EarningSummary} options={{ ...commonOptions }} />
      <Stack.Screen name="StaffAdvanceView" component={StaffAdvanceView} options={{ ...commonOptions }} />
      <Stack.Screen name="StaffPaymentHistory" component={StaffPaymentHistory} options={{ ...commonOptions }} />
      <Stack.Screen name="HireMe" component={HireMeScreen} options={{ ...commonOptions }} />
      <Stack.Screen name="StaffAttendance" component={StaffAttendance} options={{ ...commonOptions }} />
      <Stack.Screen name="AIJobSearch" component={AIJobSearch} options={{ ...commonOptions }} />
      <Stack.Screen name="AIJobResults" component={AIJobResults} options={{ ...commonOptions }} />
      <Stack.Screen name="AppUpdate" component={AppUpdate} options={{ ...commonOptions }} />
      <Stack.Screen name="ReferAndEarn" component={ReferAndEarn} options={{ ...commonOptions }} />
      <Stack.Screen name="StaffWallet" component={StaffWallet} options={{ ...commonOptions }} />
      <Stack.Screen name="BankAccounts" component={BankAccounts} options={{ ...commonOptions }} />
      <Stack.Screen name="TicketList" component={TicketList} options={{ ...commonOptions }} />
      <Stack.Screen name="CreateTicket" component={CreateTicket} options={{ ...commonOptions }} />
      <Stack.Screen name="TicketDetail" component={TicketDetail} options={{ ...commonOptions }} />
      <Stack.Screen name="TrainingVideos" component={TrainingVideos} options={{ ...commonOptions }} />
    </Stack.Navigator>
  );
};

export default RootStack;
