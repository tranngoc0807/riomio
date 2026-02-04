#!/bin/bash

# Script to delete all Vercel environment variables
# Usage: ./delete-vercel-env.sh

echo "🗑️  Deleting all Vercel environment variables..."
echo ""

# Get all env var names (skip header row and empty lines)
ENV_VARS=$(npx vercel env ls 2>/dev/null | tail -n +2 | awk '{print $1}' | grep -E "^[A-Z_]+$")

# Count total
TOTAL=$(echo "$ENV_VARS" | wc -l | tr -d ' ')
echo "Found $TOTAL environment variables to delete"
echo ""

# Delete each one
COUNT=0
for VAR in $ENV_VARS; do
    COUNT=$((COUNT + 1))
    echo "[$COUNT/$TOTAL] Deleting: $VAR"
    # Delete from all environments (production, preview, development)
    npx vercel env rm "$VAR" production -y 2>/dev/null
    npx vercel env rm "$VAR" preview -y 2>/dev/null
    npx vercel env rm "$VAR" development -y 2>/dev/null
done

echo ""
echo "✅ Done! All environment variables have been deleted."
echo ""
echo "To verify, run: npx vercel env ls"
