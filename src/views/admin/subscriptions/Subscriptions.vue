<script setup lang="ts">
import DataTableHighlightTag from '@/components/DataTableHighlightTag.vue';
import RowActionMenu from '@/components/common/RowActionMenu.vue';
import ActiveToggleButton from '@/components/ActiveToggleButton.vue';
import { useDataTable } from '@/composables/useDataTable';
import { useDynamicColumns } from '@/composables/useDynamicColumns';
import { useLock } from '@/composables/useLock';
import { useRowEffects } from '@/composables/useRowEffects';
import { useSubscriptionService } from '@/services/useSubscriptionService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { findRecordIndex } from '@/utilities/helper';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { FilterMatchMode } from '@primevue/core/api';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, markRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import FormHeader from '@/components/FormHeader.vue';
import DataTableSkeleton from '@/components/DataTableSkeleton.vue';

onMounted(() => {
    initialize();
    subscribeToEcho();
});

const { t } = useI18n();
const loadingStore = useLoading();

// ── Filters ───────────────────────────────────────────────
const defaultFiltersConfig = {
    id: FilterMatchMode.CONTAINS,
    account_name: {
        matchMode: FilterMatchMode.CONTAINS,
        relation: { name: 'account', column: 'legal_name' }
    },
    plan_name: {
        matchMode: FilterMatchMode.IN,
        relation: { name: 'plan', column: 'name' }
    },
    billing_period: FilterMatchMode.EQUALS,
    active: FilterMatchMode.EQUALS,
    starts_at: FilterMatchMode.CONTAINS,
    ends_at: FilterMatchMode.CONTAINS
};

// Auxiliary data from the API
const accounts = ref<any[]>([]);
const plans = ref<any[]>([]);

const billingPeriodOptions = [
    { label: 'Month', value: 'month' },
    { label: 'Year', value: 'year' }
];

const activeOptions = [
    { label: 'Yes', value: 1 },
    { label: 'No', value: 0 }
];
const loadingActiveId = ref<number | null>(null);

