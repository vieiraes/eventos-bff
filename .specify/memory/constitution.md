# Eventos BFF Constitution

<!--
Sync Impact Report:
Version: 1.2.0 → Previous: 1.1.0
Last Amended: 2026-02-16
Changes:
  - EXPANDED Principle II: Added DBML synchronization requirement (MANDATORY)
  - NEW PRINCIPLE VIII: Data Integrity & Business Rules (triggers, soft delete)
  - Added Migration Protocol: DBML update is now mandatory step
  - Documented Soft Delete Pattern with deleted_at column standard
  - Added Trigger-Based Business Rules pattern (prevent_instance_migration example)
  - Updated Business Logic Constraints with instance migration prevention rule
Modified Principles:
  - Principle II (Schema-First Design): Added DBML sync requirement with rationale
  - Migration Protocol: DBML update now step #2 (immediately after migration creation)
  - Business Logic Constraints: Added User Management Rules → Instance Migration Prevention
Added Sections:
  - NEW Principle VIII: Data Integrity & Business Rules
  - Soft Delete Pattern (deleted_at column standard)
  - Trigger-Based Business Rules (database-enforced constraints)
Templates Status:
  - ✅ plan-template.md: Aligned
  - ✅ spec-template.md: Should verify migration checklist includes DBML update
  - ✅ tasks-template.md: Should add "Verify DBML sync" task type
Follow-up:
  - ⚠ spec-template.md: Add DBML sync reminder to migration sections
  - ⚠ tasks-template.md: Add task type "Update DBML documentation"
  - ⚠ Implement restore user UI (soft_delete_user/restore_user functions exist)
-->

## Core Principles

### I. Multi-Tenant Isolation (NON-NEGOTIABLE)
**Principle**: Every data operation MUST respect instance isolation boundaries.

- All tables (except `instances`) MUST have `instance_id` column with proper foreign keys
- Row Level Security (RLS) policies MUST enforce instance_id filtering for non-superadmin users
- Queries MUST never cross instance boundaries unless user is superadmin
- SuperAdmins have `instance_id = NULL` and can see all instances
- Test data isolation in unit and integration tests

**Rationale**: Multi-tenancy is the business model foundation. Data leakage between clients (instances) is catastrophic and violates B2B trust.

### II. Schema-First Design
**Principle**: Database schema is the source of truth; frontend adapts to backend.

- Changes start with migration files in `supabase/migrations/`
- **DBML schema (`database-schema.dbml`) MUST be updated IMMEDIATELY with every schema change** (NON-NEGOTIABLE)
- TypeScript interfaces in `frontend/src/types/` must mirror database schema exactly
- No feature implementation without corresponding database schema
- Schema changes require migration + DBML update + TypeScript types update
- **DBML is the visual source of truth**: Used to understand and validate what exists in Supabase
- DBML update is NOT optional, NOT deferred - it must happen in the same commit as the migration

**Rationale**: Database is persistent, centralized truth. Frontend is ephemeral UI representation. Decoupling reduces bugs and enables multiple frontends. **DBML documentation prevents schema drift and serves as the primary visualization tool for understanding database structure - out-of-sync DBML leads to incorrect assumptions and bugs.**

### III. Security-First (RLS Policies)
**Principle**: Security is enforced at database level through Row Level Security.

- Every table MUST have RLS enabled (`ALTER TABLE x ENABLE ROW LEVEL SECURITY`)
- Policies must use helper functions (`is_superadmin()`, `get_user_instance_id()`, `get_user_role()`) to avoid recursion
- Never bypass RLS with service_role key in application code
- Frontend uses anon/authenticated keys only
- Test RLS policies with different user roles

**Rationale**: RLS provides defense-in-depth. Even if frontend is bypassed, database enforces access control. Supabase Auth integration ensures consistency.

### IV. TypeScript Strict Mode
**Principle**: TypeScript strict type checking with no implicit any.

- All React components use explicit prop types
- No `any` types unless absolutely necessary (document reason)
- Interfaces over types for extensibility
- API responses must have typed interfaces matching backend schema
- Use discriminated unions for role-based logic (`role: 'superadmin' | 'organizer' | ...`)

