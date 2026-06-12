// ─── Brutalist design tokens ──────────────────────────────────────────────────
export const INK     = '#101A0C';
export const SAND    = '#CEBB9A';
export const FOREST  = '#263D1A';
export const TERRA   = '#C05A34';
export const OAT     = '#EDE6DB';
export const SURFACE = '#EDE5D8';
export const MUTED   = '#6B6454';
export const WHITE   = '#FDFAF3';
export const GREEN   = '#C1E9CC';
export const DIST    = '#A45838';
export const PAW_FULL  = '#59361A';
export const PAW_EMPTY = '#CEBB9A';

// Hard offset shadow used across the app (brutalist style)
export const flat = {
  shadowColor: INK, shadowOffset: { width: 3, height: 3 },
  shadowOpacity: 1, shadowRadius: 0, elevation: 4,
};

export const flatSm = {
  shadowColor: INK, shadowOffset: { width: 2, height: 2 },
  shadowOpacity: 1, shadowRadius: 0, elevation: 3,
};

export const CAT_META = {
  pip: {
    label: 'Pipicán',
    color: FOREST,
    lightBg: '#E4EDD8',
    gradient: ['#2A4A1C', '#3D6B2A'],
  },
  park: {
    label: 'Parque',
    color: '#3D6B2A',
    lightBg: '#E4EDD8',
    gradient: ['#1E4A30', '#2D7048'],
  },
  grass: {
    label: 'Hierba',
    color: '#4A7025',
    lightBg: '#E8EED8',
    gradient: ['#2E4A1A', '#4A7025'],
  },
  cafe: {
    label: 'Cafetería',
    color: TERRA,
    lightBg: '#F5E6DC',
    gradient: ['#6B3520', '#C05A34'],
  },
};
