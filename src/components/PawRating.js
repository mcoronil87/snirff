import React from 'react';
import { View } from 'react-native';
import { PAW_FULL, PAW_EMPTY } from '../theme';
import { PawIcon } from './Icons';

// 3-paw proportional rating (rating is on a 0–5 scale)
export default function PawRating({ rating, size = 10 }) {
  const NUM = 3;
  const filled = ((rating || 0) / 5) * NUM;
  const full = Math.floor(filled);
  const frac = filled - full;
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: NUM }).map((_, i) => {
        if (i < full) return <PawIcon key={i} size={size} color={PAW_FULL} />;
        if (i === full && frac > 0.05) {
          return (
            <View key={i} style={{ width: size, height: size }}>
              <PawIcon size={size} color={PAW_EMPTY} />
              <View style={{ position: 'absolute', top: 0, left: 0, width: size * frac, height: size, overflow: 'hidden' }}>
                <PawIcon size={size} color={PAW_FULL} />
              </View>
            </View>
          );
        }
        return <PawIcon key={i} size={size} color={PAW_EMPTY} />;
      })}
    </View>
  );
}
