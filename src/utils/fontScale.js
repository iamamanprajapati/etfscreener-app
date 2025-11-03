import { Dimensions } from 'react-native';

// Reference dimensions (iPhone X/11/12/13 - a common base size)
const REFERENCE_WIDTH = 375;
const REFERENCE_HEIGHT = 812;

// Get current screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Scales font size based on screen width
 * This ensures fonts remain readable on smaller devices
 * while preventing overflow on larger devices
 * 
 * @param {number} size - Base font size in pixels
 * @param {number} factor - Optional scaling factor (default: 0.95 to prevent scaling too aggressively)
 * @returns {number} Scaled font size
 */
export const scaleFont = (size, factor = 0.95) => {
  const scale = (SCREEN_WIDTH / REFERENCE_WIDTH) * factor;
  // Ensure minimum font size for readability
  const scaledSize = size * scale;
  // Clamp between min and max for very small/large devices
  return Math.max(10, Math.min(scaledSize, size * 1.2));
};

/**
 * Scales font size with more conservative scaling for better readability
 * on very small devices
 * 
 * @param {number} size - Base font size in pixels
 * @returns {number} Scaled font size
 */
export const moderateScale = (size, factor = 0.3) => {
  const scale = (SCREEN_WIDTH / REFERENCE_WIDTH) * factor;
  return size + (scale - 1) * size;
};

/**
 * Get responsive font size for different screen sizes
 * Uses breakpoints for better control
 * 
 * @param {number} small - Font size for small devices (< 360px width)
 * @param {number} medium - Font size for medium devices (360-414px width)
 * @param {number} large - Font size for large devices (> 414px width)
 * @returns {number} Appropriate font size based on current screen
 */
export const responsiveFontSize = (small, medium, large) => {
  if (SCREEN_WIDTH < 360) {
    return small;
  } else if (SCREEN_WIDTH > 414) {
    return large;
  }
  return medium;
};

/**
 * Get current screen width
 */
export const getScreenWidth = () => SCREEN_WIDTH;

/**
 * Get current screen height
 */
export const getScreenHeight = () => SCREEN_HEIGHT;

/**
 * Check if device is small (width < 360px)
 */
export const isSmallDevice = () => SCREEN_WIDTH < 360;

/**
 * Check if device is tablet (width >= 768px)
 */
export const isTablet = () => SCREEN_WIDTH >= 768;

