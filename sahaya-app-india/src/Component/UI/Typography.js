import { StyleSheet, Text as RNText, View, useWindowDimensions, PixelRatio } from 'react-native'
import React from 'react'
// import { Font } from '../../Constants/Font'
import { Colors } from '../../Constants/Colors'
import { Font } from '../../Constants/Font'

const Typography = ({
    size = 14,
    children,
    type = Font?.Poppins_Regular,
    color = Colors?.black,
    textAlign = undefined,
    style = {},
    numberOfLines,
    lineHeight,
    fontWeight,
    letterSpacing,
    ...props
}) => {
    const fontScale = PixelRatio?.getFontScale();

    return (
        <RNText
            numberOfLines={numberOfLines}
            style={[
                styles.font,
                {
                    fontSize: size/fontScale-1,
                    color: color,
                    textAlign,
                    // fontWeight: fontWeight,
                    lineHeight: lineHeight,
                    fontFamily: type,
                    letterSpacing: letterSpacing
                },
                style,
            ]}
            {...props}>
            {children}
        </RNText>

    )
}

export default Typography

const styles = StyleSheet.create({
    font: {
        // fontFamily: fonts[type] || undefined,
        textAlignVertical: 'center',
        includeFontPadding: false,
        // marginVertical: -10,
        // backgroundColor: 'red'
    },
});