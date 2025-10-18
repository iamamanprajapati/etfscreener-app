// Centralized configuration and helper utilities for the ETF app

export const API_BASE = __DEV__
  ? 'https://etf-scanner-backend.onrender.com'
  : 'https://etf-scanner-backend.onrender.com';

export const SUMMARY_API_URL = `${API_BASE}/api/summary`;
export const PRICES_API_URL = `${API_BASE}/api/prices`;

// Number parsing helper (handles strings with commas, blanks)
export const parseNumber = (value) => {
  if (value == null) return null;
  const numericValue = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(numericValue) ? numericValue : null;
};

// Common formatters
export const formatters = {
  number: (n) => (n == null ? "—" : new Intl.NumberFormat().format(n)),
  percent: (n) => {
    if (n == null) return "—";
    const value = Number(n);
    const isPos = value > 0;
    const isNeg = value < 0;
    const content = `${isPos ? "+" : ""}${value.toFixed(2)}%`;
    return content;
  },
  price: (n) => (n == null ? "—" : Number(n).toFixed(2)),
  rsi: (n) => (n == null ? "—" : Number(n).toFixed(2)),
};

// Custom renderer for "Down from 2Y High"
export const renderDownFromHigh = (value) => {
  if (value == null) return "—";
  const numValue = Math.abs(Number(value));
  return `-${numValue.toFixed(2)}%`;
};

// Get display symbol (remove .NS suffix for display)
export const getDisplaySymbol = (symbol) => {
  if (!symbol) return symbol;
  return symbol.replace(/\.NS$/, '');
};

// Format currency for Indian Rupees
export const formatCurrency = (value) => {
  if (value == null || value === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

// Format large numbers (K, M, B)
export const formatLargeNumber = (value) => {
  if (value == null || value === undefined) return '—';
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return '—';
  
  if (numValue >= 1000000000) {
    return `${(numValue / 1000000000).toFixed(2)}B`;
  } else if (numValue >= 1000000) {
    return `${(numValue / 1000000).toFixed(2)}M`;
  } else if (numValue >= 1000) {
    return `${(numValue / 1000).toFixed(2)}K`;
  }
  return numValue.toLocaleString();
};
