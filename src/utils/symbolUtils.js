// Symbol utility functions

// Get display symbol (remove .NS suffix for display)
export const getDisplaySymbol = (symbol) => {
  if (!symbol) return symbol;
  return symbol.replace(/\.NS$/, '');
};

// Get full symbol with .NS suffix for API calls
export const getFullSymbol = (symbol) => {
  if (!symbol) return symbol;
  return symbol.includes('.NS') ? symbol : `${symbol}.NS`;
};

// Check if symbol is valid
export const isValidSymbol = (symbol) => {
  return symbol && typeof symbol === 'string' && symbol.trim().length > 0;
};

// Format symbol for display (uppercase, trimmed)
export const formatSymbol = (symbol) => {
  if (!symbol) return '';
  return symbol.trim().toUpperCase();
};
