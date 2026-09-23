import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import Langvage from '../Screens/Auth/Langvage';
import SiginUp from '../Screens/Auth/SiginUp';
import Login from '../Screens/Auth/Login'; 
import IntroScreen from '../Screens/Auth/IntroScreen'; 
import Otp from '../Screens/Auth/Otp';
import ChooseUser from '../Screens/Auth/ChooseUser';
import ChoosePlan from '../Screens/Auth/ChoosePlan';
import ApplyReferral from '../Screens/Auth/ApplyReferral';
import PolicyScreen from '../Component/PolicyScreen';
import EditProfile from '../Screens/Staff/EditProfile';

const AuthStack = () => {
  const Stack = createStackNavigator();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        options={{ headerShown: false }}
        name="Langvage"
        component={Langvage}
      />
      <Stack.Screen
        options={{ headerShown: false }}
        name="IntroScreen"
        component={IntroScreen}
      />
      
      <Stack.Screen
        options={{ headerShown: false }}
        name="Login"
        component={Login}
      />
      <Stack.Screen
        options={{ headerShown: false }}
        name="Policy"
        component={PolicyScreen}
      />
      <Stack.Screen
        options={{ headerShown: false }}
        name="SiginUp"
        component={SiginUp}
      />
      <Stack.Screen
        options={{ headerShown: false }}
        name="Otp"
        component={Otp}
      />
      <Stack.Screen
        options={{ headerShown: false }}
        name="ChooseUser"
        component={ChooseUser}
      />
      <Stack.Screen
        options={{ headerShown: false }}
        name="ChoosePlan"
        component={ChoosePlan}
      />
      <Stack.Screen
        options={{ headerShown: false }}
        name="EditProfile"
        component={EditProfile}
      />
      <Stack.Screen
        options={{ headerShown: false }}
        name="ApplyReferral"
        component={ApplyReferral}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;
