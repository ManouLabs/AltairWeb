<script setup lang="ts">
import BulkActionBar from '@/components/BulkActionBar.vue';
import DataTableHighlightTag from '@/components/DataTableHighlightTag.vue';
import FormHeader from '@/components/FormHeader.vue';
import RowActionMenu from '@/components/common/RowActionMenu.vue';
import { useDataTable } from '@/composables/useDataTable';
import { useDynamicColumns } from '@/composables/useDynamicColumns';
import { useLock } from '@/composables/useLock';
import { useRowEffects } from '@/composables/useRowEffects';
import { useSupplierService } from '@/services/useSupplierService';
import { useAuthStore } from '@/stores/useAuthStore';
import { findRecordIndex } from '@/utilities/helper';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { SUPPLIER_TYPES, type SupplierData, type SupplierType } from '@/types/supplier';
import { FilterMatchMode } from '@primevue/core/api';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { computed, defineAsyncComponent, markRaw, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import DataTableSkeleton from '@/components/DataTableSkeleton.vue';

const { t } = useI18n();
const authStore = useAuthStore();
const confirm = useConfirm();
const dialog = useDialog();
const { showToast } = useShowToast();
const formComponent = defineAsyncComponent(() => import('./partials/Form.vue'));

// Filters configuration
const defaultFiltersConfig = {
    name: FilterMatchMode.CONTAINS,
    type: FilterMatchMode.CONTAINS
};

const dataLoaded = ref(false);

// Initialize DataTable
const { total, rows, records, selectedRecords, recordDataTable, filters, onPage, onSort, onFilter, clearFilter, searchDone, exportCSV, initialize } = useDataTable(
    (params: any) =>
        useSupplierService.getSuppliers(params).then((data) => {
            dataLoaded.value = true;
            return {
                data: data.data,
                meta: data.meta
            };
        }),
    defaultFiltersConfig
);

// Row effects
const { highlights, markHighlight, getRowClass } = useRowEffects();

// Column locking
const defaultFields = ['name', 'type', 'address', 'phone', 'email'];
const { lockedRow, toggleLock, frozenColumns, toggleColumnFrozen } = useLock(defaultFields, records);

interface Column {
    field: string;
    header: string;
}

const defaultColumns = computed<Column[]>(() =>
    defaultFields.map((field) => ({
        field,
        header: t(`supplier.columns.${field}`)
    }))
);

const { selectedColumns, columnChanged } = useDynamicColumns('suppliersColumns', defaultFields, 'supplier.columns');
const subscription = ref<any>(null);

interface EchoEvent {
    action: string;
    data: SupplierData | number[];
}

// Echo subscription
function subscribeToEcho(): void {
    if (!authStore.user) return;
    subscription.value = Echo.private(`data-stream.suppliers${authStore.user.account_id}`).listen('DataStream', (event: EchoEvent) => {
        handleEchoEvent(event);
    });
}

function handleEchoEvent(event: EchoEvent): void {
    switch (event.action) {
        case ACTIONS.DELETE:
            (event.data as number[]).forEach((id: number) => {
                const index = findRecordIndex(records, id);
                if (index !== -1) records.value.splice(index, 1);
            });
            break;
        case ACTIONS.UPDATE: {
            const data = event.data as SupplierData;
            const index = findRecordIndex(records, data.id);
            if (index !== -1) {
                records.value[index] = data;
                markHighlight(data.id, 'updated');
            }
            break;
        }
        case ACTIONS.STORE: {
            const data = event.data as SupplierData;
            const exists = records.value.some((r: SupplierData) => r.id === data.id);
            if (!exists) {
                records.value.unshift(data);
                markHighlight(data.id, 'new');
            }
            break;
        }
    }
}

function addRecord(): void {
    authStore.errors = {};
    openDialog(null, ACTIONS.CREATE);
}

function editRecord(row: SupplierData): void {
    authStore.errors = {};
    openDialog(row, ACTIONS.EDIT);
}

function openDialog(record: SupplierData | null, actionType: string): void {
    const isEdit = actionType === ACTIONS.EDIT;
    dialog.open(formComponent, {
        props: {
            style: { width: '42vw' },
            breakpoints: { '1200px': '55vw', '960px': '75vw', '640px': '90vw' },
            modal: true,
            maximizable: true
        },
        templates: {
            header: markRaw(FormHeader)
        },
        data: {
            record: record,
            action: actionType,
            headerProps: computed(() => ({
                title: isEdit ? t('common.titles.edit', { entity: t('entity.supplier') }) : t('supplier.form.title'),
                description: t('supplier.form.subtitle'),
                icon: isEdit ? 'pi pi-building' : 'pi pi-plus-circle',
                iconColor: '#3B82F6'
            }))
        },
        onClose: (result) => {
            if (result && result.data?.record?.id) {
                switch (result.data?.action) {
                    case ACTIONS.CREATE:
                        records.value.unshift(result.data.record);
                        markHighlight(result.data.record.id, 'new');
                        showToast('success', ACTIONS.CREATE, 'supplier', 'tc');
                        break;
                    case ACTIONS.EDIT: {
                        const index = findRecordIndex(records, result.data.record.id);
                        records.value[index] = result.data.record;
                        markHighlight(result.data.record.id, 'updated');
                        showToast('success', ACTIONS.EDIT, 'supplier', 'tc');
                        break;
                    }
                    default:
                        console.error(`Unhandled action: ${result.data?.action}`);
                }
            }
        }
    });
}

function confirmDeleteRecord(event: MouseEvent | null, supplierIds: number[]): void {
    confirm.require({
        modal: true,
        target: event?.currentTarget as HTMLElement | undefined,
        message: supplierIds.length > 1 ? t('common.confirmations.delete_selected.message', { entity: t('entity.suppliers') }) : t('common.confirmations.delete.message', { entity: t('entity.supplier') }),
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
            useSupplierService
                .deleteSuppliers(supplierIds)
                .then(() => {
                    supplierIds.forEach((id: number) => {
                        const index = findRecordIndex(records, id);
                        if (index !== -1) records.value.splice(index, 1);
                    });
                    selectedRecords.value = [];
                    showToast('success', ACTIONS.DELETE, 'supplier', 'tc');
                })
                .catch((error: any) => {
                    if (error?.response?.status === 419 || error?.response?.status === 401) {
                        console.error('Session expired, redirecting to login');
                    }
                    console.error('Error deleting suppliers');
                });
        }
    });
}

