// client/src/utils/errorCodes.js
/**
 * Error Code Definitions and User-Friendly Messages
 * Centralizes error handling for consistent UX across the application
 */

/**
 * Error categories for research classification
 */
export const ErrorCategory = {
  USABILITY: 'USABILITY',  // User-facing errors (e.g., user cancelled, wrong password)
  SYSTEM: 'SYSTEM'          // Technical errors (e.g., network failure, server error)
};

/**
 * Complete error code definitions with user-friendly messages
 */
export const ErrorCodes = {
  // ===== Traditional Authentication Errors =====
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    category: ErrorCategory.USABILITY,
    title: 'Login Failed',
    message: 'The username or password you entered is incorrect. Please try again.',
    suggestion: 'Double-check your username and password, and make sure Caps Lock is off.',
    icon: '🔒',
    severity: 'error'
  },
  
  WEAK_PASSWORD: {
    code: 'WEAK_PASSWORD',
    category: ErrorCategory.USABILITY,
    title: 'Weak Password',
    message: 'Your password does not meet security requirements.',
    suggestion: 'Use at least 8 characters with letters and numbers.',
    icon: '⚠️',
    severity: 'warning'
  },
  
  USERNAME_EXISTS: {
    code: 'USERNAME_EXISTS',
    category: ErrorCategory.USABILITY,
    title: 'Username Taken',
    message: 'This username is already registered.',
    suggestion: 'Please choose a different username.',
    icon: '👤',
    severity: 'error'
  },
  
  MISSING_CREDENTIALS: {
    code: 'MISSING_CREDENTIALS',
    category: ErrorCategory.USABILITY,
    title: 'Incomplete Form',
    message: 'Please enter both username and password.',
    suggestion: 'All fields are required to log in.',
    icon: '📝',
    severity: 'warning'
  },

  // ===== DID/Wallet Authentication Errors =====
  ERR_NO_WALLET: {
    code: 'ERR_NO_WALLET',
    category: ErrorCategory.SYSTEM,
    title: 'Wallet Not Found',
    message: 'MetaMask wallet extension is not installed in your browser.',
    suggestion: 'Install MetaMask from metamask.io to use wallet authentication.',
    icon: '🦊',
    severity: 'error',
    actionLink: 'https://metamask.io/download/'
  },
  
  USER_REJECTED_CONNECTION: {
    code: 'USER_REJECTED_CONNECTION',
    category: ErrorCategory.USABILITY,
    title: 'Connection Declined',
    message: 'You cancelled the wallet connection request.',
    suggestion: 'Click "Connect Wallet" again to retry.',
    icon: '🚫',
    severity: 'info'
  },
  
  USER_REJECTED_SIGNATURE: {
    code: 'USER_REJECTED_SIGNATURE',
    category: ErrorCategory.USABILITY,
    title: 'Signature Cancelled',
    message: 'You cancelled the signature request in MetaMask.',
    suggestion: 'Click "Sign & Login" to try again. The signature is safe and cannot access your funds.',
    icon: '✍️',
    severity: 'info'
  },
  
  SIGNATURE_MISMATCH: {
    code: 'SIGNATURE_MISMATCH',
    category: ErrorCategory.USABILITY,
    title: 'Signature Verification Failed',
    message: 'The signature could not be verified.',
    suggestion: 'Make sure you\'re using the correct wallet account.',
    icon: '❌',
    severity: 'error'
  },
  
  NONCE_NOT_FOUND: {
    code: 'NONCE_NOT_FOUND',
    category: ErrorCategory.SYSTEM,
    title: 'Authentication Challenge Missing',
    message: 'The authentication challenge was not found.',
    suggestion: 'Please start the login process again from the beginning.',
    icon: '🔄',
    severity: 'error'
  },
  
  NONCE_EXPIRED: {
    code: 'NONCE_EXPIRED',
    category: ErrorCategory.SYSTEM,
    title: 'Challenge Expired',
    message: 'Your authentication challenge has expired.',
    suggestion: 'Challenges expire after 5 minutes. Please try logging in again.',
    icon: '⏰',
    severity: 'warning'
  },
  
  INVALID_SIGNATURE_FORMAT: {
    code: 'INVALID_SIGNATURE_FORMAT',
    category: ErrorCategory.SYSTEM,
    title: 'Invalid Signature',
    message: 'The signature format is invalid.',
    suggestion: 'Please try signing the message again.',
    icon: '⚠️',
    severity: 'error'
  },

  // ===== Network & System Errors =====
  ERR_NETWORK: {
    code: 'ERR_NETWORK',
    category: ErrorCategory.SYSTEM,
    title: 'Network Error',
    message: 'Cannot connect to the server.',
    suggestion: 'Check your internet connection and try again.',
    icon: '📡',
    severity: 'error'
  },
  
  NETWORK_TIMEOUT: {
    code: 'NETWORK_TIMEOUT',
    category: ErrorCategory.SYSTEM,
    title: 'Request Timeout',
    message: 'The server took too long to respond.',
    suggestion: 'Please try again. If the problem persists, contact support.',
    icon: '⏱️',
    severity: 'error'
  },
  
  INTERNAL_SERVER_ERROR: {
    code: 'INTERNAL_SERVER_ERROR',
    category: ErrorCategory.SYSTEM,
    title: 'Server Error',
    message: 'An unexpected error occurred on the server.',
    suggestion: 'Please try again later. If the problem persists, contact support.',
    icon: '🔧',
    severity: 'error'
  },
  
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    category: ErrorCategory.SYSTEM,
    title: 'Database Error',
    message: 'A database error occurred.',
    suggestion: 'Please try again or contact support if the issue continues.',
    icon: '💾',
    severity: 'error'
  },

  // ===== Session & Token Errors =====
  TOKEN_EXPIRED: {
    code: 'TOKEN_EXPIRED',
    category: ErrorCategory.SYSTEM,
    title: 'Session Expired',
    message: 'Your session has expired.',
    suggestion: 'Please log in again.',
    icon: '🔐',
    severity: 'warning'
  },
  
  INVALID_TOKEN: {
    code: 'INVALID_TOKEN',
    category: ErrorCategory.SYSTEM,
    title: 'Invalid Session',
    message: 'Your session is invalid.',
    suggestion: 'Please log in again.',
    icon: '🔑',
    severity: 'error'
  },
  
  NO_TOKEN: {
    code: 'NO_TOKEN',
    category: ErrorCategory.SYSTEM,
    title: 'Not Authenticated',
    message: 'You must be logged in to access this page.',
    suggestion: 'Please log in to continue.',
    icon: '🚪',
    severity: 'info'
  },

  // ===== Rate Limiting =====
  TOO_MANY_ATTEMPTS: {
    code: 'TOO_MANY_ATTEMPTS',
    category: ErrorCategory.USABILITY,
    title: 'Too Many Attempts',
    message: 'You have made too many login attempts.',
    suggestion: 'Please wait 5 minutes before trying again.',
    icon: '⏸️',
    severity: 'error'
  },

  // ===== Unknown Errors =====
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    category: ErrorCategory.SYSTEM,
    title: 'Unexpected Error',
    message: 'An unexpected error occurred.',
    suggestion: 'Please try again or contact support.',
    icon: '❓',
    severity: 'error'
  }
};

