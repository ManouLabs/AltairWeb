<script setup lang="ts">
import DataTableHighlightTag from '@/components/DataTableHighlightTag.vue';
import RowActionMenu from '@/components/common/RowActionMenu.vue';
import { useDataTable } from '@/composables/useDataTable';
import { useDynamicColumns } from '@/composables/useDynamicColumns';
import { useLock } from '@/composables/useLock';
import { useRowEffects } from '@/composables/useRowEffects';
import { useOrderService } from '@/services/useOrderService';
import { useAuthStore } from '@/stores/useAuthStore';
import { findRecordIndex } from '@/utilities/helper';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import type { OrderData } from '@/types/order';
import { FilterMatchMode } from '@primevue/core/api';
import { useConfirm } from 'primevue/useconfirm';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import DataTableSkeleton from '@/components/DataTableSkeleton.vue';

const { t } = useI18n();
const authStore = useAuthStore();
const confirm = useConfirm();
const router = useRouter();
const { showToast } = useShowToast();

const defaultFiltersConfig = {
    reference: FilterMatchMode.CONTAINS,
    status: FilterMatchMode.EQUALS,
    source: FilterMatchMode.EQUALS
};

const dataLoaded = ref(false);

const { total, rows, records, selectedRecords, recordDataTable, filters, onPage, onSort, onFilter, clearFilter, searchDone, exportCSV, initialize } = useDataTable(
    (params: any) =>
        useOrderService.getOrders(params).then((data) => {
            dataLoaded.value = true;
            return {
                data: data.data,
                meta: data.meta
            };
        }),
    defaultFiltersConfig
);

const { highlights, markHighlight, getRowClass } = useRowEffects();
const defaultFields = ['reference', 'customer', 'status', 'source', 'total', 'payment_status', 'created_at'];
const { lockedRow, toggleLock, frozenColumns, toggleColumnFrozen } = useLock(defaultFields, records);

interface Column {
    field: string;
    header: string;
}

const defaultColumns = computed<Column[]>(() =>
    defaultFields.map((field) => ({
        field,
        header: t(`order.columns.${field}`)
    }))
);

const { selectedColumns, columnChanged } = useDynamicColumns('ordersColumns', defaultFields, 'order.columns');
const subscription = ref<any>(null);

interface EchoEvent {
    action: string;
    data: OrderData | { id: number };
}

