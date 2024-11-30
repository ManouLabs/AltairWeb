<script setup>
import { useRoleService } from '@/services/useRoleService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useColumnStore } from '@/stores/useColumnStore';
import { useLoading } from '@/stores/useLoadingStore';
import { findRecordIndex } from '@/utilities/helper';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { FilterMatchMode } from '@primevue/core/api';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const loading = useLoading();
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

const defaultColumns = ref([
    { field: 'name', header: t('role.columns.name') },
    { field: 'guard_name', header: t('role.columns.guard_name') },
    { field: 'permissions', header: t('role.columns.permissions') }
]);

const selectedColumns = ref([]);
const subscription = ref(null);

const allPermissions = ref(null);
const permissionsOptions = ref([], []);

onMounted(() => {
    fetchData();
    subscribeToEcho();
    initializeColumns();
});

function fetchData() {
    loading.startDataLoading();
    useRoleService
        .getRoles()
        .then((data) => {
            records.value = data.roles;
            allPermissions.value = [data.permissions, []];
        })
        .catch((error) => {
            console.error(error);
            showToast('error', 'error', 'role', 'tc');
        })
        .finally(() => {
            loading.stopDataLoading();
        });
}

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
function initializeColumns() {
    selectedColumns.value = columnStore.getColumns('rolesColumns') || defaultColumns.value;
}
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    guard_name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    permissions: { value: null, matchMode: FilterMatchMode.STARTS_WITH }
});

const columnChanged = (newColumns) => {
    selectedColumns.value = newColumns;
    columnStore.setColumns('rolesColumns', newColumns);
};
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
        target: event.currentTarget,
        message: rolesIds.length > 1 ? t('common.confirmations.delete_selected.message', { entity: t('entity.roles') }) : t('common.confirmations.delete.message', { entity: t('entity.role') }),
        icon: 'pi pi-info-circle',
        rejectProps: {
            label: t('common.actions.cancel'),
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: t('common.actions.delete'),
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
                    console.error(error);
                    showToast('error', 'error', 'role', 'tc');
                });
        }
    });
}

function exportCSV() {
    recordDataTable.value.exportCSV();
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
                dataKey="id"
                v-model:selection="selectedRecords"
                :value="records"
                :filters="filters"
                removableSort
                resizableColumns
                columnResizeMode="fit"
                :reorderableColumns="true"
                :paginator="true"
                :rows="5"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                :currentPageReportTemplate="t('common.paggination.showing_to_of_entity', { first: '{first}', last: '{last}', totalRecords: '{totalRecords}', entity: t('entity.roles') })"
                :frozenValue="lockedRow"
                scrollable
                stripedRows
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
                                        :label="t('common.actions.new')"
                                        icon="pi pi-plus"
                                        severity="primary"
                                        @click="addRecord"
                                        outlined
                                    />
                                    <Button
                                        v-if="authStore.hasPermission('delete_role')"
                                        v-tooltip.top="t('common.tooltips.delete_selected', { entity: t('entity.roles') })"
                                        :label="t('common.actions.delete_selected')"
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
                                            <InputText id="global_search" v-model="filters['global'].value" />
                                            <label for="global_search">{{ t('common.placeholders.search') }}</label>
                                        </IconField>
                                    </FloatLabel>
                                    <Button
                                        v-if="authStore.hasPermission('export_role')"
                                        v-tooltip.top="t('common.tooltips.export_selection', { entity: t('entity.roles') })"
                                        :label="t('common.actions.export')"
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
                <Column columnKey="name" field="name" :frozen="frozenColumns.name" v-if="selectedColumns.some((column) => column.field === 'name')" sortable class="min-w-32">
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
                </Column>
                <Column columnKey="guard_name" field="guard_name" :frozen="frozenColumns.guard_name" v-if="selectedColumns.some((column) => column.field === 'guard_name')" sortable class="min-w-32">
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
                </Column>
                <Column columnKey="permissions" :frozen="frozenColumns.permissions" v-if="selectedColumns.some((column) => column.field === 'permissions')" field="permissions" sortable class="min-w-32">
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
                        <div v-for="permission in data.permissions" :key="permission.id">
                            <DataCell>
                                <Tag severity="info" :value="permission.name" :class="{ 'font-bold': frozenColumns.permissions }" />
                            </DataCell>
                        </div>
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
