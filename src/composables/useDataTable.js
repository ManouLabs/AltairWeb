// src/composables/useDataTable.js
import { useLoading } from '@/stores/useLoadingStore';
import { extractLazyParams } from '@/utilities/helper';
import { FilterMatchMode } from '@primevue/core/api';
import debounce from 'lodash-es/debounce';
import { ref } from 'vue';

export function useDataTable(dataFetcher, defaultFiltersConfig = {}, debounceDelay = 150) {
    const loading = useLoading();
    const lazyParams = ref({});
    const total = ref(0);
    const rows = ref(10);
    const records = ref([]);
    const selectedRecords = ref([]);
    const recordDataTable = ref(null);

    function getDefaultFilters() {
        const defaultFilters = {
            global: { value: null, matchMode: FilterMatchMode.CONTAINS }
        };

        Object.entries(defaultFiltersConfig).forEach(([field, matchMode]) => {
            defaultFilters[field] = { value: null, matchMode };
        });

        return defaultFilters;
    }

    const filters = ref(getDefaultFilters());

    const resetPages = () => {
        lazyParams.value.page = 0;
    };

    const loadLazyData = debounce(async () => {
        lazyParams.value.page ? (lazyParams.value.page += 1) : resetPages();

        try {
            loading.startDataLoading();
            const data = await dataFetcher(lazyParams.value);

            if (data.data) {
                records.value = data.data;
                total.value = data.meta?.total || data.total || 0;
                rows.value = data.meta?.per_page || data.per_page || 10;
            } else {
                records.value = data;
                total.value = data.length;
            }
        } catch (error) {
            if (error?.response?.status === 419 || error?.response?.status === 401) {
                console.error('Session expired, redirecting to login');
            }
            console.error('Error fetching data:', error);
            records.value = [];
            total.value = 0;
        } finally {
            loading.stopDataLoading();
        }
    }, debounceDelay);

    const onPage = (event) => {
        loading.startDataLoading();
        lazyParams.value = extractLazyParams(event);
        loadLazyData();
    };

    const onSort = (event) => {
        loading.startDataLoading();
        lazyParams.value = extractLazyParams(event);
        resetPages();
        if (recordDataTable.value) {
            recordDataTable.value.resetPage();
        }
        loadLazyData();
    };

    const onFilter = (event) => {
        loading.startDataLoading();
        lazyParams.value = extractLazyParams(event);
        resetPages();
        loadLazyData();
    };

    const clearFilter = () => {
        loading.startDataLoading();
        filters.value = getDefaultFilters();
        lazyParams.value = {};
        if (recordDataTable.value) {
            recordDataTable.value.resetPage();
        }
        loadLazyData();
    };

    const searchDone = () => {
        loading.startDataLoading();
        lazyParams.value.filters = filters.value;
        resetPages();
        loadLazyData();
    };

    const exportCSV = () => {
        if (recordDataTable.value) {
            recordDataTable.value.exportCSV();
        }
    };

    const refresh = () => {
        loadLazyData();
    };

    const initialize = () => {
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
