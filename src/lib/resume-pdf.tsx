import { Document, Font, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

import type { ResumeDocument, ResumeLink } from '@/lib/resume'

/**
 * The résumé as a PDF, built from the same content as /resume. Written for
 * applicant tracking systems as much as people: one column, standard
 * headings, real text in a standard font, and contact details in the body
 * rather than a page header.
 *
 * A PDF can't read the site's CSS variables, so the colors below repeat the
 * tokens in globals.css by name. Keep them in step.
 */
// Whole words only: a tracking system reads "man-" and "agement" as two words.
Font.registerHyphenationCallback((word) => [word])

const INK = '#171e24' // --foreground
const MUTED = '#52595e' // --muted-foreground, 7.12:1 on white
const HEADING = '#0b4163' // --heading, 10.77:1 on white
const RULE = '#dbdee2' // --border

const styles = StyleSheet.create({
  page: { paddingVertical: 46, paddingHorizontal: 54, fontFamily: 'Helvetica', fontSize: 10, lineHeight: 1.4, color: INK },
  name: { fontFamily: 'Helvetica-Bold', fontSize: 22, lineHeight: 1.1, color: HEADING },
  title: { fontSize: 12, marginTop: 5 },
  contact: { fontSize: 9.5, color: MUTED, marginTop: 5 },
  link: { color: HEADING, textDecoration: 'none' },
  summary: { marginTop: 12 },
  heading: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: HEADING,
    marginTop: 16,
    marginBottom: 2,
    paddingBottom: 3,
    borderBottomWidth: 0.75,
    borderBottomColor: RULE,
  },
  organization: { fontFamily: 'Helvetica-Bold', fontSize: 11, marginTop: 8 },
  role: { marginTop: 4 },
  roleTitle: { fontFamily: 'Helvetica-Bold' },
  meta: { fontSize: 9.5, color: MUTED },
  bullet: { flexDirection: 'row', marginTop: 2 },
  mark: { width: 10 },
  bulletText: { flex: 1 },
  caseStudy: { fontSize: 9.5, marginTop: 3 },
  skill: { marginTop: 4 },
  skillHeading: { fontFamily: 'Helvetica-Bold' },
})

const Linked = ({ item }: { item: ResumeLink }) =>
  item.href ? (
    <Link src={item.href} style={styles.link}>
      {item.text}
    </Link>
  ) : (
    <>{item.text}</>
  )

const Bullet = ({ children }: { children: string }) => (
  <View style={styles.bullet}>
    <Text style={styles.mark}>•</Text>
    <Text style={styles.bulletText}>{children}</Text>
  </View>
)

/** A section heading stays with at least a few lines of what follows it. */
const Heading = ({ children }: { children: string }) => (
  <Text style={styles.heading} minPresenceAhead={60}>
    {children}
  </Text>
)

export const resumePdf = (doc: ResumeDocument) => (
  <Document title={doc.fileTitle} author={doc.name} creator={doc.name} language="en-US">
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.name}>{doc.name}</Text>
      {doc.title && <Text style={styles.title}>{doc.title}</Text>}
      <Text style={styles.contact}>
        {doc.contact.map((item, i) => (
          <Text key={item.text}>
            {i > 0 && '  ·  '}
            <Linked item={item} />
          </Text>
        ))}
      </Text>
      {doc.summary && <Text style={styles.summary}>{doc.summary}</Text>}

      {doc.sections.map((section) => (
        <View key={section.heading}>
          <Heading>{section.heading}</Heading>
          {section.groups.map((group) => (
            <View key={`${group.organization}-${group.roles[0]?.meta}`}>
              <Text style={styles.organization} minPresenceAhead={60}>
                {group.organization}
              </Text>
              {group.roles.map((role) => (
                // A role is a few lines; keep each one on a single page.
                <View key={role.meta} style={styles.role} wrap={false}>
                  <Text style={styles.roleTitle}>{role.role}</Text>
                  <Text style={styles.meta}>{role.meta}</Text>
                  {role.highlights.map((h) => (
                    <Bullet key={h}>{h}</Bullet>
                  ))}
                  {role.caseStudies.map((cs) => (
                    <Text key={cs.text} style={styles.caseStudy}>
                      <Linked item={cs} />
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          ))}
        </View>
      ))}

      {doc.skills.length > 0 && (
        <View>
          <Heading>{doc.skillsHeading}</Heading>
          {doc.skills.map((group) => (
            <Text key={group.heading} style={styles.skill}>
              <Text style={styles.skillHeading}>{group.heading}: </Text>
              {group.skills}
            </Text>
          ))}
        </View>
      )}

      {doc.education.length > 0 && (
        <View wrap={false}>
          <Heading>{doc.educationHeading}</Heading>
          {doc.education.map((item) => (
            <Bullet key={item}>{item}</Bullet>
          ))}
        </View>
      )}
    </Page>
  </Document>
)
