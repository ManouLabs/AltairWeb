<script setup lang="ts">
import DataTableHighlightTag from '@/components/DataTableHighlightTag.vue';
import RowActionMenu from '@/components/common/RowActionMenu.vue';
import { useDataTable } from '@/composables/useDataTable';
import { useDynamicColumns } from '@/composables/useDynamicColumns';
import { useLock } from '@/composables/useLock';
import { useRowEffects } from '@/composables/useRowEffects';
import { useRoleService } from '@/services/useRoleService';
import { useAuthStore } from '@/stores/useAuthStore';
import { findRecordIndex } from '@/utilities/helper';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import type { RoleData, Permission } from '@/types/role';
import { FilterMatchMode } from '@primevue/core/api';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

onMounted(() => {
    initialize();
    if (filters.value?.permissions) {
        filters.value.permissions.relation = { name: 'permissions', column: 'name' };
    }
    subscribeToEcho();
});

const defaultFiltersConfig = {
    id: FilterMatchMode.CONTAINS,
    name: FilterMatchMode.CONTAINS,
    permissions: FilterMatchMode.IN
};

const { total, rows, records, selectedRecords, recordDataTable, filters, onPage, onSort, onFilter, clearFilter, searchDone, exportCSV, initialize } = useDataTable(
    (params: any) =>
        useRoleService.getRoles(params).then((data) => {
            allPermissions.value = [data.permissions, []];
            return {
                data: data.roles,
                meta: data.meta
            };
        }),
    defaultFiltersConfig
);

const authStore = useAuthStore();
const confirm = useConfirm();
const dialog = useDialog();
const formComponent = defineAsyncComponent(() => import('./partials/Form.vue'));
const { showToast } = useShowToast();
const { t } = useI18n();

const { highlights, markHighlight, getRowClass } = useRowEffects();
const defaultFields = ['name', 'permissions'];
const { lockedRow, toggleLock, frozenColumns, toggleColumnFrozen } = useLock(defaultFields, records);

const record = ref<RoleData | null>(null);

interface Column {
    field: string;
    header: string;
}

const defaultColumns = computed<Column[]>(() =>
    defaultFields.map((field) => ({
        field,
        header: t(`role.columns.${field}`)
    }))
);
const { selectedColumns, columnChanged } = useDynamicColumns('rolesColumns', defaultFields, 'role.columns');
const subscription = ref<any>(null);

const allPermissions = ref<Permission[][] | null>(null);
const permissionsOptions = ref<Permission[][]>([[], []]);

interface EchoEvent {
    action: string;
    data: RoleData | number[];
}

function subscribeToEcho(): void {
    const rolesChannel = Echo.private(`data-stream.roles${authStore.user.account_id}`);
    subscription.value = rolesChannel.listen('DataStream', (event: EchoEvent) => {
        handleEchoEvent(event);
    });
}

