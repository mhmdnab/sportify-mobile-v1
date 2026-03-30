import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getSportIcon } from '../../utils/sportIcons';

interface SportIconProps {
  sportName: string;
  size: number;
  color: string;
}

export function SportIcon({ sportName, size, color }: SportIconProps) {
  const icon = getSportIcon(sportName);
  if (icon.library === 'material-community') {
    return <MaterialCommunityIcons name={icon.name} size={size} color={color} />;
  }
  return <Ionicons name={icon.name} size={size} color={color} />;
}
