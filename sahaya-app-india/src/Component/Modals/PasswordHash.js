import {Image, StyleSheet, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {Colors} from '../../Constants/Colors';
import {Font} from '../../Constants/Font';
import Typography from '../UI/Typography';
import {ImageConstant} from '../../Constants/ImageConstant';

const PasswordHash = ({style, password, onAllValidated}) => {
  const [passwordReq, setPasswordReq] = useState([
    {title: 'At least 8 characters', isAdded: false},
    {title: 'Lower case letters (a-z)', isAdded: false},
    {title: 'Upper case letters (A-Z)', isAdded: false},
    {title: 'Number (0-9)', isAdded: false},
    {title: 'Special characters (e.g. !@#$%^&*)', isAdded: false},
  ]);
  const [allRequirementsMet, setAllRequirementsMet] = useState(false);

  const checkPasswordValidation = () => {
    const updatedPasswordReq = passwordReq.map((req, index) => {
      switch (index) {
        case 0:
          return {...req, isAdded: password.length >= 8};
        case 1:
          return {...req, isAdded: /[a-z]/.test(password)};
        case 2:
          return {...req, isAdded: /[A-Z]/.test(password)};
        case 3:
          return {...req, isAdded: /[0-9]/.test(password)};
        case 4:
          return {...req, isAdded: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)};
        default:
          return req;
      }
    });

    const allValidated = updatedPasswordReq.every(req => req.isAdded);
    setPasswordReq(updatedPasswordReq);

    // Update only if validation status changes
    if (allValidated !== allRequirementsMet) {
      setAllRequirementsMet(allValidated);
      onAllValidated && onAllValidated(allValidated);
    }
  };

  useEffect(() => {
    checkPasswordValidation();
  }, [password]);

  if (allRequirementsMet) return null; // Don't render if all requirements are met

  return (
    <View style={[styles.passwordBox, style]}>
      {passwordReq.map((req, index) => (
        <View key={index} style={styles.reqView}>
          <Image
            source={req.isAdded ? ImageConstant.tickCircle : ImageConstant.cancel}
            style={{
              width: 16,
              height: 16,
              tintColor: req.isAdded ? '#29A71A' : '#E7062D',
            }}
          />
          <Typography
            size={12}
            color={Colors.black}
            type={Font.Poppins_Regular}
            style={{marginLeft: 5}}>
            {req.title}
          </Typography>
        </View>
      ))}
      <View style={styles.tooltip}>
        <Image
          source={ImageConstant.arrow_tooltip}
          style={{
            height: 20,
            width: 20,
            tintColor: 'rgb(249, 249, 249)',
            elevation: 5,
          }}
        />
      </View>
    </View>
  );
};

export default PasswordHash;

const styles = StyleSheet.create({
  passwordBox: {
    position: 'absolute',
    backgroundColor: 'rgb(249, 249, 249)',
    width: '60%',
    left: -40,
    top: 35,
    padding: 10,
    borderRadius: 15,
    zIndex: 100,
    marginStart: 50,
    marginTop: 50,
    elevation:1
  },
  reqView: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tooltip: {
    position: 'absolute',
    top: -8,
    left: 13,
  },
});
