import React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { Colors } from '../Constants/Colors'; // Assuming you have Colors defined
import { ImageConstant } from '../../Constants/ImageConstant';

const MyComponent = () => {
  return (
    <View style={styles.container}>
      {/* ImageBackground to simulate a blurred background */}
      <ImageBackground
        source={ImageConstant.blur} // Use an image if needed for background
        style={styles.imageBackground}
        imageStyle={{ borderRadius: 427 }} // If you need to round the corners
      >
        <View style={styles.overlay} />
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -220,
    left: -229,
    width: 540,
    height: 540,
    borderRadius: 427,
    overflow: 'hidden', // This ensures the rounded corners are applied correctly
    opacity: 1,  // Corrected opacity value (between 0 and 1)
    transform: [{ rotate: '180deg' }],  // Rotate the view 180 degrees
    resizeMode:"contain"
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5, // Adjust opacity for the background if needed
  
  },
  overlay: {
    flex: 1,
  // Optional: Dark overlay for additional visual effect
    blurRadius: 10, // Apply blur effect to the element itself
  },
});

export default MyComponent;
