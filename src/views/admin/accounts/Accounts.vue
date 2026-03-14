<script setup lang="ts">
import BulkActionBar from '@/components/BulkActionBar.vue';
import DataTableHighlightTag from '@/components/DataTableHighlightTag.vue';
import RowActionMenu from '@/components/common/RowActionMenu.vue';
import { useDataTable } from '@/composables/useDataTable';
import { useDynamicColumns } from '@/composables/useDynamicColumns';
import { useLock } from '@/composables/useLock';
import { useRowEffects } from '@/composables/useRowEffects';
import dayjs from '@/plugins/dayjs';
import { useAccountService } from '@/services/useAccountService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { findRecordIndex, formatDate } from '@/utilities/helper';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { FilterMatchMode } from '@primevue/core/api';
import { useConfirm } from 'primevue/useconfirm';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import DataTableSkeleton from '@/components/DataTableSkeleton.vue';

onMounted(() => {
    initialize();
    subscribeToEcho();
});

const defaultFiltersConfig = {
    id: FilterMatchMode.CONTAINS,
    legal_name: FilterMatchMode.CONTAINS,
    trade_name: FilterMatchMode.CONTAINS,
    primary_contact: FilterMatchMode.CONTAINS,
    main_address: FilterMatchMode.CONTAINS,
    tax_details: FilterMatchMode.CONTAINS,
    created_at: FilterMatchMode.DATE_IS,
    updated_at: FilterMatchMode.DATE_IS
};
const dataLoaded = ref(false);
const { total, rows, records, selectedRecords, recordDataTable, filters, onPage, onSort, onFilter, clearFilter, searchDone, exportCSV, initialize } = useDataTable(
    (params: any) =>
        useAccountService.getAccounts(params).then((data: any) => {
            dataLoaded.value = true;
            return {
                data: data.accounts,
                meta: data.meta
            };
        }),
    defaultFiltersConfig
);

const authStore = useAuthStore();
const confirm = useConfirm();
const router = useRouter();
const { showToast } = useShowToast();
const { t } = useI18n();
const loading = useLoading();

const { highlights, markHighlight, getRowClass } = useRowEffects();

const defaultFields = ['legal_name', 'trade_name', 'primary_contact', 'main_address', 'tax_details'];

const getPrimaryContact = (data: any) => {
    return data.contacts?.[0] || null;
};

const getContactMethod = (contact: any) => {
    if (!contact?.contactMethods?.length) return null;
    return contact.contactMethods[0];
};

const getMainAddress = (data: any) => {
    if (!data.addresses?.length) return null;
    return data.addresses.find((addr: any) => addr.main) || data.addresses[0];
};

const avatarColors = ['#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#9333EA'];

const hashString = (s: string) => {
    if (!s) return 0;
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = (h << 5) - h + s.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
};

const getInitials = (name: string | null) => {
    if (!name) return '';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
};

const getAvatarColor = (name: string | null) => {
    const idx = hashString(name || '') % avatarColors.length;
    return avatarColors[idx];
};
const { lockedRow, toggleLock, frozenColumns, toggleColumnFrozen } = useLock(defaultFields, records);

const defaultColumns = computed(() =>
    defaultFields.map((field: string) => ({
        field,
        header: t(`account.columns.${field}`)
    }))
);

const { selectedColumns, columnChanged } = useDynamicColumns('accountsColumns', defaultFields, 'account.columns');
const subscription = ref<any>(null);

function subscribeToEcho() {
    subscription.value = (window as any).Echo.private('data-stream.accounts').listen('DataStream', (event: any) => {
        handleEchoEvent(event);
    });
}

