import React from 'react';
import { TextInput as RNTextInput, StyleSheet } from 'react-native';
import { scaleFont } from '../utils/fontScale';

/**
 * Custom TextInput component that prevents font scaling from system settings
 * but allows device-specific responsive sizing for better readability
 * 
 * Usage:
 * <TextInput style={{ fontSize: 16 }} />
 * The fontSize will be automatically scaled based on device size
 */
const TextInput = React.forwardRef((props, ref) => {
  const { style, ...restProps } = props;
  
  // Process style to scale font sizes
  const processedStyle = StyleSheet.flatten(style);
  let finalStyle = processedStyle;
  
  if (processedStyle?.fontSize && typeof processedStyle.fontSize === 'number') {
    // Create a new style object with scaled fontSize
    finalStyle = {
      ...processedStyle,
      fontSize: scaleFont(processedStyle.fontSize),
    };
  }
  
  return <RNTextInput {...restProps} style={finalStyle} ref={ref} allowFontScaling={false} />;
});

TextInput.displayName = 'TextInput';

export default TextInput;

