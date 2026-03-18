<script setup lang="ts">
import DataTableHighlightTag from '@/components/DataTableHighlightTag.vue';
import RowActionMenu from '@/components/common/RowActionMenu.vue';
import { useDataTable } from '@/composables/useDataTable';
import { useDynamicColumns } from '@/composables/useDynamicColumns';
import { useRowEffects } from '@/composables/useRowEffects';
import { useExchangeService } from '@/services/useExchangeService';
import { useOrderHelpers } from '@/composables/useOrderHelpers';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { findRecordIndex } from '@/utilities/helper';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import type { ExchangeData } from '@/types/exchange';
import { FilterMatchMode } from '@primevue/core/api';
import { useConfirm } from 'primevue/useconfirm';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import DataTableSkeleton from '@/components/DataTableSkeleton.vue';

const { t } = useI18n();
const authStore = useAuthStore();
const loading = useLoading();
const confirm = useConfirm();
const router = useRouter();
const { showToast } = useShowToast();
const { statusSeverity, statusIcon } = useOrderHelpers();

const defaultFiltersConfig = {
    reference: FilterMatchMode.CONTAINS,
    status: FilterMatchMode.EQUALS
};

const dataLoaded = ref(false);

const { total, rows, records, selectedRecords, recordDataTable, filters, onPage, onSort, onFilter, clearFilter, searchDone, exportCSV, initialize } = useDataTable(
    (params: any) =>
        useExchangeService.getExchanges(params).then((data) => {
            dataLoaded.value = true;
            return {
                data: data.data,
                meta: data.meta
            };
        }),
    defaultFiltersConfig
);

const { highlights, markHighlight, getRowClass } = useRowEffects();
const defaultFields = ['reference', 'order_ref', 'customer', 'status', 'subtotal_adjustment', 'cod_balance_due', 'created_at'];

interface Column {
    field: string;
    header: string;
}

const defaultColumns = computed<Column[]>(() =>
    defaultFields.map((field) => ({
        field,
        header: t(`exchange.columns.${field}`)
    }))
);

const { selectedColumns, columnChanged } = useDynamicColumns('exchangesColumns', defaultFields, 'exchange.columns');
const subscription = ref<any>(null);

interface EchoEvent {
    action: string;
    data: ExchangeData | { id: number };
}

function subscribeToEcho(): void {
    if (!authStore.user) return;
    subscription.value = Echo.private(`data-stream.exchange${authStore.user.account_id}`).listen('DataStream', (event: EchoEvent) => {
        handleEchoEvent(event);
    });
}

function handleEchoEvent(event: EchoEvent): void {
    switch (event.action) {
        case ACTIONS.DELETE:
        case 'destroy': {
            const data = event.data as { id: number };
            const index = findRecordIndex(records, data.id);
            if (index !== -1) records.value.splice(index, 1);
            break;
        }
        case ACTIONS.UPDATE:
        case 'update': {
            const data = event.data as ExchangeData;
            const index = findRecordIndex(records, data.id);
            if (index !== -1) {
                records.value[index] = data;
                markHighlight(data.id, 'updated');
            }
            break;
        }
        case ACTIONS.STORE:
        case 'store': {
            const data = event.data as ExchangeData;
            const exists = records.value.some((r: ExchangeData) => r.id === data.id);
            if (!exists) {
                records.value.unshift(data);
                markHighlight(data.id, 'new');
            }
            break;
        }
    }
}

function editRecord(row: ExchangeData): void {
    authStore.errors = {};
    router.push({ name: 'exchange-edit', params: { id: row.id } });
}

