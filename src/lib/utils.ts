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
        if ('flex' in item || 'padding' in item || 'margin' in item || 'backgroundColor' in item || 'color' in item || 'width' in item || 'height' in item) {
          rawStyles.push(item as StyleObject);
        } else {
          for (const [key, val] of Object.entries(item)) {
            if (val) classes.push(key);
          }
        }
      }
    }
  };

  process(inputs);
  const parsed = tw(classes.join(' '));
  return Object.assign({}, parsed, ...rawStyles);
}
