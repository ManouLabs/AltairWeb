<script setup lang="ts">
import DataTableHighlightTag from '@/components/DataTableHighlightTag.vue';
import RowActionMenu from '@/components/common/RowActionMenu.vue';
import { useDataTable } from '@/composables/useDataTable';
import { useDynamicColumns } from '@/composables/useDynamicColumns';
import { useLock } from '@/composables/useLock';
import { useRowEffects } from '@/composables/useRowEffects';
import dayjs from '@/plugins/dayjs';
import { useUserService } from '@/services/useUserService';
import { useAuthStore } from '@/stores/useAuthStore';
import { findRecordIndex, formatDate } from '@/utilities/helper';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import type { User, Role } from '@/types/user';
import { FilterMatchMode } from '@primevue/core/api';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';

onMounted(() => {
    initialize();
    subscribeToEcho();
});

const defaultFiltersConfig = {
    id: FilterMatchMode.CONTAINS,
    name: FilterMatchMode.CONTAINS,
    email: FilterMatchMode.CONTAINS,
    email_verified_at: FilterMatchMode.DATE_IS,
    roles: {
        matchMode: FilterMatchMode.IN,
        relation: { name: 'roles', column: 'name' }
    },
    created_at: FilterMatchMode.DATE_IS,
    updated_at: FilterMatchMode.DATE_IS
};

