import {
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  View,
} from 'react-native';
import React, {useRef} from 'react';

import {Colors} from '../../Constants/Colors';
const SimpleModal = ({
  visible = false,
  close = () => {},
  children,
  backgroundColor = Colors.white,
  style,
}) => {
  return (
    <Modal
      transparent
      statusBarTranslucent={true}
      animationType="fade"
      visible={visible}>
      <KeyboardAvoidingView
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
        }}
        behavior="padding">
        <TouchableOpacity
          onPress={close}
          style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}
          activeOpacity={1}>
          <View
            style={[
              styles.animateView,
              {backgroundColor: backgroundColor},
              {...style},
            ]}>
            <TouchableOpacity activeOpacity={1}>{children}</TouchableOpacity>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default SimpleModal;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#00000090',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animateView: {
    width: '90%',
    padding: 20,
    borderRadius: 15,
  },
});