**Rationale**: Type safety catches bugs at compile time. Explicit types serve as inline documentation. Discriminated unions enable exhaustive pattern matching.

### V. Role-Based Access Control (RBAC)
**Principle**: User permissions follow strict role hierarchy.

**Roles** (from highest to lowest privilege):
- `superadmin`: Platform admin, manages instances and organizers (`instance_id = NULL`)
- `organizer`: Instance admin, manages events and users within their instance
- `staff`: Event support team
- `speaker`: Presenter/facilitator
- `vip`: Special attendee with elevated privileges
- `attendee`: Standard participant

**Rules**:
- SuperAdmin can: CRUD instances, create superadmins, create/edit organizers
- Organizer can: CRUD events (own instance), CRUD users (own instance), view registrations
- Staff/Speaker/VIP/Attendee: Read-only for SuperAdmin UI, managed by Organizers
- Frontend must show/hide UI elements based on role
- Backend RLS policies enforce role restrictions

**Rationale**: Clear role boundaries prevent privilege escalation and simplify authorization logic.

### VI. Supabase-First Architecture
**Principle**: Leverage Supabase platform features over custom solutions.

- Use Supabase Auth for authentication (no custom JWT)
- Use Triggers (`handle_new_user`, `handle_user_update`) to sync auth.users → public.users
- Use RLS policies instead of API middleware for authorization
- Use Supabase Realtime for live updates (when needed)
- Use Supabase Storage for file uploads (future: avatars, event banners)
- Use `SECURITY DEFINER` functions for privileged operations

**Rationale**: Supabase handles scaling, security, and infrastructure. Custom solutions increase maintenance burden and introduce bugs.

### VII. Component Composition & Reusability
**Principle**: Build UI from composable, reusable components with consistent UX.

**Patterns**:

**Patterns**:
- Layout components: `AdminLayout`, `OrganizerLayout` (role-specific shells)
- Route guards: `AdminRoute`, `OrganizerRoute` (enforce role access)
- Shared components: Form inputs, tables, badges, modals (DRY principle)
- Custom hooks: `useAuth()` for authentication state
- Services: `supabase.ts` as single source of Supabase client

**Rules**:
- No duplicate code across pages
- Extract common patterns to `components/` or `hooks/`
- Props should be explicitly typed with interfaces
- Components should be focused (single responsibility)
- **UX consistency MUST be enforced through reusable components, not copy-paste**

**Rationale**: Reusability reduces bugs, speeds development, ensures UI consistency. Small focused components are easier to test and maintain. Inconsistent UX damages user trust and increases cognitive load.

### VIII. Data Integrity & Business Rules
**Principle**: Critical business rules are enforced at the database level through triggers and constraints.

**Patterns**:
- **Soft Delete**: Use `deleted_at TIMESTAMPTZ NULL` column instead of hard deletes
- **Trigger-Based Rules**: Complex business rules implemented as BEFORE/AFTER triggers
- **Check Constraints**: Simple validations at column level (e.g., `CHECK (status IN (...))`)
- **Foreign Key Constraints**: Referential integrity with appropriate ON DELETE actions
- **RLS Policies**: Updated to filter deleted records (`WHERE deleted_at IS NULL`)

**Rules**:
- Users table MUST use soft delete pattern (preserve data for audit/restore)
- All queries for active records MUST explicitly filter `deleted_at IS NULL`
- RLS policies MUST include deleted_at filters (except restore/audit operations)
- Business rules that prevent invalid states MUST be triggers (not just frontend validation)
- Triggers return descriptive error messages for frontend display
- Functions for privileged operations: `soft_delete_user()`, `restore_user()` with SECURITY DEFINER

