import type { ExperienceEntry } from '@/lib/types'

/**
 * A role's title and location: "Director / Lead UX and CX · Nashville, TN ·
 * Remote". On phones the location takes its own line, rather than wrapping
 * onto one that starts with a dot.
 */
export function RoleLine({ role }: { role: ExperienceEntry | undefined }) {
  if (!role) return null
  return (
    <>
      {role.role}
      {role.location && (
        <>
          <span className="max-sm:hidden"> · </span>
          <span className="max-sm:block">{role.location}</span>
        </>
      )}
    </>
  )
}