function subscribeToEcho(): void {
    if (!authStore.user) return;
    subscription.value = Echo.private(`data-stream.order${authStore.user.account_id}`).listen('DataStream', (event: EchoEvent) => {
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
            const data = event.data as OrderData;
            const index = findRecordIndex(records, data.id);
            if (index !== -1) {
                records.value[index] = data;
                markHighlight(data.id, 'updated');
            }
            break;
        }
        case ACTIONS.STORE:
        case 'store': {
            const data = event.data as OrderData;
            const exists = records.value.some((r: OrderData) => r.id === data.id);
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
    router.push({ name: 'order-create' });
}

function editRecord(row: OrderData): void {
    authStore.errors = {};
    router.push({ name: 'order-edit', params: { id: row.id } });
}

function viewRecord(row: OrderData): void {
    router.push({ name: 'order-show', params: { id: row.id } });
}

function confirmDeleteRecord(event: MouseEvent | null, orderIds: number[]): void {
    confirm.require({
        modal: true,
        target: event?.currentTarget as HTMLElement | undefined,
        message: orderIds.length > 1 ? t('common.confirmations.delete_selected.message', { entity: t('entity.orders') }) : t('common.confirmations.delete.message', { entity: t('entity.order') }),
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
            useOrderService
                .deleteOrders(orderIds)
                .then(() => {
                    orderIds.forEach((id: number) => {
                        const index = findRecordIndex(records, id);
                        if (index !== -1) records.value.splice(index, 1);
                    });
                    showToast('success', ACTIONS.DELETE, 'order', 'tc');
                })
                .catch((error: any) => {
                    if (error?.response?.status === 419 || error?.response?.status === 401) {
                        console.error('Session expired');
                    }
                    console.error('Error deleting orders');
                });
        }
    });
}

const statusSeverity = (status: string) => {
    const map: Record<string, string> = {
        pending: 'warn',
        confirmed: 'info',
        shipping: 'info',
        delivered: 'success',
        cancelled: 'danger',
        returned: 'danger'
    };
    return map[status] || 'secondary';
};

const paymentSeverity = (status: string) => {
    return status === 'paid' ? 'success' : 'warn';
};

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
        <PageHeader icon="pi pi-shopping-bag" icon-color="#F59E0B" :title="t('common.titles.manage', { entity: t('entity.orders') })" :description="t('common.subtitles.manage', { entity: t('entity.orders').toLowerCase() })">
            <template #actions>
                <Button v-tooltip.top="t('common.tooltips.export_selection', { entity: t('entity.orders') })" :label="t('common.labels.export')" icon="pi pi-upload" outlined severity="info" @click="exportCSV()" />
                <Button v-tooltip.top="t('common.tooltips.add', { entity: t('entity.order') })" :label="`+ ${t('common.labels.new')} ${t('entity.order')}`" severity="primary" :disabled="!dataLoaded" @click="addRecord" />
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
                :currentPageReportTemplate="t('common.paggination.showing_to_of_entity', { first: '{first}', last: '{last}', totalRecords: '{totalRecords}', entity: t('entity.orders') })"
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
                    table: { style: 'min-width: 60rem' },
                    bodyrow: ({ props }: { props: { frozenRow: boolean } }) => ({
                        class: [{ 'font-bold': props.frozenRow }]
                    })
                }"
            >
                <template #header>
                    <Toolbar class="w-full">
                        <template #start>
                            <div class="flex space-x-2">
                                <Button
                                    v-tooltip.top="t('common.tooltips.delete_selected', { entity: t('entity.orders') })"
                                    :label="t('common.labels.delete_selected')"
                                    icon="pi pi-trash"
                                    severity="danger"
                                    @click="
                                        confirmDeleteRecord(
                                            $event,
                                            selectedRecords.map((r: OrderData) => r.id)
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
                <Column columnKey="reference" field="reference" :frozen="frozenColumns.reference" v-if="selectedColumns.some((c: Column) => c.field === 'reference')" sortable class="min-w-36">
                    <template #header>
                        <HeaderCell
                            :text="t('order.columns.reference')"
                            :frozen="frozenColumns.reference"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('reference')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div class="flex items-center gap-2" :class="{ 'font-bold': frozenColumns.reference || highlights[data.id] }">
                                <span class="font-mono text-primary font-semibold cursor-pointer hover:underline" @click="viewRecord(data)">{{ data.reference }}</span>
                                <DataTableHighlightTag v-if="highlights[data.id]" :state="highlights[data.id]" />
                            </div>
                        </DataCell>
                    </template>
                </Column>

                <!-- Customer Column -->
                <Column columnKey="customer" field="customer" v-if="selectedColumns.some((c: Column) => c.field === 'customer')" class="min-w-40">
                    <template #header>
                        <HeaderCell :text="t('order.columns.customer')" :reorderTooltip="t('common.tooltips.reorder_columns')" :lockTooltip="t('common.tooltips.lock_column')" :unlockTooltip="t('common.tooltips.unlock_column')" />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <span v-if="data.customer">{{ data.customer.name }}</span>
                            <span v-else class="text-muted-color">—</span>
                        </DataCell>
                    </template>
                </Column>

                <!-- Status Column -->
                <Column columnKey="status" field="status" v-if="selectedColumns.some((c: Column) => c.field === 'status')" sortable class="min-w-28">
                    <template #header>
                        <HeaderCell :text="t('order.columns.status')" :reorderTooltip="t('common.tooltips.reorder_columns')" :lockTooltip="t('common.tooltips.lock_column')" :unlockTooltip="t('common.tooltips.unlock_column')" />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <Tag :value="t(`order.statuses.${data.status}`)" :severity="statusSeverity(data.status)" />
                        </DataCell>
                    </template>
                </Column>

                <!-- Source Column -->
                <Column columnKey="source" field="source" v-if="selectedColumns.some((c: Column) => c.field === 'source')" sortable class="min-w-28">
                    <template #header>
                        <HeaderCell :text="t('order.columns.source')" :reorderTooltip="t('common.tooltips.reorder_columns')" :lockTooltip="t('common.tooltips.lock_column')" :unlockTooltip="t('common.tooltips.unlock_column')" />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <span class="capitalize">{{ t(`order.sources.${data.source}`) }}</span>
                        </DataCell>
                    </template>
                </Column>

                <!-- Total Column -->
                <Column columnKey="total" field="total" v-if="selectedColumns.some((c: Column) => c.field === 'total')" sortable class="min-w-28">
                    <template #header>
                        <HeaderCell :text="t('order.columns.total')" :reorderTooltip="t('common.tooltips.reorder_columns')" :lockTooltip="t('common.tooltips.lock_column')" :unlockTooltip="t('common.tooltips.unlock_column')" />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <span class="font-semibold">{{ Number(data.total).toLocaleString('fr-DZ') }} DA</span>
                        </DataCell>
                    </template>
                </Column>

                <!-- Payment Status Column -->
                <Column columnKey="payment_status" field="payment_status" v-if="selectedColumns.some((c: Column) => c.field === 'payment_status')" class="min-w-28">
                    <template #header>
                        <HeaderCell :text="t('order.columns.payment_status')" :reorderTooltip="t('common.tooltips.reorder_columns')" :lockTooltip="t('common.tooltips.lock_column')" :unlockTooltip="t('common.tooltips.unlock_column')" />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <Tag :value="t(`order.payment_statuses.${data.payment_status}`)" :severity="paymentSeverity(data.payment_status)" />
                        </DataCell>
                    </template>
                </Column>

                <!-- Created At Column -->
                <Column columnKey="created_at" field="created_at" v-if="selectedColumns.some((c: Column) => c.field === 'created_at')" sortable class="min-w-36">
                    <template #header>
                        <HeaderCell :text="t('order.columns.created_at')" :reorderTooltip="t('common.tooltips.reorder_columns')" :lockTooltip="t('common.tooltips.lock_column')" :unlockTooltip="t('common.tooltips.unlock_column')" />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <span>{{ data.created_at ? new Date(data.created_at).toLocaleDateString() : '—' }}</span>
                        </DataCell>
                    </template>
                </Column>

                <!-- Actions Column -->
                <Column columnKey="actions" :exportable="false" style="min-width: 5rem" :header="t('common.columns.actions')">
                    <template #body="{ data, frozenRow, index }">
                        <div class="flex items-center justify-center gap-1">
                            <RowActionMenu
                                :actions="[
                                    { label: t('common.labels.view'), icon: 'pi pi-eye', command: () => viewRecord(data) },
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
                        <i class="pi pi-shopping-bag text-5xl text-surface-300 dark:text-surface-600 mb-4"></i>
                        <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-200 mb-2">{{ t('common.messages.no_data_title', { entity: t('entity.orders').toLowerCase() }) }}</h3>
                        <p class="text-surface-500 dark:text-surface-400 text-sm mb-6">{{ t('common.messages.no_data_description', { entity: t('entity.order').toLowerCase() }) }}</p>
                        <Button :label="t('common.labels.new') + ' ' + t('entity.order')" icon="pi pi-plus" severity="primary" @click="addRecord" />
                    </div>
                </template>
            </DataTable>
        </template>
    </div>
</template>
