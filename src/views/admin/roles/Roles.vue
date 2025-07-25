<script setup>
import { useDynamicColumns } from '@/composables/useDynamicColumns';
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

onMounted(() => {
    loadLazyData();
    subscribeToEcho();
});

const loading = useLoading();
const lazyParams = ref({});
const total = ref();
const rows = ref();
const columnStore = useColumnStore();
const authStore = useAuthStore();
const confirm = useConfirm();
const dialog = useDialog();
const formComponent = defineAsyncComponent(() => import('./partials/Form.vue'));
const { showToast } = useShowToast();
const { t } = useI18n();
const recordDataTable = ref();
const records = ref();

const record = ref(null);
const selectedRecords = ref();

const defaultFields = ['name', 'guard_name', 'permissions'];
const defaultColumns = computed(() =>
    defaultFields.map((field) => ({
        field,
        header: t(`role.columns.${field}`)
    }))
);
const { selectedColumns, columnChanged, savedFields } = useDynamicColumns('rolesColumns', defaultFields, 'role.columns');
// const defaultFields = ['name', 'guard_name', 'permissions'];
// const defaultColumns = computed(() =>
//     defaultFields.map((field) => ({
//         field,
//         header: t(`role.columns.${field}`)
//     }))
// );
// const savedFields = ref(columnStore.getColumns('rolesColumns') || defaultFields);
// if (!columnStore.getColumns('rolesColumns')) {
//     columnStore.setColumns('rolesColumns', defaultFields);
// }
// const selectedColumns = computed(() =>
//     savedFields.value.map((field) => ({
//         field,
//         header: t(`role.columns.${field}`)
//     }))
// );
// const columnChanged = (newColumns) => {
//     savedFields.value = newColumns.map((col) => col.field);
//     columnStore.setColumns('rolesColumns', savedFields.value);
// };
const subscription = ref(null);

const allPermissions = ref(null);
const permissionsOptions = ref([], []);

const onPage = (event) => {
    loading.startDataLoading();
    lazyParams.value = extractLazyParams(event);
    loadLazyData();
};

const loadLazyData = debounce(async () => {
    lazyParams.value.page ? (lazyParams.value.page += 1) : resetPages();
    useRoleService
        .getRoles(lazyParams.value)
        .then((data) => {
            records.value = data.roles;
            total.value = data.meta.total;
            rows.value = data.meta.per_page;
            allPermissions.value = [data.permissions, []];
        })
        .catch((error) => {
            if (error?.response?.status === 419 || error?.response?.status === 401) {
                console.error('Session expired, redirecting to login');
            }
            console.error('Error fetching roles');
        })
        .finally(() => {
            loading.stopDataLoading();
        });
}, 150);

const resetPages = () => {
    lazyParams.value.page = 0;
};

const onSort = (event) => {
    loading.startDataLoading();
    lazyParams.value = extractLazyParams(event);
    resetPages();
    recordDataTable.value.resetPage();
    loadLazyData();
};

const filters = ref(getDefaultFilters());
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
    recordDataTable.value.resetPage();
    loadLazyData();
};

const searchDone = () => {
    loading.startDataLoading();
    lazyParams.value.filters = filters.value;
    resetPages();
    loadLazyData();
};

