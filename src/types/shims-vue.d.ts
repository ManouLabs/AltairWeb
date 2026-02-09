// src/types/shims-vue.d.ts
// Type declarations for Vue single-file components

declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent<{}, {}, any>;
    export default component;
}

// Type declarations for JS modules that haven't been migrated to TypeScript yet
// These can be removed as you migrate each module to TypeScript

declare module '@/components/*.vue' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent<{}, {}, any>;
    export default component;
}

declare module '@/composables/useDataTable' {
    export function useDataTable(fetcher: any, filtersConfig: any): any;
}

declare module '@/composables/useDynamicColumns' {
    export function useDynamicColumns(key: string, defaultFields: string[], translationPrefix: string): any;
}

declare module '@/composables/useLock' {
    export function useLock(defaultFields: string[], records: any): any;
}

declare module '@/composables/useRowEffects' {
    export function useRowEffects(): any;
}

declare module '@/plugins/dayjs' {
    import dayjs from 'dayjs';
    export default dayjs;
}

declare module '@/stores/useAuthStore' {
    export function useAuthStore(): any;
}

declare module '@/stores/useLoadingStore' {
    export function useLoading(): any;
}

declare module '@/utilities/helper' {
    export function findRecordIndex(records: any, id: number): number;
    export function formatDate(e: any, filterModel: any): void;
}

declare module '@/utilities/toast' {
    export const ACTIONS: {
        CREATE: string;
        EDIT: string;
        DELETE: string;
        UPDATE: string;
        STORE: string;
    };
    export function useShowToast(): { showToast: (severity: string, action: string, entity: string, position: string) => void };
}

declare module '@/services/axios' {
    import type { AxiosInstance } from 'axios';
    const apiClient: AxiosInstance;
    export default apiClient;
}

declare module '@/validations/validate' {
    export function validate(schema: any, data: any): { ok: boolean; errors: Record<string, string[]> };
    export function validateField(schema: any, data: any, path: string): { ok: boolean; errors: Record<string, string[]> };
}

// Note: Window.Echo is declared in EchoService.ts using the proper Echo<'reverb'> type