function handleEchoEvent(event: any) {
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

function handleDelete(event: any) {
    event.data.forEach((id: any) => {
        const index = findRecordIndex(records, id);
        if (index !== -1) {
            records.value.splice(index, 1);
        }
    });
}

function handleUpdate(event: any) {
    const index = findRecordIndex(records, event.data.id);
    if (index !== -1) {
        records.value[index] = event.data;
        markHighlight(event.data.id, 'updated');
    }
}

function handleStore(event: any) {
    const exists = records.value.some((record: any) => record.id === event.data.id);
    if (!exists) {
        records.value.unshift(event.data);
        markHighlight(event.data.id, 'new');
    }
}

function addRecord() {
    router.push({ name: 'account-create' });
}

function editRecord(row: any) {
    router.push({ name: 'account-edit', params: { id: row.id } });
}

function confirmDeleteRecord(event: MouseEvent | null, accountIds: number[]): void {
    confirm.require({
        modal: true,
        target: event?.currentTarget as HTMLElement,
        message: accountIds.length > 1 ? t('common.confirmations.delete_selected.message', { entity: t('entity.accounts') }) : t('common.confirmations.delete.message', { entity: t('entity.account') }),
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
            useAccountService
                .deleteAccounts(accountIds)
                .then(() => {
                    accountIds.forEach((id: any) => {
                        const index = findRecordIndex(records, id);
                        if (index !== -1) {
                            records.value.splice(index, 1);
                        }
                    });
                    showToast('success', ACTIONS.DELETE, 'account', 'tc');
                })
                .catch((error: any) => {
                    if (error?.response?.status === 419 || error?.response?.status === 401) {
                        console.error('Session expired, redirecting to login');
                    }
                    console.error('Error deleting accounts');
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
        <PageHeader icon="pi pi-users" icon-color="#8B5CF6" :title="t('common.titles.manage', { entity: t('entity.accounts') })" :description="t('common.subtitles.manage', { entity: t('entity.accounts').toLowerCase() })">
            <template #actions>
                <Button v-tooltip.top="t('common.tooltips.export_selection', { entity: t('entity.accounts') })" :label="t('common.labels.export')" icon="pi pi-upload" outlined severity="info" @click="exportCSV()" />
                <Button v-tooltip.top="t('common.tooltips.add', { entity: t('entity.account') })" :label="`+ ${t('common.labels.new')} ${t('entity.account')}`" severity="primary" :disabled="!dataLoaded" @click="addRecord" />
            </template>
        </PageHeader>
        <!-- Skeleton Loading State -->
        <DataTableSkeleton v-if="!dataLoaded" :columns="6" />
        <template v-else>
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
                :globalFilterFields="['id', ...defaultColumns.map((column) => column.field)]"
                paginator
                @page="onPage($event)"
                :rows="rows"
                :totalRecords="total"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25, 50, 100]"
                :currentPageReportTemplate="t('common.paggination.showing_to_of_entity', { first: '{first}', last: '{last}', totalRecords: '{totalRecords}', entity: t('entity.account') })"
                resizableColumns
                columnResizeMode="expand"
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
                    bodyrow: ({ props }: any) => ({
                        class: [{ 'font-bold': props.frozenRow }]
                    })
                }"
            >
                <template #header>
                    <Toolbar class="w-full">
                        <template #start>
                            <div class="flex space-x-2">
                                <Button v-tooltip.top="t('common.tooltips.clear_all_filters')" severity="secondary" type="button" icon="pi pi-filter-slash" :label="t('common.labels.clear_all_filters')" outlined @click="clearFilter()" />
                            </div>
                        </template>
                        <template #center>
                            <FloatLabel class="w-full" variant="on">
                                <MultiSelect id="selected_columns" :modelValue="selectedColumns" display="chip" :maxSelectedLabels="0" :options="defaultColumns" optionLabel="header" @update:modelValue="columnChanged" />
                                <label for="selected_columns">{{ t('common.placeholders.displayed_columns') }}</label>
                            </FloatLabel>
                        </template>
                        <template #end>
                            <FloatLabel class="w-full" variant="on">
                                <IconField>
                                    <InputIcon>
                                        <i class="pi pi-search" />
                                    </InputIcon>
                                    <InputText id="global_search" v-model="filters['global'].value" @keyup.enter="searchDone" />
                                    <label for="global_search">{{ t('common.placeholders.search') }}</label>
                                </IconField>
                            </FloatLabel>
                        </template>
                    </Toolbar>
                </template>
                <Column columnKey="select" selectionMode="multiple" style="width: 3rem" :exportable="false" :reorderableColumn="false" />
                <Column
                    :showClearButton="false"
                    :showApplyButton="false"
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    columnKey="legal_name"
                    field="legal_name"
                    :frozen="frozenColumns.legal_name"
                    v-if="selectedColumns.some((column: any) => column.field === 'legal_name')"
                    sortable
                    class="min-w-32"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('account.columns.legal_name')"
                            :frozen="frozenColumns.legal_name"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('legal_name')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div class="flex items-center gap-2" :class="{ 'font-bold': frozenColumns.legal_name || highlights[data.id] }">
                                <Avatar :label="getInitials(data.trade_name || data.legal_name)" shape="circle" :style="{ backgroundColor: getAvatarColor(data.trade_name || data.legal_name), color: '#fff' }" class="shrink-0" />
                                <span>{{ data.legal_name }}</span>
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
                    columnKey="trade_name"
                    field="trade_name"
                    :frozen="frozenColumns.trade_name"
                    v-if="selectedColumns.some((column: any) => column.field === 'trade_name')"
                    sortable
                    class="min-w-32"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('account.columns.trade_name')"
                            :frozen="frozenColumns.trade_name"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('trade_name')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div :class="{ 'font-bold': frozenColumns.trade_name }">{{ data.trade_name }}</div></DataCell
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

                <!-- Primary Contact Column -->
                <Column columnKey="primary_contact" field="primary_contact" :frozen="frozenColumns.primary_contact" v-if="selectedColumns.some((column: any) => column.field === 'primary_contact')" class="min-w-48">
                    <template #header>
                        <HeaderCell
                            :text="t('account.columns.primary_contact')"
                            :frozen="frozenColumns.primary_contact"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('primary_contact')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div v-if="getPrimaryContact(data)" class="flex items-center gap-2.5">
                                <Avatar
                                    :label="getInitials(getPrimaryContact(data).first_name + ' ' + getPrimaryContact(data).last_name)"
                                    shape="circle"
                                    :style="{ backgroundColor: getAvatarColor(getPrimaryContact(data).first_name + ' ' + getPrimaryContact(data).last_name), color: '#fff' }"
                                    class="shrink-0"
                                />
                                <div class="flex flex-col">
                                    <span class="font-semibold text-surface-700 dark:text-surface-200 text-sm"> {{ getPrimaryContact(data).civility }}. {{ getPrimaryContact(data).first_name }} {{ getPrimaryContact(data).last_name }} </span>
                                    <span v-if="getContactMethod(getPrimaryContact(data))" class="text-xs text-surface-400">
                                        {{ getContactMethod(getPrimaryContact(data)).value }}
                                    </span>
                                </div>
                            </div>
                            <span v-else class="text-surface-400">—</span>
                        </DataCell>
                    </template>
                </Column>

                <!-- Main Address Column -->
                <Column columnKey="main_address" field="main_address" :frozen="frozenColumns.main_address" v-if="selectedColumns.some((column: any) => column.field === 'main_address')" class="min-w-44">
                    <template #header>
                        <HeaderCell
                            :text="t('account.columns.main_address')"
                            :frozen="frozenColumns.main_address"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('main_address')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div v-if="getMainAddress(data)" class="flex flex-col gap-0.5 text-sm">
                                <span v-if="getMainAddress(data).street" class="text-surface-700 dark:text-surface-200">
                                    {{ getMainAddress(data).street }}
                                </span>
                                <span class="text-xs text-surface-400">
                                    <template v-if="getMainAddress(data).city">{{ getMainAddress(data).city.name }}</template>
                                    <template v-if="getMainAddress(data).city && getMainAddress(data).region">, </template>
                                    <template v-if="getMainAddress(data).region">{{ getMainAddress(data).region.name }}</template>
                                </span>
                            </div>
                            <span v-else class="text-surface-400">—</span>
                        </DataCell>
                    </template>
                </Column>

                <Column columnKey="tax_details" field="tax_details" :frozen="frozenColumns.tax_details" v-if="selectedColumns.some((column: any) => column.field === 'tax_details')" class="min-w-44">
                    <template #header>
                        <HeaderCell
                            :text="t('account.columns.tax_details')"
                            :frozen="frozenColumns.tax_details"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('tax_details')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div class="flex flex-col gap-0.5 text-sm" :class="{ 'font-bold': frozenColumns.tax_details }">
                                <div v-if="data.nif">
                                    <span class="text-surface-400 font-semibold">NIF:</span> <span class="text-surface-700 dark:text-surface-200">{{ data.nif }}</span>
                                </div>
                                <div v-if="data.rc_number">
                                    <span class="text-surface-400 font-semibold">RC:</span> <span class="text-surface-500 dark:text-surface-400">{{ data.rc_number }}</span>
                                </div>
                                <div v-if="data.nis">
                                    <span class="text-surface-400 font-semibold">NIS:</span> <span class="text-surface-500 dark:text-surface-400">{{ data.nis }}</span>
                                </div>
                                <div v-if="data.rib">
                                    <span class="text-surface-400 font-semibold">RIB:</span> <span class="text-surface-500 dark:text-surface-400">{{ data.rib }}</span>
                                </div>
                                <span v-if="!data.nif && !data.rc_number && !data.nis && !data.rib" class="text-surface-400">—</span>
                            </div>
                        </DataCell>
                    </template>
                </Column>

                <Column columnKey="actions" :exportable="false" style="min-width: 5rem" :header="t('common.columns.actions')">
                    <template #body="{ data, frozenRow, index }">
                        <DataCell>
                            <div class="flex items-center justify-center gap-1">
                                <RowActionMenu
                                    :actions="[
                                        { label: t('common.labels.view'), icon: 'pi pi-eye', command: () => editRecord(data), visible: authStore.hasPermission('view_accounts') },
                                        { label: t('common.labels.edit'), icon: 'pi pi-pencil', command: () => editRecord(data), visible: authStore.hasPermission('update_accounts') },
                                        { label: t('common.labels.delete'), icon: 'pi pi-trash', severity: 'danger', command: () => confirmDeleteRecord(null, [data.id]), visible: authStore.hasPermission('delete_accounts') }
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

            <BulkActionBar
                :selectedCount="selectedRecords.length"
                :entityLabel="t('entity.accounts').toLowerCase()"
                :actions="[]"
                @delete="
                    confirmDeleteRecord(
                        null,
                        selectedRecords.map((record: any) => record.id)
                    )
                "
            />
        </template>
    </div>
</template>
