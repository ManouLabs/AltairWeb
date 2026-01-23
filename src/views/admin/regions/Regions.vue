<script setup>
import { useDataTable } from '@/composables/useDataTable';
import { useDynamicColumns } from '@/composables/useDynamicColumns';
import { useLock } from '@/composables/useLock';
import { useRowEffects } from '@/composables/useRowEffects';
import dayjs from '@/plugins/dayjs';
import { useRegionService } from '@/services/useRegionService';
import { useAuthStore } from '@/stores/useAuthStore';
import { findRecordIndex, formatDate } from '@/utilities/helper';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { FilterMatchMode } from '@primevue/core/api';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

onMounted(() => {
    initialize();
    subscribeToEcho();
});

const { t } = useI18n();

// Filters configuration for regions
const defaultFiltersConfig = {
    id: FilterMatchMode.CONTAINS,
    name: FilterMatchMode.CONTAINS,
    name_fr: FilterMatchMode.CONTAINS,
    name_ar: FilterMatchMode.CONTAINS,
    code: FilterMatchMode.CONTAINS,
    created_at: FilterMatchMode.DATE_IS,
    updated_at: FilterMatchMode.DATE_IS
};

// Initialize DataTable composable with region service
const { total, rows, records, selectedRecords, recordDataTable, filters, onPage, onSort, onFilter, clearFilter, searchDone, exportCSV, initialize } = useDataTable(
    (params) =>
        useRegionService.getRegions(params).then((data) => ({
            data: data.regions,
            meta: data.meta
        })),
    defaultFiltersConfig
);

const authStore = useAuthStore();
const confirm = useConfirm();
const dialog = useDialog();
const formComponent = defineAsyncComponent(() => import('./partials/Form.vue'));
const { showToast } = useShowToast();

// Highlights
const { highlights, markHighlight, getRowClass } = useRowEffects();

// Row lock + column freezing
const defaultFields = ['name', 'name_fr', 'name_ar', 'code', 'created_at', 'updated_at'];
const { lockedRow, toggleLock, frozenColumns, toggleColumnFrozen } = useLock(defaultFields, records);

const record = ref(null);
const defaultColumns = computed(() =>
    defaultFields.map((field) => ({
        field,
        header: t(`region.columns.${field}`)
    }))
);

const { selectedColumns, columnChanged } = useDynamicColumns('regionsColumns', defaultFields, 'region.columns');
const subscription = ref(null);

function subscribeToEcho() {
    subscription.value = Echo.private('data-stream.region').listen('DataStream', (event) => {
        handleEchoEvent(event);
    });
}

function handleEchoEvent(event) {
    switch (event.action) {
        case ACTIONS.DELETE:
            handleDelete(event);
            break;
        case ACTIONS.UPDATE:
            handleUpdate(event);
            break;
        case ACTIONS.STORE:
            handleStore(event);
            break;
        default:
            console.error(`Unhandled action: ${event.action}`);
    }
}

function handleDelete(event) {
    event.data.forEach((id) => {
        const index = findRecordIndex(records, id);
        if (index !== -1) {
            records.value.splice(index, 1);
        }
    });
}

function handleUpdate(event) {
    const index = findRecordIndex(records, event.data.id);
    if (index !== -1) {
        records.value[index] = event.data;
        markHighlight(event.data.id, 'updated');
    }
}

function handleStore(event) {
    const exists = records.value.some((r) => r.id === event.data.id);
    if (!exists) {
        records.value.unshift(event.data);
        markHighlight(event.data.id, 'new');
    }
}

