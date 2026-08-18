import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';
import { shadows } from './shadows';

export const theme = {
  colors,
  spacing,
  typography,
  shadows,
};

export type Theme = typeof theme;
export * from './colors';
export * from './spacing';
export * from './typography';
export * from './shadows';
