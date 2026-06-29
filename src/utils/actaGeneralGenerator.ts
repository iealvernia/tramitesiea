import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, convertInchesToTwip, convertMillimetersToTwip, Header, Footer, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, VerticalAlign, UnderlineType } from 'docx';
import { DocenteEvaluacion } from '../types';

export interface CronogramaRow {
  etapa: string;
  fecha: string;
  actividad: string;
  producto: string;
  responsable: string;
}

export interface ActaGeneralParams {
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
  docentes: DocenteEvaluacion[];
}

export const generarActaGeneralWord = async (params: ActaGeneralParams): Promise<Blob> => {
  // 1. Fetch logo image buffer
  let logoBuffer: ArrayBuffer | undefined;
  try {
    const response = await fetch('/logo.png');
    if (response.ok) {
      logoBuffer = await response.arrayBuffer();
    }
  } catch (error) {
    console.warn("Could not load logo for word document", error);
  }

  // Read config from localStorage
  const institutionName = localStorage.getItem('alvernia_institution_name') || 'INSTITUCIÓN EDUCATIVA ALVERNIA';
  const educationalLevel = localStorage.getItem('alvernia_educational_level') || 'NIVEL PREESCOLAR - BÁSICA PRIMARIA Y MEDIA ACADÉMICA';
  const calendario = localStorage.getItem('alvernia_calendario') || 'A';
  const dane = localStorage.getItem('alvernia_institution_dane') || '188688000687';
  const nit = localStorage.getItem('alvernia_institution_nit') || '891201897-6';
  const calDaneNit = `CALENDARIO ${calendario} – CÓDIGO DANE ${dane} – NIT. ${nit}`;

  const footerMotto = localStorage.getItem('alvernia_footer_motto') || '«Brindamos una educación humanística y académica para la excelencia de un ser humano integral»';
  const addr = localStorage.getItem('alvernia_footer_address') || 'Barrio San Martin Carrera 16 No. 12 – 77';
  const emails = localStorage.getItem('alvernia_footer_emails') || 'alvernia@sedputumayo.gov.co – rectoralvernia@gmail.com';
  const website = localStorage.getItem('alvernia_footer_website') || 'www.ie-alvernia.edu.co';
  const footerLine2 = `${addr} | ${emails} – ${website}`;
  const footerCity = localStorage.getItem('alvernia_footer_city') || 'Puerto Asís - Putumayo';
  
  const rectorName = localStorage.getItem('iea_rector_name') || 'ESP. CARLOS ARCESIO ACOSTA CORONEL';
  const rectorCargo = localStorage.getItem('iea_rector_cargo') || 'RECTOR';

  // Constants for perfectly centered 1cm margin document (11106 DXA printable width)
  const TABLE_WIDTH = 11106;

  // Helper for shaded table header cells
  const createHeaderCell = (text: string, colSpan: number = 1) => {
    return new TableCell({
      columnSpan: colSpan,
      shading: { fill: "EEEEEE", type: ShadingType.CLEAR, color: "auto" },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text, bold: true, size: 22, font: "Arial" })]
        })
      ]
    });
  };

  const createCell = (text: string, bold: boolean = false, colSpan: number = 1) => {
    return new TableCell({
      columnSpan: colSpan,
      margins: { top: 0, bottom: 0, left: 60, right: 60 },
      children: [
        new Paragraph({
          children: [new TextRun({ text, bold, size: 22, font: "Arial" })]
        })
      ]
    });
  };

  // 1. Datos Generales Table
  const tableDatosGenerales = new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: [2776, 2777, 2776, 2777],
    rows: [
      new TableRow({ children: [createHeaderCell("DATOS GENERALES DE LA CONVOCATORIA", 4)] }),
      new TableRow({
        children: [
          createCell("Lugar de Reunión:", true),
          createCell(params.lugar, false, 3)
        ]
      }),
      new TableRow({
        children: [
          createCell("Fecha:", true),
          createCell(params.fecha),
          createCell("Hora de Inicio:", true),
          createCell(params.hora)
        ]
      }),
      new TableRow({
        children: [
          createCell("Participantes:", true),
          createCell("Todo el personal docente (Decreto 1278) adscrito a la institución", false, 3)
        ]
      }),
      new TableRow({
        children: [
          createCell("Evaluador / Facilitador:", true),
          createCell(`${rectorName} (CARGO: ${rectorCargo})`, false, 3)
        ]
      })
    ]
  });

  // 2. Info Adicional Table
  const infoLines = params.cuadroInfo.split('\n').filter(l => l.trim() !== '');
  const infoRows = infoLines.map(line => {
    const parts = line.replace(/\r/g, '').split(':');
    const key = parts[0]?.trim() || '';
    const value = parts.slice(1).join(':').trim() || '';
    return new TableRow({
      children: [createCell(key + ':', true), createCell(value)]
    });
  });

  const tableInfoAdicional = new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: [4442, 6664],
    rows: [
      new TableRow({ children: [createHeaderCell("INFORMACIÓN ADICIONAL DE CONTEXTUALIZACIÓN", 2)] }),
      ...infoRows
    ]
  });

  // 3. Orden del Dia
  const ordenItems = params.ordenDia.split('\n').filter(l => l.trim() !== '');
  
  const tableOrdenDia = new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: [TABLE_WIDTH],
    rows: [
      new TableRow({ children: [createHeaderCell("ORDEN DEL DÍA ESTABLECIDO")] }),
      new TableRow({
        children: [
          new TableCell({
            margins: { top: 0, bottom: 0, left: 100, right: 100 },
            children: ordenItems.map(item => new Paragraph({
              children: [new TextRun({ text: item.replace(/\r/g, '').trim(), size: 22, font: "Arial" })],
              spacing: { before: 0, after: 0 }
            }))
          })
        ]
      })
    ]
  });

  // 4. Desarrollo de la reunion
  const desarrolloLines = params.desarrollo.split('\n\n').filter(l => l.trim() !== '');
  const tableDesarrollo = new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: [TABLE_WIDTH],
    rows: [
      new TableRow({ children: [createHeaderCell("DESARROLLO DE LA REUNIÓN Y ACUERDOS")] }),
      new TableRow({
        children: [
          new TableCell({
            margins: { top: 0, bottom: 0, left: 60, right: 60 },
            children: desarrolloLines.map(line => new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              children: [new TextRun({ text: line.replace(/\r/g, '').trim(), size: 22, font: "Arial" })],
              spacing: { before: 0, after: 0 }
            }))
          })
        ]
      })
    ]
  });

  // 5. Cronograma Table
  const cronogramaHeader = new TableRow({
    children: ["ETAPAS", "FECHA", "ACTIVIDAD", "PRODUCTO", "RESPONSABLE"].map(text => 
      new TableCell({
        shading: { fill: "EEEEEE", type: ShadingType.CLEAR, color: "auto" },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 22, font: "Arial" })] })]
      })
    )
  });

  const tableCronograma = new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: [1666, 2221, 3887, 1666, 1666],
    rows: [
      cronogramaHeader,
      ...params.cronograma.map(row => 
        new TableRow({
          children: [row.etapa, row.fecha, row.actividad, row.producto, row.responsable].map(text => {
            const paragraphs = text.replace(/\r/g, '').split('\n').map(line => new Paragraph({
              children: [new TextRun({ text: line, size: 22, font: "Arial" })],
              spacing: { before: 0, after: 0 }
            }));
            return new TableCell({
              margins: { top: 0, bottom: 0, left: 40, right: 40 },
              children: paragraphs
            });
          })
        })
      )
    ]
  });

  const sigColWidths = [450, 4200, 1400, 2100, 2956];

  const signatureHeader = new TableRow({
    children: ["No.", "Nombre Completo", "Cédula", "Sede", "Firma"].map((text, i) => 
      new TableCell({
        width: { size: sigColWidths[i], type: WidthType.DXA },
        shading: { fill: "EEEEEE", type: ShadingType.CLEAR, color: "auto" },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 20, font: "Arial" })] })]
      })
    )
  });

  const signatureRows = params.docentes.map((doc, index) => 
    new TableRow({
      children: [
        new TableCell({ width: { size: sigColWidths[0], type: WidthType.DXA }, margins: { top: 0, bottom: 0 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (index + 1).toString(), size: 20, font: "Arial" })] })] }),
        new TableCell({ width: { size: sigColWidths[1], type: WidthType.DXA }, margins: { top: 0, bottom: 0, left: 60, right: 60 }, children: [new Paragraph({ children: [new TextRun({ text: doc.nombre.toUpperCase(), size: 20, bold: true, font: "Arial" })] })] }),
        new TableCell({ width: { size: sigColWidths[2], type: WidthType.DXA }, margins: { top: 0, bottom: 0 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: doc.cedula, size: 20, font: "Arial" })] })] }),
        new TableCell({ width: { size: sigColWidths[3], type: WidthType.DXA }, margins: { top: 0, bottom: 0, left: 60, right: 60 }, children: [new Paragraph({ children: [new TextRun({ text: doc.sedeTrabajo || 'IE ALVERNIA', size: 20, font: "Arial" })] })] }),
        new TableCell({ width: { size: sigColWidths[4], type: WidthType.DXA }, children: [new Paragraph({ text: "" })] }),
      ]
    })
  );

  const tableSignatures = new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: [500, 3600, 1300, 1700, 4006],
    rows: [signatureHeader, ...signatureRows]
  });

  // Re-use header
  const headerTable = new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: [1650, 7806, 1650],
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "auto" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
      left: { style: BorderStyle.NONE, size: 0, color: "auto" },
      right: { style: BorderStyle.NONE, size: 0, color: "auto" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 1650, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "auto" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
              left: { style: BorderStyle.NONE, size: 0, color: "auto" },
              right: { style: BorderStyle.NONE, size: 0, color: "auto" },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: logoBuffer ? [
                  new ImageRun({
                    data: logoBuffer as any,
                    transformation: { width: 75, height: 85 }, // Not elongated
                    type: "png"
                  } as any)
                ] : []
              })
            ]
          }),
          new TableCell({
            width: { size: 7806, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "auto" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
              left: { style: BorderStyle.NONE, size: 0, color: "auto" },
              right: { style: BorderStyle.NONE, size: 0, color: "auto" },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({ text: institutionName.toUpperCase(), bold: true, size: 20, font: "Arial", color: "71A975" })
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({ text: educationalLevel.toUpperCase(), bold: true, size: 16, font: "Arial", color: "71A975" })
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({ text: calDaneNit.toUpperCase(), bold: true, size: 16, font: "Arial", color: "888888" })
                ],
              })
            ]
          }),
          new TableCell({
            width: { size: 1650, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "auto" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
              left: { style: BorderStyle.NONE, size: 0, color: "auto" },
              right: { style: BorderStyle.NONE, size: 0, color: "auto" },
            },
            children: [new Paragraph({ text: "", spacing: { before: 0, after: 0 } })]
          })
        ]
      })
    ]
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Arial",
            size: 22,
          },
          paragraph: {
            spacing: { before: 0, after: 0, line: 240 } // Remove default paragraph spacing
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertInchesToTwip(8.5),
              height: convertInchesToTwip(11),
            },
            margin: {
              top: convertMillimetersToTwip(10), // 1cm top margin
              bottom: convertMillimetersToTwip(10), // 1cm bottom margin
              left: convertMillimetersToTwip(10), // 1cm left margin
              right: convertMillimetersToTwip(10), // 1cm right margin
              header: convertMillimetersToTwip(10), // 1cm header margin
              footer: convertMillimetersToTwip(10), // 1cm footer margin
            },
          },
        },
        headers: {
          default: new Header({
            children: [headerTable]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: footerMotto,
                    color: "71A975",
                    italics: true,
                    bold: true,
                    size: 16,
                    font: "Arial"
                  })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({ text: footerLine2, color: "888888", size: 16, font: "Arial" })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({ text: footerCity, color: "888888", size: 16, font: "Arial" })
                ]
              })
            ]
          })
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 0 },
            children: [
              new TextRun({ text: `ACTA GENERAL DE CONCERTACIÓN DE COMPROMISOS LABORALES NO. ${params.numero}`, bold: true, size: 24, font: "Arial" })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 200 },
            children: [
              new TextRun({ text: `VIGENCIA DE EVALUACIÓN DE DESEMPEÑO - AÑO ESCOLAR ${params.anio}`, bold: true, size: 22, font: "Arial" })
            ]
          }),
          tableDatosGenerales,
          new Paragraph({ text: "", spacing: { before: 0, after: 0 } }),
          tableInfoAdicional,
          new Paragraph({ text: "", spacing: { before: 0, after: 0 } }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 0, after: 0 },
            children: [
              new TextRun({ text: "OBJETIVO DE LA REUNIÓN: ", bold: true, size: 22, font: "Arial" }),
              new TextRun({ text: params.objetivo.replace(/\r/g, ''), size: 22, font: "Arial" })
            ]
          }),
          new Paragraph({ text: "", spacing: { before: 0, after: 0 } }),
          tableOrdenDia,
          new Paragraph({ text: "", spacing: { before: 0, after: 0 } }),
          tableDesarrollo,
          new Paragraph({ text: "", spacing: { before: 0, after: 0 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 },
            children: [
              new TextRun({ text: "CRONOGRAMA:", bold: true, size: 22, font: "Arial", underline: { type: UnderlineType.SINGLE, color: "auto" } })
            ]
          }),
          tableCronograma,
          new Paragraph({ text: "", spacing: { before: 0, after: 0 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 },
            children: [
              new TextRun({ text: "REGISTRO DE FIRMAS DE CONCERTACIÓN COLECTIVA (PERSONAL DOCENTE 1278)", bold: true, size: 22, font: "Arial" })
            ]
          }),
          new Paragraph({ text: "", spacing: { before: 0, after: 0 } }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 0, after: 0 },
            children: [
              new TextRun({ text: "En constancia de lo acordado y concertado unificadamente para la vigencia, firman a continuación los docentes de la institución:", size: 22, font: "Arial" })
            ]
          }),
          new Paragraph({ text: "", spacing: { before: 0, after: 0 } }),
          tableSignatures,
          new Paragraph({
            spacing: { before: 400, after: 0 },
            children: [
              new TextRun({ text: "____________________________________", size: 22, font: "Arial" })
            ]
          }),
          new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [
              new TextRun({ text: rectorName, bold: true, size: 22, font: "Arial" })
            ]
          }),
          new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [
              new TextRun({ text: `Evaluador Directivo / ${rectorCargo}`, size: 22, font: "Arial" })
            ]
          })
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
};
