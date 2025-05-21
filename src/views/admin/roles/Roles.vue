<script setup>
import { useRoleService } from '@/services/useRoleService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useColumnStore } from '@/stores/useColumnStore';
import { useLoading } from '@/stores/useLoadingStore';
import { extractLazyParams, findRecordIndex } from '@/utilities/helper';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { FilterMatchMode } from '@primevue/core/api';
import debounce from 'lodash-es/debounce';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

// Services & Stores
const loading = useLoading();
const authStore = useAuthStore();
const columnStore = useColumnStore();
const confirm = useConfirm();
const dialog = useDialog();
const { t } = useI18n();
const { showToast } = useShowToast();

// Components
const formComponent = defineAsyncComponent(() => import('./partials/Form.vue'));

// Reactive state
const lazyParams = ref({});
const filters = ref(getDefaultFilters());
const records = ref([]);
const rows = ref();
const total = ref();
const selectedRecords = ref();
const record = ref(null);
const lockedRow = ref([]);
const subscription = ref(null);
const allPermissions = ref(null);
const permissionsOptions = ref([], []);
const recordDataTable = ref();

const defaultColumns = computed(() => [
    { field: 'name', header: t('role.columns.name') },
    { field: 'guard_name', header: t('role.columns.guard_name') },
    { field: 'permissions', header: t('role.columns.permissions') }
]);
const selectedColumns = ref([]);
const frozenColumns = ref({ name: false, guard_name: false, permissions: false });

// Lifecycle
onMounted(() => {
    loadLazyData();
    subscribeToEcho();
    initializeColumns();
});

onUnmounted(() => {
    if (subscription.value) subscription.value.stopListening('DataStream');
});

// Column persistence
function initializeColumns() {
    selectedColumns.value = columnStore.getColumns('rolesColumns') || defaultColumns.value;
}

function columnChanged(newColumns) {
    selectedColumns.value = newColumns;
    columnStore.setColumns('rolesColumns', newColumns);
}

// Lazy loading
const loadLazyData = debounce(async () => {
    lazyParams.value.page ? lazyParams.value.page++ : resetPages();
    useRoleService
        .getRoles(lazyParams.value)
        .then((data) => {
            records.value = data.roles;
            total.value = data.meta.total;
            rows.value = data.meta.per_page;
            allPermissions.value = [data.permissions, []];
        })
        .catch((error) => {
            console.error(error);
            showToast('error', 'error', 'role', 'tc');
        })
        .finally(() => loading.stopDataLoading());
}, 150);

function resetPages() {
    lazyParams.value.page = 0;
}

// Echo handlers
function subscribeToEcho() {
    subscription.value = Echo.private('data-stream.role').listen('DataStream', handleEchoEvent);
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
            console.warn(`Unhandled action: ${event.action}`);
    }
}

function handleDelete(event) {
    event.data.forEach((id) => {
        const index = findRecordIndex(records, id);
        if (index !== -1) records.value.splice(index, 1);
    });
}

function handleUpdate(event) {
    const index = findRecordIndex(records, event.data.id);
    if (index !== -1) records.value[index] = event.data;
}

function handleStore(event) {
    const exists = records.value.some((record) => record.id === event.data.id);
    if (!exists) records.value.unshift(event.data);
}

// Table events
function onPage(event) {
    loading.startDataLoading();
    lazyParams.value = extractLazyParams(event);
    loadLazyData();
}

function onSort(event) {
    loading.startDataLoading();
    lazyParams.value = extractLazyParams(event);
    resetPages();
    recordDataTable.value.resetPage();
    loadLazyData();
}

function onFilter(event) {
    loading.startDataLoading();
    lazyParams.value = extractLazyParams(event);
    resetPages();
    loadLazyData();
}

function clearFilter() {
    loading.startDataLoading();
    filters.value = getDefaultFilters();
    lazyParams.value = {};
    recordDataTable.value.resetPage();
    loadLazyData();
}

function searchDone() {
    loading.startDataLoading();
    lazyParams.value.filters = filters.value;
    resetPages();
    loadLazyData();
}

// Dialog handling
function addRecord() {
    record.value = { name: null, guard_name: null, permissions: [] };
    permissionsOptions.value = allPermissions.value;
    openDialog();
}

function editRecord(row) {
    record.value = row;
    permissionsOptions.value[1] = row.permissions;
    permissionsOptions.value[0] = allPermissions.value[0].filter((p) => !permissionsOptions.value[1].some((sp) => sp.id === p.id));
    openDialog();
}

