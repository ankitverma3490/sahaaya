import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import Typography from './Typography'; 
import { Font } from '../../Constants/Font';
import { Colors } from '../../Constants/Colors';
import { ImageConstant } from '../../Constants/ImageConstant';

const TrainingVideoCard = ({ image, title, subtitle }) => {
    const [isChecked, setIsChecked] = useState(false);
    const toggleCheck = () => {
        setIsChecked(!isChecked);
    };
    return (
        <View style={styles.boxContainer}>
            {/* Video Thumbnail */}
            <View style={{flexDirection:"row", alignItems:"center"}}>

            <Image source={image} style={styles.image} />
            <View style={styles.textContainer}>

            {/* Title & Subtitle */}
                <Typography type={Font.Poppins_Bold} size={12} lineHeight={18}>
                    {title}{ title && " : "  }
                    <Typography type={Font.Poppins_Medium} size={12} lineHeight={18}>
                        {" "}{subtitle}
                    </Typography>
                </Typography>
            </View>
            </View>


            {/* Toggle Check Icon */}
            <TouchableOpacity onPress={toggleCheck} style={styles.iconPlaceholder}>
                <Image 
                    source={isChecked ? ImageConstant.check_icon : null} 
                    style={styles.checkIcon} 
                />
            </TouchableOpacity>
        </View>
    );
};

export default TrainingVideoCard;

const styles = StyleSheet.create({
    boxContainer: {
        borderWidth: 1,
        borderColor: Colors.LightWhite,
        borderRadius: 7,
        flexDirection: "row",
        alignItems: "center",
        marginTop:20,
        justifyContent:'space-between'
       
    },
    image: {
        height: 116,
        width: 114,
    },
    textContainer: {
        width: "50%",
        marginLeft: 16,
        justifyContent: "flex-start",
       
    },
    iconPlaceholder: {
        height: 16,
        width: 16,
        borderWidth: 1,
        borderColor: Colors.LightWhite,
        borderRadius: 4,
        justifyContent: "center",
        alignItems: "center",
        marginRight:18
    },
    checkIcon: {
        height: 16,
        width: 16,
    },
});
