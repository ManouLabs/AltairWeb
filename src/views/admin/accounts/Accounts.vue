<script setup>
import { useDataTable } from '@/composables/useDataTable';
import { useDynamicColumns } from '@/composables/useDynamicColumns';
import { useLock } from '@/composables/useLock';
import { useRowEffects } from '@/composables/useRowEffects';
import dayjs from '@/plugins/dayjs';
import { useAccountService } from '@/services/useAccountService';
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

const defaultFiltersConfig = {
    id: FilterMatchMode.CONTAINS,
    legal_name: FilterMatchMode.CONTAINS,
    trade_name: FilterMatchMode.CONTAINS,
    rc_number: FilterMatchMode.CONTAINS,
    nif: FilterMatchMode.CONTAINS,
    nis: FilterMatchMode.CONTAINS,
    rib: FilterMatchMode.CONTAINS,
    plan: {
        matchMode: FilterMatchMode.IN,
        relation: { name: 'plan', column: 'name' }
    },
    active: FilterMatchMode.EQUALS,
    created_at: FilterMatchMode.DATE_IS,
    updated_at: FilterMatchMode.DATE_IS
};
const allPlans = ref(null);
const { total, rows, records, selectedRecords, recordDataTable, filters, onPage, onSort, onFilter, clearFilter, searchDone, exportCSV, initialize } = useDataTable(
    (params) =>
        useAccountService.getAccounts(params).then((data) => {
            allPlans.value = data.plans;
            return {
                data: data.accounts,
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

const defaultFields = ['legal_name', 'trade_name', 'rc_number', 'nif', 'nis', 'rib', 'plan', 'active', 'created_at', 'updated_at'];
const { lockedRow, toggleLock, frozenColumns, toggleColumnFrozen } = useLock(defaultFields, records);

const record = ref(null);
const defaultColumns = computed(() =>
    defaultFields.map((field) => ({
        field,
        header: t(`account.columns.${field}`)
    }))
);

const { selectedColumns, columnChanged } = useDynamicColumns('accountsColumns', defaultFields, 'account.columns');
const subscription = ref(null);

function subscribeToEcho() {
    subscription.value = Echo.private('data-stream.account').listen('DataStream', (event) => {
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
    const exists = records.value.some((record) => record.id === event.data.id);
    if (!exists) {
        records.value.unshift(event.data);
        markHighlight(event.data.id, 'new');
    }
}

function addRecord() {
    authStore.errors = {};
    record.value = {
        legal_name: null,
        trade_name: null,
        rc_number: null,
        nif: null,
        nis: null,
        rib: null,
        plan: null,
        active: true,
        contacts: [{ civility: null, first_name: '', last_name: '', contactMethods: [{ contact_id: null, type: 'mobile', value: '' }] }],
        addresses: [{ street: '', region: null, city: null, main: true }]
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
            header: t('common.titles.add', { entity: t('entity.account') }),
            style: {
                width: '40vw'
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
            planOptions: allPlans.value,
            action: record.value.id ? ACTIONS.EDIT : ACTIONS.CREATE
        },
        onClose: (result) => {
            if (result && result.data?.record?.id) {
                switch (result.data?.action) {
                    case ACTIONS.CREATE:
                        records.value.unshift(result.data.record);
                        markHighlight(result.data.record.id, 'new');
                        showToast('success', ACTIONS.CREATE, 'account', 'tc');
                        break;
                    case ACTIONS.EDIT: {
                        const index = findRecordIndex(records, result.data.record.id);
                        records.value[index] = result.data.record;
                        markHighlight(result.data.record.id, 'updated');
                        showToast('success', ACTIONS.EDIT, 'account', 'tc');
                        break;
                    }
                    default:
                        console.error(`Unhandled action: ${result.action}`);
                }
            }
        }
    });
};
function toggleActive(accountId) {
    useAccountService
        .toggleActiveAccount(accountId)
        .then((result) => {
            const index = findRecordIndex(records, accountId);
            records.value[index].active = !records.value[index].active;
            markHighlight(accountId, 'updated');
            showToast('success', ACTIONS.EDIT, 'account', 'tc');
        })
        .catch((error) => {
            if (error?.response?.status === 419 || error?.response?.status === 401) {
                console.error('Session expired, redirecting to login');
            }
            console.error('Error updating account status');
        });
}

function confirmDeleteRecord(event, accountIds) {
    confirm.require({
        modal: true,
        target: event.currentTarget,
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
                    accountIds.forEach((id) => {
                        const index = findRecordIndex(records, id);
                        if (index !== -1) {
                            records.value.splice(index, 1);
                        }
                    });
                    showToast('success', ACTIONS.DELETE, 'account', 'tc');
                })
                .catch((error) => {
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
                :currentPageReportTemplate="t('common.paggination.showing_to_of_entity', { first: '{first}', last: '{last}', totalRecords: '{totalRecords}', entity: t('entity.account') })"
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
                            {{ t('common.titles.manage', { entity: t('entity.account') }) }}
                        </h2>
                        <Toolbar class="w-full">
                            <template #start>
                                <div class="flex space-x-2">
                                    <Button v-tooltip.top="t('common.tooltips.add', { entity: t('entity.account') })" :label="t('common.labels.new')" icon="pi pi-plus" severity="primary" @click="addRecord" outlined />
                                    <Button
                                        v-tooltip.top="t('common.tooltips.delete_selected', { entity: t('entity.account') })"
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
                                        v-tooltip.top="t('common.tooltips.export_selection', { entity: t('entity.account') })"
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
                    columnKey="legal_name"
                    field="legal_name"
                    :frozen="frozenColumns.legal_name"
                    v-if="selectedColumns.some((column) => column.field === 'legal_name')"
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
                                <span>{{ data.legal_name }}</span>
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
                    columnKey="trade_name"
                    field="trade_name"
                    :frozen="frozenColumns.trade_name"
                    v-if="selectedColumns.some((column) => column.field === 'trade_name')"
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
                <Column
                    :showClearButton="false"
                    :showApplyButton="false"
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    columnKey="rc_number"
                    field="rc_number"
                    :frozen="frozenColumns.rc_number"
                    v-if="selectedColumns.some((column) => column.field === 'rc_number')"
                    sortable
                    class="min-w-32"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('account.columns.rc_number')"
                            :frozen="frozenColumns.rc_number"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('rc_number')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div :class="{ 'font-bold': frozenColumns.rc_number }">{{ data.rc_number }}</div>
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
                    columnKey="nif"
                    field="nif"
                    :frozen="frozenColumns.nif"
                    v-if="selectedColumns.some((column) => column.field === 'nif')"
                    sortable
                    class="min-w-32"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('account.columns.nif')"
                            :frozen="frozenColumns.nif"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('nif')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div :class="{ 'font-bold': frozenColumns.nif }">{{ data.nif }}</div>
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
                    columnKey="nis"
                    field="nis"
                    :frozen="frozenColumns.nis"
                    v-if="selectedColumns.some((column) => column.field === 'nis')"
                    sortable
                    class="min-w-32"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('account.columns.nis')"
                            :frozen="frozenColumns.nis"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('nis')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div :class="{ 'font-bold': frozenColumns.nis }">{{ data.nis }}</div>
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
                    columnKey="rib"
                    field="rib"
                    :frozen="frozenColumns.rib"
                    v-if="selectedColumns.some((column) => column.field === 'rib')"
                    sortable
                    class="min-w-32"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('account.columns.rib')"
                            :frozen="frozenColumns.rib"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('rib')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div :class="{ 'font-bold': frozenColumns.rib }">{{ data.rib }}</div>
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
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    :showClearButton="false"
                    :showApplyButton="false"
                    columnKey="plan"
                    :frozen="frozenColumns.plan"
                    v-if="selectedColumns.some((column) => column.field === 'plan')"
                    field="plan"
                    class="min-w-32"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('account.columns.plan')"
                            :frozen="frozenColumns.plan"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('plan')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <Tag :value="data.plan.name" severity="info" rounded size="small" :class="{ 'font-bold': frozenColumns.plan }" />
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <InputGroup>
                            <MultiSelect v-model="filterModel.value" :options="allPlans" optionLabel="name" optionValue="name" :placeholder="t('common.labels.select_plans')" class="w-full" size="small" display="chip" />
                            <InputGroupAddon>
                                <Button size="small" v-tooltip.top="t('common.labels.apply')" icon="pi pi-check" severity="primary" @click="applyFilter()" />
                                <Button :disabled="!filterModel.value" size="small" v-tooltip.top="t('common.labels.clear')" outlined icon="pi pi-times" severity="danger" @click="((filterModel.value = null), applyFilter())" />
                            </InputGroupAddon>
                        </InputGroup>
                    </template>
                </Column>
                <Column
                    :showClearButton="false"
                    :showApplyButton="false"
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    columnKey="active"
                    field="active"
                    :frozen="frozenColumns.active"
                    v-if="selectedColumns.some((column) => column.field === 'active')"
                    sortable
                    class="min-w-32"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('account.columns.active')"
                            :frozen="frozenColumns.active"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('active')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div class="flex items-center gap-2" :class="{ 'font-bold': frozenColumns.active }">
                                <Tag
                                    :value="data.active ? t('common.labels.active') : t('common.labels.inactive')"
                                    :severity="data.active ? 'success' : 'danger'"
                                    :icon="data.active ? 'pi pi-check-circle' : 'pi pi-times-circle'"
                                    rounded
                                    size="small"
                                    :pt="{ root: { class: 'cursor-pointer' } }"
                                    @click="toggleActive(data.id)"
                                />
                            </div>
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <InputGroup>
                            <Select
                                v-model="filterModel.value"
                                :options="[
                                    { label: t('common.labels.active'), value: true },
                                    { label: t('common.labels.inactive'), value: false }
                                ]"
                                optionLabel="label"
                                optionValue="value"
                                :placeholder="t('common.labels.select_status')"
                                class="w-full"
                                size="small"
                            />
                            <InputGroupAddon>
                                <Button size="small" icon="pi pi-check" severity="primary" @click="applyFilter()" />
                                <Button :disabled="filterModel.value === null" size="small" outlined icon="pi pi-times" severity="danger" @click="((filterModel.value = null), applyFilter())" />
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
                            :text="t('user.columns.created_at')"
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
                            <!-- Match Mode Selector -->
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

                            <!-- Date Input + Apply/Clear -->
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
                            :text="t('user.columns.updated_at')"
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
                                    <Button v-tooltip.top="t('common.tooltips.view', { entity: t('entity.account') })" icon="pi pi-eye" outlined rounded @click="editRecord(data)" severity="secondary" />
                                    <Button v-tooltip.top="t('common.tooltips.edit', { entity: t('entity.account') })" icon="pi pi-pencil" outlined rounded @click="editRecord(data)" />
                                    <Button v-tooltip.top="$t('common.tooltips.delete', { entity: t('entity.account') })" icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteRecord($event, [data.id])" />
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
