import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  PixelRatio,
  Image,
} from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../Constants/Colors';
import { Font } from '../Constants/Font';
import Typography from './UI/Typography';
import { ImageConstant } from '../Constants/ImageConstant';

const Button = ({
  onPress,
  title,
  loader = false,
  disabled = false,
  style,
  title_style,
  main_style,
  linerColor = ['#D98579', '#D98579'],
  icon,
  IconStyle = {},
}) => {
  const fontScale = PixelRatio?.getFontScale();
  const isDisabled = loader || disabled;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} disabled={isDisabled} style={[main_style, isDisabled && { opacity: 0.5 }]}>
      <LinearGradient
        colors={linerColor}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.opacity_style, style]}
      >
        {loader ? (
          <ActivityIndicator size="small" color={Colors?.white} />
        ) : (
          <View style={{flexDirection:"row"}}>
            {icon && (
              <Image
                source={icon}
                style={{ width: 20, height: 20, resizeMode:"center",right:5,...IconStyle }}
              />
            )}
            <Typography
              style={[
                styles.text_style,
                { fontSize: 16 / fontScale },
                title_style,
              ]}
            >
              {title}
            </Typography>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default Button;

const styles = StyleSheet.create({
  opacity_style: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginVertical: 10,
    height: 50,
  },
  text_style: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: Font.Poppins_SemiBold,
  },
});
