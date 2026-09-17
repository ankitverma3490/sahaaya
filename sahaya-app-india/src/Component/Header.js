import {
  StyleSheet,
  View,
  StatusBar,
  TouchableOpacity,
  Image,
} from 'react-native';
import React from 'react';
import { Colors } from '../Constants/Colors';
import { Font } from '../Constants/Font';
import Typography from './UI/Typography';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';

const Header = ({
  onPress,
  style_img,
  style_backarrow,
  style_title,
  title,
  source_arrow,
  source_logo,
  containerStyle,
  centerIcon = false,
  backgroundColor = Colors.white,
  centerIconSource,
  centerIconTitle,
  onPressRightIcon = () => {},
  onBackPressFun = () => {},
  onBackPress=false
}) => {
  const navigation = useNavigation();
  return (
    <View style={[styles.container, containerStyle]}>
      <StatusBar translucent={true} backgroundColor="transparent" />

      <View style={styles.backContainer}>
        <TouchableOpacity
          onPress={() => {
            onBackPress ? onBackPressFun() : navigation.goBack();
          }}
        >
          <Image
            source={source_arrow}
            style={[styles.back_img, style_backarrow]}
          />
        </TouchableOpacity>
        <Typography
          type={Font.Poppins_Regular}
          style={[styles.txt_style, style_title]}
        >
          {title}
        </Typography>
        <TouchableOpacity onPress={onPressRightIcon}>
          <Image source={source_logo} style={[styles.back_img]} />
        </TouchableOpacity>
      </View>
      {centerIcon && (
        <View style={{ alignItems: 'center', marginBottom: 14, marginTop: 40 }}>
          <Image
            source={centerIconSource}
            style={{
              height: 86,
              width: 227,
              marginBottom: 20,
              resizeMode: 'contain',
            }}
          />
        </View>
      )}
    </View>
  );
};
export default Header;

const styles = StyleSheet.create({
  container: {
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
  },
  backContainer: {
    flexDirection: 'row',
    // paddingTop: heightPercentageToDP(9),
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
  },
  back_img: {
    height: 18.21,
    width: 23.15,
    resizeMode: 'center',
    tintColor: Colors.black,
  },
  txt_style: {
    color: Colors.black,
    fontSize: 18,
    textAlign: 'center',
    flex: 1,
  },
});
