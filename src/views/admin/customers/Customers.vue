<script setup lang="ts">
import DataTableHighlightTag from '@/components/DataTableHighlightTag.vue';
import RowActionMenu from '@/components/common/RowActionMenu.vue';
import { useDataTable } from '@/composables/useDataTable';
import { useDynamicColumns } from '@/composables/useDynamicColumns';
import { useLock } from '@/composables/useLock';
import { useRowEffects } from '@/composables/useRowEffects';
import dayjs from '@/plugins/dayjs';
import { useCustomerService } from '@/services/useCustomerService';
import { useAuthStore } from '@/stores/useAuthStore';
import { findRecordIndex } from '@/utilities/helper';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import type { CustomerData, CustomerFormData, Region, Address, City, ContactMethod } from '@/types/customer';
import { FilterMatchMode } from '@primevue/core/api';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, type Ref, markRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import FormHeader from '@/components/FormHeader.vue';
import DataTableSkeleton from '@/components/DataTableSkeleton.vue';

onMounted(() => {
    initialize();
    subscribeToEcho();
});

const defaultFiltersConfig = {
    id: FilterMatchMode.CONTAINS,
    name: FilterMatchMode.CONTAINS,
    status: FilterMatchMode.EQUALS,
    created_at: FilterMatchMode.DATE_IS
};

