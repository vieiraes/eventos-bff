#!/bin/bash
set -e

cd /home/bvieira/projetos/gh/eventos-bff

echo "=== Initializing Git Repository ==="
git init || echo "Git already initialized"

echo ""
echo "=== Adding all files ==="
git add -A

echo ""
echo "=== Creating commit ==="
git commit -m "feat: initial commit - eventos bff multi-tenant saas

- Complete database schema with 8 tables
- Multi-tenant isolation with RLS policies
- SuperAdmin and Organizer dashboards
- Instance and user management CRUD
- Auth integration with Supabase
- Helper functions to prevent RLS recursion
- Role-based routing (Home.tsx)
- Consolidated migrations (001_complete_schema.sql)
- Technical constitution and documentation" || echo "Nothing to commit or already committed"

echo ""
echo "=== Renaming branch to main ==="
git branch -M main

echo ""
echo "=== Adding remote origin ==="
git remote add origin git@github.com:vieiraes/eventos-bff.git 2>/dev/null || echo "Remote 'origin' already exists"

echo ""
echo "=== Pushing to GitHub ==="
git push -u origin main

echo ""
echo "✅ Done! Repository pushed to GitHub"
