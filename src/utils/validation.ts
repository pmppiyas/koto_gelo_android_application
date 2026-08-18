export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const isValidUsername = (username: string): boolean => {
  return username.trim().length >= 3;
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};
