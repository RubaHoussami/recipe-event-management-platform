/**
 * Central icon set using Material Design icons (react-icons/md).
 * Use with className "icon" or "icon--sm" / "icon--lg" for sizing.
 */
import {
  MdAdd,
  MdAutoAwesome,
  MdDarkMode,
  MdEvent,
  MdGroup,
  MdHome,
  MdLightMode,
  MdMenuBook,
  MdNotifications,
  MdSettings,
  MdShare,
} from 'react-icons/md'

const iconClass = 'app-icon'

export function IconHome({ className }: { className?: string }) {
  return <MdHome className={className ?? iconClass} aria-hidden />
}
export function IconRecipes({ className }: { className?: string }) {
  return <MdMenuBook className={className ?? iconClass} aria-hidden />
}
export function IconAdd({ className }: { className?: string }) {
  return <MdAdd className={className ?? iconClass} aria-hidden />
}
export function IconEvents({ className }: { className?: string }) {
  return <MdEvent className={className ?? iconClass} aria-hidden />
}
export function IconFriends({ className }: { className?: string }) {
  return <MdGroup className={className ?? iconClass} aria-hidden />
}
export function IconNotifications({ className }: { className?: string }) {
  return <MdNotifications className={className ?? iconClass} aria-hidden />
}
export function IconSettings({ className }: { className?: string }) {
  return <MdSettings className={className ?? iconClass} aria-hidden />
}
export function IconLightMode({ className }: { className?: string }) {
  return <MdLightMode className={className ?? iconClass} aria-hidden />
}
export function IconDarkMode({ className }: { className?: string }) {
  return <MdDarkMode className={className ?? iconClass} aria-hidden />
}
export function IconShare({ className }: { className?: string }) {
  return <MdShare className={className ?? iconClass} aria-hidden />
}
export function IconSparkles({ className }: { className?: string }) {
  return <MdAutoAwesome className={className ?? iconClass} aria-hidden />
}
