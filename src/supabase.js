import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://mhoxkhmjlszkbmgzrvuk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jGHf8XieUYr82YNvydq3Tw_DjC-1c5H';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Maps a row from the `zones` table to the shape the screens expect
export function mapZoneRow(z) {
  return {
    id: z.id,
    cat: z.cat,
    name: z.name,
    dist: '— m',
    rating: parseFloat(z.rating) || 0,
    rev: z.review_count ?? 0,
    address: z.address,
    tags: z.tags || [],
    desc: z.description || '',
    latitude: z.latitude,
    longitude: z.longitude,
    comments: [],
  };
}
