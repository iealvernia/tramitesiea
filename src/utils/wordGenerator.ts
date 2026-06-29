import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, convertInchesToTwip, convertMillimetersToTwip, Header, Footer, Table, TableRow, TableCell, WidthType, BorderStyle, VerticalAlign } from 'docx';
import { ConsecutivoOficio } from '../types';

export const generarOficioWord = async (oficio: ConsecutivoOficio): Promise<Blob> => {
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

  // 2. Format Date
  const date = oficio.fecha_creacion ? new Date(oficio.fecha_creacion) : new Date();
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const dateString = `Puerto Asís, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;

  // 3. Document Number
  const docNumber = `NRO.: ${oficio.prefijo || 'REC'}-${oficio.numero_consecutivo.toString().padStart(3, '0')}-${oficio.ano}`;

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

  // Constants for 1.5cm margin document (10540 DXA printable width)
  const TABLE_WIDTH = 10540;

  // 4. Header elements (Logo on left, text on right)
  const headerTable = new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: [1650, 7240, 1650],
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
                children: logoBuffer ? [
                  new ImageRun({
                    data: logoBuffer as any,
                    transformation: { width: 75, height: 85 },
                    type: "png"
                  } as any)
                ] : []
              })
            ]
          }),
          new TableCell({
            width: { size: 7240, type: WidthType.DXA },
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
                spacing: { after: 0 },
                children: [
                  new TextRun({ text: institutionName.toUpperCase(), bold: true, size: 20, font: "Arial", color: "71A975" })
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0 },
                children: [
                  new TextRun({ text: educationalLevel.toUpperCase(), bold: true, size: 16, font: "Arial", color: "71A975" })
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0 },
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
            children: [new Paragraph({ text: "" })]
          })
        ]
      })
    ]
  });

  const headerContent = [headerTable];

  // 5. Body paragraphs
  const paragraphs: Paragraph[] = [];
  
  // Date & Number
  paragraphs.push(new Paragraph({ text: "" }));
  paragraphs.push(new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: docNumber })]
  }));
  paragraphs.push(new Paragraph({ children: [new TextRun({ text: dateString })] }));
  paragraphs.push(new Paragraph({ text: "" }));
  paragraphs.push(new Paragraph({ text: "" }));

  // Recipient block
  paragraphs.push(new Paragraph({ 
    spacing: { after: 0 },
    children: [new TextRun({ text: (oficio.destinatario_cargo || "Doctor(a):").replace(/\r/g, '') })] 
  }));
  if (oficio.destinatario_nombre) {
    paragraphs.push(new Paragraph({ 
      spacing: { after: 0 },
      children: [new TextRun({ text: oficio.destinatario_nombre.replace(/\r/g, ''), bold: true })] 
    }));
  }
  if (oficio.destinatario_entidad) {
    paragraphs.push(new Paragraph({ 
      spacing: { after: 0 },
      children: [new TextRun({ text: oficio.destinatario_entidad.replace(/\r/g, '') })] 
    }));
  }
  if (oficio.destinatario_lugar) {
    paragraphs.push(new Paragraph({ 
      spacing: { after: 0 },
      children: [new TextRun({ text: oficio.destinatario_lugar.replace(/\r/g, '') })] 
    }));
  }
  paragraphs.push(new Paragraph({ text: "" }));
  paragraphs.push(new Paragraph({ text: "" }));

  // Reference
  if (oficio.asunto) {
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: `Ref. ${oficio.asunto.replace(/\r/g, '').trim()}` })] }));
    paragraphs.push(new Paragraph({ text: "" }));
  }

  // Greeting
  paragraphs.push(new Paragraph({ children: [new TextRun({ text: "Atento saludo." })] }));
  paragraphs.push(new Paragraph({ text: "" }));
  paragraphs.push(new Paragraph({ text: "" }));

  // Body content (split by newlines)
  if (oficio.cuerpo_documento) {
    const lines = oficio.cuerpo_documento.split('\n');
    for (const line of lines) {
      if (line.trim() !== '') {
        paragraphs.push(new Paragraph({ 
          children: [new TextRun({ text: line.replace(/\r/g, '') })],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 0, after: 0 }
        }));
      }
    }
  }
  
  paragraphs.push(new Paragraph({ text: "" }));
  
  // Signoff
  paragraphs.push(new Paragraph({ children: [new TextRun({ text: (oficio.despedida || "Atentamente,").replace(/\r/g, '') })] }));
  paragraphs.push(new Paragraph({ text: "" }));
  paragraphs.push(new Paragraph({ text: "" }));
  paragraphs.push(new Paragraph({ text: "" }));
  paragraphs.push(new Paragraph({ text: "" }));

  // Signatures
  paragraphs.push(new Paragraph({ children: [new TextRun({ text: oficio.firma_nombre || "ESP. CARLOS ARCESIO ACOSTA CORONEL", bold: true })] }));
  paragraphs.push(new Paragraph({ children: [new TextRun({ text: oficio.firma_cargo || "Rectora I.E Alvernia" })] }));
  paragraphs.push(new Paragraph({ text: "" }));
  paragraphs.push(new Paragraph({ text: "" }));
  paragraphs.push(new Paragraph({ text: "" }));

  // Metadata
  if (oficio.elaborado_por) {
    paragraphs.push(new Paragraph({ 
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: `Elaborado por: ${oficio.elaborado_por}`, size: 16, italics: true, font: "Arial" })]
    }));
  }
  if (oficio.revisado_por) {
    paragraphs.push(new Paragraph({ 
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: `Revisado por: ${oficio.revisado_por}`, size: 16, italics: true, font: "Arial" })]
    }));
  }

  // 6. Footer elements
  const footerContent = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [
        new TextRun({ text: footerMotto, size: 16, font: "Arial", color: "71A975", italics: true, bold: true })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [
        new TextRun({ text: footerLine2, size: 16, font: "Arial", color: "888888" })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [
        new TextRun({ text: footerCity, size: 16, font: "Arial", color: "888888" })
      ]
    })
  ];

  // Assemble document
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Arial",
            size: 22, // 11pt = 22 half-points
            color: "000000"
          },
          paragraph: {
            spacing: { before: 0, after: 0, line: 240 }
          }
        },
      },
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
              top: convertMillimetersToTwip(10), // 1 cm
              right: convertMillimetersToTwip(15), // 1.5 cm
              bottom: convertMillimetersToTwip(10), // 1 cm
              left: convertMillimetersToTwip(15), // 1.5 cm
              header: convertMillimetersToTwip(10), // 1cm header margin
              footer: convertMillimetersToTwip(10), // 1cm footer margin
            },
          },
        },
        headers: {
          default: new Header({ children: headerContent })
        },
        footers: {
          default: new Footer({ children: footerContent })
        },
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBlob(doc);
};
