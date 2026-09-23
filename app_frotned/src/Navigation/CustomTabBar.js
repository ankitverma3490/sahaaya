import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image, Keyboard } from 'react-native';
import { ImageConstant } from '../Constants/ImageConstant';
import Typography from '../Component/UI/Typography';
import { Font } from '../Constants/Font';

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  if (isKeyboardVisible) {
    return null; // Hide the tab bar when the keyboard is visible
  }

  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? options.title ?? route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const getIcon = name => {
          const tintColor = isFocused ? 'rgba(2, 153, 145, 1)' : 'rgba(2, 153, 145, 0.5)';
          const iconStyle = { width: 19, height: 19, tintColor };

          switch (name) {
            case 'Home':
              return <Image source={ImageConstant?.homeTab_icon} style={iconStyle} />;
            case 'Booking':
              return <Image source={ImageConstant?.Booking} style={iconStyle} />;
            case 'Partner':
              return <Image source={ImageConstant?.profile} style={iconStyle} />;
            case 'Helpline':
              return <Image source={ImageConstant?.phone} style={iconStyle} />;
            default:
              return null;
          }
        };

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabButton}
          >
            {getIcon(route.name)}
            <Typography
              type={Font?.Poppins_Medium}
              style={[
                styles.tabLabel,
                { color: isFocused ? 'rgba(2, 153, 145, 1)' : 'rgba(2, 153, 145, 0.5)' },
              ]}
            >
              {label}
            </Typography>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 65,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 5,
    elevation: 5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
  },
});

export default CustomTabBar;