**Soft Delete Standard**:
```sql
-- Column definition
deleted_at TIMESTAMPTZ NULL

-- Partial index for performance (only indexes active records)
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- RLS policy pattern
CREATE POLICY "active_users_only" ON users FOR SELECT
USING (deleted_at IS NULL AND <other conditions>);

-- Soft delete function
CREATE OR REPLACE FUNCTION soft_delete_user(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users SET deleted_at = NOW() WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Trigger-Based Business Rules**:
```sql
-- Example: Prevent instance migration after assignment
CREATE OR REPLACE FUNCTION prevent_instance_migration()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.instance_id IS NOT NULL AND NEW.instance_id != OLD.instance_id THEN
    RAISE EXCEPTION 'Não é permitido migrar usuário entre instâncias';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_instance_migration_trigger
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION prevent_instance_migration();
```

**When to Use Triggers vs Frontend Validation**:
- ✅ **Trigger**: Data integrity rules (prevent migration, cascade updates, audit logs)
- ✅ **Trigger**: Rules that must survive admin/API access bypassing frontend
- ✅ **Frontend**: UX feedback (disable fields, show warnings before attempting)
- ❌ **Never**: Trust frontend alone for business-critical rules

**Rationale**: Database triggers provide last line of defense for business rules. Frontend can be bypassed (API, admin tools, SQL client). Soft delete preserves data for audit trails, compliance, and recovery. Triggers + frontend validation = defense in depth.

#### Form Component Patterns (MANDATORY)

**Problem Solved**: Default Tailwind inputs have poor UX:
- Too small (hard to click/tap)
- Low contrast (gray borders on white background)
- Inconsistent styling across forms
- Missing accessibility features

**Solution**: Reusable form components in `components/` with enhanced UX:

**Component Library**:
- `FormInput.tsx` - Text inputs with enhanced UX
- `FormSelect.tsx` - Dropdowns with matching styling
- `FormTextarea.tsx` - Multi-line text with same patterns

**Required Props Pattern**:
```typescript
interface FormComponentProps {
  label: string;              // Always visible (accessibility)
  error?: string;            // Validation error display
  helperText?: string;       // Explanatory text below field
  // ...extends InputHTMLAttributes/SelectHTMLAttributes
}
```

**Mandatory Styling Standards**:
- **Height**: `py-3` (taller fields, easier to click)
- **Padding**: `px-4` (text not cramped)
- **Text Size**: `text-base` (NOT `text-sm` - too small)
- **Border**: `border-2 border-gray-400` (visible contrast)
- **Background**: `bg-gray-50` (differentiates from white page background)
- **Hover**: `hover:border-gray-500 hover:bg-white` (interactive feedback)
- **Focus**: `focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:bg-white` (clear active state)
- **Transitions**: `transition-colors duration-200` (smooth state changes)
- **Label**: `text-base font-semibold mb-2 block` (NOT `text-sm` - too small)
- **Error State**: `border-red-400` with red text below
- **Disabled**: `bg-gray-100 cursor-not-allowed opacity-60`

**Usage Rules**:
- ✅ USE: `<FormInput label="Nome" value={name} onChange={...} />`
- ❌ NEVER: Copy-paste `<input className="...lots of tailwind..." />` across files
- ✅ USE: `helperText` prop for inline guidance
- ❌ NEVER: Separate `<p className="text-sm">` for help text
- ✅ USE: `error` prop for validation feedback
- ❌ NEVER: Conditional `<div>` for error rendering

**Accessibility Requirements**:
- Every input MUST have a visible label (no placeholder-only)
- Labels MUST be associated with inputs (via `htmlFor` / `id`)
- Error messages MUST be programmatically linked (aria-describedby)
- Focus states MUST be clearly visible (ring + border color change)
- Color MUST NOT be the only indicator (use icons + text for errors)

**When to Create New Form Component**:
1. Pattern is used in 2+ forms → Extract to component
2. Styling is complex (5+ Tailwind classes) → Extract to component
3. Logic is reusable (date picker, file upload) → Extract to component

**Migration Path**:
- When touching a form, migrate ALL fields to reusable components
- Do not leave mixed legacy `<input>` and new `<FormInput>` in same form
- Document custom styling needs with TODO comment if component doesn't support it yet

## Development Standards

### Tech Stack (NON-NEGOTIABLE)
- **Backend**: Supabase (PostgreSQL + Auth + RLS + API)
- **Frontend**: Vite + React 18 + TypeScript 5.3.3 + React Router 6
- **Styling**: Tailwind CSS 3.4 (utility-first, no custom CSS unless justified)
- **State**: React hooks (no Redux/Zustand unless complexity justifies it)
- **Schema**: DBML for documentation, SQL migrations for implementation
- **IDE**: VS Code (Supabase MCP integration for database operations)

**Rationale**: Standardized stack reduces context switching, enables team collaboration, leverages community solutions.

### Code Organization
```
eventos-bff/
├── .specify/                    # Spec Kit templates & memory
│   ├── templates/              # Constitution, plan, spec templates
│   └── memory/                 # Project-specific filled templates
├── supabase/
│   ├── migrations/             # Numbered SQL migrations (001_xxx.sql)
│   └── seed-v2.sql            # Test data (DO NOT run in production)
├── frontend/
│   └── src/
│       ├── components/        # Reusable UI components
│       │   ├── AdminLayout.tsx
│       │   ├── OrganizerLayout.tsx
│       │   ├── AdminRoute.tsx
│       │   └── OrganizerRoute.tsx
│       ├── pages/            # Route-specific page components
│       │   ├── admin/        # SuperAdmin pages
│       │   └── organizer/    # Organizer pages
│       ├── hooks/            # Custom React hooks (useAuth)
│       ├── services/         # External integrations (supabase.ts)
│       ├── types/            # TypeScript interfaces (mirrors DB schema)
│       └── utils/            # Helper functions
├── database-schema.dbml       # Visual schema documentation
├── DATABASE_STATUS.md         # Current DB state + migrations log
├── LOGINS.md                 # Test credentials
└── README.md                 # Project overview
```

### Naming Conventions
- **Database**: 
  - Tables: lowercase, plural (`users`, `events`, `registrations`)
  - Columns: snake_case (`instance_id`, `created_at`, `full_name`)
  - Indexes: descriptive (`idx_users_instance_id`)
- **TypeScript/React**:
  - Components: PascalCase (`AdminLayout`, `InstanceForm`, `FormInput`)
  - Files: Match component name (`AdminLayout.tsx`, `FormInput.tsx`)
  - Interfaces: PascalCase (`User`, `Instance`, `Event`)
  - Functions: camelCase (`loadUsers`, `handleSubmit`)
  - Hooks: `use` prefix (`useAuth`, `useSupabase`)
- **URLs/Routes**: kebab-case (`/admin/instances/new`, `/organizer/events`)

### UI/UX Consistency Standards
- **Forms**: ALL forms MUST use `FormInput`, `FormSelect`, `FormTextarea` components
- **Buttons**: Consistent sizing and colors:
  - Primary action: `bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 text-base`
  - Secondary: `bg-gray-200 hover:bg-gray-300 text-gray-900`
  - Danger: `bg-red-600 hover:bg-red-700 text-white`
- **Contrast**: WCAG AA minimum (4.5:1 for text, 3:1 for UI components)
- **Touch Targets**: Min 44x44px (WCAG, Apple HIG, Material Design)
- **Spacing**: Consistent with Tailwind scale (px-4, py-3, gap-4, space-y-4)
- **Typography**: 
  - Headings: `text-2xl font-bold` (page title), `text-xl font-semibold` (section)
  - Body: `text-base` (default), `text-sm` only for metadata/captions
  - Labels: `text-base font-semibold` (form labels must be readable)
- **Colors**: Use Tailwind semantic colors (indigo for primary, red for danger, gray for neutral)
- **Icons**: Consistent library (Heroicons recommended with Tailwind)
- **Loading States**: Spinner + descriptive text ("Carregando...")
- **Empty States**: Friendly message + action button
- **Error States**: Red border + icon + descriptive message

### Migration Protocol (MANDATORY CHECKLIST)
1. **Create migration**: `supabase/migrations/00X_descriptive_name.sql`
2. **Update DBML IMMEDIATELY**: Reflect changes in `database-schema.dbml` (same commit)
   - Add/modify table definitions
   - Add/modify column definitions with notes
   - Add/modify indexes with performance notes
   - Update header comment with migration number and brief description
3. **Apply migration**: Use Supabase MCP (`mcp_com_supabase__execute_sql`)
4. **Update types**: Sync `frontend/src/types/index.ts` with new schema
5. **Document**: Add entry to `DATABASE_STATUS.md`
6. **Test RLS**: Verify policies work correctly with new schema
7. **Test Queries**: Ensure existing queries work (especially if added deleted_at filter)
8. **Commit**: Single atomic commit with migration + DBML + types

**DBML Update Requirements**:
- ✅ **Always**: Column additions/removals/modifications
- ✅ **Always**: Index additions/removals
- ✅ **Always**: Constraint changes (foreign keys, checks)
- ✅ **Always**: Trigger additions (documented in header comment)
- ✅ **Always**: Table additions/removals
- ⚠️ **Document in header**: RLS policy changes (too verbose for DBML)
- ⚠️ **Document in header**: Function additions (link to migration file)

**Never**:
- ❌ Modify production data directly
- ❌ Run migrations that haven't been tested locally
- ❌ Skip DBML update (even "small" changes must be documented)
- ❌ Defer DBML update to "later" (it never happens)
- ❌ Skip TypeScript type updates
- ❌ Forget to test RLS policies after schema changes
- ❌ Commit migration without corresponding DBML changes

## Security Requirements

### Authentication & Authorization
- **Authentication**: Managed by Supabase Auth (email/password, magic links)
- **Session**: HTTP-only cookies, managed by Supabase client
- **Authorization**: RLS policies at database level
- **Frontend**: Show/hide UI based on role, but never trust client-side checks alone
- **API Keys**: 
  - Use `anon` key in frontend (public, RLS-protected)
  - Never expose `service_role` key (bypasses RLS)

### RLS Policy Patterns
```sql
-- ✅ CORRECT: Use helper functions to avoid recursion
CREATE POLICY "superadmin_all_users" ON users FOR ALL
USING (public.is_superadmin());

