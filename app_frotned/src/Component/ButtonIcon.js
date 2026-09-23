import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import Typography from './UI/Typography'
import { Colors } from '../Constants/Colors'
import { Font } from '../Constants/Font'
import { windowWidth } from '../Constants/Dimensions'

const ButtonIcon = ({title,icon,btnStyle,textStyle,onPressBtn=()=>{}}) => {
  return (
    <TouchableOpacity onPress={onPressBtn} style={[styles.btn,btnStyle]}>
     { icon &&   <Image source={icon} style={{width:16,height:16,marginRight:5}}/>}
      <Typography size={16} color={Colors.blue} type={Font.Poppins_SemiBold} style={textStyle}>{title}</Typography>
    </TouchableOpacity>
  )
}

export default ButtonIcon

const styles = StyleSheet.create({
  btn:{
width:windowWidth/1.2,
borderWidth:1,
alignItems:"center",
flexDirection:"row",
justifyContent:"center",
alignSelf:"center",
borderColor:Colors.blue,
borderRadius:14,
height:58,

  }
})