function subscribeToEcho() {
    subscription.value = Echo.private('data-stream.role').listen('DataStream', (event) => {
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
    }
}

function handleStore(event) {
    const exists = records.value.some((record) => record.id === event.data.id);
    if (!exists) {
        records.value.unshift(event.data);
    }
}

const lockedRow = ref([]);

const toggleLock = (data, frozen, index) => {
    if (frozen) {
        lockedRow.value = lockedRow.value.filter((c, i) => i !== index);
        records.value = [...records.value, data];
    } else {
        records.value = records.value.filter((c, i) => i !== index);
        lockedRow.value = [...lockedRow.value, data];
    }
    records.value.sort((val1, val2) => (val1.id < val2.id ? -1 : 1));
};

const frozenColumns = ref({
    name: false,
    guard_name: false,
    permissions: false
});

const toggleColumnFrozen = (column) => {
    frozenColumns.value = { ...frozenColumns.value, [column]: !frozenColumns.value[column] };
};

function addRecord() {
    record.value = { name: null, guard_name: null, permissions: [] };
    permissionsOptions.value = allPermissions.value;
    openDialog();
}
function editRecord(row) {
    record.value = row;
    permissionsOptions.value[1] = row.permissions;
    permissionsOptions.value[0] = allPermissions.value[0].filter((permission) => !permissionsOptions.value[1].some((sp) => sp.id === permission.id));
    openDialog();
}
const openDialog = () => {
    dialog.open(formComponent, {
        props: {
            header: t('common.titles.add', { entity: t('entity.role') }),
            style: {
                width: '30vw'
            },
            breakpoints: {
                '960px': '75vw',
                '640px': '90vw'
            },
            modal: true,
            maximizable: true
        },
        data: {
            record: record.value,
            permissionsOptions: permissionsOptions.value,
            action: record.value.id ? ACTIONS.EDIT : ACTIONS.CREATE
        },
        onClose: (result) => {
            if (result && result.data?.record?.id) {
                switch (result.data?.action) {
                    case ACTIONS.CREATE:
                        records.value.unshift(result.data.record);
                        showToast('success', ACTIONS.CREATE, 'role', 'tc');
                        break;
                    case ACTIONS.EDIT: {
                        const index = findRecordIndex(records, result.data.record.id);
                        records.value[index] = result.data.record;
                        showToast('success', ACTIONS.EDIT, 'role', 'tc');
                        break;
                    }
                    default:
                        console.error(`Unhandled action: ${result.action}`);
                }
            }
        }
    });
};

function confirmDeleteRecord(event, rolesIds) {
    confirm.require({
        modal: true,
        target: event.currentTarget,
        message: rolesIds.length > 1 ? t('common.confirmations.delete_selected.message', { entity: t('entity.roles') }) : t('common.confirmations.delete.message', { entity: t('entity.role') }),
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
                .deleteRoles(rolesIds)
                .then(() => {
                    rolesIds.forEach((id) => {
                        const index = findRecordIndex(records, id);
                        if (index !== -1) {
                            records.value.splice(index, 1);
                        }
                    });
                    showToast('success', ACTIONS.DELETE, 'role', 'tc');
                })
                .catch((error) => {
                    if (error?.response?.status === 419 || error?.response?.status === 401) {
                        console.error('Session expired, redirecting to login');
                    }
                    console.error('Error fetching roles');
                });
        }
    });
}

