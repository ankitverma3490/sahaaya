import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import Typography from './Typography';
import { Font } from '../../Constants/Font';

const ProfileStepRoller = ({ steps = [], activeStep = 0, onStepPress }) => {
  const scrollViewRef = useRef(null);
  const itemLayouts = useRef({});

  useEffect(() => {
    if (itemLayouts.current[activeStep] && scrollViewRef.current) {
      const layout = itemLayouts.current[activeStep];
      const scrollX = Math.max(0, layout.x - 30);
      scrollViewRef.current.scrollTo({ x: scrollX, animated: true });
    }
  }, [activeStep]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          return (
            <TouchableOpacity
              key={step.id || index}
              activeOpacity={0.8}
              onLayout={(e) => {
                itemLayouts.current[index] = e.nativeEvent.layout;
              }}
              onPress={() => onStepPress && onStepPress(index)}
              style={[
                styles.tabItem,
                isActive ? styles.activeTabItem : styles.inactiveTabItem,
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {step.icon && (
                  typeof step.icon === 'string' ? (
                    <Typography
                      size={13}
                      type={isActive ? Font?.Poppins_SemiBold : Font?.Poppins_Medium}
                      color={isActive ? '#1A1A1A' : '#737373'}
                      style={[styles.tabText, { marginRight: 4 }]}
                    >
                      {step.icon}
                    </Typography>
                  ) : (
                    <Image
                      source={step.icon}
                      style={{ width: 14, height: 14, marginRight: 6, tintColor: isActive ? '#1A1A1A' : '#737373' }}
                      resizeMode="contain"
                    />
                  )
                )}
                <Typography
                  size={13}
                  type={isActive ? Font?.Poppins_SemiBold : Font?.Poppins_Medium}
                  color={isActive ? '#1A1A1A' : '#737373'}
                  style={styles.tabText}
                >
                  {step.title}
                </Typography>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default ProfileStepRoller;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F7',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 6,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  activeTabItem: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  inactiveTabItem: {
    backgroundColor: 'transparent',
  },
  tabText: {
    letterSpacing: -0.2,
  },
});