function confirmDeleteRecord(event: MouseEvent | null, exchangeIds: number[]): void {
    confirm.require({
        modal: true,
        target: event?.currentTarget as HTMLElement | undefined,
        message: exchangeIds.length > 1 ? t('common.confirmations.delete_selected.message', { entity: t('entity.exchanges') }) : t('common.confirmations.delete.message', { entity: t('entity.exchange') }),
        icon: 'pi pi-info-circle',
        rejectProps: {
            label: t('common.labels.cancel'),
            severity: 'secondary',
            icon: 'pi pi-times',
            outlined: true
        },
        acceptProps: {
            label: t('common.labels.delete'),
            icon: 'pi pi-trash',
            severity: 'danger'
        },
        accept: () => {
            useExchangeService
                .deleteExchanges(exchangeIds)
                .then(() => {
                    exchangeIds.forEach((id: number) => {
                        const index = findRecordIndex(records, id);
                        if (index !== -1) records.value.splice(index, 1);
                    });
                    selectedRecords.value = [];
                    showToast('success', ACTIONS.DELETE, 'exchange', 'tc');
                })
                .catch((error: any) => {
                    if (error?.response?.status === 419 || error?.response?.status === 401) {
                        console.error('Session expired');
                    }
                    console.error('Error deleting exchanges');
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
        <PageHeader icon="pi pi-arrows-h" icon-color="#8B5CF6" :title="t('common.titles.manage', { entity: t('entity.exchanges') })" :description="t('common.subtitles.manage', { entity: t('entity.exchanges').toLowerCase() })">
            <template #actions>
                <Button v-tooltip.top="t('common.tooltips.export_selection', { entity: t('entity.exchanges') })" :label="t('common.labels.export')" icon="pi pi-upload" outlined severity="info" @click="exportCSV()" />
            </template>
        </PageHeader>

        <DataTableSkeleton v-if="!dataLoaded" :columns="7" has-tag-column />
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
                :globalFilterFields="['id', 'reference']"
                paginator
                @page="onPage($event)"
                :rows="rows"
                :totalRecords="total"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25, 50, 100]"
                :currentPageReportTemplate="t('common.pagination.showing_to_of_entity', { first: '{first}', last: '{last}', totalRecords: '{totalRecords}', entity: t('entity.exchanges') })"
                resizableColumns
                columnResizeMode="expand"
                reorderableColumns
                sortField="id"
                :sortOrder="-1"
                @sort="onSort($event)"
                removableSort
                scrollable
                rowHover
                size="small"
                :pt="{
                    table: { style: 'min-width: 60rem' },
                    bodyrow: () => ({
                        class: ['cursor-pointer']
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
                                    <InputIcon><i class="pi pi-search" /></InputIcon>
                                    <InputText id="global_search" v-model="filters['global'].value" @keyup.enter="searchDone" @input="searchDone" />
                                    <label for="global_search">{{ t('common.placeholders.search') }}</label>
                                </IconField>
                            </FloatLabel>
                        </template>
                    </Toolbar>
                </template>

                <Column columnKey="select" selectionMode="multiple" style="width: 3rem" :exportable="false" :reorderableColumn="false" />

                <!-- Reference Column -->
                <Column
                    :showClearButton="false" :showApplyButton="false" :showFilterMatchModes="false" :showFilterOperator="false"
                    columnKey="reference" field="reference"
                    v-if="selectedColumns.some((c: Column) => c.field === 'reference')"
                    sortable class="min-w-36"
                >
                    <template #header>
                        <span class="font-semibold text-sm">{{ t('exchange.columns.reference') }}</span>
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div class="flex items-center gap-2">
                                <div>
                                    <span class="font-mono text-primary font-semibold cursor-pointer hover:underline" @click.stop="editRecord(data)">{{ data.reference }}</span>
                                    <div class="text-xs text-surface-400 mt-0.5">{{ data.created_at ? new Date(data.created_at).toLocaleDateString() : '—' }}</div>
                                </div>
                                <DataTableHighlightTag v-if="highlights[data.id]" :state="highlights[data.id]" />
                            </div>
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <InputGroup>
                            <InputText v-model="filterModel.value" size="small" />
                            <InputGroupAddon>
                                <Button size="small" icon="pi pi-check" severity="primary" @click="applyFilter()" />
                                <Button :disabled="!filterModel.value" size="small" outlined icon="pi pi-times" severity="danger" @click="((filterModel.value = null), applyFilter())" />
                            </InputGroupAddon>
                        </InputGroup>
                    </template>
                </Column>

                <!-- Order Reference Column -->
                <Column columnKey="order_ref" field="order_ref" v-if="selectedColumns.some((c: Column) => c.field === 'order_ref')" class="min-w-36">
                    <template #header>
                        <span class="font-semibold text-sm">{{ t('exchange.columns.order_ref') }}</span>
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <span v-if="data.order" class="font-mono text-sm">{{ data.order.reference }}</span>
                            <span v-else class="text-muted-color">—</span>
                        </DataCell>
                    </template>
                </Column>

                <!-- Customer Column -->
                <Column columnKey="customer" field="customer" v-if="selectedColumns.some((c: Column) => c.field === 'customer')" class="min-w-44">
                    <template #header>
                        <span class="font-semibold text-sm">{{ t('exchange.columns.customer') }}</span>
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div v-if="data.order?.customer" class="flex items-center gap-2">
                                <i class="pi pi-user text-surface-400"></i>
                                <span class="text-sm font-medium">{{ data.order.customer.name }}</span>
                            </div>
                            <span v-else class="text-muted-color">—</span>
                        </DataCell>
                    </template>
                </Column>

                <!-- Status Column -->
                <Column
                    :showClearButton="false" :showApplyButton="false" :showFilterMatchModes="false" :showFilterOperator="false"
                    columnKey="status" field="status"
                    v-if="selectedColumns.some((c: Column) => c.field === 'status')"
                    sortable class="min-w-28"
                >
                    <template #header>
                        <span class="font-semibold text-sm">{{ t('exchange.columns.status') }}</span>
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <Tag :value="t(`order.statuses.${data.status}`)" :severity="statusSeverity(data.status)" :icon="statusIcon(data.status)" class="!capitalize py-1.5 px-2.5" />
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <InputGroup>
                            <Select
                                v-model="filterModel.value"
                                :options="[
                                    { label: t('order.statuses.pending'), value: 'pending' },
                                    { label: t('order.statuses.confirmed'), value: 'confirmed' },
                                    { label: t('order.statuses.in_preparation'), value: 'in_preparation' },
                                    { label: t('order.statuses.in_dispatch'), value: 'in_dispatch' },
                                    { label: t('order.statuses.shipping'), value: 'shipping' },
                                    { label: t('order.statuses.delivered'), value: 'delivered' },
                                    { label: t('order.statuses.cancelled'), value: 'cancelled' },
                                    { label: t('order.statuses.returned'), value: 'returned' },
                                    { label: t('order.statuses.exchanged'), value: 'exchanged' }
                                ]"
                                optionLabel="label"
                                optionValue="value"
                                :placeholder="t('exchange.columns.status')"
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

                <!-- Subtotal Adjustment Column -->
                <Column columnKey="subtotal_adjustment" field="subtotal_adjustment" v-if="selectedColumns.some((c: Column) => c.field === 'subtotal_adjustment')" sortable class="min-w-32">
                    <template #header>
                        <span class="font-semibold text-sm">{{ t('exchange.columns.subtotal_adjustment') }}</span>
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <span class="text-sm" :class="{ 'text-green-600': Number(data.subtotal_adjustment) > 0, 'text-red-500': Number(data.subtotal_adjustment) < 0 }">
                                {{ Number(data.subtotal_adjustment) > 0 ? '+' : '' }}{{ Number(data.subtotal_adjustment).toLocaleString('fr-DZ') }} DA
                            </span>
                        </DataCell>
                    </template>
                </Column>

                <!-- COD Balance Due Column -->
                <Column columnKey="cod_balance_due" field="cod_balance_due" v-if="selectedColumns.some((c: Column) => c.field === 'cod_balance_due')" sortable class="min-w-32">
                    <template #header>
                        <span class="font-semibold text-sm">{{ t('exchange.columns.cod_balance_due') }}</span>
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <span class="font-semibold">{{ Number(data.cod_balance_due).toLocaleString('fr-DZ') }} DA</span>
                        </DataCell>
                    </template>
                </Column>

                <!-- Created At Column -->
                <Column columnKey="created_at" field="created_at" v-if="selectedColumns.some((c: Column) => c.field === 'created_at')" sortable class="min-w-32">
                    <template #header>
                        <span class="font-semibold text-sm">{{ t('exchange.columns.created_at') }}</span>
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <span class="text-sm">{{ data.created_at ? new Date(data.created_at).toLocaleDateString() : '—' }}</span>
                        </DataCell>
                    </template>
                </Column>

                <!-- Actions Column -->
                <Column columnKey="actions" :exportable="false" style="min-width: 5rem" :header="t('common.columns.actions')">
                    <template #body="{ data }">
                        <div class="flex items-center justify-center gap-1">
                            <RowActionMenu
                                :actions="[
                                    { label: t('common.labels.edit'), icon: 'pi pi-pencil', command: () => editRecord(data) },
                                    { label: t('common.labels.delete'), icon: 'pi pi-trash', severity: 'danger', command: () => confirmDeleteRecord(null, [data.id]) }
                                ]"
                            />
                        </div>
                    </template>
                </Column>

                <template #empty>
                    <div class="flex flex-col items-center justify-center py-12">
                        <i class="pi pi-arrows-h text-5xl text-surface-300 dark:text-surface-600 mb-4"></i>
                        <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-200 mb-2">{{ t('common.messages.no_data_title', { entity: t('entity.exchanges').toLowerCase() }) }}</h3>
                        <p class="text-surface-500 dark:text-surface-400 text-sm mb-6">{{ t('common.messages.no_data_description', { entity: t('entity.exchange').toLowerCase() }) }}</p>
                    </div>
                </template>
            </DataTable>

            <!-- Bulk Action Bar -->
            <BulkActionBar
                :selectedCount="selectedRecords.length"
                :entityLabel="t('entity.exchanges').toLowerCase()"
                :actions="[]"
                @delete="
                    confirmDeleteRecord(
                        null,
                        selectedRecords.map((r: ExchangeData) => r.id)
                    )
                "
            />
        </template>
    </div>
</template>
