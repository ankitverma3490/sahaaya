import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Colors } from '../Constants/Colors';
import { Font } from '../Constants/Font';
import { ImageConstant } from '../Constants/ImageConstant';
import Typography from './UI/Typography';

const UploadBox = ({
  title,
  icon = ImageConstant.NewCamera,
  onPress,
  styles_container,
  image,
}) => {
  return (
    <TouchableOpacity
      style={[styles.box, styles_container]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {image && image?.uri ? (
        <Image
          source={{ uri: image.uri }}
          style={styles.previewImage}
          resizeMode="cover"
        />
      ) : (
        <>
          <Image source={icon} style={styles.icon} />
          <Typography
            type={Font?.Poppins_Regular}
            size={14}
            textAlign={'center'}
          >
            {title}
          </Typography>
        </>
      )}
    </TouchableOpacity>
  );
};

export default UploadBox;

const styles = StyleSheet.create({
  box: {
    width: '100%',
    height: 130,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderWidth: 2,
    borderColor: '#EBEBEA',
    overflow: 'hidden', // Ensure image respects border radius
  },
  icon: {
    width: 40,
    height: 35,
    tintColor: '#666',
    marginBottom: 10,
    resizeMode: 'contain',
  },
  title: {
    fontFamily: Font?.Poppins_Medium,
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
});
