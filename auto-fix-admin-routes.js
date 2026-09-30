const fs = require('fs');
const path = require('path');

// Resource configurations
const RESOURCE_CONFIGS = {
  'certificates': {
    model: 'certificate',
    ModelName: 'Certificate',
    statusType: 'CertificateStatus',
    statusField: 'certificateStatus',
    hasTeacherStatus: false,
    allowlist: 'null', // Will use generic fields
    dateFields: [],
  },
  'copyrights': {
    model: 'copyright',
    ModelName: 'Copyright',
    statusType: 'CopyrightStatus',
    statusField: 'copyrightStatus',
    hasTeacherStatus: true,
    allowlist: 'COPYRIGHT_ADMIN_FIELDS',
    dateFields: ['dateOfFiling', 'dateOfSubmission', 'dateOfPublished', 'dateOfGrant'],
  },
  'fdps': {
    model: 'fDP',
    ModelName: 'FDP',
    statusType: 'FDPStatus',
    statusField: 'fdpStatus',
    hasTeacherStatus: false,
    allowlist: 'null',
    dateFields: ['startDate', 'endDate'],
  },
  'grants': {
    model: 'grantIn',
    ModelName: 'Grant',
    statusType: 'GrantInStatus',
    statusField: 'grantInStatus',
    hasTeacherStatus: false,
    allowlist: 'GRANT_ADMIN_FIELDS',
    dateFields: ['applicationDate', 'grantDate'],
  },
  'journals': {
    model: 'journal',
    ModelName: 'Journal',
    statusType: 'JournalStatus',
    statusField: 'journalStatus',
    hasTeacherStatus: true,
    allowlist: 'JOURNAL_ADMIN_FIELDS',
    dateFields: ['publicationDate', 'impactFactorDate'],
  },
  'patents': {
    model: 'patent',
    ModelName: 'Patent',
    statusType: 'PatentStatus',
    statusField: 'patentStatus',
    hasTeacherStatus: true,
    allowlist: 'PATENT_ADMIN_FIELDS',
    dateFields: ['filingDate', 'submissionDate', 'publicationDate', 'grantDate'],
  },
  'achievements': {
    model: 'achievement',
    ModelName: 'Achievement',
    statusType: 'AchievementStatus',
    statusField: 'achievementStatus',
    hasTeacherStatus: false,
    allowlist: 'ACHIEVEMENT_ADMIN_FIELDS',
    dateFields: [],
  },
};

function generateSecureRoute(resourceKey, config) {
  const imports = [];
  imports.push(`import { NextRequest, NextResponse } from "next/server";`);
  imports.push(`import prisma from "@/lib/prisma";`);
  imports.push(`import { requireAdmin } from "@/lib/auth/guard";`);
  
  const prismaImports = [config.statusType, 'Prisma'];
  if (config.hasTeacherStatus) {
    prismaImports.push('TeacherStatus');
  }
  imports.push(`import { ${prismaImports.join(', ')} } from "@prisma/client";`);
  
  imports.push(`import { safeUpdate, safeDelete } from "@/lib/api/security";`);
  
  if (config.allowlist !== 'null') {
    imports.push(`import { pickAllowedFields, ${config.allowlist} } from "@/lib/auth/field-allowlists";`);
  }
  
  imports.push(`import { successResponse, updatedResponse, deletedResponse, notFoundResponse, badRequestResponse } from "@/lib/api/response";`);
  imports.push(`import { handleApiError } from "@/lib/api/error-handler";`);

  const dateFieldsCode = config.dateFields.length > 0 ? `
    // Parse date fields if provided
    ${config.dateFields.map(field => `if (body.${field} !== undefined) {
      data.${field} = body.${field} ? new Date(body.${field}) : null;
    }`).join('\n    ')}
  ` : '';

  const teacherStatusValidation = config.hasTeacherStatus ? `
    if (body.teacherStatus && !Object.values(TeacherStatus).includes(body.teacherStatus)) {
      return badRequestResponse("Invalid teacherStatus");
    }` : '';

  const allowlistUsage = config.allowlist !== 'null' ? `
    // Use field allowlist to prevent mass assignment
    const allowedData = pickAllowedFields(body, ${config.allowlist});
    
    // Prepare update data with proper type conversions
    const data: Prisma.${config.ModelName}UpdateInput = {
      ...allowedData,
    };` : `
    // Prepare update data (TODO: Add field allowlist for this resource)
    const data: Prisma.${config.ModelName}UpdateInput = body;`;

  return `${imports.join('\n')}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  
  try {
    const { id } = await params;
    
    const resource = await prisma.${config.model}.findUnique({
      where: { id },
    });
    
    if (!resource) {
      return notFoundResponse("${config.ModelName}");
    }
    
    return successResponse(resource);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  
  try {
    const { id } = await params;
    const body = await req.json();
    
    // Validate status enums if provided
    if (body.${config.statusField} && !Object.values(${config.statusType}).includes(body.${config.statusField})) {
      return badRequestResponse("Invalid ${config.statusField}");
    }${teacherStatusValidation}
${allowlistUsage}
${dateFieldsCode}
    // Use safe update to prevent race conditions
    const result = await safeUpdate(
      prisma.${config.model},
      id,
      data,
      "${config.ModelName}"
    );
    
    if (!result.success) {
      return result.response;
    }
    
    return updatedResponse(result.data, "${config.ModelName} updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;
  
  try {
    const { id } = await params;
    
    // Use safe delete to prevent race conditions
    const result = await safeDelete(prisma.${config.model}, id, "${config.ModelName}");
    
    if (!result.success) {
      return result.response;
    }
    
    return deletedResponse("${config.ModelName} deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
`;
}

// Main execution
console.log('🔒 Auto-fixing admin [id] routes with security improvements...\n');

let fixedCount = 0;
let skippedCount = 0;

for (const [resourceKey, config] of Object.entries(RESOURCE_CONFIGS)) {
  const filePath = path.join('./src/app/api/admin', resourceKey, '[id]', 'route.ts');
  
  if (fs.existsSync(filePath)) {
    // Backup original
    const backupPath = `${filePath}.backup`;
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(filePath, backupPath);
    }
    
    // Generate and write secure version
    const secureCode = generateSecureRoute(resourceKey, config);
    fs.writeFileSync(filePath, secureCode, 'utf-8');
    
    console.log(`✓ Fixed: ${filePath}`);
    fixedCount++;
  } else {
    console.log(`⚠️  Skipped: ${filePath} (not found)`);
    skippedCount++;
  }
}

console.log(`\n✅ Summary:`);
console.log(`   Fixed: ${fixedCount} files`);
console.log(`   Skipped: ${skippedCount} files`);
console.log(`\n📝 Next steps:`);
console.log(`   1. Review the changes (backups saved as .backup files)`);
console.log(`   2. Run: npx tsc --noEmit (check for type errors)`);
console.log(`   3. Test the endpoints`);
console.log(`   4. Delete .backup files when satisfied`);
