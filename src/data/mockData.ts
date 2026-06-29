import { Employee, Novedad } from '../types';

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: '87246722',
    nombre: 'CARLOS ARSECIO ACOSTA CORONEL',
    cedula: '87246722',
    cargo: '9032 Rector Institucion Educativa Completa D.2277',
    sedeTrabajo: 'COL ALVERNIA',
    dificilAcceso: 'No',
    horasAula: 40,
    horasLibres: 144,
    areaDesempeno: 'No Aplica',
    tipoNombramiento: 'Propiedad',
    activo: true
  },
  {
    id: '12984577',
    nombre: 'MARÍA CONSTANZA GÓMEZ BENAVIDES',
    cedula: '12984577',
    cargo: '9001 Docente de aula',
    sedeTrabajo: 'SAN MARTIN',
    dificilAcceso: 'No',
    horasAula: 22,
    horasLibres: 8,
    areaDesempeno: 'Preescolar',
    tipoNombramiento: 'Propiedad',
    activo: true
  },
  {
    id: '98455612',
    nombre: 'JORGE ELIÉCER TRUJILLO PAREDES',
    cedula: '98455612',
    cargo: '9001 Docente de aula',
    sedeTrabajo: 'COL ALVERNIA',
    dificilAcceso: 'Si',
    horasAula: 24,
    horasLibres: 6,
    areaDesempeno: 'Matematicas',
    tipoNombramiento: 'Provisional Definitivo',
    activo: true
  },
  {
    id: '52784511',
    nombre: 'DIANA PATRICIA MARTÍNEZ ROJAS',
    cedula: '52784511',
    cargo: '9003 Docente con funciones de orientador',
    sedeTrabajo: 'SANTO DOMINGO SAVIO',
    dificilAcceso: 'No',
    horasAula: 0,
    horasLibres: 36,
    areaDesempeno: 'Ciencias Sociales, Educ, Serv Gubernamentales y Religion.',
    tipoNombramiento: 'Propiedad',
    activo: true
  },
  {
    id: '31455981',
    nombre: 'ALBERTO ENRIQUE ORTIZ LUNA',
    cedula: '31455981',
    cargo: '477 Celador',
    sedeTrabajo: 'SAN NICOLAS',
    dificilAcceso: 'Si',
    horasAula: 0,
    horasLibres: 48,
    areaDesempeno: 'No Aplica',
    tipoNombramiento: 'Propiedad',
    activo: true
  },
  {
    id: '1085234911',
    nombre: 'ANGELA YAQUELINE PINTO CHAVES',
    cedula: '1085234911',
    cargo: '470 Auxiliar De Servicios Generales',
    sedeTrabajo: 'COL ALVERNIA',
    dificilAcceso: 'No',
    horasAula: 0,
    horasLibres: 44,
    areaDesempeno: 'No Aplica',
    tipoNombramiento: 'Provisional Temporal',
    activo: true
  },
  {
    id: '12093482',
    nombre: 'REMEDIOS AUXILIADORA MORALES',
    cedula: '12093482',
    cargo: '407 Auxiliar Administrativo',
    sedeTrabajo: 'SAN NICOLAS',
    dificilAcceso: 'No',
    horasAula: 0,
    horasLibres: 44,
    areaDesempeno: 'No Aplica',
    tipoNombramiento: 'Propiedad',
    activo: false // Inactivo
  }
];

export const INITIAL_NOVEDADES: Novedad[] = [];
