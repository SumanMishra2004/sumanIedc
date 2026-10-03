/**
 * @file sidebar-config.ts
 * @description Centralized sidebar configuration with role-based and permission-based filtering
 * 
 * This file defines the complete sidebar navigation hierarchy and implements recursive
 * filtering based on user roles and permissions. The sidebar configuration is the single
 * source of truth for navigation structure.
 */

import {
  LayoutDashboard,
  User2,
  Bell,
  Settings,
  BookOpen,
  GraduationCap,
  CircleDollarSign,
  UserCheck,
  ClipboardCheck,
  FileCheck,
  Database,
  Users,
  ShieldCheck,
  ScrollText,
  Sparkles,
  Award,
  FileText,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react'
import { UserRole } from '@prisma/client'

// ─── Types ───────────────────────────────────────────────────────────────────

export type Permission =
  | 'profile:view'
  | 'profile:update'
  | 'research:view'
  | 'research:create'
  | 'research:update'
  | 'research:delete'
  | 'research:review'
  | 'research:approve'
  | 'research:publish'
  | 'research:manage'
  | 'grant:view'
  | 'grant:create'
  | 'grant:update'
  | 'grant:delete'
  | 'grant:manage'
  | 'grant:approve'
  | 'grant:map'
  | 'bill:view'
  | 'bill:create'
  | 'bill:update'
  | 'bill:approve'
  | 'bill:pay'
  | 'certificate:view'
  | 'certificate:create'
  | 'certificate:update'
  | 'certificate:manage'
  | 'fdp:view'
  | 'fdp:create'
  | 'fdp:update'
  | 'fdp:manage'
  | 'achievement:view'
  | 'achievement:create'
  | 'achievement:update'
  | 'achievement:verify'
  | 'faculty-verification:view'
  | 'faculty-verification:create'
  | 'faculty-verification:approve'
  | 'faculty-verification:override'
  | 'user:view'
  | 'user:create'
  | 'user:update'
  | 'user:delete'
  | 'access:view'
  | 'access:manage'
  | 'role:view'
  | 'role:manage'
  | 'event:view'
  | 'event:create'
  | 'event:update'
  | 'event:publish'
  | 'event:manage'
  | 'audit:view'
  | 'studio:view'
  | 'system:manage'

export interface SidebarNavItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  permission?: Permission
  roles?: UserRole[]
  items?: SidebarNavItem[]
  /** If true, will show badge with count of children */
  showCount?: boolean
}

export interface GrantSidebarItem {
  id: string
  projectCode: string | null
}

// ─── Permission Matrix ───────────────────────────────────────────────────────

/**
 * Maps roles to their granted permissions
 * This is the single source of truth for role-based permissions
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  STUDENT: [
    'profile:view',
    'profile:update',
    'research:view',
    'research:create',
    'research:update',
    'certificate:view',
    'certificate:create',
    'certificate:update',
    'achievement:view',
    'achievement:create',
    'grant:view',
    'bill:create',
  ],
  FACULTY: [
    'profile:view',
    'profile:update',
    'research:view',
    'research:create',
    'research:update',
    'research:review',
    'certificate:view',
    'certificate:create',
    'certificate:update',
    'achievement:view',
    'achievement:create',
    'fdp:view',
    'fdp:create',
    'fdp:update',
    'faculty-verification:view',
    'grant:view',
    'grant:create',
    'grant:update',
    'bill:create',
  ],
  EDITOR: [
    'profile:view',
    'profile:update',
    'research:view',
    'research:update',
    'research:review',
    'research:approve',
    'research:publish',
    'certificate:view',
    'fdp:view',
    'achievement:view',
    'grant:view',
    'faculty-verification:view',
    'faculty-verification:approve',
  ],
  ADMIN: [
    'profile:view',
    'profile:update',
    'research:view',
    'research:create',
    'research:update',
    'research:review',
    'research:approve',
    'research:publish',
    'research:manage',
    'grant:view',
    'grant:create',
    'grant:update',
    'grant:manage',
    'grant:approve',
    'bill:view',
    'bill:approve',
    'bill:pay',
    'certificate:view',
    'certificate:create',
    'certificate:update',
    'certificate:manage',
    'fdp:view',
    'fdp:create',
    'fdp:update',
    'fdp:manage',
    'achievement:view',
    'achievement:create',
    'achievement:update',
    'achievement:verify',
    'faculty-verification:view',
    'faculty-verification:approve',
    'user:view',
    'user:create',
    'user:update',
    'user:delete',
    'access:view',
    'access:manage',
    'event:view',
    'event:create',
    'event:update',
    'event:publish',
    'event:manage',
    'audit:view',
    'studio:view',
  ],
  SUPERADMIN: [
    'profile:view',
    'profile:update',
    'research:view',
    'research:create',
    'research:update',
    'research:review',
    'research:approve',
    'research:publish',
    'research:manage',
    'grant:view',
    'grant:create',
    'grant:update',
    'grant:manage',
    'grant:approve',
    'bill:view',
    'bill:approve',
    'bill:pay',
    'certificate:view',
    'certificate:create',
    'certificate:update',
    'certificate:manage',
    'fdp:view',
    'fdp:create',
    'fdp:update',
    'fdp:manage',
    'achievement:view',
    'achievement:create',
    'achievement:update',
    'achievement:verify',
    'faculty-verification:view',
    'faculty-verification:approve',
    'faculty-verification:override',
    'user:view',
    'user:create',
    'user:update',
    'user:delete',
    'access:view',
    'access:manage',
    'role:view',
    'role:manage',
    'event:view',
    'event:create',
    'event:update',
    'event:publish',
    'event:manage',
    'audit:view',
    'studio:view',
    'system:manage',
  ],
}

// ─── Sidebar Configuration ───────────────────────────────────────────────────

/**
 * Complete sidebar navigation hierarchy
 * Items are filtered recursively based on user role and permissions
 */
