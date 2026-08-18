import { isValidEmail } from '../../../utils/validation';

export const validateSignUpForm = (values: {
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
}) => {
  const errors: Record<string, string> = {};
  const username = values.username?.trim().toLowerCase() || '';
  const email = values.email?.trim() || '';
  const phone = values.phone?.trim() || '';
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

  if (email && !isValidEmail(email)) {
    errors.email = 'Invalid email format';
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
