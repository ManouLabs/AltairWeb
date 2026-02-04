<script setup>
import { useDataTable } from '@/composables/useDataTable';
import { useDynamicColumns } from '@/composables/useDynamicColumns';
import { useLock } from '@/composables/useLock';
import { useRowEffects } from '@/composables/useRowEffects';
import dayjs from '@/plugins/dayjs';
import { useShipperService } from '@/services/useShipperService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { findRecordIndex, formatDate } from '@/utilities/helper';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { FilterMatchMode } from '@primevue/core/api';
import { useConfirm } from 'primevue/useconfirm';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();
const confirm = useConfirm();
const { showToast } = useShowToast();
const loading = useLoading();
const loadingActiveId = ref(null);

// Filters configuration
const defaultFiltersConfig = {
    name: FilterMatchMode.CONTAINS,
    type: FilterMatchMode.CONTAINS,
    active: FilterMatchMode.EQUALS
};

// Initialize DataTable
const { total, rows, records, selectedRecords, recordDataTable, filters, onPage, onSort, onFilter, clearFilter, searchDone, exportCSV, initialize } = useDataTable(
    (params) =>
        useShipperService.getShippers(params).then((data) => ({
            data: data.data,
            meta: data.meta
        })),
    defaultFiltersConfig
);

// Row effects
const { highlights, markHighlight, getRowClass } = useRowEffects();

// Column locking
const defaultFields = ['name', 'type', 'shops', 'api', 'active'];
const { lockedRow, toggleLock, frozenColumns, toggleColumnFrozen } = useLock(defaultFields, records);

const defaultColumns = computed(() =>
    defaultFields.map((field) => ({
        field,
        header: t(`shipper.columns.${field}`)
    }))
);

const { selectedColumns, columnChanged } = useDynamicColumns('shippersColumns', defaultFields, 'shipper.columns');
const subscription = ref(null);

// Echo subscription
function subscribeToEcho() {
    subscription.value = Echo.private(`data-stream.shippers${authStore.user.account_id}`).listen('DataStream', (event) => {
        handleEchoEvent(event);
    });
}

function handleEchoEvent(event) {
    switch (event.action) {
        case ACTIONS.DELETE:
            event.data.forEach((id) => {
                const index = findRecordIndex(records, id);
                if (index !== -1) records.value.splice(index, 1);
            });
            break;
        case ACTIONS.UPDATE: {
            const index = findRecordIndex(records, event.data.id);
            if (index !== -1) {
                records.value[index] = event.data;
                markHighlight(event.data.id, 'updated');
            }
            break;
        }
        case ACTIONS.STORE: {
            const exists = records.value.some((r) => r.id === event.data.id);
            if (!exists) {
                records.value.unshift(event.data);
                markHighlight(event.data.id, 'new');
            }
            break;
        }
    }
}

function addRecord() {
    router.push({ name: 'shipper-create' });
}

function editRecord(row) {
    router.push({ name: 'shipper-edit', params: { id: row.id } });
}

function toggleActive(shipperId) {
    loadingActiveId.value = shipperId;
    loading.startPageLoading();
    useShipperService
        .toggleActiveShipper(shipperId)
        .then((result) => {
            const index = findRecordIndex(records, shipperId);
            records.value[index].active = !records.value[index].active;
            markHighlight(shipperId, 'updated');
            showToast('success', ACTIONS.EDIT, 'shipper', 'tc');
        })
        .catch((error) => {
            if (error?.response?.status === 419 || error?.response?.status === 401) {
                console.error('Session expired, redirecting to login');
            }
            console.error('Error updating shipper status');
        })
        .finally(() => {
            loadingActiveId.value = null;
            loading.stopPageLoading();
        });
}

function confirmDeleteRecord(event, shipperIds) {
    confirm.require({
        modal: true,
        target: event.currentTarget,
        message: shipperIds.length > 1 ? t('common.confirmations.delete_selected.message', { entity: t('entity.shippers') }) : t('common.confirmations.delete.message', { entity: t('entity.shipper') }),
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
            useShipperService
                .deleteShippers(shipperIds)
                .then(() => {
                    shipperIds.forEach((id) => {
                        const index = findRecordIndex(records, id);
                        if (index !== -1) records.value.splice(index, 1);
                    });
                    showToast('success', ACTIONS.DELETE, 'shipper', 'tc');
                })
                .catch((error) => {
                    if (error?.response?.status === 419 || error?.response?.status === 401) {
                        console.error('Session expired, redirecting to login');
                    }
                    console.error('Error deleting shippers');
                });
        }
    });
}

onMounted(() => {
    initialize();
    subscribeToEcho();
});

onUnmounted(() => {
    if (subscription.value) subscription.value.stopListening('DataStream');
});
</script>