export const SIDEBAR_CONFIG: SidebarNavItem[] = [
  // ─── My Workspace ────────────────────────────────────────────────────────
  {
    title: 'My Workspace',
    url: '#workspace',
    icon: LayoutDashboard,
    showCount: true,
    items: [
      {
        title: 'Overview',
        url: '/dashboard',
        permission: 'profile:view',
      },
      {
        title: 'Settings',
        url: '/dashboard/settings',
        permission: 'profile:view',
      },
    ],
  },

  // ─── Research ────────────────────────────────────────────────────────────
  {
    title: 'Research',
    url: '#research',
    icon: BookOpen,
    permission: 'research:view',
    showCount: true,
    items: [
      {
        title: 'Journals',
        url: '/dashboard/journal',
        permission: 'research:view',
      },
      {
        title: 'Conferences',
        url: '/dashboard/conferences',
        permission: 'research:view',
      },
      {
        title: 'Book Chapters',
        url: '/dashboard/book-chapters',
        permission: 'research:view',
      },
      {
        title: 'Patents',
        url: '/dashboard/patent',
        permission: 'research:view',
      },
      {
        title: 'Copyright',
        url: '/dashboard/copyright',
        permission: 'research:view',
      },
    ],
  },

  // ─── Academic ────────────────────────────────────────────────────────────
  {
    title: 'Academic',
    url: '#academic',
    icon: GraduationCap,
    showCount: true,
    items: [
      {
        title: 'FDP',
        url: '/dashboard/fdp',
        permission: 'fdp:view',
      },
      {
        title: 'Certificates',
        url: '/dashboard/certificate',
        permission: 'certificate:view',
      },
      {
        title: 'Achievements',
        url: '/dashboard/achievements',
        permission: 'achievement:view',
      },
    ],
  },

  // ─── Grants ──────────────────────────────────────────────────────────────
  {
    title: 'Grants',
    url: '#grants',
    icon: CircleDollarSign,
    permission: 'grant:view',
    showCount: true,
    items: [
      {
        title: 'My Grants',
        url: '/dashboard/grant',
        permission: 'grant:view',
      },
      // Dynamic grant items will be injected here
    ],
  },

  // ─── Faculty ─────────────────────────────────────────────────────────────
  {
    title: 'Faculty',
    url: '#faculty',
    icon: UserCheck,
    roles: ['FACULTY', 'EDITOR', 'ADMIN', 'SUPERADMIN'],
    showCount: true,
    items: [
      {
        title: 'Co-Author Requests',
        url: '/dashboard/faculty/verification-requests',
        permission: 'faculty-verification:view',
      },
    ],
  },

  // ─── Editorial ───────────────────────────────────────────────────────────
  {
    title: 'Editorial',
    url: '#editorial',
    icon: ClipboardCheck,
    permission: 'research:review',
    showCount: true,
    items: [
      {
        title: 'Research Review',
        url: '/dashboard/editorial/research-review',
        permission: 'research:review',
      },
      {
        title: 'Pending Reviews',
        url: '/dashboard/editorial/pending-reviews',
        permission: 'research:review',
      },
      {
        title: 'Update Requests',
        url: '/dashboard/editorial/update-requests',
        permission: 'research:review',
      },
      {
        title: 'Publication Queue',
        url: '/dashboard/editorial/publication-queue',
        permission: 'research:publish',
      },
    ],
  },

  // ─── Management ──────────────────────────────────────────────────────────
  {
    title: 'Management',
    url: '#management',
    icon: Database,
    permission: 'user:view',
    showCount: true,
    items: [
      {
        title: 'Users',
        url: '/dashboard/admin/users',
        permission: 'user:view',
      },
      {
        title: 'Research',
        url: '/dashboard/admin/journals',
        permission: 'research:manage',
      },
      {
        title: 'Grants',
        url: '/dashboard/admin/grants',
        permission: 'grant:manage',
      },
      {
        title: 'Certificates',
        url: '/dashboard/admin/certificates',
        permission: 'certificate:manage',
      },
      {
        title: 'FDP',
        url: '/dashboard/admin/fdps',
        permission: 'fdp:manage',
      },
      {
        title: 'Achievements',
        url: '/dashboard/admin/achievements',
        permission: 'achievement:verify',
      },
      {
        title: 'Events',
        url: '/dashboard/admin/events',
        permission: 'event:manage',
      },
      {
        title: 'Faculty Verification',
        url: '/dashboard/admin/faculty-verification',
        permission: 'faculty-verification:approve',
      },
    ],
  },

  // ─── Administration ──────────────────────────────────────────────────────
  {
    title: 'Administration',
    url: '#administration',
    icon: ShieldCheck,
    permission: 'access:view',
    showCount: true,
    items: [
      {
        title: 'Access Management',
        url: '/dashboard/admin/special-user',
        permission: 'access:manage',
      },
      {
        title: 'Role Management',
        url: '/dashboard/admin/role-management',
        permission: 'role:manage',
      },
      {
        title: 'Audit Logs',
        url: '/dashboard/admin/audit-logs',
        permission: 'audit:view',
      },
    ],
  },

  // ─── Studio ──────────────────────────────────────────────────────────────
  {
    title: 'Studio',
    url: '/studio',
    icon: Sparkles,
    permission: 'studio:view',
  },
]

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Check if user has a specific permission based on their role
 */
