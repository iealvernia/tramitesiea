// Utility for Colombian Holidays and Academic Days Calculation
// Based on Ley 51 de 1983 (Ley Emiliani) and Colombian Academic Recesses

function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getEmilianiMonday(year: number, month: number, day: number): Date {
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday
  if (dayOfWeek === 1) return date;
  const daysToAdd = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const result = new Date(date);
  result.setDate(date.getDate() + daysToAdd);
  return result;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getColombianHolidays(year: number): string[] {
  const easter = getEasterSunday(year);
  const holidays = [
    // Fijos
    toYMD(new Date(year, 0, 1)), // 1 Ene - Año Nuevo
    toYMD(new Date(year, 4, 1)), // 1 May - Día del Trabajo
    toYMD(new Date(year, 6, 20)), // 20 Jul - Independencia de Colombia
    toYMD(new Date(year, 7, 7)), // 7 Ago - Batalla de Boyacá
    toYMD(new Date(year, 11, 8)), // 8 Dic - Inmaculada Concepción
    toYMD(new Date(year, 11, 25)), // 25 Dic - Navidad

    // Emiliani fijos (se trasladan al siguiente lunes)
    toYMD(getEmilianiMonday(year, 1, 6)), // 6 Ene - Reyes Magos
    toYMD(getEmilianiMonday(year, 3, 19)), // 19 Mar - San José
    toYMD(getEmilianiMonday(year, 6, 29)), // 29 Jun - San Pedro y San Pablo
    toYMD(getEmilianiMonday(year, 8, 15)), // 15 Ago - Asunción de la Virgen
    toYMD(getEmilianiMonday(year, 10, 12)), // 12 Oct - Día de la Raza
    toYMD(getEmilianiMonday(year, 11, 1)), // 1 Nov - Todos los Santos
    toYMD(getEmilianiMonday(year, 11, 11)), // 11 Nov - Independencia de Cartagena

    // Relativos a Pascua
    toYMD(addDays(easter, -3)), // Jueves Santo
    toYMD(addDays(easter, -2)), // Viernes Santo
    toYMD(getEmilianiMonday(year, addDays(easter, 43).getMonth() + 1, addDays(easter, 43).getDate())), // Ascensión del Señor
    toYMD(getEmilianiMonday(year, addDays(easter, 64).getMonth() + 1, addDays(easter, 64).getDate())), // Corpus Christi
    toYMD(getEmilianiMonday(year, addDays(easter, 71).getMonth() + 1, addDays(easter, 71).getDate())) // Sagrado Corazón de Jesús
  ];

  return holidays.sort();
}

export interface RecesoRange {
  start?: string;
  end?: string;
  nombre?: string;
}

export interface DiasValoradosResult {
  diasFinales: number;
  totalDiasCalendario: number;
  finesDeSemana: number;
  diasFestivos: number;
  diasReceso: number;
  diasHabilesNetos: number;
  diasIncapacidad: number;
}

export function calcularDiasValorados(
  fechaInicioStr?: string,
  fechaFinalStr?: string,
  recesos: RecesoRange[] = [],
  diasIncapacidad: number = 0,
  soloDiasHabiles: boolean = true
): DiasValoradosResult {
  if (!fechaInicioStr || !fechaFinalStr) {
    return {
      diasFinales: 0,
      totalDiasCalendario: 0,
      finesDeSemana: 0,
      diasFestivos: 0,
      diasReceso: 0,
      diasHabilesNetos: 0,
      diasIncapacidad: Number(diasIncapacidad) || 0
    };
  }

  const [sy, sm, sd] = fechaInicioStr.split('-').map(Number);
  const [ey, em, ed] = fechaFinalStr.split('-').map(Number);
  
  if (isNaN(sy) || isNaN(sm) || isNaN(sd) || isNaN(ey) || isNaN(em) || isNaN(ed)) {
    return {
      diasFinales: 0,
      totalDiasCalendario: 0,
      finesDeSemana: 0,
      diasFestivos: 0,
      diasReceso: 0,
      diasHabilesNetos: 0,
      diasIncapacidad: Number(diasIncapacidad) || 0
    };
  }

  const cur = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);

  if (cur > end) {
    return {
      diasFinales: 0,
      totalDiasCalendario: 0,
      finesDeSemana: 0,
      diasFestivos: 0,
      diasReceso: 0,
      diasHabilesNetos: 0,
      diasIncapacidad: Number(diasIncapacidad) || 0
    };
  }

  const holidays = new Set<string>();
  for (let y = sy; y <= ey; y++) {
    getColombianHolidays(y).forEach(h => holidays.add(h));
  }

  const validRecesos = recesos.filter(r => r.start && r.end && r.start <= r.end);

  let totalDiasCalendario = 0;
  let finesDeSemana = 0;
  let diasFestivos = 0;
  let diasReceso = 0;
  let diasHabilesNetos = 0;

  while (cur <= end) {
    totalDiasCalendario++;
    const ymd = toYMD(cur);
    const dayOfWeek = cur.getDay(); // 0 Domingo, 6 Sábado

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidays.has(ymd);
    const isInRecess = validRecesos.some(r => ymd >= r.start! && ymd <= r.end!);

    if (soloDiasHabiles) {
      if (isWeekend) {
        finesDeSemana++;
      } else if (isHoliday) {
        diasFestivos++;
      } else if (isInRecess) {
        diasReceso++;
      } else {
        diasHabilesNetos++;
      }
    } else {
      // Modo días calendario descontando festivos y recesos
      if (isHoliday) {
        diasFestivos++;
      } else if (isInRecess) {
        diasReceso++;
      } else {
        diasHabilesNetos++;
      }
    }

    cur.setDate(cur.getDate() + 1);
  }

  const finalDays = Math.max(0, diasHabilesNetos - (Number(diasIncapacidad) || 0));

  return {
    diasFinales: finalDays,
    totalDiasCalendario,
    finesDeSemana,
    diasFestivos,
    diasReceso,
    diasHabilesNetos,
    diasIncapacidad: Number(diasIncapacidad) || 0
  };
}
