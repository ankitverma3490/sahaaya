import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { ImageConstant } from '../../Constants/ImageConstant';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const IntroScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Updated Intro slides data according to requirements
  const introSlides = [
    {
      id: 1,
      image: ImageConstant?.logo,
      title: 'Welcome to Sahayya',
      subtitle: 'Trusted Household Staffing Platform',
      bullets: [],
    },
    {
      id: 2,
      image: ImageConstant?.slide_hire_staff,
      title: 'Hire Verified Staff with AI',
      subtitle: '',
      bullets: [
        { label: 'Background verified', icon: ImageConstant?.ic_usercheck || ImageConstant?.check },
        { label: 'Ratings & Reviews', icon: ImageConstant?.win || ImageConstant?.check },
        { label: 'Nearby candidates', icon: ImageConstant?.Location || ImageConstant?.check },
      ],
    },
    {
      id: 3,
      image: ImageConstant?.slide_manage_app,
      title: 'Manage Everything in One App',
      subtitle: '',
      bullets: [
        { label: 'Attendance', icon: ImageConstant?.Calendar || ImageConstant?.check },
        { label: 'Salary', icon: ImageConstant?.Salary || ImageConstant?.check },
        { label: 'Leave', icon: ImageConstant?.fileText || ImageConstant?.check },
        { label: 'Tasks', icon: ImageConstant?.work || ImageConstant?.check },
        { label: 'Reminders', icon: ImageConstant?.ic_bellring || ImageConstant?.check },
      ],
    },
  ];

  useEffect(() => {
    // Check if intro was already shown
    const checkIntroShown = async () => {
      try {
        const introShown = await AsyncStorage.getItem('introShown');
        if (introShown === 'true') {
          // Intro already shown, navigate to Login
          navigation.replace('Login');
        }
      } catch (error) {
        // If read fails, default to showing intro screen
        console.log('AsyncStorage read error:', error);
      }
    };

    checkIntroShown();

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = async () => {
    if (currentIndex < introSlides.length - 1) {
      // Go to next slide
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    } else {
      // Last slide, navigate to Login
      try {
        await AsyncStorage.setItem('introShown', 'true');
        navigation.replace('Login');
      } catch (error) {
        console.log('AsyncStorage save error:', error);
        navigation.replace('Login');
      }
    }
  };

  const handleScroll = event => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    if (
      slideIndex !== currentIndex &&
      slideIndex >= 0 &&
      slideIndex < introSlides.length
    ) {
      setCurrentIndex(slideIndex);
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('introShown', 'true');
      navigation.replace('Login');
    } catch (error) {
      console.log('AsyncStorage save error:', error);
      navigation.replace('Login');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FEF9F9" />

      {/* Image Slider */}
      <Animated.View
        style={[
          styles.sliderContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={event => {
            const slideIndex = Math.round(
              event.nativeEvent.contentOffset.x / width,
            );
            if (slideIndex >= 0 && slideIndex < introSlides.length) {
              setCurrentIndex(slideIndex);
            }
          }}
        >
          {introSlides.map((slide, index) => (
            <View key={slide.id} style={styles.slide}>
              <View style={styles.imageContainer}>
                <Image
                  source={slide.image}
                  style={[
                    styles.image,
                    index === 0 && styles.logoImage,
                  ]}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.title}>{slide.title}</Text>
                {!!slide.subtitle && (
                  <Text style={styles.subtitle}>{slide.subtitle}</Text>
                )}
                {slide.bullets && slide.bullets.length > 0 && (
                  <View style={styles.bulletsContainer}>
                    {slide.bullets.map((bullet, bIdx) => (
                      <View key={bIdx} style={styles.bulletChip}>
                        <View style={styles.bulletIconContainer}>
                          <Image
                            source={bullet.icon || ImageConstant?.check}
                            style={styles.bulletIcon}
                            resizeMode="contain"
                          />
                        </View>
                        <Text style={styles.bulletText}>{bullet.label}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        {introSlides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>

      {/* Buttons */}
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            transform: [{ translateY: slideAnim }],
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          accessibilityLabel="Next button"
          accessibilityRole="button"
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === introSlides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          accessibilityLabel="Skip button"
          accessibilityRole="button"
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF9F9',
  },
  sliderContainer: {
    flex: 1,
  },
  slide: {
    width: width,
    flex: 1,
  },
  imageContainer: {
    height: height * 0.38,
    width: '100%',
    overflow: 'hidden',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    backgroundColor: '#FEF9F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '90%',
    height: '90%',
    borderRadius: 20,
  },
  logoImage: {
    width: width * 0.65,
    height: '75%',
    borderRadius: 0,
    alignSelf: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#D98579',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  bulletsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
    maxWidth: width * 0.95,
  },
  bulletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F5DCD8',
    elevation: 2,
    shadowColor: '#D98579',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginVertical: 5,
    marginHorizontal: 4,
  },
  bulletIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FDECE9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bulletIcon: {
    width: 12,
    height: 12,
    tintColor: '#D98579',
  },
  bulletText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#D98579',
    width: 24,
  },
  inactiveDot: {
    backgroundColor: '#D0D0D0',
  },
  buttonContainer: {
    paddingBottom: 30,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#D98579',
    width: width * 0.6,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#D98579',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    color: '#888888',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default IntroScreen;