/**
 * Get error details by error code
 * @param {string} errorCode - Error code from backend
 * @returns {Object} Error details object
 */
export const getErrorDetails = (errorCode) => {
  return ErrorCodes[errorCode] || ErrorCodes.UNKNOWN_ERROR;
};

/**
 * Format error for display in UI
 * @param {string|Object} error - Error code string or error object
 * @returns {Object} Formatted error for UI rendering
 */
export const formatErrorForDisplay = (error) => {
  let errorCode;
  let additionalDetails = null;

  // Handle different error formats
  if (typeof error === 'string') {
    errorCode = error;
  } else if (error?.code) {
    errorCode = error.code;
  } else if (error?.response?.data?.error) {
    errorCode = error.response.data.error;
    additionalDetails = error.response.data.details;
  } else {
    errorCode = 'UNKNOWN_ERROR';
  }

  const errorDetails = getErrorDetails(errorCode);

  return {
    ...errorDetails,
    timestamp: new Date().toISOString(),
    additionalDetails
  };
};

/**
 * Check if error is user-recoverable (user can retry)
 * @param {string} errorCode - Error code
 * @returns {boolean} True if user can retry
 */
export const isRecoverableError = (errorCode) => {
  const nonRecoverableErrors = [
    'ERR_NO_WALLET',
    'USERNAME_EXISTS',
    'TOKEN_EXPIRED',
    'INVALID_TOKEN'
  ];
  
  return !nonRecoverableErrors.includes(errorCode);
};

