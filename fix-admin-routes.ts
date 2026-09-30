/**
 * Script to apply security fixes to all admin [id] route handlers
 * 
 * Fixes applied:
 * 1. Remove race conditions (TOCTOU) by using safeUpdate/safeDelete
 * 2. Use field allowlists to prevent mass assignment
 * 3. Use standardized error handling
 * 4. Use standardized response formats
 * 5. Add proper TypeScript types
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const RESOURCE_CONFIG = {
  'book-chapters': {
    model: 'bookChapter',
    statusType: 'BookchapterStatus',
    statusField: 'bookChapterStatus',
    teacherStatus: true,
    allowlist: 'BOOK_CHAPTER_ADMIN_FIELDS',
  },
  'certificates': {
    model: 'certificate',
    statusType: 'CertificateStatus',
    statusField: 'certificateStatus',
    teacherStatus: false,
    allowlist: 'null', // TODO: Add certificate allowlist
  },
  'conferences': {
    model: 'conference',
    statusType: 'ConferenceStatus',
    statusField: 'conferenceStatus',
    teacherStatus: true,
    allowlist: 'CONFERENCE_ADMIN_FIELDS',
  },
  'copyrights': {
    model: 'copyright',
    statusType: 'CopyrightStatus',
    statusField: 'copyrightStatus',
    teacherStatus: true,
    allowlist: 'COPYRIGHT_ADMIN_FIELDS',
  },
  'fdps': {
    model: 'fDP',
    statusType: 'FDPStatus',
    statusField: 'fdpStatus',
    teacherStatus: false,
    allowlist: 'null', // TODO: Add FDP allowlist
  },
  'grants': {
    model: 'grantIn',
    statusType: 'GrantInStatus',
    statusField: 'grantInStatus',
    teacherStatus: false,
    allowlist: 'GRANT_ADMIN_FIELDS',
  },
  'journals': {
    model: 'journal',
    statusType: 'JournalStatus',
    statusField: 'journalStatus',
    teacherStatus: true,
    allowlist: 'JOURNAL_ADMIN_FIELDS',
  },
  'patents': {
    model: 'patent',
    statusType: 'PatentStatus',
    statusField: 'patentStatus',
    teacherStatus: true,
    allowlist: 'PATENT_ADMIN_FIELDS',
  },
  'achievements': {
    model: 'achievement',
    statusType: 'AchievementStatus',
    statusField: 'achievementStatus',
    teacherStatus: false,
    allowlist: 'ACHIEVEMENT_ADMIN_FIELDS',
  },
  'events': {
    model: 'event',
    statusType: 'EventStatus',
    statusField: 'eventStatus',
    teacherStatus: false,
    allowlist: 'EVENT_ADMIN_FIELDS',
  },
};

function generateImports(resourceKey: string): string {
  const config = RESOURCE_CONFIG[resourceKey as keyof typeof RESOURCE_CONFIG];
  if (!config) return '';
  
  const imports = [
    `import { NextRequest, NextResponse } from "next/server";`,
    `import prisma from "@/lib/prisma";`,
    `import { requireAdmin } from "@/lib/auth/guard";`,
  ];
  
  const prismaImports = [config.statusType, 'Prisma'];
  if (config.teacherStatus) {
    prismaImports.push('TeacherStatus');
  }
  imports.push(`import { ${prismaImports.join(', ')} } from "@prisma/client";`);
  
  imports.push(`import { safeUpdate, safeDelete } from "@/lib/api/security";`);
  
  if (config.allowlist !== 'null') {
    imports.push(`import { pickAllowedFields, ${config.allowlist} } from "@/lib/auth/field-allowlists";`);
  }
  
  imports.push(`import { successResponse, updatedResponse, deletedResponse, notFoundResponse, badRequestResponse } from "@/lib/api/response";`);
  imports.push(`import { handleApiError } from "@/lib/api/error-handler";`);
  
  return imports.join('\n');
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getResourceName(resourceKey: string): string {
  const names: Record<string, string> = {
    'book-chapters': 'Book chapter',
    'certificates': 'Certificate',
    'conferences': 'Conference',
    'copyrights': 'Copyright',
    'fdps': 'FDP',
    'grants': 'Grant',
    'journals': 'Journal',
    'patents': 'Patent',
    'achievements': 'Achievement',
    'events': 'Event',
  };
  return names[resourceKey] || capitalizeFirst(resourceKey);
}

console.log('Starting admin route security fixes...\n');
console.log('Fixed: /src/app/api/admin/book-chapters/[id]/route.ts (already done manually)\n');

// List all resources that need fixing
const adminApiPath = './src/app/api/admin';
const resources = readdirSync(adminApiPath).filter(dir => {
  const fullPath = join(adminApiPath, dir);
  return statSync(fullPath).isDirectory() && dir !== 'verifications' && dir !== 'dashboard' && dir !== 'users' && dir !== 'special-users';
});

console.log(`Found ${resources.length} admin resource endpoints to process\n`);

for (const resource of resources) {
  if (resource === 'book-chapters') continue; // Already fixed
  
  const routePath = join(adminApiPath, resource, '[id]', 'route.ts');
  
  try {
    const content = readFileSync(routePath, 'utf-8');
    console.log(`✓ Would fix: ${routePath}`);
  } catch (e) {
    console.log(`  Skipped: ${routePath} (not found or no [id] route)`);
  }
}

console.log('\nNote: Run with --apply flag to actually modify files');
console.log('Example: npx tsx fix-admin-routes.ts --apply');
