import { supabase } from './supabase';

export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('provinces')
      .select('name, enabled')
      .limit(5);

    if (error) throw error;

    console.log('✅ Conexión a Supabase exitosa');
    console.log('Provinces:', data);

    return { success: true, data };
  } catch (error) {
    console.error('❌ Error conectando a Supabase:', error.message);
    return { success: false, error: error.message };
  }
}
