<script setup lang="ts">
import DataTableHighlightTag from '@/components/DataTableHighlightTag.vue';
import RowActionMenu from '@/components/common/RowActionMenu.vue';
import InitialsAvatar from '@/components/common/InitialsAvatar.vue';
import ReputationBadge from '@/components/common/ReputationBadge.vue';
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
const defaultFields = ['reference', 'customer', 'products', 'status', 'source', 'shipping_type', 'shop', 'shipper', 'subtotal', 'shipping_fee', 'total', 'payment_status'];
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

// --- Status helpers ---

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

const statusIcon = (status: string) => {
    const map: Record<string, string> = {
        pending: 'pi pi-clock',
        confirmed: 'pi pi-check',
        shipping: 'pi pi-truck',
        delivered: 'pi pi-check-circle',
        cancelled: 'pi pi-times-circle',
        returned: 'pi pi-replay'
    };
    return map[status] || 'pi pi-question-circle';
};

const paymentSeverity = (status: string) => {
    return status === 'paid' ? 'success' : 'warn';
};

const paymentIcon = (status: string) => {
    return status === 'paid' ? 'pi pi-check-circle' : 'pi pi-clock';
};

// --- Source icon helper ---

const sourceIcon = (source: string) => {
    const map: Record<string, string> = {
        tiktok: 'pi pi-tiktok',
        whatsapp: 'pi pi-whatsapp',
        facebook: 'pi pi-facebook',
        youcan: 'pi pi-shopping-cart',
        shopify: 'pi pi-shopping-cart',
        woocommerce: 'pi pi-shopping-cart',
        direct_website: 'pi pi-globe',
        other: 'pi pi-ellipsis-h'
    };
    return map[source] || 'pi pi-question-circle';
};

// --- Shipping type icon helper ---

