import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Alert,
} from 'react-native';
import {Colors} from '../../Constants/Colors';

const CustomSwitch = ({value, onValueChange, activateColor}) => {
  const [animatedValue] = useState(new Animated.Value(value ? 1 : 0));

  const toggleSwitch = () => {
    const newValue = !value;
    onValueChange(newValue);
    Animated.timing(animatedValue, {
      toValue: newValue ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const thumbTranslateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  return (
    <TouchableOpacity style={styles.switchContainer} onPress={toggleSwitch}>
      <View
        style={[
          styles.track,
          {
            backgroundColor: !!value ? activateColor : '#BABABA',
          },
        ]}>
        <Animated.View
          style={[styles.thumb, {transform: [{translateX: thumbTranslateX}]}]}
        />
      </View>
    </TouchableOpacity>
  );
};

const SwitchButton = ({value, onValueChange, activateColor = Colors.blue}) => {
  return (
    <CustomSwitch
      value={value || false}
      activateColor={activateColor}
      onValueChange={onValueChange}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'red',
  },
  switchContainer: {
    width: 40,
    height: 20,
    borderRadius: 15,
    backgroundColor: '#767577',
    justifyContent: 'center',
  },
  track: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    backgroundColor: '#767577',
    alignItems: 'flex-start',
  },
  thumb: {
    width: 15, // Adjust thumb size here
    height: 15,
    borderRadius: 10,
    backgroundColor: '#FFF',
    margin: 2.5,
  },
});

export default SwitchButton;