const { total, rows, records, selectedRecords, recordDataTable, filters, onPage, onSort, onFilter, clearFilter, searchDone, exportCSV, initialize } = useDataTable<CustomerData>(
    (params: Record<string, unknown>) =>
        useCustomerService.getCustomers(params).then((data) => {
            regions.value = data.regions || [];
            dataLoaded.value = true;
            return {
                data: data.data,
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

const { highlights, markHighlight, getRowClass: baseGetRowClass } = useRowEffects();

const defaultFields = ['name', 'status', 'reputation', 'address', 'phone', 'email', 'created_at'];
const { lockedRow, toggleLock, frozenColumns, toggleColumnFrozen } = useLock(defaultFields, records);

const record = ref<CustomerData | CustomerFormData | null>(null);
const regions = ref<Region[]>([]);
const dataLoaded = ref(false);

interface Column {
    field: string;
    header: string;
}

const defaultColumns = computed<Column[]>(() =>
    defaultFields.map((field) => ({
        field,
        header: t(`customer.columns.${field}`)
    }))
);

const { selectedColumns, columnChanged } = useDynamicColumns('customersColumns', defaultFields, 'customer.columns');

const subscription = ref<any>(null);

interface EchoEvent {
    action: string;
    data: CustomerData | number[];
}

function subscribeToEcho(): void {
    const customersChannel = Echo.private(`data-stream.customers${authStore.user.account_id}`);
    subscription.value = customersChannel.listen('DataStream', (event: EchoEvent) => {
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
    const data = event.data as CustomerData;
    const index = findRecordIndex(records, data.id);
    if (index !== -1) {
        records.value[index] = data;
        markHighlight(data.id, 'updated');
    }
}

function handleStore(event: EchoEvent): void {
    const data = event.data as CustomerData;
    const exists = records.value.some((record: CustomerData) => record.id === data.id);
    if (!exists) {
        records.value.unshift(data);
        markHighlight(data.id, 'new');
    }
}

function addRecord(): void {
    record.value = {
        name: null,
        status: 'active',
        blocking_reason: null,
        addresses: [{ street: '', region: null, city: null, main: true }],
        contactMethods: { phone: null, email: null }
    } as CustomerFormData;
    authStore.errors = {};
    openDialog();
}

function editRecord(row: CustomerData): void {
    authStore.errors = {};
    record.value = row;
    openDialog();
}

const openDialog = () => {
    const isEdit = !!(record.value as CustomerData)?.id;
    dialog.open(formComponent, {
        props: {
            style: { width: '50vw' },
            breakpoints: { '960px': '75vw', '640px': '90vw' },
            modal: true,
            maximizable: true
        },
        templates: {
            header: markRaw(FormHeader)
        },
        data: {
            record: record.value,
            action: isEdit ? ACTIONS.EDIT : ACTIONS.CREATE,
            regions: regions.value,
            headerProps: computed(() => ({
                title: isEdit ? t('common.titles.edit', { entity: t('entity.customer') }) : t('common.titles.add', { entity: t('entity.customer') }),
                description: t('customer.form.subtitle'),
                icon: isEdit ? 'pi pi-user-edit' : 'pi pi-user-plus',
                iconColor: '#3B82F6'
            }))
        },
        onClose: (result) => {
            if (result && result.data?.record?.id) {
                switch (result.data?.action) {
                    case ACTIONS.CREATE:
                        records.value.unshift(result.data.record);
                        markHighlight(result.data.record.id, 'new');
                        showToast('success', ACTIONS.CREATE, 'customer', 'tc');
                        break;
                    case ACTIONS.EDIT: {
                        const index = findRecordIndex(records, result.data.record.id);
                        records.value[index] = result.data.record;
                        markHighlight(result.data.record.id, 'updated');
                        showToast('success', ACTIONS.EDIT, 'customer', 'tc');
                        break;
                    }
                    default:
                        console.error(`Unhandled action: ${result.data?.action}`);
                }
            }
        }
    });
};

function confirmDeleteRecord(event: MouseEvent | null, customerIds: number[]): void {
    confirm.require({
        modal: true,
        target: event?.currentTarget as HTMLElement,
        message: customerIds.length > 1 ? t('common.confirmations.delete_selected.message', { entity: t('entity.customers') }) : t('common.confirmations.delete.message', { entity: t('entity.customer') }),
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
            useCustomerService
                .deleteCustomers(customerIds)
                .then(() => {
                    (async () => {
                        for (const id of customerIds) {
                            const index = findRecordIndex(records, id);
                            if (index !== -1) {
                                records.value.splice(index, 1);
                            }
                        }
                    })();
                    showToast('success', ACTIONS.DELETE, 'customer', 'tc');
                })
                .catch((error: any) => {
                    if (error?.response?.status === 419 || error?.response?.status === 401) {
                        console.error('Session expired, redirecting to login');
                    }
                    console.error('Error deleting customers');
                });
        }
    });
}

// Custom row class to apply blocked customer styling
function getRowClass(data: CustomerData): string {
    const baseClass = baseGetRowClass(data);
    if (data.status === 'blocked') {
        return baseClass ? `${baseClass} customer-row-blocked` : 'customer-row-blocked';
    }
    return baseClass;
}

// Helper to extract address display text
function getAddressText(addresses: Address[]): string {
    if (!addresses || addresses.length === 0) return '';
    const addr = addresses[0];
    const parts: string[] = [];
    if (addr.street) parts.push(addr.street);
    if (addr.city && typeof addr.city === 'object' && 'name' in addr.city) parts.push((addr.city as City).name);
    if (addr.region && typeof addr.region === 'object' && 'name' in addr.region) parts.push((addr.region as Region).name);
    return parts.join(', ');
}

// Helper to get phone from contactMethods array
function getPhone(contactMethods: ContactMethod[]): string | null {
    if (!contactMethods) return null;
    const phone = contactMethods.find((c) => c.type === 'phone');
    return phone?.value || null;
}

// Helper to get email from contactMethods array
function getEmail(contactMethods: ContactMethod[]): string | null {
    if (!contactMethods) return null;
    const email = contactMethods.find((c) => c.type === 'email');
    return email?.value || null;
}

// Reputation system types and helper
interface ReputationData {
    level: 'excellent' | 'good' | 'medium' | 'poor' | 'new';
    label: string;
    percentage: number | null;
    delivered: number;
    returned: number;
    color: string;
    bgColor: string;
}

// Get reputation data for a customer (FAKE DATA for UI testing)
function getReputation(customerId: number): ReputationData {
    // TODO: Replace with real order stats once orders module is built
    // Fake data: cycles through different reputation levels for UI testing
    const fakeReputations: ReputationData[] = [
        {
            level: 'excellent',
            label: t('customer.reputation.levels.excellent'),
            percentage: 95,
            delivered: 47,
            returned: 3,
            color: '#10b981', // green
            bgColor: '#d1fae5'
        },
        {
            level: 'good',
            label: t('customer.reputation.levels.good'),
            percentage: 78,
            delivered: 35,
            returned: 10,
            color: '#3b82f6', // blue
            bgColor: '#dbeafe'
        },
        {
            level: 'medium',
            label: t('customer.reputation.levels.medium'),
            percentage: 56,
            delivered: 22,
            returned: 17,
            color: '#f59e0b', // amber
            bgColor: '#fef3c7'
        },
        {
            level: 'poor',
            label: t('customer.reputation.levels.low'),
            percentage: 32,
            delivered: 8,
            returned: 17,
            color: '#ef4444', // red
            bgColor: '#fee2e2'
        },
        {
            level: 'new',
            label: t('customer.reputation.levels.new'),
            percentage: null,
            delivered: 0,
            returned: 0,
            color: '#64748b', // gray
            bgColor: '#f1f5f9'
        }
    ];

    // Return reputation based on customer ID (for variety in testing)
    return fakeReputations[customerId % fakeReputations.length];
}

onUnmounted(() => {
    if (subscription.value) {
        subscription.value.stopListening('DataStream');
    }
});
</script>

<template>
    <div>
        <!-- Skeleton Loading State -->
        <DataTableSkeleton v-if="!dataLoaded" :columns="7" has-avatar />
        <template v-else>
            <PageHeader icon="pi pi-id-card" icon-color="#8B5CF6" :title="t('common.titles.manage', { entity: t('entity.customers') })" :description="t('customer.labels.manage_subtitle')">
                <template #actions>
                    <Button
                        v-if="authStore.hasPermission('export_customers')"
                        v-tooltip.top="t('common.tooltips.export_selection', { entity: t('entity.customers') })"
                        :label="t('common.labels.export')"
                        icon="pi pi-upload"
                        outlined
                        severity="info"
                        @click="exportCSV($event)"
                    />
                    <Button
                        v-if="authStore.hasPermission('create_customers')"
                        v-tooltip.top="t('common.tooltips.add', { entity: t('entity.customer') })"
                        :label="'+ ' + t('common.labels.new') + ' ' + t('entity.customer')"
                        severity="primary"
                        @click="addRecord"
                    />
                </template>
            </PageHeader>
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
                :currentPageReportTemplate="t('common.paggination.showing_to_of_entity', { first: '{first}', last: '{last}', totalRecords: '{totalRecords}', entity: t('entity.customers') })"
                resizableColumns
                columnResizeMode="fit"
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
                                <Button
                                    v-if="authStore.hasPermission('delete_customers')"
                                    v-tooltip.top="t('common.tooltips.delete_selected', { entity: t('entity.customers') })"
                                    :label="t('common.labels.delete_selected')"
                                    icon="pi pi-trash"
                                    severity="danger"
                                    @click="
                                        confirmDeleteRecord(
                                            $event,
                                            selectedRecords.map((record: CustomerData) => record.id)
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
                            :text="t('customer.columns.name')"
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
                                <i class="pi pi-user"></i>
                                {{ data.name }}
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

                <!-- Status Column -->
                <Column
                    :showClearButton="false"
                    :showApplyButton="false"
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    columnKey="status"
                    field="status"
                    :frozen="frozenColumns.status"
                    v-if="selectedColumns.some((column: Column) => column.field === 'status')"
                    sortable
                    class="min-w-28"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('customer.columns.status')"
                            :frozen="frozenColumns.status"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('status')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div class="inline-flex flex-col items-start gap-0.5">
                                <Tag :value="data.status_label" :severity="data.status === 'active' ? 'success' : 'danger'" :icon="data.status === 'active' ? 'pi pi-check' : 'pi pi-ban'" />
                                <span v-if="data.status === 'blocked' && data.blocking_reason" class="text-[10px] text-red-500 max-w-32 truncate" :title="data.blocking_reason">
                                    {{ data.blocking_reason }}
                                </span>
                            </div>
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <InputGroup>
                            <Select
                                v-model="filterModel.value"
                                :options="[
                                    { label: t('customer.labels.active'), value: 'active' },
                                    { label: t('customer.labels.blocked'), value: 'blocked' }
                                ]"
                                optionLabel="label"
                                optionValue="value"
                                size="small"
                                class="w-full"
                            />
                            <InputGroupAddon>
                                <Button size="small" v-tooltip.top="t('common.labels.apply')" icon="pi pi-check" severity="primary" @click="applyFilter()" />
                                <Button :disabled="!filterModel.value" size="small" v-tooltip.top="t('common.labels.clear', 'filter')" outlined icon="pi pi-times" severity="danger" @click="((filterModel.value = null), applyFilter())" />
                            </InputGroupAddon>
                        </InputGroup>
                    </template>
                </Column>

                <!-- Reputation Column -->
                <Column columnKey="reputation" field="reputation" :frozen="frozenColumns.reputation" v-if="selectedColumns.some((column: Column) => column.field === 'reputation')" class="min-w-44">
                    <template #header>
                        <HeaderCell
                            :text="t('customer.columns.reputation')"
                            :frozen="frozenColumns.reputation"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('reputation')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div class="reputation-cell" :class="{ 'font-bold': frozenColumns.reputation }">
                                <!-- Reputation label and percentage -->
                                <div class="reputation-header">
                                    <span class="reputation-label" :style="{ color: getReputation(data.id).color }">
                                        {{ getReputation(data.id).label }}
                                        <template v-if="getReputation(data.id).percentage !== null">({{ getReputation(data.id).percentage }}%)</template>
                                    </span>
                                </div>
                                <!-- Progress bar -->
                                <div class="reputation-bar" :style="{ backgroundColor: getReputation(data.id).bgColor }">
                                    <div
                                        class="reputation-bar-fill"
                                        :style="{
                                            width: getReputation(data.id).percentage !== null ? getReputation(data.id).percentage + '%' : '0%',
                                            backgroundColor: getReputation(data.id).color
                                        }"
                                    ></div>
                                </div>
                                <!-- Stats: delivered / returned -->
                                <div v-if="getReputation(data.id).level !== 'new'" class="reputation-stats">
                                    <span class="stat-delivered"> <i class="pi pi-check-circle"></i>{{ getReputation(data.id).delivered }} </span>
                                    <span class="stat-returned"> <i class="pi pi-times-circle"></i>{{ getReputation(data.id).returned }} </span>
                                </div>
                                <!-- No history message for new customers -->
                                <div v-else class="reputation-no-history">
                                    {{ t('customer.reputation.labels.no_history') }}
                                </div>
                            </div>
                        </DataCell>
                    </template>
                </Column>

                <!-- Address Column -->
                <Column columnKey="address" field="address" :frozen="frozenColumns.address" v-if="selectedColumns.some((column: Column) => column.field === 'address')">
                    <template #header>
                        <HeaderCell
                            :text="t('customer.columns.address')"
                            :frozen="frozenColumns.address"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('address')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div class="flex items-center gap-2 max-w-40" :class="{ 'font-bold': frozenColumns.address }" :title="getAddressText(data.addresses)">
                                <i class="pi pi-map-marker text-surface-400 flex-shrink-0"></i>
                                <span class="truncate">{{ getAddressText(data.addresses) || '-' }}</span>
                            </div>
                        </DataCell>
                    </template>
                </Column>

                <!-- Phone Column -->
                <Column columnKey="phone" field="phone" :frozen="frozenColumns.phone" v-if="selectedColumns.some((column: Column) => column.field === 'phone')" class="min-w-24">
                    <template #header>
                        <HeaderCell
                            :text="t('customer.columns.phone')"
                            :frozen="frozenColumns.phone"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('phone')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div class="flex items-center gap-2" :class="{ 'font-bold': frozenColumns.phone }">
                                <i class="pi pi-phone text-surface-400"></i>
                                <span>{{ getPhone(data.contactMethods) || '-' }}</span>
                            </div>
                        </DataCell>
                    </template>
                </Column>

                <!-- Email Column -->
                <Column columnKey="email" field="email" :frozen="frozenColumns.email" v-if="selectedColumns.some((column: Column) => column.field === 'email')" class="min-w-28">
                    <template #header>
                        <HeaderCell
                            :text="t('customer.columns.email')"
                            :frozen="frozenColumns.email"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('email')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div class="flex items-center gap-2" :class="{ 'font-bold': frozenColumns.email }">
                                <i class="pi pi-envelope text-surface-400"></i>
                                <span>{{ getEmail(data.contactMethods) || '-' }}</span>
                            </div>
                        </DataCell>
                    </template>
                </Column>

                <!-- Created At Column -->
                <Column
                    :showClearButton="false"
                    :showApplyButton="false"
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    dataType="date"
                    columnKey="created_at"
                    field="created_at"
                    :frozen="frozenColumns.created_at"
                    v-if="selectedColumns.some((column: Column) => column.field === 'created_at')"
                    sortable
                    class="min-w-36"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('customer.columns.created_at')"
                            :frozen="frozenColumns.created_at"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('created_at')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div :class="{ 'font-bold': frozenColumns.created_at }">
                                {{ dayjs(data.created_at).format('L LT') }}
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
                                <DatePicker v-model="filterModel.value" dateFormat="yy-mm-dd" :showClear="false" :manualInput="false" />
                                <InputGroupAddon>
                                    <Button size="small" icon="pi pi-check" severity="primary" @click="applyFilter()" />
                                    <Button size="small" v-tooltip.top="t('common.labels.clear', 'filter')" outlined icon="pi pi-times" severity="danger" @click="((filterModel.value = null), applyFilter())" />
                                </InputGroupAddon>
                            </InputGroup>
                        </div>
                    </template>
                </Column>

                <!-- Actions Column -->
                <Column columnKey="actions" :exportable="false" style="min-width: 5rem" :header="t('common.columns.actions')">
                    <template #body="{ data, frozenRow, index }">
                        <DataCell>
                            <div class="flex items-center justify-center gap-1">
                                <RowActionMenu
                                    :actions="[
                                        { label: t('common.labels.view'), icon: 'pi pi-eye', command: () => editRecord(data), visible: authStore.hasPermission('view_customers') },
                                        { label: t('common.labels.edit'), icon: 'pi pi-pencil', command: () => editRecord(data), visible: authStore.hasPermission('update_customers') },
                                        { label: t('common.labels.delete'), icon: 'pi pi-trash', severity: 'danger', command: () => confirmDeleteRecord(null, [data.id]), visible: authStore.hasPermission('delete_customers') }
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

            <!-- Reputation System Explanation -->
            <Card class="mt-6">
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-verified text-primary"></i>
                        <span>{{ t('customer.reputation.title') }}</span>
                    </div>
                </template>
                <template #subtitle>
                    {{ t('customer.reputation.description') }}
                </template>
                <template #content>
                    <div class="flex justify-between gap-4 flex-wrap">
                        <div class="flex flex-col items-start gap-2 flex-1 min-w-32">
                            <Tag severity="success" :value="t('customer.reputation.levels.excellent')" />
                            <span class="font-semibold">≥ 90%</span>
                            <span class="text-sm text-surface-500">{{ t('customer.reputation.labels.very_reliable') }}</span>
                        </div>
                        <div class="flex flex-col items-start gap-2 flex-1 min-w-32">
                            <Tag severity="info" :value="t('customer.reputation.levels.good')" />
                            <span class="font-semibold">70% - 89%</span>
                            <span class="text-sm text-surface-500">{{ t('customer.reputation.labels.reliable') }}</span>
                        </div>
                        <div class="flex flex-col items-start gap-2 flex-1 min-w-32">
                            <Tag severity="warn" :value="t('customer.reputation.levels.medium')" />
                            <span class="font-semibold">50% - 69%</span>
                            <span class="text-sm text-surface-500">{{ t('customer.reputation.labels.attention_required') }}</span>
                        </div>
                        <div class="flex flex-col items-start gap-2 flex-1 min-w-32">
                            <Tag severity="danger" :value="t('customer.reputation.levels.low')" />
                            <span class="font-semibold">&lt; 50%</span>
                            <span class="text-sm text-surface-500">{{ t('customer.reputation.labels.at_risk') }}</span>
                        </div>
                        <div class="flex flex-col items-start gap-2 flex-1 min-w-32">
                            <Tag severity="secondary" :value="t('customer.reputation.levels.new')" />
                            <span class="font-semibold">0 {{ t('customer.reputation.orders_abbrev') }}</span>
                            <span class="text-sm text-surface-500">{{ t('customer.reputation.labels.no_history') }}</span>
                        </div>
                    </div>
                </template>
            </Card>
        </template>
    </div>
</template>
