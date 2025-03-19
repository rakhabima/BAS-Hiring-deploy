/**
 * Formats a date object or date string into a localized string
 * @param {Date|string} date - The date to format
 * @param {Object} options - Formatting options
 * @param {string} options.locale - The locale to use (default: 'id-ID')
 * @param {boolean} options.includeTime - Whether to include the time (default: false)
 * @returns {string} The formatted date string
 */
export const formatDate = (date, options = {}) => {
  const {
    locale = 'id-ID',
    includeTime = false
  } = options;

  if (!date) return 'N/A';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    const dateOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    return dateObj.toLocaleDateString(locale, dateOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Error';
  }
};

/**
 * Formats a relative time (e.g., "2 days ago", "just now")
 * @param {Date|string} date - The date to format
 * @returns {string} The formatted relative time
 */
export const formatRelativeTime = (date) => {
  if (!date) return 'N/A';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Baru saja';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} menit yang lalu`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} jam yang lalu`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} hari yang lalu`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} bulan yang lalu`;
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} tahun yang lalu`;
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Error';
  }
}; 