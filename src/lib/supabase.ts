// Archivo simulado (Mock) para eliminar la dependencia de Supabase
// Todos los métodos retornan respuestas vacías o exitosas simuladas
// para no romper la interfaz de usuario en los componentes que aún lo importan.

export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ error: { message: 'Supabase desactivado' } }),
    signOut: async () => ({ error: null })
  },
  from: (table: string) => ({
    select: () => ({ limit: () => ({ data: null, error: null }), eq: () => ({ data: null, error: null }) }),
    upsert: async () => ({ data: null, error: null }),
    delete: () => ({ eq: async () => ({ data: null, error: null }) }),
    insert: async () => ({ data: null, error: null })
  })
};
