<script setup>
import { useDataTable } from '@/composables/useDataTable';
import { useDynamicColumns } from '@/composables/useDynamicColumns';
import { useLock } from '@/composables/useLock';
import { useRowEffects } from '@/composables/useRowEffects';
import { useShopService } from '@/services/useShopService';
import { useAuthStore } from '@/stores/useAuthStore';
import { findRecordIndex } from '@/utilities/helper';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { FilterMatchMode } from '@primevue/core/api';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const defaultFiltersConfig = {
    id: FilterMatchMode.CONTAINS,
    name: FilterMatchMode.CONTAINS,
    description: FilterMatchMode.CONTAINS,
    status: FilterMatchMode.EQUALS,
    created_at: FilterMatchMode.DATE_IS,
    updated_at: FilterMatchMode.DATE_IS
};

const { total, rows, records, selectedRecords, recordDataTable, filters, onPage, onSort, onFilter, clearFilter, searchDone, initialize } = useDataTable(
    (params) =>
        useShopService.getShops(params).then((data) => {
            return {
                data: data.shops || data.data || data,
                meta: data.meta || data
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

const defaultFields = ['name', 'description', 'status', 'created_at', 'updated_at'];
const { lockedRow, toggleLock, frozenColumns, toggleColumnFrozen } = useLock(defaultFields, records);
const { selectedColumns, columnChanged } = useDynamicColumns('shopsColumns', defaultFields, 'shop.columns');

const record = ref(null);
const subscription = ref(null);

function subscribeToEcho() {
    if (window.Echo) {
        subscription.value = window.Echo.private('data-stream.shop').listen('DataStream', (event) => {
            handleEchoEvent(event);
        });
    }
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
        default:
            console.error('Unhandled action', event.action);
    }
}

function addRecord() {
    authStore.errors = {};
    record.value = { name: null, description: null, status: 'active' };
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
            header: t('common.titles.add', { entity: t('entity.shop') }),
            style: { width: '40vw' },
            breakpoints: { '960px': '75vw', '640px': '90vw' },
            modal: true,
            maximizable: true
        },
        data: { record: record.value, action: record.value?.id ? ACTIONS.EDIT : ACTIONS.CREATE },
        onClose: (result) => {
            if (result && result.data?.record?.id) {
                switch (result.data?.action) {
                    case ACTIONS.CREATE:
                        records.value.unshift(result.data.record);
                        markHighlight(result.data.record.id, 'new');
                        showToast('success', ACTIONS.CREATE, 'shop', 'tc');
                        break;
                    case ACTIONS.EDIT: {
                        const index = findRecordIndex(records, result.data.record.id);
                        records.value[index] = result.data.record;
                        markHighlight(result.data.record.id, 'updated');
                        showToast('success', ACTIONS.EDIT, 'shop', 'tc');
                        break;
                    }
                }
            }
        }
    });
};

function confirmDeleteRecord(event, shopIds) {
    confirm.require({
        modal: true,
        target: event.currentTarget,
        message: shopIds.length > 1 ? t('common.confirmations.delete_selected.message', { entity: t('entity.shops') }) : t('common.confirmations.delete.message', { entity: t('entity.shop') }),
        icon: 'pi pi-info-circle',
        rejectProps: { label: t('common.labels.cancel'), severity: 'secondary', icon: 'pi pi-times', outlined: true },
        acceptProps: { label: t('common.labels.delete'), icon: 'pi pi-trash', severity: 'danger' },
        accept: () => {
            useShopService
                .deleteShops(shopIds)
                .then(() => {
                    shopIds.forEach((id) => {
                        const index = findRecordIndex(records, id);
                        if (index !== -1) records.value.splice(index, 1);
                    });
                    showToast('success', ACTIONS.DELETE, 'shop', 'tc');
                })
                .catch((error) => {
                    console.error('Error deleting shops', error);
                });
        }
    });
}

onMounted(() => {
    initialize();
    subscribeToEcho();
});

onUnmounted(() => {
    if (subscription.value) subscription.value.stopListening && subscription.value.stopListening('DataStream');
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
                :globalFilterFields="('id', defaultFields)"
                paginator
                @page="onPage($event)"
                :rows="rows"
                :totalRecords="total"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25, 50, 100]"
                :currentPageReportTemplate="t('common.paggination.showing_to_of_entity', { first: '{first}', last: '{last}', totalRecords: '{totalRecords}', entity: t('entity.shop') })"
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
                :pt="{ table: { style: 'min-width: 50rem' } }"
            >
                <template #header>
                    <div class="flex items-center">
                        <h2 class="text-xl font-bold min-w-40">{{ t('common.titles.manage', { entity: t('entity.shop') }) }}</h2>
                        <Toolbar class="w-full">
                            <template #start>
                                <div class="flex space-x-2">
                                    <Button
                                        v-if="authStore.hasPermission('store_shop')"
                                        v-tooltip.top="t('common.tooltips.add', { entity: t('entity.shop') })"
                                        :label="t('common.labels.new')"
                                        icon="pi pi-plus"
                                        severity="primary"
                                        @click="addRecord"
                                        outlined
                                    />
                                    <Button
                                        v-if="authStore.hasPermission('delete_shop')"
                                        v-tooltip.top="t('common.tooltips.delete_selected', { entity: t('entity.shop') })"
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
                                    <MultiSelect
                                        id="selected_columns"
                                        :modelValue="selectedColumns"
                                        display="chip"
                                        :maxSelectedLabels="4"
                                        :options="defaultFields.map((f) => ({ field: f, header: t(`shop.columns.${f}`) }))"
                                        optionLabel="header"
                                        @update:modelValue="columnChanged"
                                    />
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
                            :text="t('shop.columns.name')"
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
                    columnKey="description"
                    field="description"
                    :frozen="frozenColumns.description"
                    v-if="selectedColumns.some((column) => column.field === 'description')"
                    class="min-w-40"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('shop.columns.description')"
                            :frozen="frozenColumns.description"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('description')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>{{ data.description }}</DataCell>
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

                <Column columnKey="status" field="status" :frozen="frozenColumns.status" v-if="selectedColumns.some((column) => column.field === 'status')" sortable class="min-w-24">
                    <template #header>
                        <HeaderCell
                            :text="t('shop.columns.status')"
                            :frozen="frozenColumns.status"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('status')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <Tag :value="data.status" :severity="data.status === 'active' ? 'success' : 'danger'" rounded />
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <Select
                            v-model="filterModel.value"
                            :options="[
                                { label: t('common.labels.active'), value: 'active' },
                                { label: t('common.labels.inactive'), value: 'inactive' }
                            ]"
                            optionLabel="label"
                            optionValue="value"
                            class="w-full"
                            @change="applyFilter"
                        />
                    </template>
                </Column>

                <Column field="actions" header="Actions" :exportable="false" class="min-w-32">
                    <template #body="{ data }">
                        <div class="flex items-center gap-2">
                            <Button v-if="authStore.hasPermission('edit_shop')" icon="pi pi-pencil" text @click="editRecord(data)" />
                            <Button v-if="authStore.hasPermission('delete_shop')" icon="pi pi-trash" text @click="confirmDeleteRecord($event, [data.id])" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>