// ── DataTable ─────────────────────────────────────────────
const { total, rows, records, selectedRecords, recordDataTable, filters, onPage, onSort, onFilter, clearFilter, searchDone, exportCSV, initialize } = useDataTable(
    (params: any) =>
        useSubscriptionService.getSubscriptions(params).then((data) => {
            accounts.value = data.accounts || [];
            plans.value = data.plans || [];
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

// Highlights
const { highlights, markHighlight, getRowClass } = useRowEffects();

// Row lock + column freezing
const defaultFields = ['account_name', 'plan_name', 'billing_period', 'starts_at', 'ends_at', 'notes', 'quotas', 'active'];
const { lockedRow, toggleLock, frozenColumns, toggleColumnFrozen } = useLock(defaultFields, records);

const record = ref<Record<string, any> | null>(null);
const dataLoaded = ref(false);
const defaultColumns = computed(() =>
    defaultFields.map((field) => ({
        field,
        header: t(`subscription.columns.${field}`)
    }))
);

const { selectedColumns, columnChanged } = useDynamicColumns('subscriptionsColumns', defaultFields, 'subscription.columns');
const echoSubscription = ref<any>(null);

// ── Echo ──────────────────────────────────────────────────
function subscribeToEcho() {
    echoSubscription.value = Echo.private('data-stream.subscriptions').listen('DataStream', (event: Record<string, any>) => {
        handleEchoEvent(event);
    });
}

function handleEchoEvent(event: Record<string, any>) {
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

function handleDelete(event: Record<string, any>) {
    event.data.forEach((id: number) => {
        const index = findRecordIndex(records, id);
        if (index !== -1) {
            records.value.splice(index, 1);
        }
    });
}

function handleUpdate(event: Record<string, any>) {
    const index = findRecordIndex(records, event.data.id);
    if (index !== -1) {
        records.value[index] = event.data;
        markHighlight(event.data.id, 'updated');
    }
}

function handleStore(event: Record<string, any>) {
    const exists = records.value.some((r) => r.id === event.data.id);
    if (!exists) {
        records.value.unshift(event.data);
        markHighlight(event.data.id, 'new');
    }
}

// ── CRUD Actions ──────────────────────────────────────────
function addRecord() {
    authStore.errors = {};
    record.value = {
        account_id: null,
        plan_id: null,
        billing_period: 'month',
        quantity: 1,
        starts_at: new Date().toISOString().split('T')[0],
        active: true,
        notes: null
    };
    openDialog();
}

function toggleActive(subscriptionId: number) {
    loadingActiveId.value = subscriptionId;
    loadingStore.startPageLoading();
    useSubscriptionService
        .toggleActiveSubscription(subscriptionId)
        .then(() => {
            const index = findRecordIndex(records, subscriptionId);
            records.value[index].active = !records.value[index].active;
            markHighlight(subscriptionId, 'updated');
            showToast('success', ACTIONS.EDIT, 'subscription', 'tc');
        })
        .catch((error) => {
            if (error?.response?.status === 419 || error?.response?.status === 401) {
                console.error('Session expired, redirecting to login');
            }
            console.error('Error toggling subscription');
        })
        .finally(() => {
            loadingActiveId.value = null;
            loadingStore.stopPageLoading();
        });
}

function editRecord(row: Record<string, any>) {
    authStore.errors = {};
    record.value = { ...row };
    openDialog();
}

const openDialog = () => {
    if (!record.value) return;
    const currentRecord = record.value;
    dialog.open(formComponent, {
        props: {
            style: { width: '30vw' },
            breakpoints: { '960px': '75vw', '640px': '90vw' },
            modal: true,
            maximizable: true
        },
        templates: {
            header: markRaw(FormHeader)
        },
        data: {
            record: currentRecord,
            action: currentRecord.id ? ACTIONS.EDIT : ACTIONS.CREATE,
            accounts: accounts.value,
            plans: plans.value,
            headerProps: computed(() => ({
                title: currentRecord.id ? t('common.titles.edit', { entity: t('entity.subscription') }) : t('common.titles.add', { entity: t('entity.subscription') }),
                description: t('subscription.form.subtitle'),
                icon: currentRecord.id ? 'pi pi-book' : 'pi pi-plus-circle',
                iconColor: '#8B5CF6'
            }))
        },
        onClose: (result) => {
            if (result && result.data?.record?.id) {
                switch (result.data?.action) {
                    case ACTIONS.CREATE:
                        records.value.unshift(result.data.record);
                        markHighlight(result.data.record.id, 'new');
                        showToast('success', ACTIONS.CREATE, 'subscription', 'tc');
                        break;
                    case ACTIONS.EDIT: {
                        const index = findRecordIndex(records, result.data.record.id);
                        records.value[index] = result.data.record;
                        markHighlight(result.data.record.id, 'updated');
                        showToast('success', ACTIONS.EDIT, 'subscription', 'tc');
                        break;
                    }
                    default:
                        console.error(`Unhandled action: ${result.data?.action}`);
                }
            }
        }
    });
};

function confirmDeleteRecord(event: Event | null, subscriptionIds: number[]) {
    confirm.require({
        modal: true,
        target: (event?.currentTarget as HTMLElement) ?? undefined,
        message: subscriptionIds.length > 1 ? t('common.confirmations.delete_selected.message', { entity: t('entity.subscriptions') }) : t('common.confirmations.delete.message', { entity: t('entity.subscription') }),
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
            useSubscriptionService
                .deleteSubscriptions(subscriptionIds)
                .then(() => {
                    subscriptionIds.forEach((id) => {
                        const index = findRecordIndex(records, id);
                        if (index !== -1) {
                            records.value.splice(index, 1);
                        }
                    });
                    showToast('success', ACTIONS.DELETE, 'subscription', 'tc');
                })
                .catch((error) => {
                    if (error?.response?.status === 419 || error?.response?.status === 401) {
                        console.error('Session expired, redirecting to login');
                    }
                    console.error('Error deleting subscriptions');
                });
        }
    });
}

// ── Helpers ───────────────────────────────────────────────

function getPlanBadgeClass(planName: string | null | undefined) {
    if (!planName) return 'bg-gray-500/10 text-gray-500';
    const name = planName.toLowerCase();
    if (name.includes('enterprise') || name.includes('cargo')) return 'bg-violet-500/20 text-violet-700 dark:text-violet-400';
    if (name.includes('pro') || name.includes('parcel')) return 'bg-blue-500/20 text-blue-700 dark:text-blue-400';
    if (name.includes('express')) return 'bg-orange-500/20 text-orange-700 dark:text-orange-400';
    return 'bg-gray-500/20 text-gray-700 dark:text-gray-400';
}

function getPlanIcon(planName: string | null | undefined) {
    if (!planName) return 'pi pi-question-circle';
    const name = planName.toLowerCase();
    if (name.includes('enterprise') || name.includes('cargo')) return 'pi pi-briefcase';
    if (name.includes('pro') || name.includes('parcel')) return 'pi pi-box';
    if (name.includes('express')) return 'pi pi-bolt';
    return 'pi pi-tag';
}

function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatQuotaNumber(value: number | null | undefined) {
    if (value == null) return '0';
    if (value >= 10000) return `${(value / 1000).toFixed(1)}k`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toString();
}

function getQuotaPercent(used: number, limit: number) {
    if (!limit || limit <= 0) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
}

function getQuotaBarColor(percent: number) {
    if (percent >= 100) return 'bg-red-500';
    if (percent >= 80) return 'bg-orange-500';
    if (percent >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
}

function getQuotaPercentColor(percent: number) {
    if (percent >= 100) return 'text-red-500';
    if (percent >= 80) return 'text-orange-500';
    return 'text-surface-500';
}

function getQuotaItems(data: Record<string, any>) {
    if (!data.plan_limits) return [];
    const items = [];
    const limits = data.plan_limits;
    const usage = data.quota_usage || {};

    if (limits.orders && limits.orders > 0) {
        items.push({ label: t('entity.orders', 2), used: usage.orders || 0, limit: limits.orders, icon: 'pi pi-shopping-cart', colorClass: 'text-cyan-500' });
    }
    if (limits.products && limits.products > 0) {
        items.push({ label: t('entity.products', 2), used: usage.products || 0, limit: limits.products, icon: 'pi pi-box', colorClass: 'text-blue-500' });
    }
    if (limits.users && limits.users > 0) {
        items.push({ label: t('entity.users', 2), used: usage.users || 0, limit: limits.users, icon: 'pi pi-user', colorClass: 'text-indigo-500' });
    }
    if (limits.shops && limits.shops > 0) {
        items.push({ label: t('entity.shops', 2), used: usage.shops || 0, limit: limits.shops, icon: 'pi pi-shop', colorClass: 'text-purple-500' });
    }
    return items;
}

onUnmounted(() => {
    if (echoSubscription.value) {
        echoSubscription.value.stopListening('DataStream');
    }
});
</script>

<template>
    <div class="flex flex-col gap-5">
        <!-- ═══ Header ═══ -->
        <div class="flex justify-between items-center flex-wrap gap-4">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-400 to-indigo-500 shadow-lg shadow-indigo-500/30">
                    <i class="pi pi-credit-card text-xl text-white"></i>
                </div>
                <div>
                    <h1 class="text-2xl font-bold text-surface-800 dark:text-surface-100 m-0 leading-tight">{{ t('common.titles.manage', { entity: t('entity.subscriptions') }) }}</h1>
                    <p class="text-sm text-surface-400 dark:text-surface-500 m-0">{{ t('subscription.page.subtitle') }}</p>
                </div>
            </div>
            <div class="flex gap-2 items-center">
                <Button v-tooltip.top="t('common.tooltips.export_selection', { entity: t('entity.subscriptions') })" :label="t('common.labels.export')" icon="pi pi-upload" outlined severity="info" @click="exportCSV()" />
                <Button v-tooltip.top="t('common.tooltips.add', { entity: t('entity.subscription') })" :label="`+ ${t('common.labels.new')} ${t('entity.subscription')}`" severity="primary" :disabled="!dataLoaded" @click="addRecord" />
            </div>
        </div>

        <!-- ═══ DataTable ═══ -->
        <DataTableSkeleton v-if="!dataLoaded" :columns="8" />
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
                :currentPageReportTemplate="t('common.paggination.showing_to_of_entity', { first: '{first}', last: '{last}', totalRecords: '{totalRecords}', entity: t('entity.subscription') })"
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
                                <Button
                                    v-tooltip.top="t('common.tooltips.delete_selected', { entity: t('entity.subscription') })"
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

                <!-- ═══ Account (Rich) ═══ -->
                <Column
                    :showClearButton="false"
                    :showApplyButton="false"
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    columnKey="account_name"
                    field="account_name"
                    :frozen="frozenColumns.account_name"
                    v-if="selectedColumns.some((column) => column.field === 'account_name')"
                    sortable
                    class="min-w-56"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('subscription.columns.account_name')"
                            :frozen="frozenColumns.account_name"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('account_name')"
                        />
                    </template>
                    <template #body="{ data }">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-9 h-9 rounded-lg flex items-center justify-center text-[0.7rem] font-bold tracking-tight shrink-0"
                                :style="{ backgroundColor: `hsl(${(data.account_id * 47) % 360}, 65%, 88%)`, color: `hsl(${(data.account_id * 47) % 360}, 70%, 35%)` }"
                            >
                                {{ data.account_initials || '??' }}
                            </div>
                            <div class="flex flex-col min-w-0">
                                <span class="text-sm font-semibold text-surface-800 dark:text-surface-100 whitespace-nowrap overflow-hidden text-ellipsis" :class="{ 'font-bold': frozenColumns.account_name || highlights[data.id] }">
                                    {{ data.account_name }}
                                    <DataTableHighlightTag v-if="highlights[data.id]" :state="highlights[data.id]" class="ml-1" />
                                </span>
                                <span v-if="data.account_secondary_name" class="text-[0.7rem] text-surface-400 dark:text-surface-500">{{ data.account_secondary_name }}</span>
                            </div>
                        </div>
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

                <!-- ═══ Plan (Badge) ═══ -->
                <Column
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    :showClearButton="false"
                    :showApplyButton="false"
                    columnKey="plan_name"
                    field="plan_name"
                    :frozen="frozenColumns.plan_name"
                    v-if="selectedColumns.some((column) => column.field === 'plan_name')"
                    sortable
                    class="min-w-32"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('subscription.columns.plan_name')"
                            :frozen="frozenColumns.plan_name"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('plan_name')"
                        />
                    </template>
                    <template #body="{ data }">
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold tracking-wide" :class="getPlanBadgeClass(data.plan_name)">
                            <i :class="getPlanIcon(data.plan_name)" style="font-size: 0.75rem"></i>
                            {{ data.plan_name?.toUpperCase() }}
                        </span>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <InputGroup>
                            <MultiSelect size="small" v-model="filterModel.value" :options="plans" optionLabel="name" optionValue="name">
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

                <!-- ═══ Billing Period ═══ -->
                <Column
                    :showClearButton="false"
                    :showApplyButton="false"
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    columnKey="billing_period"
                    field="billing_period"
                    :frozen="frozenColumns.billing_period"
                    v-if="selectedColumns.some((column) => column.field === 'billing_period')"
                    sortable
                    class="min-w-32"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('subscription.columns.billing_period')"
                            :frozen="frozenColumns.billing_period"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('billing_period')"
                        />
                    </template>
                    <template #body="{ data }">
                        <span class="text-sm text-surface-800 dark:text-surface-100 capitalize">{{ data.billing_period }}</span>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <InputGroup>
                            <Select v-model="filterModel.value" :options="billingPeriodOptions" optionLabel="label" optionValue="value" size="small" class="w-full" />
                            <InputGroupAddon>
                                <Button size="small" v-tooltip.top="t('common.labels.apply')" icon="pi pi-check" severity="primary" @click="applyFilter()" />
                                <Button :disabled="!filterModel.value" size="small" v-tooltip.top="t('common.labels.clear', 'filter')" outlined icon="pi pi-times" severity="danger" @click="((filterModel.value = null), applyFilter())" />
                            </InputGroupAddon>
                        </InputGroup>
                    </template>
                </Column>

                <!-- ═══ Starts At (Formatted) ═══ -->
                <Column columnKey="starts_at" field="starts_at" :frozen="frozenColumns.starts_at" v-if="selectedColumns.some((column) => column.field === 'starts_at')" sortable class="min-w-36">
                    <template #header>
                        <HeaderCell
                            :text="t('subscription.columns.starts_at')"
                            :frozen="frozenColumns.starts_at"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('starts_at')"
                        />
                    </template>
                    <template #body="{ data }">
                        <span class="text-[0.82rem] text-surface-800 dark:text-surface-100 whitespace-nowrap">{{ formatDate(data.starts_at) }}</span>
                    </template>
                </Column>

                <!-- ═══ Ends At (Formatted) ═══ -->
                <Column columnKey="ends_at" field="ends_at" :frozen="frozenColumns.ends_at" v-if="selectedColumns.some((column) => column.field === 'ends_at')" sortable class="min-w-36">
                    <template #header>
                        <HeaderCell
                            :text="t('subscription.columns.ends_at')"
                            :frozen="frozenColumns.ends_at"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('ends_at')"
                        />
                    </template>
                    <template #body="{ data }">
                        <span class="text-[0.82rem] text-surface-800 dark:text-surface-100 whitespace-nowrap">{{ formatDate(data.ends_at) }}</span>
                    </template>
                </Column>

                <!-- ═══ Notes ═══ -->
                <Column columnKey="notes" field="notes" :frozen="frozenColumns.notes" v-if="selectedColumns.some((column) => column.field === 'notes')" class="min-w-40">
                    <template #header>
                        <HeaderCell
                            :text="t('subscription.columns.notes')"
                            :frozen="frozenColumns.notes"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('notes')"
                        />
                    </template>
                    <template #body="{ data }">
                        <span class="text-[0.82rem] text-surface-400 dark:text-surface-500 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap block">{{ data.notes || '—' }}</span>
                    </template>
                </Column>

                <!-- ═══ Quotas (Progress Bars) ═══ -->
                <Column columnKey="quotas" field="quotas" :frozen="frozenColumns.quotas" v-if="selectedColumns.some((column) => column.field === 'quotas')" class="min-w-64">
                    <template #header>
                        <HeaderCell
                            :text="t('subscription.columns.quotas')"
                            :frozen="frozenColumns.quotas"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('quotas')"
                        />
                    </template>
                    <template #body="{ data }">
                        <div v-if="getQuotaItems(data).length" class="flex items-center gap-3 flex-wrap">
                            <div
                                v-for="item in getQuotaItems(data)"
                                :key="item.label"
                                class="relative w-[38px] h-[38px] cursor-help"
                                :class="item.colorClass"
                                v-tooltip.top="`${formatQuotaNumber(item.used)} / ${formatQuotaNumber(item.limit)} ${item.label} (${getQuotaPercent(item.used, item.limit)}%)`"
                            >
                                <svg class="w-full h-full transform -rotate-90 pointer-events-none drop-shadow-sm" viewBox="0 0 36 36">
                                    <path class="opacity-20" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path
                                        :stroke-dasharray="`${getQuotaPercent(item.used, item.limit)}, 100`"
                                        stroke-width="3.5"
                                        stroke-linecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <i :class="item.icon" class="text-surface-400 dark:text-surface-500" style="font-size: 0.75rem"></i>
                                </div>
                            </div>
                        </div>
                        <span v-else class="text-[0.82rem] text-surface-400 dark:text-surface-500">—</span>
                    </template>
                </Column>

                <!-- ═══ Active (Toggle) ═══ -->
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
                            :text="t('subscription.columns.active')"
                            :frozen="frozenColumns.active"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('active')"
                        />
                    </template>
                    <template #body="{ data }">
                        <ActiveToggleButton :active="data.active" entity="subscription" variant="button" :loading="loadingActiveId === data.id" @toggle="toggleActive(data.id)" />
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <InputGroup>
                            <Select v-model="filterModel.value" :options="activeOptions" optionLabel="label" optionValue="value" size="small" class="w-full" />
                            <InputGroupAddon>
                                <Button size="small" v-tooltip.top="t('common.labels.apply')" icon="pi pi-check" severity="primary" @click="applyFilter()" />
                                <Button :disabled="filterModel.value == null" size="small" v-tooltip.top="t('common.labels.clear', 'filter')" outlined icon="pi pi-times" severity="danger" @click="((filterModel.value = null), applyFilter())" />
                            </InputGroupAddon>
                        </InputGroup>
                    </template>
                </Column>

                <!-- ═══ Actions ═══ -->
                <Column :exportable="false" style="min-width: 4rem" frozen alignFrozen="right">
                    <template #body="{ data, frozenRow, index }">
                        <div class="flex items-center justify-center gap-1">
                            <RowActionMenu
                                :actions="[
                                    { label: t('common.labels.edit'), icon: 'pi pi-pencil', command: () => editRecord(data), visible: authStore.hasPermission('update_subscriptions') },
                                    { label: t('common.labels.delete'), icon: 'pi pi-trash', severity: 'danger', command: () => confirmDeleteRecord(null, [data.id]), visible: authStore.hasPermission('delete_subscriptions') }
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
            </DataTable>
        </template>
        <ConfirmPopup />
    </div>
</template>