-- ✅ CORRECT: Instance isolation
CREATE POLICY "organizers_view_instance_users" ON users FOR SELECT
USING (
  public.get_user_role() = 'organizer'
  AND instance_id = public.get_user_instance_id()
);

-- ❌ WRONG: Causes infinite recursion
CREATE POLICY "bad_policy" ON users FOR ALL
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
);
```

### Data Validation
- **Backend**: PostgreSQL constraints (NOT NULL, UNIQUE, CHECK, FOREIGN KEY)
- **Frontend**: HTML5 validation + custom validation before submit
- **Never**: Trust frontend validation alone
- **Sanitization**: Supabase parameterized queries prevent SQL injection

## Quality Gates

### Before Committing
- [ ] TypeScript compiles with zero errors (`npm run build`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] Migration tested with seed data
- [ ] DBML updated if schema changed
- [ ] TypeScript types updated if schema changed

### Before Deploying
- [ ] All RLS policies tested with different roles
- [ ] No `console.log` in production code (use structured logging)
- [ ] Environment variables documented in `.env.example`
- [ ] Database migrations applied successfully
- [ ] Rollback plan prepared (if migration is destructive)

### Testing Strategy
- **Manual Testing**: Test with different user roles (superadmin, organizer)
- **Database Testing**: Create test users, test queries respect instance_id
- **RLS Testing**: Attempt unauthorized access, verify policies block it
- **Future**: Unit tests (React Testing Library), E2E tests (Playwright)

## Feature Development Workflow

### Adding New Feature
1. **Plan**: Define user story, acceptance criteria, affected tables
2. **Schema**: Design database changes (new tables, columns, policies)
3. **Migrate**: Create migration file, apply, update DBML
4. **Types**: Update TypeScript interfaces
5. **Backend**: Test RLS policies work correctly
6. **Frontend**: Build UI components, integrate with Supabase client
7. **Test**: Manual testing with different roles
8. **Document**: Update README, DATABASE_STATUS if significant

### Modifying Existing Feature
1. **Assess Impact**: Identify affected tables, components, routes
2. **Backward Compatibility**: Can change be non-breaking? If not, plan migration
3. **Update Schema**: Migration + DBML + types (if DB changed)
4. **Update Components**: Modify affected React components
5. **Test**: Regression test existing functionality
6. **Document**: Note breaking changes, update docs

## Business Logic Constraints

### Instance Limits (Billing Model)
- **Standard Plan**: 10 events max (`max_events = 10`)
- **Premium Plan**: 20 events max (`max_events = 20`)
- **Enterprise Plan**: 50 events max (`max_events = 50`)
- **Enforcement**: (Future) Organizer dashboard prevents creating event beyond limit
- **Settings**: Stored in `instances.settings.max_events`

### User Management Rules
- SuperAdmin can:
  - ✅ Create/edit instances (companies)
  - ✅ Create other superadmins (for partners)
  - ✅ Create/edit organizers (instance admins)
  - 👀 View all users (read-only for staff/speaker/vip/attendee)
  - ✅ Soft delete users (marks deleted_at timestamp)
  - ✅ Restore deleted users (clears deleted_at)
- Organizer can:
  - ✅ Create/edit events (only in their instance)
  - ✅ Manage all user types within their instance
  - ❌ Cannot see other instances
  - ✅ Soft delete users in their instance

### Instance Migration Prevention (NON-NEGOTIABLE)
**Rule**: Once a user is assigned to an instance (`instance_id IS NOT NULL`), they CANNOT be migrated to another instance.

**Enforcement**:
- **Database Trigger**: `prevent_instance_migration_trigger` blocks UPDATE of `instance_id` if already set
- **Frontend**: Instance field becomes READ-ONLY in edit mode (shows dropdown value but disabled)
- **Rationale**: Users accumulate instance-specific data (events, registrations, access). Migration would break referential integrity and cause data inconsistency.

**Allowed Transitions**:
- ✅ `NULL → UUID`: Assigning SuperAdmin to become Organizer of an instance
- ❌ `UUID → different UUID`: Migration between instances (blocked by trigger)
- ❌ `UUID → NULL`: Demoting Organizer back to SuperAdmin (blocked by trigger)

**Error Message**: "Não é permitido migrar usuário entre instâncias"

**Frontend Behavior**:
- Create mode: Instance dropdown enabled (select any active instance)
- Edit mode: Instance field shows current instance name as disabled text input (read-only)

### Registration Lifecycle
1. **Pre-Registration**: User browses event, adds packages to cart (`registration_items`)
2. **Checkout**: User submits, status → `awaiting_payment`
3. **Payment**: External gateway callback, status → `paid`
4. **Confirmation**: Admin confirms, status → `confirmed`
5. **Access Grant**: System creates `user_access` records for each `registration_item`
6. **Check-in**: (Future) QR code scan validates `user_access` at event entrance

## Governance

### Constitution Authority
- This Constitution supersedes all other documentation, patterns, or conventions
- When conflicts arise, Constitution takes precedence
- Exceptions must be documented with clear justification

### Amendment Process
1. **Propose**: Document reason, affected principles, migration impact
2. **Review**: Team consensus required for changes to NON-NEGOTIABLE principles
3. **Approve**: Update Constitution with version bump (MAJOR for breaking changes)
4. **Migrate**: Update codebase to comply with new principle
5. **Document**: Add to Sync Impact Report at top of Constitution

### Version Semantics
- **MAJOR**: Backward-incompatible governance changes (e.g., new NON-NEGOTIABLE principle)
- **MINOR**: New principle added, or existing principle expanded materially
- **PATCH**: Clarifications, typo fixes, non-semantic refinements

### Compliance
- All code reviews must verify Constitution compliance
- Agents/AI assistants must refer to this Constitution before implementing changes
- Complexity must be justified against Principles (especially Multi-Tenant Isolation, Security-First)
- Use `.specify/templates/` for consistent planning, specs, and task breakdown

**Version**: 1.2.0 | **Ratified**: 2026-02-16 | **Last Amended**: 2026-02-16