function exportCSV() {
    recordDataTable.value.exportCSV();
}

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
                @filter="onFilter($event)"
                v-model:filters="filters"
                filterDisplay="menu"
                :globalFilterFields="('id', defaultFields)"
                paginator
                @page="onPage($event)"
                :rows="rows"
                :totalRecords="total"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25, 50, 100]"
                :currentPageReportTemplate="t('common.paggination.showing_to_of_entity', { first: '{first}', last: '{last}', totalRecords: '{totalRecords}', entity: t('entity.roles') })"
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
                            {{ t('common.titles.manage', { entity: t('entity.roles') }) }}
                        </h2>
                        <Toolbar class="w-full">
                            <template #start>
                                <div class="flex space-x-2">
                                    <Button
                                        v-if="authStore.hasPermission('store_role')"
                                        v-tooltip.top="t('common.tooltips.add', { entity: t('entity.role') })"
                                        :label="t('common.labels.new')"
                                        icon="pi pi-plus"
                                        severity="primary"
                                        @click="addRecord"
                                        outlined
                                    />
                                    <Button
                                        v-if="authStore.hasPermission('delete_role')"
                                        v-tooltip.top="t('common.tooltips.delete_selected', { entity: t('entity.roles') })"
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
                                    <MultiSelect id="selected_columns" :modelValue="selectedColumns" :options="defaultColumns" optionLabel="header" @update:modelValue="columnChanged" />
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
                                        v-if="authStore.hasPermission('export_role')"
                                        v-tooltip.top="t('common.tooltips.export_selection', { entity: t('entity.roles') })"
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
                        <div class="flex justify-between w-full items-center">
                            <div :class="{ 'font-bold': frozenColumns.name }">{{ t('role.columns.name') }}</div>
                            <Button
                                v-tooltip.top="frozenColumns.name ? t('common.tooltips.unlock_column') : t('common.tooltips.lock_column')"
                                :icon="frozenColumns.name ? 'pi pi-lock' : 'pi pi-lock-open'"
                                text
                                @click="toggleColumnFrozen('name')"
                                severity="contrast"
                            />
                        </div>
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div :class="{ 'font-bold': frozenColumns.name }">{{ data.name }}</div></DataCell
                        >
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
                    columnKey="guard_name"
                    field="guard_name"
                    :frozen="frozenColumns.guard_name"
                    v-if="selectedColumns.some((column) => column.field === 'guard_name')"
                    sortable
                    class="min-w-32"
                >
                    <template #header>
                        <div class="flex justify-between w-full items-center">
                            <div :class="{ 'font-bold': frozenColumns.guard_name }">{{ t('role.columns.guard_name') }}</div>
                            <Button
                                v-tooltip.top="frozenColumns.guard_name ? t('common.tooltips.unlock_column') : t('common.tooltips.lock_column')"
                                :icon="frozenColumns.guard_name ? 'pi pi-lock' : 'pi pi-lock-open'"
                                text
                                @click="toggleColumnFrozen('guard_name')"
                                severity="contrast"
                            />
                        </div>
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div :class="{ 'font-bold': frozenColumns.guard_name }">{{ data.guard_name }}</div></DataCell
                        >
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <InputGroup>
                            <MultiSelect size="small" v-model="filterModel.value" :options="['api', 'sanctum', 'web']" @input="applyFilter()">
                                <template #option="slotProps">
                                    <div class="flex items-center gap-2">
                                        <span>{{ slotProps.option }}</span>
                                    </div>
                                </template>
                            </MultiSelect>
                            <InputGroupAddon>
                                <Button size="small" v-tooltip.top="t('common.labels.apply')" icon="pi pi-check" severity="primary" @click="applyFilter()" />
                                <Button size="small" v-tooltip.top="t('common.labels.clear', 'filter')" outlined icon="pi pi-times" severity="danger" @click="((filterModel.value = null), applyFilter())" />
                            </InputGroupAddon>
                        </InputGroup>
                    </template>
                </Column>
                <Column
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    :showClearButton="false"
                    :showApplyButton="false"
                    columnKey="permissions"
                    :frozen="frozenColumns.permissions"
                    v-if="selectedColumns.some((column) => column.field === 'permissions')"
                    field="permissions"
                    class="min-w-32"
                >
                    <template #header>
                        <div class="flex justify-between w-full items-center">
                            <div :class="{ 'font-bold': frozenColumns.permissions }">{{ t('role.columns.permissions') }}</div>
                            <Button
                                v-tooltip.top="frozenColumns.permissions ? t('common.tooltips.unlock_column') : t('common.tooltips.lock_column')"
                                :icon="frozenColumns.permissions ? 'pi pi-lock' : 'pi pi-lock-open'"
                                text
                                @click="toggleColumnFrozen('permissions')"
                                severity="contrast"
                            />
                        </div>
                    </template>
                    <template #body="{ data }">
                        <DataCell class="grid grid-cols-4 w-full">
                            <div v-for="permission in data.permissions" :key="permission.id" class="w-full">
                                <Tag severity="info" :value="permission.name" :class="{ 'font-bold': frozenColumns.permissions }" />
                            </div>
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <InputGroup>
                            <MultiSelect size="small" v-model="filterModel.value" :options="allPermissions[0]" optionLabel="name" optionValue="name">
                                <template #option="slotProps">
                                    <div class="flex items-center gap-2">
                                        <span>{{ slotProps.option.name }}</span>
                                    </div>
                                </template>
                            </MultiSelect>
                            <InputGroupAddon>
                                <Button size="small" v-tooltip.top="t('common.labels.apply')" icon="pi pi-check" severity="primary" @click="applyFilter()" />
                                <Button size="small" v-tooltip.top="t('common.labels.clear', 'filter')" outlined icon="pi pi-times" severity="danger" @click="((filterModel.value = null), applyFilter())" />
                            </InputGroupAddon>
                        </InputGroup>
                    </template>
                </Column>
                <Column columnKey="actions" :exportable="false" style="min-width: 12rem" :header="t('common.columns.actions')">
                    <template #body="{ data, frozenRow, index }">
                        <DataCell>
                            <div class="flex justify-between">
                                <div class="flex space-x-2">
                                    <Button v-if="authStore.hasPermission('view_role')" v-tooltip.top="t('common.tooltips.view', { entity: t('entity.role') })" icon="pi pi-eye" outlined rounded @click="editRecord(data)" severity="secondary" />
                                    <Button v-if="authStore.hasPermission('update_role')" v-tooltip.top="t('common.tooltips.edit', { entity: t('entity.role') })" icon="pi pi-pencil" outlined rounded @click="editRecord(data)" />
                                    <Button
                                        v-if="authStore.hasPermission('delete_role')"
                                        v-tooltip.top="$t('common.tooltips.delete', { entity: t('entity.role') })"
                                        icon="pi pi-trash"
                                        outlined
                                        rounded
                                        severity="danger"
                                        @click="confirmDeleteRecord($event, [data.id])"
                                    />
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
