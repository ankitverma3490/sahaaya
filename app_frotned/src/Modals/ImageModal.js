import {
  StyleSheet,
  Modal,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  Platform,
} from 'react-native';
import React from 'react';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {pick, types, isErrorWithCode, errorCodes} from '@react-native-documents/picker';
import {request, check, PERMISSIONS, RESULTS} from 'react-native-permissions';
import SimpleToast from 'react-native-simple-toast';
import { ImageConstant } from '../Constants/ImageConstant';
import Typography from '../Component/UI/Typography';
import { Colors } from '../Constants/Colors';
import { Font } from '../Constants/Font';

const ImageModal = ({
  showModal,
  documents = false,
  document,
  close = () => {},
  selected = () => {},
  TimeVal,
  deleteImage = false,
}) => {
  const OsVer = Platform.constants['Release'];

  const getCameraPermission = () =>
    Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;

  const getPhotoPermission = () =>
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.PHOTO_LIBRARY
      : OsVer > 12
      ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
      : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

  const handlePermission = async (permission, action) => {
    try {
      const result = await check(permission);

      if (result === RESULTS.GRANTED) {
        action();
      } else if (result === RESULTS.DENIED || result === RESULTS.LIMITED) {
        const requestResult = await request(permission);

        if (requestResult === RESULTS.GRANTED) {
          action();
        } else {
          SimpleToast.show('Permission denied.');
        }
      } else if (result === RESULTS.BLOCKED) {
        SimpleToast.show('Permission is blocked. Please enable it from settings.');
      } else {
        SimpleToast.show('Unknown permission error.');
      }
    } catch (error) {
      SimpleToast.show('An error occurred while requesting permissions.');
    }
  };

  const OpenCamera = async () => {
    await handlePermission(getCameraPermission(), () => {
      launchCamera(
        {
          mediaType: 'photo',
          maxWidth: 500,
          maxHeight: 500,
          quality: 0.7,
          cropping: true,
        },
        response => {
          if (!response.didCancel) {
            selected(response.assets, 'camera');
            close();
          }
        },
      );
    });
  };

  const OpenGallery = async () => {
    await handlePermission(getPhotoPermission(), () => {
      launchImageLibrary(
        {
          mediaType: 'photo',
          maxWidth: 500,
          maxHeight: 500,
          quality: 0.7,
          cropping: true,
        },
        response => {
          if (!response.didCancel && response.assets) {
            selected(response.assets, 'gallery');
            close();
          }
        },
      );
    });
  };

  const OpenDrive = async () => {
    try {
      const result = await pick({
        type: [types.allFiles],
      });
      if (result && result.length > 0) {
        const assets = result.map(f => ({
          uri: f.uri,
          name: f.name || 'document',
          type: f.mimeType || f.type || 'application/octet-stream',
        }));
        selected(assets, 'drive');
        close();
      }
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
        // User cancelled — do nothing
      } else {
        SimpleToast.show('Error selecting file. Please try again.');
      }
    }
  };

  return (
    <Modal
      statusBarTranslucent
      onRequestClose={() => close()}
      transparent={true}
      visible={showModal}
      animationType="slide">
      <TouchableWithoutFeedback onPress={() => close()}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              {/* Drag Handle */}
              <View style={styles.dragHandle} />

              {/* Header with Title and Close Button */}
              <View style={styles.modalHeader}>
                <Typography
                  size={16}
                  fontFamily={Font.Poppins_SemiBold}
                  color={Colors.black}>
                  Upload Photo
                </Typography>
                <TouchableOpacity
                  onPress={() => close()}
                  hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
                  style={styles.closeBtn}>
                  <Image
                    source={ImageConstant.X}
                    style={styles.closeIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>

              {/* Modal Body / Options */}
              <View style={styles.modalBody}>
                <TouchableOpacity style={styles.optionRow} onPress={OpenCamera}>
                  <View style={styles.iconContainer}>
                    <Image
                      style={styles.icon}
                      source={ImageConstant.Camera}
                    />
                  </View>
                  <Typography
                    size={15}
                    color={Colors.black}
                    style={{marginLeft: 15}}
                    fontFamily={Font.Poppins_Medium}>
                    Open Camera
                  </Typography>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionRow} onPress={OpenGallery}>
                  <View style={styles.iconContainer}>
                    <Image
                      style={styles.icon}
                      source={ImageConstant.NewCamera}
                    />
                  </View>
                  <Typography
                    size={15}
                    fontFamily={Font.Poppins_Medium}
                    color={Colors.black}
                    style={{marginLeft: 15}}>
                    Open Gallery
                  </Typography>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionRow} onPress={OpenDrive}>
                  <View style={styles.iconContainer}>
                    <Image
                      style={styles.icon}
                      source={ImageConstant.fileText}
                    />
                  </View>
                  <Typography
                    size={15}
                    fontFamily={Font.Poppins_Medium}
                    color={Colors.black}
                    style={{marginLeft: 15}}>
                    Upload from Drive / Files
                  </Typography>
                </TouchableOpacity>

                {/* Cancel / Close Button */}
                <TouchableOpacity style={styles.cancelButton} onPress={() => close()}>
                  <Typography
                    size={14}
                    fontFamily={Font.Poppins_Medium}
                    color="#D98579">
                    Cancel
                  </Typography>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default ImageModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -3},
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    height: 14,
    width: 14,
    tintColor: '#64748B',
  },
  modalBody: {
    paddingTop: 16,
  },
  optionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 10,
  },
  iconContainer: {
    borderRadius: 50,
    backgroundColor: '#FFF5F3',
    height: 45,
    width: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    height: 22,
    width: 22,
    tintColor: '#D98579',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#FFF5F3',
    borderWidth: 1,
    borderColor: '#FFE8E4',
  },
});