import React from 'react';
import { Badge } from '../../../components/ui/Badge';

export interface GroupTypeBadgeProps {
  type: 'TRIP' | 'HOME' | 'COUPLE' | 'OTHER';
}

export const GroupTypeBadge: React.FC<GroupTypeBadgeProps> = ({ type }) => {
  const map: Record<string, { label: string; variant: any }> = {
    TRIP: { label: 'Trip', variant: 'primary' },
    HOME: { label: 'Home', variant: 'secondary' },
    COUPLE: { label: 'Couple', variant: 'warning' },
    OTHER: { label: 'Other', variant: 'default' },
  };

  const item = map[type] || map.OTHER;

  return <Badge label={item.label} variant={item.variant} />;
};
