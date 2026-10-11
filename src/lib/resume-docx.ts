import { BorderStyle, convertInchesToTwip, Document, ExternalHyperlink, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'

import type { ResumeDocument, ResumeLink } from '@/lib/resume'

/**
 * The résumé as a Word file, for recruiters who edit or resubmit it. Same
 * content and order as the PDF (see resume-pdf.tsx): one column, Word's own
 * Title and Heading styles so tracking systems find the sections, and contact
 * details in the body. Colors repeat the globals.css tokens by name.
 */
const INK = '171e24' // --foreground
const MUTED = '52595e' // --muted-foreground
const HEADING = '0b4163' // --heading
const RULE = 'dbdee2' // --border
const LINK = HEADING

const FONT = 'Arial'

/** Word sizes are half-points. */
const pt = (points: number) => points * 2

/**
 * A run of text with its font and size set on the run itself. The document
 * defaults say the same, and Word honors them, but some readers (macOS Quick
 * Look and TextEdit) skip defaults and fall back to Times.
 */
const run = (text: string, { size = 10, ...options }: { bold?: boolean; color?: string; size?: number; style?: string } = {}) =>
  new TextRun({ font: FONT, color: INK, ...options, size: pt(size), text })

/** Headings take their size and color from Word's Title and Heading styles, so tracking systems recognize them. */
const headingRun = (text: string) => new TextRun({ font: FONT, text })

const linked = (item: ResumeLink, size?: number) =>
  item.href ? new ExternalHyperlink({ link: item.href, children: [run(item.text, { style: 'Hyperlink', color: LINK, size })] }) : run(item.text, { size })

const bullet = (text: string) => new Paragraph({ children: [run(text)], bullet: { level: 0 }, spacing: { after: 40 } })

export async function resumeDocx(doc: ResumeDocument) {
  const children: Paragraph[] = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [headingRun(doc.name)] }),
    ...(doc.title ? [new Paragraph({ children: [run(doc.title, { size: 12 })], spacing: { after: 60 } })] : []),
    new Paragraph({
      children: doc.contact.flatMap((item, i) => [...(i > 0 ? [run('  ·  ', { color: MUTED, size: 9.5 })] : []), linked(item, 9.5)]),
      spacing: { after: 200 },
    }),
    ...(doc.summary ? [new Paragraph({ children: [run(doc.summary)] })] : []),
  ]

  for (const section of doc.sections) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [headingRun(section.heading)] }))
    for (const group of section.groups) {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun(group.organization)] }))
      for (const role of group.roles) {
        children.push(
          new Paragraph({ children: [run(role.role, { bold: true })], spacing: { before: 80 }, keepNext: true }),
          new Paragraph({ children: [run(role.meta, { color: MUTED, size: 9.5 })], spacing: { after: 40 }, keepNext: true }),
          ...role.highlights.map(bullet),
          ...role.caseStudies.map((cs) => new Paragraph({ children: [linked(cs, 9.5)], spacing: { before: 40 } })),
        )
      }
    }
  }

  if (doc.skills.length) {
    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [headingRun(doc.skillsHeading)] }),
      ...doc.skills.map((group) => new Paragraph({ children: [run(`${group.heading}: `, { bold: true }), run(group.skills)], spacing: { after: 60 } })),
    )
  }

  if (doc.education.length) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [headingRun(doc.educationHeading)] }), ...doc.education.map(bullet))
  }

  const document = new Document({
    creator: doc.name,
    title: doc.fileTitle,
    styles: {
      default: { document: { run: { font: FONT, size: pt(10), color: INK }, paragraph: { spacing: { line: 276 } } } },
      paragraphStyles: [
        { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', run: { size: pt(22), bold: true, color: HEADING }, paragraph: { spacing: { after: 60 } } },
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: pt(12), bold: true, color: HEADING },
          paragraph: {
            spacing: { before: 320, after: 80 },
            keepNext: true,
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RULE, space: 2 } },
          },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: pt(11), bold: true, color: INK },
          paragraph: { spacing: { before: 160, after: 0 }, keepNext: true },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
            margin: { top: convertInchesToTwip(0.65), bottom: convertInchesToTwip(0.65), left: convertInchesToTwip(0.75), right: convertInchesToTwip(0.75) },
          },
        },
        children,
      },
    ],
  })

  return Packer.toBuffer(document)
}
