import { isNonEmptyString } from '../../../utils/validation';

export const validateCreateGroup = (values: { name?: string }) => {
  const errors: Record<string, string> = {};

  if (!values.name || !isNonEmptyString(values.name)) {
    errors.name = 'Group name is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
