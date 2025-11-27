# Altair Web - AI Coding Agent Instructions

## Architecture Overview

This is a **Vue 3 + Vite** admin dashboard with Laravel backend integration via Sanctum auth. Key tech: **PrimeVue 4**, **Pinia**, **Vue Router**, **i18n**, **Zod validation**, **TailwindCSS**, and **Laravel Echo** for real-time updates.

### Core Application Flow

1. **Bootstrap** (`src/main.js`): Pinia (with persistence) → i18n → PrimeVue → Router → dayjs locale sync
2. **Auth**: Laravel Sanctum cookie-based auth via `src/stores/useAuthStore.js` with permission-based guards
3. **Data Layer**: All API calls via `src/services/axios.js` with CSRF token handling and loading state interceptors
4. **Real-time**: Laravel Echo (Reverb broadcaster) configured in `src/services/EchoService.js`, attached to `window.Echo`

## Critical Patterns

### Service Layer Convention

Services follow `use<Entity>Service.js` pattern in `src/services/`. All mutating operations:

1. Fetch CSRF token: `await apiClient.get('/sanctum/csrf-cookie')`
2. Include X-Socket-Id header (handled by axios interceptor for Echo broadcasting)
3. Return `response.data` or throw error

```javascript
// Example: src/services/useAccountService.js
async storeAccount(accountData) {
    await apiClient.get('/sanctum/csrf-cookie');
    const response = await apiClient.post('/api/admin/accounts', accountData);
    return response.data;
}
```

### DataTable Pattern (Most Important)

**Every admin CRUD view** uses this composable-based pattern. See `src/views/admin/accounts/Accounts.vue` as reference.

**Required composables:**

- `useDataTable(dataFetcher, defaultFiltersConfig)` - handles pagination, sorting, filtering, debounced search
- `useDynamicColumns(pageId, defaultFields, translationPrefix)` - column visibility with Pinia persistence
- `useLock(defaultFields, records)` - row/column freezing
- `useRowEffects()` - visual highlights for real-time updates

**Filter config pattern:**

```javascript
const defaultFiltersConfig = {
    id: FilterMatchMode.CONTAINS,
    legal_name: FilterMatchMode.CONTAINS,
    plan: {
        matchMode: FilterMatchMode.IN,
        relation: { name: 'plan', column: 'name' } // For relational filtering
    },
    active: FilterMatchMode.EQUALS,
    created_at: FilterMatchMode.DATE_IS
};
```

**Echo integration pattern:**

```javascript
function subscribeToEcho() {
    subscription.value = Echo.private('data-stream.account').listen('DataStream', (event) => {
        handleEchoEvent(event);
    });
}

function handleEchoEvent(event) {
    const index = findRecordIndex(records, event.id);
    if (event.action === 'created') {
        records.value.unshift(event.record);
        markHighlight(event.record.id, 'created');
    }
    // ... handle update/delete
}
```

### Validation Pattern (Zod)

Schemas in `src/validations/<entity>.js` using Zod. Forms use two-phase validation:

```javascript
// Inline field validation on blur
const onBlurField = (path) => {
    const { ok, errors } = validateField(schema, record.value, path);
    if (ok) authStore.clearErrors([path]);
    else authStore.errors = { ...authStore.errors, ...errors };
};

// Full form validation on submit
const validateForm = () => {
    const { ok, errors } = validate(schema, record.value);
    authStore.errors = ok ? {} : errors;
    return ok;
};
```

**Error messages are i18n keys** stored in authStore, e.g., `'common.messages.is_required'`.

### Form Pattern (Dynamic Dialogs)

Forms are in `partials/Form.vue` subdirectories, opened via PrimeVue DialogService:

```javascript
dialog.open(formComponent, {
    props: { header: t('account.form.create'), modal: true, style: { width: '50rem' } },
    data: { record: { active: true, contacts: [] }, action: ACTIONS.CREATE, planOptions: allPlans.value }
});
```

