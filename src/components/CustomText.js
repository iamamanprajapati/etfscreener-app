import React from 'react';
import { Text as RNText } from 'react-native';

/**
 * Custom Text component that prevents font scaling from system settings
 * This ensures consistent typography regardless of user's accessibility font size settings
 */
const Text = React.forwardRef((props, ref) => {
  return <RNText {...props} ref={ref} allowFontScaling={false} />;
});

Text.displayName = 'Text';

export default Text;

