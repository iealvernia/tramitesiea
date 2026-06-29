import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { 
  Award, 
  User, 
  FileText, 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  LogOut, 
  FileCheck, 
  ChevronRight, 
  Search, 
  Eye, 
  Edit2, 
  Save, 
  School,
  FileSignature,
  Paperclip,
  Check,
  ClipboardList,
  RefreshCw,
  Lock,
  FileSpreadsheet,
  FileUp,
  FolderArchive,
  Settings,
  Calendar,
  X,
  Cloud,
  UserCog,
  Info,
  Archive,
  RefreshCcw
} from 'lucide-react';
import { uploadFileToR2 } from '../lib/r2';
import { DocenteEvaluacion } from '../types';
import { supabase } from '../lib/supabase';
import { generarActaGeneralWord } from '../utils/actaGeneralGenerator';

// Define structures for Decree 1278 Evaluation
export interface EvidenciaFila {
  id: string;
  folio: string;
  fecha: string;
  tipo: 'D' | 'T'; // Documental | Testimonial
  nombre: string;
  competenciasSoportadas: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileBase64?: string; // base64 string for file persistence
}

export interface CronogramaRow {
  etapa: string;
  fecha: string;
  actividad: string;
  producto: string;
  responsable: string;
}

interface ActaGeneralData {
  id: string;
  numero: string;
  anio: string;
  fecha: string;
  lugar: string;
  hora: string;
  objetivo: string;
  ordenDia: string;
  desarrollo: string;
  cuadroInfo: string;
  cronograma: CronogramaRow[];
}

export interface DocenteObservacion {
  docenteId: string;
  nombre: string;
  cedula: string;
  observacion: string;
}

interface ActaSeguimientoData {
  id: string;
  numero: string;
  anio: string;
  fecha: string;
  lugar: string;
  hora: string;
  objetivo: string;
  ordenDia: string;
  desarrollo: string;
  cuadroInfo: string;
  docentesObservaciones: DocenteObservacion[];
}

export interface CompromisoFuncional {
  competencia: string;
  area: 'Académica' | 'Administrativa' | 'Comunitaria';
  contribucion: string; // Verbo + Objeto + Condición de calidad
  criterios: string;
  evidencias: string;
  porcentaje?: number;
}

export interface CompromisoComportamental {
  competencia: string;
  evidencias: string;
}

export interface Evaluacion1278 {
  id: string; // cedula__anio__periodo
  cedula: string;
  anio: number;
  periodo: 1 | 2 | 3; // Seguimiento 1, 2, 3
  evaluadorNombre: string;
  evaluadorCedula: string;
  fechaConcertacion: string;
  horaConcertacion?: string;
  lugarConcertacion: string;
  compromisosFuncionales: CompromisoFuncional[];
  compromisosComportamentales: CompromisoComportamental[];
  evidenciasAnexo2: EvidenciaFila[];
  evidenciasAnexo5: EvidenciaFila[];
  estado: 'Borrador' | 'Enviado' | 'Aprobado' | 'Corregir';
  observacionesAdmin?: string;
  updatedAt: string;
  portfolioPdfUrl?: string;
  portfolioPdfName?: string;
}

interface EvaluacionDocentePanelProps {
  docentesEvaluacion: DocenteEvaluacion[];
  setDocentesEvaluacion: React.Dispatch<React.SetStateAction<DocenteEvaluacion[]>>;
  showToast: (msg: string) => void;
  currentTeacher: DocenteEvaluacion | null;
  setCurrentTeacher: React.Dispatch<React.SetStateAction<DocenteEvaluacion | null>>;
  onTeacherMessagesChange?: (status: 'none' | 'red' | 'green') => void;
  triggerOpenMessages?: number;
}

// 7 Behavior competencies
const COMPORTAMENTALES_OPCIONES = [
  'Liderazgo',
  'Relaciones interpersonales y comunicación',
  'Trabajo en equipo',
  'Negociación y mediación',
  'Compromiso social e institucional',
  'Iniciativa',
  'Orientación al logro'
];

// Default suggestions to help teachers fill forms easily
const SUGGESTED_FUNCTIONALS: { competencia: string; area: 'Académica' | 'Administrativa' | 'Comunitaria'; contribucion: string; criterios: string; evidencias: string; porcentaje?: number; }[] = [
  {
    competencia: 'Dominio curricular',
    area: 'Académica',
    contribucion: 'Diseñar y actualizar el plan de estudios del área de enseñanza, incorporando los estándares básicos de competencias y lineamientos del MEN.',
    criterios: 'El plan de estudios está alineado al PEI de la institución y cumple con las normas técnicas curriculares establecidas por el MEN.',
    evidencias: 'Plan de estudios actualizado, mallas curriculares anuales.',
    porcentaje: 12.5
  },
  {
    competencia: 'Planeación y organización',
    area: 'Académica',
    contribucion: 'Elaborar el planizador y parcelador diario de clases especificando objetivos, metodologías activas y optimizando el tiempo escolar.',
    criterios: 'Las clases se desarrollan con base en la programación sistemática previa, optimizando el tiempo diario.',
    evidencias: 'Diario de campo, planificador de clases periódicos.',
    porcentaje: 12.5
  },
  {
    competencia: 'Pedagógica y didáctica',
    area: 'Académica',
    contribucion: 'Implementar metodologías de enseñanza activas adaptadas a los diferentes ritmos y estilos de aprendizaje de los estudiantes.',
    criterios: 'Aplica variedad de estrategias de enseñanza y recursos didácticos para motivar y potenciar el aprendizaje significativo.',
    evidencias: 'Guías de trabajo didácticas, fotos de proyectos académicos.',
    porcentaje: 12.5
  },
  {
    competencia: 'Evaluación del aprendizaje',
    area: 'Académica',
    contribucion: 'Diseñar e implementar rúbricas e instrumentos de evaluación formativa que valoren el desarrollo de competencias según el SIEE.',
    criterios: 'Evalúa de manera continua and formativa, retroalimentando y aplicando planes de apoyo para estudiantes con dificultades.',
    evidencias: 'Rúbricas de evaluación, actas de planes de recuperación.',
    porcentaje: 12.5
  },
  {
    competencia: 'Uso de recursos',
    area: 'Administrativa',
    contribucion: 'Optimizar el uso de recursos pedagógicos, tecnológicos y laboratorios provistos por el colegio, fomentando el cuidado en los estudiantes.',
    criterios: 'Usa responsablemente y reporta con oportunidad el estado de los equipos e instalaciones asignadas.',
    evidencias: 'Inventario de aula, registro de uso de sala de informática.',
    porcentaje: 5.0
  },
  {
    competencia: 'Seguimiento de procesos',
    area: 'Administrativa',
    contribucion: 'Cumplir oportunamente con la jornada laboral, asistencia a reuniones generales, entrega de boletines y registros académicos en los tiempos establecidos.',
    criterios: 'Muestra rigurosidad administrativa en el reporte de notas, asiste puntualmente y aporta activamente en consejos y comités.',
    evidencias: 'Planilla de notas al día, actas de participación en comités.',
    porcentaje: 5.0
  },
  {
    competencia: 'Comunicación institucional',
    area: 'Comunitaria',
    contribucion: 'Mantener una comunicación asertiva, respetuosa y oportuna con directivos, coordinadores, colegas y padres de familia para la resolución pacífica de diferencias.',
    criterios: 'Se comunica de forma clara mediante canales oficiales y mantiene relaciones cordiales basadas en la confianza.',
    evidencias: 'Registro de atención a padres, participación en asambleas.',
    porcentaje: 5.0
  },
  {
    competencia: 'Comunidad y entorno',
    area: 'Comunitaria',
    contribucion: 'Diseñar proyectos transversales o pedagógicos que articulen la comunidad familiar y el contexto socio-cultural de los estudiantes.',
    criterios: 'Involucra positivamente a las familias en los procesos formativos y de desarrollo escolar.',
    evidencias: 'Proyecto transversal, actas de escuela de padres.',
    porcentaje: 5.0
  }
];

export const OFFICIAL_EVALUATION_CRITERIA: Record<string, string[]> = {
  'Dominio curricular': [
    'Demuestra conocimientos actualizados y dominio de su disciplina y de las áreas a cargo.',
    'Aplica conocimientos, métodos y herramientas propios de su disciplina en los procesos académicos que dirige.',
    'Conoce e implementa los estándares básicos de competencia, los lineamientos y las orientaciones curriculares, para las áreas y grados asignados.',
    'Conoce el currículo y establece conexiones que articulan su área y grado con otras áreas y grados.',
    'Propone y sustenta ante el comité académico actualizaciones para su plan de estudios y el currículo.'
  ],
  'Dominio de contenidos': [
    'Demuestra conocimientos actualizados y dominio de su disciplina y de las áreas a cargo.',
    'Aplica conocimientos, métodos y herramientas propios de su disciplina en los procesos académicos que dirige.',
    'Conoce e implementa los estándares básicos de competencia, los lineamientos y las orientaciones curriculares, para las áreas y grados asignados.',
    'Conoce el currículo y establece conexiones que articulan su área y grado con otras áreas y grados.',
    'Propone y sustenta ante el comité académico actualizaciones para su plan de estudios y el currículo.'
  ],
  'Planeación y organización': [
    'Presenta un plan organizado con estrategias, acciones y recursos para el año académico.',
    'Lleva una programación sistemática y optimiza el tiempo diario de sus clases.',
    'Establece y socializa en clase reglas, normas y rutinas consistentes de convivencia en el aula, y consecuencias del comportamiento de los estudiantes.',
    'Tiene dominio de grupo y mantiene la disciplina en el aula sin acudir al maltrato físico o psicológico.',
    'Mantiene un ambiente organizado de trabajo.'
  ],
  'Planeación y organización académica': [
    'Presenta un plan organizado con estrategias, acciones y recursos para el año académico.',
    'Lleva una programación sistemática y optimiza el tiempo diario de sus clases.',
    'Establece y socializa en clase reglas, normas y rutinas consistentes de convivencia en el aula, y consecuencias del comportamiento de los estudiantes.',
    'Tiene dominio de grupo y mantiene la disciplina en el aula sin acudir al maltrato físico o psicológico.',
    'Mantiene un ambiente organizado de trabajo.'
  ],
  'Pedagógica y didáctica': [
    'Utiliza variadas estrategias de enseñanza y las ajusta según las características, las necesidades y los ritmos de aprendizaje de los estudiantes.',
    'Usa diferentes escenarios y ambientes para potenciar los procesos de enseñanza – aprendizaje y para motivar a los estudiantes.',
    'Fundamenta teóricamente sus prácticas pedagógicas, actúa basado en el conocimiento y relaciona la teoría con la vida cotidiana.',
    'Expresa expectativas positivas de sus estudiantes para fomentar la autoconfianza, la motivación para alcanzar logros elevados y la iniciativa para el desarrollo de proyectos.',
    'Aporta a la definición del currículo, intercambia sus experiencias pedagógicas con el grupo docente y produce nuevos materiales para la enseñanza.',
    'Reflexiona sistemáticamente sobre su práctica pedagógica y su impacto en el aprendizaje de los estudiantes.'
  ],
  'Evaluación del aprendizaje': [
    'Conoce y aplica diferentes métodos, técnicas e instrumentos de evaluación, coherentes con los objetivos de aprendizaje del currículo.',
    'Maneja una programación de evaluaciones y la da a conocer oportunamente a sus estudiantes.',
    'Diseña actividades pedagógicas, incluidas las de recuperación, con base en los resultados de la evaluación interna y externa.',
    'Identifica a los estudiantes que requieren ayuda adicional and aplica estrategias de apoyo para los mismos.',
    'Promueve la autoevaluación de los estudiantes e incentiva los desempeños sobresalientes y excelentes.',
    'Considera los estándares básicos de competencias para la evaluación interna.',
    'Retroalimenta sus propias prácticas pedagógicas de acuerdo con los resultados de los estudiantes.'
  ],
  'Uso de recursos': [
    'Prevé y gestiona los recursos necesarios para el desarrollo de su actividad pedagógica.',
    'Solicita y devuelve los equipos y espacios que requiere para su práctica pedagógica oportunamente y siguiendo los procedimientos establecidos.',
    'Distribuye con eficiencia entre sus estudiantes los recursos asignados.',
    'Hace un uso responsable de los equipos e instalaciones de la institución y los mantiene en buen estado.',
    'Promueve entre sus estudiantes el buen manejo y uso racional de la infraestructura y los recursos del establecimiento.'
  ],
  'Seguimiento de procesos': [
    'Desarrolla sus actividades de acuerdo con el calendario y la jornada escolar.',
    'Interactúa efectivamente con las diferentes instancias de la institución para optimizar el desarrollo de sus propias actividades.',
    'Asiste a las reuniones académicas y administrativas convocadas y participa activamente en las mismas.',
    'Apoya el análisis de la autoevaluación institucional, la actualización del Proyecto Educativo Institucional y el desarrollo de nuevas iniciativas.'
  ],
  'Comunicación institucional': [
    'Custodia la aplicación y el cumplimiento del manual de convivencia en los diferentes espacios de la institución.',
    'Se compromete con acciones dirigidas a la prevención de diferentes tipos de riesgos.',
    'Promueve actividades con diferentes miembros de la comunidad educativa para fortalecer la identidad institucional.',
    'Participa en los escenarios definidos por las directivas para apoyar la toma de decisiones.',
    'Fomenta el respeto por los valores entre sus superiores, colegas y estudiantes.'
  ],
  'Comunidad y entorno': [
    'Conoce las características socio – culturales de sus estudiantes y organiza su práctica pedagógica en articulación con el contexto.',
    'Identifica problemas psicosociales de los estudiantes y apoya la resolución de los mismos.',
    'Informa a padres de familia y acudientes sobre procesos educativos y avances en el aprendizaje de los estudiantes y establece relaciones de colaboración con ellos.',
    'Promueve actividades que involucren a las familias en la formación integral de los estudiantes.',
    'Realiza acciones pedagógicas que incorporan las características del entorno en que se encuentra la institución, generando alternativas de intervención sobre problemáticas de la comunidad.',
    'Utiliza diferentes escenarios comunitarios para enriquecer sus prácticas pedagógicas.'
  ],
  'Interacción con la comunidad y el entorno': [
    'Conoce las características socio – culturales de sus estudiantes y organiza su práctica pedagógica en articulación con el contexto.',
    'Identifica problemas psicosociales de los estudiantes y apoya la resolución de los mismos.',
    'Informa a padres de familia y acudientes sobre procesos educativos y avances en el aprendizaje de los estudiantes y establece relaciones de colaboración con ellos.',
    'Promueve actividades que involucren a las familias en la formación integral de los estudiantes.',
    'Realiza acciones pedagógicas que incorporan las características del entorno en que se encuentra la institución, generando alternativas de intervención sobre problemáticas de la comunidad.',
    'Utiliza diferentes escenarios comunitarios para enriquecer sus prácticas pedagógicas.'
  ],
  'Liderazgo': [
    'Transmite con sus acciones a la comunidad educativa la visión, la misión, los objetivos y los valores institucionales.',
    'Influye positivamente en el comportamiento de los demás y logra que se comprometan con el logro de metas comunes.',
    'Plantea orientaciones convincentes, expresa expectativas positivas de los demás y demuestra interés por el desarrollo de las personas.',
    'Promueve cambios y transformaciones que aumenten la capacidad institucional e impulsen el mejoramiento.'
  ],
  'Relaciones interpersonales y comunicación': [
    'Combina adecuadamente los recursos expresivos del lenguaje oral, escrito y gráfico, con ayuda de las tecnologías de información y comunicación.',
    'Expresa argumentos de forma clara y respetuosa utilizando el lenguaje verbal y no verbal.',
    'Escucha con atención y comprende puntos de vista de los demás, demostrando tolerancia frente a diferentes opiniones.',
    'Realiza preguntas claras, concretas y que permiten aclarar una idea o situación.',
    'Maneja y expresa adecuadamente sus emociones e identifica y comprende las de otros.',
    'Demuestra habilidades sociales en interacciones profesionales y sociales.'
  ],
  'Comunicación y relaciones interpersonales': [
    'Combina adecuadamente los recursos expresivos del lenguaje oral, escrito y gráfico, con ayuda de las tecnologías de información y comunicación.',
    'Expresa argumentos de forma clara y respetuosa utilizando el lenguaje verbal y no verbal.',
    'Escucha con atención y comprende puntos de vista de los demás, demostrando tolerancia frente a diferentes opiniones.',
    'Realiza preguntas claras, concretas y que permiten aclarar una idea o situación.',
    'Maneja y expresa adecuadamente sus emociones e identifica y comprende las de otros.',
    'Demuestra habilidades sociales en interacciones profesionales y sociales.'
  ],
  'Trabajo en equipo': [
    'Establece relaciones profesionales y de equipo que potencien su trabajo y el logro de las metas institucionales.',
    'Comparte aprendizajes y recursos con diferentes miembros de la institución y ofrece apoyo para el trabajo de otros.',
    'Aporta sugerencias, ideas y opiniones y propicia la conformación de equipos para el desarrollo de proyectos.',
    'Considera las contribuciones de los demás en la toma de decisiones.',
    'Acepta críticas constructivas y actúa en consecuencia.'
  ],
  'Negociación y mediación': [
    'Identifica y comprende las causas y el contexto de un conflicto, valorando con imparcialidad los motivos de los implicados.',
    'Interviene efectiva y oportunamente ante situaciones de conflicto.',
    'Facilita acuerdos y soluciones multilaterales, anteponiendo los intereses comunes y generando confianza en el proceso de mediación.',
    'Promueve soluciones duraderas y hace seguimiento a los compromisos adquiridos por las partes.',
    'Forma a sus estudiantes en estrategias de resolución pacífica de conflictos.'
  ],
  'Compromiso social e institucional': [
    'Muestra respeto hacia los estudiantes, el equipo docente, los directivos, el personal administrativo y la comunidad.',
    'Acata y divulga las normas y políticas nacionales, regionales e institucionales.',
    'Responde con oportunidad, eficiencia y calidad a las tareas que se le asignan.',
    'Cumple eficientemente su jornada laboral.',
    'Exhibe un comportamiento ético dentro y fuera del establecimiento y representa adecuadamente a la institución en actividades fuera de la misma.',
    'Demuestra honestidad e integridad en su ejercicio profesional.',
    'Reflexiona sistemáticamente sobre su responsabilidad social como educador.'
  ],
  'Iniciativa': [
    'Realiza acciones que le facilitan el aprendizaje permanente y la actualización en su disciplina y en otras áreas del conocimiento.',
    'Actúa con autonomía sin necesidad de supervisión y hace su trabajo con entusiasmo.',
    'Demuestra recursividad y flexibilidad, y se adapta con rapidez a diferentes contextos.',
    'Anticipa situaciones futuras, identifica tendencias innovadoras y es abierto a nuevas ideas.',
    'Propone y desarrolla ideas novedosas, investigaciones, experiencias o proyectos, para influir positivamente en la institución y la comunidad.'
  ],
  'Orientación al logro': [
    'Trabaja con tesón y disciplina para cumplir sus funciones con altos niveles de calidad.',
    'Demuestra esfuerzo y persistencia en la consecución de sus objetivos, afrontando obstáculos y situaciones difíciles.',
    'Procura que los estudiantes de la institución obtengan resultados de excelencia.',
    'Confía en sus propias capacidades y se muestra seguro de sí mismo, aun en situaciones desafiantes.',
    'Tiene metas personales y profesionales elevadas.'
  ]
};

