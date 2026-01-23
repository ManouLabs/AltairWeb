<script setup>
import { useDataTable } from '@/composables/useDataTable';
import { useDynamicColumns } from '@/composables/useDynamicColumns';
import { useLock } from '@/composables/useLock';
import dayjs from '@/plugins/dayjs';
import { useCommitService } from '@/services/useCommitService';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatDate } from '@/utilities/helper';
import { FilterMatchMode } from '@primevue/core/api';
import { useDialog } from 'primevue/usedialog';
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

onMounted(() => {
    initialize();
});

const defaultFiltersConfig = {
    file_name: FilterMatchMode.CONTAINS,
    file_path: FilterMatchMode.CONTAINS,
    commit_hash: FilterMatchMode.CONTAINS,
    commit_message: FilterMatchMode.CONTAINS,
    author_name: FilterMatchMode.CONTAINS,
    committed_at: FilterMatchMode.DATE_IS
};

const { total, rows, records, selectedRecords, recordDataTable, filters, onPage, onSort, onFilter, clearFilter, searchDone, exportCSV, initialize } = useDataTable(
    (params) => useCommitService.getCommitFiles(params),
    defaultFiltersConfig
);

const authStore = useAuthStore();
const dialog = useDialog();
const fileDetailComponent = defineAsyncComponent(() => import('./partials/FileDetail.vue'));
const { t } = useI18n();

const defaultFields = ['file_name', 'file_path', 'commit_hash', 'commit_message', 'author_name', 'committed_at'];
const { lockedRow, toggleLock, frozenColumns, toggleColumnFrozen } = useLock(defaultFields, records);

const defaultColumns = computed(() =>
    defaultFields.map((field) => ({
        field,
        header: t(`commit.columns.${field}`)
    }))
);

const { selectedColumns, columnChanged } = useDynamicColumns('commitsColumns', defaultFields, 'commit.columns');

function openFileDetail(file) {
    dialog.open(fileDetailComponent, {
        props: {
            header: file.file_name,
            modal: true,
            style: { width: '80rem', maxHeight: '90vh' }
        },
        data: { file }
    });
}

function getFileIcon(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const iconMap = {
        vue: 'pi-file-code',
        js: 'pi-file-code',
        ts: 'pi-file-code',
        jsx: 'pi-file-code',
        tsx: 'pi-file-code',
        json: 'pi-file-code',
        html: 'pi-file-code',
        css: 'pi-file-code',
        scss: 'pi-file-code',
        md: 'pi-file-edit',
        txt: 'pi-file-edit',
        pdf: 'pi-file-pdf',
        png: 'pi-image',
        jpg: 'pi-image',
        jpeg: 'pi-image',
        gif: 'pi-image',
        svg: 'pi-image'
    };
    return iconMap[ext] || 'pi-file';
}

function formatCommitHash(hash) {
    return hash ? hash.substring(0, 8) : '';
}
</script>

