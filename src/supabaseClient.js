import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hxeoxripczmckfevmtuw.supabase.co';
const supabaseKey = 'sb_publishable_kYjkd39nC3K4I3io-80RZQ_1Yo0WSn2';

export const supabase = createClient(supabaseUrl, supabaseKey);
