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
  Edit2
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { Caja, CajaTransaccion } from '../types';

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
  
  const currentYearStr = new Date().getFullYear().toString();
  const defaultMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const defaultMonthLabel = MESES[new Date().getMonth()].value;

  const [filtroMes, setFiltroMes] = useState<string>(defaultMonthLabel);
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
    return transacciones.filter(t => t.caja_id === activeCajaId && t.mes === filtroMes && t.ano === filtroAno)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [transacciones, activeCajaId, filtroMes, filtroAno]);

  const totalesAnuales = useMemo(() => {
    const transAno = transacciones.filter(t => t.caja_id === activeCajaId && t.ano === filtroAno);
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

  let saldoCorriente = 0;
  const transaccionesConSaldo = transaccionesActivas.slice().reverse().map(t => {
    if (t.tipo_operacion === 'Entrada') {
      saldoCorriente += Number(t.valor);
    } else {
      saldoCorriente -= Number(t.valor);
    }
    return { ...t, saldo_momento: saldoCorriente };
  }).reverse();

  const transaccionesTabla = useMemo(() => {
    return transaccionesConSaldo.filter(t => {
      const matchTercero = filtroTablaTercero ? (t.tercero || '').toLowerCase().includes(filtroTablaTercero.toLowerCase()) : true;
      const matchConcepto = filtroTablaConcepto ? t.concepto.toLowerCase().includes(filtroTablaConcepto.toLowerCase()) : true;
      const matchFecha = filtroTablaFecha ? t.fecha === filtroTablaFecha : true;
      return matchTercero && matchConcepto && matchFecha;
    });
  }, [transaccionesConSaldo, filtroTablaTercero, filtroTablaConcepto, filtroTablaFecha]);

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
      id: generateId(),
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

  const generateExcel = () => {
    if (!activeCaja) return;
    
    const wb = XLSX.utils.book_new();

    const titleStyle = { font: { bold: true, sz: 14 } };
    const subtitleStyle = { font: { bold: true, sz: 12 } };
    
    const headerBlueStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "002060" } }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
    
    const headerLightBlueStyle = { font: { bold: true, color: { rgb: "000000" } }, fill: { fgColor: { rgb: "9BC2E6" } }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
    
    const moneyStyle = { numFmt: '"$"#,##0.00' };
    const moneyBoldStyle = { numFmt: '"$"#,##0.00', font: { bold: true } };
    const greenTotalStyle = { numFmt: '"$"#,##0.00', font: { bold: true }, fill: { fgColor: { rgb: "00B050" } } };
    
    const noteStyle = { font: { italic: true }, fill: { fgColor: { rgb: "FFFF00" } } };

    const institutionName = "INSTITUCIÓN EDUCATIVA ALVERNIA";

    const transaccionesDelAno = transacciones
      .filter(t => t.caja_id === activeCajaId && t.ano === filtroAno)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    const mesesOrder = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    // ---------------------------------------------------------
    // HOJA 1: INGRESOS MENSUALES
    // ---------------------------------------------------------
    const wsIngresosData: any[][] = [
      [{ v: institutionName, s: titleStyle }],
      [{ v: "REPORTE DE INGRESOS MENSUALES", s: subtitleStyle }],
      [],
      [],
      [{ v: `AÑO: ${filtroAno}`, s: headerLightBlueStyle }],
      [],
      [],
      [{ v: "Concepto", s: headerBlueStyle }] 
    ];
    
    const mesesConIngresos = Array.from(new Set(transaccionesDelAno.filter(t => t.tipo_operacion === 'Entrada').map(t => t.mes))).sort((a,b) => mesesOrder.indexOf(a) - mesesOrder.indexOf(b));
    
    mesesConIngresos.forEach(m => wsIngresosData[7].push({ v: m.slice(0,3).toLowerCase(), s: headerBlueStyle }));
    wsIngresosData[7].push({ v: "Total INGRESOS", s: headerBlueStyle });

    const catsIngreso = Array.from(new Set(transaccionesDelAno.filter(t => t.tipo_operacion === 'Entrada').map(t => t.categoria)));
    
    wsIngresosData.push([{ v: "- INGRESOS", s: headerLightBlueStyle }]); 
    
    let totalGeneralIngresos = 0;
    const totalesPorMesIng = Object.fromEntries(mesesConIngresos.map(m => [m, 0]));

    catsIngreso.forEach(cat => {
      const row: any[] = [{ v: `    ${cat}`, s: {} }];
      let totalCat = 0;
      mesesConIngresos.forEach(m => {
        const sum = transaccionesDelAno.filter(t => t.tipo_operacion === 'Entrada' && t.categoria === cat && t.mes === m).reduce((acc, curr) => acc + Number(curr.valor), 0);
        row.push({ v: sum || '-', s: moneyStyle });
        totalCat += sum;
        totalesPorMesIng[m] += sum;
      });
      row.push({ v: totalCat, s: moneyStyle });
      totalGeneralIngresos += totalCat;
      wsIngresosData.push(row);
    });

    const totalRowIng = [{ v: "Total INGRESOS", s: { font: { bold: true } } }];
    mesesConIngresos.forEach(m => {
      totalRowIng.push({ v: totalesPorMesIng[m], s: moneyBoldStyle });
    });
    totalRowIng.push({ v: totalGeneralIngresos, s: moneyBoldStyle });
    wsIngresosData.push(totalRowIng);

    const wsIngresos = XLSX.utils.aoa_to_sheet(wsIngresosData);
    wsIngresos['!cols'] = [{ wch: 35 }, ...mesesConIngresos.map(() => ({ wch: 15 })), { wch: 20 }];
    wsIngresos['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } }, 
      { s: { r: 8, c: 0 }, e: { r: 8, c: mesesConIngresos.length + 1 } }, 
    ];
    XLSX.utils.book_append_sheet(wb, wsIngresos, "Ingresos Mensuales");

    // ---------------------------------------------------------
    // HOJA 2: GASTOS MENSUALES
    // ---------------------------------------------------------
    const wsGastosData: any[][] = [
      [{ v: institutionName, s: titleStyle }],
      [{ v: "REPORTE DE GASTOS MENSUALES", s: subtitleStyle }],
      [],
      [],
      [{ v: `AÑO: ${filtroAno}`, s: headerLightBlueStyle }],
      [],
      [],
      [{ v: "Concepto", s: headerBlueStyle }] 
    ];
    
    const mesesConGastos = Array.from(new Set(transaccionesDelAno.filter(t => t.tipo_operacion === 'Salida').map(t => t.mes))).sort((a,b) => mesesOrder.indexOf(a) - mesesOrder.indexOf(b));
    
    mesesConGastos.forEach(m => wsGastosData[7].push({ v: m.slice(0,3).toLowerCase(), s: headerBlueStyle }));
    wsGastosData[7].push({ v: "Total GASTOS", s: headerBlueStyle });

    const catsGasto = Array.from(new Set(transaccionesDelAno.filter(t => t.tipo_operacion === 'Salida').map(t => t.categoria)));
    
    wsGastosData.push([{ v: "- GASTOS", s: headerLightBlueStyle }]); 
    
    let totalGeneralGastos = 0;
    const totalesPorMesGas = Object.fromEntries(mesesConGastos.map(m => [m, 0]));

    catsGasto.forEach(cat => {
      const row: any[] = [{ v: `    ${cat}`, s: {} }];
      let totalCat = 0;
      mesesConGastos.forEach(m => {
        const sum = transaccionesDelAno.filter(t => t.tipo_operacion === 'Salida' && t.categoria === cat && t.mes === m).reduce((acc, curr) => acc + Number(curr.valor), 0);
        row.push({ v: sum || '-', s: moneyStyle });
        totalCat += sum;
        totalesPorMesGas[m] += sum;
      });
      row.push({ v: totalCat, s: moneyStyle });
      totalGeneralGastos += totalCat;
      wsGastosData.push(row);
    });

    const totalRowGas = [{ v: "Total GASTOS", s: { font: { bold: true } } }];
    mesesConGastos.forEach(m => {
      totalRowGas.push({ v: totalesPorMesGas[m], s: moneyBoldStyle });
    });
    totalRowGas.push({ v: totalGeneralGastos, s: moneyBoldStyle });
    wsGastosData.push(totalRowGas);

    const wsGastos = XLSX.utils.aoa_to_sheet(wsGastosData);
    wsGastos['!cols'] = [{ wch: 35 }, ...mesesConGastos.map(() => ({ wch: 15 })), { wch: 20 }];
    wsGastos['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } }, 
      { s: { r: 8, c: 0 }, e: { r: 8, c: mesesConGastos.length + 1 } }, 
    ];
    XLSX.utils.book_append_sheet(wb, wsGastos, "Gastos Mensuales");

    // ---------------------------------------------------------
    // HOJA 3: DETALLADO POR MES ADICIONALES
    // ---------------------------------------------------------
    const wsDetalladoData: any[][] = [
      [{ v: institutionName, s: titleStyle }],
      [{ v: "REPORTE DE INGRESOS Y GASTOS DETALLADO POR MES ADICIONALES", s: subtitleStyle }],
      [],
      [{ v: `AÑO: (Todas)`, s: headerLightBlueStyle }],
      [{ v: `Fecha: (Todas)`, s: headerLightBlueStyle }],
      [{ v: "nota: estos datos se borrarán y se actualizarán automáticamente al ingresar su información", s: noteStyle }],
      [
        { v: "DESCRIPCIÓN DE GASTOS REALIZADOS DURANTE EL MES", s: headerBlueStyle },
        { v: "Entrada", s: headerBlueStyle },
        { v: "SALIDAS", s: headerBlueStyle },
        { v: "Saldo", s: headerBlueStyle }
      ]
    ];

    wsDetalladoData.push([
      { v: "-INGRESOS", s: headerLightBlueStyle },
      { v: totalGeneralIngresos, s: { ...moneyBoldStyle, fill: { fgColor: { rgb: "9BC2E6" } } } },
      { v: '-', s: { ...moneyBoldStyle, fill: { fgColor: { rgb: "9BC2E6" } } } },
      { v: totalGeneralIngresos, s: { ...moneyBoldStyle, fill: { fgColor: { rgb: "9BC2E6" } } } }
    ]);

    catsIngreso.forEach(cat => {
      const transCat = transaccionesDelAno.filter(t => t.tipo_operacion === 'Entrada' && t.categoria === cat);
      const catTotal = transCat.reduce((acc, curr) => acc + Number(curr.valor), 0);
      
      wsDetalladoData.push([
        { v: `  - ${cat}`, s: { font: { bold: true } } },
        { v: catTotal, s: moneyBoldStyle },
        { v: '-', s: moneyBoldStyle },
        { v: catTotal, s: moneyBoldStyle }
      ]);
      
      transCat.forEach(t => {
        const val = Number(t.valor);
        wsDetalladoData.push([
          { v: `    ${t.concepto}${t.tercero ? ` (Por: ${t.tercero})` : ''}, ${t.fecha.split('-').reverse().join('/')}`, s: {} },
          { v: val, s: moneyStyle },
          { v: '-', s: moneyStyle },
          { v: val, s: moneyStyle }
        ]);
      });
    });

    wsDetalladoData.push([
      { v: "-GASTOS", s: headerLightBlueStyle },
      { v: '-', s: { ...moneyBoldStyle, fill: { fgColor: { rgb: "9BC2E6" } } } },
      { v: totalGeneralGastos, s: { ...moneyBoldStyle, fill: { fgColor: { rgb: "9BC2E6" } } } },
      { v: -totalGeneralGastos, s: { ...moneyBoldStyle, fill: { fgColor: { rgb: "9BC2E6" } } } } 
    ]);

    catsGasto.forEach(cat => {
      const transCat = transaccionesDelAno.filter(t => t.tipo_operacion === 'Salida' && t.categoria === cat);
      const catTotal = transCat.reduce((acc, curr) => acc + Number(curr.valor), 0);
      
      wsDetalladoData.push([
        { v: `  - ${cat}`, s: { font: { bold: true } } },
        { v: '-', s: moneyBoldStyle },
        { v: catTotal, s: moneyBoldStyle },
        { v: -catTotal, s: moneyBoldStyle }
      ]);
      
      transCat.forEach(t => {
        const val = Number(t.valor);
        wsDetalladoData.push([
          { v: `    ${t.concepto}${t.tercero ? ` (Por: ${t.tercero})` : ''}, ${t.fecha.split('-').reverse().join('/')}`, s: {} },
          { v: '-', s: moneyStyle },
          { v: val, s: moneyStyle },
          { v: -val, s: moneyStyle }
        ]);
      });
    });

    const saldoTotalGeneral = totalGeneralIngresos - totalGeneralGastos;
    wsDetalladoData.push([
      { v: "        Total general", s: { font: { bold: true } } },
      { v: totalGeneralIngresos, s: moneyBoldStyle },
      { v: totalGeneralGastos, s: moneyBoldStyle },
      { v: saldoTotalGeneral, s: greenTotalStyle }
    ]);

    const wsDetallado = XLSX.utils.aoa_to_sheet(wsDetalladoData);
    wsDetallado['!cols'] = [{ wch: 80 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    wsDetallado['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } }, 
      { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } }, 
      { s: { r: 5, c: 0 }, e: { r: 5, c: 3 } }, 
    ];
    XLSX.utils.book_append_sheet(wb, wsDetallado, "Detallado por Mes");

    XLSX.writeFile(wb, `Reportes_${activeCaja.nombre}_${filtroAno}.xlsx`);
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
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Ingresos del Mes ({filtroMes})</p>
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
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Gastos del Mes ({filtroMes})</p>
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
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Saldo Disponible ({filtroMes})</p>
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
                <div className="flex items-center gap-3 text-xs md:text-sm font-semibold mt-1">
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Ingresos del Año: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalesAnuales.ingresos)}</span>
                  <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">Gastos del Año: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalesAnuales.gastos)}</span>
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
                onClick={() => setShowMovimientoModal(true)}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 text-sm font-bold shadow-md shadow-emerald-950/20 transition-all w-full md:w-auto"
              >
                <Plus className="w-5 h-5" />
                Registrar Movimiento
              </button>
              <div className="flex gap-2 flex-wrap justify-center">
                <button
                  onClick={generateExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 text-sm font-bold shadow-md transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4" />
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
                <h3 className="font-bold text-slate-800 whitespace-nowrap">Libro Mayor - {filtroMes} {filtroAno}</h3>
                
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                  <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2">
                    <select
                      value={filtroMes}
                      onChange={(e) => setFiltroMes(e.target.value)}
                      className="bg-transparent border-none text-sm font-bold text-slate-700 py-2 pl-1 pr-2 focus:ring-0 cursor-pointer outline-none"
                    >
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
                  <input
                    type="date"
                    value={filtroTablaFecha}
                    onChange={(e) => setFiltroTablaFecha(e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Filtrar por Concepto..."
                    value={filtroTablaConcepto}
                    onChange={(e) => setFiltroTablaConcepto(e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 w-full md:w-48"
                  />
                  <input
                    type="text"
                    placeholder="Filtrar por Tercero..."
                    value={filtroTablaTercero}
                    onChange={(e) => setFiltroTablaTercero(e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 w-full md:w-48"
                  />
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
                          <button
                            onClick={() => handleEliminar(t.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {transaccionesConSaldo.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p>No hay transacciones registradas en este mes.</p>
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

      {showMovimientoModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowMovimientoModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Plus className="w-6 h-6 text-emerald-600" />
              Registrar Movimiento
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
                REGISTRAR {tipoOp.toUpperCase()}
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
