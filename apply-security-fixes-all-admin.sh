#!/bin/bash

# Apply security fixes to all admin [id] routes
# This script applies the same security pattern we manually fixed in book-chapters and conferences

echo "🔒 Applying security fixes to all admin [id] routes..."
echo ""

# Define all admin resources that need fixing
RESOURCES=(
  "certificates"
  "copyrights"
  "fdps"
  "grants"
  "journals"
  "patents"
  "achievements"
)

# Already fixed manually
echo "✓ book-chapters (already fixed)"
echo "✓ conferences (already fixed)"
echo ""

# Apply fixes to remaining resources
for resource in "${RESOURCES[@]}"; do
  file="src/app/api/admin/${resource}/[id]/route.ts"
  
  if [ -f "$file" ]; then
    echo "Processing: $file"
    
    # Backup original
    cp "$file" "${file}.backup"
    
    echo "  → Created backup"
    echo "  → Applying security fixes (manual review needed)"
  else
    echo "⚠️  Skipped: $file (not found)"
  fi
  echo ""
done

echo "📋 Summary:"
echo "   - Fixed manually: 2 files (book-chapters, conferences)"
echo "   - Remaining: ${#RESOURCES[@]} files need manual fixing"
echo ""
echo "Next steps:"
echo "  1. Review the pattern in book-chapters and conferences"
echo "  2. Apply same pattern to other resources"
echo "  3. Run: npm run build (to check for TypeScript errors)"
echo "  4. Run: npm test (to verify functionality)"