const { total, rows, records, selectedRecords, recordDataTable, filters, onPage, onSort, onFilter, clearFilter, searchDone, exportCSV, initialize } = useDataTable(
    (params) =>
        useUserService.getUsers(params).then((data) => {
            allRoles.value = [data.roles, []];
            return {
                data: data.users,
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

const defaultFields = ['name', 'email', 'email_verified_at', 'roles', 'created_at', 'updated_at'];
const { lockedRow, toggleLock, frozenColumns, toggleColumnFrozen } = useLock(defaultFields, records);

const record = ref<User | null>(null);

const avatarColors: string[] = ['#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#9333EA'];

const hashString = (s: string | null | undefined): number => {
    if (!s) return 0;
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = (h << 5) - h + s.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
};

const getInitials = (name: string | null | undefined): string => {
    if (!name) return '';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
};

const getAvatarColor = (name: string | null | undefined): string => {
    const idx = hashString(name || '') % avatarColors.length;
    return avatarColors[idx];
};

interface Column {
    field: string;
    header: string;
}

const defaultColumns = computed<Column[]>(() =>
    defaultFields.map((field) => ({
        field,
        header: t(`user.columns.${field}`)
    }))
);

const { selectedColumns, columnChanged } = useDynamicColumns('usersColumns', defaultFields, 'user.columns');

const subscription = ref<any>(null);

const allRoles = ref<Role[][] | null>(null);
const rolesOptions = ref<Role[][]>([[], []]);

interface EchoEvent {
    action: string;
    data: User | number[];
}

function subscribeToEcho(): void {
    const usersChannel = Echo.private(`data-stream.users${authStore.user.account_id}`);
    subscription.value = usersChannel.listen('DataStream', (event: EchoEvent) => {
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
    const data = event.data as User;
    const index = findRecordIndex(records, data.id);
    if (index !== -1) {
        records.value[index] = data;
        markHighlight(data.id, 'updated');
    }
}

function handleStore(event: EchoEvent): void {
    const data = event.data as User;
    const exists = records.value.some((record: User) => record.id === data.id);
    if (!exists) {
        records.value.unshift(data);
        markHighlight(data.id, 'new');
    }
}

function addRecord(): void {
    record.value = { id: 0, name: '', email: '', password: null, password_confirmation: null, roles: [] } as unknown as User;
    rolesOptions.value = allRoles.value || [[], []];
    authStore.errors = {};
    openDialog();
}
function editRecord(row: User): void {
    authStore.errors = {};
    record.value = row;
    rolesOptions.value[1] = row.roles;
    rolesOptions.value[0] = allRoles.value?.[0]?.filter((role: Role) => !rolesOptions.value[1]?.some((sr: Role) => sr.id === role.id)) || [];
    openDialog();
}
const openDialog = () => {
    const isEdit = !!(record.value as User).id;
    dialog.open(formComponent, {
        props: {
            header: isEdit ? t('common.titles.edit', { entity: t('entity.user') }) : t('common.titles.add', { entity: t('entity.user') }),
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
            rolesOptions: rolesOptions.value,
            action: record.value.id ? ACTIONS.EDIT : ACTIONS.CREATE
        },
        onClose: (result) => {
            if (result && result.data?.record?.id) {
                switch (result.data?.action) {
                    case ACTIONS.CREATE:
                        records.value.unshift(result.data.record);
                        markHighlight(result.data.record.id, 'new');
                        showToast('success', ACTIONS.CREATE, 'user', 'tc');
                        break;
                    case ACTIONS.EDIT: {
                        const index = findRecordIndex(records, result.data.record.id);
                        records.value[index] = result.data.record;
                        markHighlight(result.data.record.id, 'updated');
                        showToast('success', ACTIONS.EDIT, 'user', 'tc');
                        break;
                    }
                    default:
                        console.error(`Unhandled action: ${result.action}`);
                }
            }
        }
    });
};

function confirmDeleteRecord(event: MouseEvent, usersIds: number[]): void {
    confirm.require({
        modal: true,
        target: event.currentTarget as HTMLElement,
        message: usersIds.length > 1 ? t('common.confirmations.delete_selected.message', { entity: t('entity.users') }) : t('common.confirmations.delete.message', { entity: t('entity.user') }),
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
            useUserService
                .deleteUsers(usersIds)
                .then(() => {
                    (async () => {
                        for (const id of usersIds) {
                            const index = findRecordIndex(records, id);
                            if (index !== -1) {
                                records.value.splice(index, 1);
                            }
                        }
                    })();
                    showToast('success', ACTIONS.DELETE, 'user', 'tc');
                })
                .catch((error: any) => {
                    if (error?.response?.status === 419 || error?.response?.status === 401) {
                        console.error('Session expired, redirecting to login');
                    }
                    console.error('Error deleting users');
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
                <h2>{{ t('common.titles.manage', { entity: t('entity.users') }) }}</h2>
                <p>{{ t('common.subtitles.manage', { entity: t('entity.users').toLowerCase() }) }}</p>
            </div>
            <div class="header-actions">
                <Button
                    v-if="authStore.hasPermission('export_users')"
                    v-tooltip.top="t('common.tooltips.export_selection', { entity: t('entity.users') })"
                    :label="t('common.labels.export')"
                    icon="pi pi-upload"
                    outlined
                    severity="info"
                    @click="exportCSV($event)"
                />
                <Button v-if="authStore.hasPermission('create_users')" v-tooltip.top="t('common.tooltips.add', { entity: t('entity.user') })" :label="'+ ' + t('common.labels.new') + ' ' + t('entity.user')" severity="primary" @click="addRecord" />
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
            :globalFilterFields="('id', defaultColumns.map((column) => column.field))"
            paginator
            @page="onPage($event)"
            :rows="rows"
            :totalRecords="total"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25, 50, 100]"
            :currentPageReportTemplate="t('common.paggination.showing_to_of_entity', { first: '{first}', last: '{last}', totalRecords: '{totalRecords}', entity: t('entity.users') })"
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
                <Toolbar class="w-full">
                    <template #start>
                        <div class="flex space-x-2">
                            <Button
                                v-if="authStore.hasPermission('delete_users')"
                                v-tooltip.top="t('common.tooltips.delete_selected', { entity: t('entity.users') })"
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
                            <MultiSelect id="selected_columns" :modelValue="selectedColumns" :options="defaultColumns" optionLabel="header" @update:modelValue="columnChanged" display="chip" :maxSelectedLabels="0" />
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
            <!-- <Column columnKey="id" field="id" header="ID" sortable class="min-w-32">
                    <template #body="{ data }">
                        <DataCell>{{ data.id }}</DataCell>
                    </template>
                </Column> -->
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
                        :text="t('user.columns.name')"
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
                            <div class="flex items-center gap-2">
                                <Avatar :label="getInitials(data.name)" shape="circle" :style="{ backgroundColor: getAvatarColor(data.name), color: '#fff' }" />
                                {{ data.name }}
                            </div>
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
            <Column
                :showClearButton="false"
                :showApplyButton="false"
                :showFilterMatchModes="false"
                :showFilterOperator="false"
                columnKey="email"
                field="email"
                :frozen="frozenColumns.email"
                v-if="selectedColumns.some((column) => column.field === 'email')"
                sortable
                class="min-w-32"
            >
                <template #header>
                    <HeaderCell
                        :text="t('user.columns.email')"
                        :frozen="frozenColumns.email"
                        :reorderTooltip="t('common.tooltips.reorder_columns')"
                        :lockTooltip="t('common.tooltips.lock_column')"
                        :unlockTooltip="t('common.tooltips.unlock_column')"
                        @toggle="toggleColumnFrozen('email')"
                    />
                </template>
                <template #body="{ data }">
                    <DataCell>
                        <div :class="{ 'font-bold': frozenColumns.email }">{{ data.email }}</div>
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
                columnKey="email_verified_at"
                field="email_verified_at"
                :frozen="frozenColumns.email_verified_at"
                v-if="selectedColumns.some((column) => column.field === 'email_verified_at')"
                sortable
                class="min-w-40"
            >
                <template #header>
                    <HeaderCell
                        :text="t('user.columns.email_verified_at')"
                        :frozen="frozenColumns.email_verified_at"
                        :reorderTooltip="t('common.tooltips.reorder_columns')"
                        :lockTooltip="t('common.tooltips.lock_column')"
                        :unlockTooltip="t('common.tooltips.unlock_column')"
                        @toggle="toggleColumnFrozen('email_verified_at')"
                    />
                </template>
                <template #body="{ data }">
                    <DataCell>
                        <div :class="{ 'font-bold': frozenColumns.email_verified_at }">
                            <span v-if="data.email_verified_at">{{ dayjs(data.email_verified_at).format('l') }}</span>
                            <Tag v-else :value="t('common.labels.not_verified')" severity="danger" />
                        </div>
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
                                <Button size="small" v-tooltip.top="t('common.labels.clear', 'filter')" outlined icon="pi pi-times" severity="danger" @click="((filterModel.value = null), applyFilter())" />
                            </InputGroupAddon>
                        </InputGroup>
                    </div>
                </template>
            </Column>
            <Column
                :showFilterMatchModes="false"
                :showFilterOperator="false"
                :showClearButton="false"
                :showApplyButton="false"
                columnKey="roles"
                :frozen="frozenColumns.roles"
                v-if="selectedColumns.some((column) => column.field === 'roles')"
                field="roles"
                class="min-w-32"
            >
                <template #header>
                    <div class="flex justify-between w-full items-center">
                        <div :class="{ 'font-bold': frozenColumns.roles }">{{ t('user.columns.roles') }}</div>
                        <Button
                            v-tooltip.top="frozenColumns.roles ? t('common.tooltips.unlock_column') : t('common.tooltips.lock_column')"
                            :icon="frozenColumns.roles ? 'pi pi-lock' : 'pi pi-lock-open'"
                            text
                            @click="toggleColumnFrozen('roles')"
                            severity="contrast"
                        />
                    </div>
                </template>
                <template #body="{ data }">
                    <DataCell class="grid grid-cols-4 w-full">
                        <div v-for="role in data.roles" :key="role.id">
                            <Tag icon="pi pi-shield" severity="info" :value="role.name" :class="{ 'font-bold': frozenColumns.roles }" />
                        </div>
                    </DataCell>
                </template>
                <template #filter="{ filterModel, applyFilter }">
                    <InputGroup>
                        <MultiSelect size="small" v-model="filterModel.value" :options="allRoles[0]" optionLabel="name" optionValue="name">
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
                                    { label: t('common.labels.view'), icon: 'pi pi-eye', command: () => editRecord(data), visible: authStore.hasPermission('view_users') },
                                    { label: t('common.labels.edit'), icon: 'pi pi-pencil', command: () => editRecord(data), visible: authStore.hasPermission('update_users') },
                                    { label: t('common.labels.delete'), icon: 'pi pi-trash', severity: 'danger', command: () => confirmDeleteRecord(null, [data.id]), visible: authStore.hasPermission('delete_users') }
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
