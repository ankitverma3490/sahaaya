import {StyleSheet, View, Image} from 'react-native';
import React from 'react';
import Typography from './Typography';
import {Colors} from '../../Constants/Colors';
import {Font} from '../../Constants/Font';
import {ImageConstant} from '../../Constants/ImageConstant';

const EmptyView = ({
  title = 'No Data Found',
  description = '',
  icon = ImageConstant?.Users,
  iconColor = '#D98579',
  containerStyle = {},
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {icon && (
        <View style={[styles.iconContainer, {backgroundColor: '#FFF5F5'}]}>
          <Image
            source={icon}
            style={[styles.icon, {tintColor: iconColor}]}
            resizeMode="contain"
          />
        </View>
      )}
      <Typography
        type={Font.Poppins_SemiBold}
        size={18}
        style={styles.title}
        textAlign={'center'}
      >
        {title}
      </Typography>
      {description ? (
        <Typography
          type={Font.Poppins_Regular}
          size={14}
          style={styles.description}
          color="#666"
          textAlign={'center'}
        >
          {description}
        </Typography>
      ) : null}
    </View>
  );
};

export default EmptyView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    minHeight: 400,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    width: 40,
    height: 40,
  },
  title: {
    color: '#333',
    marginBottom: 8,
  },
  description: {
    lineHeight: 20,
    maxWidth: '80%',
  },
});
