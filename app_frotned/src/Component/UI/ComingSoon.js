import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import Typography from './Typography';
import {Font} from '../../Constants/Font';
import {Colors} from '../../Constants/Colors';

const ComingSoon = () => {
  return (
    <View
      style={{
        alignItems: 'center',
        marginHorizontal: 15,
        borderWidth: 1,
        borderRadius: 10,
        height: 100,
        justifyContent: 'center',
        borderColor: Colors.border_blue,
      }}>
      <Typography color='gray' size={20} type={Font.Poppins_Medium}>
        ComingSoon
      </Typography>
    </View>
  );
};

export default ComingSoon;

const styles = StyleSheet.create({});