function openDialog() {
    dialog.open(formComponent, {
        props: {
            header: t('common.titles.add', { entity: t('entity.role') }),
            style: { width: '30vw' },
            breakpoints: { '960px': '75vw', '640px': '90vw' },
            modal: true,
            maximizable: true
        },
        data: {
            record: record.value,
            permissionsOptions: permissionsOptions.value,
            action: record.value.id ? ACTIONS.EDIT : ACTIONS.CREATE
        },
        onClose: (result) => {
            if (result?.data?.record?.id) {
                const index = findRecordIndex(records, result.data.record.id);
                if (result.data.action === ACTIONS.CREATE) {
                    records.value.unshift(result.data.record);
                    showToast('success', ACTIONS.CREATE, 'role', 'tc');
                } else if (result.data.action === ACTIONS.EDIT && index !== -1) {
                    records.value[index] = result.data.record;
                    showToast('success', ACTIONS.EDIT, 'role', 'tc');
                }
            }
        }
    });
}

// Delete confirmation
function confirmDeleteRecord(event, roleIds) {
    confirm.require({
        modal: true,
        target: event.currentTarget,
        message: roleIds.length > 1 ? t('common.confirmations.delete_selected.message', { entity: t('entity.roles') }) : t('common.confirmations.delete.message', { entity: t('entity.role') }),
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
            useRoleService
                .deleteRoles(roleIds)
                .then(() => {
                    roleIds.forEach((id) => {
                        const index = findRecordIndex(records, id);
                        if (index !== -1) records.value.splice(index, 1);
                    });
                    showToast('success', ACTIONS.DELETE, 'role', 'tc');
                })
                .catch((error) => {
                    console.error(error);
                    showToast('error', 'error', 'role', 'tc');
                });
        }
    });
}

// Export
function exportCSV() {
    recordDataTable.value.exportCSV();
}

// Filters
function getDefaultFilters() {
    return {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        id: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { value: null, matchMode: FilterMatchMode.CONTAINS },
        guard_name: { value: null, matchMode: FilterMatchMode.IN },
        permissions: {
            value: null,
            matchMode: FilterMatchMode.IN,
            relation: { name: 'permissions', column: 'name' }
        }
    };
}
</script>