Forms close with `dialogRef.value.close({ record, action })` to trigger parent updates.

### Router & Permissions

Routes in `src/router/index.js` use meta fields:

- `requiresAuth: true` - requires authenticated user
- `requiresPermission: 'view_accounts'` - permission check via `authStore.hasPermission()`
- `requiresGuest: true` - redirects authenticated users

Permission logic: Super Admin has all permissions, others checked against `authStore.permissions` array.

### i18n Structure

Translations in `src/locales/{ar,en,fr}.json`. Convention:

- `entity.<name>` - entity labels
- `<entity>.columns.<field>` - table headers
- `<entity>.form.*` - form labels
- `common.messages.*` - validation/error messages
- `common.toasts.<action>.*` - success/error notifications

PrimeVue locale synced in `src/plugins/primevue.js` watching i18n.global.locale changes.

### State Management

**Pinia stores** in `src/stores/`:

- `useAuthStore` - user, permissions, session management (persisted)
- `useLoadingStore` - page/data loading states
- `useSettingStore` - user preferences (column visibility, etc.)
- `useColumnStore` - wrapper for column settings via SettingStore

Stores using `pinia-plugin-persistedstate` with `persist: { paths: [...] }` option.

### Styling Approach

- **TailwindCSS** for utility classes (configured via `tailwind.config.js` with `tailwindcss-primeui` plugin)
- **PrimeVue Aura theme** with dark mode support via `.app-dark` selector
- **SCSS** in `src/assets/layout/` for layout-specific styles (topbar, menu, footer, responsive)
- Component styles typically `<style scoped>` or utility classes

## Developer Workflows

**Start dev server:**

```bash
npm run dev
```

**Build for production:**

```bash
npm run build
```

**Lint/format:**

```bash
npm run lint
```

**Environment variables required:**

- `VITE_API_URL` - Laravel backend URL
- `VITE_REVERB_*` - Echo/WebSocket config
- `VITE_DEFAULT_LOCALE` - default language (fr/en/ar)
- `VITE_LIFETIME_SESSION` - session timeout in minutes

## Adding New CRUD Resources

1. **Create service** `src/services/use<Entity>Service.js` with filter/store/update/delete methods
2. **Create validation schema** `src/validations/<entity>.js` using Zod
3. **Create view** `src/views/admin/<entity>/<Entity>.vue` using DataTable pattern
4. **Create form** `src/views/admin/<entity>/partials/Form.vue` with Zod validation
5. **Add route** in `src/router/index.js` with appropriate permissions
6. **Add translations** in all locale files (`src/locales/`)
7. **Subscribe to Echo** for real-time updates if needed

## Key Files Reference

- **App entry:** `src/main.js`
- **Auth logic:** `src/stores/useAuthStore.js`, `src/utilities/auth.js`
- **API client:** `src/services/axios.js` (includes CSRF, loading, session interceptors)
- **DataTable composable:** `src/composables/useDataTable.js`
- **Validation helpers:** `src/validations/validate.js`
- **Toast utility:** `src/utilities/toast.js` with predefined ACTIONS constants
- **Echo setup:** `src/services/EchoService.js` (global `window.Echo`)

## Common Gotchas

- **CSRF tokens required** for all POST/PUT/PATCH/DELETE requests
- **Echo Socket-ID header** automatically added by axios interceptor for mutating requests
- **Filter relations** must specify `relation: { name: 'relationName', column: 'columnName' }` in defaultFiltersConfig
- **Form validation errors** stored in `authStore.errors` as `{ fieldPath: [messages] }` with i18n keys
- **Debounce delay** in useDataTable defaults to 150ms, adjustable per view
- **Column persistence** tied to pageId string in useDynamicColumns - must be unique per view
- **PrimeVue auto-import** via unplugin-vue-components with PrimeVueResolver - no manual imports needed
