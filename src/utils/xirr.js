// XIRR calculation utility for React Native

// Newton-Raphson method for finding XIRR
const newtonRaphson = (func, derivative, x0, tolerance = 1e-6, maxIterations = 100) => {
  let x = x0;
  for (let i = 0; i < maxIterations; i++) {
    const fx = func(x);
    if (Math.abs(fx) < tolerance) {
      return x;
    }
    const fpx = derivative(x);
    if (Math.abs(fpx) < 1e-10) {
      throw new Error('Derivative is zero, cannot continue');
    }
    x = x - fx / fpx;
  }
  throw new Error('Maximum iterations exceeded');
};

// Calculate XIRR
export const xirr = (cashflows) => {
  if (!cashflows || cashflows.length < 2) {
    throw new Error('At least 2 cashflows are required');
  }

  // Sort cashflows by date
  const sortedCashflows = [...cashflows].sort((a, b) => a.date - b.date);
  
  // Check if we have both positive and negative cashflows
  const hasPositive = sortedCashflows.some(cf => cf.amount > 0);
  const hasNegative = sortedCashflows.some(cf => cf.amount < 0);
  
  if (!hasPositive || !hasNegative) {
    throw new Error('XIRR requires both positive and negative cashflows');
  }

  // Get the first date as reference
  const firstDate = sortedCashflows[0].date;
  
  // Define the NPV function
  const npv = (rate) => {
    return sortedCashflows.reduce((sum, cf) => {
      const daysDiff = (cf.date - firstDate) / (1000 * 60 * 60 * 24);
      const years = daysDiff / 365;
      return sum + cf.amount / Math.pow(1 + rate, years);
    }, 0);
  };

  // Define the derivative of NPV function
  const npvDerivative = (rate) => {
    return sortedCashflows.reduce((sum, cf) => {
      const daysDiff = (cf.date - firstDate) / (1000 * 60 * 60 * 24);
      const years = daysDiff / 365;
      return sum - (cf.amount * years) / Math.pow(1 + rate, years + 1);
    }, 0);
  };

  try {
    // Start with a reasonable guess
    const initialGuess = 0.1; // 10%
    const xirrRate = newtonRaphson(npv, npvDerivative, initialGuess);
    
    // Return null if XIRR is negative or very high (likely invalid)
    if (xirrRate < -0.99 || xirrRate > 10) {
      return null;
    }
    
    return xirrRate;
  } catch (error) {
    console.warn('XIRR calculation failed:', error);
    return null;
  }
};

// Format rate as percentage
export const formatRate = (rate) => {
  if (rate == null || isNaN(rate)) return '—';
  return `${(rate * 100).toFixed(2)}%`;
};

// Calculate simple return
export const calculateSimpleReturn = (initialValue, finalValue) => {
  if (!initialValue || initialValue === 0) return 0;
  return ((finalValue - initialValue) / initialValue) * 100;
};

// Calculate CAGR
export const calculateCAGR = (initialValue, finalValue, years) => {
  if (!initialValue || initialValue <= 0 || !years || years <= 0) return 0;
  return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
};
