import { StyleSheet, Text, View, Image } from 'react-native';
import React from 'react';
import { MultiSelect } from 'react-native-element-dropdown';
import { ImageConstant } from '../Constants/ImageConstant';
import { Colors } from '../Constants/Colors';
import Typography from './UI/Typography';
import { Font } from '../Constants/Font';

const MultiSelectDropdown = ({
  title,
  source,
  style_img,
  style_title,
  style_dropdown,
  data,
  value, // Array of selected values
  onChange = () => { },
  containerStyle = {},
  MainBoxStyle = {},
  iconColor,
  disable,
  width = '100%',
  marginHorizontal = 20,
  error,
  placeholder = " ",
  leftIcons = ImageConstant.BackArrow,
  leftIconsShow = false,
  selectedTextStyleNew = {},
  dropdownPosition = 'bottom',
}) => {
  const isItemSelected = (itemValue) => {
    return value && value.some(v => v === itemValue || v?.value === itemValue);
  };

  const renderItem = (item, index) => {
    const isSelected = isItemSelected(item?.value);
    return (
      <View key={item?.value || index}>
        <View
          style={{
            flexDirection: 'row',
            height: 50,
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isSelected ? '#FFF5F3' : 'white',
            paddingHorizontal: 16,
            borderRadius: 8,
            marginHorizontal: 6,
            marginVertical: 2,
          }}>
          <Typography style={{ flex: 1 }} type={Font.Poppins_Medium} size={14}>
            {item?.label}
          </Typography>
          <View style={{
            height: 22,
            width: 22,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: isSelected ? '#D98579' : '#CCCCCC',
            backgroundColor: isSelected ? '#D98579' : 'white',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {isSelected && (
              <Typography size={14} color="white" type={Font.Poppins_SemiBold}>
                ✓
              </Typography>
            )}
          </View>
        </View>
        {index !== data?.length - 1 && (
          <View
            style={{
              height: 1.5,
              backgroundColor: Colors.lightgrey,
              marginHorizontal: 20,
            }}></View>
        )}
      </View>
    );
  };

  return (
    <>
      <View style={[{ marginHorizontal: marginHorizontal, marginVertical: 10 }, MainBoxStyle]}>
        {title && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 5,
            }}>
            {source && <Image source={source} style={[styles.img_style, style_img]} />}
            <Typography style={[styles.txt_style, style_title]}>
              {title}
            </Typography>
          </View>
        )}
        <MultiSelect
          disable={disable}
          showsVerticalScrollIndicator={false}
          style={[styles.dropdown, style_dropdown, { borderColor: error ? 'red' : '#E0E0E0' }]}
          selectedTextStyle={[styles.selectedTextStyle, selectedTextStyleNew]}
          iconStyle={styles.iconStyle}
          placeholderStyle={[styles.placeholderStyle, { ...selectedTextStyleNew }]}
          data={data}
          value={value || []}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={placeholder}
          dropdownPosition={dropdownPosition}
          iconColor={iconColor}
          activeColor="#FFF5F3"
          onChange={item => {
            onChange(item);
          }}
          renderRightIcon={() => (
            <View
              pointerEvents="none"
              style={{
                height: 24,
                width: 24,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Image
                tintColor={iconColor || '#979797'}
                source={ImageConstant.dropDown || ImageConstant.BackArrow}
                style={{
                  height: 12,
                  width: 12,
                  resizeMode: 'contain',
                  tintColor: '#979797',
                  transform: [{ rotate: '-90deg' }],
                }}
              />
            </View>
          )}
          renderLeftIcon={() => (
            <>
              {leftIconsShow && (
                <View
                  pointerEvents="none"
                  style={{
                    height: 24,
                    width: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Image
                    tintColor={iconColor}
                    source={leftIcons}
                    style={{
                      height: 20,
                      width: 20,
                      resizeMode: 'contain',
                      borderRadius: 10,
                      overflow: 'hidden',
                    }}
                  />
                </View>
              )}
            </>
          )}
          renderItem={renderItem}
          selectedStyle={styles.selectedStyle}
          containerStyle={[styles.containerStyle, containerStyle]}
        />
      </View>
      {error && (
        <Typography
          textAlign={"right"}
          style={{ color: 'red', fontSize: 12, marginStart: 5, marginTop: -5, marginBottom: 10 }}>
          {error}
        </Typography>
      )}
    </>
  );
};

export default MultiSelectDropdown;

const styles = StyleSheet.create({
  img_style: {
    height: 16,
    width: 16,
    marginLeft: 10,
  },
  txt_style: {
    color: Colors.black,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: Font.Poppins_Medium,
    marginBottom: 4,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    marginHorizontal: 10,
    minHeight: 56,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  placeholderStyle: {
    color: '#999',
    fontSize: 14,
    fontFamily: Font.Poppins_Regular,
    flex: 1,
  },
  inputSearchStyle: {
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#E0E0E0',
  },
  iconStyle: {
    height: 20,
    width: 20,
    marginHorizontal: 10,
    marginVertical: 18,
  },
  selectedTextStyle: {
    color: Colors.black,
    fontSize: 14,
    fontFamily: Font.Poppins_Medium,
  },
  containerStyle: {
    borderRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'visible',
    marginTop: 2,
    backgroundColor: '#fff',
  },
  selectedStyle: {
    borderRadius: 8,
    backgroundColor: '#FFF5F3',
    borderColor: '#D98579',
    borderWidth: 1,
    margin: 4,
  }
});