<template>
    <div>
        <div class="card shadow-glow">
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
                :currentPageReportTemplate="t('common.paggination.showing_to_of_entity', { first: '{first}', last: '{last}', totalRecords: '{totalRecords}', entity: t('entity.shipper') })"
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
                            {{ t('common.titles.manage', { entity: t('entity.shipper') }) }}
                        </h2>
                        <Toolbar class="w-full">
                            <template #start>
                                <div class="flex space-x-2">
                                    <Button v-tooltip.top="t('common.tooltips.add', { entity: t('entity.shipper') })" :label="t('common.labels.new')" icon="pi pi-plus" severity="primary" @click="addRecord" outlined />
                                    <Button
                                        v-tooltip.top="t('common.tooltips.delete_selected', { entity: t('entity.shipper') })"
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
                                    <MultiSelect id="selected_columns" :modelValue="selectedColumns" display="chip" :maxSelectedLabels="0" :options="defaultColumns" optionLabel="header" @update:modelValue="columnChanged" />
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
                                        v-tooltip.top="t('common.tooltips.export_selection', { entity: t('entity.shipper') })"
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

                <!-- Name Column -->
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
                    class="min-w-40"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('shipper.columns.name')"
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

                <!-- Type Column -->
                <Column
                    :showClearButton="false"
                    :showApplyButton="false"
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    columnKey="type"
                    field="type"
                    :frozen="frozenColumns.type"
                    v-if="selectedColumns.some((column) => column.field === 'type')"
                    sortable
                    class="min-w-32"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('shipper.columns.type')"
                            :frozen="frozenColumns.type"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('type')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <Tag :value="data.type_label" :severity="data.type === 'company' ? 'info' : 'secondary'" :icon="data.type === 'company' ? 'pi pi-building' : 'pi pi-user'" :class="{ 'font-bold': frozenColumns.type }" />
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <InputGroup>
                            <Select
                                v-model="filterModel.value"
                                :options="[
                                    { label: t('shipper.types.company'), value: 'company' },
                                    { label: t('shipper.types.individual'), value: 'individual' }
                                ]"
                                optionLabel="label"
                                optionValue="value"
                                :placeholder="t('common.labels.select_type')"
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

                <!-- Shops Column -->
                <Column columnKey="shops" field="shops" :frozen="frozenColumns.shops" v-if="selectedColumns.some((column) => column.field === 'shops')" class="min-w-40">
                    <template #header>
                        <HeaderCell
                            :text="t('shipper.columns.shops')"
                            :frozen="frozenColumns.shops"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('shops')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div v-if="data.shops && data.shops.length" class="flex flex-wrap gap-1">
                                <Tag v-for="shop in data.shops" :key="shop.id" :value="shop.name" severity="secondary" size="small" />
                            </div>
                            <span v-else class="text-muted-color">—</span>
                        </DataCell>
                    </template>
                </Column>

                <!-- API Column -->
                <Column columnKey="api" field="api" :frozen="frozenColumns.api" v-if="selectedColumns.some((column) => column.field === 'api')" class="min-w-32">
                    <template #header>
                        <HeaderCell
                            :text="t('shipper.columns.api')"
                            :frozen="frozenColumns.api"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('api')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <Tag
                                v-if="data.type === 'company'"
                                :value="data.api_configured ? t('shipper.labels.connected') : t('shipper.labels.not_configured')"
                                :severity="data.api_configured ? 'success' : 'warn'"
                                icon="pi pi-sync"
                                rounded
                                size="small"
                                :class="{ 'font-bold': frozenColumns.api }"
                            />
                            <span v-else class="text-muted-color">—</span>
                        </DataCell>
                    </template>
                </Column>

                <!-- Active Column -->
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
                            :text="t('shipper.columns.active')"
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
                                <ActiveToggleButton :active="data.active" entity="shipper" variant="button" :loading="loadingActiveId === data.id" @toggle="toggleActive(data.id)" />
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

                <!-- Actions Column -->
                <Column columnKey="actions" :exportable="false" style="min-width: 12rem" :header="t('common.columns.actions')">
                    <template #body="{ data, frozenRow, index }">
                        <div class="flex justify-between">
                            <div class="flex space-x-2">
                                <Button v-tooltip.top="t('common.tooltips.edit', { entity: t('entity.shipper') })" icon="pi pi-pencil" outlined rounded @click="editRecord(data)" />
                                <Button v-tooltip.top="t('common.tooltips.delete', { entity: t('entity.shipper') })" icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteRecord($event, [data.id])" />
                            </div>
                            <Button
                                v-tooltip.top="frozenRow ? t('common.tooltips.unlock_row') : t('common.tooltips.lock_row')"
                                :icon="frozenRow ? 'pi pi-lock' : 'pi pi-lock-open'"
                                text
                                @click="toggleLock(data, frozenRow, index)"
                                severity="contrast"
                            />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>
