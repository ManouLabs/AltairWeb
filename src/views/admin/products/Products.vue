<script setup lang="ts">
import ActiveToggleButton from '@/components/ActiveToggleButton.vue';
import DataTableHighlightTag from '@/components/DataTableHighlightTag.vue';
import RowActionMenu from '@/components/common/RowActionMenu.vue';
import { useDataTable } from '@/composables/useDataTable';
import { useDynamicColumns } from '@/composables/useDynamicColumns';
import { useLock } from '@/composables/useLock';
import { useRowEffects } from '@/composables/useRowEffects';
import dayjs from '@/plugins/dayjs';
import { useProductService } from '@/services/useProductService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { useQuotaStore } from '@/stores/useQuotaStore';
import QuotaBanner from '@/components/QuotaBanner.vue';
import { findRecordIndex } from '@/utilities/helper';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import type { ProductData } from '@/types/product';
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
    name: FilterMatchMode.CONTAINS,
    sku_prefix: FilterMatchMode.CONTAINS,
    category_id: FilterMatchMode.IN,
    stock_type: FilterMatchMode.EQUALS,
    active: FilterMatchMode.EQUALS
};

const { total, rows, records, selectedRecords, recordDataTable, filters, onPage, onSort, onFilter, clearFilter, searchDone, exportCSV, initialize } = useDataTable<ProductData>(
    (params: Record<string, unknown>) =>
        useProductService.getProducts(params).then((data) => {
            allCategories.value = data.categories;
            dataLoaded.value = true;
            return {
                data: data.products,
                meta: data.meta
            };
        }),
    defaultFiltersConfig
);

const authStore = useAuthStore();
const loading = useLoading();
const quotaStore = useQuotaStore();
if (!quotaStore.loaded) quotaStore.fetchQuotas();
const confirm = useConfirm();
const router = useRouter();
const { showToast } = useShowToast();
const { t } = useI18n();

const { highlights, markHighlight, getRowClass } = useRowEffects();

const defaultFields = ['sku', 'name', 'category', 'sale_price', 'stock', 'active'];
const { lockedRow, toggleLock, frozenColumns, toggleColumnFrozen } = useLock(defaultFields, records);

const dataLoaded = ref(false);
const loadingActiveId = ref<number | null>(null);
const isDeleting = ref(false);
const allCategories = ref<any[]>([]);

interface Column {
    field: string;
    header: string;
}

const defaultColumns = computed<Column[]>(() =>
    defaultFields.map((field) => ({
        field,
        header: t(`product.columns.${field}`)
    }))
);

const { selectedColumns, columnChanged } = useDynamicColumns('productsColumns', defaultFields, 'product.columns');

const subscription = ref<any>(null);

interface EchoEvent {
    action: string;
    data: ProductData | number[];
}

function subscribeToEcho(): void {
    const channel = Echo.private(`data-stream.product${authStore.user.account_id}`);
    subscription.value = channel.listen('DataStream', (event: EchoEvent) => {
        handleEchoEvent(event);
    });
}

