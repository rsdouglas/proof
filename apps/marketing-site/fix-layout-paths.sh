#!/bin/bash
# Fix common layout path mistake: ../../../layouts/ → ../../layouts/
# Marketing bot sometimes uses wrong relative path depth
COUNT=$(grep -r "layout: ../../../layouts/" src/pages/ --include="*.md" 2>/dev/null | wc -l)
if [ "$COUNT" -gt "0" ]; then
  echo "⚠️  Fixing $COUNT files with wrong layout path (../../../ → ../../)"
  find src/pages -name "*.md" -exec sed -i 's|layout: \.\./\.\./\.\./layouts/|layout: ../../layouts/|g' {} \;
  echo "✅ Fixed"
else
  echo "✅ All layout paths correct"
fi