<template>
    <div>
        <div class="card">
            <DataTable
                ref="recordDataTable"
                lazy
                dataKey="id"
                :value="records"
                :totalRecords="total"
                :rows="rows"
                :filters="filters"
                v-model:selection="selectedRecords"
                filterDisplay="menu"
                :globalFilterFields="defaultColumns.map((c) => c.field)"
                :frozenValue="lockedRow"
                :sortField="'id'"
                :sortOrder="-1"
                :rowsPerPageOptions="[5, 10, 25, 50, 100]"
                scrollable
                stripedRows
                rowHover
                size="small"
                resizableColumns
                columnResizeMode="fit"
                reorderableColumns
                removableSort
                :pt="{
                    table: { style: 'min-width: 50rem' },
                    bodyrow: ({ props }) => ({ class: [{ 'font-bold': props.frozenRow }] })
                }"
                @page="onPage"
                @sort="onSort"
                @filter="onFilter"
                :paginator="true"
                :paginatorTemplate="'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown'"
                :currentPageReportTemplate="
                    t('common.paggination.showing_to_of_entity', {
                        first: '{first}',
                        last: '{last}',
                        totalRecords: '{totalRecords}',
                        entity: t('entity.roles')
                    })
                "
            >
                <!-- Header Toolbar -->
                <template #header>
                    <div class="flex items-center">
                        <h2 class="text-xl font-bold min-w-40">
                            {{ t('common.titles.manage', { entity: t('entity.roles') }) }}
                        </h2>

                        <Toolbar class="w-full">
                            <template #start>
                                <div class="flex space-x-2">
                                    <Button
                                        v-if="authStore.hasPermission('store_role')"
                                        icon="pi pi-plus"
                                        :label="t('common.labels.new')"
                                        severity="primary"
                                        outlined
                                        @click="addRecord"
                                        v-tooltip.top="t('common.tooltips.add', { entity: t('entity.role') })"
                                    />
                                    <Button
                                        v-if="authStore.hasPermission('delete_role')"
                                        icon="pi pi-trash"
                                        :label="t('common.labels.delete_selected')"
                                        severity="danger"
                                        outlined
                                        :disabled="!selectedRecords?.length"
                                        @click="
                                            confirmDeleteRecord(
                                                $event,
                                                selectedRecords.map((r) => r.id)
                                            )
                                        "
                                        v-tooltip.top="t('common.tooltips.delete_selected', { entity: t('entity.roles') })"
                                    />
                                    <Button icon="pi pi-filter-slash" :label="t('common.labels.clear_all_filters')" severity="secondary" outlined @click="clearFilter" v-tooltip.top="t('common.tooltips.clear_all_filters')" />
                                </div>
                            </template>

                            <template #center>
                                <FloatLabel class="w-full" variant="on">
                                    <MultiSelect id="selected_columns" :modelValue="selectedColumns" :options="defaultColumns" optionLabel="header" @update:modelValue="columnChanged" />
                                    <label for="selected_columns">{{ t('common.placeholders.displayed_columns') }}</label>
                                </FloatLabel>
                            </template>

                            <template #end>
                                <div class="flex items-center">
                                    <FloatLabel class="w-full" variant="on">
                                        <IconField>
                                            <InputIcon><i class="pi pi-search" /></InputIcon>
                                            <InputText id="global_search" v-model="filters.global.value" @keyup.enter="searchDone" />
                                            <label for="global_search">{{ t('common.placeholders.search') }}</label>
                                        </IconField>
                                    </FloatLabel>
                                    <Button
                                        v-if="authStore.hasPermission('export_role')"
                                        icon="pi pi-upload"
                                        :label="t('common.labels.export')"
                                        class="min-w-28 ml-2"
                                        outlined
                                        severity="info"
                                        @click="exportCSV"
                                        v-tooltip.top="t('common.tooltips.export_selection', { entity: t('entity.roles') })"
                                    />
                                </div>
                            </template>
                        </Toolbar>
                    </div>
                </template>

                <!-- Columns -->
                <Column selectionMode="multiple" style="width: 3rem" :exportable="false" />

                <Column field="id" header="ID" sortable class="min-w-32">
                    <template #body="{ data }"
                        ><DataCell>{{ data.id }}</DataCell></template
                    >
                </Column>

                <!-- Dynamic columns: name, guard_name, permissions -->
                <Column v-for="col in selectedColumns" :key="col.field" :field="col.field" :header="col.header" :sortable="true" :frozen="frozenColumns[col.field]" class="min-w-32">
                    <template #header>
                        <div class="flex justify-between items-center w-full">
                            <div :class="{ 'font-bold': frozenColumns[col.field] }">{{ col.header }}</div>
                            <Button
                                :icon="frozenColumns[col.field] ? 'pi pi-lock' : 'pi pi-lock-open'"
                                @click="toggleColumnFrozen(col.field)"
                                text
                                severity="contrast"
                                v-tooltip.top="frozenColumns[col.field] ? t('common.tooltips.unlock_column') : t('common.tooltips.lock_column')"
                            />
                        </div>
                    </template>

                    <template #body="{ data }">
                        <DataCell>
                            <div v-if="col.field === 'permissions'" class="grid grid-cols-4 gap-2">
                                <Tag v-for="perm in data.permissions" :key="perm.id" severity="info" :value="perm.name" :class="{ 'font-bold': frozenColumns.permissions }" />
                            </div>
                            <div v-else :class="{ 'font-bold': frozenColumns[col.field] }">
                                {{ data[col.field] }}
                            </div>
                        </DataCell>
                    </template>
                </Column>

                <!-- Actions Column -->
                <Column :exportable="false" :header="t('common.columns.actions')" style="min-width: 12rem">
                    <template #body="{ data, frozenRow, index }">
                        <DataCell>
                            <div class="flex justify-between">
                                <div class="flex space-x-2">
                                    <Button v-if="authStore.hasPermission('view_role')" icon="pi pi-eye" outlined rounded severity="secondary" @click="editRecord(data)" v-tooltip.top="t('common.tooltips.view', { entity: t('entity.role') })" />
                                    <Button v-if="authStore.hasPermission('update_role')" icon="pi pi-pencil" outlined rounded @click="editRecord(data)" v-tooltip.top="t('common.tooltips.edit', { entity: t('entity.role') })" />
                                    <Button
                                        v-if="authStore.hasPermission('delete_role')"
                                        icon="pi pi-trash"
                                        outlined
                                        rounded
                                        severity="danger"
                                        @click="confirmDeleteRecord($event, [data.id])"
                                        v-tooltip.top="t('common.tooltips.delete', { entity: t('entity.role') })"
                                    />
                                </div>

                                <Button
                                    :icon="frozenRow ? 'pi pi-lock' : 'pi pi-lock-open'"
                                    text
                                    severity="contrast"
                                    @click="toggleLock(data, frozenRow, index)"
                                    v-tooltip.top="frozenRow ? t('common.tooltips.unlock_row') : t('common.tooltips.lock_row')"
                                />
                            </div>
                        </DataCell>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>
