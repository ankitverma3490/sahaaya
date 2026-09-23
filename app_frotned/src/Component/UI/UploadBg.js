import React from 'react';
import {
  Image,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Typography from './Typography';
import {Font} from '../../Constants/Font';
import {Colors} from '../../Constants/Colors';
import {ImageConstant} from '../../Constants/ImageConstant';
  export const UploadBg = ({
  imgName,
  imgType,
  onPress = () => {},
  customStyle,
}) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <ImageBackground
        source={ImageConstant.Rectangle}
        resizeMode="contain"
        style={[styles.container, customStyle]}>
        <Image source={ImageConstant.export} style={styles.icon} />
        <Typography
          color={Colors.darkgrey}
          size={12}
          marginTop={5}
          type={Font.Poppins_Regular}>
          {imgName}
        </Typography>
        <Typography
          color={Colors.darkgrey}
          size={12}
          marginTop={5}
          type={Font.Poppins_Regular}>
          {imgType}
        </Typography>
      </ImageBackground>
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  container: {
    height: 95,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    height: 20,
    width: 20,
  },
});
