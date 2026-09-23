import { StyleSheet, Text, View, Image } from 'react-native';
import React from 'react';
import { ImageConstant } from '../Constants/ImageConstant';
import { Colors } from '../Constants/Colors';
import { Font } from '../Constants/Font';
import Typography from './UI/Typography';

const ToothsComponent = ({
  style,
  img_style,
  maintitle_style,
  subtitle_style,
  title,
  sub_title,
  source
}) => {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={source}
        style={[styles.image_style, img_style]}
      />
     { title &&<> <Typography style={[styles.mainText, maintitle_style]}>{title}</Typography>
      <Typography style={[styles.subText, subtitle_style]}>
        {sub_title}
      </Typography></>}
    </View>
  );
};

export default ToothsComponent;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    alignItems: 'center',

  paddingBottom:20
  },
  image_style: {
    height: 144,
    width: 162,
resizeMode:"contain"
  },
  mainText: {
    color: Colors.black,
    fontSize: 20,
    fontFamily: Font.Poppins_Medium,
    // marginBottom: 5,
    // marginTop: 10,
  },
  subText: {
    color: Colors.grey,
    fontSize: 14,
    fontFamily: Font.Poppins_Regular
  },
});