// Helper to get icon and color for supplier type
function getTypeIcon(type: string): { icon: string; color: string } {
    return SUPPLIER_TYPES[type as SupplierType] || { icon: 'pi pi-tag', color: 'text-gray-400' };
}

// Helper to get first contact method value by type
function getContactValue(supplier: SupplierData, type: string): string | null {
    if (!supplier.contactMethods) return null;
    const method = supplier.contactMethods.find((m: any) => m.type === type);
    return method?.value || null;
}

// Helper to get primary address display
function getAddressDisplay(supplier: SupplierData): string {
    if (!supplier.addresses || supplier.addresses.length === 0) return '—';
    const addr = supplier.addresses[0];
    const parts: string[] = [];
    if (addr.street) parts.push(addr.street as string);
    if (typeof addr.city === 'object' && addr.city?.name) parts.push(addr.city.name);
    if (typeof addr.region === 'object' && addr.region?.name) parts.push(addr.region.name);
    return parts.join(', ') || '—';
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
        <!-- Page Header (always visible) -->
        <PageHeader icon="pi pi-building" icon-color="#8B5CF6" :title="t('common.titles.manage', { entity: t('entity.suppliers') })" :description="t('common.subtitles.manage', { entity: t('entity.suppliers').toLowerCase() })">
            <template #actions>
                <Button v-tooltip.top="t('common.tooltips.export_selection', { entity: t('entity.suppliers') })" :label="t('common.labels.export')" icon="pi pi-upload" outlined severity="info" @click="exportCSV()" />
                <Button v-tooltip.top="t('common.tooltips.add', { entity: t('entity.supplier') })" :label="`+ ${t('common.labels.new')} ${t('entity.supplier')}`" severity="primary" :disabled="!dataLoaded" @click="addRecord" />
            </template>
        </PageHeader>

        <!-- Skeleton Loading State -->
        <DataTableSkeleton v-if="!dataLoaded" :columns="5" has-tag-column />
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
                :currentPageReportTemplate="t('common.pagination.showing_to_of_entity', { first: '{first}', last: '{last}', totalRecords: '{totalRecords}', entity: t('entity.supplier') })"
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
                    bodyrow: ({ props }: { props: { frozenRow: boolean } }) => ({
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
                                    <InputText id="global_search" v-model="filters['global'].value" @keyup.enter="searchDone" @input="searchDone" />
                                    <label for="global_search">{{ t('common.placeholders.search') }}</label>
                                </IconField>
                            </FloatLabel>
                        </template>
                    </Toolbar>
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
                    v-if="selectedColumns.some((column: Column) => column.field === 'name')"
                    sortable
                    class="min-w-40"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('supplier.columns.name')"
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
                                <div class="relative">
                                    <img v-if="data.logo?.url" :src="data.logo.url" :alt="data.name" class="w-8 h-8 rounded-full object-cover border border-surface-200 dark:border-surface-700" />
                                    <div v-else class="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                                        <i class="pi pi-building text-violet-600 dark:text-violet-400 text-xs"></i>
                                    </div>
                                </div>
                                <span>{{ data.name }}</span>
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

                <!-- Type Column -->
                <Column
                    :showClearButton="false"
                    :showApplyButton="false"
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    columnKey="type"
                    field="type"
                    :frozen="frozenColumns.type"
                    v-if="selectedColumns.some((column: Column) => column.field === 'type')"
                    sortable
                    class="min-w-32"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('supplier.columns.type')"
                            :frozen="frozenColumns.type"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('type')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div class="flex items-center gap-2" :class="{ 'font-bold': frozenColumns.type }">
                                <i :class="[getTypeIcon(data.type).icon, getTypeIcon(data.type).color]"></i>
                                <span>{{ data.type_label }}</span>
                            </div>
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <InputGroup>
                            <Select
                                v-model="filterModel.value"
                                :options="Object.keys(SUPPLIER_TYPES).map((key) => ({ label: t(`supplier.types.${key}`), value: key }))"
                                optionLabel="label"
                                optionValue="value"
                                :placeholder="t('common.labels.select_type')"
                                class="w-full"
                                size="small"
                            />
                            <InputGroupAddon>
                                <Button size="small" icon="pi pi-check" severity="primary" @click="applyFilter()" />
                                <Button :disabled="!filterModel.value" size="small" outlined icon="pi pi-times" severity="danger" @click="((filterModel.value = null), applyFilter())" />
                            </InputGroupAddon>
                        </InputGroup>
                    </template>
                </Column>

                <!-- Address Column -->
                <Column columnKey="address" field="address" :frozen="frozenColumns.address" v-if="selectedColumns.some((column: Column) => column.field === 'address')" class="min-w-40">
                    <template #header>
                        <HeaderCell
                            :text="t('supplier.columns.address')"
                            :frozen="frozenColumns.address"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('address')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <span class="text-surface-600 dark:text-surface-400">{{ getAddressDisplay(data) }}</span>
                        </DataCell>
                    </template>
                </Column>

                <!-- Phone Column -->
                <Column columnKey="phone" field="phone" :frozen="frozenColumns.phone" v-if="selectedColumns.some((column: Column) => column.field === 'phone')" class="min-w-32">
                    <template #header>
                        <HeaderCell
                            :text="t('supplier.columns.phone')"
                            :frozen="frozenColumns.phone"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('phone')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <span v-if="getContactValue(data, 'phone')">{{ getContactValue(data, 'phone') }}</span>
                            <span v-else class="text-muted-color">—</span>
                        </DataCell>
                    </template>
                </Column>

                <!-- Email Column -->
                <Column columnKey="email" field="email" :frozen="frozenColumns.email" v-if="selectedColumns.some((column: Column) => column.field === 'email')" class="min-w-40">
                    <template #header>
                        <HeaderCell
                            :text="t('supplier.columns.email')"
                            :frozen="frozenColumns.email"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('email')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <span v-if="getContactValue(data, 'email')">{{ getContactValue(data, 'email') }}</span>
                            <span v-else class="text-muted-color">—</span>
                        </DataCell>
                    </template>
                </Column>

                <!-- Actions Column -->
                <Column columnKey="actions" :exportable="false" style="min-width: 5rem" :header="t('common.columns.actions')">
                    <template #body="{ data, frozenRow, index }">
                        <div class="flex items-center justify-center gap-1">
                            <RowActionMenu
                                :actions="[
                                    { label: t('common.labels.edit'), icon: 'pi pi-pencil', command: () => editRecord(data) },
                                    { label: t('common.labels.delete'), icon: 'pi pi-trash', severity: 'danger', command: () => confirmDeleteRecord(null, [data.id]) }
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
                    </template>
                </Column>

                <template #empty>
                    <div class="flex flex-col items-center justify-center py-12">
                        <i class="pi pi-building text-5xl text-surface-300 dark:text-surface-600 mb-4"></i>
                        <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-200 mb-2">{{ t('common.messages.no_data_title', { entity: t('entity.suppliers').toLowerCase() }) }}</h3>
                        <p class="text-surface-500 dark:text-surface-400 text-sm mb-6">{{ t('common.messages.no_data_description', { entity: t('entity.supplier').toLowerCase() }) }}</p>
                        <Button :label="t('common.labels.new') + ' ' + t('entity.supplier')" icon="pi pi-plus" severity="primary" @click="addRecord" />
                    </div>
                </template>
            </DataTable>

            <BulkActionBar
                :selectedCount="selectedRecords.length"
                :entityLabel="t('entity.suppliers').toLowerCase()"
                :actions="[]"
                @delete="
                    confirmDeleteRecord(
                        null,
                        selectedRecords.map((r: SupplierData) => r.id)
                    )
                "
            />
        </template>
    </div>
</template>
