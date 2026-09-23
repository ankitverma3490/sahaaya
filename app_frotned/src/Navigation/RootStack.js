import {
  CardStyleInterpolators,
  createStackNavigator,
} from '@react-navigation/stack';
import React from 'react';
import { View } from 'react-native';
import { TabNavigation } from './TabNavigation';
import FindStaff from '../../src/Screens/Private/FindStaff/FindStaff';
import AllStaff from '../../src/Screens/Private/FindStaff/AllStaff';
import FamilyMembers from '../../src/Screens/Private/MoreScreens/FamilyMembers';
import MyJobPosting from '../../src/Screens/Private/MoreScreens/MyJobPosting';
import ListingJob from '../../src/Screens/Private/MoreScreens/ListingJob';
import NewMember from '../../src/Screens/Private/MoreScreens/NewMember';
import Notification from '../../src/Screens/Private/MoreScreens/Notification';
import PostNewJob from '../../src/Screens/Private/MoreScreens/PostNewJob';
import Aadhar from './../Screens/Private/Staff/Aadhar';
import NewStaffFrom from './../Screens/Private/Staff/NewStaffFrom';
import StaffVerifection from './../Screens/Private/Staff/StaffVerifection';
import HouseholdProfile from './../Screens/Private/MoreScreens/HouseholdProfile';
import AadharOtp from './../Screens/Private/Staff/AadharOtp';
import SelectJob from './../Screens/Private/Staff/SelectJob';
import LeaveApplications from './../Screens/Leave/LeaveApplications';
import ProfileManagement from '../Screens/Auth/ProfileSteps/ProfileManagement';
import AttendanceScreen from '../Screens/Calender/AttendanceScreen';
import HouseholdManager from '../Screens/Membership/HouseholdManager';
import HouseHoldStaffProfile from './../Screens/Private/Staff/HouseHoldStaffProfile';
import StaffActionScreen from './../Screens/Private/Staff/StaffActionScreen';
import Step1 from '../Screens/Auth/ProfileSteps/Step1';
import PolicyScreen from '../Component/PolicyScreen';
import AppUpdate from '../Screens/Private/MoreScreens/AppUpdate';
import ReferAndEarn from '../Screens/Private/MoreScreens/ReferAndEarn';
import RecentSalaryList from '../Screens/Private/Salary/RecentSalaryList';
import Salary from '../Screens/Private/Salary/Salary';
import ManageAddresses from '../Screens/Private/MoreScreens/ManageAddresses';
import TicketList from '../Screens/Support/TicketList';
import CreateTicket from '../Screens/Support/CreateTicket';
import TicketDetail from '../Screens/Support/TicketDetail';
import QuitRequests from '../Screens/Private/MoreScreens/QuitRequests';
import { useSelector } from 'react-redux';

const commonOptions = {
  CardStyleInterpolators: CardStyleInterpolators.forHorizontalIOS,
  headerShown: false,
  cardStyle: { backgroundColor: '#FFFFFF' },
};
const Stack = createStackNavigator();

const RootStack = () => {
  const userDetails = useSelector(state => state?.userDetails);

  // Check if household profile onboarding is completed
  const isHouseholdComplete =
    userDetails?.is_profile_completed == 1 ||
    (userDetails?.step && Number(userDetails?.step) >= 4) ||
    Boolean(userDetails?.addresses && userDetails?.addresses?.length > 0);

  const initialRouteRef = React.useRef(null);
  if (initialRouteRef.current === null) {
    initialRouteRef.current = isHouseholdComplete ? 'TabNavigation' : 'Step1';
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName={initialRouteRef.current}
      >
      <Stack.Screen
        name="TabNavigation"
        component={TabNavigation}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        options={{ headerShown: false }}
        name="Step1"
        component={Step1}
      />
      <Stack.Screen
        name="FindStaff"
        component={FindStaff}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="AllStaff"
        component={AllStaff}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="FamilyMembers"
        component={FamilyMembers}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="MyJobPosting"
        component={MyJobPosting}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="Notification"
        component={Notification}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="PostNewJob"
        component={PostNewJob}
        options={{ ...commonOptions }}
      />

      <Stack.Screen
        name="Aadhar"
        component={Aadhar}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="StaffVerifection"
        component={StaffVerifection}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="NewStaffFrom"
        component={NewStaffFrom}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="NewMember"
        component={NewMember}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="HouseholdProfile"
        component={HouseholdProfile}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="AadharOtp"
        component={AadharOtp}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="SelectJob"
        component={SelectJob}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="Leave"
        component={LeaveApplications}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="ProfileManagement"
        component={ProfileManagement}
        options={{ ...commonOptions }}
      />

      <Stack.Screen
        name="AttendanceScreen"
        component={AttendanceScreen}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="HouseholdManager"
        component={HouseholdManager}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="HouseHoldStaffProfile"
        component={HouseHoldStaffProfile}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="StaffActionScreen"
        component={StaffActionScreen}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="Policy"
        component={PolicyScreen}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="ListingJob"
        component={ListingJob}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="AppUpdate"
        component={AppUpdate}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="ReferAndEarn"
        component={ReferAndEarn}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="RecentSalaryList"
        component={RecentSalaryList}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="Salary"
        component={Salary}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="ManageAddresses"
        component={ManageAddresses}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="TicketList"
        component={TicketList}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="CreateTicket"
        component={CreateTicket}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="TicketDetail"
        component={TicketDetail}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="QuitRequests"
        component={QuitRequests}
        options={{ ...commonOptions }}
      />
    </Stack.Navigator>
    </View>
  );
};

export default RootStack;
