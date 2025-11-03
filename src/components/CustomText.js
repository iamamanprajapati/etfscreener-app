import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { scaleFont } from '../utils/fontScale';

/**
 * Custom Text component that prevents font scaling from system settings
 * but allows device-specific responsive sizing for better readability
 * 
 * Usage:
 * <Text style={{ fontSize: 16 }}>Text</Text>
 * The fontSize will be automatically scaled based on device size
 */
const Text = React.forwardRef((props, ref) => {
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
  
  return <RNText {...restProps} style={finalStyle} ref={ref} allowFontScaling={false} />;
});

Text.displayName = 'Text';

export default Text;

