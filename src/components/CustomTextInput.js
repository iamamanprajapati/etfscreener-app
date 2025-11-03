import React from 'react';
import { TextInput as RNTextInput } from 'react-native';

/**
 * Custom TextInput component that prevents font scaling from system settings
 * This ensures consistent typography regardless of user's accessibility font size settings
 */
const TextInput = React.forwardRef((props, ref) => {
  return <RNTextInput {...props} ref={ref} allowFontScaling={false} />;
});

TextInput.displayName = 'TextInput';

export default TextInput;