function addRecord() {
    authStore.errors = {};
    record.value = {
        name: '',
        name_ar: '',
        name_fr: '',
        code: null,
        longitude: null,
        latitude: null
    };
    openDialog();
}
function editRecord(row) {
    authStore.errors = {};
    record.value = row;
    openDialog();
}
const openDialog = () => {
    dialog.open(formComponent, {
        props: {
            header: t('common.titles.add', { entity: t('entity.region') }),
            style: { width: '40vw' },
            breakpoints: { '960px': '75vw', '640px': '90vw' },
            modal: true,
            maximizable: true
        },
        data: {
            record: record.value,
            action: record.value.id ? ACTIONS.EDIT : ACTIONS.CREATE
        },
        onClose: (result) => {
            if (result && result.data?.record?.id) {
                switch (result.data?.action) {
                    case ACTIONS.CREATE:
                        records.value.unshift(result.data.record);
                        markHighlight(result.data.record.id, 'new');
                        showToast('success', ACTIONS.CREATE, 'region', 'tc');
                        break;
                    case ACTIONS.EDIT: {
                        const index = findRecordIndex(records, result.data.record.id);
                        records.value[index] = result.data.record;
                        markHighlight(result.data.record.id, 'updated');
                        showToast('success', ACTIONS.EDIT, 'region', 'tc');
                        break;
                    }
                    default:
                        console.error(`Unhandled action: ${result.action}`);
                }
            }
        }
    });
};

function confirmDeleteRecord(event, regionIds) {
    confirm.require({
        modal: true,
        target: event.currentTarget,
        message: regionIds.length > 1 ? t('common.confirmations.delete_selected.message', { entity: t('entity.regions') }) : t('common.confirmations.delete.message', { entity: t('entity.region') }),
        icon: 'pi pi-info-circle',
        rejectProps: {
            label: t('common.labels.cancel'),
            severity: 'secondary',
            icon: 'pi pi-times',
            tooltip: t('common.labels.cancel'),
            outlined: true
        },
        acceptProps: {
            label: t('common.labels.delete'),
            icon: 'pi pi-trash',
            severity: 'danger'
        },
        accept: () => {
            useRegionService
                .deleteRegions(regionIds)
                .then(() => {
                    regionIds.forEach((id) => {
                        const index = findRecordIndex(records, id);
                        if (index !== -1) {
                            records.value.splice(index, 1);
                        }
                    });
                    showToast('success', ACTIONS.DELETE, 'region', 'tc');
                })
                .catch((error) => {
                    if (error?.response?.status === 419 || error?.response?.status === 401) {
                        console.error('Session expired, redirecting to login');
                    }
                    console.error('Error deleting regions');
                });
        }
    });
}

onUnmounted(() => {
    if (subscription.value) {
        subscription.value.stopListening('DataStream');
    }
});
</script>

