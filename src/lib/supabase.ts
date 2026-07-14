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
    select: (...args: any[]) => ({ 
      limit: (...args: any[]) => ({ data: null, error: null }), 
      eq: (...args: any[]) => ({ data: null, error: null }),
      neq: (...args: any[]) => ({ data: null, error: null }),
      in: (...args: any[]) => ({ data: null, error: null }),
      order: (...args: any[]) => ({ data: null, error: null }),
      data: null as any,
      error: null as any
    }),
    upsert: async (...args: any[]) => ({ data: null, error: null }),
    delete: (...args: any[]) => ({ 
      eq: async (...args: any[]) => ({ data: null, error: null }),
      neq: async (...args: any[]) => ({ data: null, error: null }),
      in: async (...args: any[]) => ({ data: null, error: null })
    }),
    insert: async (...args: any[]) => ({ data: null, error: null }),
    update: async (...args: any[]) => ({
      eq: async (...args: any[]) => ({ data: null, error: null }),
      neq: async (...args: any[]) => ({ data: null, error: null })
    })
  })
};
