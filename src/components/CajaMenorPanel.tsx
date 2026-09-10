import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet,
  Plus,
  Trash2,
  FileSpreadsheet,
  ArrowRight,
  ArrowDownCircle,
  ArrowUpCircle,
  Calculator,
  Save,
  Info,
  Calendar as CalendarIcon,
  RefreshCw,
  X,
  DollarSign,
  BarChart3,
  Edit2,
  CalendarDays,
  CheckCircle2,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  Layers,
  Clock
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { Caja, CajaTransaccion } from '../types';

export interface OpcionesReporteCorte {
  fechaInicio?: string;
  fechaFin: string;
  identificadorCorte?: string;
  responsable?: string;
  ano?: string;
}

interface CajaMenorPanelProps {
  userSession?: any;
}

const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2, 15);
};

const MESES = [
  { value: 'Enero', label: 'Enero' },
  { value: 'Febrero', label: 'Febrero' },
  { value: 'Marzo', label: 'Marzo' },
  { value: 'Abril', label: 'Abril' },
  { value: 'Mayo', label: 'Mayo' },
  { value: 'Junio', label: 'Junio' },
  { value: 'Julio', label: 'Julio' },
  { value: 'Agosto', label: 'Agosto' },
  { value: 'Septiembre', label: 'Septiembre' },
  { value: 'Octubre', label: 'Octubre' },
  { value: 'Noviembre', label: 'Noviembre' },
  { value: 'Diciembre', label: 'Diciembre' },
];

const CATEGORIAS_INGRESO = [
  'Arrendamiento Cafeteria',
  'Certificados',
  'Constancias',
  'Otros Ingresos'
];

const CATEGORIAS_GASTO = [
  'Mantenimiento',
  'Papeleria',
  'Viaticos',
  'Bienestar Institucional',
  'Aseo y Cafeteria',
  'Otros Gastos'
];

