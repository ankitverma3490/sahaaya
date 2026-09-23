import React from 'react';
import SimpleModal from '../UI/SimpleModal';
import {ImageConstant} from '../../Constants/ImageConstant';
import {Image, TouchableOpacity, View} from 'react-native';
import Typography from '../UI/Typography';
import {Font} from '../../Constants/Font';
import Button from '../Button';

export const EmailVerifyModal = ({
  visible,
  onClose = () => {},
  onPress = () => {},
  parentText,
  childText,
  text_style,
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
      <View style={{alignItems: 'center', marginTop: -10}}>
        <Image
          source={ImageConstant.i_image}
          style={{
            height: 74,
            width: 74,
          }}
        />
        {/* <Typography size={20} style={[text_style ,{marginTop: 25}]} type={Font.Poppins_SemiBold} textAlign={'center'}>
          {parentText}
        </Typography> */}
        {childText && (
          <Typography
            size={15}
            textAlign={'center'}
            color="#5D637A"
            marginTop={25}
            type={Font.Poppins_Regular}>
            {childText}
          </Typography>
        )}
      </View>

      <Button onPress={onPress} title={'ok'} marginHorizontal={32} style={{marginTop: 25}} />
    </SimpleModal>
  );
};