/**
 * Get severity color for error display
 * @param {string} severity - Error severity
 * @returns {string} Tailwind color class
 */
export const getSeverityColor = (severity) => {
  const colors = {
    error: 'red',
    warning: 'yellow',
    info: 'blue',
    success: 'green'
  };
  
  return colors[severity] || 'gray';
};

/**
 * Log error for telemetry/debugging
 * @param {Object} error - Error object
 * @param {string} context - Where the error occurred
 */
export const logError = (error, context = 'unknown') => {
  const formattedError = formatErrorForDisplay(error);
  
  console.error(`[${context}] Error:`, {
    code: formattedError.code,
    category: formattedError.category,
    message: formattedError.message,
    timestamp: formattedError.timestamp,
    details: formattedError.additionalDetails
  });
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error);
  }
};

/**
 * Create user-friendly error message for specific scenarios
 * @param {string} errorCode - Error code
 * @param {Object} context - Additional context
 * @returns {string} Contextualized error message
 */
export const getContextualErrorMessage = (errorCode, context = {}) => {
  const error = getErrorDetails(errorCode);
  
  // Customize message based on context
  if (errorCode === 'USER_REJECTED_SIGNATURE' && context.attempt > 1) {
    return 'You cancelled the signature again. The signature is safe and only proves wallet ownership.';
  }
  
  if (errorCode === 'INVALID_CREDENTIALS' && context.attempt > 3) {
    return 'Multiple failed login attempts. Please verify your credentials or reset your password.';
  }
  
  return error.message;
};

/**
 * Error severity levels for UI styling
 */
export const ErrorSeverity = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success'
};

/**
 * Helper to check if error is network-related
 * @param {string} errorCode - Error code
 * @returns {boolean} True if network error
 */
export const isNetworkError = (errorCode) => {
  const networkErrors = [
    'ERR_NETWORK',
    'NETWORK_TIMEOUT',
    'CONNECTION_REFUSED'
  ];
  
  return networkErrors.includes(errorCode);
};

/**
 * Helper to check if error is authentication-related
 * @param {string} errorCode - Error code
 * @returns {boolean} True if auth error
 */
export const isAuthError = (errorCode) => {
  const authErrors = [
    'INVALID_CREDENTIALS',
    'TOKEN_EXPIRED',
    'INVALID_TOKEN',
    'NO_TOKEN',
    'SIGNATURE_MISMATCH',
    'NONCE_EXPIRED'
  ];
  
  return authErrors.includes(errorCode);
};

/**
 * Get recommended action for error
 * @param {string} errorCode - Error code
 * @returns {Object} Recommended action
 */
export const getRecommendedAction = (errorCode) => {
  const actions = {
    ERR_NO_WALLET: {
      label: 'Install MetaMask',
      action: 'external_link',
      url: 'https://metamask.io/download/'
    },
    USER_REJECTED_CONNECTION: {
      label: 'Try Again',
      action: 'retry_connection'
    },
    USER_REJECTED_SIGNATURE: {
      label: 'Sign Message',
      action: 'retry_signature'
    },
    INVALID_CREDENTIALS: {
      label: 'Retry Login',
      action: 'clear_form'
    },
    TOKEN_EXPIRED: {
      label: 'Log In',
      action: 'redirect_login'
    },
    ERR_NETWORK: {
      label: 'Retry',
      action: 'retry_request'
    }
  };
  
  return actions[errorCode] || {
    label: 'Try Again',
    action: 'retry'
  };
};

export default {
  ErrorCodes,
  ErrorCategory,
  ErrorSeverity,
  getErrorDetails,
  formatErrorForDisplay,
  isRecoverableError,
  getSeverityColor,
  logError,
  getContextualErrorMessage,
  isNetworkError,
  isAuthError,
  getRecommendedAction
};