function handleEchoEvent(event: EchoEvent): void {
    switch (event.action) {
        case ACTIONS.DELETE:
            handleDeleteEvent(event);
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

async function handleDeleteEvent(event: EchoEvent): Promise<void> {
    for (const id of event.data as number[]) {
        const index = findRecordIndex(records, id);
        if (index !== -1) {
            records.value.splice(index, 1);
        }
    }
}

function handleUpdate(event: EchoEvent): void {
    const data = event.data as ProductData;
    const index = findRecordIndex(records, data.id);
    if (index !== -1) {
        records.value[index] = data;
        markHighlight(data.id, 'updated');
    }
}

function handleStore(event: EchoEvent): void {
    const data = event.data as ProductData;
    const exists = records.value.some((record: ProductData) => record.id === data.id);
    if (!exists) {
        records.value.unshift(data);
        markHighlight(data.id, 'new');
    }
}

function addRecord(): void {
    router.push({ name: 'product-create' });
}

function editRecord(row: ProductData): void {
    router.push({ name: 'product-edit', params: { id: row.id } });
}

function viewRecord(row: ProductData): void {
    router.push({ name: 'product-show', params: { id: row.id } });
}

function confirmDeleteRecord(event: MouseEvent | null, productIds: number[]): void {
    confirm.require({
        target: event?.currentTarget as HTMLElement,
        message: productIds.length > 1 ? t('common.confirmations.delete_selected.message', { entity: t('entity.products') }) : t('common.confirmations.delete.message', { entity: t('entity.product') }),
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
            isDeleting.value = true;
            loading.startFormSending();
            loading.startPageLoading();
            useProductService
                .deleteProducts(productIds)
                .then(() => {
                    for (const id of productIds) {
                        const index = findRecordIndex(records, id);
                        if (index !== -1) {
                            records.value.splice(index, 1);
                        }
                    }
                    selectedRecords.value = [];
                    showToast('success', ACTIONS.DELETE, 'product', 'tc');
                })
                .catch((error: any) => {
                    if (error?.response?.status === 419 || error?.response?.status === 401) {
                        console.error('Session expired, redirecting to login');
                    }
                    console.error('Error deleting products');
                })
                .finally(() => {
                    isDeleting.value = false;
                    loading.stopFormSending();
                    loading.stopPageLoading();
                });
        }
    });
}

function toggleActive(productId: number): void {
    loadingActiveId.value = productId;
    loading.startPageLoading();
    useProductService
        .toggleActive(productId)
        .then((response) => {
            const index = findRecordIndex(records, productId);
            if (index !== -1) {
                records.value[index] = response.data;
                markHighlight(productId, 'updated');
            }
            showToast('success', ACTIONS.EDIT, 'product', 'tc');
        })
        .catch(() => {
            console.error('Error toggling product');
        })
        .finally(() => {
            loadingActiveId.value = null;
            loading.stopPageLoading();
        });
}

function formatCurrency(value: number | null): string {
    if (value === null || value === undefined) return '—';
    return new Intl.NumberFormat('fr-DZ', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + ' DA';
}

function getStockDisplay(data: ProductData): number {
    if (data.stock_type === 'variant' && data.variants) {
        return data.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    }
    return data.total_stock || 0;
}

function getStockSeverity(data: ProductData): string {
    const stock = getStockDisplay(data);
    if (stock === 0) return 'danger';
    if (stock <= (data.low_stock_threshold || 10)) return 'warn';
    return 'success';
}

function getStockLabel(data: ProductData): string {
    const stock = getStockDisplay(data);
    if (stock === 0) return t('product.labels.out_of_stock');
    if (stock <= (data.low_stock_threshold || 10)) return t('product.labels.low_stock');
    return t('product.labels.in_stock');
}

onUnmounted(() => {
    if (subscription.value) {
        subscription.value.stopListening('DataStream');
    }
});
</script>

<template>
    <div>
        <!-- Page Header (always visible) -->
        <PageHeader icon="pi pi-box" icon-color="#8B5CF6" :title="t('common.titles.manage', { entity: t('entity.products') })" :description="t('product.labels.manage_subtitle')">
            <template #actions>
                <Button
                    v-if="authStore.hasPermission('export_products')"
                    v-tooltip.top="t('common.tooltips.export_selection', { entity: t('entity.products') })"
                    :label="t('common.labels.export')"
                    icon="pi pi-upload"
                    outlined
                    severity="info"
                    :disabled="!dataLoaded"
                    @click="exportCSV($event)"
                />
                <Button
                    v-if="authStore.hasPermission('create_products')"
                    v-tooltip.top="!quotaStore.canCreate('products') ? t('quota.limit_reached', { entity: t('entity.product') }) : t('common.tooltips.add', { entity: t('entity.product') })"
                    :label="'+ ' + t('common.labels.new') + ' ' + t('entity.product')"
                    severity="primary"
                    :disabled="!dataLoaded || !quotaStore.canCreate('products')"
                    @click="addRecord"
                />
            </template>
        </PageHeader>

        <!-- Quota Banner -->
        <QuotaBanner
            v-if="quotaStore.getStatus('products')"
            resource="products"
            :used="quotaStore.getUsage('products')"
            :limit="quotaStore.getLimit('products')"
            :percentage="quotaStore.getPercentage('products')"
            :status="quotaStore.getStatus('products')"
        />

        <!-- Skeleton Loading State -->
        <DataTableSkeleton v-if="!dataLoaded" :columns="6" />

        <!-- DataTable -->
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
                :currentPageReportTemplate="t('common.paggination.showing_to_of_entity', { first: '{first}', last: '{last}', totalRecords: '{totalRecords}', entity: t('entity.products') })"
                resizableColumns
                columnResizeMode="expand"
                reorderableColumns
                :frozenValue="lockedRow"
                sortField="name"
                :sortOrder="1"
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
                                <Button
                                    v-if="authStore.hasPermission('delete_products')"
                                    v-tooltip.top="t('common.tooltips.delete_selected', { entity: t('entity.products') })"
                                    :label="t('common.labels.delete_selected')"
                                    icon="pi pi-trash"
                                    severity="danger"
                                    @click="
                                        confirmDeleteRecord(
                                            $event,
                                            selectedRecords.map((record: ProductData) => record.id)
                                        )
                                    "
                                    outlined
                                    :disabled="!selectedRecords || !selectedRecords.length"
                                    :loading="isDeleting"
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

                <!-- SKU Column -->
                <Column
                    :showClearButton="false"
                    :showApplyButton="false"
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    columnKey="sku"
                    field="sku_prefix"
                    :frozen="frozenColumns.sku"
                    v-if="selectedColumns.some((column: Column) => column.field === 'sku')"
                    sortable
                    class="min-w-28"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('product.columns.sku')"
                            :frozen="frozenColumns.sku"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('sku')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <span v-if="data.sku_prefix" class="font-mono text-sm text-surface-600 dark:text-surface-300">{{ data.sku_prefix }}</span>
                            <span v-else class="text-surface-400 text-xs italic">—</span>
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
                    class="min-w-52"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('product.columns.name')"
                            :frozen="frozenColumns.name"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('name')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div class="flex items-center gap-3 cursor-pointer" @click="viewRecord(data)">
                                <div v-if="data.image" class="w-10 h-10 rounded-lg overflow-hidden bg-surface-100 dark:bg-surface-800 flex-shrink-0">
                                    <img :src="data.image.url" :alt="data.name" class="w-full h-full object-cover" />
                                </div>
                                <div v-else class="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center flex-shrink-0">
                                    <i class="pi pi-box text-surface-400"></i>
                                </div>
                                <div>
                                    <div class="font-semibold text-surface-800 dark:text-surface-100" :class="{ 'font-bold': frozenColumns.name || highlights[data.id] }">
                                        {{ data.name }}
                                        <DataTableHighlightTag v-if="highlights[data.id]" :state="highlights[data.id]" />
                                    </div>
                                    <div class="text-xs text-surface-400 mt-0.5">
                                        <span v-if="data.sku_prefix">{{ data.sku_prefix }}</span>
                                        <span v-if="data.sku_prefix && data.active"> · </span>
                                        <span v-if="data.active">{{ t('common.labels.active') }} · {{ dayjs(data.updated_at).fromNow() }}</span>
                                        <span v-else>{{ t('common.labels.inactive') }}</span>
                                    </div>
                                </div>
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

                <!-- Category Column -->
                <Column
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    :showClearButton="false"
                    :showApplyButton="false"
                    columnKey="category"
                    field="category_id"
                    :frozen="frozenColumns.category"
                    v-if="selectedColumns.some((column: Column) => column.field === 'category')"
                    class="min-w-36"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('product.columns.category')"
                            :frozen="frozenColumns.category"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('category')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <Tag v-if="data.category" :value="data.category.name" severity="info" />
                            <span v-else class="text-surface-400 text-xs italic">{{ t('product.labels.no_category') }}</span>
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <InputGroup>
                            <MultiSelect size="small" v-model="filterModel.value" :options="allCategories" optionLabel="name" optionValue="id" filter :placeholder="t('product.form.category_placeholder')">
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

                <!-- Sale Price Column -->
                <Column columnKey="sale_price" field="sale_price" :frozen="frozenColumns.sale_price" v-if="selectedColumns.some((column: Column) => column.field === 'sale_price')" sortable class="min-w-28">
                    <template #header>
                        <HeaderCell
                            :text="t('product.columns.sale_price')"
                            :frozen="frozenColumns.sale_price"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('sale_price')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <span class="font-semibold">{{ formatCurrency(data.sale_price) }}</span>
                        </DataCell>
                    </template>
                </Column>

                <!-- Stock Column -->
                <Column columnKey="stock" field="total_stock" :frozen="frozenColumns.stock" v-if="selectedColumns.some((column: Column) => column.field === 'stock')" sortable class="min-w-28">
                    <template #header>
                        <HeaderCell
                            :text="t('product.columns.stock')"
                            :frozen="frozenColumns.stock"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('stock')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div class="flex flex-col gap-1">
                                <div class="flex items-center gap-2">
                                    <span class="font-bold text-lg text-surface-800 dark:text-surface-100">{{ getStockDisplay(data) }}</span>
                                    <Tag :value="getStockLabel(data)" :severity="getStockSeverity(data)" class="text-xs px-2 py-0.5" />
                                </div>
                                <div class="w-full h-1 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                                    <div
                                        class="h-full rounded-full transition-all duration-300"
                                        :class="{
                                            'bg-green-500': getStockSeverity(data) === 'success',
                                            'bg-yellow-500': getStockSeverity(data) === 'warn',
                                            'bg-red-500': getStockSeverity(data) === 'danger'
                                        }"
                                        :style="{ width: Math.min(100, (getStockDisplay(data) / Math.max(getStockDisplay(data), data.low_stock_threshold || 10, 1)) * 100) + '%' }"
                                    />
                                </div>
                            </div>
                        </DataCell>
                    </template>
                </Column>

                <!-- Active Column -->
                <Column columnKey="active" field="active" :frozen="frozenColumns.active" v-if="selectedColumns.some((column: Column) => column.field === 'active')" class="min-w-28">
                    <template #header>
                        <HeaderCell
                            :text="t('product.columns.active')"
                            :frozen="frozenColumns.active"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('active')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <ActiveToggleButton :active="data.active" entity="product" :loading="loadingActiveId === data.id" @toggle="toggleActive(data.id)" />
                        </DataCell>
                    </template>
                </Column>

                <!-- Actions Column -->
                <Column key="actions" :exportable="false" style="width: 3rem">
                    <template #body="{ data }">
                        <div class="flex items-center gap-1">
                            <RowActionMenu
                                :actions="[
                                    { label: t('common.labels.view'), icon: 'pi pi-eye', command: () => viewRecord(data), visible: authStore.hasPermission('view_products') },
                                    { label: t('common.labels.edit'), icon: 'pi pi-pencil', command: () => editRecord(data), visible: authStore.hasPermission('update_products') },
                                    { label: t('common.labels.delete'), icon: 'pi pi-trash', severity: 'danger', command: () => confirmDeleteRecord(null, [data.id]), visible: authStore.hasPermission('delete_products') }
                                ]"
                            />
                            <Button
                                v-tooltip.top="lockedRow?.some((r: ProductData) => r.id === data.id) ? t('common.tooltips.unlock_row') : t('common.tooltips.lock_row')"
                                :icon="lockedRow?.some((r: ProductData) => r.id === data.id) ? 'pi pi-lock' : 'pi pi-lock-open'"
                                text
                                rounded
                                size="small"
                                @click="toggleLock(data)"
                                severity="secondary"
                            />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </template>
    </div>
</template>