export const CajaMenorPanel: React.FC<CajaMenorPanelProps> = ({ userSession }) => {
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [transacciones, setTransacciones] = useState<CajaTransaccion[]>([]);
  
  const [activeCajaId, setActiveCajaId] = useState<string>('');
  const [isCreatingCaja, setIsCreatingCaja] = useState(false);
  const [nuevaCajaNombre, setNuevaCajaNombre] = useState('');
  
  const [isEditingCaja, setIsEditingCaja] = useState(false);
  const [editCajaNombre, setEditCajaNombre] = useState('');

  const [tipoOp, setTipoOp] = useState<'Entrada' | 'Salida'>('Entrada');
  const [customCategorias, setCustomCategorias] = useState<{ingresos: string[], gastos: string[]}>(() => {
    const saved = localStorage.getItem('iea_custom_categorias_caja');
    return saved ? JSON.parse(saved) : { ingresos: [], gastos: [] };
  });
  const [showAdminCategorias, setShowAdminCategorias] = useState(false);
  const [nuevaCatText, setNuevaCatText] = useState('');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingCatText, setEditingCatText] = useState('');

  const saveCustomCats = (newCats: {ingresos: string[], gastos: string[]}) => {
    setCustomCategorias(newCats);
    localStorage.setItem('iea_custom_categorias_caja', JSON.stringify(newCats));
  };
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [categoria, setCategoria] = useState(CATEGORIAS_INGRESO[0]);
  const [concepto, setConcepto] = useState('');
  const [valor, setValor] = useState<string>('');
  const [tercero, setTercero] = useState('');

  const [showCalculator, setShowCalculator] = useState(false);
  const [showResumenModal, setShowResumenModal] = useState(false);
  const [showMovimientoModal, setShowMovimientoModal] = useState(false);
  const [showReporteCorteModal, setShowReporteCorteModal] = useState(false);
  const [editTxId, setEditTxId] = useState<string | null>(null);
  
  const currentYearStr = new Date().getFullYear().toString();
  const defaultMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const defaultMonthLabel = MESES[new Date().getMonth()].value;

  const [filtroMes, setFiltroMes] = useState<string>('TODOS');
  const [filtroAno, setFiltroAno] = useState<string>(currentYearStr);
  const [filtroTablaTercero, setFiltroTablaTercero] = useState('');
  const [filtroTablaConcepto, setFiltroTablaConcepto] = useState('');
  const [filtroTablaFecha, setFiltroTablaFecha] = useState('');

  const fetchCajas = async () => {
    if (!userSession?.user?.email) return;
    try {
      const response = await fetch(`/api/cajas?user_id=${userSession.user.email}`);
      const { data } = await response.json();
      if (Array.isArray(data)) {
        setCajas(data);
        if (data.length > 0 && !activeCajaId) {
          setActiveCajaId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTransacciones = async () => {
    try {
      const response = await fetch(`/api/caja-transacciones?user_id=${userSession?.user?.email}`);
      const { data } = await response.json();
      if (Array.isArray(data)) {
        const enrichedData = data.map((t: any) => {
          if (!t.mes || !t.ano) {
            const d = new Date(t.fecha + 'T00:00:00');
            const mesValue = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][d.getMonth()] || "Enero";
            const anoValue = String(d.getFullYear());
            return { ...t, mes: mesValue, ano: anoValue };
          }
          return t;
        });
        setTransacciones(enrichedData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (userSession?.user?.email) {
      fetchCajas();
      fetchTransacciones();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSession?.user?.email]);

  const handleCrearCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCajaNombre.trim()) return;
    const newCaja: Caja = {
      id: generateId(),
      nombre: nuevaCajaNombre.toUpperCase(),
      activa: true,
      user_id: userSession?.user?.email
    };
    try {
      await fetch('/api/cajas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCaja)
      });
      await fetchCajas();
      setActiveCajaId(newCaja.id);
      setIsCreatingCaja(false);
      setNuevaCajaNombre('');
    } catch (error) {
      alert('Error creando la caja menor');
    }
  };

  const handleGuardarEdicionCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCajaNombre.trim()) return;
    try {
      await fetch('/api/cajas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeCajaId, nombre: editCajaNombre.toUpperCase() })
      });
      await fetchCajas();
      setIsEditingCaja(false);
    } catch (error) {
      alert('Error editando la caja menor');
    }
  };

  const handleEliminarCaja = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta Caja Menor? Perderás el acceso a sus datos (aunque puedes seguir viendo reportes generales si eres admin).")) {
      try {
        await fetch(`/api/cajas/${id}`, { method: 'DELETE' });
        const newCajas = cajas.filter(c => c.id !== id);
        setCajas(newCajas);
        setActiveCajaId(newCajas.length > 0 ? newCajas[0].id : '');
      } catch (error) {
        alert('Error eliminando la caja');
      }
    }
  };

  const activeCaja = cajas.find(c => c.id === activeCajaId);
  
  const transaccionesActivas = useMemo(() => {
    return transacciones.filter(t => {
      if (t.caja_id !== activeCajaId) return false;
      if (filtroAno !== 'TODOS' && t.ano !== filtroAno) return false;
      if (filtroMes !== 'TODOS' && t.mes !== filtroMes) return false;
      return true;
    }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [transacciones, activeCajaId, filtroMes, filtroAno]);

  const totalesAnuales = useMemo(() => {
    const transAno = transacciones.filter(t => t.caja_id === activeCajaId && (filtroAno === 'TODOS' ? true : t.ano === filtroAno));
    const ing = transAno.filter(t => t.tipo_operacion === 'Entrada').reduce((a,c) => a + Number(c.valor), 0);
    const gas = transAno.filter(t => t.tipo_operacion === 'Salida').reduce((a,c) => a + Number(c.valor), 0);
    return { ingresos: ing, gastos: gas };
  }, [transacciones, activeCajaId, filtroAno]);

  const opcionesCategoria = useMemo(() => {
    const base = tipoOp === 'Entrada' ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO;
    const custom = tipoOp === 'Entrada' ? customCategorias.ingresos : customCategorias.gastos;
    const historicas = transacciones
      .filter(t => t.tipo_operacion === tipoOp && t.caja_id === activeCajaId)
      .map(t => t.categoria);
    return Array.from(new Set([...base, ...custom, ...historicas])).filter(Boolean);
  }, [tipoOp, transacciones, activeCajaId, customCategorias]);

  const handleAddCustomCat = () => {
    if (!nuevaCatText.trim()) return;
    const updated = { ...customCategorias };
    if (tipoOp === 'Entrada') {
      if (!updated.ingresos.includes(nuevaCatText)) updated.ingresos.push(nuevaCatText);
    } else {
      if (!updated.gastos.includes(nuevaCatText)) updated.gastos.push(nuevaCatText);
    }
    saveCustomCats(updated);
    setCategoria(nuevaCatText);
    setNuevaCatText('');
    setShowAdminCategorias(false);
  };

  const handleRemoveCustomCat = (catToRemove: string) => {
    const updated = { ...customCategorias };
    if (tipoOp === 'Entrada') {
      updated.ingresos = updated.ingresos.filter(c => c !== catToRemove);
    } else {
      updated.gastos = updated.gastos.filter(c => c !== catToRemove);
    }
    saveCustomCats(updated);
    if (categoria === catToRemove) {
      setCategoria(tipoOp === 'Entrada' ? CATEGORIAS_INGRESO[0] : CATEGORIAS_GASTO[0]);
    }
  };

  const handleSaveEditCat = (oldCat: string) => {
    if (!editingCatText.trim() || editingCatText === oldCat) {
      setEditingCat(null);
      return;
    }
    const updated = { ...customCategorias };
    if (tipoOp === 'Entrada') {
      const idx = updated.ingresos.indexOf(oldCat);
      if (idx !== -1) updated.ingresos[idx] = editingCatText;
    } else {
      const idx = updated.gastos.indexOf(oldCat);
      if (idx !== -1) updated.gastos[idx] = editingCatText;
    }
    saveCustomCats(updated);
    
    setTransacciones(prev => prev.map(t => {
      if (t.caja_id === activeCajaId && t.tipo_operacion === tipoOp && t.categoria === oldCat) {
        return { ...t, categoria: editingCatText };
      }
      return t;
    }));

    if (categoria === oldCat) {
      setCategoria(editingCatText);
    }
    setEditingCat(null);
  };

  // Calculamos el saldo acumulado cronológico real de todas las transacciones de la caja para el año seleccionado
  const transaccionesConSaldo = useMemo(() => {
    const deLaCaja = transacciones
      .filter(t => t.caja_id === activeCajaId && (filtroAno === 'TODOS' ? true : t.ano === filtroAno))
      .slice()
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    let saldoAcum = 0;
    const conSaldo = deLaCaja.map(t => {
      if (t.tipo_operacion === 'Entrada') {
        saldoAcum += Number(t.valor);
      } else {
        saldoAcum -= Number(t.valor);
      }
      return { ...t, saldo_momento: saldoAcum };
    });

    return conSaldo.reverse();
  }, [transacciones, activeCajaId, filtroAno]);

  const hayBusquedaTexto = Boolean(filtroTablaConcepto.trim() || filtroTablaTercero.trim());

  const transaccionesTabla = useMemo(() => {
    return transaccionesConSaldo.filter(t => {
      const matchConcepto = filtroTablaConcepto 
        ? (t.concepto.toLowerCase().includes(filtroTablaConcepto.toLowerCase()) || t.categoria.toLowerCase().includes(filtroTablaConcepto.toLowerCase())) 
        : true;
      const matchTercero = filtroTablaTercero 
        ? (t.tercero || '').toLowerCase().includes(filtroTablaTercero.toLowerCase()) 
        : true;

      // Si el usuario escribe en el buscador (concepto o tercero), se busca en TODOS los movimientos sin importar el mes ni la fecha seleccionada
      if (hayBusquedaTexto) {
        return matchConcepto && matchTercero;
      }

      // Si no hay búsqueda de texto, se respetan los selectores de mes y fecha
      const matchMes = filtroMes === 'TODOS' ? true : t.mes === filtroMes;
      const matchFecha = filtroTablaFecha ? t.fecha === filtroTablaFecha : true;

      return matchMes && matchFecha;
    });
  }, [transaccionesConSaldo, hayBusquedaTexto, filtroTablaConcepto, filtroTablaTercero, filtroTablaFecha, filtroMes]);

  const totalIngresos = transaccionesActivas.filter(t => t.tipo_operacion === 'Entrada').reduce((acc, curr) => acc + Number(curr.valor), 0);
  const totalGastos = transaccionesActivas.filter(t => t.tipo_operacion === 'Salida').reduce((acc, curr) => acc + Number(curr.valor), 0);
  const saldoFinal = totalIngresos - totalGastos;

  useEffect(() => {
    if (tipoOp === 'Entrada') setCategoria(CATEGORIAS_INGRESO[0]);
    else setCategoria(CATEGORIAS_GASTO[0]);
  }, [tipoOp]);

  const formatNumberInput = (val: string) => {
    const rawValue = val.replace(/\D/g, '');
    if (!rawValue) return '';
    return rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleEditTx = (t: CajaTransaccion) => {
    setEditTxId(t.id);
    setTipoOp(t.tipo_operacion);
    setFecha(t.fecha);
    setValor(formatNumberInput(t.valor.toString()));
    setCategoria(t.categoria);
    setTercero(t.tercero || '');
    setConcepto(t.concepto || '');
    setShowMovimientoModal(true);
  };

  const handleOpenNewMovimientoModal = () => {
    setEditTxId(null);
    setConcepto('');
    setValor('');
    setTercero('');
    setFecha(new Date().toISOString().split('T')[0]);
    setTipoOp('Entrada');
    setShowMovimientoModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCajaId) return alert('Selecciona o crea una caja menor primero.');
    const numericValor = Number(valor.replace(/\D/g, ''));
    if (!numericValor || numericValor <= 0) return alert('El valor debe ser mayor a 0');

    // Extract month and year from fecha directly to match the month name
    const d = new Date(fecha + 'T00:00:00'); // prevent timezone shift
    const tMes = MESES[d.getMonth()].value;
    const tAno = String(d.getFullYear());

    const newT: CajaTransaccion = {
      id: editTxId || generateId(),
      caja_id: activeCajaId,
      user_id: userSession?.user?.email,
      tipo_operacion: tipoOp,
      fecha,
      categoria,
      concepto,
      valor: numericValor,
      mes: tMes,
      ano: tAno,
      tercero
    };

    try {
      await fetch('/api/caja-transacciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newT)
      });
      await fetchTransacciones();
      setConcepto('');
      setValor('');
      setTercero('');
      setEditTxId(null);
      setShowMovimientoModal(false);
    } catch (err) {
      alert('Error guardando la transacción');
    }
  };

  const handleEliminar = async (id: string) => {
    if (confirm('¿Está seguro de eliminar esta transacción?')) {
      try {
        await fetch(`/api/caja-transacciones/${id}`, { method: 'DELETE' });
        await fetchTransacciones();
      } catch (err) {
        alert('Error eliminando transaccion');
      }
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val);
  };

  const generateExcel = (opciones?: OpcionesReporteCorte) => {
    if (!activeCaja) return;
    
    const wb = XLSX.utils.book_new();

    const titleStyle = { font: { bold: true, sz: 14 } };
    const subtitleStyle = { font: { bold: true, sz: 12 } };
    const titleCenteredStyle = { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center' } };
    const subtitleCenteredStyle = { font: { bold: true, sz: 12 }, alignment: { horizontal: 'center' } };
    
    const headerBlueStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "002060" } }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }, alignment: { horizontal: 'center', vertical: 'center' } };
    const headerLightBlueStyle = { font: { bold: true, color: { rgb: "000000" } }, fill: { fgColor: { rgb: "9BC2E6" } }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
    
    const moneyFormat = '"$" #,##0;-"$" #,##0;"-";@';
    const moneyFormatDecimals = '"$" #,##0.00;-"$" #,##0.00;"-";@';
    
    const moneyStyle = { numFmt: moneyFormat };
    const moneyBoldStyle = { numFmt: moneyFormat, font: { bold: true } };
    const greenTotalStyle = { numFmt: moneyFormat, font: { bold: true }, fill: { fgColor: { rgb: "00B050" } } };
    
    const totalRowLabelStyle = { font: { bold: true }, alignment: { horizontal: 'right' }, fill: { fgColor: { rgb: "D9D9D9" } }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
    const totalRowIngresosStyle = { numFmt: moneyFormatDecimals, font: { bold: true }, fill: { fgColor: { rgb: "C6EFCE" } }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
    const totalRowGastosStyle = { numFmt: moneyFormatDecimals, font: { bold: true }, fill: { fgColor: { rgb: "F2DCDB" } }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
    const totalRowSaldoStyle = { numFmt: moneyFormatDecimals, font: { bold: true }, fill: { fgColor: { rgb: "00B050" } }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
    
    const noteStyle = { font: { italic: true }, fill: { fgColor: { rgb: "FFFF00" } }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };

    const institutionName = "INSTITUCIÓN EDUCATIVA ALVERNIA";

    const fechaInicio = opciones?.fechaInicio || '';
    const fechaFin = opciones?.fechaFin || '';
    const identificadorCorte = opciones?.identificadorCorte || '';
    const responsable = opciones?.responsable || userSession?.user?.name || userSession?.user?.email || 'Encargado(a) de Caja';
    const anoReporte = opciones?.ano || filtroAno;

    // Saldo anterior a la fecha inicial (restringido estrictamente al año seleccionado)
    let saldoAnterior = 0;
    if (fechaInicio) {
      saldoAnterior = transacciones
        .filter(t => {
          if (t.caja_id !== activeCajaId) return false;
          if (t.ano !== anoReporte) return false;
          return t.fecha < fechaInicio;
        })
        .reduce((acc, curr) => {
          return curr.tipo_operacion === 'Entrada' ? acc + Number(curr.valor) : acc - Number(curr.valor);
        }, 0);
    }

    // Transacciones que corresponden al corte (restringido estrictamente al año seleccionado)
    const transaccionesCorte = transacciones
      .filter(t => {
        if (t.caja_id !== activeCajaId) return false;
        if (t.ano !== anoReporte) return false;
        if (fechaInicio && t.fecha < fechaInicio) return false;
        if (fechaFin && t.fecha > fechaFin) return false;
        return true;
      })
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    const mesesOrder = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const totalGeneralIngresos = transaccionesCorte
      .filter(t => t.tipo_operacion === 'Entrada')
      .reduce((acc, curr) => acc + Number(curr.valor), 0);

    const totalGeneralGastos = transaccionesCorte
      .filter(t => t.tipo_operacion === 'Salida')
      .reduce((acc, curr) => acc + Number(curr.valor), 0);

    const periodoTexto = fechaInicio 
      ? `DESDE ${fechaInicio.split('-').reverse().join('/')} HASTA ${fechaFin ? fechaFin.split('-').reverse().join('/') : 'LA FECHA'} (${anoReporte})`
      : `CORTE HASTA EL ${fechaFin ? fechaFin.split('-').reverse().join('/') : anoReporte} (${anoReporte})`;

    // ---------------------------------------------------------
    // HOJA 1: LIBRO AUXILIAR (CORTE DETALLADO)
    // ---------------------------------------------------------
    const wsLibroData: any[][] = [
      [{ v: institutionName, s: titleCenteredStyle }, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}],
      [{ v: `LIBRO DE CAJA MENOR - INFORME DE CORTE: ${activeCaja.nombre}`, s: subtitleCenteredStyle }, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}],
      [{ v: `PERÍODO: ${periodoTexto}${identificadorCorte ? ` | ${identificadorCorte}` : ''}`, s: { font: { bold: true, sz: 11 }, alignment: { horizontal: 'center' } } }, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}],
      [{ v: `Fecha de emisión: ${new Date().toLocaleDateString('es-CO')} | Elaborado por: ${responsable}`, s: { font: { italic: true, sz: 10 }, alignment: { horizontal: 'center' } } }, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}],
      [],
      [
        { v: "N°", s: headerBlueStyle },
        { v: "Fecha", s: headerBlueStyle },
        { v: "Operación", s: headerBlueStyle },
        { v: "Categoría", s: headerBlueStyle },
        { v: "Concepto / Justificación", s: headerBlueStyle },
        { v: "Tercero / Beneficiario", s: headerBlueStyle },
        { v: "Entradas (+)", s: headerBlueStyle },
        { v: "Salidas (-)", s: headerBlueStyle },
        { v: "Saldo Acumulado", s: headerBlueStyle }
      ]
    ];

    let saldoCorrienteLibro = saldoAnterior;
    if (fechaInicio) {
      wsLibroData.push([
        { v: "-", s: { alignment: { horizontal: 'center' } } },
        { v: fechaInicio.split('-').reverse().join('/'), s: { alignment: { horizontal: 'center' } } },
        { v: "Saldo Inicial", s: { font: { bold: true }, alignment: { horizontal: 'center' } } },
        { v: "Balance Previo", s: {} },
        { v: "SALDO ANTERIOR AL INICIO DEL CORTE", s: { font: { bold: true } } },
        { v: "-", s: { alignment: { horizontal: 'center' } } },
        { v: saldoAnterior > 0 ? saldoAnterior : 0, t: 'n', z: moneyFormat, s: moneyBoldStyle },
        { v: saldoAnterior < 0 ? Math.abs(saldoAnterior) : 0, t: 'n', z: moneyFormat, s: moneyBoldStyle },
        { v: saldoAnterior, t: 'n', z: moneyFormat, s: moneyBoldStyle }
      ]);
    }

    transaccionesCorte.forEach((t, idx) => {
      const val = Number(t.valor) || 0;
      const esEntrada = t.tipo_operacion === 'Entrada';
      if (esEntrada) {
        saldoCorrienteLibro += val;
      } else {
        saldoCorrienteLibro -= val;
      }
      wsLibroData.push([
        { v: idx + 1, s: { alignment: { horizontal: 'center' } } },
        { v: t.fecha.split('-').reverse().join('/'), s: { alignment: { horizontal: 'center' } } },
        { v: t.tipo_operacion, s: { font: { bold: true }, alignment: { horizontal: 'center' } } },
        { v: t.categoria, s: {} },
        { v: t.concepto, s: {} },
        { v: t.tercero || '-', s: {} },
        { v: esEntrada ? val : 0, t: 'n', z: moneyFormat, s: moneyStyle },
        { v: !esEntrada ? val : 0, t: 'n', z: moneyFormat, s: moneyStyle },
        { v: saldoCorrienteLibro, t: 'n', z: moneyFormat, s: moneyStyle }
      ]);
    });

    if (transaccionesCorte.length === 0) {
      wsLibroData.push([
        { v: "-", s: { alignment: { horizontal: 'center' } } },
        { v: "-", s: { alignment: { horizontal: 'center' } } },
        { v: "-", s: { alignment: { horizontal: 'center' } } },
        { v: "Sin movimientos", s: {} },
        { v: "No se encontraron movimientos registrados en este período.", s: { font: { italic: true } } },
        { v: "-", s: {} },
        { v: 0, t: 'n', z: moneyFormat, s: moneyStyle },
        { v: 0, t: 'n', z: moneyFormat, s: moneyStyle },
        { v: saldoCorrienteLibro, t: 'n', z: moneyFormat, s: moneyStyle }
      ]);
    }

    wsLibroData.push([
      { v: "TOTALES DEL CORTE", s: totalRowLabelStyle },
      { v: "", s: totalRowLabelStyle },
      { v: "", s: totalRowLabelStyle },
      { v: "", s: totalRowLabelStyle },
      { v: "", s: totalRowLabelStyle },
      { v: "", s: totalRowLabelStyle },
      { v: totalGeneralIngresos, t: 'n', z: moneyFormatDecimals, s: totalRowIngresosStyle },
      { v: totalGeneralGastos, t: 'n', z: moneyFormatDecimals, s: totalRowGastosStyle },
      { v: saldoCorrienteLibro, t: 'n', z: moneyFormatDecimals, s: totalRowSaldoStyle }
    ]);

    wsLibroData.push([]);
    wsLibroData.push([
      { v: `RESUMEN CONTABLE: Saldo Anterior: ${formatCurrency(saldoAnterior)}  |  (+) Total Ingresos: ${formatCurrency(totalGeneralIngresos)}  |  (-) Total Gastos: ${formatCurrency(totalGeneralGastos)}  |  (=) SALDO FINAL AL CORTE: ${formatCurrency(saldoCorrienteLibro)}`, s: noteStyle },
      { v: '', s: noteStyle }, { v: '', s: noteStyle }, { v: '', s: noteStyle }, { v: '', s: noteStyle }, { v: '', s: noteStyle }, { v: '', s: noteStyle }, { v: '', s: noteStyle }, { v: '', s: noteStyle }
    ]);
    wsLibroData.push([]);
    wsLibroData.push([]);
    wsLibroData.push([
      { v: "__________________________________________", s: { alignment: { horizontal: 'center' } } },
      { v: "" }, { v: "" }, { v: "" },
      { v: "__________________________________________", s: { alignment: { horizontal: 'center' } } }
    ]);
    wsLibroData.push([
      { v: "RESPONSABLE DE CAJA MENOR", s: { font: { bold: true }, alignment: { horizontal: 'center' } } },
      { v: "" }, { v: "" }, { v: "" },
      { v: "RECTOR(A) / ORDENADOR DEL GASTO", s: { font: { bold: true }, alignment: { horizontal: 'center' } } }
    ]);
    wsLibroData.push([
      { v: responsable, s: { alignment: { horizontal: 'center' } } },
      { v: "" }, { v: "" }, { v: "" },
      { v: institutionName, s: { alignment: { horizontal: 'center' } } }
    ]);

    const wsLibro = XLSX.utils.aoa_to_sheet(wsLibroData);
    wsLibro['!cols'] = [
      { wch: 6 },  // N°
      { wch: 14 }, // Fecha
      { wch: 14 }, // Tipo
      { wch: 25 }, // Categoría
      { wch: 45 }, // Concepto
      { wch: 28 }, // Tercero
      { wch: 18 }, // Ingresos
      { wch: 18 }, // Gastos
      { wch: 20 }  // Saldo
    ];
    const totalRowsLibro = wsLibroData.length;
    wsLibro['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 8 } },
      { s: { r: totalRowsLibro - 7, c: 0 }, e: { r: totalRowsLibro - 7, c: 5 } },
      { s: { r: totalRowsLibro - 5, c: 0 }, e: { r: totalRowsLibro - 5, c: 8 } },
      { s: { r: totalRowsLibro - 3, c: 0 }, e: { r: totalRowsLibro - 3, c: 3 } },
      { s: { r: totalRowsLibro - 3, c: 4 }, e: { r: totalRowsLibro - 3, c: 8 } },
      { s: { r: totalRowsLibro - 2, c: 0 }, e: { r: totalRowsLibro - 2, c: 3 } },
      { s: { r: totalRowsLibro - 2, c: 4 }, e: { r: totalRowsLibro - 2, c: 8 } },
      { s: { r: totalRowsLibro - 1, c: 0 }, e: { r: totalRowsLibro - 1, c: 3 } },
      { s: { r: totalRowsLibro - 1, c: 4 }, e: { r: totalRowsLibro - 1, c: 8 } },
    ];
    XLSX.utils.book_append_sheet(wb, wsLibro, "Libro Auxiliar Corte");

    // ---------------------------------------------------------
    // HOJA 2: RESUMEN POR RUBROS / CATEGORÍAS
    // ---------------------------------------------------------
    const catsGasto = Array.from(new Set(transaccionesCorte.filter(t => t.tipo_operacion === 'Salida').map(t => t.categoria))) as string[];
    const catsIngreso = Array.from(new Set(transaccionesCorte.filter(t => t.tipo_operacion === 'Entrada').map(t => t.categoria))) as string[];

    const wsRubrosData: any[][] = [
      [{ v: institutionName, s: titleCenteredStyle }, {v:''}, {v:''}, {v:''}],
      [{ v: `RESUMEN DE RUBROS Y CATEGORÍAS: ${activeCaja.nombre}`, s: subtitleCenteredStyle }, {v:''}, {v:''}, {v:''}],
      [{ v: `PERÍODO: ${periodoTexto}`, s: { font: { bold: true, sz: 11 }, alignment: { horizontal: 'center' } } }, {v:''}, {v:''}, {v:''}],
      [],
      [{ v: "RESUMEN DE GASTOS POR RUBRO", s: headerLightBlueStyle }, {v:'', s: headerLightBlueStyle}, {v:'', s: headerLightBlueStyle}, {v:'', s: headerLightBlueStyle}],
      [
        { v: "Categoría de Gasto", s: headerBlueStyle },
        { v: "N° Movimientos", s: headerBlueStyle },
        { v: "Total Gastado", s: headerBlueStyle },
        { v: "% Participación", s: headerBlueStyle }
      ]
    ];

    catsGasto.forEach(cat => {
      const transCat = transaccionesCorte.filter(t => t.tipo_operacion === 'Salida' && t.categoria === cat);
      const catTotal = transCat.reduce((acc, curr) => acc + Number(curr.valor), 0);
      const pct = totalGeneralGastos > 0 ? (catTotal / totalGeneralGastos) : 0;
      wsRubrosData.push([
        { v: cat, s: {} },
        { v: transCat.length, t: 'n', s: { alignment: { horizontal: 'center' } } },
        { v: catTotal, t: 'n', z: moneyFormat, s: moneyStyle },
        { v: pct, t: 'n', z: '0.0%', s: { alignment: { horizontal: 'right' } } }
      ]);
    });

    if (catsGasto.length === 0) {
      wsRubrosData.push([{ v: "Sin gastos registrados", s: { font: { italic: true } } }, { v: 0, t: 'n' }, { v: 0, t: 'n', z: moneyFormat, s: moneyStyle }, { v: 0, t: 'n', z: '0.0%' }]);
    }

    wsRubrosData.push([
      { v: "TOTAL GASTOS", s: totalRowLabelStyle },
      { v: transaccionesCorte.filter(t => t.tipo_operacion === 'Salida').length, t: 'n', s: { ...totalRowLabelStyle, alignment: { horizontal: 'center' } } },
      { v: totalGeneralGastos, t: 'n', z: moneyFormatDecimals, s: totalRowGastosStyle },
      { v: 1, t: 'n', z: '100.0%', s: totalRowGastosStyle }
    ]);

    wsRubrosData.push([]);
    wsRubrosData.push([{ v: "RESUMEN DE INGRESOS POR RUBRO", s: headerLightBlueStyle }, {v:'', s: headerLightBlueStyle}, {v:'', s: headerLightBlueStyle}, {v:'', s: headerLightBlueStyle}]);
    wsRubrosData.push([
      { v: "Categoría de Ingreso", s: headerBlueStyle },
      { v: "N° Movimientos", s: headerBlueStyle },
      { v: "Total Ingresado", s: headerBlueStyle },
      { v: "% Participación", s: headerBlueStyle }
    ]);

    catsIngreso.forEach(cat => {
      const transCat = transaccionesCorte.filter(t => t.tipo_operacion === 'Entrada' && t.categoria === cat);
      const catTotal = transCat.reduce((acc, curr) => acc + Number(curr.valor), 0);
      const pct = totalGeneralIngresos > 0 ? (catTotal / totalGeneralIngresos) : 0;
      wsRubrosData.push([
        { v: cat, s: {} },
        { v: transCat.length, t: 'n', s: { alignment: { horizontal: 'center' } } },
        { v: catTotal, t: 'n', z: moneyFormat, s: moneyStyle },
        { v: pct, t: 'n', z: '0.0%', s: { alignment: { horizontal: 'right' } } }
      ]);
    });

    if (catsIngreso.length === 0) {
      wsRubrosData.push([{ v: "Sin ingresos registrados", s: { font: { italic: true } } }, { v: 0, t: 'n' }, { v: 0, t: 'n', z: moneyFormat, s: moneyStyle }, { v: 0, t: 'n', z: '0.0%' }]);
    }

    wsRubrosData.push([
      { v: "TOTAL INGRESOS", s: totalRowLabelStyle },
      { v: transaccionesCorte.filter(t => t.tipo_operacion === 'Entrada').length, t: 'n', s: { ...totalRowLabelStyle, alignment: { horizontal: 'center' } } },
      { v: totalGeneralIngresos, t: 'n', z: moneyFormatDecimals, s: totalRowIngresosStyle },
      { v: 1, t: 'n', z: '100.0%', s: totalRowIngresosStyle }
    ]);

    const wsRubros = XLSX.utils.aoa_to_sheet(wsRubrosData);
    wsRubros['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 22 }, { wch: 18 }];
    wsRubros['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } },
    ];
    XLSX.utils.book_append_sheet(wb, wsRubros, "Resumen por Rubros");

    // ---------------------------------------------------------
    // HOJA 3: INGRESOS MENSUALES
    // ---------------------------------------------------------
    const wsIngresosData: any[][] = [
      [{ v: institutionName, s: titleStyle }],
      [{ v: "REPORTE DE INGRESOS MENSUALES", s: subtitleStyle }],
      [],
      [],
      [{ v: `PERÍODO: ${periodoTexto}`, s: headerLightBlueStyle }],
      [],
      [],
      [{ v: "Concepto", s: headerBlueStyle }] 
    ];
    
    const mesesConIngresos = Array.from(new Set(transaccionesCorte.filter(t => t.tipo_operacion === 'Entrada').map(t => t.mes))).sort((a,b) => mesesOrder.indexOf(a as string) - mesesOrder.indexOf(b as string)) as string[];
    
    mesesConIngresos.forEach(m => wsIngresosData[7].push({ v: m.slice(0,3).toLowerCase(), s: headerBlueStyle }));
    wsIngresosData[7].push({ v: "Total INGRESOS", s: headerBlueStyle });
    
    wsIngresosData.push([{ v: "- INGRESOS", s: headerLightBlueStyle }]); 
    
    const totalesPorMesIng = Object.fromEntries(mesesConIngresos.map((m: string) => [m, 0]));

    catsIngreso.forEach((cat: string) => {
      const row: any[] = [{ v: `    ${cat}`, s: {} }];
      let totalCat = 0;
      mesesConIngresos.forEach((m: string) => {
        const sum = transaccionesCorte.filter(t => t.tipo_operacion === 'Entrada' && t.categoria === cat && t.mes === m).reduce((acc: number, curr: any) => acc + Number(curr.valor), 0);
        row.push({ v: sum || 0, t: 'n', z: moneyFormat, s: moneyStyle });
        totalCat += sum;
        totalesPorMesIng[m] += sum;
      });
      row.push({ v: totalCat, t: 'n', z: moneyFormat, s: moneyStyle });
      wsIngresosData.push(row);
    });

    const totalRowIng: any[] = [{ v: "Total INGRESOS", s: { font: { bold: true } } }];
    mesesConIngresos.forEach((m: string) => {
      totalRowIng.push({ v: totalesPorMesIng[m], t: 'n', z: moneyFormat, s: moneyBoldStyle });
    });
    totalRowIng.push({ v: totalGeneralIngresos, t: 'n', z: moneyFormat, s: moneyBoldStyle });
    wsIngresosData.push(totalRowIng);

    const wsIngresos = XLSX.utils.aoa_to_sheet(wsIngresosData);
    wsIngresos['!cols'] = [{ wch: 35 }, ...mesesConIngresos.map(() => ({ wch: 15 })), { wch: 20 }];
    wsIngresos['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } }, 
      { s: { r: 8, c: 0 }, e: { r: 8, c: Math.max(mesesConIngresos.length + 1, 1) } }, 
    ];
    XLSX.utils.book_append_sheet(wb, wsIngresos, "Ingresos Mensuales");

    // ---------------------------------------------------------
    // HOJA 4: GASTOS MENSUALES
    // ---------------------------------------------------------
    const wsGastosData: any[][] = [
      [{ v: institutionName, s: titleStyle }],
      [{ v: "REPORTE DE GASTOS MENSUALES", s: subtitleStyle }],
      [],
      [],
      [{ v: `PERÍODO: ${periodoTexto}`, s: headerLightBlueStyle }],
      [],
      [],
      [{ v: "Concepto", s: headerBlueStyle }] 
    ];
    
    const mesesConGastos = Array.from(new Set(transaccionesCorte.filter(t => t.tipo_operacion === 'Salida').map(t => t.mes))).sort((a,b) => mesesOrder.indexOf(a as string) - mesesOrder.indexOf(b as string)) as string[];
    
    mesesConGastos.forEach(m => wsGastosData[7].push({ v: m.slice(0,3).toLowerCase(), s: headerBlueStyle }));
    wsGastosData[7].push({ v: "Total GASTOS", s: headerBlueStyle });
    
    wsGastosData.push([{ v: "- GASTOS", s: headerLightBlueStyle }]); 
    
    const totalesPorMesGas = Object.fromEntries(mesesConGastos.map((m: string) => [m, 0]));

    catsGasto.forEach((cat: string) => {
      const row: any[] = [{ v: `    ${cat}`, s: {} }];
      let totalCat = 0;
      mesesConGastos.forEach((m: string) => {
        const sum = transaccionesCorte.filter(t => t.tipo_operacion === 'Salida' && t.categoria === cat && t.mes === m).reduce((acc: number, curr: any) => acc + Number(curr.valor), 0);
        row.push({ v: sum || 0, t: 'n', z: moneyFormat, s: moneyStyle });
        totalCat += sum;
        totalesPorMesGas[m] += sum;
      });
      row.push({ v: totalCat, t: 'n', z: moneyFormat, s: moneyStyle });
      wsGastosData.push(row);
    });

    const totalRowGas: any[] = [{ v: "Total GASTOS", s: { font: { bold: true } } }];
    mesesConGastos.forEach((m: string) => {
      totalRowGas.push({ v: totalesPorMesGas[m], t: 'n', z: moneyFormat, s: moneyBoldStyle });
    });
    totalRowGas.push({ v: totalGeneralGastos, t: 'n', z: moneyFormat, s: moneyBoldStyle });
    wsGastosData.push(totalRowGas);

    const wsGastos = XLSX.utils.aoa_to_sheet(wsGastosData);
    wsGastos['!cols'] = [{ wch: 35 }, ...mesesConGastos.map(() => ({ wch: 15 })), { wch: 20 }];
    wsGastos['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } }, 
      { s: { r: 8, c: 0 }, e: { r: 8, c: Math.max(mesesConGastos.length + 1, 1) } }, 
    ];
    XLSX.utils.book_append_sheet(wb, wsGastos, "Gastos Mensuales");

    // ---------------------------------------------------------
    // HOJA 5: DETALLADO GENERAL POR MES Y CATEGORÍA
    // ---------------------------------------------------------
    const wsDetalladoData: any[][] = [
      [{ v: institutionName, s: titleCenteredStyle }, {v:''}, {v:''}, {v:''}],
      [{ v: "REPORTE DE INGRESOS Y GASTOS DETALLADO POR CORTE", s: subtitleCenteredStyle }, {v:''}, {v:''}, {v:''}],
      [],
      [{ v: `Caja Menor: ${activeCaja.nombre}`, s: headerLightBlueStyle }, {v:'', s: headerLightBlueStyle}, {v:'', s: headerLightBlueStyle}, {v:'', s: headerLightBlueStyle}],
      [{ v: `Período: ${periodoTexto}`, s: headerLightBlueStyle }, {v:'', s: headerLightBlueStyle}, {v:'', s: headerLightBlueStyle}, {v:'', s: headerLightBlueStyle}],
      [{ v: "nota: estos datos corresponden al corte contable seleccionado y están auditados", s: noteStyle }, {v:'', s: noteStyle}, {v:'', s: noteStyle}, {v:'', s: noteStyle}],
      [
        { v: "DESCRIPCIÓN DE MOVIMIENTOS", s: headerBlueStyle },
        { v: "Entrada", s: headerBlueStyle },
        { v: "SALIDAS", s: headerBlueStyle },
        { v: "Saldo", s: headerBlueStyle }
      ]
    ];

    wsDetalladoData.push([
      { v: "-INGRESOS", s: headerLightBlueStyle },
      { v: totalGeneralIngresos, t: 'n', z: moneyFormat, s: { ...moneyBoldStyle, fill: { fgColor: { rgb: "9BC2E6" } } } },
      { v: 0, t: 'n', z: moneyFormat, s: { ...moneyBoldStyle, fill: { fgColor: { rgb: "9BC2E6" } } } },
      { v: totalGeneralIngresos, t: 'n', z: moneyFormat, s: { ...moneyBoldStyle, fill: { fgColor: { rgb: "9BC2E6" } } } }
    ]);

    catsIngreso.forEach(cat => {
      const transCat = transaccionesCorte.filter(t => t.tipo_operacion === 'Entrada' && t.categoria === cat);
      const catTotal = transCat.reduce((acc, curr) => acc + Number(curr.valor), 0);
      
      wsDetalladoData.push([
        { v: `  - ${cat}`, s: { font: { bold: true } } },
        { v: catTotal, t: 'n', z: moneyFormat, s: moneyBoldStyle },
        { v: 0, t: 'n', z: moneyFormat, s: moneyBoldStyle },
        { v: catTotal, t: 'n', z: moneyFormat, s: moneyBoldStyle }
      ]);
      
      transCat.forEach(t => {
        const val = Number(t.valor);
        wsDetalladoData.push([
          { v: `    ${t.concepto}${t.tercero ? ` (Por: ${t.tercero})` : ''}, ${t.fecha.split('-').reverse().join('/')}`, s: {} },
          { v: val, t: 'n', z: moneyFormat, s: moneyStyle },
          { v: 0, t: 'n', z: moneyFormat, s: moneyStyle },
          { v: val, t: 'n', z: moneyFormat, s: moneyStyle }
        ]);
      });
    });

    wsDetalladoData.push([
      { v: "-GASTOS", s: headerLightBlueStyle },
      { v: 0, t: 'n', z: moneyFormat, s: { ...moneyBoldStyle, fill: { fgColor: { rgb: "9BC2E6" } } } },
      { v: totalGeneralGastos, t: 'n', z: moneyFormat, s: { ...moneyBoldStyle, fill: { fgColor: { rgb: "9BC2E6" } } } },
      { v: -totalGeneralGastos, t: 'n', z: moneyFormat, s: { ...moneyBoldStyle, fill: { fgColor: { rgb: "9BC2E6" } } } } 
    ]);

    catsGasto.forEach(cat => {
      const transCat = transaccionesCorte.filter(t => t.tipo_operacion === 'Salida' && t.categoria === cat);
      const catTotal = transCat.reduce((acc, curr) => acc + Number(curr.valor), 0);
      
      wsDetalladoData.push([
        { v: `  - ${cat}`, s: { font: { bold: true } } },
        { v: 0, t: 'n', z: moneyFormat, s: moneyBoldStyle },
        { v: catTotal, t: 'n', z: moneyFormat, s: moneyBoldStyle },
        { v: -catTotal, t: 'n', z: moneyFormat, s: moneyBoldStyle }
      ]);
      
      transCat.forEach(t => {
        const val = Number(t.valor);
        wsDetalladoData.push([
          { v: `    ${t.concepto}${t.tercero ? ` (Por: ${t.tercero})` : ''}, ${t.fecha.split('-').reverse().join('/')}`, s: {} },
          { v: 0, t: 'n', z: moneyFormat, s: moneyStyle },
          { v: val, t: 'n', z: moneyFormat, s: moneyStyle },
          { v: -val, t: 'n', z: moneyFormat, s: moneyStyle }
        ]);
      });
    });

    const saldoTotalGeneral = totalGeneralIngresos - totalGeneralGastos;
    wsDetalladoData.push([
      { v: "Total general", s: totalRowLabelStyle },
      { v: totalGeneralIngresos, t: 'n', z: moneyFormatDecimals, s: totalRowIngresosStyle },
      { v: totalGeneralGastos, t: 'n', z: moneyFormatDecimals, s: totalRowGastosStyle },
      { v: saldoTotalGeneral, t: 'n', z: moneyFormatDecimals, s: totalRowSaldoStyle }
    ]);

    const wsDetallado = XLSX.utils.aoa_to_sheet(wsDetalladoData);
    wsDetallado['!cols'] = [{ wch: 120 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
    wsDetallado['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } }, 
      { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } }, 
      { s: { r: 5, c: 0 }, e: { r: 5, c: 3 } }, 
    ];
    XLSX.utils.book_append_sheet(wb, wsDetallado, "Detallado por Mes");

    const safeCajaName = activeCaja.nombre.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFechaFin = fechaFin || anoReporte;
    const nombreArchivo = `Reporte_Corte_${safeCajaName}_al_${safeFechaFin}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
  };

  return (
    <div className="w-full space-y-6">
      
      {/* KPI Cards - Estadísticas Rápidas */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4" id="caja-kpi-metrics-row">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
            <ArrowUpCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalIngresos)}
            </p>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              Ingresos {filtroMes === 'TODOS' ? `del Año (${filtroAno})` : `del Mes (${filtroMes})`}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600 shrink-0">
            <ArrowDownCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalGastos)}
            </p>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              Gastos {filtroMes === 'TODOS' ? `del Año (${filtroAno})` : `del Mes (${filtroMes})`}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${saldoFinal >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xl md:text-2xl font-bold tracking-tight ${saldoFinal >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(saldoFinal)}
            </p>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              Saldo Disponible {filtroMes === 'TODOS' ? `del Año (${filtroAno})` : `(${filtroMes})`}
            </p>
          </div>
        </div>
      </section>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 mb-6">
        {/* HEADER */}
        <div className="bg-white border-b border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Módulo de Caja Menor</h2>
              {activeCajaId ? (
                <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm font-semibold mt-1">
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Ingresos del Año: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalesAnuales.ingresos)}</span>
                  <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">Gastos del Año: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalesAnuales.gastos)}</span>
                  <span className={`px-2 py-0.5 rounded-md ${(totalesAnuales.ingresos - totalesAnuales.gastos) >= 0 ? 'text-blue-600 bg-blue-50' : 'text-red-600 bg-red-50'}`}>
                    Saldo Disponible: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalesAnuales.ingresos - totalesAnuales.gastos)}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Seleccione o cree una caja menor</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isCreatingCaja ? (
              <form onSubmit={handleCrearCaja} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nombre de la caja..."
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={nuevaCajaNombre}
                  onChange={(e) => setNuevaCajaNombre(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500">
                  <Save className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setIsCreatingCaja(false)} className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300">
                  Cancelar
                </button>
              </form>
            ) : (
              <>
                {isEditingCaja ? (
                  <form onSubmit={handleGuardarEdicionCaja} className="flex items-center gap-2">
                    <input
                      type="text"
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={editCajaNombre}
                      onChange={(e) => setEditCajaNombre(e.target.value)}
                      autoFocus
                    />
                    <button type="submit" className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">
                      <Save className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setIsEditingCaja(false)} className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300">
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <>
                    <select
                      value={activeCajaId}
                      onChange={(e) => setActiveCajaId(e.target.value)}
                      className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 min-w-[150px]"
                    >
                      {cajas.length === 0 && <option value="" disabled>No hay cajas creadas</option>}
                      {cajas.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                    {cajas.length > 0 && activeCajaId && (
                      <button
                        onClick={() => {
                          const cajaActual = cajas.find(c => c.id === activeCajaId);
                          if (cajaActual) {
                            setEditCajaNombre(cajaActual.nombre);
                            setIsEditingCaja(true);
                          }
                        }}
                        className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-200 hover:text-slate-800 font-semibold text-sm flex items-center justify-center"
                        title="Editar nombre de la caja"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
                {cajas.length > 0 && (
                  <button
                    onClick={() => handleEliminarCaja(activeCajaId)}
                    className="px-3 py-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 hover:bg-rose-100 hover:text-rose-700 font-semibold text-sm"
                    title="Eliminar esta caja menor"
                  >
                    Eliminar Caja
                  </button>
                )}
                <button
                  onClick={() => setIsCreatingCaja(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Caja
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {activeCajaId ? (
        <div className="space-y-6">
          {/* TABLE & TOOLS */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200 gap-4">
              <button
                onClick={handleOpenNewMovimientoModal}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 text-sm font-bold shadow-md shadow-emerald-950/20 transition-all w-full md:w-auto"
              >
                <Plus className="w-5 h-5" />
                Registrar Movimiento
              </button>
              <div className="flex gap-2 flex-wrap justify-center">
                <button
                  onClick={() => setShowReporteCorteModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 text-sm font-bold shadow-md transition-all hover:ring-2 hover:ring-emerald-500/50"
                  title="Generar reporte con fecha final / corte contable"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  Descargar Reporte Excel
                </button>
                <button
                  onClick={() => setShowResumenModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 text-sm font-bold shadow-md shadow-blue-950/20 transition-all"
                >
                  <BarChart3 className="w-4 h-4" />
                  Ver Resumen Anual
                </button>
                <button
                  onClick={() => setShowCalculator(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 text-sm font-bold shadow-md shadow-indigo-950/20 transition-all"
                >
                  <Calculator className="w-4 h-4" />
                  Calculadora Billetes
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between bg-slate-50 gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-bold text-slate-800 whitespace-nowrap">
                    Libro Mayor - {filtroMes === 'TODOS' ? 'Todos los Movimientos' : filtroMes} {filtroAno}
                  </h3>
                  {hayBusquedaTexto && (
                    <span className="text-[11px] bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                      Buscando en todos los meses
                    </span>
                  )}
                </div>
                
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto items-center flex-wrap">
                  <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2">
                    <select
                      value={filtroMes}
                      onChange={(e) => setFiltroMes(e.target.value)}
                      className="bg-transparent border-none text-sm font-bold text-slate-700 py-2 pl-1 pr-2 focus:ring-0 cursor-pointer outline-none"
                    >
                      <option value="TODOS">Todos los Meses</option>
                      {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                    <select
                      value={filtroAno}
                      onChange={(e) => setFiltroAno(e.target.value)}
                      className="bg-transparent border-none text-sm font-bold text-slate-700 py-2 pl-1 pr-2 focus:ring-0 cursor-pointer outline-none"
                    >
                      {[currentYearStr, String(Number(currentYearStr)-1)].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      value={filtroTablaFecha}
                      onChange={(e) => setFiltroTablaFecha(e.target.value)}
                      className="p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white"
                      title="Filtrar por fecha específica"
                    />
                    {filtroTablaFecha && (
                      <button 
                        onClick={() => setFiltroTablaFecha('')}
                        className="absolute -top-2 -right-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                        title="Quitar filtro de fecha"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Filtrar por Concepto..."
                    value={filtroTablaConcepto}
                    onChange={(e) => setFiltroTablaConcepto(e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 w-full md:w-48 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Filtrar por Tercero..."
                    value={filtroTablaTercero}
                    onChange={(e) => setFiltroTablaTercero(e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 w-full md:w-48 bg-white"
                  />
                  {(filtroTablaConcepto || filtroTablaTercero || filtroTablaFecha || filtroMes !== 'TODOS') && (
                    <button
                      type="button"
                      onClick={() => {
                        setFiltroTablaConcepto('');
                        setFiltroTablaTercero('');
                        setFiltroTablaFecha('');
                        setFiltroMes('TODOS');
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                      title="Ver todos los movimientos y limpiar filtros"
                    >
                      Mostrar Todo
                    </button>
                  )}
                </div>
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{transaccionesTabla.length} movimientos</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-xs text-slate-600 uppercase font-bold tracking-wider">
                      <th className="p-4 border-b border-slate-200">Fecha</th>
                      <th className="p-4 border-b border-slate-200">Concepto</th>
                      <th className="p-4 border-b border-slate-200">Tercero</th>
                      <th className="p-4 border-b border-slate-200 text-right">Entrada</th>
                      <th className="p-4 border-b border-slate-200 text-right">Salida</th>
                      <th className="p-4 border-b border-slate-200 text-right">Saldo</th>
                      <th className="p-4 border-b border-slate-200 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transaccionesTabla.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            {t.tipo_operacion === 'Entrada' ? <ArrowUpCircle className="w-4 h-4 text-emerald-500" /> : <ArrowDownCircle className="w-4 h-4 text-red-500" />}
                            {t.fecha}
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-sm font-bold text-slate-800">{t.categoria}</p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.concepto}</p>
                        </td>
                        <td className="p-4 text-sm font-medium text-slate-700">
                          {t.tercero || '-'}
                        </td>
                        <td className="p-4 text-right whitespace-nowrap font-mono text-emerald-600 font-bold">
                          {t.tipo_operacion === 'Entrada' ? formatCurrency(t.valor) : '-'}
                        </td>
                        <td className="p-4 text-right whitespace-nowrap font-mono text-red-600 font-bold">
                          {t.tipo_operacion === 'Salida' ? formatCurrency(t.valor) : '-'}
                        </td>
                        <td className="p-4 text-right whitespace-nowrap font-mono text-slate-800 font-bold bg-slate-50/50">
                          {formatCurrency(t.saldo_momento)}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEditTx(t)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEliminar(t.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {transaccionesTabla.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p className="font-medium text-slate-600">
                            {hayBusquedaTexto 
                              ? 'No se encontraron movimientos que coincidan con la búsqueda.' 
                              : 'No hay transacciones registradas en este período.'}
                          </p>
                          {(hayBusquedaTexto || filtroTablaFecha || filtroMes !== 'TODOS') && (
                            <button
                              type="button"
                              onClick={() => {
                                setFiltroTablaConcepto('');
                                setFiltroTablaTercero('');
                                setFiltroTablaFecha('');
                                setFiltroMes('TODOS');
                              }}
                              className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                            >
                              Mostrar todos los movimientos
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-dashed border-slate-300">
          <Wallet className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700">Ninguna Caja Seleccionada</h3>
          <p className="text-slate-500 text-sm mt-1">Selecciona una caja menor del menú superior o crea una nueva para comenzar.</p>
        </div>
      )}

      {showCalculator && (
        <CalculadoraArqueo 
          onClose={() => setShowCalculator(false)} 
          onInsertTotal={(t) => { setValor(formatNumberInput(t.toString())); setShowCalculator(false); }} 
        />
      )}

      {showAdminCategorias && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
            <button onClick={() => setShowAdminCategorias(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4">
                Administrar {tipoOp === 'Entrada' ? 'Entradas' : 'Salidas'}
              </h3>
              
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={nuevaCatText}
                  onChange={e => setNuevaCatText(e.target.value)}
                  placeholder="Escriba un nuevo tipo..."
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  onKeyDown={e => e.key === 'Enter' && handleAddCustomCat()}
                />
                <button
                  onClick={handleAddCustomCat}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Agregar
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                <h4 className="text-sm font-bold text-slate-500 mb-2 uppercase">Categorías Personalizadas</h4>
                {(tipoOp === 'Entrada' ? customCategorias.ingresos : customCategorias.gastos).length === 0 ? (
                  <p className="text-slate-400 text-sm italic">No has agregado categorías personalizadas.</p>
                ) : (
                  (tipoOp === 'Entrada' ? customCategorias.ingresos : customCategorias.gastos).map(c => (
                    <div key={c} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-3 rounded-xl">
                      {editingCat === c ? (
                        <input
                          type="text"
                          value={editingCatText}
                          onChange={(e) => setEditingCatText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEditCat(c);
                            if (e.key === 'Escape') setEditingCat(null);
                          }}
                          autoFocus
                          className="flex-1 px-3 py-1 mr-2 bg-white border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                        />
                      ) : (
                        <span className="font-medium text-slate-700">{c}</span>
                      )}
                      <div className="flex items-center gap-1">
                        {editingCat === c ? (
                          <>
                            <button onClick={() => handleSaveEditCat(c)} className="text-emerald-500 hover:bg-emerald-100 p-2 rounded-lg transition-colors" title="Guardar">
                              <Save className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingCat(null)} className="text-slate-400 hover:bg-slate-200 p-2 rounded-lg transition-colors" title="Cancelar">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditingCat(c); setEditingCatText(c); }} className="text-blue-500 hover:bg-blue-100 p-2 rounded-lg transition-colors" title="Editar">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleRemoveCustomCat(c)} className="text-rose-500 hover:bg-rose-100 p-2 rounded-lg transition-colors" title="Eliminar">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showResumenModal && (
        <ResumenAnualModal 
          onClose={() => setShowResumenModal(false)}
          transacciones={transacciones.filter(t => t.caja_id === activeCajaId && t.ano === filtroAno)}
          filtroAno={filtroAno}
          nombreCaja={activeCaja?.nombre || ''}
        />
      )}

      {showReporteCorteModal && activeCaja && (
        <ReporteCorteModal
          onClose={() => setShowReporteCorteModal(false)}
          onGenerate={(opts) => {
            generateExcel(opts);
            setShowReporteCorteModal(false);
          }}
          activeCaja={activeCaja}
          transacciones={transacciones}
          filtroAno={filtroAno}
          userSession={userSession}
        />
      )}

      {showMovimientoModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => { setShowMovimientoModal(false); setEditTxId(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              {editTxId ? <Edit2 className="w-6 h-6 text-blue-600" /> : <Plus className="w-6 h-6 text-emerald-600" />}
              {editTxId ? 'Editar Movimiento' : 'Registrar Movimiento'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTipoOp('Entrada')}
                  className={`py-2 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${tipoOp === 'Entrada' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setTipoOp('Salida')}
                  className={`py-2 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${tipoOp === 'Salida' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  Salida
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">FECHA</label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">VALOR (COP)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="text"
                      required
                      value={valor}
                      onChange={(e) => setValor(formatNumberInput(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">TIPO DE {tipoOp.toUpperCase()}</label>
                <select
                  value={categoria}
                  onChange={(e) => {
                    if (e.target.value === '___ADMIN___') {
                      setShowAdminCategorias(true);
                    } else {
                      setCategoria(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {opcionesCategoria.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="___ADMIN___" className="font-bold text-indigo-600 bg-indigo-50">
                    + Administrar Categorías...
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {tipoOp === 'Entrada' ? 'QUIEN REALIZÓ EL PAGO' : 'A QUIEN SE LE ENTREGÓ'} (Opcional)
                </label>
                <input
                  type="text"
                  value={tercero}
                  onChange={(e) => setTercero(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  placeholder={tipoOp === 'Entrada' ? "Ej. Juan Perez" : "Ej. Maria Gomez"}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">CONCEPTO / DESCRIPCIÓN</label>
                <textarea
                  required
                  rows={2}
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej. Pago aseo primera semana..."
                />
              </div>

              <button
                type="submit"
                className={`w-full py-4 rounded-xl text-white font-black text-sm transition-all shadow-lg active:scale-[0.98] ${tipoOp === 'Entrada' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/30' : 'bg-gradient-to-r from-red-500 to-rose-500 shadow-red-500/30'}`}
              >
                {editTxId ? 'GUARDAR CAMBIOS' : `REGISTRAR ${tipoOp.toUpperCase()}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ResumenAnualModal({ onClose, transacciones, filtroAno, nombreCaja }: { onClose: () => void, transacciones: CajaTransaccion[], filtroAno: string, nombreCaja: string }) {
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const formatCur = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

  const totalIngresos = transacciones.filter(t => t.tipo_operacion === 'Entrada').reduce((a,c) => a + Number(c.valor), 0);
  const totalGastos = transacciones.filter(t => t.tipo_operacion === 'Salida').reduce((a,c) => a + Number(c.valor), 0);
  const saldoFinal = totalIngresos - totalGastos;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors z-10">
          <X className="w-5 h-5" />
        </button>
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" /> Resumen Anual {filtroAno}
          </h3>
          <p className="text-slate-500 font-medium text-sm mt-1">{nombreCaja}</p>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 font-bold border-b border-slate-200">Mes</th>
                  <th className="px-4 py-3 font-bold border-b border-slate-200 text-right">Ingresos</th>
                  <th className="px-4 py-3 font-bold border-b border-slate-200 text-right">Gastos</th>
                  <th className="px-4 py-3 font-bold border-b border-slate-200 text-right">Saldo Neto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {meses.map(m => {
                  const ing = transacciones.filter(t => t.mes === m && t.tipo_operacion === 'Entrada').reduce((a,c) => a+Number(c.valor), 0);
                  const gas = transacciones.filter(t => t.mes === m && t.tipo_operacion === 'Salida').reduce((a,c) => a+Number(c.valor), 0);
                  if (ing === 0 && gas === 0) return null;
                  return (
                    <tr key={m} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-700">{m}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">{formatCur(ing)}</td>
                      <td className="px-4 py-3 text-right text-rose-600 font-medium">{formatCur(gas)}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCur(ing - gas)}</td>
                    </tr>
                  )
                })}
                {transacciones.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">No hay transacciones registradas en este año.</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-800 text-white font-bold">
                <tr>
                  <td className="px-4 py-4 uppercase">Total General</td>
                  <td className="px-4 py-4 text-right text-emerald-400">{formatCur(totalIngresos)}</td>
                  <td className="px-4 py-4 text-right text-rose-400">{formatCur(totalGastos)}</td>
                  <td className={`px-4 py-4 text-right ${saldoFinal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCur(saldoFinal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>


  );
}

function CalculadoraArqueo({ onClose, onInsertTotal }: { onClose: () => void, onInsertTotal: (total: number) => void }) {
  const billetes = [100000, 50000, 20000, 10000, 5000, 2000, 1000];
  const monedas = [1000, 500, 200, 100, 50];

  const [cantidades, setCantidades] = useState<Record<number, string>>({});

  const handleCantidadChange = (denom: number, val: string) => {
    setCantidades(prev => ({ ...prev, [denom]: val }));
  };

  const calcularSubtotal = (denom: number) => denom * (Number(cantidades[denom]) || 0);

  const total = [...billetes, ...monedas].reduce((acc, denom) => acc + calcularSubtotal(denom), 0);

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl text-white max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 p-2 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <Calculator className="w-6 h-6 text-indigo-400" />
          <h3 className="text-lg font-bold">Calculadora Billetes</h3>
        </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h4 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider border-b border-slate-700 pb-2">Billetes</h4>
          <div className="space-y-3">
            {billetes.map(b => (
              <div key={b} className="flex items-center justify-between bg-slate-700/50 p-2 rounded-lg">
                <span className="font-mono text-slate-300 w-24">{formatCurrency(b)}</span>
                <span className="text-slate-500">x</span>
                <input 
                  type="number" 
                  min="0"
                  className="w-20 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-center font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={cantidades[b] || ''}
                  onChange={(e) => handleCantidadChange(b, e.target.value)}
                  placeholder="0"
                />
                <span className="font-mono font-bold w-28 text-right text-indigo-300">{formatCurrency(calcularSubtotal(b))}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider border-b border-slate-700 pb-2">Monedas</h4>
          <div className="space-y-3">
            {monedas.map(m => (
              <div key={m} className="flex items-center justify-between bg-slate-700/50 p-2 rounded-lg">
                <span className="font-mono text-slate-300 w-24">{formatCurrency(m)}</span>
                <span className="text-slate-500">x</span>
                <input 
                  type="number" 
                  min="0"
                  className="w-20 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-center font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={cantidades[m] || ''}
                  onChange={(e) => handleCantidadChange(m, e.target.value)}
                  placeholder="0"
                />
                <span className="font-mono font-bold w-28 text-right text-indigo-300">{formatCurrency(calcularSubtotal(m))}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-8 bg-indigo-600 p-4 rounded-xl text-center border border-indigo-500 shadow-lg shadow-indigo-900/50">
            <span className="block text-indigo-200 text-xs font-bold mb-1 uppercase tracking-wider">Total Efectivo Físico</span>
            <span className="block text-3xl font-black font-mono tracking-tight mb-4">{formatCurrency(total)}</span>
            <button 
               onClick={() => { onInsertTotal(total); }}
               className="w-full bg-white text-indigo-900 font-bold py-3 px-4 rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/20"
            >
               <Plus className="w-5 h-5" /> Usar este valor ($ {total})
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

interface ReporteCorteModalProps {
  onClose: () => void;
  onGenerate: (opciones: OpcionesReporteCorte) => void;
  activeCaja: Caja;
  transacciones: CajaTransaccion[];
  filtroAno: string;
  userSession?: any;
}

function ReporteCorteModal({
  onClose,
  onGenerate,
  activeCaja,
  transacciones,
  filtroAno,
  userSession
}: ReporteCorteModalProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const startOfYearStr = `${filtroAno || new Date().getFullYear()}-01-01`;

  const [tipoPeriodo, setTipoPeriodo] = useState<'corte' | 'rango' | 'ano'>('corte');
  const [fechaFin, setFechaFin] = useState<string>(() => {
    const currentYear = filtroAno || new Date().getFullYear().toString();
    if (todayStr.startsWith(currentYear)) return todayStr;
    return `${currentYear}-12-31`;
  });
  const [fechaInicio, setFechaInicio] = useState<string>(startOfYearStr);
  const [identificadorCorte, setIdentificadorCorte] = useState('');
  const [responsable, setResponsable] = useState(userSession?.user?.name || userSession?.user?.email?.split('@')[0] || '');
  const [mostrarDetalleMovimientos, setMostrarDetalleMovimientos] = useState(false);

  useEffect(() => {
    const defaultStart = `${filtroAno || new Date().getFullYear()}-01-01`;
    setFechaInicio(defaultStart);
    if (todayStr.startsWith(filtroAno)) {
      setFechaFin(todayStr);
    } else {
      setFechaFin(`${filtroAno}-12-31`);
    }
  }, [filtroAno]);

  // Accesos rápidos de fecha de corte dentro del año fiscal
  const handleQuickDate = (tipo: 'hoy' | 'ayer' | 'finMesActual' | 'finMesAnterior') => {
    const d = new Date();
    const currentYear = Number(filtroAno || d.getFullYear());
    if (tipo === 'hoy') {
      if (d.getFullYear() === currentYear) {
        setFechaFin(d.toISOString().split('T')[0]);
      } else {
        setFechaFin(`${currentYear}-12-31`);
      }
    } else if (tipo === 'ayer') {
      d.setDate(d.getDate() - 1);
      if (d.getFullYear() === currentYear) {
        setFechaFin(d.toISOString().split('T')[0]);
      } else {
        setFechaFin(`${currentYear}-12-31`);
      }
    } else if (tipo === 'finMesActual') {
      const month = d.getFullYear() === currentYear ? d.getMonth() : 11;
      const lastDay = new Date(currentYear, month + 1, 0);
      setFechaFin(lastDay.toISOString().split('T')[0]);
    } else if (tipo === 'finMesAnterior') {
      const month = d.getFullYear() === currentYear ? d.getMonth() - 1 : 10;
      const lastDay = new Date(currentYear, month + 1, 0);
      setFechaFin(lastDay.toISOString().split('T')[0]);
    }
  };

  // Determinar la fecha de inicio efectiva (siempre dentro del año fiscal seleccionado)
  const effectiveFechaInicio = useMemo(() => {
    if (tipoPeriodo === 'corte') {
      return fechaInicio;
    }
    if (tipoPeriodo === 'ano') {
      return `${filtroAno}-01-01`;
    }
    return fechaInicio;
  }, [tipoPeriodo, fechaInicio, filtroAno]);

  // Determinar la fecha de fin efectiva (siempre dentro del año fiscal seleccionado)
  const effectiveFechaFin = useMemo(() => {
    if (tipoPeriodo === 'ano') {
      return `${filtroAno}-12-31`;
    }
    return fechaFin;
  }, [tipoPeriodo, fechaFin, filtroAno]);

  // Transacciones previas para saldo anterior (exclusivamente del año seleccionado)
  const transaccionesPrevias = useMemo(() => {
    if (!effectiveFechaInicio) return [];
    return transacciones.filter(t => {
      if (t.caja_id !== activeCaja.id) return false;
      if (t.ano !== filtroAno) return false;
      return t.fecha < effectiveFechaInicio;
    });
  }, [transacciones, activeCaja.id, effectiveFechaInicio, filtroAno]);

  const saldoAnterior = useMemo(() => {
    return transaccionesPrevias.reduce((acc, curr) => {
      return curr.tipo_operacion === 'Entrada' ? acc + Number(curr.valor) : acc - Number(curr.valor);
    }, 0);
  }, [transaccionesPrevias]);

  // Transacciones comprendidas en el corte (exclusivamente del año seleccionado)
  const transaccionesCorte = useMemo(() => {
    return transacciones
      .filter(t => {
        if (t.caja_id !== activeCaja.id) return false;
        if (t.ano !== filtroAno) return false;
        if (effectiveFechaInicio && t.fecha < effectiveFechaInicio) return false;
        if (effectiveFechaFin && t.fecha > effectiveFechaFin) return false;
        return true;
      })
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }, [transacciones, activeCaja.id, effectiveFechaInicio, effectiveFechaFin, filtroAno]);

  const totalIngresos = useMemo(() => {
    return transaccionesCorte
      .filter(t => t.tipo_operacion === 'Entrada')
      .reduce((acc, curr) => acc + Number(curr.valor), 0);
  }, [transaccionesCorte]);

  const totalGastos = useMemo(() => {
    return transaccionesCorte
      .filter(t => t.tipo_operacion === 'Salida')
      .reduce((acc, curr) => acc + Number(curr.valor), 0);
  }, [transaccionesCorte]);

  const saldoNeto = totalIngresos - totalGastos;
  const saldoFinalCorte = saldoAnterior + saldoNeto;

  const entradasCount = transaccionesCorte.filter(t => t.tipo_operacion === 'Entrada').length;
  const salidasCount = transaccionesCorte.filter(t => t.tipo_operacion === 'Salida').length;

  const handleDescargar = () => {
    if (!effectiveFechaFin) {
      alert('Por favor especifique la fecha final de corte.');
      return;
    }
    onGenerate({
      fechaInicio: effectiveFechaInicio,
      fechaFin: effectiveFechaFin,
      identificadorCorte: identificadorCorte.trim(),
      responsable: responsable.trim(),
      ano: filtroAno
    });
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden relative flex flex-col max-h-[92vh] border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/15 hover:bg-white/20 p-2 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Generar Reporte por Corte Contable
              </h3>
              <p className="text-xs text-emerald-300 font-medium mt-0.5 flex items-center gap-2 flex-wrap">
                <span>Caja Menor: <strong className="text-white uppercase">{activeCaja.nombre}</strong></span>
                <span>•</span>
                <span>Año Fiscal: <strong className="text-white bg-emerald-800/60 px-2 py-0.5 rounded border border-emerald-500/40">{filtroAno}</strong></span>
                <span>•</span>
                <span>Institución Educativa Alvernia</span>
              </p>
            </div>
          </div>
        </div>

        {/* BODY (SCROLLABLE) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* SELECCIÓN DE MODALIDAD / TABS */}
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setTipoPeriodo('corte')}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${
                tipoPeriodo === 'corte'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Corte a Fecha Final</span>
            </button>

            <button
              type="button"
              onClick={() => setTipoPeriodo('rango')}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${
                tipoPeriodo === 'rango'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Rango Entre Fechas</span>
            </button>

            <button
              type="button"
              onClick={() => setTipoPeriodo('ano')}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${
                tipoPeriodo === 'ano'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Año Completo ({filtroAno})</span>
            </button>
          </div>

          {/* CONTROLES DE FECHAS */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Parámetros del Corte
              </span>
              {tipoPeriodo !== 'ano' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">Accesos rápidos:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickDate('hoy')}
                    className="text-[11px] font-bold px-2 py-1 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 rounded-lg transition-colors"
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDate('finMesActual')}
                    className="text-[11px] font-bold px-2 py-1 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 rounded-lg transition-colors"
                  >
                    Fin Mes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDate('finMesAnterior')}
                    className="text-[11px] font-bold px-2 py-1 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 rounded-lg transition-colors"
                  >
                    Mes Ant.
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FECHA INICIAL */}
              {tipoPeriodo !== 'ano' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    FECHA INICIAL (DESDE)
                  </label>
                  <input
                    type="date"
                    min={`${filtroAno}-01-01`}
                    max={`${filtroAno}-12-31`}
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Acotado al año fiscal {filtroAno}.
                  </p>
                </div>
              )}

              {/* FECHA FINAL (FECHA DE CORTE) */}
              <div className={tipoPeriodo === 'ano' ? 'md:col-span-2' : ''}>
                <label className="block text-xs font-black text-emerald-800 mb-1.5 flex items-center justify-between">
                  <span>FECHA FINAL DEL REPORTE (FECHA DE CORTE) *</span>
                  <span className="text-[10px] font-normal text-slate-400">Año {filtroAno}</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    min={`${filtroAno}-01-01`}
                    max={`${filtroAno}-12-31`}
                    disabled={tipoPeriodo === 'ano'}
                    required
                    value={effectiveFechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-emerald-50/50 border-2 border-emerald-500 rounded-xl text-sm font-black text-emerald-950 focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none shadow-sm transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Solo se incluirán los movimientos de {filtroAno} registrados hasta esta fecha límite.
                </p>
              </div>
            </div>

            {/* IDENTIFICADOR Y RESPONSABLE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  IDENTIFICADOR O N° DE CORTE (OPCIONAL)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Corte N° 01 - Legalización de Gastos"
                  value={identificadorCorte}
                  onChange={(e) => setIdentificadorCorte(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  RESPONSABLE / ELABORADO POR
                </label>
                <input
                  type="text"
                  placeholder="Nombre de quien presenta el corte"
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* PREVISUALIZACIÓN DE TOTALES / KPIS EN VIVO */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Resumen del Corte Seleccionado
              </span>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                {transaccionesCorte.length} movimientos ({entradasCount} entradas, {salidasCount} salidas)
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
              {/* SALDO ANTERIOR */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Saldo Anterior</span>
                <span className="text-sm md:text-base font-bold text-slate-700 block mt-0.5">
                  {formatCurrency(saldoAnterior)}
                </span>
              </div>

              {/* INGRESOS */}
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block flex items-center gap-1">
                  <ArrowUpCircle className="w-3 h-3" /> (+) Ingresos
                </span>
                <span className="text-sm md:text-base font-bold text-emerald-700 block mt-0.5">
                  {formatCurrency(totalIngresos)}
                </span>
              </div>

              {/* GASTOS */}
              <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-100">
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block flex items-center gap-1">
                  <ArrowDownCircle className="w-3 h-3" /> (-) Gastos
                </span>
                <span className="text-sm md:text-base font-bold text-rose-700 block mt-0.5">
                  {formatCurrency(totalGastos)}
                </span>
              </div>

              {/* SALDO FINAL */}
              <div className={`p-3 rounded-xl border ${saldoFinalCorte >= 0 ? 'bg-blue-50/70 border-blue-200 text-blue-900' : 'bg-red-50/70 border-red-200 text-red-900'}`}>
                <span className="text-[10px] font-black uppercase tracking-wider block flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> (=) Saldo al Corte
                </span>
                <span className="text-base md:text-lg font-black block mt-0.5">
                  {formatCurrency(saldoFinalCorte)}
                </span>
              </div>
            </div>

            {/* TOGGLE DETALLE DE MOVIMIENTOS */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMostrarDetalleMovimientos(!mostrarDetalleMovimientos)}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-between transition-colors"
              >
                <span>Previsualizar listado de transacciones ({transaccionesCorte.length})</span>
                {mostrarDetalleMovimientos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {mostrarDetalleMovimientos && (
                <div className="mt-3 max-h-56 overflow-y-auto border border-slate-200 rounded-xl overflow-x-auto bg-white">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Fecha</th>
                        <th className="px-3 py-2">Tipo</th>
                        <th className="px-3 py-2">Categoría</th>
                        <th className="px-3 py-2">Concepto</th>
                        <th className="px-3 py-2 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transaccionesCorte.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-4 text-center text-slate-400 italic">
                            No hay movimientos en este rango de fechas.
                          </td>
                        </tr>
                      ) : (
                        transaccionesCorte.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2 whitespace-nowrap font-medium text-slate-600">
                              {t.fecha.split('-').reverse().join('/')}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                t.tipo_operacion === 'Entrada' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                              }`}>
                                {t.tipo_operacion}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{t.categoria}</td>
                            <td className="px-3 py-2 text-slate-600 max-w-xs truncate">{t.concepto}</td>
                            <td className={`px-3 py-2 text-right font-bold whitespace-nowrap ${
                              t.tipo_operacion === 'Entrada' ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {formatCurrency(Number(t.valor))}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors text-sm"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleDescargar}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg shadow-emerald-700/25 transition-all text-sm active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Reporte Excel ({transaccionesCorte.length} movs)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