<template>
    <div>
        <div class="card">
            <DataTable
                ref="recordDataTable"
                lazy
                dataKey="id"
                v-model:selection="selectedRecords"
                :value="records"
                :rowClass="getRowClass"
                @filter="onFilter($event)"
                v-model:filters="filters"
                filterDisplay="menu"
                :globalFilterFields="('id', defaultColumns.map((column) => column.field))"
                paginator
                @page="onPage($event)"
                :rows="rows"
                :totalRecords="total"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25, 50, 100]"
                :currentPageReportTemplate="t('common.paggination.showing_to_of_entity', { first: '{first}', last: '{last}', totalRecords: '{totalRecords}', entity: t('entity.region') })"
                resizableColumns
                columnResizeMode="fit"
                reorderableColumns
                :frozenValue="lockedRow"
                sortField="id"
                :sortOrder="-1"
                @sort="onSort($event)"
                removableSort
                scrollable
                stripedRows
                rowHover
                size="small"
                :pt="{
                    table: { style: 'min-width: 50rem' },
                    bodyrow: ({ props }) => ({
                        class: [{ 'font-bold': props.frozenRow }]
                    })
                }"
            >
                <template #header>
                    <div class="flex items-center">
                        <h2 class="text-xl font-bold min-w-40">
                            {{ t('common.titles.manage', { entity: t('entity.region') }) }}
                        </h2>
                        <Toolbar class="w-full">
                            <template #start>
                                <div class="flex space-x-2">
                                    <Button v-tooltip.top="t('common.tooltips.add', { entity: t('entity.region') })" :label="t('common.labels.new')" icon="pi pi-plus" severity="primary" @click="addRecord" outlined />
                                    <Button
                                        v-tooltip.top="t('common.tooltips.delete_selected', { entity: t('entity.region') })"
                                        :label="t('common.labels.delete_selected')"
                                        icon="pi pi-trash"
                                        severity="danger"
                                        @click="
                                            confirmDeleteRecord(
                                                $event,
                                                selectedRecords.map((record) => record.id)
                                            )
                                        "
                                        outlined
                                        :disabled="!selectedRecords || !selectedRecords.length"
                                    />
                                    <Button v-tooltip.top="t('common.tooltips.clear_all_filters')" severity="secondary" type="button" icon="pi pi-filter-slash" :label="t('common.labels.clear_all_filters')" outlined @click="clearFilter()" />
                                </div>
                            </template>
                            <template #center>
                                <FloatLabel class="w-full" variant="on">
                                    <MultiSelect id="selected_columns" :modelValue="selectedColumns" display="chip" :maxSelectedLabels="4" :options="defaultColumns" optionLabel="header" @update:modelValue="columnChanged" />
                                    <label for="selected_columns">{{ t('common.placeholders.displayed_columns') }}</label>
                                </FloatLabel>
                            </template>
                            <template #end>
                                <div class="flex">
                                    <FloatLabel class="w-full" variant="on">
                                        <IconField>
                                            <InputIcon>
                                                <i class="pi pi-search" />
                                            </InputIcon>
                                            <InputText id="global_search" v-model="filters['global'].value" @keyup.enter="searchDone" />
                                            <label for="global_search">{{ t('common.placeholders.search') }}</label>
                                        </IconField>
                                    </FloatLabel>
                                    <Button
                                        v-tooltip.top="t('common.tooltips.export_selection', { entity: t('entity.region') })"
                                        :label="t('common.labels.export')"
                                        icon="pi pi-upload"
                                        class="min-w-28 ml-2"
                                        outlined
                                        severity="info"
                                        @click="exportCSV($event)"
                                    />
                                </div>
                            </template>
                        </Toolbar>
                    </div>
                </template>

                <Column columnKey="select" selectionMode="multiple" style="width: 3rem" :exportable="false" :reorderableColumn="false" />
                <Column columnKey="id" field="id" header="ID" sortable class="min-w-32">
                    <template #body="{ data }">
                        <DataCell>{{ data.id }}</DataCell>
                    </template>
                </Column>
                <Column
                    :showClearButton="false"
                    :showApplyButton="false"
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    columnKey="name"
                    field="name"
                    :frozen="frozenColumns.name"
                    v-if="selectedColumns.some((column) => column.field === 'name')"
                    sortable
                    class="min-w-32"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('region.columns.name')"
                            :frozen="frozenColumns.name"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('name')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div class="flex items-center gap-2" :class="{ 'font-bold': frozenColumns.name || highlights[data.id] }">
                                <span>{{ data.name }}</span>
                                <Tag v-if="highlights[data.id] === 'new'" value="NEW" severity="success" rounded size="small" />
                                <Tag v-else-if="highlights[data.id] === 'updated'" value="UPDATED" severity="info" rounded size="small" />
                            </div>
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <InputGroup>
                            <InputText v-model="filterModel.value" size="small" />
                            <InputGroupAddon>
                                <Button size="small" v-tooltip.top="t('common.labels.apply')" icon="pi pi-check" severity="primary" @click="applyFilter()" />
                                <Button :disabled="!filterModel.value" size="small" v-tooltip.top="t('common.labels.clear', 'filter')" outlined icon="pi pi-times" severity="danger" @click="((filterModel.value = null), applyFilter())" />
                            </InputGroupAddon>
                        </InputGroup>
                    </template>
                </Column>
                <Column
                    :showClearButton="false"
                    :showApplyButton="false"
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    columnKey="name_fr"
                    field="name_fr"
                    :frozen="frozenColumns.name_fr"
                    v-if="selectedColumns.some((column) => column.field === 'name_fr')"
                    sortable
                    class="min-w-32"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('region.columns.name_fr')"
                            :frozen="frozenColumns.name_fr"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('name_fr')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div :class="{ 'font-bold': frozenColumns.name_fr }">{{ data.name_fr }}</div>
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <InputGroup>
                            <InputText v-model="filterModel.value" size="small" />
                            <InputGroupAddon>
                                <Button size="small" v-tooltip.top="t('common.labels.apply')" icon="pi pi-check" severity="primary" @click="applyFilter()" />
                                <Button :disabled="!filterModel.value" size="small" v-tooltip.top="t('common.labels.clear', 'filter')" outlined icon="pi pi-times" severity="danger" @click="((filterModel.value = null), applyFilter())" />
                            </InputGroupAddon>
                        </InputGroup>
                    </template>
                </Column>
                <Column
                    :showClearButton="false"
                    :showApplyButton="false"
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    columnKey="name_ar"
                    field="name_ar"
                    :frozen="frozenColumns.name_ar"
                    v-if="selectedColumns.some((column) => column.field === 'name_ar')"
                    sortable
                    class="min-w-32"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('region.columns.name_ar')"
                            :frozen="frozenColumns.name_ar"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('name_ar')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div :class="{ 'font-bold': frozenColumns.name_ar }">{{ data.name_ar }}</div>
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <InputGroup>
                            <InputText v-model="filterModel.value" size="small" />
                            <InputGroupAddon>
                                <Button size="small" v-tooltip.top="t('common.labels.apply')" icon="pi pi-check" severity="primary" @click="applyFilter()" />
                                <Button :disabled="!filterModel.value" size="small" v-tooltip.top="t('common.labels.clear', 'filter')" outlined icon="pi pi-times" severity="danger" @click="((filterModel.value = null), applyFilter())" />
                            </InputGroupAddon>
                        </InputGroup>
                    </template>
                </Column>
                <Column
                    :showClearButton="false"
                    :showApplyButton="false"
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    columnKey="code"
                    field="code"
                    :frozen="frozenColumns.code"
                    v-if="selectedColumns.some((column) => column.field === 'code')"
                    sortable
                    class="min-w-32"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('region.columns.code')"
                            :frozen="frozenColumns.code"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('code')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div :class="{ 'font-bold': frozenColumns.code }">{{ data.code }}</div>
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <InputGroup>
                            <InputText v-model="filterModel.value" size="small" />
                            <InputGroupAddon>
                                <Button size="small" v-tooltip.top="t('common.labels.apply')" icon="pi pi-check" severity="primary" @click="applyFilter()" />
                                <Button :disabled="!filterModel.value" size="small" v-tooltip.top="t('common.labels.clear', 'filter')" outlined icon="pi pi-times" severity="danger" @click="((filterModel.value = null), applyFilter())" />
                            </InputGroupAddon>
                        </InputGroup>
                    </template>
                </Column>
                <Column
                    :showClearButton="false"
                    :showApplyButton="false"
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    dataType="date"
                    columnKey="created_at"
                    field="created_at"
                    :frozen="frozenColumns.created_at"
                    v-if="selectedColumns.some((column) => column.field === 'created_at')"
                    sortable
                    class="min-w-40"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('region.columns.created_at')"
                            :frozen="frozenColumns.created_at"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('created_at')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div :class="{ 'font-bold': frozenColumns.created_at }">{{ dayjs(data.created_at).format('l') }}</div>
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <div class="flex flex-col gap-2">
                            <Select
                                v-model="filterModel.matchMode"
                                :options="[
                                    { label: t('primevue.dateIs'), value: FilterMatchMode.DATE_IS },
                                    { label: t('primevue.dateBefore'), value: FilterMatchMode.DATE_BEFORE },
                                    { label: t('primevue.dateAfter'), value: FilterMatchMode.DATE_AFTER },
                                    { label: t('primevue.dateIsNot'), value: FilterMatchMode.DATE_IS_NOT }
                                ]"
                                optionLabel="label"
                                optionValue="value"
                                class="w-full"
                                placeholder="Filter Mode"
                            />
                            <InputGroup>
                                <DatePicker v-model="filterModel.value" dateFormat="yy-mm-dd" :showClear="false" :manualInput="false" @dateSelect="(e) => formatDate(e, filterModel)" />
                                <InputGroupAddon>
                                    <Button size="small" icon="pi pi-check" severity="primary" @click="applyFilter()" />
                                    <Button
                                        size="small"
                                        icon="pi pi-times"
                                        severity="danger"
                                        outlined
                                        :disabled="!filterModel.value"
                                        @click="
                                            (() => {
                                                filterModel.value = null;
                                                applyFilter();
                                            })()
                                        "
                                    />
                                </InputGroupAddon>
                            </InputGroup>
                        </div>
                    </template>
                </Column>
                <Column
                    :showClearButton="false"
                    :showApplyButton="false"
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    dataType="date"
                    columnKey="updated_at"
                    field="updated_at"
                    :frozen="frozenColumns.updated_at"
                    v-if="selectedColumns.some((column) => column.field === 'updated_at')"
                    sortable
                    class="min-w-40"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('region.columns.updated_at')"
                            :frozen="frozenColumns.updated_at"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('updated_at')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div :class="{ 'font-bold': frozenColumns.updated_at }">{{ dayjs(data.updated_at).format('l') }}</div>
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <div class="flex flex-col gap-2">
                            <Select
                                v-model="filterModel.matchMode"
                                :options="[
                                    { label: t('primevue.dateIs'), value: FilterMatchMode.DATE_IS },
                                    { label: t('primevue.dateBefore'), value: FilterMatchMode.DATE_BEFORE },
                                    { label: t('primevue.dateAfter'), value: FilterMatchMode.DATE_AFTER },
                                    { label: t('primevue.dateIsNot'), value: FilterMatchMode.DATE_IS_NOT }
                                ]"
                                optionLabel="label"
                                optionValue="value"
                                class="w-full"
                                placeholder="Filter Mode"
                            />
                            <InputGroup>
                                <DatePicker v-model="filterModel.value" :showClear="false" @dateSelect="(e) => formatDate(e, filterModel)" />
                                <InputGroupAddon>
                                    <Button size="small" icon="pi pi-check" severity="primary" @click="applyFilter()" />
                                    <Button
                                        size="small"
                                        icon="pi pi-times"
                                        severity="danger"
                                        outlined
                                        :disabled="!filterModel.value"
                                        @click="
                                            (() => {
                                                filterModel.value = null;
                                                applyFilter();
                                            })()
                                        "
                                    />
                                </InputGroupAddon>
                            </InputGroup>
                        </div>
                    </template>
                </Column>
                <Column columnKey="actions" :exportable="false" style="min-width: 12rem" :header="t('common.columns.actions')">
                    <template #body="{ data, frozenRow, index }">
                        <DataCell>
                            <div class="flex justify-between">
                                <div class="flex space-x-2">
                                    <Button v-tooltip.top="t('common.tooltips.view', { entity: t('entity.region') })" icon="pi pi-eye" outlined rounded @click="editRecord(data)" severity="secondary" />
                                    <Button v-tooltip.top="t('common.tooltips.edit', { entity: t('entity.region') })" icon="pi pi-pencil" outlined rounded @click="editRecord(data)" />
                                    <Button v-tooltip.top="$t('common.tooltips.delete', { entity: t('entity.region') })" icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteRecord($event, [data.id])" />
                                </div>
                                <Button
                                    v-tooltip.top="frozenRow ? t('common.tooltips.unlock_row') : t('common.tooltips.lock_row')"
                                    :icon="frozenRow ? 'pi pi-lock' : 'pi pi-lock-open'"
                                    text
                                    @click="toggleLock(data, frozenRow, index)"
                                    severity="contrast"
                                />
                            </div>
                        </DataCell>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>