export const EvaluacionDocentePanel: React.FC<EvaluacionDocentePanelProps> = ({
  docentesEvaluacion,
  setDocentesEvaluacion,
  showToast,
  currentTeacher,
  setCurrentTeacher,
  onTeacherMessagesChange,
  triggerOpenMessages
}) => {
  // State for evaluation records
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion1278[]>([]);

  // Login states for teacher portal
  const [teacherCedulaInput, setTeacherCedulaInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Portal view state
  const currentYear = new Date().getFullYear();
  const [selectedAnio, setSelectedAnio] = useState<number>(currentYear);
  const [activeTab, setActiveTab] = useState<'docentesEvaluacion' | 'config' | 'export'>('docentesEvaluacion');
  const [isMessagesModalOpen, setIsMessagesModalOpen] = useState(false);
  const [portalMode, setPortalView] = useState<'selection' | 'compromisos' | 'anexo2'>('anexo2');
  const [selectedPeriod, setSelectedPeriod] = useState<1 | 2 | 3>(1);

  // Active form state for logged-in teacher
  const [activeEvaluacion, setActiveEvaluacion] = useState<Evaluacion1278 | null>(null);

  // Selected comportamentales for active evaluation
  const [compSel1, setCompSel1] = useState(COMPORTAMENTALES_OPCIONES[0]);
  const [compSel2, setCompSel2] = useState(COMPORTAMENTALES_OPCIONES[1]);
  const [compSel3, setCompSel3] = useState(COMPORTAMENTALES_OPCIONES[2]);

  // Selector de criterios de evaluación por competencias
  const [activeCriteriaSelectorIndex, setActiveCriteriaSelectorIndex] = useState<number | null>(null);
  const [isCriteriaSelectorForAdmin, setIsCriteriaSelectorForAdmin] = useState(false);
  const [activeBehaviorSelectorIndex, setActiveBehaviorSelectorIndex] = useState<number | null>(null);
  const [isBehaviorSelectorForAdmin, setIsBehaviorSelectorForAdmin] = useState(false);
  const [selectedCriteriaTemp, setSelectedCriteriaTemp] = useState<string[]>([]);

  // Admin states
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [selectedEvalForInspection, setSelectedEvalForInspection] = useState<Evaluacion1278 | null>(null);
  const [adminFeedback, setAdminFeedback] = useState('');

  // Sync admin feedback state when opening an evaluation for inspection
  useEffect(() => {
    if (selectedEvalForInspection) {
      setAdminFeedback(selectedEvalForInspection.observacionesAdmin || '');
    } else {
      setAdminFeedback('');
    }
  }, [selectedEvalForInspection?.id, selectedEvalForInspection?.observacionesAdmin]);

  // Notify parent if teacher has messages
  useEffect(() => {
    if (onTeacherMessagesChange && currentTeacher) {
      const teacherEvals = evaluaciones.filter(e => e.cedula === currentTeacher.cedula && e.observacionesAdmin?.trim());
      if (teacherEvals.length === 0) {
        onTeacherMessagesChange('none');
      } else {
        // If any eval needs correction or is in draft (not yet sent for review), it's red
        const needsCorrection = teacherEvals.some(e => e.estado === 'Corregir' || e.estado === 'Borrador');
        onTeacherMessagesChange(needsCorrection ? 'red' : 'green');
      }
    }
  }, [evaluaciones, currentTeacher, onTeacherMessagesChange]);

  // Open messages modal when triggered from parent
  useEffect(() => {
    if (triggerOpenMessages && triggerOpenMessages > 0) {
      setIsMessagesModalOpen(true);
    }
  }, [triggerOpenMessages]);

  // Admin config states
  const [showAdminConfig, setShowAdminConfig] = useState(false);

  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSavingActa, setIsSavingActa] = useState(false);

  // Acta de Concertación General Modal states
  const [isActaGeneralModalOpen, setIsActaGeneralModalOpen] = useState(false);
  const [actaGenNumero, setActaGenNumero] = useState('01');
  const [actaGenAnio, setActaGenAnio] = useState(() => new Date().getFullYear().toString());
  const [actaGenLugar, setActaGenLugar] = useState('INSTITUCIÓN EDUCATIVA ALVERNIA - RECTORÍA');
  const [actaGenFecha, setActaGenFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [actaGenHora, setActaGenHora] = useState('08:00 AM');
  const [actaGenObjetivo, setActaGenObjetivo] = useState(
    'Concertar y refrendar de manera colectiva y unificada los compromisos laborales, así como las competencias funcionales y comportamentales a ser evaluadas durante la vigencia del año escolar actual, promoviendo el mejoramiento continuo y el cumplimiento del Proyecto Educativo Institucional (PEI).'
  );
  const [actaGenOrdenDia, setActaGenOrdenDia] = useState(
    '1. Verificación de asistencia y Quórum.\n2. Lectura y aprobación del Orden del Día.\n3. Socialización técnica de las pautas de Evaluación del Desempeño Laboral (Decreto 1278 de 2002).\n4. Definición colectiva de compromisos funcionales en áreas académica, administrativa y comunitaria.\n5. Concertación unificada de competencias comportamentales (Trabajo en equipo, Compromiso social).\n6. Acordar las contribuciones individuales, conforme a la Guía Ministerial No 31.\n7. Firma y refrendación del acta por la totalidad del personal docente.'
  );
  const [actaGenDesarrollo, setActaGenDesarrollo] = useState(
    'Siendo las 08:00 am del día señalado, se dio inicio a la reunión con la totalidad de los docentes regidos bajo el Decreto 1278 de 2002, contando con el quórum reglamentario para deliberar y decidir válidamente sobre los asuntos del proceso anual de evaluación de desempeño (Decreto 1278). Acto seguido, se leyó y aprobó unánimamente el orden del día.\n\nEl evaluador directivo expuso pormenorizadamente los propósitos de la evaluación, las áreas de gestión y los porcentajes reglamentarios para las competencias funcionales y comportamentales. Tras una deliberación participativa y democrática, se concertaron colectivamente los compromisos comunes que regirán a nivel institucional, definiendo las evidencias físicas y de portafolio que sustentarán los logros. El personal docente manifestó su total acuerdo con los criterios y compromisos concertados, comprometiéndose a integrarlos en sus agendas de trabajo pedagógico. Se firma la presente acta en señal de total conformidad y entendimiento.'
  );
  const [actaGenCuadroInfo, setActaGenCuadroInfo] = useState(
    'Vigencia: Año Escolar Actual\nEstablecimiento: Sede Central y Sedes Anexas\nDirigido a: Docentes de Aula y Directivos\nComité de Apoyo: Consejo Directivo y Académico'
  );

  const [isActaModalOpen, setIsActaModalOpen] = useState(false);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [currentActaId, setCurrentActaId] = useState<string | null>(null);
  const [savedActas, setSavedActas] = useState<ActaGeneralData[]>([]);

  // ACTA SELECTOR & HISTORY TABS
  const [isActaSelectorModalOpen, setIsActaSelectorModalOpen] = useState(false);
  const [historialTab, setHistorialTab] = useState<'general' | 'seguimiento'>('general');

  // ACTA SEGUIMIENTO STATES
  const [actaSeguimientoType, setActaSeguimientoType] = useState<1 | 2>(1);
  const [isActaSeguimientoModalOpen, setIsActaSeguimientoModalOpen] = useState(false);
  const [isActasSeguimientoVisualizerOpen, setIsActasSeguimientoVisualizerOpen] = useState(false);
  const [savedActasSeguimiento, setSavedActasSeguimiento] = useState<ActaSeguimientoData[]>([]);
  const [currentActaSeguimientoId, setCurrentActaSeguimientoId] = useState<string | null>(null);
  const [actaSegNumero, setActaSegNumero] = useState('02');
  const [actaSegAnio, setActaSegAnio] = useState(() => new Date().getFullYear().toString());
  const [actaSegLugar, setActaSegLugar] = useState('INSTITUCIÓN EDUCATIVA ALVERNIA - RECTORÍA');
  const [actaSegFecha, setActaSegFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [actaSegHora, setActaSegHora] = useState('03:00 PM');
  const [actaSegObjetivo, setActaSegObjetivo] = useState(
    'Realizar el seguimiento a la entrega de evidencias y compromisos pactados.'
  );
  const [actaSegOrdenDia, setActaSegOrdenDia] = useState(
    '1. Saludo.\n2. Llamado a Lista y Verificación del Quorum\n3. Lectura del acta anterior y acta de acuerdo y registro de evidencias\n4. Entrega de Evidencias\n5. Puntos varios\n6. Marcha final'
  );
  const [actaSegDesarrollo, setActaSegDesarrollo] = useState(
    '1. Saludo.\nSiendo la hora señalada, el director da la bienvenida a los docentes involucrados en este proceso, después de un breve saludo se dio inicio a la reunión iniciando por el objetivo de la misma.\n\n2. Llamado a Lista y Verificación del Quórum.\nAl llamado a lista contestaron los docentes involucrados en el proceso de evaluación. Se constató la presencia de los docentes y se dijo que existe quorum reglamentario para continuar.\n\n3. Lectura del acta anterior y acta de acuerdo y registro de evidencias.\nEl señor director da lectura del acta anterior para recordarles lo que se había pactado, y posteriormente se da lectura a los anexos para que cada docente haga entrega de sus evidencias.'
  );
  const [actaSegCuadroInfo, setActaSegCuadroInfo] = useState(
    'Vigencia: Año Escolar Actual\nEstablecimiento: Sede Central y Sedes Anexas\nComité de Apoyo: Consejo Directivo y Académico'
  );
  const [actaSegDocentesObs, setActaSegDocentesObs] = useState<DocenteObservacion[]>([]);
  const [isSavingActaSeguimiento, setIsSavingActaSeguimiento] = useState(false);

  // Function to initialize teachers list for tracking
  const initActaSeguimientoDocentes = () => {
    const existingIds = actaSegDocentesObs.map(d => d.docenteId);
    const newDocentes = docentesEvaluacion
      .filter(emp => !existingIds.includes(emp.id))
      .map(emp => ({
        docenteId: emp.id,
        nombre: emp.nombre,
        cedula: emp.cedula,
        observacion: 'Entregó todas las evidencias pactadas hasta la fecha en medio magnético, se evidencia su buen trabajo.'
      }));
    if (newDocentes.length > 0) {
      setActaSegDocentesObs(prev => [...prev, ...newDocentes]);
    }
  };

  useEffect(() => {
    if (isActaSeguimientoModalOpen && docentesEvaluacion.length > 0) {
      initActaSeguimientoDocentes();
    }
  }, [isActaSeguimientoModalOpen, docentesEvaluacion]);

  const fetchActasSeguimiento = async () => {
    try {
      const res = await fetch('/api/actas-seguimiento', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setSavedActasSeguimiento(data.actas);
      }
    } catch (err) {
      console.error('Error fetching actas seguimiento:', err);
    }
  };



  const fetchActas = async () => {
    try {
      const res = await fetch('/api/actas', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setSavedActas(data.actas);
      }
    } catch (err) {
      console.error('Error fetching actas:', err);
    }
  };

  useEffect(() => {
    fetchActas();
  }, []);
  const [actaGenCronograma, setActaGenCronograma] = useState<CronogramaRow[]>([
    { etapa: 'Planeación y Preparación', fecha: `21/febrero al 17 de abril de 2026`, actividad: 'Acta de reunión con contribuciones individuales acordadas', producto: 'Acta 001\nAnexo 2\nAnexo 5', responsable: 'Rector' },
    { etapa: 'Subir al aplicativo Humano', fecha: `20 de abril al 30 de abril de 2026`, actividad: 'Registrar en el aplicativo humano las contribuciones individuales acordadas con el evaluado en el proceso anterior', producto: 'Información Inicial Registrada en Aplicativo Humano', responsable: 'Rector' },
    { etapa: 'Primer Seguimiento', fecha: `13/07/2026 al 31/07/2026`, actividad: 'Seguimiento sistemático y registrar en Sistema Humano el primer seguimiento realizado por el evaluador a los avances y cumplimiento de las contribuciones individuales y las evidencias acordadas entre el evaluador y el evaluado en los tiempos previstos', producto: 'Acta y entrega de evidencias medios físico o magnético', responsable: 'Rector y Evaluados' },
    { etapa: 'Seguimiento Individual e Institucional', fecha: `26 de enero al 09 de diciembre de 2026`, actividad: 'Analizar y registrar los cambios observados en el desempeño de los evaluados (sean positivos o negativos), para realizar los ajustes necesarios.\n\nValorar el mismo proceso de evaluación de desempeño laboral, identificando los aciertos y dificultades en su planeación y desarrollo, para alcanzar estándares de calidad cada vez más elevados.', producto: 'Valoración del Proceso de Evaluación', responsable: 'Rector' },
    { etapa: 'Segundo seguimiento', fecha: `30 de octubre de 2026`, actividad: 'Realizar el segundo seguimiento sistemático y registrar en el sistema Humano, recolectar las evidencias totales acordadas en la etapa de planeación y preparación, organizarlas en la carpeta de evidencias según la tabla de resumen de evidencias (anexo 2 y 5).', producto: 'Evidencias en medio físico o magnético', responsable: 'Rector y Evaluados' },
    { etapa: 'Desarrollo Final de la Evaluación', fecha: `07 al 11 de diciembre de 2026`, actividad: 'Calificar en el aplicativo humano, las competencias correspondientes con valores enteros, a partir del análisis de las evidencias y criterios, recolectada durante el desarrollo de la evaluación\n\nGenerar e imprimir el protocolo de evaluación a través del aplicativo humano, para proceder a la firma del evaluado\n\nEntrevista con cada evaluado para notificarle el resultado final y proceder a su firma\n\nRemitir oficio a la Unidad Educativa para hacer entrega de los protocolos de evaluación originales debidamente firmados por las partes.', producto: 'Protocolos con calificación final\n\nProtocolo de evaluación original\nProtocolos de evaluación debidamente firmados\n\nOficio remisorio, Protocolos de Evaluación Originales', responsable: 'Rector (Evaluador)\n\nRector\n\nRector Evaluados\n\nRector' }
  ]);
  const [rectorSignature, setRectorSignature] = useState<string | null>(() => {
    return localStorage.getItem('rector_signature_base64');
  });
  const [habilitationDates, setHabilitationDates] = useState<{ [key: number]: string }>(() => {
    const saved = localStorage.getItem('alvernia_habilitation_dates');
    return saved ? JSON.parse(saved) : {
      1: '2026-01-01',
      2: '2026-06-01',
      3: '2026-10-01'
    };
  });

  // Global Institutional & Rector Config State
  const [institutionName, setInstitutionName] = useState(() => {
    return localStorage.getItem('alvernia_institution_name') || 'INSTITUCIÓN EDUCATIVA ALVERNIA';
  });
  const [institutionDane, setInstitutionDane] = useState(() => {
    return localStorage.getItem('alvernia_institution_dane') || '186568000567';
  });
  const [institutionNit, setInstitutionNit] = useState(() => {
    return localStorage.getItem('alvernia_institution_nit') || '891201897-5';
  });
  const [educationalLevel, setEducationalLevel] = useState(() => {
    return localStorage.getItem('alvernia_educational_level') || 'NIVEL PREESCOLAR – BÁSICA PRIMARIA Y MEDIA ACADÉMICA';
  });
  const [calendario, setCalendario] = useState(() => {
    return localStorage.getItem('alvernia_calendario') || 'CALENDARIO A';
  });
  const [footerMotto, setFooterMotto] = useState(() => {
    return localStorage.getItem('alvernia_footer_motto') || '“Brindamos una educación humanística y académica para la excelencia de un ser humano integral”';
  });
  const [footerAddress, setFooterAddress] = useState(() => {
    return localStorage.getItem('alvernia_footer_address') || 'Barrio San Martin Carrera 16 No. 12 – 77';
  });
  const [footerEmails, setFooterEmails] = useState(() => {
    return localStorage.getItem('alvernia_footer_emails') || 'alvernia@sedputumayo.gov.co – rectoralvernia@gmail.com';
  });
  const [footerWebsite, setFooterWebsite] = useState(() => {
    return localStorage.getItem('alvernia_footer_website') || 'www.ie-alvernia.edu.co';
  });
  const [footerCity, setFooterCity] = useState(() => {
    return localStorage.getItem('alvernia_footer_city') || 'Puerto Asís - Putumayo';
  });
  const [rectorName, setRectorName] = useState(() => {
    return localStorage.getItem('iea_rector_name') || localStorage.getItem('alvernia_rector_name') || 'ESP. CARLOS ARCESIO ACOSTA CORONEL';
  });
  const [rectorDocument, setRectorDocument] = useState(() => {
    return localStorage.getItem('iea_rector_doc') || localStorage.getItem('alvernia_rector_document') || 'C.C. No. 87.246.722 de La Cruz';
  });
  const [rectorDocumentExpedition, setRectorDocumentExpedition] = useState(() => {
    return localStorage.getItem('alvernia_rector_document_expedition') || 'Mocoa';
  });

  // Sync state when local config is updated globally
  useEffect(() => {
    const handleConfigUpdated = () => {
      setInstitutionName(localStorage.getItem('alvernia_institution_name') || 'INSTITUCIÓN EDUCATIVA ALVERNIA');
      setInstitutionDane(localStorage.getItem('alvernia_institution_dane') || '186568000567');
      setInstitutionNit(localStorage.getItem('alvernia_institution_nit') || '891201897-5');
      setEducationalLevel(localStorage.getItem('alvernia_educational_level') || 'NIVEL PREESCOLAR – BÁSICA PRIMARIA Y MEDIA ACADÉMICA');
      setCalendario(localStorage.getItem('alvernia_calendario') || 'CALENDARIO A');
      setFooterMotto(localStorage.getItem('alvernia_footer_motto') || '“Brindamos una educación humanística y académica para la excelencia de un ser humano integral”');
      setFooterAddress(localStorage.getItem('alvernia_footer_address') || 'Barrio San Martin Carrera 16 No. 12 – 77');
      setFooterEmails(localStorage.getItem('alvernia_footer_emails') || 'alvernia@sedputumayo.gov.co – rectoralvernia@gmail.com');
      setFooterWebsite(localStorage.getItem('alvernia_footer_website') || 'www.ie-alvernia.edu.co');
      setFooterCity(localStorage.getItem('alvernia_footer_city') || 'Puerto Asís - Putumayo');
      setRectorName(localStorage.getItem('iea_rector_name') || localStorage.getItem('alvernia_rector_name') || 'ESP. CARLOS ARCESIO ACOSTA CORONEL');
      setRectorDocument(localStorage.getItem('iea_rector_doc') || localStorage.getItem('alvernia_rector_document') || 'C.C. No. 87.246.722 de La Cruz');
      setRectorDocumentExpedition(localStorage.getItem('alvernia_rector_document_expedition') || 'Mocoa');
      const sig = localStorage.getItem('rector_signature_base64') || localStorage.getItem('iea_custom_signature') || '';
      setRectorSignature(sig || null);
    };

    window.addEventListener('iea_config_updated', handleConfigUpdated);
    return () => {
      window.removeEventListener('iea_config_updated', handleConfigUpdated);
    };
  }, []);

  const handleInstitutionNameChange = (val: string) => {
    setInstitutionName(val);
    localStorage.setItem('alvernia_institution_name', val);
  };

  const handleInstitutionDaneChange = (val: string) => {
    setInstitutionDane(val);
    localStorage.setItem('alvernia_institution_dane', val);
  };

  const handleRectorNameChange = (val: string) => {
    setRectorName(val);
    localStorage.setItem('alvernia_rector_name', val);
  };

  const handleRectorDocumentChange = (val: string) => {
    setRectorDocument(val);
    localStorage.setItem('alvernia_rector_document', val);
  };

  const handleRectorDocumentExpeditionChange = (val: string) => {
    setRectorDocumentExpedition(val);
    localStorage.setItem('alvernia_rector_document_expedition', val);
  };

  const handleHabilitationDateChange = (period: number, value: string) => {
    const updated = { ...habilitationDates, [period]: value };
    setHabilitationDates(updated);
    localStorage.setItem('alvernia_habilitation_dates', JSON.stringify(updated));
    showToast(`✓ Fecha de habilitación para Seguimiento ${period} actualizada.`);
  };

  const handleRectorSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const publicUrl = await uploadFileToR2(file, 'firmas');
      setRectorSignature(publicUrl);
      localStorage.setItem('rector_signature_base64', publicUrl);
      showToast('✓ Firma del Rector cargada con éxito en la nube.');
    } catch (err) {
      showToast('Error al subir la firma.');
    }
  };

  const handleRemoveRectorSignature = () => {
    setRectorSignature(null);
    localStorage.removeItem('rector_signature_base64');
    showToast('✓ Firma del Rector eliminada.');
  };

  // --- Profile update modal states ---
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileLugarExp, setProfileLugarExp] = useState('');
  const [profileCorreo, setProfileCorreo] = useState('');
  const [profileCelular, setProfileCelular] = useState('');
  const [profileArea, setProfileArea] = useState('');
  const [profileFirma, setProfileFirma] = useState(''); // base64 string
  const [lastCheckedTeacherId, setLastCheckedTeacherId] = useState<string | null>(null);

  // Auto-open profile modal when teacher logs in and has missing fields
  useEffect(() => {
    if (currentTeacher) {
      if (currentTeacher.id !== lastCheckedTeacherId) {
        setLastCheckedTeacherId(currentTeacher.id);
        const isMissing = !currentTeacher.lugarExpedicionCedula || 
                          !currentTeacher.correoElectronico || 
                          !currentTeacher.numeroCelular || 
                          !currentTeacher.areaDesempeno || 
                          !currentTeacher.firmaDocente;
        
        // Use transition to avoid blocking the main thread when updating these states
        React.startTransition(() => {
          setProfileLugarExp(currentTeacher.lugarExpedicionCedula || '');
          setProfileCorreo(currentTeacher.correoElectronico || '');
          setProfileCelular(currentTeacher.numeroCelular || '');
          setProfileArea(currentTeacher.areaDesempeno || '');
          setProfileFirma(currentTeacher.firmaDocente || '');
        });

        if (isMissing) {
          // Delay opening the modal slightly so the main UI can render smoothly first
          setTimeout(() => {
            setIsProfileModalOpen(true);
          }, 400);
        }
      }
    } else {
      setLastCheckedTeacherId(null);
    }
  }, [currentTeacher, lastCheckedTeacherId]);

  const handleSaveProfile = async () => {
    if (!currentTeacher || !setDocentesEvaluacion) return;

    const updatedEmployee: DocenteEvaluacion = {
      ...currentTeacher,
      lugarExpedicionCedula: profileLugarExp.trim(),
      correoElectronico: profileCorreo.trim(),
      numeroCelular: profileCelular.trim(),
      areaDesempeno: profileArea.trim(),
      firmaDocente: profileFirma
    };

    // 1. Update parent list
    setDocentesEvaluacion((prev) => prev.map(emp => emp.id === currentTeacher.id ? updatedEmployee : emp));
    
    // 2. Also update session state so current view reflects the changes
    setCurrentTeacher(updatedEmployee);

    // 3. Save to Supabase
    try {
      const dbEmp: any = {
        id: updatedEmployee.id,
        nombre: updatedEmployee.nombre,
        cedula: updatedEmployee.cedula,
        cargo: updatedEmployee.cargo,
        sede_trabajo: updatedEmployee.sedeTrabajo,
        dificil_acceso: updatedEmployee.dificilAcceso,
        horas_aula: updatedEmployee.horasAula,
        horas_libres: updatedEmployee.horasLibres,
        area_desempeno: updatedEmployee.areaDesempeno,
        tipo_nombramiento: updatedEmployee.tipoNombramiento,
        activo: updatedEmployee.activo,
        lugar_expedicion_cedula: updatedEmployee.lugarExpedicionCedula,
        correo_electronico: updatedEmployee.correoElectronico,
        numero_celular: updatedEmployee.numeroCelular,
        firma_docente: updatedEmployee.firmaDocente
      };

      const { error } = await supabase.from('docentesEvaluacion').upsert(dbEmp, { onConflict: 'id' });
      if (error) {
        if (error.message && (error.message.includes('column') || error.message.includes('relation') || error.code === 'PGS01')) {
          const stripped = {
            id: updatedEmployee.id,
            nombre: updatedEmployee.nombre,
            cedula: updatedEmployee.cedula,
            cargo: updatedEmployee.cargo,
            sede_trabajo: updatedEmployee.sedeTrabajo,
            dificil_acceso: updatedEmployee.dificilAcceso,
            horas_aula: updatedEmployee.horasAula,
            horas_libres: updatedEmployee.horasLibres,
            area_desempeno: updatedEmployee.areaDesempeno,
            tipo_nombramiento: updatedEmployee.tipoNombramiento,
            activo: updatedEmployee.activo
          };
          await supabase.from('docentesEvaluacion').upsert(stripped, { onConflict: 'id' });
        } else {
          throw error;
        }
      }
    } catch (err: any) {
      console.warn('Fallo guardado en Supabase (datos locales guardados con éxito):', err);
    }

    showToast('¡Datos de perfil y firma actualizados con éxito!');
    setIsProfileModalOpen(false);
  };

  // --- States for editing / deleting teachers by Admin ---
  const [editingTeacher, setEditingTeacher] = useState<DocenteEvaluacion | null>(null);
  const [editTeacherName, setEditTeacherName] = useState('');
  const [editTeacherCedula, setEditTeacherCedula] = useState('');
  const [editTeacherCargo, setEditTeacherCargo] = useState('');
  const [editTeacherSede, setEditTeacherSede] = useState('');
  const [editTeacherLugarExp, setEditTeacherLugarExp] = useState('');
  const [editTeacherCorreo, setEditTeacherCorreo] = useState('');
  const [editTeacherCelular, setEditTeacherCelular] = useState('');
  const [editTeacherArea, setEditTeacherArea] = useState('');
  const [editTeacherFirma, setEditTeacherFirma] = useState(''); // base64

  const [deletingTeacher, setDeletingTeacher] = useState<DocenteEvaluacion | null>(null);
  const [isDeletingInProgress, setIsDeletingInProgress] = useState(false);
  const [isSavingTeacherEditInProgress, setIsSavingTeacherEditInProgress] = useState(false);

  const handleStartEditTeacher = (emp: DocenteEvaluacion) => {
    setEditingTeacher(emp);
    setEditTeacherName(emp.nombre);
    setEditTeacherCedula(emp.cedula);
    setEditTeacherCargo(emp.cargo);
    setEditTeacherSede(emp.sedeTrabajo);
    setEditTeacherLugarExp(emp.lugarExpedicionCedula || '');
    setEditTeacherCorreo(emp.correoElectronico || '');
    setEditTeacherCelular(emp.numeroCelular || '');
    setEditTeacherArea(emp.areaDesempeno || '');
    setEditTeacherFirma(emp.firmaDocente || '');
  };

  const handleSaveEditTeacher = async () => {
    if (!editingTeacher || !setDocentesEvaluacion) return;
    setIsSavingTeacherEditInProgress(true);

    const updated: DocenteEvaluacion = {
      ...editingTeacher,
      nombre: editTeacherName.trim(),
      cedula: editTeacherCedula.trim(),
      cargo: editTeacherCargo.trim(),
      sedeTrabajo: editTeacherSede.trim(),
      lugarExpedicionCedula: editTeacherLugarExp.trim(),
      correoElectronico: editTeacherCorreo.trim(),
      numeroCelular: editTeacherCelular.trim(),
      areaDesempeno: editTeacherArea.trim(),
      firmaDocente: editTeacherFirma
    };

    // 1. Update parent's list state
    setDocentesEvaluacion(prev => prev.map(emp => emp.id === editingTeacher.id ? updated : emp));

    // 2. Update session state if current teacher is edited
    if (currentTeacher && currentTeacher.id === editingTeacher.id) {
      setCurrentTeacher(updated);
    }

    // 3. Save to CockroachDB
    try {
      const dbEmp: any = {
        id: updated.id,
        nombre: updated.nombre,
        cedula: updated.cedula,
        cargo: updated.cargo,
        sedeTrabajo: updated.sedeTrabajo,
        dificilAcceso: updated.dificilAcceso,
        horasAula: updated.horasAula,
        horasLibres: updated.horasLibres,
        areaDesempeno: updated.areaDesempeno,
        tipoNombramiento: updated.tipoNombramiento,
        activo: updated.activo
      };

      const res = await fetch('/api/docentesEvaluacion/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docentesEvaluacion: [dbEmp] })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to save to CockroachDB');
      showToast('✓ Datos del docente actualizados correctamente.');
    } catch (err: any) {
      console.warn('Supabase save failed, saved locally:', err);
      showToast('✓ Datos actualizados localmente (Soporte en la nube sin configurar).');
    } finally {
      setIsSavingTeacherEditInProgress(false);
      setEditingTeacher(null);
    }
  };

  const handleStartDeleteTeacher = (emp: DocenteEvaluacion) => {
    setDeletingTeacher(emp);
  };

  const handleExecuteDeleteTeacher = async () => {
    if (!deletingTeacher || !setDocentesEvaluacion) return;
    setIsDeletingInProgress(true);

    // 1. Update parent's list state
    setDocentesEvaluacion(prev => prev.filter(emp => emp.id !== deletingTeacher.id));

    // 2. Logout if current teacher is deleted
    if (currentTeacher && currentTeacher.id === deletingTeacher.id) {
      setCurrentTeacher(null);
    }

    // 3. Delete from CockroachDB
    try {
      const res = await fetch(`/api/docentesEvaluacion/${deletingTeacher.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success && !data.fallback) throw new Error(data.error || 'Failed to delete in CockroachDB');
      
      showToast(`✓ Registro de ${deletingTeacher.nombre} eliminado permanentemente.`);
    } catch (err: any) {
      console.warn('CockroachDB delete failed, deleted locally:', err);
      showToast(`✓ Registro de ${deletingTeacher.nombre} eliminado localmente.`);
    } finally {
      setIsDeletingInProgress(false);
      setDeletingTeacher(null);
    }
  };

  // Persist evaluations to cloud
  useEffect(() => {
    // Trigger background sync to Supabase
    syncEvaluacionesToSupabase(evaluaciones);
  }, [evaluaciones]);

  // Load teacher evaluation when teacher logs in or selected period changes
  useEffect(() => {
    if (currentTeacher) {
      // Find or initialize evaluation for this teacher and period
      const existing = evaluaciones.find(
        e => e.cedula === currentTeacher.cedula && Number(e.periodo) === selectedPeriod && (e.anio === selectedAnio || e.anio === undefined)
      );

      const currentRectorName = localStorage.getItem('iea_rector_name') || rectorName || 'Rector(a) / Coordinador(a) I.E. Alvernia';
      const currentRectorDoc = localStorage.getItem('iea_rector_doc') || rectorDocument || '12345678';

      if (existing) {
        // Automatically align with current configured parameters and patch missing anio
        const updatedExisting = {
          ...existing,
          anio: existing.anio || selectedAnio,
          id: `${currentTeacher.cedula}__${existing.anio || selectedAnio}__${selectedPeriod}`,
          evaluadorNombre: currentRectorName,
          evaluadorCedula: currentRectorDoc
        };
        setActiveEvaluacion(updatedExisting);
        // Load selected behavior competencies
        if (existing.compromisosComportamentales.length >= 3) {
          setCompSel1(existing.compromisosComportamentales[0].competencia);
          setCompSel2(existing.compromisosComportamentales[1].competencia);
          setCompSel3(existing.compromisosComportamentales[2].competencia);
        }
      } else {
        // Initialize new evaluation record with default suggestions
        const newEval: Evaluacion1278 = {
          id: `${currentTeacher.cedula}__${selectedAnio}__${selectedPeriod}`,
          cedula: currentTeacher.cedula,
          anio: selectedAnio,
          periodo: selectedPeriod,
          evaluadorNombre: currentRectorName,
          evaluadorCedula: currentRectorDoc,
          fechaConcertacion: new Date().toISOString().substring(0, 10),
          horaConcertacion: '08:00 AM',
          lugarConcertacion: institutionName,
          compromisosFuncionales: SUGGESTED_FUNCTIONALS.map(f => ({ 
            ...f,
            contribucion: '',
            criterios: '',
            evidencias: ''
          })),
          compromisosComportamentales: [
            { competencia: COMPORTAMENTALES_OPCIONES[0], evidencias: '' },
            { competencia: COMPORTAMENTALES_OPCIONES[1], evidencias: '' },
            { competencia: COMPORTAMENTALES_OPCIONES[2], evidencias: '' }
          ],
          evidenciasAnexo2: [],
          evidenciasAnexo5: [],
          estado: 'Borrador',
          updatedAt: new Date().toISOString()
        };
        setActiveEvaluacion(newEval);
        setCompSel1(COMPORTAMENTALES_OPCIONES[0]);
        setCompSel2(COMPORTAMENTALES_OPCIONES[1]);
        setCompSel3(COMPORTAMENTALES_OPCIONES[2]);
      }
    } else {
      setActiveEvaluacion(null);
    }
  }, [currentTeacher, selectedPeriod, selectedAnio, evaluaciones, rectorName, rectorDocument, rectorDocumentExpedition, institutionName]);

  // Sync state to Supabase
  const syncEvaluacionesToSupabase = async (dataList: Evaluacion1278[]) => {
    try {
      // Check if table exists first by doing a lightweight query
      const { error: testErr } = await supabase.from('evaluaciones_1278').select('id').limit(1);
      if (testErr) {
        console.warn('evaluaciones_1278 table does not exist yet. Sync pending table creation.');
        return;
      }

      if (dataList.length > 0) {
        const payload = dataList.map(item => ({
          id: item.id,
          cedula: item.cedula,
          periodo: item.periodo,
          data: item,
          updated_at: new Date().toISOString()
        }));

        const { error } = await supabase
          .from('evaluaciones_1278')
          .upsert(payload, { onConflict: 'id' });

        if (error) throw error;
      }
    } catch (err) {
      console.warn('Automatic Supabase sync for evaluations bypassed:', err);
    }
  };

  const fetchConfigFromCockroach = async () => {
    try {
      const response = await fetch('/api/alvernia/config');
      const resData = await response.json();
      if (resData.success && resData.config) {
        const c = resData.config;
        if (c.institutionName) {
          setInstitutionName(c.institutionName);
          localStorage.setItem('alvernia_institution_name', c.institutionName);
        }
        if (c.institutionDane) {
          setInstitutionDane(c.institutionDane);
          localStorage.setItem('alvernia_institution_dane', c.institutionDane);
        }
        if (c.rectorName) {
          setRectorName(c.rectorName);
          localStorage.setItem('alvernia_rector_name', c.rectorName);
        }
        if (c.rectorDocument) {
          setRectorDocument(c.rectorDocument);
          localStorage.setItem('alvernia_rector_document', c.rectorDocument);
        }
        if (c.rectorDocumentExpedition) {
          setRectorDocumentExpedition(c.rectorDocumentExpedition);
          localStorage.setItem('alvernia_rector_document_expedition', c.rectorDocumentExpedition);
        }
        if (c.rectorSignature) {
          setRectorSignature(c.rectorSignature);
          localStorage.setItem('rector_signature_base64', c.rectorSignature);
        }
        if (c.habilitationDates) {
          setHabilitationDates(c.habilitationDates);
          localStorage.setItem('alvernia_habilitation_dates', JSON.stringify(c.habilitationDates));
        }
        console.log('Parámetros de configuración cargados desde CockroachDB');
      }
    } catch (err) {
      console.warn('No se pudo cargar la configuración de CockroachDB:', err);
    }
  };



  // Trigger manual pull/sync from Supabase and CockroachDB
  const fetchEvaluacionesFromSupabase = async () => {
    let pulled: Evaluacion1278[] = [];

    // Try fetching from CockroachDB first
    try {
      const response = await fetch('/api/evaluaciones');
      const resData = await response.json();
      if (resData.success && resData.evaluaciones && resData.evaluaciones.length > 0) {
        pulled = resData.evaluaciones;
        console.log('Evaluaciones cargadas desde CockroachDB');
      }
    } catch (dbErr) {
      console.warn('No se pudo leer de CockroachDB (cayendo a Supabase/Local):', dbErr);
    }

    // Fallback/Sync with Supabase if CockroachDB had no data
    if (pulled.length === 0) {
      try {
        const { data, error } = await supabase.from('evaluaciones_1278').select('data');
        if (!error && data && data.length > 0) {
          pulled = data.map(d => d.data);
        }
      } catch (e: any) {
        console.warn('Error fetching evaluations from Supabase:', e);
      }
    }

    if (pulled.length > 0) {
      // Migrate missing anio
      pulled = pulled.map(p => ({
        ...p,
        anio: p.anio || 2026
      }));

      setEvaluaciones(prev => {
        const merged = [...prev];
        pulled.forEach(item => {
          const idx = merged.findIndex(m => m.id === item.id);
          if (idx >= 0) {
            merged[idx] = item;
          } else {
            merged.push(item);
          }
        });
        return merged;
      });
      showToast('Datos sincronizados correctamente desde la base de datos central.');
    }
  };

  useEffect(() => {
    fetchEvaluacionesFromSupabase();
    fetchConfigFromCockroach();
  }, []);

  // Handle teacher login check
  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const cleanId = teacherCedulaInput.trim();
    if (!cleanId) return;

    // Search inside docentesEvaluacion list
    const found = docentesEvaluacion.find(emp => emp.cedula === cleanId);
    if (found) {
      if (!found.activo) {
        setLoginError('Este funcionario se encuentra inactivo en el sistema.');
        return;
      }
      setCurrentTeacher(found);
      setTeacherCedulaInput('');
      setPortalView('anexo2');
      showToast(`¡Bienvenido(a), ${found.nombre}!`);
    } else {
      setLoginError('Número de documento no registrado como funcionario de la institución.');
    }
  };

  // Update total area percentages and distribute equally among its competencies
  const handleAreaPercentageChange = (
    area: 'Académica' | 'Administrativa' | 'Comunitaria',
    newValue: number,
    isAdmin: boolean
  ) => {
    const targetEval = isAdmin ? selectedEvalForInspection : activeEvaluacion;
    if (!targetEval) return;

    const updatedFuncs = targetEval.compromisosFuncionales.map(cf => ({ ...cf }));

    // Helper to get actual percentage or default
    const getPercent = (cf: CompromisoFuncional) => cf.porcentaje !== undefined ? cf.porcentaje : (cf.area === 'Académica' ? 12.5 : 5.0);

    // Calculate sum of other areas
    const otherAreasSum = updatedFuncs
      .filter(cf => cf.area !== area)
      .reduce((sum, cf) => sum + getPercent(cf), 0);

    // Clamp the new area total so the overall total doesn't exceed 70%
    let allowedAreaPercent = newValue;
    if (otherAreasSum + newValue > 70) {
      allowedAreaPercent = Math.max(0, 70 - otherAreasSum);
      showToast(`⚠️ El porcentaje total de competencias funcionales no puede superar el 70%. Ajustado a ${allowedAreaPercent.toFixed(1)}%`);
    }

    const areaCompetencies = updatedFuncs.filter(cf => cf.area === area);
    const count = areaCompetencies.length;

    if (count > 0) {
      // Divide equally
      const share = Number((allowedAreaPercent / count).toFixed(2));
      // Adjust the last one to avoid floating point precision issue in sum
      let sumSet = 0;
      let countUpdated = 0;
      
      updatedFuncs.forEach((cf) => {
        if (cf.area === area) {
          countUpdated++;
          if (countUpdated === count) {
            // Last one gets the remaining difference
            cf.porcentaje = Number((allowedAreaPercent - sumSet).toFixed(2));
          } else {
            cf.porcentaje = share;
            sumSet += share;
          }
        }
      });
    }

    if (isAdmin) {
      setSelectedEvalForInspection({
        ...targetEval,
        compromisosFuncionales: updatedFuncs
      });
    } else {
      setActiveEvaluacion({
        ...targetEval,
        compromisosFuncionales: updatedFuncs
      });
    }
  };

  // Update functional commitments inside active evaluation
  const handleFunctionalChange = (index: number, field: 'contribucion' | 'criterios' | 'evidencias' | 'porcentaje', value: string | number) => {
    if (!activeEvaluacion) return;
    const isReadOnly = false;
    if (isReadOnly) return;
    const updatedFuncs = [...activeEvaluacion.compromisosFuncionales];
    if (field === 'porcentaje') {
      const targetVal = typeof value === 'number' ? value : parseFloat(value as string) || 0;
      
      // Calculate sum of other functional percentages
      const otherSum = updatedFuncs.reduce((sum, cf, idx) => {
        if (idx === index) return sum;
        const cfPercent = cf.porcentaje !== undefined ? cf.porcentaje : (cf.area === 'Académica' ? 12.5 : 5.0);
        return sum + cfPercent;
      }, 0);

      if (otherSum + targetVal > 70) {
        const allowedVal = Math.max(0, 70 - otherSum);
        updatedFuncs[index].porcentaje = allowedVal;
        showToast(`⚠️ No se puede superar el 70% total de competencias funcionales. Ajustado a ${allowedVal.toFixed(1)}%`);
      } else {
        updatedFuncs[index].porcentaje = targetVal;
      }
    } else {
      updatedFuncs[index][field] = value as string;
    }
    setActiveEvaluacion({
      ...activeEvaluacion,
      compromisosFuncionales: updatedFuncs
    });
  };

  // Update functional commitments inside admin review evaluation (selectedEvalForInspection)
  const handleAdminFunctionalChange = (index: number, field: 'contribucion' | 'criterios' | 'evidencias' | 'porcentaje', value: string | number) => {
    if (!selectedEvalForInspection) return;
    const updatedFuncs = [...selectedEvalForInspection.compromisosFuncionales];
    if (field === 'porcentaje') {
      const targetVal = typeof value === 'number' ? value : parseFloat(value as string) || 0;
      
      // Calculate sum of other functional percentages
      const otherSum = updatedFuncs.reduce((sum, cf, idx) => {
        if (idx === index) return sum;
        const cfPercent = cf.porcentaje !== undefined ? cf.porcentaje : (cf.area === 'Académica' ? 12.5 : 5.0);
        return sum + cfPercent;
      }, 0);

      if (otherSum + targetVal > 70) {
        const allowedVal = Math.max(0, 70 - otherSum);
        updatedFuncs[index].porcentaje = allowedVal;
        showToast(`⚠️ No se puede superar el 70% total de competencias funcionales. Ajustado a ${allowedVal.toFixed(1)}%`);
      } else {
        updatedFuncs[index].porcentaje = targetVal;
      }
    } else {
      updatedFuncs[index][field] = value as string;
    }
    
    const updatedEval = {
      ...selectedEvalForInspection,
      compromisosFuncionales: updatedFuncs,
      updatedAt: new Date().toISOString()
    };
    
    setSelectedEvalForInspection(updatedEval);
    
    // Sync to the global array as well
    setEvaluaciones(prev => prev.map(item => {
      if (item.id === updatedEval.id) {
        return updatedEval;
      }
      return item;
    }));
    
    // Persist with backend CockroachDB sync
    syncEvaluacionesToCockroach(updatedEval);
  };

  // Update comportamentales commitments
  const handleComportamentalChange = (index: number, field: 'competencia' | 'evidencias', value: string) => {
    if (!activeEvaluacion) return;
    const isReadOnly = false;
    if (isReadOnly) return;
    const updatedComps = [...activeEvaluacion.compromisosComportamentales];
    if (field === 'competencia') updatedComps[index].competencia = value;
    if (field === 'evidencias') updatedComps[index].evidencias = value;
    setActiveEvaluacion({
      ...activeEvaluacion,
      compromisosComportamentales: updatedComps
    });
  };

  // Update comportamentales inside admin review evaluation (selectedEvalForInspection)
  const handleAdminComportamentalChange = (index: number, field: 'competencia' | 'evidencias', value: string) => {
    if (!selectedEvalForInspection) return;
    const updatedComps = [...selectedEvalForInspection.compromisosComportamentales];
    if (field === 'competencia') updatedComps[index].competencia = value;
    if (field === 'evidencias') updatedComps[index].evidencias = value;
    
    const updatedEval = {
      ...selectedEvalForInspection,
      compromisosComportamentales: updatedComps,
      updatedAt: new Date().toISOString()
    };
    
    setSelectedEvalForInspection(updatedEval);
    
    // Sync to the global array as well
    setEvaluaciones(prev => prev.map(item => {
      if (item.id === updatedEval.id) {
        return updatedEval;
      }
      return item;
    }));
    
    // Persist with backend CockroachDB sync
    syncEvaluacionesToCockroach(updatedEval);
  };

  // Sync behaviors when dropdown selections change
  useEffect(() => {
    if (!activeEvaluacion) return;
    const updatedComps = [
      { competencia: compSel1, evidencias: activeEvaluacion.compromisosComportamentales[0]?.evidencias || '' },
      { competencia: compSel2, evidencias: activeEvaluacion.compromisosComportamentales[1]?.evidencias || '' },
      { competencia: compSel3, evidencias: activeEvaluacion.compromisosComportamentales[2]?.evidencias || '' }
    ];
    setActiveEvaluacion({
      ...activeEvaluacion,
      compromisosComportamentales: updatedComps
    });
  }, [compSel1, compSel2, compSel3]);

  // Save current evaluation as draft
  const handleSaveDraft = () => {
    if (!activeEvaluacion || !currentTeacher) return;
    const itemToSave = {
      ...activeEvaluacion,
      estado: 'Borrador' as const,
      updatedAt: new Date().toISOString()
    };

    setEvaluaciones(prev => {
      const filtered = prev.filter(e => e.id !== itemToSave.id);
      return [itemToSave, ...filtered];
    });

    syncEvaluacionesToCockroach(itemToSave);
    showToast('Borrador guardado correctamente en la base de datos (CockroachDB).');
  };

  // Submit evaluation for review
  const handleSubmitForReview = () => {
    if (!activeEvaluacion || !currentTeacher) return;

    // Date habilitation check
    const minHabilitatedDate = habilitationDates[selectedPeriod];
    if (minHabilitatedDate) {
      const todayStr = new Date().toISOString().substring(0, 10);
      const isPeriodHabilitated = todayStr >= minHabilitatedDate;
      if (!isPeriodHabilitated) {
        const parts = minHabilitatedDate.split('-');
        const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : minHabilitatedDate;
        alert(`⚠️ No se puede enviar el Seguimiento ${selectedPeriod} todavía.\n\nEste seguimiento estará habilitado oficialmente para envío a partir del ${formattedDate}.`);
        return;
      }
    }

    // Validate functional percentage sum is exactly 70% before submitting
    const acadSum = activeEvaluacion.compromisosFuncionales
      .filter(c => c.area === 'Académica')
      .reduce((acc, c) => acc + (c.porcentaje ?? 12.5), 0);
    const adminSum = activeEvaluacion.compromisosFuncionales
      .filter(c => c.area === 'Administrativa')
      .reduce((acc, c) => acc + (c.porcentaje ?? 5.0), 0);
    const comunSum = activeEvaluacion.compromisosFuncionales
      .filter(c => c.area === 'Comunitaria')
      .reduce((acc, c) => acc + (c.porcentaje ?? 5.0), 0);
    const totalSum = acadSum + adminSum + comunSum;

    if (Math.abs(totalSum - 70) > 0.01) {
      showToast(`⚠️ No se puede enviar: El total de los porcentajes funcionales debe ser exactamente 70% (actualmente es ${totalSum.toFixed(1)}%).`);
      return;
    }

    // Validate that no texts are empty
    const isS1 = selectedPeriod === 1;
    if (isS1) {
      const missingFunctionalNames = activeEvaluacion.compromisosFuncionales
        .filter(c => !c.contribucion?.trim() || !c.criterios?.trim() || !c.evidencias?.trim())
        .map(c => c.area);
        
      const missingComportamentalNames = activeEvaluacion.compromisosComportamentales
        .filter(c => !c.evidencias?.trim())
        .map(c => c.competencia);
        
      if (missingFunctionalNames.length > 0 || missingComportamentalNames.length > 0) {
        const missingList = [...missingFunctionalNames, ...missingComportamentalNames].join(', ');
        showToast(`⚠️ No se puede enviar. Faltan datos en las siguientes áreas: ${missingList}`);
        return;
      }
    }

    const itemToSave = {
      ...activeEvaluacion,
      estado: 'Enviado' as const,
      updatedAt: new Date().toISOString()
    };

    setEvaluaciones(prev => {
      const filtered = prev.filter(e => e.id !== itemToSave.id);
      return [itemToSave, ...filtered];
    });

    syncEvaluacionesToCockroach(itemToSave);
    showToast('Seguimiento enviado a revisión y guardado en la base de datos (CockroachDB).');
  };

  // Anexo 2: Add row of evidence
  const handleAddEvidenceRow = () => {
    if (!activeEvaluacion) return;
    const isReadOnly = false;
    if (isReadOnly) return;
    const newRow: EvidenciaFila = {
      id: `row__${Date.now()}__${Math.random().toString(36).substr(2, 4)}`,
      folio: '',
      fecha: new Date().toISOString().substring(0, 10),
      tipo: 'D',
      nombre: '',
      competenciasSoportadas: ''
    };

    setActiveEvaluacion({
      ...activeEvaluacion,
      evidenciasAnexo2: [...activeEvaluacion.evidenciasAnexo2, newRow]
    });
  };

  // Anexo 2: Remove row of evidence
  const handleRemoveEvidenceRow = (id: string) => {
    if (!activeEvaluacion) return;
    const isReadOnly = false;
    if (isReadOnly) return;
    setActiveEvaluacion({
      ...activeEvaluacion,
      evidenciasAnexo2: activeEvaluacion.evidenciasAnexo2.filter(row => row.id !== id)
    });
  };

  // Anexo 2: Handle changes on row fields
  const handleEvidenceRowChange = (id: string, field: keyof EvidenciaFila, value: any) => {
    if (!activeEvaluacion) return;
    const isReadOnly = false;
    if (isReadOnly) return;
    const updatedRows = activeEvaluacion.evidenciasAnexo2.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value };
      }
      return row;
    });
    setActiveEvaluacion({
      ...activeEvaluacion,
      evidenciasAnexo2: updatedRows
    });
  };

  const handleToggleSoporteFisico = (compName: string, incluido: boolean) => {
    if (!activeEvaluacion) return;
    
    if (!incluido) {
      handleRemoveForCompetency(compName);
      return;
    }

    const currentRows = activeEvaluacion.evidenciasAnexo2 || [];
    const existingRowIndex = currentRows.findIndex(
      row => row.competenciasSoportadas?.toLowerCase().trim() === compName?.toLowerCase().trim()
    );

    if (existingRowIndex >= 0) return; // Ya existe

    const newRow: EvidenciaFila = {
      id: `comp_ev__${Date.now()}__${Math.random().toString(36).substr(2, 5)}`,
      folio: 'N/A',
      fecha: new Date().toISOString().substring(0, 10),
      tipo: 'D',
      nombre: `Evidencia de soporte - ${compName}`,
      competenciasSoportadas: compName,
      fileName: 'SOPORTE_FISICO_COMPILADO',
      fileSize: 0,
      fileType: 'FISICO',
      fileBase64: 'FISICO'
    };

    setActiveEvaluacion({
      ...activeEvaluacion,
      evidenciasAnexo2: [...currentRows, newRow]
    });
  };

  // Upload support file for a specific competency in Seguimiento 2 & 3
  const handleUploadForCompetency = async (e: React.ChangeEvent<HTMLInputElement>, compName: string) => {
    const file = e.target.files?.[0];
    if (!file || !activeEvaluacion) return;

    // Validate size limit (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo supera el límite permitido de 10MB.');
      return;
    }

    const rowId = `comp_ev__${Date.now()}__${Math.random().toString(36).substr(2, 5)}`;
    showToast(`Cargando soporte de "${compName}" a la nube (R2)...`);

    try {
      const publicUrl = await uploadFileToR2(file, 'soportes-funcionales');

      const existingRowIndex = activeEvaluacion.evidenciasAnexo2.findIndex(
        row => row.competenciasSoportadas.toLowerCase().trim() === compName.toLowerCase().trim()
      );

      const newRow: EvidenciaFila = {
        id: rowId,
        folio: 'N/A',
        fecha: new Date().toISOString().substring(0, 10),
        tipo: 'D',
        nombre: `Evidencia de soporte - ${compName}`,
        competenciasSoportadas: compName,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileBase64: publicUrl // Store R2 URL instead of base64
      };

      let updatedRows = [...activeEvaluacion.evidenciasAnexo2];
      if (existingRowIndex >= 0) {
        updatedRows[existingRowIndex] = newRow;
      } else {
        updatedRows.push(newRow);
      }

      setActiveEvaluacion({
        ...activeEvaluacion,
        evidenciasAnexo2: updatedRows
      });

      showToast(`✓ Soporte de "${compName}" guardado en la nube (R2).`);
    } catch (err) {
      console.error('R2 cloud storage failed:', err);
      showToast('Error al subir el archivo a R2.');
    }
  };

  const handleRemoveForCompetency = (compName: string) => {
    if (!activeEvaluacion) return;
    const currentRows = activeEvaluacion.evidenciasAnexo2 || [];
    const updatedRows = currentRows.filter(
      row => row.competenciasSoportadas?.toLowerCase().trim() !== compName?.toLowerCase().trim()
    );
    setActiveEvaluacion({
      ...activeEvaluacion,
      evidenciasAnexo2: updatedRows
    });
    showToast(`✓ Soporte de "${compName}" removido.`);
  };

  // Anexo 2: Handle File Upload inside a row
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, rowId: string) => {
    const file = e.target.files?.[0];
    if (!file || !activeEvaluacion) return;

    if (selectedPeriod === 1) {
      alert("En el Primer Seguimiento no se suben archivos físicos de evidencia. Solo se registran y describen en la tabla (Anexos 2 y 5). Los archivos de soporte se cargan en el Segundo Seguimiento.");
      return;
    }

    // Validate size limit (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo supera el límite permitido de 10MB.');
      return;
    }

    showToast(`Cargando "${file.name}" a la nube (R2)...`);

    try {
      const publicUrl = await uploadFileToR2(file, 'anexo2');

      const updatedRows = activeEvaluacion.evidenciasAnexo2.map(row => {
        if (row.id === rowId) {
          return {
            ...row,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            fileBase64: publicUrl // Store R2 URL instead of base64
          };
        }
        return row;
      });

      setActiveEvaluacion({
        ...activeEvaluacion,
        evidenciasAnexo2: updatedRows
      });

      showToast(`✓ Archivo guardado de forma permanente en la nube (R2).`);
    } catch (err) {
      console.error('R2 cloud storage failed:', err);
      showToast('Error al subir el archivo a R2.');
    }
  };

  // Download uploaded file from row
  const handleDownloadFile = (row: EvidenciaFila) => {
    if (!row.fileBase64 || !row.fileName) return;

    if (row.fileBase64.startsWith('http://') || row.fileBase64.startsWith('https://')) {
      window.open(row.fileBase64, '_blank');
      return;
    }

    const link = document.createElement('a');
    link.href = row.fileBase64;
    link.download = row.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- ANEXO 5 ---
  const handleAddEvidenceRowAnexo5 = () => {
    if (!activeEvaluacion) return;
    const isReadOnly = false;
    if (isReadOnly) return;
    const newRow: EvidenciaFila = {
      id: `row__${Date.now()}__${Math.random().toString(36).substr(2, 4)}`,
      folio: '',
      fecha: new Date().toISOString().substring(0, 10),
      tipo: 'D',
      nombre: '',
      competenciasSoportadas: ''
    };

    setActiveEvaluacion({
      ...activeEvaluacion,
      evidenciasAnexo5: [...(activeEvaluacion.evidenciasAnexo5 || []), newRow]
    });
  };

  const handleRemoveEvidenceRowAnexo5 = (id: string) => {
    if (!activeEvaluacion) return;
    const isReadOnly = false;
    if (isReadOnly) return;
    setActiveEvaluacion({
      ...activeEvaluacion,
      evidenciasAnexo5: (activeEvaluacion.evidenciasAnexo5 || []).filter(row => row.id !== id)
    });
  };

  const handleEvidenceRowChangeAnexo5 = (id: string, field: keyof EvidenciaFila, value: any) => {
    if (!activeEvaluacion) return;
    const isReadOnly = false;
    if (isReadOnly) return;
    const updatedRows = (activeEvaluacion.evidenciasAnexo5 || []).map(row => {
      if (row.id === id) {
        return { ...row, [field]: value };
      }
      return row;
    });
    setActiveEvaluacion({
      ...activeEvaluacion,
      evidenciasAnexo5: updatedRows
    });
  };

  const handlePortfolioPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeEvaluacion) return;

    if (file.type !== 'application/pdf') {
      alert('Solo se admiten documentos compilados en formato PDF.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('El archivo supera el límite de 20MB.');
      return;
    }

    showToast(`Preparando carga de portafolio consolidado a R2...`);

    try {
      const publicUrl = await uploadFileToR2(file, 'portafolios');
      
      const updatedEval = {
        ...activeEvaluacion,
        portfolioPdfUrl: publicUrl,
        portfolioPdfName: file.name,
        updatedAt: new Date().toISOString()
      };
      setActiveEvaluacion(updatedEval);
      
      setEvaluaciones(prev => {
        const filtered = prev.filter(e => e.id !== updatedEval.id);
        return [updatedEval, ...filtered];
      });

      syncEvaluacionesToCockroach(updatedEval);
      showToast('✓ Portafolio de evidencias PDF consolidado y guardado en la nube.');
    } catch (err) {
      console.error('R2 cloud storage failed:', err);
      showToast('Error al subir el archivo a R2.');
    }
  };

  const handleRemovePortfolioPdf = () => {
    if (!activeEvaluacion) return;
    const isReadOnly = false;
    if (isReadOnly) return;
    if (!confirm('¿Está seguro de que desea eliminar el portafolio PDF cargado?')) return;
    
    const updatedEval = {
      ...activeEvaluacion,
      portfolioPdfUrl: undefined,
      portfolioPdfName: undefined,
      updatedAt: new Date().toISOString()
    };
    setActiveEvaluacion(updatedEval);
    setEvaluaciones(prev => {
      const filtered = prev.filter(e => e.id !== updatedEval.id);
      return [updatedEval, ...filtered];
    });
    syncEvaluacionesToCockroach(updatedEval);
    showToast('Portafolio PDF removido con éxito.');
  };

  // Admin review actions
  const handleAdminChangeStatus = (evalId: string, newStatus: 'Aprobado' | 'Corregir') => {
    let updatedEval: any = null;
    setEvaluaciones(prev => prev.map(item => {
      if (item.id === evalId) {
        updatedEval = {
          ...item,
          estado: newStatus,
          observacionesAdmin: adminFeedback,
          updatedAt: new Date().toISOString()
        };
        return updatedEval;
      }
      return item;
    }));

    if (selectedEvalForInspection) {
      setSelectedEvalForInspection({
        ...selectedEvalForInspection,
        estado: newStatus,
        observacionesAdmin: adminFeedback
      });
    }

    if (updatedEval) {
      syncEvaluacionesToCockroach(updatedEval);
    }

    showToast(`Estado de la evaluación actualizado a: ${newStatus}`);
  };

  const handleAdminDeleteEvaluation = async (evalId: string) => {
    if (!window.confirm('¿Está seguro que desea eliminar completamente este registro de evaluación? Esta acción borrará los datos falsos y no se puede deshacer.')) return;
    
    // Find the record to know cedula and periodo
    const recordToDelete = evaluaciones.find(e => e.id === evalId);
    if (!recordToDelete) return;

    // Remove locally by ID to ensure exact match and avoid deleting across different years
    setEvaluaciones(prev => prev.filter(item => item.id !== recordToDelete.id));
    
    if (selectedEvalForInspection?.id === evalId) {
      setSelectedEvalForInspection(null);
    }
    
    showToast('Registro de evaluación eliminado con éxito.');

    // Remove from CockroachDB backend using custom endpoint to delete all duplicates
    try {
      await fetch(`/api/evaluaciones/teacher/${recordToDelete.cedula}/${recordToDelete.periodo}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Error eliminando del backend CockroachDB:', err);
    }
    
    // Remove from Supabase backup
    try {
      await supabase.from('evaluaciones_1278')
        .delete()
        .eq('id', recordToDelete.id);
    } catch (err) {
      console.warn('Error eliminando de Supabase:', err);
    }
  };

  // --- COCKROACHDB PERSISTENCE SYNCHRONIZER ---
  const syncEvaluacionesToCockroach = async (item: Evaluacion1278) => {
    try {
      const response = await fetch('/api/evaluaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      const resData = await response.json();
      if (resData.success) {
        console.log('Sincronizado exitosamente con CockroachDB');
      } else {
        console.error('Error guardando en CockroachDB:', resData.error || resData.message);
        showToast('⚠️ Hubo un error guardando en la base de datos. ' + (resData.error || ''));
      }
    } catch (err: any) {
      console.warn('Fallo guardado en CockroachDB:', err);
      showToast('⚠️ Error de conexión con la base de datos.');
    }
  };

  // --- ADMIN EXCEL LOADER FOR TEACHERS ---
  const handleExcelDocentesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<any>(worksheet);

        if (rows.length === 0) {
          throw new Error('El archivo Excel está vacío o no tiene el formato correcto.');
        }

        const newEmployees: DocenteEvaluacion[] = rows.map((r, i) => {
          const keys = Object.keys(r);
          const getVal = (keywords: string[]) => {
            const key = keys.find(k => keywords.some(kw => k.toUpperCase().includes(kw)));
            return key ? String(r[key] || '').trim() : '';
          };

          const cedulaVal = getVal(['CEDULA', 'CÉDULA', 'DOCU', 'IDENTI']);
          const nombreVal = getVal(['NOMBRE', 'EMPLEADO']);
          
          if (!cedulaVal || !nombreVal) return null;

          const cargoVal = getVal(['CARGO']);
          const sedeVal = getVal(['SEDE']);

          return {
            id: `emp__${cedulaVal}`,
            nombre: nombreVal,
            cedula: cedulaVal,
            cargo: cargoVal || 'Docente de Aula',
            sedeTrabajo: sedeVal || 'Sede Principal',
            dificilAcceso: (r.DificilAcceso || r.DIFICIL_ACCESO || r.Dificil || '').toString().toLowerCase().includes('si') ? 'Si' : 'No',
            horasAula: Number(r.HorasAula || r.HORAS_AULA || 22),
            horasLibres: Number(r.HorasLibres || r.HORAS_LIBRES || 8),
            areaDesempeno: String(r.Area || r.AREA || r.AreaDesempeno || 'Básica Primaria').trim(),
            tipoNombramiento: String(r.TipoNombramiento || r.Nombramiento || 'Propiedad').trim(),
            activo: true
          };
        }).filter(Boolean) as DocenteEvaluacion[];

        if (newEmployees.length === 0) {
          throw new Error('No se encontraron registros de docentes válidos (con nombre y cédula). El Excel debe contener las columnas: Nombre y Cedula.');
        }
        // 1. Write to CockroachDB bulk endpoint
        const bulkRes = await fetch('/api/docentesEvaluacion/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docentesEvaluacion: newEmployees })
        });
        const bulkData = await bulkRes.json();
        if (!bulkData.success) {
          throw new Error('Error guardando en CockroachDB: ' + (bulkData.error || bulkData.message));
        }

        if (setDocentesEvaluacion) {
          setDocentesEvaluacion(newEmployees);
        }

        showToast(`¡Se han cargado y guardado ${newEmployees.length} docentes desde Excel con éxito! Refrescando...`);
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } catch (err: any) {
        alert(`Error al procesar archivo Excel: ${err.message || err}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- DOWNLOAD PORTAFOLIO WORD MODEL FORMAT (.doc) ---
  const handleExportWordModelFormat = (teacher: DocenteEvaluacion) => {
    const customLogo = localStorage.getItem('iea_custom_logo') || '';

    const defaultCompetencies = [
      { area: 'ACADÉMICA', comp: 'DOMINIO CURRICULAR', cont: 'Preparador de clases grado tercero área de lenguaje en medio digital PDF', ev: 'Fotocopia planeador de clases grado tercero área de lenguaje en medio digital PDF', desc: 'Demostrar la planificación y organización de las clases de Lenguaje para el grado tercero, asegurando una educación de calidad y dando cumplimiento a los planes de estudio.' },
      { area: 'ACADÉMICA', comp: 'PLANEACIÓN Y ORGANIZACIÓN ACADÉMICA', cont: 'Apoyo a la ejecución del proyecto LEO (lectura, escritura y oralidad) por medio de talleres en clases', ev: 'Fotocopia de talleres y registro fotográfico de trabajo en clases proyecto LEO', desc: 'Trabajar en el desarrollo y la implementación del proyecto LEO en el aula, destacando el compromiso con la mejora de las habilidades lingüísticas y comunicativas de los estudiantes, alcanzando con ello una mejor comprensión de lectura crítica e inferencia en la vida.' },
      { area: 'ACADÉMICA', comp: 'PEDAGÓGICA Y DIDÁCTICA', cont: 'Elaboración y adaptación de material didáctico para grado preescolar', ev: 'Registro fotográfico de elaboración de material didáctico para grado preescolar', desc: 'Elaboración de material didáctico con recursos educativos del entorno adaptados a las necesidades de los estudiantes de preescolar, el cual permitió personalizar el aprendizaje de las habilidades individuales de cada estudiante logrando un aprendizaje participativo y significativo.' },
      { area: 'ACADÉMICA', comp: 'EVALUACIÓN DE APRENDIZAJE', cont: 'Adaptación de talleres de inclusión en el área de lenguaje para grado tercero', ev: 'Fotocopia talleres de inclusión y registro fotográfico con estudiantes de grado tercero', desc: 'A través de estos talleres, se puede demostrar claramente el esfuerzo y progreso en relación con los compromisos acordados, tanto del estudiante como del padre de familia en el proceso educativo inclusivo.' },
      { area: 'ADMINISTRATIVA', comp: 'USO DE RECURSOS', cont: 'Adecuación de espacios en el aula de clases para el uso adecuado de las herramientas TIC', ev: 'Registro fotográfico de adecuación de espacios y uso de las herramientas TIC', desc: 'Se puede observar que los niños usan los computadores para dibujar, escribir, buscar información, también podemos verlos utilizando la pantalla digital evidenciando así que las herramientas TIC se usan para fines educativos.' },
      { area: 'ADMINISTRATIVA', comp: 'SEGUIMIENTO DE PROCESOS', cont: 'Cumplir con las actividades programadas en el cronograma 2025 (día de la mujer, elección de gobierno escolar y encuentro cultural institucional)', ev: 'Registro fotográfico encuentro cultural institucional', desc: 'Este encuentro cultural institucional promueve el liderazgo, la interculturalidad, la inclusión además de crear espacios para fomentar la creatividad, el intercambio de expresiones artísticas, conocimientos, tradiciones y costumbres.' },
      { area: 'COMUNITARIA', comp: 'COMUNICACIÓN INSTITUCIONAL', cont: 'Acompañamiento al proyecto escuela para padres', ev: 'Asistencia y registro fotográfico de talleres lúdicos pedagógicos con padres de familia en la ejecución del proyecto escuela de padres', desc: 'Mostrar la participación de los padres de familia y su compromiso con la educación de sus hijos.' },
      { area: 'COMUNITARIA', comp: 'INTERACCIÓN CON LA COMUNIDAD Y EL ENTORNO', cont: 'Participación de los padres de familia en el mantenimiento del entorno escolar', ev: 'Registro fotográfico y asistencias de padres de familia en el mantenimiento del entorno escolar', desc: 'Participación de los padres de familia en el cuidado y mantenimiento del entorno escolar.' },
      { area: 'COMPORTAMENTALES', comp: 'COMPROMISO SOCIAL E INSTITUCIONAL', cont: 'Apoyar en las diferentes actividades realizadas en la institución durante el año escolar 2025', ev: 'Registro fotográfico de participación en actividades institucionales.', desc: 'Fomentar el trabajo en equipo, la comunicación y participación de los docentes en las actividades institucionales.' },
      { area: 'COMPORTAMENTALES', comp: 'TRABAJO EN EQUIPO', cont: 'Ejecución del proyecto ambiental escolar, en convenio con Confamiliar del Putumayo', ev: 'Fotocopia cronograma de actividades y registro fotográfico desarrollo proyecto ambiental escolar', desc: 'Destacar la importancia y los beneficios de la huerta escolar en la formación escolar de los estudiantes, logrando estimular el compañerismo, trabajo en equipo y la educación transversal, además de reconocer la importancia de una alimentación balanceada.' },
      { area: 'COMPORTAMENTALES', comp: 'LIDERAZGO', cont: 'Desarrollo del plan de Bilingüismo con estudiantes de la sede', ev: 'Registro fotográfico ejecución plan de Bilingüismo', desc: 'Con el proyecto de bilingüismo se logró fortalecer la segunda lengua (inglés) adaptándolo al entorno y a la necesidad de motivar una cultura ambiental.' }
    ];

    let competenciesHtml = '';
    defaultCompetencies.forEach((c) => {
      competenciesHtml += `
        <div>
          <br/><br/>
          <p style="text-align: center; font-size: 12pt; font-weight: bold; text-transform: uppercase;">
            ${c.area === 'COMPORTAMENTALES' ? 'COMPETENCIAS COMPORTAMENTALES' : 'ÁREA DE GESTIÓN: ' + c.area}
          </p><br/>
          <p style="text-align: center; font-size: 11pt; font-weight: bold; text-transform: uppercase;">
            COMPETENCIA: ${c.comp}
          </p><br/>
          
          <p style="font-size: 11pt; line-height: 1.5; text-align: justify;">
            <b>Contribución Individual:</b> ${c.cont}
          </p><br/>
          <p style="font-size: 11pt; line-height: 1.5; text-align: justify;">
            <b>Evidencia:</b> ${c.ev}
          </p><br/>
          <p style="font-size: 11pt; line-height: 1.5; text-align: justify;">
            <b>Descripción de Evidencia:</b> ${c.desc}
          </p><br/><br/>

          <p style="text-align: center; font-size: 11pt; font-weight: bold; text-transform: uppercase;">
            REGISTRO FOTOGRÁFICO
          </p><br/><br/><br/><br/><br/><br/>
          
          <p style="font-size: 11pt; font-weight: bold; font-style: italic;">
            Fecha: DD/MM/AAAA
          </p><br/><br/>
        </div>
      `;
    });

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title>Portafolio Registro de Evidencias Decreto 1278</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 8.5in 11.0in;
            margin: 1.2in 0.6in 1.0in 0.6in;
            mso-header-margin: .5in;
            mso-footer-margin: .5in;
            mso-header: h1;
            mso-footer: f1;
          }
          div.Section1 {
            page: Section1;
          }
          p.MsoFooter, li.MsoFooter, div.MsoFooter {
            margin: 0in !important;
            margin-bottom: .0001pt !important;
            mso-margin-top-alt: 0in !important;
            mso-margin-bottom-alt: 0in !important;
            mso-padding-alt: 0in !important;
            mso-pagination: widow-orphan;
            font-family: 'Arial', sans-serif;
          }
          p, li, .MsoNormal, td, th, div, span {
            margin: 0in !important;
            margin-bottom: .0001pt !important;
            mso-margin-top-alt: 0in !important;
            mso-margin-bottom-alt: 0in !important;
            mso-padding-alt: 0in !important;
          }
          body { font-family: 'Arial', sans-serif; font-size: 10pt; line-height: 1.5; color: #000; }
          .cover { padding: 40px 25px; height: 100%; text-align: center; margin: 20px; }
          .title-cover { font-size: 13pt; font-weight: bold; margin-top: 80px; margin-bottom: 5px; text-transform: uppercase; }
          .subtitle-cover { font-size: 13pt; font-weight: bold; margin-bottom: 80px; }
          .presenter { font-size: 11pt; margin-top: 100px; line-height: 1.8; font-weight: bold; text-transform: uppercase; }
          .footer-cover { font-size: 11pt; font-weight: bold; margin-top: 120px; line-height: 1.6; }
          .section-title { font-size: 12pt; font-weight: bold; text-align: center; margin-top: 30px; margin-bottom: 25px; text-transform: uppercase; }
          .intro-text { font-size: 10pt; line-height: 1.6; text-align: justify; }
          .header-title-text { font-family: 'Arial', sans-serif; font-weight: bold; color: #15803d; text-transform: uppercase; }
          
          /* Hide native header and footer in Web Layout / Fallback Viewers */
          @media screen {
            #h1, #f1 { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="Section1">
          <!-- NATIVE WORD HEADER -->
          <div style="mso-element:header" id="h1">
            <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 8px;">
              <tr style="border: none;">
                <td style="width: 15%; border: none; text-align: left; vertical-align: middle; padding: 0;" align="left">
                  ${customLogo ? `
                    <img src="${customLogo}" width="55" height="55" style="max-height: 55px; max-width: 55px; object-fit: contain; display: block; margin: 0 auto;" alt="Logo" />
                  ` : `
                    <div style="border: 1.5pt solid #15803d; padding: 6px; font-size: 8pt; font-weight: bold; text-align: center; color: #15803d; width: 45px; line-height: 1.1; margin: 0 auto;">
                      I.E.<br/>ALV
                    </div>
                  `}
                </td>
                <td style="width: 70%; border: none; text-align: center; vertical-align: middle; padding: 0;" align="center">
                  <p class="header-title-text" style="font-size: 11pt; margin: 0; line-height: 1.25; color: #15803d; text-align: center; font-weight: bold;" align="center">
                    ${institutionName || 'INSTITUCIÓN EDUCATIVA ALVERNIA'}
                  </p>
                  <p style="font-size: 8pt; font-weight: bold; color: #15803d; margin: 1px 0 0 0; line-height: 1.2; text-align: center; text-transform: uppercase;" align="center">
                    ${educationalLevel || 'NIVEL PREESCOLAR &ndash; B&Aacute;SICA PRIMARIA Y MEDIA ACAD&Eacute;MICA'}
                  </p>
                  <p style="font-size: 7pt; font-weight: bold; color: #374151; margin: 1px 0 0 0; line-height: 1.2; text-align: center; text-transform: uppercase;" align="center">
                    ${calendario || 'CALENDARIO A'} &ndash; C&Oacute;DIGO DANE ${institutionDane || '186568000567'} &ndash; NIT. ${institutionNit || '891201897-5'}
                  </p>
                </td>
                <td style="width: 15%; border: none;"></td>
              </tr>
            </table>
          </div>

          <!-- COVER PAGE -->
          <div class="cover">
            <br/><br/><br/>
            <p style="text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 5px;">REGISTRO DE EVIDENCIAS DECRETO 1278</p>
            <p style="text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 5px;">02 SEGUIMIENTO</p>
            
            <br/><br/><br/><br/><br/><br/>
            
            <p style="text-align: center; font-size: 12pt; font-weight: bold; margin-bottom: 5px;">PRESENTADO POR</p>
            <p style="text-align: center; font-size: 12pt; font-weight: bold; margin-bottom: 5px; text-transform: uppercase;">${teacher.nombre}</p>
            <p style="text-align: center; font-size: 12pt; font-weight: bold; margin-bottom: 5px; text-transform: uppercase;">${teacher.cargo || 'DOCENTE DE AULA'}</p>

            <br/><br/><br/><br/><br/><br/><br/>

            <div>
              ${customLogo ? `
                <img src="${customLogo}" width="90" height="90" style="max-height: 90px; max-width: 90px; object-fit: contain; display: block; margin: 0 auto;" alt="Logo" />
              ` : `
                <div style="border: 2pt solid #15803d; padding: 10px; font-size: 12pt; font-weight: bold; text-align: center; color: #15803d; width: 60px; line-height: 1.1; margin: 0 auto;">
                  I.E.<br/>ALV
                </div>
              `}
            </div>

            <p style="text-align: center; font-size: 12pt; font-weight: bold; margin-top: 5px; margin-bottom: 5px; text-transform: uppercase;">${institutionName}</p>
            <p style="text-align: center; font-size: 12pt; font-weight: bold; margin-bottom: 5px;">${footerCity || 'Puerto Asís - Putumayo'}</p>
            <p style="text-align: center; font-size: 12pt; font-weight: bold;">2026</p>
          </div>

          <!-- INTRODUCTION PAGE -->
          <br clear="all" style="mso-special-character:line-break;page-break-before:always" />
          <br/><br/>
          <div>
            <p style="text-align: center; font-size: 12pt; font-weight: bold;">INTRODUCCIÓN</p>
            <br/>
            <p style="font-size: 11pt; line-height: 1.6; text-align: justify;">
              La evaluación anual de desempeño laboral docente permite verificar permanentemente el trabajo realizado por los educadores identificando fortalezas y aspectos de mejoramiento. El presente documento recoge de manera resumida algunas de las actividades desarrolladas en mi actividad como docente en la ${institutionName} – sede ${teacher.sedeTrabajo || 'Puerto Unión'}, dichas actividades están registradas en el anexo 2 (Acta de acuerdo y registro de evidencias entre evaluador y evaluado) y el anexo 5 (Resumen de competencias, contribuciones, criterios y evidencias de docentes).
            </p>
          </div>

          <!-- COMPETENCY SHEETS -->
          ${competenciesHtml}
          
          <!-- TEACHER SIGNATURE AT THE END -->
          <br clear="all" style="mso-special-character:line-break;page-break-before:always" />
          <br/><br/><br/><br/><br/>
          <div style="width: 100%; text-align: center; margin-top: 50px;">
            <table style="width: 100%; border: none;">
              <tr>
                <td style="border: none; text-align: center;" align="center">
                  ${teacher.firmaDocente ? `
                    <div style="margin-bottom: 5px; min-height: 65px;">
                      <img src="${teacher.firmaDocente}" width="160" height="60" style="max-height: 60px; max-width: 160px; object-fit: contain; display: block; margin: 0 auto;" />
                    </div>
                  ` : `
                    <div style="height: 60px; border-bottom: 1px solid #000; width: 250px; margin: 0 auto; margin-bottom: 10px;"></div>
                  `}
                  <p style="font-size: 11pt; font-weight: bold; margin: 0; color: #000000; text-align: center;">Firma del Docente</p>
                  <p style="font-size: 11pt; font-weight: bold; margin: 2px 0 0 0; text-transform: uppercase; color: #000000; text-align: center;">
                    ${teacher.nombre}
                  </p>
                  <p style="font-size: 11pt; font-weight: bold; text-transform: uppercase; margin: 2px 0 0 0; color: #000000; text-align: center;">
                    ${teacher.cargo || 'DOCENTE DE AULA'}
                  </p>
                  <p style="font-size: 10pt; margin: 2px 0 0 0; color: #4b5563; text-align: center;">
                    C.C. ${teacher.cedula}
                  </p>
                </td>
              </tr>
            </table>
          </div>

          <!-- NATIVE WORD FOOTER -->
          <div style="mso-element:footer" id="f1">
            <table style="width: 100%; border-collapse: collapse; border: none;">
              <tr style="border: none;">
                <td style="border: none; border-top: 1px solid #cbd5e1; padding-top: 6px; text-align: center;" align="center">
                  <p class="MsoFooter" style="font-weight: bold; font-style: italic; color: #16a34a; font-size: 8pt; text-align: center; margin: 0;" align="center">
                    &ldquo;${footerMotto || 'Brindamos una educación humanística y académica para la excelencia de un ser humano integral'}&rdquo;
                  </p>
                  <p class="MsoFooter" style="font-size: 7.5pt; color: #4b5563; text-align: center; margin: 2px 0 0 0;" align="center">
                    ${footerAddress || 'Barrio San Martin Carrera 16 No. 12 – 77'} | ${footerEmails || 'alvernia@sedputumayo.gov.co – rectoralvernia@gmail.com'} &ndash; ${footerWebsite || 'www.ie-alvernia.edu.co'}
                  </p>
                  <p class="MsoFooter" style="font-size: 7.5pt; color: #4b5563; text-align: center; margin: 1px 0 0 0;" align="center">
                    ${footerCity || 'Puerto Asís - Putumayo'}
                  </p>
                </td>
              </tr>
            </table>
          </div>
        </div>
      </body>
      </html>
    `;

    downloadWordBlob(htmlContent, `Modelo_Formato_Evidencias_1278_${teacher.nombre.replace(/\s+/g, '_')}.doc`);
    showToast('Modelo de Portafolio de Evidencias (Word) descargado con éxito.');
  };

  // Helper to format date in Spanish
  const formatFechaEnEspanol = (fechaStr: string) => {
    if (!fechaStr) return { dia: '', mes: '', anio: '', completo: '' };
    try {
      const parts = fechaStr.split('-');
      if (parts.length >= 3) {
        const year = parts[0];
        const monthNum = parseInt(parts[1], 10);
        const day = parseInt(parts[2].substring(0, 2), 10);
        
        const meses = [
          'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
          'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];
        const mesName = meses[monthNum - 1] || '';
        return {
          dia: day.toString(),
          mes: mesName,
          anio: year,
          completo: `${day} de ${mesName} de ${year}`
        };
      }
    } catch (e) {
      console.warn('Error formatting date:', e);
    }
    return { dia: '', mes: '', anio: '', completo: fechaStr };
  };

  // --- EXPORT TO MICROSOFT WORD (.doc) ---
  const handleExportWordActa = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {
    const customLogo = localStorage.getItem('iea_custom_logo') || '';
    const activeRectorSignature = rectorSignature || localStorage.getItem('rector_signature_base64') || localStorage.getItem('iea_custom_signature') || '';
    const { dia, mes, anio, completo } = formatFechaEnEspanol(evalDoc.fechaConcertacion);
    const hora = evalDoc.horaConcertacion || '08:00 AM';
    const lugar = evalDoc.lugarConcertacion || institutionName || 'INSTITUCIÓN EDUCATIVA ALVERNIA';

    const functionalCommitments = evalDoc.compromisosFuncionales || [];

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title>Acta de Concertación de Compromisos</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 8.5in 11.0in;
            margin: 1.0in 0.6in 1.0in 0.6in;
            mso-header-margin: 0.5in;
            mso-footer-margin: 0.5in;
            mso-header: h1;
            mso-footer: f1;
          }
          div.Section1 {
            page: Section1;
          }
          p, li, .MsoNormal, td, th, div, span {
            margin: 0in;
            margin-bottom: 0in;
            mso-margin-top-alt: 0in;
            mso-margin-bottom-alt: 0in;
            mso-padding-alt: 0in;
          }
          p.MsoHeader, li.MsoHeader, div.MsoHeader {
            margin: 0in;
            mso-pagination: widow-orphan;
            font-family: 'Arial', sans-serif;
          }
          p.MsoFooter, li.MsoFooter, div.MsoFooter {
            margin: 0in;
            mso-pagination: widow-orphan;
            font-family: 'Arial', sans-serif;
          }
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 9.5pt;
            line-height: 1.35;
            color: #000000;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            mso-table-lspace: 0in;
            mso-table-rspace: 0in;
          }
          th, td {
            border: 1pt solid #000000;
            padding: 1pt 5pt;
            text-align: left;
            font-size: 9pt;
            vertical-align: top;
            mso-para-margin-top: 0in;
            mso-para-margin-bottom: 0in;
            line-height: normal;
          }
          th p, td p, th span, td span, th b, td b, th div, td div {
            margin: 0in !important;
            mso-para-margin: 0in !important;
            line-height: normal !important;
          }
          .header-title-text {
            font-family: 'Arial', sans-serif;
            font-weight: bold;
            color: #15803d;
            text-transform: uppercase;
          }
          .section-header {
            font-weight: bold;
            background-color: #cbd5e1;
            text-align: center;
            font-size: 9.5pt;
            text-transform: uppercase;
            padding: 5px;
            border: 1pt solid #000000;
          }
          .label-cell {
            font-weight: bold;
            width: 25%;
            border: 1pt solid #000000;
          }
          .value-cell {
            width: 25%;
            border: 1pt solid #000000;
          }
          .col-header {
            font-weight: bold;
            font-size: 9pt;
            border: 1pt solid #000000;
            text-align: center;
          }
          .data-table {
            margin-bottom: 15pt;
            mso-table-anchor-vertical: margin;
            mso-table-anchor-horizontal: column;
          }
          .signature-block {
            page-break-inside: avoid;
            mso-keep-together: always;
          }
          #hrdftrtbl {
            margin: 0in 0in 0in 900in;
            width: 1px;
            height: 1px;
            overflow: hidden;
          }
          @media screen {
            #hrdftrtbl { display: none !important; }
          }
        </style>
      </head>
      <body>

        <!-- ====== CUERPO DEL DOCUMENTO ====== -->
        <div class="Section1">

          <!-- TÍTULO -->
          <p class="MsoNormal" style="text-align: center; font-size: 11pt; font-weight: bold; text-transform: uppercase; line-height: normal; margin-bottom: 6pt;" align="center">
            ACTA DE CONCERTACI&Oacute;N DE COMPROMISOS LABORALES (DECRETO 1278)
          </p>

          <!-- TEXTO INTRODUCTORIO -->
          <p class="MsoNormal" style="font-size: 9.5pt; line-height: 1.45; text-align: justify; margin-bottom: 6pt;">
            El d&iacute;a <b>${completo || '25 de junio de 2026'}</b> a las <b>${hora}</b> en las instalaciones de la rector&iacute;a de la <b>${lugar}</b> se reunieron el evaluador y el evaluado seg&uacute;n los datos a continuaci&oacute;n con el fin de establecer los compromisos y competencias funcionales y comportamentales:
          </p>

          <!-- 1.1. DATOS DE LA INSTITUCIÓN -->
          <table class="data-table" style="border: 1pt solid #000000; margin-bottom: 15pt;">
            <tr>
              <th colspan="4" class="section-header">1.1. DATOS DE LA INSTITUCI&Oacute;N</th>
            </tr>
            <tr>
              <td class="label-cell">Establecimiento:</td>
              <td class="value-cell" style="text-transform: uppercase;">${institutionName || 'INSTITUCIÓN EDUCATIVA ALVERNIA'}</td>
              <td class="label-cell">C&oacute;digo DANE:</td>
              <td class="value-cell">${institutionDane || '186568000567'}</td>
            </tr>
            <tr>
              <td class="label-cell">Sede de Trabajo:</td>
              <td class="value-cell" style="text-transform: uppercase;">${teacher.sedeTrabajo || 'Sede Principal'}</td>
              <td class="label-cell">Lugar:</td>
              <td class="value-cell" style="text-transform: uppercase;">${evalDoc.lugarConcertacion || institutionName || 'INSTITUCIÓN EDUCATIVA ALVERNIA'}</td>
            </tr>
          </table>
          <p style="margin: 0; font-size: 10pt; line-height: 1;">&nbsp;</p>

          <!-- 1.2. DATOS DEL DOCENTE EVALUADO -->
          <table class="data-table" style="border: 1pt solid #000000; margin-bottom: 15pt;">
            <tr>
              <th colspan="4" class="section-header">1.2. DATOS DEL DOCENTE EVALUADO</th>
            </tr>
            <tr>
              <td class="label-cell">Nombre del Docente:</td>
              <td class="value-cell" style="font-weight: bold; text-transform: uppercase;">${teacher.nombre}</td>
              <td class="label-cell">C&eacute;dula Docente:</td>
              <td class="value-cell">${teacher.cedula}</td>
            </tr>
            <tr>
              <td class="label-cell">Correo Electr&oacute;nico:</td>
              <td class="value-cell">${teacher.correoElectronico || 'No registrado'}</td>
              <td class="label-cell">Celular:</td>
              <td class="value-cell">${teacher.numeroCelular || 'No registrado'}</td>
            </tr>
            <tr>
              <td class="label-cell">Área Desempe&ntilde;o:</td>
              <td class="value-cell" style="text-transform: uppercase;">${teacher.areaDesempeno || 'No registrada'}</td>
              <td class="label-cell">Per&iacute;odo Evaluado:</td>
              <td class="value-cell">A&ntilde;o Lectivo Vigente</td>
            </tr>
          </table>
          <p style="margin: 0; font-size: 10pt; line-height: 1;">&nbsp;</p>

          <!-- 1.3. DATOS DEL EVALUADOR -->
          <table class="data-table" style="border: 1pt solid #000000; margin-bottom: 15pt;">
            <tr>
              <th colspan="4" class="section-header">1.3. DATOS DEL EVALUADOR</th>
            </tr>
            <tr>
              <td class="label-cell">Nombre del Evaluador:</td>
              <td class="value-cell" style="text-transform: uppercase;">${evalDoc.evaluadorNombre || rectorName || 'Rector / Coordinador'}</td>
              <td class="label-cell">C&eacute;dula Evaluador:</td>
              <td class="value-cell">${evalDoc.evaluadorCedula || rectorDocument || 'N/A'} ${rectorDocumentExpedition ? `de ${rectorDocumentExpedition}` : ''}</td>
            </tr>
            <tr>
              <td class="label-cell">Fecha Concertaci&oacute;n:</td>
              <td class="value-cell" colspan="3">${evalDoc.fechaConcertacion}</td>
            </tr>
          </table>
          <p style="margin: 0; font-size: 10pt; line-height: 1;">&nbsp;</p>

          <!-- 2. COMPROMISOS DE COMPETENCIAS FUNCIONALES -->
          <table class="data-table" style="border: 1pt solid #000000; margin-bottom: 15pt;">
            <tr>
              <th colspan="3" class="section-header">2. COMPROMISOS DE COMPETENCIAS FUNCIONALES (70%)</th>
            </tr>
            <tr>
              <th class="col-header" style="width: 25%;">&Aacute;rea de Gesti&oacute;n / Competencia</th>
              <th class="col-header" style="width: 50%;">Contribuci&oacute;n Individual (Compromiso Concertado)</th>
              <th class="col-header" style="width: 25%;">Evidencias Propuestas</th>
            </tr>
            ${functionalCommitments.map(cf => {
              const pctVal = cf.porcentaje !== undefined ? cf.porcentaje : (SUGGESTED_FUNCTIONALS.find(sf => sf.competencia === cf.competencia)?.porcentaje || 0);
              return `
            <tr>
              <td style="font-size: 8.5pt;">
                <b style="font-size: 8.5pt;">${cf.area} (${pctVal}%)</b><br/>
                <span style="font-size: 8.5pt; color: #1e293b;">${cf.competencia}</span>
              </td>
              <td style="font-size: 8.5pt; line-height: normal;">${cf.contribucion}</td>
              <td style="font-size: 8.5pt; line-height: normal;">${cf.evidencias}</td>
            </tr>
              `;
            }).join('')}
          </table>
          <p style="margin: 0; font-size: 10pt; line-height: 1;">&nbsp;</p>

          <!-- 3. COMPROMISOS DE COMPETENCIAS COMPORTAMENTALES -->
          <table class="data-table" style="border: 1pt solid #000000; margin-bottom: 15pt;">
            <tr>
              <th colspan="2" class="section-header">3. COMPROMISOS DE COMPETENCIAS COMPORTAMENTALES (30%)</th>
            </tr>
            <tr>
              <th class="col-header" style="width: 30%;">Competencia Elegida</th>
              <th class="col-header" style="width: 70%;">Criterios y Evidencias de Aplicaci&oacute;n Conductual</th>
            </tr>
            ${evalDoc.compromisosComportamentales.map(cc => `
            <tr>
              <td style="font-size: 8.5pt; font-weight: bold;">${cc.competencia} (10%)</td>
              <td style="font-size: 8.5pt; line-height: normal;">${cc.evidencias}</td>
            </tr>
            `).join('')}
          </table>

          <!-- ====== FIRMAS (bloque indivisible) ====== -->
          <div class="signature-block">
            <p class="MsoNormal" style="font-size: 9.5pt; line-height: 1.35; color: #000000; text-align: justify; margin-bottom: 10pt;">
              En constancia de lo anterior, se firma de mutuo acuerdo el plan de compromisos y contribuciones individuales que servir&aacute; de marco de referencia para la evaluaci&oacute;n anual de desempe&ntilde;o laboral docente a los ${dia || '25'} d&iacute;as del mes de ${mes || 'junio'} de ${anio || '2026'}.
            </p>

            <table style="width: 100%; border: none; margin-top: 15pt;">
              <tr style="border: none;">
                <!-- Firma del Evaluador -->
                <td style="border: none; width: 50%; vertical-align: bottom; padding: 5px 10px 5px 0; text-align: left;">
                  ${(activeRectorSignature && evalDoc.estado === 'Aprobado') ? `
                    <div style="margin-bottom: 4px; min-height: 60px;">
                      <img src="${activeRectorSignature}" width="160" height="55" style="max-height: 55px; max-width: 160px; object-fit: contain; display: block;" />
                    </div>
                  ` : `
                    <div style="height: 55px; border-bottom: 1px solid #000; width: 200px; margin-bottom: 4px;"></div>
                  `}
                  <p style="font-size: 8.5pt; font-weight: bold; color: #000000;">Firma del Evaluador</p>
                  <p style="font-size: 9pt; font-weight: bold; text-transform: uppercase; color: #000000;">
                    ${evalDoc.evaluadorNombre || rectorName || 'Rector / Coordinador'}
                  </p>
                  <p style="font-size: 8pt; color: #4b5563;">Rector(a) / Coordinador(a) I.E. Alvernia</p>
                </td>
                <!-- Firma del Evaluado -->
                <td style="border: none; width: 50%; vertical-align: bottom; padding: 5px 0 5px 10px; text-align: left;">
                  ${(teacher.firmaDocente && evalDoc.estado === 'Aprobado') ? `
                    <div style="margin-bottom: 4px; min-height: 60px;">
                      <img src="${teacher.firmaDocente}" width="160" height="55" style="max-height: 55px; max-width: 160px; object-fit: contain; display: block;" />
                    </div>
                  ` : `
                    <div style="height: 55px; border-bottom: 1px solid #000; width: 200px; margin-bottom: 4px;"></div>
                  `}
                  <p style="font-size: 8.5pt; font-weight: bold; color: #000000;">Firma del Evaluado</p>
                  <p style="font-size: 9pt; font-weight: bold; text-transform: uppercase; color: #000000;">
                    ${teacher.nombre}
                  </p>
                  <p style="font-size: 8pt; color: #4b5563;">C.C. ${teacher.cedula}</p>
                </td>
              </tr>
            </table>
          </div>

        </div>

        <table id="hrdftrtbl" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <!-- ====== NATIVE WORD HEADER ====== -->
              <div style="mso-element:header" id="h1">
                <table style="width: 100%; border-collapse: collapse; border: none;">
                  <tr style="border: none;">
                    <td style="width: 18%; border: none; text-align: left; vertical-align: middle; padding: 4px 6px 4px 0;" align="left">
                      ${customLogo ? `
                        <img src="${customLogo}" width="50" height="50" style="max-height: 50px; max-width: 50px; object-fit: contain; display: block;" alt="Logo" />
                      ` : `
                        <div style="border: 1.5pt solid #4CAF50; padding: 5px; font-size: 8pt; font-weight: bold; text-align: center; color: #4CAF50; width: 42px; line-height: 1.1;">
                          I.E.<br/>ALV
                        </div>
                      `}
                    </td>
                    <td style="width: 82%; border: none; text-align: center; vertical-align: middle; padding: 4px 0 4px 6px;" align="center">
                      <p class="MsoHeader header-title-text" style="font-size: 11pt; line-height: 1.25; text-align: center; font-weight: bold; color: #4CAF50;" align="center">
                        ${institutionName || 'INSTITUCIÓN EDUCATIVA ALVERNIA'}
                      </p>
                      <p class="MsoHeader" style="font-size: 8pt; font-weight: bold; color: #4CAF50; line-height: 1.2; text-align: center; text-transform: uppercase;" align="center">
                        ${educationalLevel || 'NIVEL PREESCOLAR &ndash; B&Aacute;SICA PRIMARIA Y MEDIA ACAD&Eacute;MICA'}
                      </p>
                      <p class="MsoHeader" style="font-size: 7pt; font-weight: bold; color: #9ca3af; line-height: 1.2; text-align: center; text-transform: uppercase;" align="center">
                        ${calendario || 'CALENDARIO A'} &ndash; C&Oacute;DIGO DANE ${institutionDane || '188688000687'} &ndash; NIT. ${institutionNit || '891201897-5'}
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
            <td>
              <!-- ====== NATIVE WORD FOOTER ====== -->
              <div style="mso-element:footer" id="f1">
                <table style="width: 100%; border-collapse: collapse; border: none;">
                  <tr style="border: none;">
                    <td style="border: none; padding-top: 5px; text-align: center;" align="center">
                      <p class="MsoFooter" style="font-weight: bold; font-style: italic; color: #4CAF50; font-size: 8pt; text-align: center;" align="center">
                        &ldquo;&ldquo;&ldquo;${footerMotto || 'Brindamos una educación humanística y académica para la excelencia de un ser humano integral'}&rdquo;&rdquo;&rdquo;
                      </p>
                      <p class="MsoFooter" style="font-size: 7.5pt; color: #9ca3af; text-align: center;" align="center">
                        ${footerAddress || 'Barrio San Mart&iacute;n Carrera 16 No. 12 &ndash; 77'} | ${footerEmails || 'alvernia@sedputumayo.gov.co &ndash; rectoralvernia@gmail.com'} &ndash; ${footerWebsite || 'www.ie-alvernia.edu.co'}
                      </p>
                      <p class="MsoFooter" style="font-size: 7.5pt; color: #9ca3af; text-align: center;" align="center">
                        ${footerCity || 'Puerto As&iacute;s &ndash; Putumayo'}
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    downloadWordBlob(htmlContent, `Acta_Compromisos_${teacher.nombre.replace(/\s+/g, '_')}_Seguimiento${evalDoc.periodo}.doc`);
  };

  const handleExportWordAnexo2 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {
    const customLogo = localStorage.getItem('iea_custom_logo') || '';
    const activeRectorSignature = rectorSignature || localStorage.getItem('rector_signature_base64') || localStorage.getItem('iea_custom_signature') || '';
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title>Anexo 2 - Tabla Resumen de Evidencias</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          p, li, .MsoNormal, .MsoHeader, .MsoFooter, td, th, div, span {
            margin: 0in !important;
            margin-bottom: .0001pt !important;
            mso-margin-top-alt: 0in !important;
            mso-margin-bottom-alt: 0in !important;
            mso-padding-alt: 0in !important;
          }
          @page {
            size: 11in 8.5in;
            mso-page-orientation: landscape;
            margin: 0.5in 0.5in 0.5in 0.5in;
          }
          @page SectionLandscape {
            size: 11in 8.5in;
            mso-page-orientation: landscape;
            margin: 0.5in 0.5in 0.5in 0.5in;
          }
          div.SectionLandscape {
            page: SectionLandscape;
          }
          body {
            font-family: 'Arial', sans-serif;
            font-size: 10pt;
            line-height: 1.3;
            color: #000;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 10px;
          }
          th, td {
            border: 1pt solid #000;
            padding: 6px;
            text-align: left;
            font-size: 8.5pt;
            vertical-align: top;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="SectionLandscape">
          <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 10px;">
            <tr style="border: none;">
              <td style="width: 40%; border: none; text-align: left; vertical-align: middle;">
                <p style="font-size: 8pt; font-weight: bold; margin: 0; line-height: 1.1; text-transform: uppercase;">
                  REPÚBLICA DE COLOMBIA<br/>
                  MINISTERIO DE EDUCACIÓN NACIONAL
                </p>
              </td>
              <td style="width: 20%; border: none; text-align: center; vertical-align: middle;">
                ${customLogo ? `
                  <img src="${customLogo}" width="50" height="50" style="max-height: 50px; max-width: 50px; object-fit: contain; display: block; margin: 0 auto;" />
                ` : `
                  <div style="border: 1pt solid #000; padding: 3px; font-size: 7.5pt; font-weight: bold; text-align: center; width: 45px; margin: 0 auto; text-transform: uppercase; line-height: 1.1;">
                    COL<br/>MEN
                  </div>
                `}
              </td>
              <td style="width: 40%; border: none; text-align: right; vertical-align: middle;">
                <p style="font-size: 7.5pt; font-weight: bold; margin: 0; line-height: 1.1; text-align: right; text-transform: uppercase; color: #444;">
                  EVALUACIÓN ANUAL DE DESEMPEÑO LABORAL<br/>
                  DOCENTES Y DIRECTIVOS DOCENTES DECRETO LEY 1278 DE 2002
                </p>
              </td>
            </tr>
          </table>

          <div style="text-align: center; margin-top: 5px; margin-bottom: 15px;">
            <div style="font-size: 14pt; font-weight: bold; letter-spacing: 1px; color: #000;">ANEXO 2</div>
            <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; margin-top: 3px; color: #111;">Tabla Resumen de Evidencias</div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <tr>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 9pt; width: 70%;"><b>Establecimiento Educativo:</b> ${institutionName}</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 9pt; width: 30%;"><b>Código DANE:</b> ${institutionDane}</td>
            </tr>
            <tr>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 9pt;"><b>Nombre del evaluado:</b> ${teacher.nombre}</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 9pt;"><b>CC:</b> ${teacher.cedula}</td>
            </tr>
            <tr>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 9pt;"><b>Nombre del evaluador:</b> ${evalDoc.evaluadorNombre || 'Rector(a)'}</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 9pt;"><b>CC:</b> ${evalDoc.evaluadorCedula || '__________________'} ${rectorDocumentExpedition ? `de ${rectorDocumentExpedition}` : ''}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f2f2f2; font-weight: bold; text-align: center;">
                <th style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; width: 8%;">No. Folio</th>
                <th style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; width: 14%;">Fecha incorporación de la evidencia (dd/mm/aaaa)</th>
                <th style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; width: 14%;">Tipo de evidencia (D: Documental; T: Testimonial)</th>
                <th style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; width: 28%;">Nombre de la evidencia (Plan de trabajo, informe, material pedagógico, proyecto de investigación, certificación, encuesta, etc.)</th>
                <th style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; width: 22%;">Competencias que soporta (Indique las competencias funcionales y comportamentales relacionadas con esta evidencia)</th>
                <th style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; width: 14%;">Firma (de quien consigna y valora la evidencia)</th>
              </tr>
            </thead>
            <tbody>
              ${evalDoc.evidenciasAnexo2.length === 0 ? `
                <tr>
                  <td colspan="6" style="border: 1pt solid #000; padding: 20px; text-align: center; font-style: italic; font-size: 9pt; color: #666;">No se han incorporado registros de evidencias en este seguimiento.</td>
                </tr>
              ` : evalDoc.evidenciasAnexo2.map(ev => `
                <tr>
                  <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; text-align: center; vertical-align: middle;">${ev.folio || '-'}</td>
                  <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; text-align: center; vertical-align: middle;">${ev.fecha}</td>
                  <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; text-align: center; vertical-align: middle;">${ev.tipo === 'D' ? 'D' : 'T'}</td>
                  <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;"><b>${ev.nombre}</b> ${ev.fileName ? `<br/><span style="font-size:7.5pt; color:#555;">[Archivo: ${ev.fileName}]</span>` : ''}</td>
                  <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${ev.competenciasSoportadas}</td>
                  <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; text-align: center; vertical-align: middle; color: #666;"><i>Verificado</i></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <br/>
          <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
            <tr>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 9pt; width: 50%;"><b>Nombre completo del evaluado:</b> ${teacher.nombre}</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 9pt; width: 50%;"><b>Nombre completo del evaluador:</b> ${evalDoc.evaluadorNombre || 'Rector(a)'}</td>
            </tr>
            <tr style="height: 80pt;">
              <td style="border: 1pt solid #000; padding: 10px; font-size: 9pt; vertical-align: top;">
                <b>Firma y número de cédula:</b><br/>
                ${teacher.firmaDocente ? `
                  <div style="margin-top: 5px; margin-bottom: 5px; min-height: 55px;">
                    <img src="${teacher.firmaDocente}" width="140" height="50" style="max-height: 50px; max-width: 140px; object-fit: contain; display: block;" />
                  </div>
                ` : evalDoc.estado === 'Aprobado' || teacher.firmaDocente || true ? `
                  <div style="border: 1pt dashed #2563eb; background-color: #f0f9ff; padding: 6px; text-align: left; font-family: 'Courier New', monospace; font-size: 7.5pt; color: #1d4ed8; margin: 5px 0; line-height: 1.25;">
                    <b>✓ DOCENTE - FIRMADO DIGITAL</b><br/>
                    <b>Sello:</b> CONCERTACIÓN COMPROMISOS<br/>
                    <b>Verif:</b> IEA-DOC-1278-${evalDoc.id}
                  </div>
                ` : '<br/><br/>'}
                C.C. ${teacher.cedula}
              </td>
              <td style="border: 1pt solid #000; padding: 10px; font-size: 9pt; vertical-align: top; position: relative;">
                <b>Firma y número de cédula:</b><br/>
                ${activeRectorSignature ? `
                  <div style="margin-top: 5px; margin-bottom: 5px; min-height: 55px;">
                    <img src="${activeRectorSignature}" width="140" height="50" style="max-height: 50px; max-width: 140px; object-fit: contain; display: block;" />
                  </div>
                ` : evalDoc.estado === 'Aprobado' ? `
                  <div style="border: 1pt dashed #047857; background-color: #f0fdf4; padding: 6px; text-align: left; font-family: 'Courier New', monospace; font-size: 7.5pt; color: #047857; margin: 5px 0; line-height: 1.25;">
                    <b>✓ RECTORÍA - FIRMADO DIGITAL</b><br/>
                    <b>Sello:</b> APROBACIÓN OFICIAL RECTORÍA<br/>
                    <b>Verif:</b> IEA-VAL-1278-${evalDoc.id}
                  </div>
                ` : '<br/><br/>'}
                C.C. ${evalDoc.evaluadorCedula || '__________________'} ${rectorDocumentExpedition ? `de ${rectorDocumentExpedition}` : ''}
              </td>
            </tr>
          </table>

          <p style="font-size: 8.5pt; font-style: italic; margin-top: 30px; text-align: center;">
            NOTA: El docente o directivo docente evaluado debe conservar una copia firmada de este Anexo.
          </p>
        </div>
      </body>
      </html>
    `;

    downloadWordBlob(htmlContent, `Anexo2_Evidencias_${teacher.nombre.replace(/\s+/g, '_')}_Seguimiento${evalDoc.periodo}.doc`);
  };

  const handleExportWordAnexo5 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {
    const customLogo = localStorage.getItem('iea_custom_logo') || '';
    const activeRectorSignature = rectorSignature || localStorage.getItem('rector_signature_base64') || localStorage.getItem('iea_custom_signature') || '';
    const acadCompromisos = evalDoc.compromisosFuncionales.filter(c => c.area === 'Académica');
    const adminCompromisos = evalDoc.compromisosFuncionales.filter(c => c.area === 'Administrativa');
    const comunCompromisos = evalDoc.compromisosFuncionales.filter(c => c.area === 'Comunitaria');

    const getPorcentajeWithFallback = (comp: CompromisoFuncional | undefined, fallback: number) => {
      if (!comp) return fallback;
      return comp.porcentaje !== undefined ? comp.porcentaje : fallback;
    };

    const acad0Porc = getPorcentajeWithFallback(acadCompromisos[0], 12.5);
    const acad1Porc = getPorcentajeWithFallback(acadCompromisos[1], 12.5);
    const acad2Porc = getPorcentajeWithFallback(acadCompromisos[2], 12.5);
    const acad3Porc = getPorcentajeWithFallback(acadCompromisos[3], 12.5);

    const admin0Porc = getPorcentajeWithFallback(adminCompromisos[0], 5.0);
    const admin1Porc = getPorcentajeWithFallback(adminCompromisos[1], 5.0);

    const comun0Porc = getPorcentajeWithFallback(comunCompromisos[0], 5.0);
    const comun1Porc = getPorcentajeWithFallback(comunCompromisos[1], 5.0);

    const acadSum = acad0Porc + acad1Porc + acad2Porc + acad3Porc;
    const adminSum = admin0Porc + admin1Porc;
    const comunSum = comun0Porc + comun1Porc;

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title>Anexo 5 - Resumen de Competencias, Contribuciones, Criterios y Evidencias</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          p, li, .MsoNormal, .MsoHeader, .MsoFooter, td, th, div, span {
            margin: 0in !important;
            margin-bottom: .0001pt !important;
            mso-margin-top-alt: 0in !important;
            mso-margin-bottom-alt: 0in !important;
            mso-padding-alt: 0in !important;
          }
          @page {
            size: 11in 8.5in;
            mso-page-orientation: landscape;
            margin: 0.5in 0.5in 0.5in 0.5in;
          }
          @page SectionLandscape {
            size: 11in 8.5in;
            mso-page-orientation: landscape;
            margin: 0.5in 0.5in 0.5in 0.5in;
          }
          div.SectionLandscape {
            page: SectionLandscape;
          }
          body {
            font-family: 'Arial', sans-serif;
            font-size: 10pt;
            line-height: 1.35;
            color: #000;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 10px;
          }
          th, td {
            border: 1pt solid #000;
            padding: 5px;
            text-align: left;
            font-size: 8.5pt;
            vertical-align: top;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="SectionLandscape">
          <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 10px;">
            <tr style="border: none;">
              <td style="width: 40%; border: none; text-align: left; vertical-align: middle;">
                <p style="font-size: 8pt; font-weight: bold; margin: 0; line-height: 1.1; text-transform: uppercase;">
                  REPÚBLICA DE COLOMBIA<br/>
                  MINISTERIO DE EDUCACIÓN NACIONAL
                </p>
              </td>
              <td style="width: 20%; border: none; text-align: center; vertical-align: middle;">
                ${customLogo ? `
                  <img src="${customLogo}" width="50" height="50" style="max-height: 50px; max-width: 50px; object-fit: contain; display: block; margin: 0 auto;" />
                ` : `
                  <div style="border: 1pt solid #000; padding: 3px; font-size: 7.5pt; font-weight: bold; text-align: center; width: 45px; margin: 0 auto; text-transform: uppercase; line-height: 1.1;">
                    COL<br/>MEN
                  </div>
                `}
              </td>
              <td style="width: 40%; border: none; text-align: right; vertical-align: middle;">
                <p style="font-size: 7.5pt; font-weight: bold; margin: 0; line-height: 1.1; text-align: right; text-transform: uppercase; color: #444;">
                  EVALUACIÓN ANUAL DE DESEMPEÑO LABORAL<br/>
                  DOCENTES Y DIRECTIVOS DOCENTES DECRETO LEY 1278 DE 2002
                </p>
              </td>
            </tr>
          </table>

          <div style="text-align: center; margin-top: 5px; margin-bottom: 15px;">
            <div style="font-size: 14pt; font-weight: bold; letter-spacing: 1px; color: #000;">ANEXO 5</div>
            <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; margin-top: 3px; color: #111;">Resumen Competencias, Contribuciones, Criterios y Evidencias</div>
            <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; margin-top: 3px; color: #111; letter-spacing: 2px;">DOCENTE</div>
          </div>

          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #e6e6e6; font-weight: bold; text-align: center;">
              <td colspan="6" style="border: 1pt solid #000; padding: 6px; font-size: 10pt; text-transform: uppercase;">Competencias funcionales</td>
            </tr>
            <tr style="background-color: #f2f2f2; font-weight: bold; text-align: center;">
              <td colspan="2" style="border: 1pt solid #000; padding: 6px; font-size: 9pt; width: 18%;">Área de gestión</td>
              <td rowspan="2" style="border: 1pt solid #000; padding: 6px; font-size: 9pt; width: 18%;">Competencia</td>
              <td rowspan="2" style="border: 1pt solid #000; padding: 6px; font-size: 9pt; width: 22%;">Contribución individual</td>
              <td rowspan="2" style="border: 1pt solid #000; padding: 6px; font-size: 9pt; width: 22%;">Criterios de evaluación</td>
              <td rowspan="2" style="border: 1pt solid #000; padding: 6px; font-size: 9pt; width: 20%;">Evidencias</td>
            </tr>
            <tr style="background-color: #f2f2f2; font-weight: bold; text-align: center;">
              <td style="border: 1pt solid #000; padding: 4px; font-size: 9pt; width: 13%;">Área</td>
              <td style="border: 1pt solid #000; padding: 4px; font-size: 9pt; width: 5%;">70%</td>
            </tr>

            <!-- Académica -->
            <tr>
              <td rowspan="4" style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; vertical-align: middle; text-align: center; font-weight: bold; background-color: #fafafa;">Académica</td>
              <td rowspan="4" style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; vertical-align: middle; text-align: center; font-weight: bold;">${acadSum.toFixed(1).replace('.0', '')}%</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; font-weight: bold; text-align: center; background-color: #fafafa; vertical-align: middle;">
                Dominio curricular<br/>
                <span style="font-weight: bold; font-size: 8.5pt; color: #111;">${acad0Porc.toFixed(1).replace('.0', '')}%</span>
              </td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${acadCompromisos[0]?.contribucion || ''}</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${acadCompromisos[0]?.criterios || ''}</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${acadCompromisos[0]?.evidencias || ''}</td>
            </tr>
            <tr>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; font-weight: bold; text-align: center; background-color: #fafafa; vertical-align: middle;">
                Planeación y organización<br/>
                <span style="font-weight: bold; font-size: 8.5pt; color: #111;">${acad1Porc.toFixed(1).replace('.0', '')}%</span>
              </td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${acadCompromisos[1]?.contribucion || ''}</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${acadCompromisos[1]?.criterios || ''}</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${acadCompromisos[1]?.evidencias || ''}</td>
            </tr>
            <tr>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; font-weight: bold; text-align: center; background-color: #fafafa; vertical-align: middle;">
                Pedagógica y didáctica<br/>
                <span style="font-weight: bold; font-size: 8.5pt; color: #111;">${acad2Porc.toFixed(1).replace('.0', '')}%</span>
              </td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${acadCompromisos[2]?.contribucion || ''}</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${acadCompromisos[2]?.criterios || ''}</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${acadCompromisos[2]?.evidencias || ''}</td>
            </tr>
            <tr>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; font-weight: bold; text-align: center; background-color: #fafafa; vertical-align: middle;">
                Evaluación del aprendizaje<br/>
                <span style="font-weight: bold; font-size: 8.5pt; color: #111;">${acad3Porc.toFixed(1).replace('.0', '')}%</span>
              </td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${acadCompromisos[3]?.contribucion || ''}</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${acadCompromisos[3]?.criterios || ''}</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${acadCompromisos[3]?.evidencias || ''}</td>
            </tr>

            <!-- Administrativa -->
            <tr>
              <td rowspan="2" style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; vertical-align: middle; text-align: center; font-weight: bold; background-color: #fafafa;">Administrativa</td>
              <td rowspan="2" style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; vertical-align: middle; text-align: center; font-weight: bold;">${adminSum.toFixed(1).replace('.0', '')}%</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; font-weight: bold; text-align: center; background-color: #fafafa; vertical-align: middle;">
                Uso de recursos<br/>
                <span style="font-weight: bold; font-size: 8.5pt; color: #111;">${admin0Porc.toFixed(1).replace('.0', '')}%</span>
              </td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${adminCompromisos[0]?.contribucion || ''}</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${adminCompromisos[0]?.criterios || ''}</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${adminCompromisos[0]?.evidencias || ''}</td>
            </tr>
            <tr>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; font-weight: bold; text-align: center; background-color: #fafafa; vertical-align: middle;">
                Seguimiento de procesos<br/>
                <span style="font-weight: bold; font-size: 8.5pt; color: #111;">${admin1Porc.toFixed(1).replace('.0', '')}%</span>
              </td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${adminCompromisos[1]?.contribucion || ''}</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${adminCompromisos[1]?.criterios || ''}</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${adminCompromisos[1]?.evidencias || ''}</td>
            </tr>

            <!-- Comunitaria -->
            <tr>
              <td rowspan="2" style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; vertical-align: middle; text-align: center; font-weight: bold; background-color: #fafafa;">Comunitaria</td>
              <td rowspan="2" style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; vertical-align: middle; text-align: center; font-weight: bold;">${comunSum.toFixed(1).replace('.0', '')}%</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; font-weight: bold; text-align: center; background-color: #fafafa; vertical-align: middle;">
                Comunicación institucional<br/>
                <span style="font-weight: bold; font-size: 8.5pt; color: #111;">${comun0Porc.toFixed(1).replace('.0', '')}%</span>
              </td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${comunCompromisos[0]?.contribucion || ''}</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${comunCompromisos[0]?.criterios || ''}</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${comunCompromisos[0]?.evidencias || ''}</td>
            </tr>
            <tr>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; font-weight: bold; text-align: center; background-color: #fafafa; vertical-align: middle;">
                Comunidad y entorno<br/>
                <span style="font-weight: bold; font-size: 8.5pt; color: #111;">${comun1Porc.toFixed(1).replace('.0', '')}%</span>
              </td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${comunCompromisos[1]?.contribucion || ''}</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${comunCompromisos[1]?.criterios || ''}</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${comunCompromisos[1]?.evidencias || ''}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr style="background-color: #e6e6e6; font-weight: bold; text-align: center;">
              <td colspan="2" style="border: 1pt solid #000; padding: 6px; font-size: 10pt; text-transform: uppercase;">Competencias comportamentales</td>
            </tr>
            <tr style="background-color: #f2f2f2; font-weight: bold; text-align: center;">
              <td style="border: 1pt solid #000; padding: 6px; font-size: 9pt; width: 30%;">Competencia</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 9pt; width: 70%;">Evidencias</td>
            </tr>
            ${evalDoc.compromisosComportamentales.map(cc => `
              <tr>
                <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt; font-weight: bold; background-color: #fafafa;">${cc.competencia}</td>
                <td style="border: 1pt solid #000; padding: 6px; font-size: 8.5pt;">${cc.evidencias}</td>
              </tr>
            `).join('')}
          </table>

          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 9pt; width: 50%;"><b>Nombre completo del evaluado:</b> ${teacher.nombre}</td>
              <td style="border: 1pt solid #000; padding: 6px; font-size: 9pt; width: 50%;"><b>Nombre completo del evaluador:</b> ${evalDoc.evaluadorNombre || 'Rector(a)'}</td>
            </tr>
            <tr style="height: 80pt;">
              <td style="border: 1pt solid #000; padding: 10px; font-size: 9pt; vertical-align: top;">
                <b>Firma y número de cédula:</b><br/>
                ${teacher.firmaDocente ? `
                  <div style="margin-top: 5px; margin-bottom: 5px; min-height: 55px;">
                    <img src="${teacher.firmaDocente}" width="140" height="50" style="max-height: 50px; max-width: 140px; object-fit: contain; display: block;" />
                  </div>
                ` : evalDoc.estado === 'Aprobado' || teacher.firmaDocente || true ? `
                  <div style="border: 1pt dashed #2563eb; background-color: #f0f9ff; padding: 6px; text-align: left; font-family: 'Courier New', monospace; font-size: 7.5pt; color: #1d4ed8; margin: 5px 0; line-height: 1.25;">
                    <b>✓ DOCENTE - FIRMADO DIGITAL</b><br/>
                    <b>Sello:</b> CONCERTACIÓN COMPROMISOS<br/>
                    <b>Verif:</b> IEA-DOC-1278-${evalDoc.id}
                  </div>
                ` : '<br/><br/>'}
                C.C. ${teacher.cedula}
              </td>
              <td style="border: 1pt solid #000; padding: 10px; font-size: 9pt; vertical-align: top; position: relative;">
                <b>Firma y número de cédula:</b><br/>
                ${activeRectorSignature ? `
                  <div style="margin-top: 5px; margin-bottom: 5px; min-height: 55px;">
                    <img src="${activeRectorSignature}" width="140" height="50" style="max-height: 50px; max-width: 140px; object-fit: contain; display: block;" />
                  </div>
                ` : evalDoc.estado === 'Aprobado' ? `
                  <div style="border: 1pt dashed #047857; background-color: #f0fdf4; padding: 6px; text-align: left; font-family: 'Courier New', monospace; font-size: 7.5pt; color: #047857; margin: 5px 0; line-height: 1.25;">
                    <b>✓ RECTORÍA - FIRMADO DIGITAL</b><br/>
                    <b>Sello:</b> APROBACIÓN OFICIAL RECTORÍA<br/>
                    <b>Verif:</b> IEA-VAL-1278-${evalDoc.id}
                  </div>
                ` : '<br/><br/>'}
                C.C. ${evalDoc.evaluadorCedula || '__________________'} ${rectorDocumentExpedition ? `de ${rectorDocumentExpedition}` : ''}
              </td>
            </tr>
            <tr>
              <td colspan="2" style="border: 1pt solid #000; padding: 6px; font-size: 9pt;"><b>Ciudad y fecha de concertación:</b> ${evalDoc.lugarConcertacion || institutionName}, ${evalDoc.fechaConcertacion}</td>
            </tr>
          </table>

          <p style="font-size: 8.5pt; font-style: italic; margin-top: 20px; text-align: center;">
            NOTA: El docente o directivo docente evaluado debe conservar una copia firmada de este Anexo.
          </p>
        </div>
      </body>
      </html>
    `;

    downloadWordBlob(htmlContent, `Anexo5_Competencias_${teacher.nombre.replace(/\s+/g, '_')}_Seguimiento${evalDoc.periodo}.doc`);
  };

  const handleExportCertificateWord = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {
    const customLogo = localStorage.getItem('iea_custom_logo') || '';
    const activeRectorSignature = rectorSignature || localStorage.getItem('rector_signature_base64') || localStorage.getItem('iea_custom_signature') || '';
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title>Certificado de Cumplimiento de Compromisos</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>90</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          p, li, .MsoNormal, .MsoHeader, .MsoFooter, td, th, div, span {
            margin: 0in !important;
            margin-bottom: .0001pt !important;
            mso-margin-top-alt: 0in !important;
            mso-margin-bottom-alt: 0in !important;
            mso-padding-alt: 0in !important;
          }
          body {
            font-family: 'Arial', sans-serif;
            margin: 40px;
            color: #333;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
          }
          .title {
            font-size: 18pt;
            font-weight: bold;
            color: #1e3a8a;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .subtitle {
            font-size: 12pt;
            font-weight: bold;
            color: #475569;
            margin-bottom: 20px;
          }
          .certificate-box {
            border: 4px double #1e3a8a;
            padding: 30px;
            background-color: #fafaf9;
            border-radius: 8px;
          }
          .body-text {
            font-size: 11pt;
            text-align: justify;
            margin-bottom: 30px;
          }
          .highlight {
            font-weight: bold;
            color: #1e3a8a;
          }
          .signature-section {
            margin-top: 50px;
            width: 100%;
          }
          .signature-box {
            width: 100%;
            border-collapse: collapse;
          }
          .signature-cell {
            width: 50%;
            text-align: center;
            vertical-align: bottom;
            font-size: 10pt;
          }
        </style>
      </head>
      <body>
        <div class="certificate-box" style="border: 4px double #1e3a8a; padding: 30px; background-color: #fafaf9; border-radius: 8px;">
          <div class="header" style="text-align: center; margin-bottom: 40px;">
            ${customLogo ? `
              <div style="margin-bottom: 15px; text-align: center;">
                <img src="${customLogo}" width="65" height="65" style="max-height: 65px; max-width: 65px; object-fit: contain; display: block; margin: 0 auto;" />
              </div>
            ` : ''}
            <h1 class="title" style="font-size: 18pt; font-weight: bold; color: #1e3a8a; text-transform: uppercase;">CERTIFICADO DE CUMPLIMIENTO</h1>
            <p class="subtitle" style="font-size: 12pt; font-weight: bold; color: #475569; margin-bottom: 20px;">EVALUACIÓN DE DESEMPEÑO DOCENTE - DECRETO 1278</p>
          </div>
          
          <p class="body-text" style="font-size: 11pt; text-align: justify; margin-bottom: 20px;">
            La rectoría y el comité de evaluación de la <span class="highlight" style="font-weight: bold; color: #1e3a8a;">${evalDoc.lugarConcertacion || institutionName}</span> hace constar que el(la) docente:
          </p>
          
          <p style="text-align: center; font-size: 14pt; font-weight: bold; margin: 20px 0; color: #0f172a;">
            ${teacher.nombre.toUpperCase()}
          </p>
          
          <p class="body-text" style="font-size: 11pt; text-align: center; margin-bottom: 20px;">
            Identificado(a) con Cédula de Ciudadanía No. <span class="highlight" style="font-weight: bold; color: #1e3a8a;">${teacher.cedula}</span>, quien se desempeña en el cargo de <span class="highlight" style="font-weight: bold; color: #1e3a8a;">${teacher.cargo}</span> en la sede <span class="highlight" style="font-weight: bold; color: #1e3a8a;">${teacher.sedeTrabajo}</span>.
          </p>
          
          <p class="body-text" style="font-size: 11pt; text-align: justify; margin-bottom: 20px;">
            Ha reportado, sustentado y allegado a conformidad el total de las evidencias físicas e informes requeridos para soportar las competencias funcionales y comportamentales concertadas correspondientes al <span class="highlight" style="font-weight: bold; color: #1e3a8a;">SEGUIMIENTO ${evalDoc.periodo}</span>. Tras la exhaustiva revisión de la carpeta de evidencias y/o el portafolio consolidado, el docente ha obtenido la aprobación oficial del evaluador directivo, dando cumplimiento satisfactorio a sus compromisos laborales.
          </p>
          
          <p class="body-text" style="font-size: 11pt; font-style: italic; text-align: center; margin-top: 30px;">
            Se expide el presente certificado el día ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}.
          </p>
          
          <table class="signature-section" style="margin-top: 40px; border:none; width:100%; border-collapse: collapse;">
            <tr style="border:none;">
              <td class="signature-cell" style="border:none; width: 50%; text-align: center; font-size: 10pt; vertical-align: top; padding: 10px;">
                ${activeRectorSignature ? `
                  <div style="margin: 0 auto 10px auto; min-height: 55px; text-align: center;">
                    <img src="${activeRectorSignature}" width="145" height="50" style="max-height: 50px; max-width: 145px; object-fit: contain; display: block; margin: 0 auto;" />
                  </div>
                ` : evalDoc.estado === 'Aprobado' ? `
                  <div style="border: 1pt dashed #047857; background-color: #f0fdf4; padding: 8px; text-align: left; font-family: 'Courier New', monospace; font-size: 8pt; color: #047857; margin: 0 auto 10px auto; width: 240px; line-height: 1.3;">
                    <b>✓ RECTORÍA - FIRMADO DIGITAL</b><br/>
                    <b>Sello:</b> CERTIFICADO DE CUMPLIMIENTO<br/>
                    <b>Verif:</b> CERT-VAL-1278-${evalDoc.id}
                  </div>
                ` : '<br/><br/><br/>'}
                _______________________________<br/>
                <b>${evalDoc.evaluadorNombre || 'Rector / Coordinador'}</b><br/>
                Evaluador Directivo
              </td>
              <td class="signature-cell" style="border:none; width: 50%; text-align: center; font-size: 10pt; vertical-align: top; padding: 10px;">
                ${teacher.firmaDocente ? `
                  <div style="margin: 0 auto 10px auto; min-height: 55px; text-align: center;">
                    <img src="${teacher.firmaDocente}" width="145" height="50" style="max-height: 50px; max-width: 145px; object-fit: contain; display: block; margin: 0 auto;" />
                  </div>
                ` : teacher.firmaDocente || evalDoc.estado === 'Aprobado' ? `
                  <div style="border: 1pt dashed #2563eb; background-color: #f0f9ff; padding: 8px; text-align: left; font-family: 'Courier New', monospace; font-size: 8pt; color: #1d4ed8; margin: 0 auto 10px auto; width: 240px; line-height: 1.3;">
                    <b>✓ DOCENTE - FIRMADO DIGITAL</b><br/>
                    <b>Sello:</b> CERTIFICADO DE CUMPLIMIENTO<br/>
                    <b>Verif:</b> CERT-DOC-1278-${evalDoc.id}
                  </div>
                ` : '<br/><br/><br/>'}
                _______________________________<br/>
                <b>${teacher.nombre}</b><br/>
                Docente Evaluado
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;
    downloadWordBlob(htmlContent, `Certificado_Cumplimiento_${teacher.nombre.replace(/\s+/g, '_')}_S${evalDoc.periodo}.doc`);
    showToast('✓ Certificado de Cumplimiento generado con éxito.');
  };

  const handleExportActaSeguimientoWord = (params: {
    numero: string;
    anio: string;
    lugar: string;
    fecha: string;
    hora: string;
    objetivo: string;
    ordenDia: string;
    desarrollo: string;
    cuadroInfo: string;
    docentesObservaciones: DocenteObservacion[];
  }) => {
    const customLogo = localStorage.getItem('iea_custom_logo') || '';
    const activeRectorSignature = rectorSignature || localStorage.getItem('rector_signature_base64') || localStorage.getItem('iea_custom_signature') || '';

    // Split ordenDia into numbered lines
    const ordenDiaList = params.ordenDia.split('\n').filter(line => line.trim() !== '');
    const { dia, mes, anio, completo } = formatFechaEnEspanol(params.fecha);

    // Build the signatures list
    let signatureRowsHtml = '';
    docentesEvaluacion.forEach((emp, index) => {
      signatureRowsHtml += `
        <tr>
          <td style="border: 1pt solid #000000; padding: 6px; text-align: center; vertical-align: middle; font-size: 8.5pt;">${index + 1}</td>
          <td style="border: 1pt solid #000000; padding: 6px; font-size: 9pt;"><b>${emp.nombre.toUpperCase()}</b></td>
          <td style="border: 1pt solid #000000; padding: 6px; font-size: 8.5pt; text-align: center;">C.C. ${emp.cedula}</td>
          <td style="border: 1pt solid #000000; padding: 6px; font-size: 8.5pt;">${emp.cargo || 'Docente'} - Sede ${emp.sedeTrabajo || 'Alvernia'}</td>
          <td style="border: 1pt solid #000000; padding: 6px; text-align: center; vertical-align: middle; min-height: 40px; width: 200px;">
            ${emp.firmaDocente ? `
              <img src="${emp.firmaDocente}" width="130" height="40" style="max-height: 40px; max-width: 130px; object-fit: contain; display: block; margin: 0 auto;" />
            ` : `
              <div style="height: 35px; width: 100%;"></div>
            `}
          </td>
        </tr>
      `;
    });

    // Build Observaciones list
    let observacionesHtml = '<ul style="list-style-type: disc; padding-left: 20px; margin: 10px 0;">';
    params.docentesObservaciones.forEach((doc) => {
      observacionesHtml += `
        <li style="margin-bottom: 12px; font-size: 9.5pt; line-height: 1.45; text-align: justify;">
          <b>${doc.nombre.toUpperCase()}:</b> ${doc.observacion.replace(/\n/g, '<br/>')}
        </li>
      `;
    });
    observacionesHtml += '</ul>';

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title>Acta de Seguimiento</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 8.5in 11.0in;
            margin: 1.2in 0.6in 1.0in 0.6in;
            mso-header-margin: .5in;
            mso-footer-margin: .5in;
            mso-header: h1;
            mso-footer: f1;
          }
          p.MsoFooter, li.MsoFooter, div.MsoFooter {
            margin: 0in !important;
            margin-bottom: .0001pt !important;
            mso-margin-top-alt: 0in !important;
            mso-margin-bottom-alt: 0in !important;
            mso-padding-alt: 0in !important;
            mso-pagination: widow-orphan;
            font-family: 'Arial', sans-serif;
          }
          div.Section1 {
            page: Section1;
          }
          p, li, .MsoNormal, td, th, div, span {
            margin: 0in !important;
            margin-bottom: .0001pt !important;
            mso-margin-top-alt: 0in !important;
            mso-margin-bottom-alt: 0in !important;
            mso-padding-alt: 0in !important;
          }
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 9.5pt;
            line-height: 1.35;
            color: #000000;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1pt solid #000000;
            padding: 4pt 6pt;
            text-align: left;
            font-size: 9pt;
            vertical-align: top;
          }
          .header-title-text {
            font-family: 'Arial', sans-serif;
            font-weight: bold;
            color: #15803d;
            text-transform: uppercase;
          }
          .section-header {
            font-weight: bold;
            background-color: #cbd5e1;
            text-align: center;
            font-size: 9.5pt;
            text-transform: uppercase;
            padding: 5px;
            border: 1pt solid #000000;
          }
          .label-cell {
            font-weight: bold;
            background-color: #f1f5f9;
            width: 25%;
            border: 1pt solid #000000;
          }
          .value-cell {
            width: 25%;
            border: 1pt solid #000000;
          }
          .footer-text {
            font-size: 7.5pt;
            color: #4b5563;
            text-align: center;
            line-height: 1.3;
          }
        </style>
      </head>
      <body>
        <div class="Section1">
          <p class="MsoNormal" style="margin: 0in; margin-bottom: .0001pt; font-size: 6pt; line-height: 6pt;">&nbsp;</p>

          <p class="MsoNormal" style="text-align: center; font-size: 11pt; font-weight: bold; text-transform: uppercase; margin: 0in; margin-bottom: .0001pt; line-height: normal;" align="center">
            ACTA DE SEGUIMIENTO DE COMPROMISOS LABORALES No. ${params.numero}
          </p>
          <p class="MsoNormal" style="text-align: center; font-size: 9pt; font-weight: bold; text-transform: uppercase; margin: 2px 0 0 0; line-height: normal;" align="center">
            VIGENCIA DE EVALUACI&Oacute;N DE DESEMPE&Ntilde;O - A&Ntilde;O ESCOLAR ${params.anio}
          </p>

          <p class="MsoNormal" style="margin: 0in; margin-bottom: .0001pt; font-size: 8pt; line-height: 8pt;">&nbsp;</p>

          <!-- MEETING BASIC DATA -->
          <table style="width: 100%; border-collapse: collapse; border: 1pt solid #000000; margin-bottom: 12px;">
            <tr>
              <th colspan="4" class="section-header">DATOS GENERALES DE LA CONVOCATORIA</th>
            </tr>
            <tr>
              <td class="label-cell" style="font-weight: bold; background-color: #f1f5f9; width: 25%;">Lugar de Reunión:</td>
              <td class="value-cell" style="width: 75%;" colspan="3">${params.lugar}</td>
            </tr>
            <tr>
              <td class="label-cell" style="font-weight: bold; background-color: #f1f5f9; width: 25%;">Fecha:</td>
              <td class="value-cell" style="width: 25%;">${completo || params.fecha}</td>
              <td class="label-cell" style="font-weight: bold; background-color: #f1f5f9; width: 25%;">Hora de Inicio:</td>
              <td class="value-cell" style="width: 25%;">${params.hora}</td>
            </tr>
            <tr>
              <td class="label-cell" style="font-weight: bold; background-color: #f1f5f9; width: 25%;">Participantes:</td>
              <td class="value-cell" style="width: 75%;" colspan="3">Todo el personal docente (Decreto 1278) adscrito a la institución</td>
            </tr>
            <tr>
              <td class="label-cell" style="font-weight: bold; background-color: #f1f5f9; width: 25%;">Evaluador / Facilitador:</td>
              <td class="value-cell" style="width: 75%; font-weight: bold; text-transform: uppercase;" colspan="3">${rectorName} (Cargo: ${localStorage.getItem('iea_rector_cargo') || 'RECTOR'})</td>
            </tr>
          </table>

          <!-- CONFIGURABLE EXTRA INFO TABLE ("el cuadro") -->
          ${params.cuadroInfo ? `
          <p class="MsoNormal" style="margin: 0in; font-size: 8pt; line-height: 8pt;">&nbsp;</p>
          <table style="width: 100%; border-collapse: collapse; border: 1pt solid #000000; margin-bottom: 15px;">
            <tr>
              <th colspan="2" class="section-header" style="background-color: #e2e8f0;">INFORMACI&Oacute;N ADICIONAL DE CONTEXTUALIZACI&Oacute;N</th>
            </tr>
            ${params.cuadroInfo.split('\n').filter(line => line.includes(':')).map(line => {
              const parts = line.split(':');
              const key = parts[0].trim();
              const value = parts.slice(1).join(':').trim();
              return `
                <tr>
                  <td style="width: 35%; font-weight: bold; background-color: #f8fafc; border: 1pt solid #000000; padding: 4pt 6pt;">${key}:</td>
                  <td style="width: 65%; border: 1pt solid #000000; padding: 4pt 6pt;">${value}</td>
                </tr>
              `;
            }).join('')}
          </table>
          ` : ''}

          <p class="MsoNormal" style="margin: 0in; font-size: 8pt; line-height: 8pt;">&nbsp;</p>

          <!-- OBJETIVO -->
          <table style="width: 100%; border-collapse: collapse; border: 1pt solid #000000; margin-bottom: 15px;">
            <tr>
              <th class="section-header">OBJETIVO DE LA REUNION</th>
            </tr>
            <tr>
              <td style="padding: 8pt; font-size: 9.5pt; line-height: 1.45; text-align: justify;">
                ${params.objetivo}
              </td>
            </tr>
          </table>

          <p class="MsoNormal" style="margin: 0in; font-size: 8pt; line-height: 8pt;">&nbsp;</p>

          <!-- ORDEN DEL DIA LISTA -->
          <table style="width: 100%; border-collapse: collapse; border: 1pt solid #000000; margin-bottom: 15px;">
            <tr>
              <th class="section-header">ORDEN DEL DIA.</th>
            </tr>
            <tr>
              <td style="padding: 8pt; font-size: 9.5pt; line-height: 1.5;">
                <ol style="margin-top: 0; margin-bottom: 0; padding-left: 20px;">
                  ${ordenDiaList.map(item => `
                    <li style="margin-bottom: 4px; text-align: justify;">${item.replace(/^\d+[\.\-\s]+/, '')}</li>
                  `).join('')}
                </ol>
              </td>
            </tr>
          </table>

          <p class="MsoNormal" style="margin: 0in; font-size: 8pt; line-height: 8pt;">&nbsp;</p>

          <!-- DESARROLLO INICIAL (Puntos 1, 2, 3...) -->
          <table style="width: 100%; border-collapse: collapse; border: 1pt solid #000000; margin-bottom: 15px;">
            <tr>
              <th class="section-header">DESARROLLO REUNION</th>
            </tr>
            <tr>
              <td style="padding: 8pt; font-size: 9.5pt; line-height: 1.45;">
                ${params.desarrollo.split('\n').map(p => {
                  if (p.trim() === '') return '<div style="margin-bottom: 8px;">&nbsp;</div>';
                  if (/^\d+[\.\-\)]\s/.test(p.trim())) return '<div style="margin-bottom: 8px; text-align: justify;"><b>' + p + '</b></div>';
                  return '<div style="margin-bottom: 8px; text-align: justify;">' + p + '</div>';
                }).join('')}
              </td>
            </tr>
          </table>

          <p class="MsoNormal" style="margin: 0in; font-size: 8pt; line-height: 8pt;">&nbsp;</p>

          <!-- ENTREGA DE EVIDENCIAS -->
          <table style="width: 100%; border-collapse: collapse; border: 1pt solid #000000; margin-bottom: 15px;">
            <tr>
              <th class="section-header">ENTREGA DE EVIDENCIAS</th>
            </tr>
            <tr>
              <td style="padding: 8pt;">
                ${observacionesHtml}
              </td>
            </tr>
          </table>

          <!-- SIGNATURES SECTION -->
          <p class="MsoNormal" style="font-size: 10pt; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; text-align: center;" align="center">
            REGISTRO DE FIRMAS (PERSONAL DOCENTE 1278)
          </p>
          <p class="MsoNormal" style="font-size: 9pt; color: #000000; margin-bottom: 8px;">
            En constancia firman a continuación los docentes de la institución:
          </p>

          <table style="width: 100%; border-collapse: collapse; border: 1pt solid #000000;">
            <thead>
              <tr style="background-color: #cbd5e1; font-weight: bold;">
                <th style="width: 5%; text-align: center; border: 1pt solid #000000; padding: 6px;">No.</th>
                <th style="width: 35%; border: 1pt solid #000000; padding: 6px;">Nombre Completo</th>
                <th style="width: 15%; border: 1pt solid #000000; padding: 6px; text-align: center;">Cédula</th>
                <th style="width: 25%; border: 1pt solid #000000; padding: 6px;">Cargo / Sede</th>
                <th style="width: 20%; border: 1pt solid #000000; padding: 6px; text-align: center;">Firma Autógrafa</th>
              </tr>
            </thead>
            <tbody>
              ${signatureRowsHtml}
            </tbody>
          </table>

          <p class="MsoNormal" style="margin: 0in; margin-bottom: .0001pt; font-size: 20pt; line-height: 20pt;">&nbsp;</p>

          <!-- RECTOR SIGNATURE -->
          <table style="width: 100%; border-collapse: collapse; border: none; margin-top: 20px;">
            <tr style="border: none;">
              <td style="border: none; width: 40%; text-align: left; vertical-align: bottom;">
                ${activeRectorSignature ? `
                  <div style="margin-bottom: 5px; min-height: 55px;">
                    <img src="${activeRectorSignature}" width="150" height="50" style="max-height: 50px; max-width: 150px; object-fit: contain; display: block;" />
                  </div>
                ` : `
                  <div style="height: 50px; border-bottom: 1px solid #000; width: 220px; margin-bottom: 5px;"></div>
                `}
                <p style="font-size: 9pt; font-weight: bold; margin: 0; text-transform: uppercase;">${rectorName}</p>
                <p style="font-size: 8.5pt; color: #4b5563; margin: 2px 0 0 0;">Evaluador Directivo / Rector</p>
                <p style="font-size: 8pt; color: #4b5563; margin: 1px 0 0 0;">${rectorDocument}</p>
              </td>
              <td style="border: none; width: 60%;"></td>
            </tr>
          </table>

          <!-- NATIVE WORD FOOTER WAS MOVED TO THE TOP -->

          <!-- NATIVE WORD HEADER & FOOTER DECLARATION -->
          <div style="display: none;">
            <div style="mso-element:header" id="h1">
            <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 8px;">
              <tr style="border: none;">
                <td style="width: 15%; border: none; text-align: left; vertical-align: middle; padding: 0;" align="left">
                  ${customLogo ? `
                    <img src="${customLogo}" width="55" height="55" style="max-height: 55px; max-width: 55px; object-fit: contain; display: block; margin: 0 auto;" alt="Logo" />
                  ` : `
                    <div style="border: 1.5pt solid #15803d; padding: 6px; font-size: 8pt; font-weight: bold; text-align: center; color: #15803d; width: 45px; line-height: 1.1; margin: 0 auto;">
                      I.E.<br/>ALV
                    </div>
                  `}
                </td>
                <td style="width: 70%; border: none; text-align: center; vertical-align: middle; padding: 0;" align="center">
                  <p class="header-title-text" style="font-size: 11pt; margin: 0; line-height: 1.25; color: #15803d; text-align: center; font-weight: bold;" align="center">
                    ${institutionName || 'INSTITUCIÓN EDUCATIVA ALVERNIA'}
                  </p>
                  <p style="font-size: 8pt; font-weight: bold; color: #15803d; margin: 1px 0 0 0; line-height: 1.2; text-align: center; text-transform: uppercase;" align="center">
                    ${educationalLevel || 'NIVEL PREESCOLAR &ndash; B&Aacute;SICA PRIMARIA Y MEDIA ACAD&Eacute;MICA'}
                  </p>
                  <p style="font-size: 7pt; font-weight: bold; color: #374151; margin: 1px 0 0 0; line-height: 1.2; text-align: center; text-transform: uppercase;" align="center">
                    ${calendario || 'CALENDARIO A'} &ndash; C&Oacute;DIGO DANE ${institutionDane || '186568000567'} &ndash; NIT. ${institutionNit || '891201897-5'}
                  </p>
                </td>
                <td style="width: 15%; border: none;"></td>
              </tr>
            </table>
          </div>

          <div style="mso-element:footer" id="f1">
            <table style="width: 100%; border-collapse: collapse; border: none;">
              <tr style="border: none;">
                <td style="border: none; border-top: 1px solid #cbd5e1; padding-top: 6px; text-align: center;" align="center">
                  <p class="MsoFooter" style="font-weight: bold; font-style: italic; color: #16a34a; font-size: 8pt; text-align: center; margin: 0;" align="center">
                    &ldquo;${footerMotto || 'Brindamos una educación humanística y académica para la excelencia de un ser humano integral'}&rdquo;
                  </p>
                  <p class="MsoFooter" style="font-size: 7.5pt; color: #4b5563; text-align: center; margin: 2px 0 0 0;" align="center">
                    ${footerAddress || 'Barrio San Martin Carrera 16 No. 12 – 77'} | ${footerEmails || 'alvernia@sedputumayo.gov.co – rectoralvernia@gmail.com'} &ndash; ${footerWebsite || 'www.ie-alvernia.edu.co'}
                  </p>
                  <p class="MsoFooter" style="font-size: 7.5pt; color: #4b5563; text-align: center; margin: 1px 0 0 0;" align="center">
                    ${footerCity || 'Puerto Asís - Putumayo'}
                  </p>
                </td>
              </tr>
            </table>
          </div>

        </div>
      </body>
      </html>
    `;

    downloadWordBlob(htmlContent, `Acta_Seguimiento_Decreto1278_Acta${params.numero}.doc`);
    showToast(`✓ Acta de Seguimiento No. ${params.numero} exportada a Word correctamente.`);
  };

  const handleExportGeneralActaWord = async (params: {
    numero: string;
    anio: string;
    lugar: string;
    fecha: string;
    hora: string;
    objetivo: string;
    ordenDia: string;
    desarrollo: string;
    cuadroInfo: string;
    cronograma: CronogramaRow[];
  }) => {
    try {
      showToast('Generando documento de Word...');
      const blob = await generarActaGeneralWord({
        ...params,
        docentes: docentesEvaluacion
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Acta_General_Decreto1278_Acta${params.numero}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast(`✓ Acta General No. ${params.numero} exportada a Word correctamente.`);
    } catch (error) {
      console.error('Error generating word document', error);
      showToast('Error al generar el documento Word');
    }
  };

  const downloadWordBlob = (htmlString: string, filename: string) => {
    // Convert HTML with base64 images into MHTML format so that Microsoft Word can open it natively
    // and render embedded images without security blocks or "corrupted file" errors.
    let mhtmlImages = '';
    let imageCounter = 0;

    // Regex to capture base64-encoded image data
    const imgRegex = /src=["']data:image\/(jpeg|png|gif|svg\+xml|jpg);base64,([^"']+)["']/gi;

    const updatedHtml = htmlString.replace(imgRegex, (_, mimeSubtype, base64Data) => {
      const cid = `img_attachment_${imageCounter}`;
      imageCounter++;

      // Strip any whitespace from the base64 string
      const cleanBase64 = base64Data.replace(/\s/g, '');

      mhtmlImages += `\r\n--NEXT.ITEM-BOUNDARY\r\n`;
      mhtmlImages += `Content-Type: image/${mimeSubtype}\r\n`;
      mhtmlImages += `Content-Transfer-Encoding: base64\r\n`;
      mhtmlImages += `Content-ID: <${cid}>\r\n`;
      mhtmlImages += `Content-Location: ${cid}\r\n\r\n`;
      mhtmlImages += cleanBase64 + `\r\n`;

      return `src="cid:${cid}"`;
    });

    const mhtmlContent = 
      `MIME-Version: 1.0\r\n` +
      `Content-Type: multipart/related; boundary="NEXT.ITEM-BOUNDARY"\r\n\r\n` +
      `--NEXT.ITEM-BOUNDARY\r\n` +
      `Content-Type: text/html; charset="utf-8"\r\n` +
      `Content-Transfer-Encoding: 8bit\r\n\r\n` +
      updatedHtml + `\r\n` +
      mhtmlImages + 
      `\r\n--NEXT.ITEM-BOUNDARY--\r\n`;

    const blob = new Blob([mhtmlContent], {
      type: 'application/msword;charset=utf-8'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isReadOnly = false; // Always allow modifications per user request

  const renderPortfolioUpload = () => {
    if (!activeEvaluacion || selectedPeriod === 1) return null;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6 mt-6 mb-4">
        {/* Helper/Model Download Column */}
        <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
          <div className="space-y-1.5 font-sans">
            <div className="flex items-center gap-2 text-emerald-600">
              <FileSpreadsheet className="w-5 h-5 shrink-0" />
              <h5 className="text-xs font-black uppercase tracking-wider text-slate-800">Modelo de Portafolio Decreto 1278</h5>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Descargue el modelo autocompletado en Word con la portada, introducción y las fichas listas para cada competencia. Úselo de guía para armar su carpeta de evidencias.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleExportWordModelFormat(currentTeacher!)}
            className="mt-3 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shadow-emerald-600/10 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Descargar Formato Guía (Word)
          </button>
        </div>

        {/* PDF Portfolio Upload Column */}
        <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100 flex flex-col justify-between font-sans">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-blue-600">
              <FolderArchive className="w-5 h-5 shrink-0" />
              <h5 className="text-xs font-black uppercase tracking-wider text-slate-800">Portafolio Compilado PDF (Firmado)</h5>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Suba aquí su portafolio consolidado final en formato PDF (máximo 20MB) para este período de seguimiento.
            </p>
          </div>

          <div className="mt-2">
            {activeEvaluacion.portfolioPdfUrl ? (
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 truncate">
                  <FileCheck className="w-5 h-5 text-blue-600 shrink-0" />
                  <div className="truncate text-left">
                    <p className="text-xs font-bold text-slate-800 truncate">{activeEvaluacion.portfolioPdfName || `portafolio_seguimiento_${selectedPeriod}.pdf`}</p>
                    <span className="text-[9px] text-slate-500 font-medium">Portafolio guardado en la nube (R2)</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeEvaluacion.portfolioPdfUrl) {
                        if (activeEvaluacion.portfolioPdfUrl.startsWith('http://') || activeEvaluacion.portfolioPdfUrl.startsWith('https://')) {
                          window.open(activeEvaluacion.portfolioPdfUrl, '_blank');
                        } else {
                          const link = document.createElement('a');
                          link.href = activeEvaluacion.portfolioPdfUrl;
                          link.download = activeEvaluacion.portfolioPdfName || 'portafolio.pdf';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      }
                    }}
                    className="py-1 px-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs cursor-pointer flex items-center gap-1 font-bold transition-colors"
                    title="Ver Portafolio"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Ver
                  </button>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={handleRemovePortfolioPdf}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs cursor-pointer transition-colors"
                      title="Eliminar Portafolio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              !isReadOnly ? (
                <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white transition-colors shadow-sm">
                  <FileUp className="w-6 h-6 text-slate-400" />
                  <span className="text-xs font-bold text-slate-700">Subir Portafolio PDF</span>
                  <span className="text-[9px] text-slate-400 font-medium">Arrastre o seleccione archivo PDF</span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePortfolioPdfUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <p className="text-xs text-slate-400 italic font-sans text-center">No se ha cargado portafolio PDF consolidado.</p>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" id="evaluacion-1278-root">
      
      {/* HEADER CARD */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm" id="evaluacion-header-card">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Evaluación de Desempeño Laboral (Decreto 1278)</h2>
          </div>
          <p className="text-xs text-slate-400">Plataforma de concertación de compromisos, registro de evidencias y generación de Anexos 2 y 5.</p>
        </div>

        {currentTeacher ? (
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 px-4 py-2 rounded-xl text-right">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest leading-none">Sesión Docente:</p>
              <p className="text-sm font-black text-white mt-1 leading-none">{currentTeacher.nombre}</p>
            </div>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-200"
              title="Actualizar Datos de Perfil y Firma"
              id="btn-header-profile-teacher"
            >
              <UserCog className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Perfil / Firma</span>
            </button>
            <button
              onClick={() => {
                setCurrentTeacher(null);
                showToast('Sesión del portal docente finalizada.');
              }}
              className="py-2.5 px-3 bg-red-950/30 hover:bg-red-950/60 border border-red-900/40 text-red-400 hover:text-white rounded-xl text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer"
              title="Cerrar sesión de docente"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500 font-mono">Modo Administrador Activo</p>
        )}
      </div>

      {/* PORTAL CORE LAYOUT */}
      {!currentTeacher ? (
        /* Modulo de Administración o Selección de ingreso */
        <div className="w-full bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-sm" id="admin-docente-dashboard">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-base">Control de Seguimiento Directivo (Administración)</h3>
              <p className="text-xs text-slate-500">Supervise, apruebe y genere reportes oficiales de los compromisos concertados.</p>
            </div>

            {/* Central Database and Excel upload controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={fetchEvaluacionesFromSupabase}
                className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 cursor-pointer border border-slate-200 transition-colors"
                title="Actualizar evaluaciones de Supabase"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sincronizar Nube
              </button>

              <label className="py-1.5 px-3 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-[10px] font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1.5 cursor-pointer transition-colors">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Cargar Excel Docentes
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleExcelDocentesUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => setIsActaSelectorModalOpen(true)}
                className="py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer border transition-all bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-700 shadow-sm"
                title="Crear nueva acta"
              >
                <Plus className="w-3.5 h-3.5" />
                Crear Acta
              </button>

              <button
                onClick={() => {
                  fetchActas();
                  fetchActasSeguimiento();
                  setIsVisualizerOpen(true);
                }}
                className="py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer border transition-all bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-700 shadow-sm"
                title="Ver historial de actas guardadas"
              >
                <FolderArchive className="w-3.5 h-3.5" />
                Historial de Actas
              </button>

            </div>
          </div>

          {/* Excel Import Format Helper and Template Downloader */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-slate-650" id="excel-docentes-format-info">
            <div className="space-y-1">
              <p className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Info className="w-4 h-4 text-blue-600" />
                Formato Permitido de Importación de Docentes (Excel)
              </p>
              <p className="text-slate-600 leading-relaxed">
                El archivo debe contener como cabeceras las columnas: 
                <span className="font-mono bg-white border px-1 py-0.5 rounded text-blue-800 ml-1 font-bold">Nombre</span>, 
                <span className="font-mono bg-white border px-1 py-0.5 rounded text-blue-800 ml-1 font-bold">Cedula</span>, 
                <span className="font-mono bg-white border px-1 py-0.5 rounded text-blue-800 ml-1 font-bold">Cargo</span> y 
                <span className="font-mono bg-white border px-1 py-0.5 rounded text-blue-800 ml-1 font-bold">Sede</span>.
              </p>
              <p className="text-[11px] text-slate-500">
                Cargos válidos permitidos: <strong className="text-slate-750">Docente de Aula</strong>, <strong className="text-slate-750">Docente Orientador</strong> o <strong className="text-slate-750">Directivo Docente</strong>.
              </p>
            </div>
            <button
              onClick={() => {
                const ws = XLSX.utils.json_to_sheet([
                  { Nombre: 'Carlos Alirio Ruiz', Cedula: '12780001', Cargo: 'Docente de Aula', Sede: 'COL ALVERNIA', Area: 'Básica Primaria', Nombramiento: 'Propiedad' },
                  { Nombre: 'María Constanza Gómez', Cedula: '12780002', Cargo: 'Docente Orientador', Sede: 'SAN MARTIN', Area: 'Orientación', Nombramiento: 'Periodo de Prueba' },
                  { Nombre: 'Jesús Humberto Pérez', Cedula: '12780003', Cargo: 'Directivo Docente', Sede: 'SANTO DOMINGO SAVIO', Area: 'Coordinación', Nombramiento: 'Propiedad' }
                ]);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Docentes 1278');
                XLSX.writeFile(wb, 'plantilla_docentes_evaluacion.xlsx');
                showToast('✓ Plantilla de Excel generada y descargada.');
              }}
              className="py-2 px-4 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start md:self-center transition-all shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-650" />
              Descargar Plantilla Excel
            </button>
          </div>

          {/* ACTA SELECTOR MODAL */}
          {isActaSelectorModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white border-2 border-slate-800 shadow-2xl rounded-3xl w-full max-w-md overflow-hidden flex flex-col animate-scale-up">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">Crear Nueva Acta</h2>
                    <p className="text-xs text-slate-500 mt-1">Selecciona el tipo de acta que deseas generar</p>
                  </div>
                  <button onClick={() => setIsActaSelectorModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <button
                    onClick={() => {
                      setIsActaSelectorModalOpen(false);
                      setIsActaGeneralModalOpen(true);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-blue-100 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 transition-all text-left group cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-blue-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Award className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 uppercase text-sm">Acta General</h3>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">Concertación colectiva inicial de compromisos</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsActaSelectorModalOpen(false);
                      setActaSeguimientoType(1);
                      setActaSegNumero('01');
                      setActaSegObjetivo('Realizar el seguimiento a la entrega de las evidencias (Testimoniales / Documentales) correspondientes al Primer Seguimiento (Decreto 1278).');
                      setIsActaSeguimientoModalOpen(true);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-300 transition-all text-left group cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-emerald-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileCheck className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 uppercase text-sm">Acta Seguimiento 1</h3>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">Primer seguimiento de entrega de evidencias</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsActaSelectorModalOpen(false);
                      setActaSeguimientoType(2);
                      setActaSegNumero('02');
                      setActaSegObjetivo('Realizar el seguimiento a la entrega de las evidencias (Testimoniales / Documentales) correspondientes al Segundo Seguimiento (Decreto 1278).');
                      setIsActaSeguimientoModalOpen(true);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-teal-100 bg-teal-50/50 hover:bg-teal-50 hover:border-teal-300 transition-all text-left group cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-teal-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileSignature className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 uppercase text-sm">Acta Seguimiento 2</h3>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">Segundo seguimiento de entrega de evidencias</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ACTAS VISUALIZER MODAL */}
          {isVisualizerOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" id="actas-visualizer-modal">
              <div className="bg-white border-2 border-slate-800 shadow-2xl rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-up" id="actas-visualizer-container">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white relative z-10 pb-0">
                  <div className="flex items-center justify-between w-full pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                        <Archive className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Historial de Actas</h2>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                          {savedActas.length + savedActasSeguimiento.length} actas guardadas en la base de datos
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setIsVisualizerOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Tabs */}
                  <div className="flex items-center gap-6 border-b border-slate-200">
                    <button
                      onClick={() => setHistorialTab('general')}
                      className={`pb-3 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 relative -mb-[1px] cursor-pointer ${
                        historialTab === 'general' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Actas Generales
                      <span className="ml-2 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md text-[9px]">{savedActas.length}</span>
                    </button>
                    <button
                      onClick={() => setHistorialTab('seguimiento')}
                      className={`pb-3 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 relative -mb-[1px] cursor-pointer ${
                        historialTab === 'seguimiento' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Actas de Seguimiento
                      <span className="ml-2 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md text-[9px]">{savedActasSeguimiento.length}</span>
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                  {historialTab === 'general' && (
                    savedActas.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 flex flex-col items-center">
                        <Archive className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-wider">No hay actas generales guardadas</p>
                        <p className="text-[10px] mt-1">Genera y guarda un acta general para verla aquí.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {savedActas.map(acta => (
                          <div key={acta.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4 hover:border-indigo-200 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0">
                                  ACTA GENERAL {acta.numero} - {acta.anio}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">{acta.fecha}</span>
                              </div>
                              <p className="text-xs font-bold text-slate-700 truncate">{acta.objetivo || 'Sin objetivo especificado'}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => {
                                  handleExportGeneralActaWord(acta);
                                }}
                                className="py-1.5 px-3 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Descargar Word"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Descargar
                              </button>
                              <button
                                onClick={() => {
                                  setCurrentActaId(acta.id);
                                  setActaGenNumero(acta.numero);
                                  setActaGenAnio(acta.anio);
                                  setActaGenFecha(acta.fecha);
                                  setActaGenHora(acta.hora);
                                  setActaGenLugar(acta.lugar);
                                  setActaGenObjetivo(acta.objetivo);
                                  setActaGenOrdenDia(acta.ordenDia);
                                  setActaGenDesarrollo(acta.desarrollo);
                                  setActaGenCuadroInfo(acta.cuadroInfo);
                                  setActaGenCronograma(acta.cronograma || []);
                                  setIsVisualizerOpen(false);
                                  setIsActaGeneralModalOpen(true);
                                }}
                                className="py-1.5 px-3 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Editar Acta"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Editar
                              </button>
                              <button
                                onClick={async () => {
                                  if (window.confirm('¿Seguro que deseas eliminar esta acta?')) {
                                    setSavedActas(prev => prev.filter(a => a.id !== acta.id));
                                    try {
                                      await fetch(`/api/actas/${acta.id}`, { method: 'DELETE' });
                                      fetchActas();
                                    } catch (err) {
                                      console.error('Error deleting acta', err);
                                      fetchActas(); // Revert on error
                                    }
                                  }
                                }}
                                className="py-1.5 px-3 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Eliminar Acta"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {historialTab === 'seguimiento' && (
                    savedActasSeguimiento.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 flex flex-col items-center">
                        <FolderArchive className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-wider">No hay actas de seguimiento guardadas</p>
                        <p className="text-[10px] mt-1">Genera y guarda un acta de seguimiento para verla aquí.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {savedActasSeguimiento.map(acta => (
                          <div key={acta.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4 hover:border-emerald-200 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0">
                                  ACTA SEGUIMIENTO {acta.numero} - {acta.anio}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">{acta.fecha}</span>
                              </div>
                              <p className="text-xs font-bold text-slate-700 truncate">{acta.objetivo || 'Sin objetivo especificado'}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => {
                                  handleExportActaSeguimientoWord(acta);
                                }}
                                className="py-1.5 px-3 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Descargar Word"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Descargar
                              </button>
                              <button
                                onClick={() => {
                                  setCurrentActaSeguimientoId(acta.id);
                                  setActaSegNumero(acta.numero);
                                  setActaSegAnio(acta.anio);
                                  setActaSegFecha(acta.fecha);
                                  setActaSegHora(acta.hora);
                                  setActaSegLugar(acta.lugar);
                                  setActaSegObjetivo(acta.objetivo);
                                  setActaSegOrdenDia(acta.ordenDia);
                                  setActaSegDesarrollo(acta.desarrollo);
                                  setActaSegCuadroInfo(acta.cuadroInfo);
                                  setActaSegDocentesObs(acta.docentesObservaciones || []);
                                  setIsVisualizerOpen(false);
                                  setIsActaSeguimientoModalOpen(true);
                                }}
                                className="py-1.5 px-3 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Editar Acta"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Editar
                              </button>
                              <button
                                onClick={async () => {
                                  if (window.confirm('¿Seguro que deseas eliminar esta acta de seguimiento?')) {
                                    try {
                                      await fetch(`/api/actas-seguimiento/${acta.id}`, { method: 'DELETE' });
                                      fetchActasSeguimiento();
                                    } catch (err) {
                                      console.error('Error deleting acta', err);
                                    }
                                  }
                                }}
                                className="py-1.5 px-3 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Eliminar Acta"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ACTA DE SEGUIMIENTO MODAL */}
          {isActaSeguimientoModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" id="acta-seguimiento-modal">
              <div className="bg-white border-2 border-slate-800 shadow-2xl rounded-3xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col animate-scale-up" id="acta-seguimiento-modal-container">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-wider font-sans">
                      {actaSeguimientoType === 1 ? 'Acta de Seguimiento de Entrega de Evidencias' : 'Acta de Segundo Seguimiento de Entrega de Evidencias'}
                    </h3>
                  </div>
                  <button onClick={() => setIsActaSeguimientoModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Número Acta</label>
                      <input type="text" value={actaSegNumero} onChange={e => setActaSegNumero(e.target.value)} className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Año Escolar</label>
                      <input type="text" value={actaSegAnio} onChange={e => setActaSegAnio(e.target.value)} className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Fecha</label>
                      <input type="date" value={actaSegFecha} onChange={e => setActaSegFecha(e.target.value)} className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Hora Inicio</label>
                      <input type="text" value={actaSegHora} onChange={e => setActaSegHora(e.target.value)} className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
                    </div>
                    <div className="space-y-1 md:col-span-4">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Lugar de Reunión</label>
                      <input type="text" value={actaSegLugar} onChange={e => setActaSegLugar(e.target.value)} className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                      Objetivo de la Reunión
                    </label>
                    <textarea value={actaSegObjetivo} onChange={e => setActaSegObjetivo(e.target.value)} className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 min-h-[60px]" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                      Orden del Día
                    </label>
                    <textarea value={actaSegOrdenDia} onChange={e => setActaSegOrdenDia(e.target.value)} className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 min-h-[100px]" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                      Desarrollo de la Reunión (Hasta antes de Entrega de Evidencias)
                    </label>
                    <textarea value={actaSegDesarrollo} onChange={e => setActaSegDesarrollo(e.target.value)} className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 min-h-[140px]" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                      Información Adicional (Cuadro Extra en la portada)
                    </label>
                    <textarea value={actaSegCuadroInfo} onChange={e => setActaSegCuadroInfo(e.target.value)} className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 min-h-[70px]" placeholder="Ej: Vigencia: 2024\nDirigido a: Docentes" />
                  </div>

                  {/* Observaciones de Entrega de Evidencias */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h4 className="font-extrabold text-sm text-slate-800 uppercase flex items-center gap-2">
                        <UserCog className="w-4 h-4 text-emerald-600" />
                        Observaciones de Entrega por Docente
                      </h4>
                      <button
                        onClick={initActaSeguimientoDocentes}
                        className="py-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded flex items-center gap-1 transition-colors"
                      >
                        <RefreshCcw className="w-3 h-3" />
                        Actualizar Lista
                      </button>
                    </div>

                    <div className="space-y-3">
                      {actaSegDocentesObs.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4 italic">No hay docentes en la lista. Carga el Excel de docentes primero.</p>
                      ) : (
                        actaSegDocentesObs.map((doc, index) => (
                          <div key={doc.docenteId} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-slate-800">{index + 1}. {doc.nombre}</span>
                              <span className="text-xs text-slate-500 font-mono">C.C. {doc.cedula}</span>
                            </div>
                            <textarea
                              value={doc.observacion}
                              onChange={(e) => {
                                const newObs = [...actaSegDocentesObs];
                                newObs[index].observacion = e.target.value;
                                setActaSegDocentesObs(newObs);
                              }}
                              className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                              rows={2}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* Footer with Actions */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-3xl">
                  <button onClick={() => setIsActaSeguimientoModalOpen(false)} className="py-2.5 px-5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer">
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      setIsSavingActaSeguimiento(true);
                      const actaData: ActaSeguimientoData = {
                        id: currentActaSeguimientoId || crypto.randomUUID(),
                        numero: actaSegNumero,
                        anio: actaSegAnio,
                        fecha: actaSegFecha,
                        lugar: actaSegLugar,
                        hora: actaSegHora,
                        objetivo: actaSegObjetivo,
                        ordenDia: actaSegOrdenDia,
                        desarrollo: actaSegDesarrollo,
                        cuadroInfo: actaSegCuadroInfo,
                        docentesObservaciones: actaSegDocentesObs
                      };

                      try {
                        await fetch('/api/actas-seguimiento', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(actaData)
                        });
                        
                        // Descargar
                        handleExportActaSeguimientoWord(actaData);
                        
                        // Refrescar y cerrar
                        fetchActasSeguimiento();
                        setCurrentActaSeguimientoId(null);
                        setIsActaSeguimientoModalOpen(false);
                      } catch (err) {
                        console.error('Error guardando acta seguimiento', err);
                        alert('Error guardando el acta. Igualmente se descargará.');
                        handleExportActaSeguimientoWord(actaData);
                      } finally {
                        setIsSavingActaSeguimiento(false);
                      }
                    }}
                    disabled={isSavingActaSeguimiento}
                    className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    {isSavingActaSeguimiento ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Guardar y Descargar Word
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ACTA DE CONCERTACIÓN GENERAL MODAL */}
          {isActaGeneralModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" id="acta-general-modal">
              <div className="bg-white border-2 border-slate-800 shadow-2xl rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-y-auto flex flex-col animate-scale-up" id="acta-general-modal-container">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
                  <div className="flex items-center gap-2.5">
                    <Award className="w-5 h-5 text-blue-600" />
                    <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-wider font-sans">
                      Generar Acta General de Concertación (Decreto 1278)
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsActaGeneralModalOpen(false)}
                    className="p-1.5 hover:bg-slate-150 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
                    aria-label="Cerrar modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-700">
                  <p className="text-xs text-slate-500 bg-blue-50 border border-blue-150 p-3 rounded-2xl leading-relaxed">
                    ℹ️ Esta acta es general y obligatoria para todos los docentes de la institución educativa. 
                    Al exportarse a Word, se incluirán de forma automática <strong>todos los {docentesEvaluacion.length} docentes</strong> registrados en la base de datos con sus respectivos campos de firmas autógrafas e identificaciones, tal como lo exige el proceso unificado de control de seguimiento directivo.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Número de Acta</label>
                      <input
                        type="text"
                        value={actaGenNumero}
                        onChange={e => setActaGenNumero(e.target.value)}
                        placeholder="Ej: 01"
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Año Escolar / Vigencia</label>
                      <input
                        type="text"
                        value={actaGenAnio}
                        onChange={e => setActaGenAnio(e.target.value)}
                        placeholder="Ej: 2026"
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Hora de la Reunión</label>
                      <input
                        type="text"
                        value={actaGenHora}
                        onChange={e => setActaGenHora(e.target.value)}
                        placeholder="Ej: 08:00 AM"
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Lugar de Celebración</label>
                      <input
                        type="text"
                        value={actaGenLugar}
                        onChange={e => setActaGenLugar(e.target.value)}
                        placeholder="Ej: Puerto Asís, Sala de Juntas o Rectoría de la Institución"
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Fecha de Celebración</label>
                      <input
                        type="date"
                        value={actaGenFecha}
                        onChange={e => setActaGenFecha(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Objetivo General</label>
                    <textarea
                      value={actaGenObjetivo}
                      onChange={e => setActaGenObjetivo(e.target.value)}
                      rows={2}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 resize-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">
                        Orden del Día (Una línea por punto)
                      </label>
                      <textarea
                        value={actaGenOrdenDia}
                        onChange={e => setActaGenOrdenDia(e.target.value)}
                        rows={6}
                        className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-[11px] leading-relaxed focus:outline-none focus:border-blue-500"
                        placeholder="1. Verificación de asistencia..."
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">
                        Información Solicitada en el Cuadro Adicional (Formato Clave: Valor)
                      </label>
                      <textarea
                        value={actaGenCuadroInfo}
                        onChange={e => setActaGenCuadroInfo(e.target.value)}
                        rows={6}
                        className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-[11px] leading-relaxed focus:outline-none focus:border-blue-500"
                        placeholder="Año de vigencia: 2026&#10;Grados implicados: Prescolar, Primaria y Media"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Desarrollo del Acta y Acuerdos Adoptados</label>
                    <textarea
                      value={actaGenDesarrollo}
                      onChange={e => setActaGenDesarrollo(e.target.value)}
                      rows={6}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold leading-relaxed focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Cronograma de Evaluación (Personalizable)</label>
                      <button
                        type="button"
                        onClick={() => {
                          setActaGenCronograma([...actaGenCronograma, { etapa: '', fecha: '', actividad: '', producto: '', responsable: '' }]);
                        }}
                        className="py-1 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-[10px] font-bold tracking-wider"
                      >
                        + AÑADIR FILA
                      </button>
                    </div>
                    
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-[10px]">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-600">
                          <tr>
                            <th className="p-2 text-left w-[15%]">ETAPAS</th>
                            <th className="p-2 text-left w-[20%]">FECHA</th>
                            <th className="p-2 text-left w-[35%]">ACTIVIDAD</th>
                            <th className="p-2 text-left w-[15%]">PRODUCTO</th>
                            <th className="p-2 text-left w-[15%]">RESPONSABLE</th>
                            <th className="p-2 w-8"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {actaGenCronograma.map((row, idx) => (
                            <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                              <td className="p-1">
                                <textarea
                                  value={row.etapa}
                                  onChange={e => {
                                    const newC = [...actaGenCronograma];
                                    newC[idx].etapa = e.target.value;
                                    setActaGenCronograma(newC);
                                  }}
                                  className="w-full p-1.5 border border-slate-200 rounded focus:border-blue-500 min-h-[40px] resize-y"
                                />
                              </td>
                              <td className="p-1">
                                <textarea
                                  value={row.fecha}
                                  onChange={e => {
                                    const newC = [...actaGenCronograma];
                                    newC[idx].fecha = e.target.value;
                                    setActaGenCronograma(newC);
                                  }}
                                  className="w-full p-1.5 border border-slate-200 rounded focus:border-blue-500 min-h-[40px] resize-y"
                                />
                              </td>
                              <td className="p-1">
                                <textarea
                                  value={row.actividad}
                                  onChange={e => {
                                    const newC = [...actaGenCronograma];
                                    newC[idx].actividad = e.target.value;
                                    setActaGenCronograma(newC);
                                  }}
                                  className="w-full p-1.5 border border-slate-200 rounded focus:border-blue-500 min-h-[40px] resize-y"
                                />
                              </td>
                              <td className="p-1">
                                <textarea
                                  value={row.producto}
                                  onChange={e => {
                                    const newC = [...actaGenCronograma];
                                    newC[idx].producto = e.target.value;
                                    setActaGenCronograma(newC);
                                  }}
                                  className="w-full p-1.5 border border-slate-200 rounded focus:border-blue-500 min-h-[40px] resize-y"
                                />
                              </td>
                              <td className="p-1">
                                <textarea
                                  value={row.responsable}
                                  onChange={e => {
                                    const newC = [...actaGenCronograma];
                                    newC[idx].responsable = e.target.value;
                                    setActaGenCronograma(newC);
                                  }}
                                  className="w-full p-1.5 border border-slate-200 rounded focus:border-blue-500 min-h-[40px] resize-y"
                                />
                              </td>
                              <td className="p-1 text-center">
                                <button
                                  onClick={() => {
                                    const newC = actaGenCronograma.filter((_, i) => i !== idx);
                                    setActaGenCronograma(newC);
                                  }}
                                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                  title="Eliminar fila"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 rounded-b-3xl">
                  <button
                    type="button"
                    onClick={() => setIsActaGeneralModalOpen(false)}
                    className="py-2.5 px-5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isSavingActa}
                    onClick={async () => {
                      setIsSavingActa(true);
                      const actaId = currentActaId || `ACTA-${Date.now()}`;
                      const actaData = {
                        id: actaId,
                        numero: actaGenNumero,
                        anio: actaGenAnio,
                        lugar: actaGenLugar,
                        fecha: actaGenFecha,
                        hora: actaGenHora,
                        objetivo: actaGenObjetivo,
                        ordenDia: actaGenOrdenDia,
                        desarrollo: actaGenDesarrollo,
                        cuadroInfo: actaGenCuadroInfo,
                        cronograma: actaGenCronograma
                      };

                      try {
                        const res = await fetch('/api/actas', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(actaData)
                        });
                        if (res.ok) {
                          setCurrentActaId(actaId);
                          fetchActas(); // Refrescar la lista en segundo plano
                        }
                      } catch (err) {
                        console.error('Error saving acta:', err);
                      }

                      handleExportGeneralActaWord(actaData);
                      setIsSavingActa(false);
                      setIsActaGeneralModalOpen(false);
                    }}
                    className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    {isSavingActa ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Generar y Guardar Acta Word
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* Admin Filter / Search & Year Selector */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Buscar docente por nombre o cédula..."
                value={adminSearchQuery}
                onChange={(e) => setAdminSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all outline-none"
              />
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 min-w-[160px]">
              <Calendar className="w-4 h-4 text-slate-400" />
              <select
                value={selectedAnio}
                onChange={(e) => setSelectedAnio(Number(e.target.value))}
                className="bg-transparent text-slate-700 text-sm font-bold w-full focus:outline-none cursor-pointer outline-none"
              >
                {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(year => (
                  <option key={year} value={year}>Vigencia {year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* List of Teachers with Evaluation status */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="admin-evaluations-table">
              <thead>
                <tr className="border-b border-slate-150 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Docente / Detalles</th>
                  <th className="pb-3 hidden sm:table-cell">Sede</th>
                  <th className="pb-3 text-center">Seguimientos</th>
                  <th className="pb-3 text-right pr-2">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {docentesEvaluacion
                  .filter(emp => emp.cargo.toLowerCase().includes('docente') || emp.cargo.toLowerCase().includes('rector') || emp.cargo.toLowerCase().includes('coordinador'))
                  .filter(emp => emp.nombre.toLowerCase().includes(adminSearchQuery.toLowerCase()) || emp.cedula.includes(adminSearchQuery))
                  .map(emp => {
                    // Get tracking records for this teacher
                    const tracked = evaluaciones.filter(ev => ev.cedula === emp.cedula && (ev.anio === selectedAnio || ev.anio === undefined));

                    return (
                      <tr key={emp.cedula} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 pl-2">
                          <p className="font-extrabold text-slate-800 text-sm leading-tight">{emp.nombre}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                            <span className="text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-mono font-bold w-fit">C.C. {emp.cedula}</span>
                            <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded font-bold uppercase w-fit">{emp.cargo}</span>
                            <span className="sm:hidden text-[10px] text-slate-500 font-semibold truncate max-w-[140px]">{emp.sedeTrabajo}</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-slate-600 font-semibold hidden sm:table-cell">{emp.sedeTrabajo}</td>
                        <td className="py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {[1, 2, 3].map(p => {
                              const ev = tracked.find(e => Number(e.periodo) === p);
                              let badgeColor = 'bg-slate-100 text-slate-400 border-slate-200';
                              if (ev?.estado === 'Borrador') badgeColor = 'bg-amber-50 text-amber-600 border-amber-200';
                              if (ev?.estado === 'Enviado') badgeColor = 'bg-blue-50 text-blue-600 border-blue-200 animate-pulse';
                              if (ev?.estado === 'Aprobado') badgeColor = 'bg-emerald-50 text-emerald-600 border-emerald-200';
                              if (ev?.estado === 'Corregir') badgeColor = 'bg-rose-50 text-rose-600 border-rose-200';

                              return (
                                <button
                                  type="button"
                                  key={p}
                                  onClick={() => ev && setSelectedEvalForInspection(ev)}
                                  disabled={!ev}
                                  className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full border ${badgeColor} ${ev ? 'cursor-pointer hover:opacity-80' : 'opacity-50 cursor-not-allowed'}`}
                                  title={`Seguimiento ${p}: ${ev?.estado || 'Sin Iniciar'}`}
                                >
                                  S{p}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          <div className="flex items-center justify-end gap-2">
                            {tracked.length > 0 ? (
                              <button
                                onClick={() => {
                                  const toReview = tracked.find(e => e.estado === 'Enviado') || 
                                                   tracked.find(e => e.estado === 'Corregir') ||
                                                   tracked.find(e => Number(e.periodo) === 1) || 
                                                   tracked[0];
                                  setSelectedEvalForInspection(toReview);
                                }}
                                className="py-1.5 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                                title="Revisar Evaluación"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Revisar</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold italic mr-1">Sin iniciar</span>
                            )}

                            {/* Edit Teacher button */}
                            <button
                              onClick={() => handleStartEditTeacher(emp)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer border border-amber-200"
                              title="Editar Datos de Docente"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Teacher button */}
                            <button
                              onClick={() => handleStartDeleteTeacher(emp)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer border border-rose-200"
                              title="Eliminar Docente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* PORTAL DOCENTE: Active Screen */
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6" id="teacher-dashboard-main">
          
          {/* Navigation Tab selection for Teacher */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-bold uppercase tracking-widest border border-blue-200">PORTAL OFICIAL DE DOCENTES</span>
              <h3 className="font-extrabold text-slate-800 text-lg mt-1.5">Ficha de Evaluación Docente</h3>
              <p className="text-xs text-slate-500">Gestione y documente sus compromisos y evidencias obligatorias.</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Messages Button */}
              {(() => {
                const hasCorrections = evaluaciones.some(e => e.cedula === currentTeacher.cedula && e.estado === 'Corregir' && e.observacionesAdmin?.trim());
                const btnColor = hasCorrections 
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200' 
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200';
                return (
                  <button
                    id="btn-open-messages"
                    onClick={() => setIsMessagesModalOpen(true)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border shadow-sm ${btnColor}`}
                    title="Ver mensajes y correcciones del evaluador"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Retroalimentación</span>
                  </button>
                );
              })()}

              {/* Year Selector */}
              <div className="flex flex-col items-end">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vigencia (Año)</label>
                <select
                  value={selectedAnio}
                  onChange={(e) => setSelectedAnio(Number(e.target.value))}
                  className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm outline-none"
                >
                  {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Period Selection Button Group */}
              <div className="flex flex-wrap items-center w-full md:w-auto gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                {[1, 2, 3].map(p => {
                  const limitDateStr = habilitationDates[p];
                  const formattedLimit = limitDateStr ? limitDateStr.split('-').reverse().join('/') : '';
                  
                  const isBlocked = false;

                  return (
                    <button
                      key={p}
                      onClick={() => !isBlocked && setSelectedPeriod(p as any)}
                      disabled={isBlocked}
                      title={isBlocked ? `Requiere Seguimiento ${p - 1} Aprobado` : ''}
                      className={`flex-1 sm:flex-none py-1.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-0.5 ${
                        isBlocked
                          ? 'bg-slate-50 text-slate-300 cursor-not-allowed border border-transparent opacity-60'
                          : selectedPeriod === p
                            ? 'bg-blue-600 text-white shadow-sm cursor-pointer'
                            : 'text-slate-600 hover:bg-slate-200 cursor-pointer'
                      }`}
                    >
                      <span>{p === 1 ? 'S1 (Concertación)' : `S${p} (Evidencia)`}</span>
                      {formattedLimit && (
                        <span className={`text-[9px] font-bold tracking-normal normal-case ${isBlocked ? 'text-slate-300' : selectedPeriod === p ? 'text-blue-200' : 'text-slate-400'}`}>
                          Límite: {formattedLimit}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* HABILITATION DATE PENDING ALERT */}
          {(() => {
            const minHabilitatedDate = habilitationDates[selectedPeriod];
            if (!minHabilitatedDate) return null;
            const todayStr = new Date().toISOString().substring(0, 10);
            const isPeriodHabilitated = todayStr >= minHabilitatedDate;
            if (isPeriodHabilitated) return null;
            const parts = minHabilitatedDate.split('-');
            const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : '';
            return (
              <div className="bg-amber-50 border border-amber-300 p-4.5 rounded-2xl flex items-start gap-3.5 font-sans animate-fade-in" id="habilitation-pending-alert">
                <Calendar className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">⚠️ Presentación de {selectedPeriod === 1 ? 'Seguimiento 1 (Concertación)' : `Seguimiento ${selectedPeriod} (Evidencia ${selectedPeriod})`} Pendiente de Habilitación</p>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Las directivas institucionales han establecido que la presentación para el <strong>{selectedPeriod === 1 ? 'Seguimiento 1 (Concertación)' : `Seguimiento ${selectedPeriod} (Evidencia ${selectedPeriod})`}</strong> estará oficialmente habilitada a partir del <strong className="text-amber-900">{formattedDate}</strong>.
                  </p>
                  <p className="text-xs text-amber-700 font-semibold leading-relaxed">
                    Podrá preparar y guardar borradores locales de sus compromisos y evidencias físicas durante este lapso, pero el botón de envío para revisión oficial permanecerá inhabilitado hasta alcanzar la fecha indicada.
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Inline feedback note removed per request */}

          {/* Form states header */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Estado de Ficha:</p>
              <div className="flex items-center gap-2 mt-1.5">
                {activeEvaluacion?.estado === 'Borrador' && <span className="bg-amber-50 text-amber-600 text-xs px-2.5 py-1 rounded-md font-extrabold uppercase border border-amber-200">📝 Borrador local</span>}
                {activeEvaluacion?.estado === 'Enviado' && <span className="bg-blue-50 text-blue-600 text-xs px-2.5 py-1 rounded-md font-extrabold uppercase border border-blue-200 animate-pulse">📤 Enviado a Rector</span>}
                {activeEvaluacion?.estado === 'Aprobado' && <span className="bg-emerald-50 text-emerald-600 text-xs px-2.5 py-1 rounded-md font-extrabold uppercase border border-emerald-200">🛡️ Aprobado oficial</span>}
                {activeEvaluacion?.estado === 'Corregir' && <span className="bg-rose-50 text-rose-600 text-xs px-2.5 py-1 rounded-md font-extrabold uppercase border border-rose-200">⚠️ Requiere corrección</span>}
              </div>
            </div>

            <div className="md:col-span-3 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Descargar Documentos para Word:</p>
              <div className="flex flex-wrap gap-2 mt-1.5">
                <button
                  onClick={() => {
                    if (activeEvaluacion) handleExportWordActa(activeEvaluacion, currentTeacher!);
                  }}
                  className="py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  Acta de Concertación
                </button>
                <button
                  onClick={() => {
                    if (activeEvaluacion) handleExportWordAnexo5(activeEvaluacion, currentTeacher!);
                  }}
                  className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  Competencias (Anexo 5)
                </button>
                <button
                  onClick={() => {
                    if (activeEvaluacion) handleExportWordAnexo2(activeEvaluacion, currentTeacher!);
                  }}
                  className="py-1.5 px-3 bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-fuchsia-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  Evidencias (Anexo 2)
                </button>
              </div>
            </div>
          </div>

          {activeEvaluacion && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mt-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                🔒 Datos de Concertación establecidos por el Administrador (Solo Lectura):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">📅 Fecha de Concertación</label>
                  <input
                    type="date"
                    value={activeEvaluacion.fechaConcertacion}
                    disabled={true}
                    className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">⏰ Hora de Concertación</label>
                  <input
                    type="text"
                    value={activeEvaluacion.horaConcertacion || '08:00 AM'}
                    disabled={true}
                    className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">📍 Lugar de Concertación</label>
                  <input
                    type="text"
                    value={activeEvaluacion.lugarConcertacion || institutionName || 'INSTITUCIÓN EDUCATIVA ALVERNIA'}
                    disabled={true}
                    className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}


          {/* Sub view toggle for teacher dashboard - Only shown in Seguimiento 1 */}
          {selectedPeriod === 1 && (
            <div className="flex border-b border-slate-200" id="teacher-tabs">
              <button
                onClick={() => setPortalView('anexo2')}
                className={`py-3 px-6 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                  portalMode === 'anexo2'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Tabla de Resumen de Evidencias Anexo 2
              </button>
              <button
                onClick={() => setPortalView('compromisos')}
                className={`py-3 px-6 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                  portalMode === 'compromisos'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Compromisos Anexo 5
              </button>
            </div>
          )}

          {/* PORTAL VIEW 1: COMPROMISOS ANEXO 5 */}
          {selectedPeriod === 1 && portalMode === 'compromisos' && activeEvaluacion && (
            <div className="space-y-6 animate-fade-in" id="portal-compromisos-view">
              
              {/* Guidance step banner */}
              <div className="bg-amber-50/75 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-black text-amber-800 uppercase tracking-wide">Paso 2 de 2: Diligenciar el Anexo 5 (Compromisos)</p>
                  <p className="text-xs text-amber-950 font-medium leading-relaxed">
                    De acuerdo con las instrucciones oficiales, <strong>primero debe registrar y soportar las evidencias en la Tabla de Evidencias Anexo 2</strong>, y luego proceder a registrar aquí las contribuciones individuales y criterios de evaluación asociados a cada área de gestión.
                  </p>
                </div>
              </div>

              {/* Header Info inputs */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Nombre del Evaluador (Rector/Coordinador)</label>
                  <input
                    type="text"
                    value={activeEvaluacion.evaluadorNombre}
                    onChange={(e) => setActiveEvaluacion({ ...activeEvaluacion, evaluadorNombre: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Ej: Lic. María Constanza Gómez"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Cédula del Evaluador</label>
                  <input
                    type="text"
                    value={activeEvaluacion.evaluadorCedula}
                    onChange={(e) => setActiveEvaluacion({ ...activeEvaluacion, evaluadorCedula: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Ej: 87246722"
                  />
                </div>
              </div>

              {/* Functional Competencies (8 standard ones) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                  <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">Compromisos de Competencias Funcionales (70%)</h4>
                </div>

                {/* Porcentaje summary header card */}
                {(() => {
                  const acadSum = activeEvaluacion.compromisosFuncionales
                    .filter(c => c.area === 'Académica')
                    .reduce((acc, c) => acc + (c.porcentaje ?? 12.5), 0);
                  const adminSum = activeEvaluacion.compromisosFuncionales
                    .filter(c => c.area === 'Administrativa')
                    .reduce((acc, c) => acc + (c.porcentaje ?? 5.0), 0);
                  const comunSum = activeEvaluacion.compromisosFuncionales
                    .filter(c => c.area === 'Comunitaria')
                    .reduce((acc, c) => acc + (c.porcentaje ?? 5.0), 0);
                  const totalSum = acadSum + adminSum + comunSum;

                  return (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wide text-blue-900">Distribución de Porcentajes del 70% (Asignado por Evaluador)</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">La distribución de porcentajes es administrada y ajustada por la rectoría o coordinación evaluadora.</p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Total Funcionales:</span>
                          <span className={`text-sm font-black ${Math.abs(totalSum - 70) < 0.01 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {totalSum.toFixed(1)}%
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">/ 70.0%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                        <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20">
                          <span className="font-bold text-slate-600">Académica:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="70"
                              value={acadSum}
                              onChange={(e) => handleAreaPercentageChange('Académica', parseFloat(e.target.value) || 0, false)}
                              className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-right font-extrabold text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="font-extrabold text-slate-500">%</span>
                          </div>
                        </div>
                        <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20">
                          <span className="font-bold text-slate-600">Administrativa:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="70"
                              value={adminSum}
                              onChange={(e) => handleAreaPercentageChange('Administrativa', parseFloat(e.target.value) || 0, false)}
                              className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-right font-extrabold text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="font-extrabold text-slate-500">%</span>
                          </div>
                        </div>
                        <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20">
                          <span className="font-bold text-slate-600">Comunitaria:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="70"
                              value={comunSum}
                              onChange={(e) => handleAreaPercentageChange('Comunitaria', parseFloat(e.target.value) || 0, false)}
                              className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-right font-extrabold text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="font-extrabold text-slate-500">%</span>
                          </div>
                        </div>
                      </div>

                      {Math.abs(totalSum - 70) < 0.01 ? (
                        <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>¡Suma perfecta! Los porcentajes suman exactamente el 70% requerido para competencias funcionales.</span>
                        </p>
                      ) : totalSum < 70 ? (
                        <p className="text-[11px] text-amber-600 font-bold flex items-center gap-1 bg-amber-50/50 p-2 rounded-lg border border-amber-100 animate-pulse">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Falta asignar {(70 - totalSum).toFixed(1)}% para completar el 70.0% requerido.</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1 bg-rose-50/50 p-2 rounded-lg border border-rose-100">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Suma excede el límite por {(totalSum - 70).toFixed(1)}%. Ajuste los porcentajes para que sumen exactamente 70.0%.</span>
                        </p>
                      )}
                    </div>
                  );
                })()}

                <div className="space-y-6">
                  {activeEvaluacion.compromisosFuncionales.map((cf, index) => (
                    <div key={index} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      {/* Sub-header inside Card */}
                      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest bg-slate-200/50 px-2 py-0.5 rounded">{cf.area}</span>
                          <span className="text-xs font-extrabold text-slate-700">{cf.competencia}</span>
                        </div>
                        <div>
                          <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-extrabold border border-blue-100">
                            {cf.porcentaje !== undefined ? cf.porcentaje : (cf.area === 'Académica' ? 12.5 : 5.0)}%
                          </span>
                        </div>
                      </div>

                      {/* Text inputs inside card */}
                      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Contribución Individual (Plan de trabajo/compromiso)</label>
                          <textarea
                            value={cf.contribucion || ''}
                            onChange={(e) => handleFunctionalChange(index, 'contribucion', e.target.value)}
                            rows={3}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder={SUGGESTED_FUNCTIONALS.find(s => s.competencia === cf.competencia)?.contribucion || "Escriba la contribución concreta..."}
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Criterios de Evaluación</label>
                            <button
                              type="button"
                              onClick={() => {
                                const currentCriteria = cf.criterios || '';
                                setActiveCriteriaSelectorIndex(index);
                                setIsCriteriaSelectorForAdmin(false);
                                const matchKey = Object.keys(OFFICIAL_EVALUATION_CRITERIA).find(
                                  key => key.toLowerCase().trim() === cf.competencia.toLowerCase().trim()
                                ) || cf.competencia;
                                const options = OFFICIAL_EVALUATION_CRITERIA[matchKey] || [];
                                // Pre-select options that are already in currentCriteria
                                const preselected = options.filter(opt => 
                                  currentCriteria.toLowerCase().includes(opt.toLowerCase().trim()) ||
                                  currentCriteria.toLowerCase().includes(opt.toLowerCase().replace(/\./g, '').trim())
                                );
                                setSelectedCriteriaTemp(preselected);
                              }}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline flex items-center gap-1 cursor-pointer"
                            >
                              <ClipboardList className="w-3.5 h-3.5" />
                              Elegir de Lista Oficial
                            </button>
                          </div>
                          <textarea
                            value={cf.criterios || ''}
                            onChange={(e) => handleFunctionalChange(index, 'criterios', e.target.value)}
                            rows={3}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder={SUGGESTED_FUNCTIONALS.find(s => s.competencia === cf.competencia)?.criterios || "Escriba los criterios de evaluación..."}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Evidencias Propuestas</label>
                          <textarea
                            value={cf.evidencias || ''}
                            onChange={(e) => handleFunctionalChange(index, 'evidencias', e.target.value)}
                            rows={3}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder={SUGGESTED_FUNCTIONALS.find(s => s.competencia === cf.competencia)?.evidencias || "Escriba la lista de evidencias propuestas..."}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Behavior Competencies (3 chosen ones) */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <FileSignature className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">Compromisos de Competencias Comportamentales (30%)</h4>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-600 leading-relaxed">
                  Para el seguimiento anual se deben concertar obligatoriamente <strong>tres (3) competencias comportamentales</strong> definidas en la Guía Metodológica 31.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Select 1 */}
                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Competencia Comportamental #1</label>
                      <select
                        value={compSel1}
                        onChange={(e) => setCompSel1(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                      >
                        {COMPORTAMENTALES_OPCIONES.map(o => (
                          <option key={o} value={o} disabled={o === compSel2 || o === compSel3}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Criterios de Evaluación y Evidencias</label>
                        <button
                          type="button"
                          onClick={() => {
                            const compName = activeEvaluacion.compromisosComportamentales[0]?.competencia || compSel1;
                            const currentEvidencias = activeEvaluacion.compromisosComportamentales[0]?.evidencias || '';
                            setActiveBehaviorSelectorIndex(0);
                            setIsBehaviorSelectorForAdmin(false);
                            
                            const matchKey = Object.keys(OFFICIAL_EVALUATION_CRITERIA).find(
                              key => key.toLowerCase().trim() === compName.toLowerCase().trim()
                            ) || compName;
                            const options = OFFICIAL_EVALUATION_CRITERIA[matchKey] || [];
                            const preselected = options.filter(opt => 
                              currentEvidencias.toLowerCase().includes(opt.toLowerCase().trim())
                            );
                            setSelectedCriteriaTemp(preselected);
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline flex items-center gap-1 cursor-pointer"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          Elegir de Lista Oficial
                        </button>
                      </div>
                      <textarea
                        value={activeEvaluacion.compromisosComportamentales[0]?.evidencias || ''}
                        onChange={(e) => handleComportamentalChange(0, 'evidencias', e.target.value)}
                        rows={4}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Ej: Participación proactiva y liderazgo positivo en actividades pedagógicas."
                      />
                    </div>
                  </div>

                  {/* Select 2 */}
                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Competencia Comportamental #2</label>
                      <select
                        value={compSel2}
                        onChange={(e) => setCompSel2(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                      >
                        {COMPORTAMENTALES_OPCIONES.map(o => (
                          <option key={o} value={o} disabled={o === compSel1 || o === compSel3}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Criterios de Evaluación y Evidencias</label>
                        <button
                          type="button"
                          onClick={() => {
                            const compName = activeEvaluacion.compromisosComportamentales[1]?.competencia || compSel2;
                            const currentEvidencias = activeEvaluacion.compromisosComportamentales[1]?.evidencias || '';
                            setActiveBehaviorSelectorIndex(1);
                            setIsBehaviorSelectorForAdmin(false);
                            
                            const matchKey = Object.keys(OFFICIAL_EVALUATION_CRITERIA).find(
                              key => key.toLowerCase().trim() === compName.toLowerCase().trim()
                            ) || compName;
                            const options = OFFICIAL_EVALUATION_CRITERIA[matchKey] || [];
                            const preselected = options.filter(opt => 
                              currentEvidencias.toLowerCase().includes(opt.toLowerCase().trim())
                            );
                            setSelectedCriteriaTemp(preselected);
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline flex items-center gap-1 cursor-pointer"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          Elegir de Lista Oficial
                        </button>
                      </div>
                      <textarea
                        value={activeEvaluacion.compromisosComportamentales[1]?.evidencias || ''}
                        onChange={(e) => handleComportamentalChange(1, 'evidencias', e.target.value)}
                        rows={4}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Ej: Comunicación clara y empática con directivos, docentes y comunidad escolar."
                      />
                    </div>
                  </div>

                  {/* Select 3 */}
                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Competencia Comportamental #3</label>
                      <select
                        value={compSel3}
                        onChange={(e) => setCompSel3(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                      >
                        {COMPORTAMENTALES_OPCIONES.map(o => (
                          <option key={o} value={o} disabled={o === compSel1 || o === compSel2}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Criterios de Evaluación y Evidencias</label>
                        <button
                          type="button"
                          onClick={() => {
                            const compName = activeEvaluacion.compromisosComportamentales[2]?.competencia || compSel3;
                            const currentEvidencias = activeEvaluacion.compromisosComportamentales[2]?.evidencias || '';
                            setActiveBehaviorSelectorIndex(2);
                            setIsBehaviorSelectorForAdmin(false);
                            
                            const matchKey = Object.keys(OFFICIAL_EVALUATION_CRITERIA).find(
                              key => key.toLowerCase().trim() === compName.toLowerCase().trim()
                            ) || compName;
                            const options = OFFICIAL_EVALUATION_CRITERIA[matchKey] || [];
                            const preselected = options.filter(opt => 
                              currentEvidencias.toLowerCase().includes(opt.toLowerCase().trim())
                            );
                            setSelectedCriteriaTemp(preselected);
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline flex items-center gap-1 cursor-pointer"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          Elegir de Lista Oficial
                        </button>
                      </div>
                      <textarea
                        value={activeEvaluacion.compromisosComportamentales[2]?.evidencias || ''}
                        onChange={(e) => handleComportamentalChange(2, 'evidencias', e.target.value)}
                        rows={4}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Ej: Aporte y colaboración en equipos de trabajo interdisciplinares."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {renderPortfolioUpload()}

              {/* SAVE & SUBMIT TRIGGERS */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="py-2.5 px-5 border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4 text-slate-500" />
                  Guardar Borrador
                </button>
                <button
                  type="button"
                  onClick={handleSubmitForReview}
                  className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-500/10"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Enviar a Revisión
                </button>
              </div>

            </div>
          )}

          {/* PORTAL VIEW 2: ANEXO 2 (TABLA DE RESUMEN DE EVIDENCIAS) */}
          {selectedPeriod === 1 && portalMode === 'anexo2' && activeEvaluacion && (
            <div className="space-y-6 animate-fade-in" id="portal-anexo2-view">
              
              {/* Guidance step banner */}
              <div className="bg-blue-50/75 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-black text-blue-800 uppercase tracking-wide">Paso 1 de 2: Registrar Tabla de Evidencias Anexo 2</p>
                  <p className="text-xs text-blue-950 font-medium leading-relaxed">
                    De acuerdo con las directrices institucionales, <strong>primero debe completar la Tabla de Evidencias (Anexo 2)</strong> registrando todos sus soportes del período académico, y posteriormente diligenciar los compromisos funcionales y comportamentales en la pestaña del Anexo5.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">Evidencias Recopiladas (Anexo 2)</h4>
                  <p className="text-xs text-slate-500">Agregue, organice y asocie sus soportes físicos o testimoniales.</p>
                </div>

                <button
                  onClick={handleAddEvidenceRow}
                  className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/10"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Fila Evidencia
                </button>
              </div>

              {/* Row mapping container */}
              <div className="space-y-4">
                {activeEvaluacion.evidenciasAnexo2.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center gap-3">
                    <Paperclip className="w-8 h-8 text-slate-400" />
                    <p className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">No hay evidencias cargadas en este período.</p>
                    <p className="text-[11px] text-slate-400 max-w-xs">Haga clic en "Agregar Fila" para empezar a registrar soportes didácticos, informes o certificaciones.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeEvaluacion.evidenciasAnexo2.map((row, index) => (
                      <div key={row.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative space-y-4">
                        
                        {/* Header metadata row */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 font-mono px-2 py-0.5 rounded">
                            Evidencia #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveEvidenceRow(row.id)}
                            className="p-1 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar evidencia"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Interactive inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          {/* Folio */}
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Folio No.</label>
                            <input
                              type="text"
                              value={row.folio || ''}
                              onChange={(e) => handleEvidenceRowChange(row.id, 'folio', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Ej: 1-4"
                            />
                          </div>

                          {/* Fecha */}
                          <div className="md:col-span-3">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Fecha Incorporación</label>
                            <input
                              type="date"
                              value={row.fecha || ''}
                              onChange={(e) => handleEvidenceRowChange(row.id, 'fecha', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          {/* Tipo */}
                          <div className="md:col-span-3">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Tipo de Evidencia</label>
                            <select
                              value={row.tipo}
                              onChange={(e) => handleEvidenceRowChange(row.id, 'tipo', e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                            >
                              <option value="D">D - Documental (Escrita, Fotos)</option>
                              <option value="T">T - Testimonial (Encuestas, Actas)</option>
                            </select>
                          </div>

                          {/* Competencias */}
                          <div className="md:col-span-4">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Competencias que Soporta</label>
                            <input
                              type="text"
                              value={row.competenciasSoportadas || ''}
                              onChange={(e) => handleEvidenceRowChange(row.id, 'competenciasSoportadas', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Ej: Dominio curricular, Planeación"
                            />
                            
                            {/* Clickable suggested competency tags */}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {[
                                'Dominio curricular',
                                'Planeación',
                                'Pedagógica',
                                'Evaluación',
                                'Recursos',
                                'Seguimiento',
                                'Comunicación',
                                'Comunidad',
                                'Compromiso',
                                'Trabajo en equipo',
                                'Liderazgo'
                              ].map(comp => {
                                const isActive = row.competenciasSoportadas && row.competenciasSoportadas.toLowerCase().includes(comp.toLowerCase());
                                return (
                                  <button
                                    key={comp}
                                    type="button"
                                    onClick={() => {
                                      const parts = row.competenciasSoportadas ? row.competenciasSoportadas.split(',').map(p => p.trim()).filter(Boolean) : [];
                                      const idx = parts.findIndex(p => p.toLowerCase() === comp.toLowerCase());
                                      if (idx >= 0) {
                                        parts.splice(idx, 1);
                                      } else {
                                        parts.push(comp);
                                      }
                                      handleEvidenceRowChange(row.id, 'competenciasSoportadas', parts.join(', '));
                                    }}
                                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold transition-colors cursor-pointer border ${
                                      isActive 
                                        ? 'bg-blue-600 border-blue-600 text-white' 
                                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                    }`}
                                  >
                                    {comp}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Name / Description & File Support */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
                          <div className="md:col-span-8">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Nombre / Descripción de la Evidencia</label>
                            <input
                              type="text"
                              value={row.nombre || ''}
                              onChange={(e) => handleEvidenceRowChange(row.id, 'nombre', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Ej: Informe anual de rendimiento académico de grado 5°"
                            />
                          </div>

                          {/* Attachment management */}
                          <div className="md:col-span-4 flex flex-col justify-end">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Soporte Adjunto</label>
                            {row.fileName ? (
                              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between gap-2 text-xs">
                                <span className="font-semibold text-slate-700 truncate max-w-[150px]" title={row.fileName}>{row.fileName}</span>
                                <div className="flex gap-1.5 shrink-0">
                                  <button
                                    onClick={() => handleDownloadFile(row)}
                                    className="p-1 hover:bg-blue-100 text-blue-600 rounded"
                                    title="Descargar archivo"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleEvidenceRowChange(row.id, 'fileName', undefined);
                                      handleEvidenceRowChange(row.id, 'fileSize', undefined);
                                      handleEvidenceRowChange(row.id, 'fileType', undefined);
                                      handleEvidenceRowChange(row.id, 'fileBase64', undefined);
                                    }}
                                    className="p-1 hover:bg-red-100 text-red-500 rounded"
                                    title="Quitar soporte"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label className="w-full flex items-center justify-center border border-dashed border-slate-300 hover:border-blue-400 py-2 rounded-lg cursor-pointer transition-colors text-[11px] font-bold text-slate-600 gap-1.5 bg-slate-50/50 hover:bg-blue-50/20">
                                <Upload className="w-3.5 h-3.5 text-slate-500" />
                                Subir Soporte (PDF/Word)
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx"
                                  onChange={(e) => handleFileUpload(e, row.id)}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

              {renderPortfolioUpload()}

              {/* SAVE & SUBMIT TRIGGERS */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="py-2.5 px-5 border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4 text-slate-500" />
                  Guardar Borrador
                </button>
                <button
                  type="button"
                  onClick={handleSubmitForReview}
                  className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-500/10"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Enviar a Revisión
                </button>
              </div>

            </div>
          )}

          {/* PORTAL VIEW 3: SEGUIMIENTO 2 & 3 (SUBIR EVIDENCIAS Y PORTAFOLIO) */}
          {selectedPeriod >= 2 && activeEvaluacion && (
            <div className="space-y-6 animate-fade-in" id="portal-seguimiento-23-view">
              
              {/* Guidance step banner */}
              <div className="bg-blue-50/75 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-black text-blue-800 uppercase tracking-wide font-sans">
                    Seguimiento {selectedPeriod} (Evidencia {selectedPeriod}): Reporte de Evidencias Físicas y Portafolio
                  </p>
                  <p className="text-xs text-blue-950 font-medium leading-relaxed font-sans">
                    De acuerdo con las instrucciones oficiales, en los periodos de evidencias 2 y 3 el docente reporta las evidencias de las competencias concertadas en el <strong>Seguimiento 1 (Anexo 5)</strong> y/o el Portafolio Compilado PDF. Las competencias son de lectura únicamente y no se pueden modificar una vez aprobadas por el evaluador.
                  </p>
                </div>
              </div>

              {/* Check if Seguimiento 1 is approved */}
              {(() => {
                const evalS1 = evaluaciones.find(e => e.cedula === currentTeacher?.cedula && Number(e.periodo) === 1);
                const isS1Aprobado = evalS1?.estado === 'Aprobado';
                if (!isS1Aprobado) {
                  return (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs font-semibold text-amber-900 flex items-start gap-2.5" id="s1-not-approved-warning">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="font-sans">
                        <p className="font-extrabold text-amber-800 uppercase tracking-wider mb-1">⚠️ Concertación Pendiente de Aprobación</p>
                        <p className="text-slate-600 font-medium leading-normal">
                          Los compromisos y el resumen de evidencias del <strong>Seguimiento 1</strong> deben ser revisados y aprobados por el Rector/Evaluador para formalizar el proceso. Sin embargo, puede ir guardando borradores de sus evidencias de seguimiento.
                        </p>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs font-semibold text-emerald-900 flex items-start gap-2.5" id="s1-approved-success">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="font-sans">
                      <p className="font-extrabold text-emerald-800 uppercase tracking-wider mb-1">✓ Concertación de Seguimiento 1 Aprobada</p>
                      <p className="text-slate-600 font-medium leading-normal">
                        La concertación oficial de compromisos y el resumen de evidencias del Seguimiento 1 ya fue aprobada por las directivas institucionales. Proceda a adjuntar las evidencias físicas correspondientes a continuación.
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Certificate of completion when Seguimiento is Approved */}
              {activeEvaluacion.estado === 'Aprobado' && (
                <div className="bg-emerald-50 border-2 border-emerald-300 p-5 rounded-2xl text-xs text-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans" id="completion-certificate-banner">
                  <div className="flex items-start gap-3 text-left">
                    <Award className="w-8 h-8 text-emerald-600 shrink-0" />
                    <div className="space-y-1">
                      <p className="font-extrabold text-sm uppercase tracking-wider text-emerald-800">🎉 ¡Felicidades! Seguimiento Aprobado</p>
                      <p className="font-medium text-slate-600">
                        Sus evidencias y soportes físicos correspondientes a <strong>Seguimiento {selectedPeriod} (Evidencia {selectedPeriod})</strong> han sido verificados y aprobados con éxito por el Rector. Ya puede descargar su certificado oficial de cumplimiento.
                      </p>
                      <div className="pt-4 mt-6">
                        {renderPortfolioUpload()}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExportCertificateWord(activeEvaluacion, currentTeacher!)}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl uppercase tracking-widest text-[10px] shadow-md shadow-emerald-500/10 transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    Descargar Certificado
                  </button>
                </div>
              )}

              {/* DOWNLOAD TEMPLATE & UPLOAD PDF PORTFOLIO COMPONENT */}
              <div className="pt-4 mt-6">
                {renderPortfolioUpload()}
              </div>

              {/* LIST OF EVIDENCES BY COMPETENCY (ANEXO 5) */}
              <div className="space-y-4" id="evidences-by-competency-section">
                <div className="border-b border-slate-100 pb-2 font-sans">
                  <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">Reportar Soportes Físicos por Competencia (Anexo 5)</h4>
                  <p className="text-xs text-slate-500">Suba soportes específicos para cada una de las competencias concertadas.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {(() => {
                    const evalS1 = evaluaciones.find(e => e.cedula === currentTeacher?.cedula && Number(e.periodo) === 1);
                    
                    const functionalCompSel = evalS1?.compromisosFuncionales && evalS1.compromisosFuncionales.length > 0
                      ? evalS1.compromisosFuncionales
                      : SUGGESTED_FUNCTIONALS;
                      
                    const behavioralCompSel = evalS1?.compromisosComportamentales && evalS1.compromisosComportamentales.length > 0
                      ? evalS1.compromisosComportamentales
                      : [
                          { competencia: compSel1, evidencias: '' },
                          { competencia: compSel2, evidencias: '' },
                          { competencia: compSel3, evidencias: '' }
                        ];

                    return (
                      <>
                        {/* Functional Competencies Header */}
                        <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mt-2 font-sans">Competencias Funcionales</div>
                        {functionalCompSel.map((item, idx) => {
                          const fileSupport = activeEvaluacion.evidenciasAnexo2.find(
                            row => row.competenciasSoportadas?.toLowerCase().trim() === item.competencia.toLowerCase().trim()
                          );

                          return (
                            <div key={`func-${idx}`} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow grid grid-cols-1 md:grid-cols-3 gap-4 items-center" id={`competency-card-${idx}`}>
                              <div className="md:col-span-2 space-y-2 font-sans text-left">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-black text-slate-800">{item.competencia}</span>
                                  <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{item.area}</span>
                                  <span className="text-[9px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-black">{item.porcentaje !== undefined ? item.porcentaje : (item.area === 'Académica' ? 12.5 : 5.0)}%</span>
                                </div>
                                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                  <p><strong className="text-[10px] text-slate-400 uppercase tracking-wider block">Contribución Concertada (S1):</strong> {item.contribucion || 'No descrita'}</p>
                                  <p className="pt-1.5"><strong className="text-[10px] text-slate-400 uppercase tracking-wider block">Criterios de Evaluación (S1):</strong> {item.criterios || 'No descritos'}</p>
                                </div>
                              </div>

                              <div className="md:col-span-1 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-4 flex flex-col justify-center items-center font-sans gap-2">
                                <span className="text-[10px] font-extrabold uppercase text-slate-500">¿Subió Soporte?</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={isReadOnly}
                                    onClick={() => handleToggleSoporteFisico(item.competencia, true)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                      !!fileSupport 
                                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 shadow-sm' 
                                        : 'bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100'
                                    } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    SÍ
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isReadOnly}
                                    onClick={() => handleToggleSoporteFisico(item.competencia, false)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                      !fileSupport 
                                        ? 'bg-rose-100 text-rose-700 border border-rose-300 shadow-sm' 
                                        : 'bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100'
                                    } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    NO
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Behavioral Competencies Header */}
                        <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mt-6 font-sans">Competencias Comportamentales</div>
                        {behavioralCompSel.map((item, idx) => {
                          const fileSupport = activeEvaluacion.evidenciasAnexo2.find(
                            row => row.competenciasSoportadas?.toLowerCase().trim() === item.competencia.toLowerCase().trim()
                          );

                          return (
                            <div key={`behav-${idx}`} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow grid grid-cols-1 md:grid-cols-3 gap-4 items-center" id={`behav-competency-card-${idx}`}>
                              <div className="md:col-span-2 space-y-2 font-sans text-left">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-black text-slate-800">{item.competencia}</span>
                                  <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Comportamental</span>
                                </div>
                                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                  <p><strong className="text-[10px] text-slate-400 uppercase tracking-wider block">Evidencias / Soporte Concertado (S1):</strong> {item.evidencias || 'No descrito'}</p>
                                </div>
                              </div>

                              <div className="md:col-span-1 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-4 flex flex-col justify-center items-center font-sans gap-2">
                                <span className="text-[10px] font-extrabold uppercase text-slate-500">¿Subió Soporte?</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={isReadOnly}
                                    onClick={() => handleToggleSoporteFisico(item.competencia, true)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                      !!fileSupport 
                                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 shadow-sm' 
                                        : 'bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100'
                                    } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    SÍ
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isReadOnly}
                                    onClick={() => handleToggleSoporteFisico(item.competencia, false)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                      !fileSupport 
                                        ? 'bg-rose-100 text-rose-700 border border-rose-300 shadow-sm' 
                                        : 'bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100'
                                    } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    NO
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* SAVE & SUBMIT TRIGGERS */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 font-sans">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="py-2.5 px-5 border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Save className="w-4 h-4 text-slate-500" />
                  Guardar Borrador
                </button>
                <button
                  type="button"
                  onClick={handleSubmitForReview}
                  className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-500/10 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Enviar a Revisión
                </button>
              </div>

            </div>
          )}

        </div>
      )}

      {/* --- ADMIN INSPECTION MODAL --- */}
      {selectedEvalForInspection && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4" id="admin-inspection-modal-backdrop">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200"
            id="admin-inspection-modal-box"
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base leading-none">Revisión de Compromisos (Docente 1278)</h3>
              </div>
              <button
                onClick={() => setSelectedEvalForInspection(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-bold"
              >
                Cerrar ✕
              </button>
            </div>

            {/* Modal Body with scrolls */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
              {/* Header profile details */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Funcionario:</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-1">
                    {docentesEvaluacion.find(e => e.cedula === selectedEvalForInspection.cedula)?.nombre || 'Desconocido'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Cédula:</p>
                  <p className="text-sm font-semibold text-slate-600 mt-1 font-mono">{selectedEvalForInspection.cedula}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Seguimiento:</p>
                  <p className="text-sm font-bold text-blue-600 mt-1 uppercase">
                    {selectedEvalForInspection.periodo === 1 ? 'Seguimiento 1 (Concertación)' : `Seguimiento ${selectedEvalForInspection.periodo} (Evidencia ${selectedEvalForInspection.periodo})`}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Estado:</p>
                  <div className="mt-1">
                    {selectedEvalForInspection.estado === 'Borrador' && <span className="bg-amber-50 text-amber-600 text-[10px] px-2 py-0.5 rounded border border-amber-200 font-bold uppercase">Borrador</span>}
                    {selectedEvalForInspection.estado === 'Enviado' && <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded border border-blue-200 font-bold uppercase">Recibido</span>}
                    {selectedEvalForInspection.estado === 'Aprobado' && <span className="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-0.5 rounded border border-emerald-200 font-bold uppercase">Aprobado</span>}
                    {selectedEvalForInspection.estado === 'Corregir' && <span className="bg-rose-50 text-rose-600 text-[10px] px-2 py-0.5 rounded border border-rose-200 font-bold uppercase">Corregir</span>}
                  </div>
                </div>
              </div>

              {/* Action document downloads */}
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">Descargar Documentos para Word:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const emp = docentesEvaluacion.find(e => e.cedula === selectedEvalForInspection.cedula);
                      if (emp) handleExportWordActa(selectedEvalForInspection, emp);
                    }}
                    className="py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Acta de Concertación
                  </button>
                  <button
                    onClick={() => {
                      const emp = docentesEvaluacion.find(e => e.cedula === selectedEvalForInspection.cedula);
                      if (emp) handleExportWordAnexo5(selectedEvalForInspection, emp);
                    }}
                    className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Anexo 5 (Competencias)
                  </button>
                  <button
                    onClick={() => {
                      const emp = docentesEvaluacion.find(e => e.cedula === selectedEvalForInspection.cedula);
                      if (emp) handleExportWordAnexo2(selectedEvalForInspection, emp);
                    }}
                    className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Anexo 2 (Evidencias)
                  </button>
                  {selectedEvalForInspection.estado === 'Aprobado' && (
                    <button
                      onClick={() => {
                        const emp = docentesEvaluacion.find(e => e.cedula === selectedEvalForInspection.cedula);
                        if (emp) handleExportCertificateWord(selectedEvalForInspection, emp);
                      }}
                      className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-200"
                    >
                      <Award className="w-3.5 h-3.5" />
                      Certificado de Cumplimiento
                    </button>
                  )}
                  {selectedEvalForInspection.portfolioPdfUrl && (
                    <button
                      onClick={() => {
                        if (selectedEvalForInspection.portfolioPdfUrl) {
                          if (selectedEvalForInspection.portfolioPdfUrl.startsWith('http://') || selectedEvalForInspection.portfolioPdfUrl.startsWith('https://')) {
                            window.open(selectedEvalForInspection.portfolioPdfUrl, '_blank');
                          } else {
                            const link = document.createElement('a');
                            link.href = selectedEvalForInspection.portfolioPdfUrl;
                            link.download = selectedEvalForInspection.portfolioPdfName || 'portafolio_entregado.pdf';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }
                        }
                      }}
                      className="py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-200 shadow-sm"
                    >
                      <FolderArchive className="w-3.5 h-3.5" />
                      Descargar Portafolio PDF (Docente)
                    </button>
                  )}
                </div>

                {/* Date/Time/Place adjusting controls for Admin */}
                <div className="w-full mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Ajustes de Fecha, Hora y Lugar de Concertación (para el Acta de Word):</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">📅 Fecha de Concertación</label>
                      <input
                        type="date"
                        value={selectedEvalForInspection.fechaConcertacion}
                        onChange={(e) => {
                          const updated = { ...selectedEvalForInspection, fechaConcertacion: e.target.value };
                          setSelectedEvalForInspection(updated);
                          setEvaluaciones(prev => prev.map(ev => ev.id === updated.id ? updated : ev));
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">⏰ Hora de Concertación</label>
                      <input
                        type="text"
                        value={selectedEvalForInspection.horaConcertacion || '08:00 AM'}
                        onChange={(e) => {
                          const updated = { ...selectedEvalForInspection, horaConcertacion: e.target.value };
                          setSelectedEvalForInspection(updated);
                          setEvaluaciones(prev => prev.map(ev => ev.id === updated.id ? updated : ev));
                        }}
                        placeholder="Ej: 08:00 AM"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">📍 Lugar de Concertación</label>
                      <input
                        type="text"
                        value={selectedEvalForInspection.lugarConcertacion || institutionName || 'INSTITUCIÓN EDUCATIVA ALVERNIA'}
                        onChange={(e) => {
                          const updated = { ...selectedEvalForInspection, lugarConcertacion: e.target.value };
                          setSelectedEvalForInspection(updated);
                          setEvaluaciones(prev => prev.map(ev => ev.id === updated.id ? updated : ev));
                        }}
                        placeholder="Ej: Rectoría I.E. Alvernia"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Collapsible/Scrolling areas of Anexo 5 */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-slate-700 text-sm border-b border-slate-100 pb-1">Compromisos Declarados (Anexo 5)</h4>
                
                {/* Porcentaje summary header card */}
                {(() => {
                  const acadSum = selectedEvalForInspection.compromisosFuncionales
                    .filter(c => c.area === 'Académica')
                    .reduce((acc, c) => acc + (c.porcentaje ?? 12.5), 0);
                  const adminSum = selectedEvalForInspection.compromisosFuncionales
                    .filter(c => c.area === 'Administrativa')
                    .reduce((acc, c) => acc + (c.porcentaje ?? 5.0), 0);
                  const comunSum = selectedEvalForInspection.compromisosFuncionales
                    .filter(c => c.area === 'Comunitaria')
                    .reduce((acc, c) => acc + (c.porcentaje ?? 5.0), 0);
                  const totalSum = acadSum + adminSum + comunSum;

                  return (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wide text-blue-900">Distribución de Porcentajes del 70%</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">Ajuste la distribución de porcentajes. El total acumulado debe ser exactamente 70.0%.</p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Total Funcionales:</span>
                          <span className={`text-sm font-black ${Math.abs(totalSum - 70) < 0.01 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {totalSum.toFixed(1)}%
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">/ 70.0%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                        <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20">
                          <span className="font-bold text-slate-600">Académica:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="70"
                              value={acadSum}
                              onChange={(e) => handleAreaPercentageChange('Académica', parseFloat(e.target.value) || 0, true)}
                              className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-right font-extrabold text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="font-extrabold text-slate-500">%</span>
                          </div>
                        </div>
                        <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20">
                          <span className="font-bold text-slate-600">Administrativa:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="70"
                              value={adminSum}
                              onChange={(e) => handleAreaPercentageChange('Administrativa', parseFloat(e.target.value) || 0, true)}
                              className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-right font-extrabold text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="font-extrabold text-slate-500">%</span>
                          </div>
                        </div>
                        <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20">
                          <span className="font-bold text-slate-600">Comunitaria:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="70"
                              value={comunSum}
                              onChange={(e) => handleAreaPercentageChange('Comunitaria', parseFloat(e.target.value) || 0, true)}
                              className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-right font-extrabold text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="font-extrabold text-slate-500">%</span>
                          </div>
                        </div>
                      </div>

                      {Math.abs(totalSum - 70) < 0.01 ? (
                        <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>¡Suma perfecta! Los porcentajes suman exactamente el 70% requerido para competencias funcionales.</span>
                        </p>
                      ) : totalSum < 70 ? (
                        <p className="text-[11px] text-amber-600 font-bold flex items-center gap-1 bg-amber-50/50 p-2 rounded-lg border border-amber-100 animate-pulse">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Falta asignar {(70 - totalSum).toFixed(1)}% para completar el 70.0% requerido.</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1 bg-rose-50/50 p-2 rounded-lg border border-rose-100">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Suma excede el límite por {(totalSum - 70).toFixed(1)}%. Ajuste los porcentajes para que sumen exactamente 70.0%.</span>
                        </p>
                      )}
                    </div>
                  );
                })()}

                <div className="space-y-4 max-h-[55vh] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {selectedEvalForInspection.compromisosFuncionales.map((cf, idx) => (
                    <div key={idx} className="p-4 space-y-3 text-xs bg-white">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest bg-slate-200/50 px-2 py-0.5 rounded">{cf.area}</span>
                          <span className="font-extrabold text-slate-800">{cf.competencia}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Ajustar:</span>
                            <div className="flex items-center gap-0.5">
                              {[5.0, 10.0, 12.5, 15.0].map((preset) => {
                                const isCurrent = (cf.porcentaje !== undefined ? cf.porcentaje : (cf.area === 'Académica' ? 12.5 : 5.0)) === preset;
                                return (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() => handleAdminFunctionalChange(idx, 'porcentaje', preset)}
                                    className={`text-[9px] px-1.5 py-0.5 rounded font-black border transition-all ${
                                      isCurrent
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {preset}%
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 ml-1">
                            <button
                              type="button"
                              onClick={() => {
                                const current = cf.porcentaje !== undefined ? cf.porcentaje : (cf.area === 'Académica' ? 12.5 : 5.0);
                                handleAdminFunctionalChange(idx, 'porcentaje', Math.max(0, current - 0.5));
                              }}
                              className="w-5 h-5 rounded bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs"
                            >
                              -
                            </button>
                            <span className="font-bold text-slate-700 min-w-[32px] text-center bg-white px-1 py-0.5 rounded border border-slate-200">
                              {(cf.porcentaje !== undefined ? cf.porcentaje : (cf.area === 'Académica' ? 12.5 : 5.0))}%
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const current = cf.porcentaje !== undefined ? cf.porcentaje : (cf.area === 'Académica' ? 12.5 : 5.0);
                                handleAdminFunctionalChange(idx, 'porcentaje', Math.min(70, current + 0.5));
                              }}
                              className="w-5 h-5 rounded bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Contribución:</label>
                          <textarea
                            value={cf.contribucion || ''}
                            onChange={(e) => handleAdminFunctionalChange(idx, 'contribucion', e.target.value)}
                            rows={3}
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Defina la contribución..."
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Criterios:</label>
                            <button
                              type="button"
                              onClick={() => {
                                const currentCriteria = cf.criterios || '';
                                setActiveCriteriaSelectorIndex(idx);
                                setIsCriteriaSelectorForAdmin(true);
                                const matchKey = Object.keys(OFFICIAL_EVALUATION_CRITERIA).find(
                                  key => key.toLowerCase().trim() === cf.competencia.toLowerCase().trim()
                                ) || cf.competencia;
                                const options = OFFICIAL_EVALUATION_CRITERIA[matchKey] || [];
                                const preselected = options.filter(opt => 
                                  currentCriteria.toLowerCase().includes(opt.toLowerCase().trim()) ||
                                  currentCriteria.toLowerCase().includes(opt.toLowerCase().replace(/\./g, '').trim())
                                );
                                setSelectedCriteriaTemp(preselected);
                              }}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline flex items-center gap-1 cursor-pointer"
                            >
                              <ClipboardList className="w-3.5 h-3.5" />
                              Elegir de Lista Oficial
                            </button>
                          </div>
                          <textarea
                            value={cf.criterios || ''}
                            onChange={(e) => handleAdminFunctionalChange(idx, 'criterios', e.target.value)}
                            rows={3}
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Defina los criterios..."
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Evidencias:</label>
                          <textarea
                            value={cf.evidencias || ''}
                            onChange={(e) => handleAdminFunctionalChange(idx, 'evidencias', e.target.value)}
                            rows={3}
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Defina las evidencias..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compromisos Comportamentales in Admin Panel */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-slate-700 text-sm border-b border-slate-100 pb-1">Compromisos Comportamentales (Anexo 5)</h4>
                <div className="space-y-3">
                  {selectedEvalForInspection.compromisosComportamentales.map((cc, idx) => (
                    <div key={idx} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                          Competencia Comportamental #{idx + 1}: {cc.competencia}
                        </span>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Criterios de Evaluación y Evidencias de Aplicación Conductual</label>
                          <button
                            type="button"
                            onClick={() => {
                              const currentCriteria = cc.evidencias || '';
                              setActiveBehaviorSelectorIndex(idx);
                              setIsBehaviorSelectorForAdmin(true);
                              
                              const matchKey = Object.keys(OFFICIAL_EVALUATION_CRITERIA).find(
                                key => key.toLowerCase().trim() === cc.competencia.toLowerCase().trim()
                              ) || cc.competencia;
                              const options = OFFICIAL_EVALUATION_CRITERIA[matchKey] || [];
                              const preselected = options.filter(opt => 
                                currentCriteria.toLowerCase().includes(opt.toLowerCase().trim())
                              );
                              setSelectedCriteriaTemp(preselected);
                            }}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline flex items-center gap-1 cursor-pointer"
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                            Elegir de Lista Oficial
                          </button>
                        </div>
                        <textarea
                          value={cc.evidencias || ''}
                          onChange={(e) => handleAdminComportamentalChange(idx, 'evidencias', e.target.value)}
                          rows={3}
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Defina los criterios de aplicación conductual..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collapsible evidences from Anexo 2 */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-700 text-sm border-b border-slate-100 pb-1">Evidencias Adjuntas y Archivos Soportados (Anexo 2)</h4>
                {selectedEvalForInspection.evidenciasAnexo2.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No se registran filas de evidencias en esta ficha.</p>
                ) : (
                  <div className="space-y-3 max-h-[30vh] overflow-y-auto">
                    {selectedEvalForInspection.evidenciasAnexo2.map((row, idx) => (
                      <div key={row.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4 text-xs">
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-800">
                            Folio {row.folio || '-'} &bull; {row.nombre || 'Evidencia sin descripción'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            Tipo: {row.tipo === 'D' ? 'Documental' : 'Testimonial'} &bull; Soporta: {row.competenciasSoportadas}
                          </p>
                        </div>

                        {row.fileName && (
                          <button
                            onClick={() => handleDownloadFile(row)}
                            className="py-1.5 px-3 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-blue-600 flex items-center gap-1 shrink-0 transition-colors shadow-sm cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Soporte
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Feedback and Approval Actions Panel */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Planilla de Retroalimentación del Evaluador:</h4>
                  <p className="text-[11px] text-slate-500">Deje una nota si el docente debe realizar correcciones o para felicitar el envío.</p>
                </div>

                <textarea
                  value={adminFeedback}
                  onChange={(e) => setAdminFeedback(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Escriba aquí los comentarios, ajustes o correcciones necesarias..."
                />

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleAdminDeleteEvaluation(selectedEvalForInspection.id)}
                    className="py-2 px-3 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                    title="Eliminar este envío falso/borrador"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleAdminChangeStatus(selectedEvalForInspection.id, 'Corregir')}
                    className="py-2 px-4 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Solicitar Correcciones
                  </button>
                  <button
                    onClick={() => handleAdminChangeStatus(selectedEvalForInspection.id, 'Aprobado')}
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-emerald-500/10"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Aprobar Compromisos
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}

      {/* CRITERIA SELECTOR MODAL */}
      {activeCriteriaSelectorIndex !== null && (
        (() => {
          const cf = isCriteriaSelectorForAdmin
            ? selectedEvalForInspection?.compromisosFuncionales[activeCriteriaSelectorIndex]
            : activeEvaluacion?.compromisosFuncionales[activeCriteriaSelectorIndex];
          if (!cf) return null;
          const matchKey = Object.keys(OFFICIAL_EVALUATION_CRITERIA).find(
            key => key.toLowerCase().trim() === cf.competencia.toLowerCase().trim()
          ) || cf.competencia;
          const options = OFFICIAL_EVALUATION_CRITERIA[matchKey] || [];

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" id="criteria-selector-modal">
              <div className="bg-white border-2 border-slate-800 shadow-2xl rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col animate-scale-up" id="criteria-selector-container">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl" id="criteria-selector-header">
                  <div className="flex items-center gap-2.5">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider font-sans">
                        Seleccionar Criterios de Evaluación Oficiales
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium font-sans">
                        Área: <span className="font-bold text-slate-700">{cf.area}</span> | Competencia: <span className="font-bold text-slate-700">{cf.competencia}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveCriteriaSelectorIndex(null)}
                    className="p-1.5 hover:bg-slate-150 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
                    aria-label="Cerrar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-700" id="criteria-selector-body">
                  <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                    Seleccione una o más afirmaciones que describen cómo se manifiesta esta competencia en su labor docente. Al aplicar, se estructurará automáticamente como su lista de criterios.
                  </p>

                  <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1" id="criteria-selector-options">
                    {options.length > 0 ? (
                      options.map((opt, i) => {
                        const isChecked = selectedCriteriaTemp.includes(opt);
                        return (
                          <label
                            key={i}
                            className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                              isChecked
                                ? 'bg-blue-50/50 border-blue-300 text-slate-900 shadow-sm'
                                : 'bg-white border-slate-200 hover:bg-slate-50/80 text-slate-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedCriteriaTemp(selectedCriteriaTemp.filter(item => item !== opt));
                                } else {
                                  setSelectedCriteriaTemp([...selectedCriteriaTemp, opt]);
                                }
                              }}
                              className="mt-0.5 h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-xs font-semibold leading-relaxed font-sans">{opt}</span>
                          </label>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                        <p className="text-xs text-slate-500 italic font-medium font-sans">
                          No se encontraron criterios oficiales específicos para la competencia "{cf.competencia}". Puede escribirlos libremente en el campo de texto.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-3xl" id="criteria-selector-footer">
                  <div className="text-xs text-slate-400 font-semibold font-sans">
                    {selectedCriteriaTemp.length} seleccionados
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveCriteriaSelectorIndex(null)}
                      className="py-2 px-4 border border-slate-300 hover:bg-slate-150 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer font-sans"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const formatted = selectedCriteriaTemp.map(c => `• ${c}`).join('\n');
                        if (isCriteriaSelectorForAdmin) {
                          handleAdminFunctionalChange(activeCriteriaSelectorIndex, 'criterios', formatted);
                        } else {
                          handleFunctionalChange(activeCriteriaSelectorIndex, 'criterios', formatted);
                        }
                        setActiveCriteriaSelectorIndex(null);
                        showToast('✓ Criterios oficiales seleccionados con éxito.');
                      }}
                      disabled={selectedCriteriaTemp.length === 0}
                      className="py-2 px-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer font-sans"
                    >
                      <Check className="w-4 h-4" />
                      Aplicar Selección
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* BEHAVIOR CRITERIA SELECTOR MODAL */}
      {activeBehaviorSelectorIndex !== null && (
        (() => {
          const compObj = isBehaviorSelectorForAdmin
            ? selectedEvalForInspection?.compromisosComportamentales[activeBehaviorSelectorIndex]
            : activeEvaluacion?.compromisosComportamentales[activeBehaviorSelectorIndex];
          const fallbackCompName = activeBehaviorSelectorIndex === 0 ? compSel1 : activeBehaviorSelectorIndex === 1 ? compSel2 : compSel3;
          const compName = compObj?.competencia || fallbackCompName;
          if (!compName) return null;

          const matchKey = Object.keys(OFFICIAL_EVALUATION_CRITERIA).find(
            key => key.toLowerCase().trim() === compName.toLowerCase().trim()
          ) || compName;
          const options = OFFICIAL_EVALUATION_CRITERIA[matchKey] || [];

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" id="behavior-criteria-selector-modal">
              <div className="bg-white border-2 border-slate-800 shadow-2xl rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col animate-scale-up" id="behavior-criteria-selector-container">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl" id="behavior-criteria-selector-header">
                  <div className="flex items-center gap-2.5">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider font-sans">
                        Seleccionar Criterios de Evaluación Oficiales (Comportamentales)
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium font-sans">
                        Competencia: <span className="font-bold text-slate-700">{compName}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveBehaviorSelectorIndex(null)}
                    className="p-1.5 hover:bg-slate-150 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
                    aria-label="Cerrar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-700" id="behavior-criteria-selector-body">
                  <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                    Seleccione una o más conductas de la Guía Metodológica Oficial para esta competencia. Al aplicar, se estructurará automáticamente como su lista de criterios y evidencias.
                  </p>

                  <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1" id="behavior-criteria-selector-options">
                    {options.length > 0 ? (
                      options.map((opt, i) => {
                        const isChecked = selectedCriteriaTemp.includes(opt);
                        return (
                          <label
                            key={i}
                            className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                              isChecked
                                ? 'bg-blue-50/50 border-blue-300 text-slate-900 shadow-sm'
                                : 'bg-white border-slate-200 hover:bg-slate-50/80 text-slate-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedCriteriaTemp(selectedCriteriaTemp.filter(item => item !== opt));
                                } else {
                                  setSelectedCriteriaTemp([...selectedCriteriaTemp, opt]);
                                }
                              }}
                              className="mt-0.5 h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-xs font-semibold leading-relaxed font-sans">{opt}</span>
                          </label>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                        <p className="text-xs text-slate-500 italic font-medium font-sans">
                          No se encontraron criterios oficiales específicos para la competencia "{compName}". Puede escribirlos libremente en el campo de texto.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-3xl" id="behavior-criteria-selector-footer">
                  <div className="text-xs text-slate-400 font-semibold font-sans">
                    {selectedCriteriaTemp.length} seleccionados
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveBehaviorSelectorIndex(null)}
                      className="py-2 px-4 border border-slate-300 hover:bg-slate-150 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer font-sans"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const formatted = selectedCriteriaTemp.map(c => `• ${c}`).join('\n');
                        if (isBehaviorSelectorForAdmin) {
                          handleAdminComportamentalChange(activeBehaviorSelectorIndex, 'evidencias', formatted);
                        } else {
                          handleComportamentalChange(activeBehaviorSelectorIndex, 'evidencias', formatted);
                        }
                        setActiveBehaviorSelectorIndex(null);
                        showToast('✓ Criterios oficiales seleccionados con éxito.');
                      }}
                      disabled={selectedCriteriaTemp.length === 0}
                      className="py-2 px-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer font-sans"
                    >
                      <Check className="w-4 h-4" />
                      Aplicar Selección
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* UPDATE PROFILE AND SIGNATURE MODAL */}
      <AnimatePresence>
      {isProfileModalOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" 
          id="docente-profile-update-modal"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white border-2 border-slate-800 shadow-2xl rounded-3xl w-full max-w-xl max-h-[95vh] overflow-y-auto flex flex-col" 
            id="docente-profile-modal-container"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50/70 rounded-t-3xl" id="docente-profile-modal-header">
              <div className="flex items-center gap-2.5">
                <UserCog className="w-5 h-5 text-amber-600 animate-pulse" />
                <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-wider font-sans">
                  Actualizar Datos de Registro Docente
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Advisory alert */}
            <div className="mx-6 mt-6 p-4 bg-blue-50 border border-blue-150 rounded-2xl flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-black text-blue-900 uppercase tracking-wide">Completar Ficha del Funcionario</p>
                <p className="text-xs text-slate-650 font-medium leading-relaxed">
                  Para que su firma y datos aparezcan correctamente en el <strong>Anexo 5</strong> y las actas oficiales de concertación, es indispensable actualizar la información complementaria de su perfil.
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    disabled
                    value={currentTeacher?.nombre || ''}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 cursor-not-allowed focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Cédula de Ciudadanía</label>
                  <input
                    type="text"
                    disabled
                    value={currentTeacher?.cedula || ''}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Lugar de Expedición (Cédula) *</label>
                  <input
                    type="text"
                    required
                    value={profileLugarExp}
                    onChange={(e) => setProfileLugarExp(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Mocoa, Putumayo"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Área de Desempeño *</label>
                  <select
                    required
                    value={profileArea}
                    onChange={(e) => setProfileArea(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Seleccionar Área --</option>
                    <option value="Preescolar">Preescolar</option>
                    <option value="Primaria">Primaria</option>
                    <option value="Ciencias Naturales y Edu. Ambiental">Ciencias Naturales y Edu. Ambiental</option>
                    <option value="Ciencias Sociales, Historia, Geografía, Constitución">Ciencias Sociales, Historia, Geografía, Constitución</option>
                    <option value="Educación Artística y Cultural">Educación Artística y Cultural</option>
                    <option value="Educación Ética y en Valores Humanos">Educación Ética y en Valores Humanos</option>
                    <option value="Educación Física, Recreación y Deportes">Educación Física, Recreación y Deportes</option>
                    <option value="Educación Religiosa">Educación Religiosa</option>
                    <option value="Humanidades, Lengua Castellana e Idiomas Extranjeros">Humanidades, Lengua Castellana e Idiomas Extranjeros</option>
                    <option value="Matemáticas">Matemáticas</option>
                    <option value="Tecnología e Informática">Tecnología e Informática</option>
                    <option value="Orientación Escolar">Orientación Escolar</option>
                    <option value="Coordinación">Coordinación</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={profileCorreo}
                    onChange={(e) => setProfileCorreo(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ejemplo@correo.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Número de Celular *</label>
                  <input
                    type="tel"
                    required
                    value={profileCelular}
                    onChange={(e) => setProfileCelular(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: 3123456789"
                  />
                </div>
              </div>

              {/* Signature Section */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-750 uppercase tracking-wider flex items-center gap-1.5">
                    <FileSignature className="w-4 h-4 text-amber-600" />
                    Firma Autógrafa Digital *
                  </span>
                  {profileFirma && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 uppercase">
                      ✓ Firma Registrada
                    </span>
                  )}
                </div>

                {/* signature preview */}
                {profileFirma ? (
                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center space-y-2 relative group">
                    <img src={profileFirma} alt="Firma Docente" className="max-h-20 max-w-full object-contain" />
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button
                        type="button"
                        onClick={() => setProfileFirma('')}
                        className="py-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-750 border border-rose-150 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
                      >
                        Limpiar / Dibujar
                      </button>
                      <label className="py-1 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-750 border border-blue-150 rounded text-[10px] font-bold uppercase cursor-pointer transition-colors shadow-sm inline-flex items-center gap-1">
                        Subir nueva JPG/PNG
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const r = new FileReader();
                            r.onload = () => {
                              setProfileFirma(r.result as string);
                              showToast('✓ Nueva imagen de firma cargada (JPG/PNG).');
                            };
                            r.readAsDataURL(file);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* drawing area */}
                    <SignaturePad value={profileFirma} onChange={setProfileFirma} />

                    {/* image upload fallback */}
                    <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                      <span className="text-[10px] text-slate-450 font-bold uppercase">O cargue una firma en formato JPG o PNG:</span>
                      <label className="py-1 px-2.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 rounded text-[10px] font-extrabold uppercase tracking-wide cursor-pointer transition-colors shadow-sm inline-flex items-center gap-1">
                        Seleccionar JPG / PNG
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const r = new FileReader();
                            r.onload = () => {
                              setProfileFirma(r.result as string);
                              showToast('✓ Imagen de firma cargada (JPG/PNG).');
                            };
                            r.readAsDataURL(file);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="py-2.5 px-5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!profileLugarExp || !profileCorreo || !profileCelular || !profileArea || !profileFirma}
                  className="py-2.5 px-6 bg-blue-600 hover:bg-blue-750 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Guardar Perfil
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ADMIN EDIT TEACHER MODAL */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" id="admin-teacher-edit-modal">
          <div className="bg-white border-2 border-slate-800 shadow-2xl rounded-3xl w-full max-w-xl max-h-[95vh] overflow-y-auto flex flex-col animate-scale-up" id="admin-teacher-edit-container">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50/70 rounded-t-3xl">
              <div className="flex items-center gap-2.5">
                <Edit2 className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-wider font-sans">
                  Editar Datos de Docente
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTeacher(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSaveEditTeacher(); }} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={editTeacherName}
                    onChange={(e) => setEditTeacherName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: ALBA GÓMEZ ROJAS"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Cédula de Ciudadanía *</label>
                  <input
                    type="text"
                    required
                    value={editTeacherCedula}
                    onChange={(e) => setEditTeacherCedula(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: 1085223405"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Cargo *</label>
                  <select
                    required
                    value={editTeacherCargo}
                    onChange={(e) => setEditTeacherCargo(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Docente de Aula">Docente de Aula</option>
                    <option value="Docente Orientador">Docente Orientador</option>
                    <option value="Directivo Docente">Directivo Docente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Sede de Trabajo *</label>
                  <input
                    type="text"
                    required
                    value={editTeacherSede}
                    onChange={(e) => setEditTeacherSede(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: COL ALVERNIA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Lugar de Expedición (Cédula)</label>
                  <input
                    type="text"
                    value={editTeacherLugarExp}
                    onChange={(e) => setEditTeacherLugarExp(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Mocoa, Putumayo"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Área de Desempeño</label>
                  <select
                    value={editTeacherArea}
                    onChange={(e) => setEditTeacherArea(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Seleccionar Área --</option>
                    <option value="Preescolar">Preescolar</option>
                    <option value="Primaria">Primaria</option>
                    <option value="Ciencias Naturales y Edu. Ambiental">Ciencias Naturales y Edu. Ambiental</option>
                    <option value="Ciencias Sociales, Historia, Geografía, Constitución">Ciencias Sociales, Historia, Geografía, Constitución</option>
                    <option value="Educación Artística y Cultural">Educación Artística y Cultural</option>
                    <option value="Educación Ética y en Valores Humanos">Educación Ética y en Valores Humanos</option>
                    <option value="Educación Física, Recreación y Deportes">Educación Física, Recreación y Deportes</option>
                    <option value="Educación Religiosa">Educación Religiosa</option>
                    <option value="Humanidades, Lengua Castellana e Idiomas Extranjeros">Humanidades, Lengua Castellana e Idiomas Extranjeros</option>
                    <option value="Matemáticas">Matemáticas</option>
                    <option value="Tecnología e Informática">Tecnología e Informática</option>
                    <option value="Orientación Escolar">Orientación Escolar</option>
                    <option value="Coordinación">Coordinación</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={editTeacherCorreo}
                    onChange={(e) => setEditTeacherCorreo(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ejemplo@correo.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Número de Celular</label>
                  <input
                    type="tel"
                    value={editTeacherCelular}
                    onChange={(e) => setEditTeacherCelular(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: 3123456789"
                  />
                </div>
              </div>

              {/* Signature Section */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-750 uppercase tracking-wider flex items-center gap-1.5">
                    <FileSignature className="w-4 h-4 text-amber-600" />
                    Firma del Docente
                  </span>
                  {editTeacherFirma && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 uppercase">
                      ✓ Firma Registrada
                    </span>
                  )}
                </div>

                {/* signature preview */}
                {editTeacherFirma ? (
                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center space-y-2 relative group">
                    <img src={editTeacherFirma} alt="Firma Docente" className="max-h-20 max-w-full object-contain" />
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button
                        type="button"
                        onClick={() => setEditTeacherFirma('')}
                        className="py-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-750 border border-rose-150 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
                      >
                        Limpiar / Dibujar
                      </button>
                      <label className="py-1 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-750 border border-blue-150 rounded text-[10px] font-bold uppercase cursor-pointer transition-colors shadow-sm inline-flex items-center gap-1">
                        Subir nueva JPG/PNG
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const r = new FileReader();
                            r.onload = () => {
                              setEditTeacherFirma(r.result as string);
                              showToast('✓ Nueva imagen de firma cargada (JPG/PNG).');
                            };
                            r.readAsDataURL(file);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* drawing area */}
                    <SignaturePad value={editTeacherFirma} onChange={setEditTeacherFirma} />

                    {/* image upload fallback */}
                    <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                      <span className="text-[10px] text-slate-450 font-bold uppercase">O cargue una firma en formato JPG o PNG:</span>
                      <label className="py-1 px-2.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 rounded text-[10px] font-extrabold uppercase tracking-wide cursor-pointer transition-colors shadow-sm inline-flex items-center gap-1">
                        Seleccionar JPG / PNG
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const r = new FileReader();
                            r.onload = () => {
                              setEditTeacherFirma(r.result as string);
                              showToast('✓ Imagen de firma cargada (JPG/PNG).');
                            };
                            r.readAsDataURL(file);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="py-2.5 px-5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingTeacherEditInProgress || !editTeacherName || !editTeacherCedula || !editTeacherCargo || !editTeacherSede}
                  className="py-2.5 px-6 bg-blue-600 hover:bg-blue-750 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  {isSavingTeacherEditInProgress ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN DELETE TEACHER CONFIRMATION MODAL */}
      {deletingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" id="admin-teacher-delete-modal">
          <div className="bg-white border-2 border-rose-600 shadow-2xl rounded-3xl w-full max-w-md p-6 space-y-6 animate-scale-up" id="admin-teacher-delete-container">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200">
                <AlertCircle className="w-6 h-6 animate-bounce" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-wider font-sans">
                  ¿Eliminar Docente Permanentemente?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Esta acción es irreversible y eliminará de forma permanente al docente y todos sus datos complementarios de la base de datos de evaluación docente.
                </p>
              </div>
            </div>

            {/* Teacher info card preview */}
            <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-1">
              <p className="text-sm font-black text-rose-900 uppercase">{deletingTeacher.nombre}</p>
              <p className="text-xs text-slate-500 font-mono">C.C. {deletingTeacher.cedula}</p>
              <p className="text-xs text-slate-650 font-semibold">{deletingTeacher.cargo} — {deletingTeacher.sedeTrabajo}</p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingInProgress}
                onClick={() => setDeletingTeacher(null)}
                className="py-2 px-4 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingInProgress}
                onClick={handleExecuteDeleteTeacher}
                className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-350 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                {isDeletingInProgress ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Sí, Eliminar Permanentemente
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TEACHER MESSAGES MODAL --- */}
      <AnimatePresence>
        {isMessagesModalOpen && currentTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" id="teacher-messages-modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg leading-tight">Bandeja de Retroalimentación</h3>
                    <p className="text-xs text-slate-400 font-medium">Mensajes y correcciones solicitadas por el Evaluador</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMessagesModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto bg-slate-50 flex-1 space-y-4">
                {(() => {
                  const teacherEvals = evaluaciones.filter(e => e.cedula === currentTeacher.cedula && e.observacionesAdmin?.trim());
                  
                  if (teacherEvals.length === 0) {
                    return (
                      <div className="text-center py-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                          <CheckCircle2 className="w-8 h-8 text-slate-300" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-600">No hay mensajes pendientes</h4>
                        <p className="text-xs text-slate-400 mt-1">El evaluador no ha solicitado correcciones por el momento.</p>
                      </div>
                    );
                  }

                  return teacherEvals.map(ev => {
                    const isPendingCorrection = ev.estado === 'Corregir';
                    const containerClass = isPendingCorrection 
                      ? 'bg-rose-50 border-rose-200' 
                      : 'bg-emerald-50 border-emerald-200';
                    const headerClass = isPendingCorrection 
                      ? 'bg-rose-100/50 border-rose-200' 
                      : 'bg-emerald-100/50 border-emerald-200';
                    const textClass = isPendingCorrection ? 'text-rose-900' : 'text-emerald-900';
                    const iconClass = isPendingCorrection ? 'text-rose-500' : 'text-emerald-500';

                    return (
                      <div key={ev.id} className={`border rounded-2xl overflow-hidden shadow-sm transition-colors ${containerClass}`}>
                        <div className={`px-4 py-3 border-b flex items-center justify-between ${headerClass}`}>
                          <div className="flex items-center gap-2">
                            <Calendar className={`w-4 h-4 ${iconClass}`} />
                            <span className={`text-xs font-bold uppercase tracking-wider ${textClass}`}>
                              Evaluación {ev.periodo} • {ev.fechaConcertacion ? ev.fechaConcertacion.split('T')[0] : 'Sin fecha'}
                            </span>
                          </div>
                          {isPendingCorrection ? (
                            <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded uppercase font-black tracking-widest border border-rose-300 shadow-sm">
                              Requiere Acción
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded uppercase font-black tracking-widest border border-emerald-300 shadow-sm">
                              Corregido / En Revisión
                            </span>
                          )}
                        </div>
                        <div className="p-5">
                          <p className={`text-sm font-semibold whitespace-pre-wrap leading-relaxed ${textClass}`}>
                            {ev.observacionesAdmin}
                          </p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              
              {/* Footer */}
              <div className="p-4 bg-white border-t border-slate-100 flex justify-end shrink-0">
                <button
                  onClick={() => setIsMessagesModalOpen(false)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

// STANDALONE SIGNATURE CANVAS DRAWING PAD COMPONENT
const SignaturePad: React.FC<{ value: string; onChange: (base64: string) => void }> = ({ value, onChange }) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);

  // Initialize and scale canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Check if touch event
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }
    
    // Mouse event
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  return (
    <div className="space-y-2">
      <div className="border border-slate-300 rounded-xl bg-white overflow-hidden relative" style={{ height: '160px' }}>
        <canvas
          ref={canvasRef}
          width={400}
          height={160}
          className="w-full h-full cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!value && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs italic font-medium">
            Dibuje su firma aquí con el mouse o pantalla táctil
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={clearCanvas}
          className="py-1 px-2.5 text-[10px] bg-slate-100 hover:bg-slate-250 text-slate-700 font-bold uppercase tracking-wide rounded transition-colors cursor-pointer"
        >
          Limpiar Lienzo
        </button>
        <span className="text-[10px] text-slate-400 font-semibold uppercase">Dibujo Digital</span>
      </div>
    </div>
  );
};
