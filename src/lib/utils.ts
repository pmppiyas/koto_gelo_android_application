import { tw } from '../styles/tw';
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

type StyleObject = ViewStyle & TextStyle & ImageStyle;
export type ClassValue = string | number | boolean | undefined | null | StyleObject | { [key: string]: boolean | undefined | null };

export function cn(...inputs: (ClassValue | ClassValue[])[]): StyleObject {
  const classes: string[] = [];
  const rawStyles: StyleObject[] = [];

  const process = (items: (ClassValue | ClassValue[])[]) => {
    for (const item of items) {
      if (!item) continue;
      if (Array.isArray(item)) {
        process(item);
      } else if (typeof item === 'string') {
        classes.push(item);
      } else if (typeof item === 'object') {
        const entries = Object.entries(item);
        const isClassMap =
          entries.length > 0 &&
          entries.every(([_, val]) => typeof val === 'boolean');

        if (isClassMap) {
          for (const [key, val] of entries) {
            if (val) classes.push(key);
          }
        } else {
          rawStyles.push(item as StyleObject);
        }
      }
    }
  };

  process(inputs);
  const parsed = tw(classes.join(' '));
  return Object.assign({}, parsed, ...rawStyles);
}
