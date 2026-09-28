import { RouteTransition } from '@/components/route-transition'

/** Every page animates in and out via RouteTransition (see its notes). */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <RouteTransition>{children}</RouteTransition>
}
