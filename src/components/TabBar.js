import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { INK, FOREST, MUTED, TERRA, WHITE, OAT } from '../theme';
import { MapTabIcon, CompassIcon, PlusIcon, HeartTabIcon, UserIcon } from './Icons';

const TABS = [
  { id: 'Map',     label: 'Mapa',      Icon: MapTabIcon },
  { id: 'Explore', label: 'Explorar',  Icon: CompassIcon },
  { id: 'add',     label: null, fab: true },
  { id: 'Saved',   label: 'Guardados', Icon: HeartTabIcon },
  { id: 'Profile', label: 'Perfil',    Icon: UserIcon },
];

export default function TabBar({ state, navigation, onAdd }) {
  const insets = useSafeAreaInsets();
  // Determine active route name
  const activeRoute = state ? state.routes[state.index]?.name : null;

  return (
    <View style={[s.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((item, i) => {
        if (item.fab) {
          return (
            <TouchableOpacity key={i} onPress={onAdd} activeOpacity={0.85} style={s.fab}>
              <PlusIcon size={21} color={WHITE} />
            </TouchableOpacity>
          );
        }
        const Icon = item.Icon;
        const on = activeRoute === item.id;
        return (
          <TouchableOpacity
            key={i}
            style={s.tab}
            activeOpacity={0.7}
            onPress={() => navigation && navigation.navigate(item.id)}
          >
            <Icon size={23} color={on ? FOREST : MUTED} />
            <Text style={[s.label, { color: on ? FOREST : MUTED, fontWeight: on ? '700' : '400' }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 2,
    borderTopColor: INK,
    paddingTop: 9,
    backgroundColor: OAT,
  },
  tab: {
    alignItems: 'center',
    gap: 3,
    minWidth: 44,
  },
  label: {
    fontSize: 9.5,
    letterSpacing: -0.1,
  },
  fab: {
    width: 50,
    height: 50,
    backgroundColor: TERRA,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    borderWidth: 2,
    borderColor: INK,
    shadowColor: INK,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
});