export function hasPermission(userRole: UserRole | undefined, permission: Permission): boolean {
  if (!userRole) return false
  const rolePermissions = ROLE_PERMISSIONS[userRole] || []
  return rolePermissions.includes(permission)
}

/**
 * Check if user's role is in the allowed roles list
 */
export function hasRole(userRole: UserRole | undefined, roles: UserRole[]): boolean {
  if (!userRole) return false
  return roles.includes(userRole)
}

/**
 * Recursively filter sidebar items based on user role and permissions
 * Returns only items the user is authorized to see
 */
export function buildSidebar(
  items: SidebarNavItem[],
  userRole: UserRole | undefined,
  grants: GrantSidebarItem[] = []
): SidebarNavItem[] {
  return items
    .map((item) => {
      // Check role restriction
      if (item.roles && !hasRole(userRole, item.roles)) {
        return null
      }

      // Check permission restriction
      if (item.permission && !hasPermission(userRole, item.permission)) {
        return null
      }

      // Handle dynamic grant items
      if (item.title === 'Grants' && item.items) {
        const grantItems = grants.map((g) => ({
          title: g.projectCode ?? g.id.slice(0, 8),
          url: `/dashboard/grant/${g.id}`,
        }))

        // Recursively filter children
        const filteredChildren = buildSidebar(item.items, userRole, grants)

        // Add grant items after "My Grants"
        const combinedItems = [...filteredChildren, ...grantItems]

        // If no children are visible, hide the parent
        if (combinedItems.length === 0) {
          return null
        }

        return {
          ...item,
          items: combinedItems,
        }
      }

      // Recursively filter children
      if (item.items) {
        const filteredChildren = buildSidebar(item.items, userRole, grants)

        // If no children are visible, hide the parent
        if (filteredChildren.length === 0) {
          return null
        }

        return {
          ...item,
          items: filteredChildren,
        }
      }

      return item
    })
    .filter((item): item is SidebarNavItem => item !== null)
}

/**
 * Get permissions for a specific user role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Check if user can perform any action (for debugging/testing)
 */
export function canPerform(userRole: UserRole | undefined, action: Permission): boolean {
  return hasPermission(userRole, action)
}
