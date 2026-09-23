import React from 'react';
import SimpleModal from '../UI/SimpleModal';
import {ImageConstant} from '../../Constants/ImageConstant';
import {Image, TouchableOpacity, View} from 'react-native';
import {widthPercentageToDP} from 'react-native-responsive-screen';
import Typography from '../UI/Typography';
import {Font} from '../../Constants/Font';

export const ChangePasswordModal = ({
  visible,
  onClose = () => {},
  parentText,
  childText,
  text_style
}) => {
  return (
    <SimpleModal visible={visible} close={onClose}>
      <TouchableOpacity
        onPress={onClose}
        style={{
          alignSelf: 'flex-end',
          height: 40,
          width: 40,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -15,
          marginEnd: -15,
        }}>
        <Image
          source={ImageConstant.cancel}
          style={{height: 20, width: 20, resizeMode: 'contain'}}
        />
      </TouchableOpacity>
      <View style={{alignItems: 'center', marginTop: -10, paddingVertical: 10}}>
        <Image
          source={ImageConstant.success_icon}
          style={{
            height: 170,
            width: 170,
          }}
        />
        <Typography size={22} style={[text_style ,{marginTop: 25}]} type={Font.Poppins_SemiBold} textAlign={'center'}>
          {parentText}
        </Typography>
        {childText && <Typography size={15} textAlign={'center'} marginTop={5}>{childText}</Typography>}
      </View>
    </SimpleModal>
  );
};