function handleEchoEvent(event: EchoEvent): void {
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

async function handleDelete(event: EchoEvent): Promise<void> {
    for (const id of event.data as number[]) {
        const index = findRecordIndex(records, id);
        if (index !== -1) {
            records.value.splice(index, 1);
        }
    }
}

function handleUpdate(event: EchoEvent): void {
    const data = event.data as RoleData;
    const index = findRecordIndex(records, data.id);
    if (index !== -1) {
        records.value[index] = data;
        markHighlight(data.id, 'updated');
    }
}

function handleStore(event: EchoEvent): void {
    const data = event.data as RoleData;
    const exists = records.value.some((record: RoleData) => record.id === data.id);
    if (!exists) {
        records.value.unshift(data);
        markHighlight(data.id, 'new');
    }
}

function addRecord(): void {
    record.value = { id: 0, name: '', permissions: [] } as RoleData;
    permissionsOptions.value = allPermissions.value || [[], []];
    authStore.errors = {};
    openDialog();
}
function editRecord(row: RoleData): void {
    authStore.errors = {};
    record.value = row;
    permissionsOptions.value[1] = row.permissions;
    permissionsOptions.value[0] = allPermissions.value?.[0]?.filter((permission: Permission) => !permissionsOptions.value[1]?.some((sp: Permission) => sp.id === permission.id)) || [];
    openDialog();
}
const openDialog = (): void => {
    const isEdit = !!(record.value as RoleData)?.id;
    dialog.open(formComponent, {
        props: {
            header: isEdit ? t('common.titles.edit', { entity: t('entity.role') }) : t('common.titles.add', { entity: t('entity.role') }),
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
            action: record.value?.id ? ACTIONS.EDIT : ACTIONS.CREATE
        },
        onClose: (result: any) => {
            if (result && result.data?.record?.id) {
                switch (result.data?.action) {
                    case ACTIONS.CREATE:
                        records.value.unshift(result.data.record);
                        markHighlight(result.data.record.id, 'new');
                        showToast('success', ACTIONS.CREATE, 'role', 'tc');
                        break;
                    case ACTIONS.EDIT: {
                        const index = findRecordIndex(records, result.data.record.id);
                        records.value[index] = result.data.record;
                        markHighlight(result.data.record.id, 'updated');
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

function confirmDeleteRecord(event: MouseEvent | null, rolesIds: number[]): void {
    confirm.require({
        modal: true,
        target: event?.currentTarget as HTMLElement | undefined,
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
                    (async () => {
                        for (const id of rolesIds) {
                            const index = findRecordIndex(records, id);
                            if (index !== -1) {
                                records.value.splice(index, 1);
                            }
                        }
                    })();
                    showToast('success', ACTIONS.DELETE, 'role', 'tc');
                })
                .catch((error: any) => {
                    if (error?.response?.status === 419 || error?.response?.status === 401) {
                        console.error('Session expired, redirecting to login');
                    }
                    console.error('Error deleting roles');
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
        <div class="datatable-page-header">
            <div>
                <h2>{{ t('common.titles.manage', { entity: t('entity.roles') }) }}</h2>
                <p>{{ t('common.subtitles.manage', { entity: t('entity.roles').toLowerCase() }) }}</p>
            </div>
            <div class="header-actions">
                <Button
                    v-if="authStore.hasPermission('export_roles')"
                    v-tooltip.top="t('common.tooltips.export_selection', { entity: t('entity.roles') })"
                    :label="t('common.labels.export')"
                    icon="pi pi-upload"
                    outlined
                    severity="info"
                    @click="exportCSV($event)"
                />
                <Button v-if="authStore.hasPermission('create_roles')" v-tooltip.top="t('common.tooltips.add', { entity: t('entity.role') })" :label="'+ ' + t('common.labels.new') + ' ' + t('entity.role')" severity="primary" @click="addRecord" />
            </div>
        </div>
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
            :globalFilterFields="['id', ...defaultFields]"
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
            rowHover
            size="small"
            :pt="{
                table: { style: 'min-width: 50rem' },
                bodyrow: ({ props }: { props: { frozenRow?: boolean } }) => ({
                    class: [{ 'font-bold': props.frozenRow }]
                })
            }"
        >
            <template #header>
                <Toolbar class="w-full">
                    <template #start>
                        <div class="flex space-x-2">
                            <Button
                                v-if="authStore.hasPermission('delete_roles')"
                                v-tooltip.top="t('common.tooltips.delete_selected', { entity: t('entity.roles') })"
                                :label="t('common.labels.delete_selected')"
                                icon="pi pi-trash"
                                severity="danger"
                                @click="
                                    confirmDeleteRecord(
                                        $event,
                                        selectedRecords.map((record: RoleData) => record.id)
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
                        <FloatLabel class="w-full" variant="on">
                            <IconField>
                                <InputIcon>
                                    <i class="pi pi-search" />
                                </InputIcon>
                                <InputText id="global_search" v-model="filters['global'].value" @keyup.enter="searchDone" @input="searchDone" />
                                <label for="global_search">{{ t('common.placeholders.search') }}</label>
                            </IconField>
                        </FloatLabel>
                    </template>
                </Toolbar>
            </template>
            <Column columnKey="select" selectionMode="multiple" style="width: 3rem" :exportable="false" :reorderableColumn="false" />
            <!-- ID column removed (hard-coded or not needed) -->
            <Column
                :showClearButton="false"
                :showApplyButton="false"
                :showFilterMatchModes="false"
                :showFilterOperator="false"
                columnKey="name"
                field="name"
                :frozen="frozenColumns.name"
                v-if="selectedColumns.some((column: Column) => column.field === 'name')"
                sortable
                class="min-w-32"
            >
                <template #header>
                    <HeaderCell
                        :text="t('role.columns.name')"
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
                            <div class="flex items-center gap-2"><i class="pi pi-shield"></i> {{ data.name }}</div>
                            <DataTableHighlightTag v-if="highlights[data.id]" :state="highlights[data.id]" />
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
            <!-- guard_name column removed (hard-coded on server) -->
            <Column
                :showFilterMatchModes="false"
                :showFilterOperator="false"
                :showClearButton="false"
                :showApplyButton="false"
                columnKey="permissions"
                :frozen="frozenColumns.permissions"
                v-if="selectedColumns.some((column: Column) => column.field === 'permissions')"
                field="permissions"
                class="min-w-32"
            >
                <template #header>
                    <HeaderCell
                        :text="t('role.columns.permissions')"
                        :frozen="frozenColumns.permissions"
                        :reorderTooltip="t('common.tooltips.reorder_columns')"
                        :lockTooltip="t('common.tooltips.lock_column')"
                        :unlockTooltip="t('common.tooltips.unlock_column')"
                        @toggle="toggleColumnFrozen('permissions')"
                    />
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
                        <MultiSelect size="small" v-model="filterModel.value" :options="allPermissions?.[0] || []" optionLabel="name" optionValue="name">
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
            <Column columnKey="actions" :exportable="false" style="min-width: 5rem" :header="t('common.columns.actions')">
                <template #body="{ data, frozenRow, index }">
                    <DataCell>
                        <div class="flex items-center justify-center gap-1">
                            <RowActionMenu
                                :actions="[
                                    { label: t('common.labels.view'), icon: 'pi pi-eye', command: () => editRecord(data), visible: authStore.hasPermission('view_roles') },
                                    { label: t('common.labels.edit'), icon: 'pi pi-pencil', command: () => editRecord(data), visible: authStore.hasPermission('update_roles') },
                                    { label: t('common.labels.delete'), icon: 'pi pi-trash', severity: 'danger', command: () => confirmDeleteRecord(null, [data.id]), visible: authStore.hasPermission('delete_roles') }
                                ]"
                            />
                            <Button
                                v-tooltip.top="frozenRow ? t('common.tooltips.unlock_row') : t('common.tooltips.lock_row')"
                                :icon="frozenRow ? 'pi pi-lock' : 'pi pi-lock-open'"
                                text
                                rounded
                                size="small"
                                @click="toggleLock(data, frozenRow, index)"
                                severity="secondary"
                            />
                        </div>
                    </DataCell>
                </template>
            </Column>
        </DataTable>
    </div>
</template>
