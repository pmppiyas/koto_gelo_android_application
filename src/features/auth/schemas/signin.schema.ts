export const validateSignInForm = (values: { username?: string; password?: string }) => {
  const errors: Record<string, string> = {};
  const username = values.username?.trim().toLowerCase() || '';
  const password = values.password || '';

  if (!username) {
    errors.username = 'Username is required';
  } else if (username.length < 3) {
    errors.username = 'Username must be at least 3 characters long';
  } else if (username.length > 30) {
    errors.username = 'Username cannot exceed 30 characters';
  } else if (!/^[a-z0-9_]+$/.test(username)) {
    errors.username = 'Username can only contain lowercase letters, numbers, and underscore';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters long';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