<template>
    <div class="card">
        <DataTable
            ref="recordDataTable"
            v-model:filters="filters"
            v-model:selection="selectedRecords"
            :value="records"
            :lazy="true"
            :totalRecords="total"
            :rows="rows"
            :loading="false"
            :paginator="true"
            :rowsPerPageOptions="[10, 25, 50, 100]"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :currentPageReportTemplate="t('common.messages.showing_entries', { first: '{first}', last: '{last}', totalRecords: '{totalRecords}' })"
            :globalFilterFields="['file_name', 'file_path', 'commit_message', 'author_name']"
            dataKey="id"
            filterDisplay="menu"
            :rowClass="() => ''"
            @page="onPage($event)"
            @sort="onSort($event)"
            @filter="onFilter($event)"
            class="p-datatable-sm"
            scrollable
            scrollHeight="calc(100vh - 250px)"
            :frozenValue="lockedRow"
        >
            <template #header>
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                        <h4 class="m-0 text-xl font-semibold">{{ t('commit.title') }}</h4>
                    </div>
                    <div class="flex items-center gap-2">
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" :placeholder="t('common.labels.search')" @keyup.enter="searchDone" />
                        </IconField>
                        <Button icon="pi pi-filter-slash" :label="t('common.labels.clear')" outlined @click="clearFilter()" />
                        <Button v-if="authStore.hasPermission('export_commits')" icon="pi pi-download" :label="t('common.labels.export')" severity="success" @click="exportCSV" />
                    </div>
                </div>
            </template>

            <template #empty>
                <div class="text-center text-gray-500">{{ t('common.messages.no_data') }}</div>
            </template>

            <Column selectionMode="multiple" headerStyle="width: 3rem" :frozen="frozenColumns.includes('selection')">
                <template #header>
                    <Button icon="pi pi-lock" text rounded size="small" @click="toggleColumnFrozen('selection')" :class="{ 'text-primary': frozenColumns.includes('selection') }" />
                </template>
            </Column>

            <Column v-for="col in selectedColumns" :key="col.field" :field="col.field" :header="col.header" :sortable="true" :frozen="frozenColumns.includes(col.field)">
                <template #header>
                    <div class="flex items-center gap-2">
                        <Button icon="pi pi-lock" text rounded size="small" @click="toggleColumnFrozen(col.field)" :class="{ 'text-primary': frozenColumns.includes(col.field) }" />
                        <span>{{ col.header }}</span>
                    </div>
                </template>

                <template #body="{ data }">
                    <template v-if="col.field === 'file_name'">
                        <div class="flex items-center gap-2">
                            <i :class="['pi', getFileIcon(data.file_name)]"></i>
                            <span>{{ data.file_name }}</span>
                        </div>
                    </template>
                    <template v-else-if="col.field === 'file_path'">
                        <span class="text-sm text-gray-600">{{ data.file_path }}</span>
                    </template>
                    <template v-else-if="col.field === 'commit_hash'">
                        <code class="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{{ formatCommitHash(data.commit_hash) }}</code>
                    </template>
                    <template v-else-if="col.field === 'commit_message'">
                        <span class="text-sm">{{ data.commit_message }}</span>
                    </template>
                    <template v-else-if="col.field === 'committed_at'">
                        <span :title="formatDate(data.committed_at)">{{ dayjs(data.committed_at).fromNow() }}</span>
                    </template>
                    <template v-else>
                        {{ data[col.field] }}
                    </template>
                </template>

                <template #filter="{ filterModel }">
                    <template v-if="col.field === 'committed_at'">
                        <DatePicker v-model="filterModel.value" dateFormat="yy-mm-dd" :placeholder="t('common.labels.select_date')" />
                    </template>
                    <template v-else>
                        <InputText v-model="filterModel.value" type="text" :placeholder="t('common.labels.search')" />
                    </template>
                </template>
            </Column>

            <Column :exportable="false" style="min-width: 8rem" :frozen="frozenColumns.includes('actions')" alignFrozen="right">
                <template #header>
                    <div class="flex items-center gap-2">
                        <Button icon="pi pi-lock" text rounded size="small" @click="toggleColumnFrozen('actions')" :class="{ 'text-primary': frozenColumns.includes('actions') }" />
                        <span>{{ t('common.columns.actions') }}</span>
                    </div>
                </template>
                <template #body="slotProps">
                    <div class="flex gap-2">
                        <Button icon="pi pi-eye" rounded text severity="info" @click="openFileDetail(slotProps.data)" v-tooltip.top="t('common.tooltips.view')" />
                    </div>
                </template>
            </Column>

            <template #footer>
                <div class="flex items-center justify-between">
                    <MultiSelect v-model="selectedColumns" :options="defaultColumns" optionLabel="header" :placeholder="t('common.labels.select_columns')" @update:modelValue="columnChanged" display="chip" class="w-full md:w-96" />
                </div>
            </template>
        </DataTable>
    </div>
</template>
