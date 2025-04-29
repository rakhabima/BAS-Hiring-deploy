/**
 * Check if a user has one of the allowed roles
 * @param {Object} user - The user object from the request
 * @param {Array} allowedRoles - Array of roles that are allowed
 * @returns {Boolean} - Returns true if user has one of the allowed roles, false otherwise
 */
export const checkUserRole = (user, allowedRoles) => {
  if (!user || !user.role) {
    return false;
  }
  
  return allowedRoles.includes(user.role);
}; 