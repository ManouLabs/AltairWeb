# AltairWeb - Project Instructions

## Architecture Overview

This is a **Vue 3 + Vite** admin dashboard with Laravel backend integration via Sanctum auth.

**Tech Stack:** PrimeVue 4, Pinia, Vue Router, i18n, Zod validation, TailwindCSS, Laravel Echo

### Core Application Flow

1. **Bootstrap** (`src/main.js`): Pinia (with persistence) → i18n → PrimeVue → Router → dayjs locale sync
2. **Auth**: Laravel Sanctum cookie-based auth via `src/stores/useAuthStore.js` with permission-based guards
3. **Data Layer**: All API calls via `src/services/axios.js` with CSRF token handling and loading state interceptors
4. **Real-time**: Laravel Echo (Reverb broadcaster) configured in `src/services/EchoService.js`, attached to `window.Echo`

---

## Critical Patterns

### Service Layer Convention

Services follow `use<Entity>Service.js` pattern in `src/services/`. All mutating operations:

1. Fetch CSRF token: `await apiClient.get('/sanctum/csrf-cookie')`
2. Include X-Socket-Id header (handled by axios interceptor for Echo broadcasting)
3. Return `response.data` or throw error

### DataTable Pattern

Every admin CRUD view uses composable-based pattern. See `src/views/admin/accounts/Accounts.vue` as reference.

**Required composables:**

- `useDataTable(dataFetcher, defaultFiltersConfig)` - pagination, sorting, filtering, debounced search
- `useDynamicColumns(pageId, defaultFields, translationPrefix)` - column visibility with Pinia persistence
- `useLock(defaultFields, records)` - row/column freezing
- `useRowEffects()` - visual highlights for real-time updates

### Validation Pattern (Zod)

Schemas in `src/validations/<entity>.js` using Zod. Forms use two-phase validation:

- Inline field validation on blur
- Full form validation on submit
- Error messages are i18n keys stored in authStore

### Form Pattern (Dynamic Dialogs)

Forms are in `partials/Form.vue` subdirectories, opened via PrimeVue DialogService.
Forms close with `dialogRef.value.close({ record, action })` to trigger parent updates.

---

## i18n Structure

Translations in `src/locales/{ar,en,fr}.json`. Convention:

- `entity.<name>` - entity labels
- `<entity>.columns.<field>` - table headers
- `<entity>.form.*` - form labels
- `common.messages.*` - validation/error messages

**IMPORTANT: Only update `src/locales/en.json` for translations. Do NOT modify `ar.json` or `fr.json`.**

---

## Developer Workflows

**Start dev server:** `npm run dev`
**Build for production:** `npm run build`
**Lint/format:** `npm run lint`

**Important:** Never run test commands. Tests are managed by the backend team only.

---

## Adding New CRUD Resources

1. Create service `src/services/use<Entity>Service.js`
2. Create validation schema `src/validations/<entity>.js` using Zod
3. Create view `src/views/admin/<entity>/<Entity>.vue` using DataTable pattern
4. Create form `src/views/admin/<entity>/partials/Form.vue`
5. Add route in `src/router/index.js` with appropriate permissions
6. Add translations in `src/locales/en.json` only
7. Subscribe to Echo for real-time updates if needed

---

## Common Gotchas

- CSRF tokens required for all POST/PUT/PATCH/DELETE requests
- Echo Socket-ID header automatically added by axios interceptor
- Filter relations must specify `relation: { name: 'relationName', column: 'columnName' }`
- Form validation errors stored in `authStore.errors` as `{ fieldPath: [messages] }`
- PrimeVue auto-import via unplugin-vue-components - no manual imports needed
