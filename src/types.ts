export interface Employee {
  id: string; // Will use 'cedula' as unique key or allow auto-generated if blank, then sync with 'cedula'
  nombre: string;
  cedula: string;
  cargo: string;
  sedeTrabajo: string;
  dificilAcceso: 'Si' | 'No';
  horasAula: number; // H/A
  horasLibres: number; // H/L
  areaDesempeno: string;
  tipoNombramiento: string;
  activo: boolean; // para inhabilitar empleados
  lugarExpedicionCedula?: string;
  correoElectronico?: string;
  numeroCelular?: string;
  firmaDocente?: string; // base64 string signature
}

export interface DocenteEvaluacion extends Employee {}


export interface Novedad {
  id: string;
  empleadoId: string; // Cedula del Funcionario
  claseNovedad: string;
  sedeNovedad: string; // Sede donde se presentó
  fechaInicio: string; // YYYY-MM-DDTHH:mm
  fechaFin: string; // YYYY-MM-DDTHH:mm
  estaLaborandoNormalmente: 'Si' | 'No';
  seLeAsignoCargaAcademica: 'Si' | 'No';
  documentoSoporteTipo: 'R' | 'D' | 'A' | 'I' | 'P' | 'O' | '';
  documentoSoporteNo: string;
  documentoSoporteFecha: string; // YYYY-MM-DD
  observaciones?: string;
}

export const SEDES_OPCIONES = [
  'COL ALVERNIA',
  'SAN MARTIN',
  'SANTO DOMINGO SAVIO',
  'SAN NICOLAS'
] as const;

export const AREAS_DESEMPENO_OPCIONES = [
  'Preescolar',
  'Primaria',
  'Ciencias Naturales y Edu. Ambiental',
  'Ciencias Sociales',
  'Educ. Artistica - Artes Plasticas',
  'Educ. Artistica - Musica',
  'Educ. Artistica - Artes Escenicas',
  'Educ. Artistica - Danzas',
  'Educ. Fisica, Recreacion y Deporte',
  'Educ. Etica y en Valores',
  'Educ. Religiosa',
  'Humanidades y Lengua Castellana',
  'Idioma Extranjero Frances',
  'Idioma Extranjero Ingles',
  'Matematicas',
  'Tecnologia de Informatica',
  'Ciencias Naturales Quimica',
  'Ciencias Naturales Fisica',
  'Filosofia',
  'Ciencias Economicas y Politica',
  'Emprendimiento',
  'No Aplica',
  'Finanzas - Administración y Seguros',
  'Ventas y Servicios',
  'Ciencias Naturales y Aplicadas',
  'Salud',
  'Ciencias Sociales, Educ, Serv Gubernamentales y Religion.'
] as const;

export const CLASES_NOVEDADES_OPCIONES = [
  'AMENAZADO',
  'No presenta Novedad',
  'Certificación Presentación de Personal a Laborar',
  'Certificación días no laborados sin justa causa',
  'Certificación Retiro del Funcionario',
  'Incapacidad - Enfernedad General',
  'Incapacidad -Accidente de Trabajo o Profesional',
  'Incapacidad -Maternidad',
  'Incapacidad -Paternidad',
  'Sancion',
  'Traslado',
  'Desaparición',
  'Licencia No remunerada',
  'Comisión No Remunerada',
  'Vacaciones',
  'Permiso -Adopción',
  'Permiso -Calamidad Domestica',
  'Permiso -Capacitación',
  'Permiso -Cita Medica',
  'Permiso -Cita Medica Familiar',
  'Permiso -Comision de Estudios',
  'Permiso -Comision de Servicios',
  'Permiso -Diligencias Administrativas',
  'Permiso -Enfermedad Hijos o familiar',
  'Permiso -Evento Deportivo',
  'Permiso -Lactancia',
  'Permiso -Matrimonio',
  'Permiso -Sindical',
  'Permiso -Tratamiento Médico',
  'Permiso -Diligencias Personales',
  'Permiso - Estudios',
  'Permiso - día compensatorio',
  'Encargo otra Institución Educativa',
  'Encargo en la misma Institución Educativa.'
] as const;

export const CARGOS_OPCIONES = [
  '9032 Rector Institucion Educativa Completa D.2277',
  '9033 Rector Institucion Educativa Basica Completa D.227',
  '908 Director Rural',
  '907 Coordinador',
  '902 Director De Nucleo',
  '901 Supervisor',
  '9005 Docente Tutor',
  '9003 Docente con funciones de orientador',
  '9002 Docente con funciones de apoyo',
  '9001 Docente de aula',
  '487 Operario',
  '482 Conductor Mecánico',
  '477 Celador',
  '470 Auxiliar De Servicios Generales',
  '407 Auxiliar Administrativo',
  '314 Técnico Operativo',
  '313 Instructor',
  '222 Profesional Especializado',
  '219 Profesional Universitario'
] as const;

export const DOCUMENTOS_SOPORTE_OPCIONES = [
  { clave: 'R', descripcion: 'R - Resolución' },
  { clave: 'D', descripcion: 'D - Decreto' },
  { clave: 'A', descripcion: 'A - Acta' },
  { clave: 'I', descripcion: 'I - Incapacidad' },
  { clave: 'P', descripcion: 'P - Permiso' },
  { clave: 'O', descripcion: 'O - Oficio' }
] as const;

export const TIPOS_NOMBRAMIENTO_OPCIONES = [
  'Encargo',
  'Propiedad',
  'Provisional Definitivo',
  'Provisional Temporal'
] as const;

export interface AgendaEvento {
  id: string;
  titulo: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string;
  participantes: string;
  lugar_espacio: string;
  estado: string;
  creado_por: string;
  ano: string;
}

export interface ConsecutivoOficio {
  id: string;
  numero_consecutivo: number;
  ano: string;
  categoria?: string; // 'Oficio' | 'Resolución' | 'Circular'
  prefijo?: string;   // 'REC' | 'SEC'
  elaborado_por: string;
  entidad_destino: string;
  tipo_oficio: string;
  asunto: string;
  fecha_creacion?: string;
  // Document generation fields
  es_generado?: boolean;
  cuerpo_documento?: string;
  destinatario_nombre?: string;
  destinatario_cargo?: string;
  destinatario_entidad?: string;
  destinatario_lugar?: string;
  revisado_por?: string;
  despedida?: string;
  firma_nombre?: string;
  firma_cargo?: string;
}

export interface TipoOficio {
  id: string;
  nombre: string;
}

export interface Responsable {
  id: string;
  nombre: string;
}
