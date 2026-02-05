// src/composables/useDataTable.ts
import { useLoading } from '@/stores/useLoadingStore';
import { extractLazyParams } from '@/utilities/helper';
import { FilterMatchMode } from '@primevue/core/api';
import debounce from 'lodash-es/debounce';
import { ref, type Ref } from 'vue';
import type { DataTablePageEvent, DataTableSortEvent, DataTableFilterEvent } from 'primevue/datatable';

interface FilterConfig {
    matchMode: string;
    relation?: {
        name: string;
        column: string;
    };
    [key: string]: unknown;
}

interface Filter {
    value: unknown;
    matchMode: string;
    relation?: {
        name: string;
        column: string;
    };
    [key: string]: unknown;
}

interface Filters {
    global: Filter;
    [key: string]: Filter;
}

interface LazyParams {
    page?: number;
    first?: number;
    rows?: number;
    sortField?: string;
    sortOrder?: number;
    filters?: Filters;
}

interface DataResponse<T> {
    data?: T[];
    meta?: {
        total: number;
        per_page: number;
        current_page: number;
    };
    total?: number;
    per_page?: number;
}

interface DataTableRef {
    resetPage: () => void;
    exportCSV: () => void;
}

type DataFetcher<T> = (params: LazyParams) => Promise<DataResponse<T> | T[]>;

export function useDataTable<T extends { id: number | string }>(dataFetcher: DataFetcher<T>, defaultFiltersConfig: Record<string, FilterConfig | string> = {}, debounceDelay: number = 150) {
    const loading = useLoading();
    const lazyParams: Ref<LazyParams> = ref({});
    const total: Ref<number> = ref(0);
    const rows: Ref<number> = ref(10);
    const records: Ref<T[]> = ref([]);
    const selectedRecords: Ref<T[]> = ref([]);
    const recordDataTable: Ref<DataTableRef | null> = ref(null);

    function getDefaultFilters(): Filters {
        const defaultFilters: Filters = {
            global: { value: null, matchMode: FilterMatchMode.CONTAINS }
        };

        Object.entries(defaultFiltersConfig).forEach(([field, config]) => {
            if (config && typeof config === 'object') {
                const { matchMode, ...rest } = config;
                defaultFilters[field] = { value: null, matchMode, ...rest };
            } else {
                defaultFilters[field] = { value: null, matchMode: config };
            }
        });

        return defaultFilters;
    }

    const filters: Ref<Filters> = ref(getDefaultFilters());

    const resetPages = (): void => {
        lazyParams.value.page = 0;
    };

    const loadLazyData = debounce(async (): Promise<void> => {
        lazyParams.value.page ? (lazyParams.value.page += 1) : resetPages();

        try {
            loading.startDataLoading();
            const data = await dataFetcher(lazyParams.value);

            if ('data' in data && data.data) {
                records.value = data.data as T[];
                total.value = data.meta?.total || data.total || 0;
                rows.value = data.meta?.per_page || data.per_page || 10;
            } else if (Array.isArray(data)) {
                records.value = data;
                total.value = data.length;
            }
        } catch (error: unknown) {
            const axiosError = error as { response?: { status?: number } };
            if (axiosError?.response?.status === 419 || axiosError?.response?.status === 401) {
                console.error('Session expired, redirecting to login');
            }
            console.error('Error fetching data:', error);
            records.value = [];
            total.value = 0;
        } finally {
            loading.stopDataLoading();
        }
    }, debounceDelay);

    const attachFilterMeta = (incomingFilters: Filters): Filters => {
        if (!incomingFilters) return incomingFilters;
        const enriched = { ...incomingFilters };
        Object.entries(defaultFiltersConfig).forEach(([field, config]) => {
            if (config && typeof config === 'object' && config.relation && enriched[field]) {
                enriched[field] = { ...enriched[field], relation: config.relation };
            }
        });
        return enriched;
    };

    const onPage = (event: DataTablePageEvent): void => {
        loading.startDataLoading();
        lazyParams.value = extractLazyParams(event);
        if (lazyParams.value.filters) {
            lazyParams.value.filters = attachFilterMeta(lazyParams.value.filters);
        }
        loadLazyData();
    };

    const onSort = (event: DataTableSortEvent): void => {
        loading.startDataLoading();
        lazyParams.value = extractLazyParams(event);
        resetPages();
        if (recordDataTable.value) {
            recordDataTable.value.resetPage();
        }
        if (lazyParams.value.filters) {
            lazyParams.value.filters = attachFilterMeta(lazyParams.value.filters);
        }
        loadLazyData();
    };

    const onFilter = (event: DataTableFilterEvent): void => {
        loading.startDataLoading();
        lazyParams.value = extractLazyParams(event);
        resetPages();
        if (lazyParams.value.filters) {
            lazyParams.value.filters = attachFilterMeta(lazyParams.value.filters);
        }
        loadLazyData();
    };

    const clearFilter = (): void => {
        loading.startDataLoading();
        filters.value = getDefaultFilters();
        lazyParams.value = {};
        if (recordDataTable.value) {
            recordDataTable.value.resetPage();
        }
        loadLazyData();
    };

    const searchDone = (): void => {
        loading.startDataLoading();
        lazyParams.value.filters = attachFilterMeta(filters.value);
        resetPages();
        loadLazyData();
    };

    const exportCSV = (): void => {
        if (recordDataTable.value) {
            recordDataTable.value.exportCSV();
        }
    };

    const refresh = (): void => {
        loadLazyData();
    };

    const initialize = (): void => {
        loadLazyData();
    };

    return {
        total,
        rows,
        records,
        selectedRecords,
        recordDataTable,
        filters,
        onPage,
        onSort,
        onFilter,
        clearFilter,
        searchDone,
        exportCSV,
        refresh,
        initialize,
        loadLazyData,
        resetPages,
        getDefaultFilters
    };
}