const shippingTypeIcon = (type: string) => {
    return type === 'home_delivery' ? 'pi pi-home' : 'pi pi-building';
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

        <DataTableSkeleton v-if="!dataLoaded" :columns="12" has-tag-column />
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
                    table: { style: 'min-width: 90rem' },
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
                                <div>
                                    <span class="font-mono text-primary font-semibold cursor-pointer hover:underline" @click="viewRecord(data)">{{ data.reference }}</span>
                                    <div class="text-xs text-surface-400 mt-0.5">{{ data.created_at ? new Date(data.created_at).toLocaleDateString() : '—' }}</div>
                                </div>
                                <DataTableHighlightTag v-if="highlights[data.id]" :state="highlights[data.id]" />
                            </div>
                        </DataCell>
                    </template>
                </Column>

                <!-- Customer Column -->
                <Column columnKey="customer" field="customer" v-if="selectedColumns.some((c: Column) => c.field === 'customer')" class="min-w-52">
                    <template #header>
                        <HeaderCell :text="t('order.columns.customer')" :reorderTooltip="t('common.tooltips.reorder_columns')" :lockTooltip="t('common.tooltips.lock_column')" :unlockTooltip="t('common.tooltips.unlock_column')" />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div v-if="data.customer" class="flex items-start gap-2.5">
                                <InitialsAvatar :name="data.customer.name" size="sm" class="mt-0.5" />
                                <div class="flex-1 min-w-0">
                                    <span class="font-semibold text-sm text-surface-800 dark:text-surface-100 truncate block">{{ data.customer.name }}</span>
                                    <div class="flex items-center gap-2 text-[10px] text-surface-400 mt-0.5">
                                        <span v-if="data.customer.phone || data.customer.contactMethods?.find((c: any) => c.type === 'phone')" class="flex items-center gap-0.5">
                                            <i class="pi pi-phone text-[9px]"></i> {{ data.customer.phone || data.customer.contactMethods?.find((c: any) => c.type === 'phone')?.value }}
                                        </span>
                                        <span v-if="data.customer.email || data.customer.contactMethods?.find((c: any) => c.type === 'email')" class="flex items-center gap-0.5 truncate">
                                            <i class="pi pi-envelope text-[9px]"></i> {{ data.customer.email || data.customer.contactMethods?.find((c: any) => c.type === 'email')?.value }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <span v-else class="text-muted-color">—</span>
                            <!-- Reputation bar -->
                            <div v-if="data.customer" class="mt-1">
                                <ReputationBadge :reputation="data.customer.reputation" size="sm" />
                            </div>
                        </DataCell>
                    </template>
                </Column>

                <!-- 5. Products Column -->
                <Column columnKey="products" field="products" v-if="selectedColumns.some((c: Column) => c.field === 'products')" class="min-w-44">
                    <template #header>
                        <HeaderCell :text="t('order.columns.products')" :reorderTooltip="t('common.tooltips.reorder_columns')" :lockTooltip="t('common.tooltips.lock_column')" :unlockTooltip="t('common.tooltips.unlock_column')" />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div v-if="data.items?.length" class="flex flex-col gap-1">
                                <div v-for="(item, idx) in data.items.slice(0, 2)" :key="idx" class="flex items-center gap-2">
                                    <i class="pi pi-box text-surface-400 text-xs flex-shrink-0"></i>
                                    <div class="flex-1 min-w-0">
                                        <span class="text-xs font-medium text-surface-700 dark:text-surface-200 truncate block">{{ item.product_name }}</span>
                                        <span v-if="item.variant_label" class="text-[10px] text-surface-400">{{ item.variant_label }}</span>
                                    </div>
                                    <span class="text-[10px] text-surface-400 flex-shrink-0">×{{ item.quantity }}</span>
                                </div>
                                <span v-if="data.items.length > 2" class="text-[10px] text-primary font-medium">+{{ data.items.length - 2 }} more</span>
                            </div>
                            <span v-else class="text-muted-color">—</span>
                        </DataCell>
                    </template>
                </Column>

                <!-- 6. Status Column (with icon) -->
                <Column columnKey="status" field="status" v-if="selectedColumns.some((c: Column) => c.field === 'status')" sortable class="min-w-28">
                    <template #header>
                        <HeaderCell :text="t('order.columns.status')" :reorderTooltip="t('common.tooltips.reorder_columns')" :lockTooltip="t('common.tooltips.lock_column')" :unlockTooltip="t('common.tooltips.unlock_column')" />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <Tag :value="t(`order.statuses.${data.status}`)" :severity="statusSeverity(data.status)" :icon="statusIcon(data.status)" />
                        </DataCell>
                    </template>
                </Column>

                <!-- 3. Source Column (with icon) -->
                <Column columnKey="source" field="source" v-if="selectedColumns.some((c: Column) => c.field === 'source')" sortable class="min-w-28">
                    <template #header>
                        <HeaderCell :text="t('order.columns.source')" :reorderTooltip="t('common.tooltips.reorder_columns')" :lockTooltip="t('common.tooltips.lock_column')" :unlockTooltip="t('common.tooltips.unlock_column')" />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div v-if="data.source" class="flex items-center gap-2">
                                <i :class="sourceIcon(data.source)" class="text-surface-500"></i>
                                <span class="capitalize text-sm">{{ t(`order.sources.${data.source}`) }}</span>
                            </div>
                            <span v-else class="text-muted-color">—</span>
                        </DataCell>
                    </template>
                </Column>

                <!-- 4. Shipping Type Column (with icon) -->
                <Column columnKey="shipping_type" field="shipping_type" v-if="selectedColumns.some((c: Column) => c.field === 'shipping_type')" class="min-w-32">
                    <template #header>
                        <HeaderCell :text="t('order.columns.shipping_type')" :reorderTooltip="t('common.tooltips.reorder_columns')" :lockTooltip="t('common.tooltips.lock_column')" :unlockTooltip="t('common.tooltips.unlock_column')" />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div v-if="data.shipping_type" class="flex items-center gap-2">
                                <i :class="shippingTypeIcon(data.shipping_type)" class="text-surface-500"></i>
                                <span class="text-sm">{{ t(`order.shipping_types.${data.shipping_type}`) }}</span>
                            </div>
                            <span v-else class="text-muted-color">—</span>
                        </DataCell>
                    </template>
                </Column>

                <!-- 1. Shop Column (with icon, no image field exists) -->
                <Column columnKey="shop" field="shop" v-if="selectedColumns.some((c: Column) => c.field === 'shop')" class="min-w-28">
                    <template #header>
                        <HeaderCell :text="t('order.columns.shop')" :reorderTooltip="t('common.tooltips.reorder_columns')" :lockTooltip="t('common.tooltips.lock_column')" :unlockTooltip="t('common.tooltips.unlock_column')" />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div v-if="data.shop" class="flex items-center gap-2">
                                <i class="pi pi-shop text-surface-500"></i>
                                <span class="text-sm">{{ data.shop.name }}</span>
                            </div>
                            <span v-else class="text-muted-color">—</span>
                        </DataCell>
                    </template>
                </Column>

                <!-- 2. Shipper Column (with icon) -->
                <Column columnKey="shipper" field="shipper" v-if="selectedColumns.some((c: Column) => c.field === 'shipper')" class="min-w-28">
                    <template #header>
                        <HeaderCell :text="t('order.columns.shipper')" :reorderTooltip="t('common.tooltips.reorder_columns')" :lockTooltip="t('common.tooltips.lock_column')" :unlockTooltip="t('common.tooltips.unlock_column')" />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div v-if="data.shipper" class="flex items-center gap-2">
                                <i class="pi pi-truck text-surface-500"></i>
                                <div>
                                    <span class="text-sm block">{{ data.shipper.name }}</span>
                                    <span v-if="data.shipper.type" class="text-[10px] text-surface-400 capitalize">{{ data.shipper.type }}</span>
                                </div>
                            </div>
                            <span v-else class="text-muted-color">—</span>
                        </DataCell>
                    </template>
                </Column>

                <!-- 9. Subtotal Column -->
                <Column columnKey="subtotal" field="subtotal" v-if="selectedColumns.some((c: Column) => c.field === 'subtotal')" sortable class="min-w-28">
                    <template #header>
                        <HeaderCell :text="t('order.columns.subtotal')" :reorderTooltip="t('common.tooltips.reorder_columns')" :lockTooltip="t('common.tooltips.lock_column')" :unlockTooltip="t('common.tooltips.unlock_column')" />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <span class="text-sm">{{ Number(data.subtotal).toLocaleString('fr-DZ') }} DA</span>
                        </DataCell>
                    </template>
                </Column>

                <!-- 8. Shipping Fee Column -->
                <Column columnKey="shipping_fee" field="shipping_fee" v-if="selectedColumns.some((c: Column) => c.field === 'shipping_fee')" sortable class="min-w-28">
                    <template #header>
                        <HeaderCell :text="t('order.columns.shipping_fee')" :reorderTooltip="t('common.tooltips.reorder_columns')" :lockTooltip="t('common.tooltips.lock_column')" :unlockTooltip="t('common.tooltips.unlock_column')" />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <span class="text-sm">{{ Number(data.shipping_fee).toLocaleString('fr-DZ') }} DA</span>
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

                <!-- 7. Payment Status Column (with icon) -->
                <Column columnKey="payment_status" field="payment_status" v-if="selectedColumns.some((c: Column) => c.field === 'payment_status')" class="min-w-28">
                    <template #header>
                        <HeaderCell :text="t('order.columns.payment_status')" :reorderTooltip="t('common.tooltips.reorder_columns')" :lockTooltip="t('common.tooltips.lock_column')" :unlockTooltip="t('common.tooltips.unlock_column')" />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <Tag :value="t(`order.payment_statuses.${data.payment_status}`)" :severity="paymentSeverity(data.payment_status)" :icon="paymentIcon(data.payment_status)" />
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
