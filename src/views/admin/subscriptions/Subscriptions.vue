<script setup>
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
    loadStats();
    subscribeToEcho();
});

const { t } = useI18n();
const loadingStore = useLoading();

// ── Stats ─────────────────────────────────────────────────
const stats = ref({ total_active: 0, total: 0, mrr: 0, expiring_soon: 0 });
const statsLoading = ref(true);

async function loadStats() {
    try {
        stats.value = await useSubscriptionService.getStats();
    } catch (e) {
        console.error('Failed to load stats', e);
    } finally {
        statsLoading.value = false;
    }
}

// Compute average resource usage from loaded records
const avgUsage = computed(() => {
    const activeRecords = records.value.filter((r) => r.active && r.plan_limits && r.quota_usage);
    if (!activeRecords.length) return 0;
    let totalPercent = 0;
    let count = 0;
    activeRecords.forEach((r) => {
        if (r.plan_limits.products && r.plan_limits.products > 0) {
            totalPercent += (r.quota_usage.products / r.plan_limits.products) * 100;
            count++;
        }
    });
    return count ? Math.round(totalPercent / count) : 0;
});

// ── Filters ───────────────────────────────────────────────
const defaultFiltersConfig = {
    id: FilterMatchMode.CONTAINS,
    account_name: FilterMatchMode.CONTAINS,
    plan_name: FilterMatchMode.CONTAINS,
    active: FilterMatchMode.EQUALS,
    starts_at: FilterMatchMode.CONTAINS,
    ends_at: FilterMatchMode.CONTAINS
};

// Auxiliary data from the API
const accounts = ref([]);
const plans = ref([]);
const loadingActiveId = ref(null);

// ── DataTable ─────────────────────────────────────────────
const { total, rows, records, selectedRecords, recordDataTable, filters, onPage, onSort, onFilter, clearFilter, searchDone, exportCSV, initialize } = useDataTable(
    (params) =>
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
const defaultFields = ['account_name', 'plan_name', 'active', 'starts_at', 'ends_at', 'notes'];
const { lockedRow, toggleLock, frozenColumns, toggleColumnFrozen } = useLock(defaultFields, records);

const record = ref(null);
const dataLoaded = ref(false);
const defaultColumns = computed(() =>
    defaultFields.map((field) => ({
        field,
        header: t(`subscription.columns.${field}`)
    }))
);

const { selectedColumns, columnChanged } = useDynamicColumns('subscriptionsColumns', defaultFields, 'subscription.columns');
const echoSubscription = ref(null);

// ── Echo ──────────────────────────────────────────────────
function subscribeToEcho() {
    echoSubscription.value = Echo.private('data-stream.subscriptions').listen('DataStream', (event) => {
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
    loadStats(); // refresh stats after delete
}

function handleUpdate(event) {
    const index = findRecordIndex(records, event.data.id);
    if (index !== -1) {
        records.value[index] = event.data;
        markHighlight(event.data.id, 'updated');
    }
}

function handleStore(event) {
    const exists = records.value.some((r) => r.id === event.data.id);
    if (!exists) {
        records.value.unshift(event.data);
        markHighlight(event.data.id, 'new');
    }
    loadStats(); // refresh stats after new record
}

// ── CRUD Actions ──────────────────────────────────────────
function addRecord() {
    authStore.errors = {};
    record.value = {
        account_id: null,
        plan_id: null,
        starts_at: new Date().toISOString().split('T')[0],
        ends_at: null,
        notes: null
    };
    openDialog();
}

function toggleActive(subscriptionId) {
    loadingActiveId.value = subscriptionId;
    loadingStore.startPageLoading();
    useSubscriptionService
        .toggleActiveSubscription(subscriptionId)
        .then(() => {
            const index = findRecordIndex(records, subscriptionId);
            records.value[index].active = !records.value[index].active;
            markHighlight(subscriptionId, 'updated');
            showToast('success', ACTIONS.EDIT, 'subscription', 'tc');
            loadStats();
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

function editRecord(row) {
    authStore.errors = {};
    record.value = { ...row };
    openDialog();
}

const openDialog = () => {
    dialog.open(formComponent, {
        props: {
            style: { width: '40vw' },
            breakpoints: { '960px': '75vw', '640px': '90vw' },
            modal: true,
            maximizable: true
        },
        templates: {
            header: markRaw(FormHeader)
        },
        data: {
            record: record.value,
            action: record.value.id ? ACTIONS.EDIT : ACTIONS.CREATE,
            accounts: accounts.value,
            plans: plans.value,
            headerProps: computed(() => ({
                title: record.value.id ? t('common.titles.edit', { entity: t('entity.subscription') }) : t('common.titles.add', { entity: t('entity.subscription') }),
                description: t('subscription.form.subtitle'),
                icon: record.value.id ? 'pi pi-book' : 'pi pi-plus-circle',
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
                        loadStats();
                        break;
                    case ACTIONS.EDIT: {
                        const index = findRecordIndex(records, result.data.record.id);
                        records.value[index] = result.data.record;
                        markHighlight(result.data.record.id, 'updated');
                        showToast('success', ACTIONS.EDIT, 'subscription', 'tc');
                        break;
                    }
                    default:
                        console.error(`Unhandled action: ${result.action}`);
                }
            }
        }
    });
};

function confirmDeleteRecord(event, subscriptionIds) {
    confirm.require({
        modal: true,
        target: event?.currentTarget,
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
                    loadStats();
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

function getPlanBadgeClass(planName) {
    if (!planName) return 'plan-badge-default';
    const name = planName.toLowerCase();
    if (name.includes('enterprise') || name.includes('cargo')) return 'plan-badge-enterprise';
    if (name.includes('pro') || name.includes('parcel')) return 'plan-badge-pro';
    if (name.includes('express')) return 'plan-badge-express';
    return 'plan-badge-basic';
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getQuotaPercent(data) {
    if (!data.plan_limits || !data.quota_usage) return 0;
    const limit = data.plan_limits.products;
    const used = data.quota_usage.products;
    if (!limit || limit <= 0) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
}

function getQuotaBarClass(percent) {
    if (percent >= 90) return 'quota-bar-danger';
    if (percent >= 70) return 'quota-bar-warning';
    return 'quota-bar-normal';
}

function formatQuotaLabel(data) {
    if (!data.plan_limits || !data.quota_usage) return '—';
    const limit = data.plan_limits.products;
    const used = data.quota_usage.products;
    if (!limit) return `${used} / ∞`;
    return `${used} / ${limit}`;
}

function formatMRR(value) {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value?.toString() || '0';
}

onUnmounted(() => {
    if (echoSubscription.value) {
        echoSubscription.value.stopListening('DataStream');
    }
});
</script>

<template>
    <div class="subscription-page">
        <!-- ═══ Header ═══ -->
        <div class="page-header-row">
            <div class="header-left">
                <div class="header-icon-wrap">
                    <i class="pi pi-credit-card"></i>
                </div>
                <div>
                    <h1 class="page-title">{{ t('common.titles.manage', { entity: t('entity.subscriptions') }) }}</h1>
                    <p class="page-subtitle">{{ t('subscription.page.subtitle') }}</p>
                </div>
            </div>
            <div class="header-actions">
                <Button v-tooltip.top="t('common.tooltips.export_selection', { entity: t('entity.subscriptions') })" :label="t('common.labels.export')" icon="pi pi-upload" outlined severity="info" @click="exportCSV($event)" />
                <Button v-tooltip.top="t('common.tooltips.add', { entity: t('entity.subscription') })" :label="'+ ' + t('common.labels.new') + ' ' + t('entity.subscription')" severity="primary" :disabled="!dataLoaded" @click="addRecord" />
            </div>
        </div>

        <!-- ═══ KPI Stats Cards ═══ -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-card-top">
                    <div class="stat-icon stat-icon-blue">
                        <i class="pi pi-users"></i>
                    </div>
                    <span class="stat-trend trend-up" v-if="stats.total_active > 0"> <i class="pi pi-arrow-up"></i> {{ stats.total_active }} </span>
                </div>
                <p class="stat-label">{{ t('subscription.stats.total_active') }}</p>
                <p class="stat-value" :class="{ 'stat-loading': statsLoading }">{{ statsLoading ? '—' : stats.total_active }}</p>
            </div>

            <div class="stat-card">
                <div class="stat-card-top">
                    <div class="stat-icon stat-icon-purple">
                        <i class="pi pi-chart-bar"></i>
                    </div>
                    <span class="stat-trend trend-up" v-if="stats.mrr > 0"> <i class="pi pi-arrow-up"></i> {{ t('subscription.stats.mrr_label') }} </span>
                </div>
                <p class="stat-label">{{ t('subscription.stats.mrr') }}</p>
                <p class="stat-value" :class="{ 'stat-loading': statsLoading }">{{ statsLoading ? '—' : formatMRR(stats.mrr) + ' DA' }}</p>
            </div>

            <div class="stat-card">
                <div class="stat-card-top">
                    <div class="stat-icon stat-icon-cyan">
                        <i class="pi pi-sync"></i>
                    </div>
                    <span class="stat-trend-neutral">{{ avgUsage }}%</span>
                </div>
                <p class="stat-label">{{ t('subscription.stats.avg_usage') }}</p>
                <p class="stat-value" :class="{ 'stat-loading': statsLoading }">{{ avgUsage }}%</p>
            </div>

            <div class="stat-card">
                <div class="stat-card-top">
                    <div class="stat-icon stat-icon-orange">
                        <i class="pi pi-calendar-clock"></i>
                    </div>
                    <Badge v-if="stats.expiring_soon > 0" :value="stats.expiring_soon" severity="danger" />
                </div>
                <p class="stat-label">{{ t('subscription.stats.expiring_soon') }}</p>
                <p class="stat-value" :class="{ 'stat-loading': statsLoading }">{{ statsLoading ? '—' : stats.expiring_soon }}</p>
            </div>
        </div>

        <!-- ═══ DataTable ═══ -->
        <DataTableSkeleton v-if="!dataLoaded" :columns="6" />
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
                :globalFilterFields="('id', defaultColumns.map((column) => column.field))"
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
                    bodyrow: ({ props }) => ({
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

                <!-- ═══ ID ═══ -->
                <Column columnKey="id" field="id" header="ID" sortable class="min-w-24">
                    <template #body="{ data }">
                        <span class="id-cell">{{ data.id }}</span>
                    </template>
                </Column>

                <!-- ═══ Account (Rich) ═══ -->
                <Column columnKey="account_name" field="account_name" :frozen="frozenColumns.account_name" v-if="selectedColumns.some((column) => column.field === 'account_name')" sortable class="min-w-56">
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
                        <div class="account-cell">
                            <div class="account-avatar" :style="{ backgroundColor: `hsl(${(data.account_id * 47) % 360}, 65%, 88%)`, color: `hsl(${(data.account_id * 47) % 360}, 70%, 35%)` }">
                                {{ data.account_initials || '??' }}
                            </div>
                            <div class="account-info">
                                <div class="account-name" :class="{ 'font-bold': frozenColumns.account_name || highlights[data.id] }">
                                    {{ data.account_name }}
                                    <Tag v-if="highlights[data.id] === 'new'" value="NEW" severity="success" rounded size="small" class="ml-1" />
                                    <Tag v-else-if="highlights[data.id] === 'updated'" value="UPDATED" severity="info" rounded size="small" class="ml-1" />
                                </div>
                                <span class="account-id-display">{{ data.account_id_display }}</span>
                            </div>
                        </div>
                    </template>
                </Column>

                <!-- ═══ Plan (Badge) ═══ -->
                <Column columnKey="plan_name" field="plan_name" :frozen="frozenColumns.plan_name" v-if="selectedColumns.some((column) => column.field === 'plan_name')" sortable class="min-w-32">
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
                        <span class="plan-badge" :class="getPlanBadgeClass(data.plan_name)">
                            {{ data.plan_name?.toUpperCase() }}
                        </span>
                    </template>
                </Column>

                <!-- ═══ Active (Toggle) ═══ -->
                <Column columnKey="active" field="active" :frozen="frozenColumns.active" v-if="selectedColumns.some((column) => column.field === 'active')" sortable class="min-w-32">
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
                        <span class="date-cell">{{ formatDate(data.starts_at) }}</span>
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
                        <span class="date-cell">{{ formatDate(data.ends_at) }}</span>
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
                        <span class="notes-cell">{{ data.notes || '—' }}</span>
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

<style scoped>
/* ═══ Page Header ═══ */
.subscription-page {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.page-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.header-icon-wrap {
    width: 3rem;
    height: 3rem;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.header-icon-wrap i {
    font-size: 1.25rem;
    color: #fff;
}

.page-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--p-text-color);
    margin: 0;
    line-height: 1.3;
}

.page-subtitle {
    font-size: 0.85rem;
    color: var(--p-text-muted-color);
    margin: 0;
}

.header-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

/* ═══ KPI Stats Grid ═══ */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
}

@media (max-width: 1024px) {
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 640px) {
    .stats-grid {
        grid-template-columns: 1fr;
    }
}

.stat-card {
    background: var(--p-content-background);
    border: 1px solid var(--p-content-border-color);
    border-radius: 1rem;
    padding: 1.25rem 1.5rem;
    transition: all 0.2s ease;
}

.stat-card:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    transform: translateY(-1px);
}

.stat-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
}

.stat-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
}

.stat-icon-blue {
    background: rgba(59, 130, 246, 0.12);
    color: #3b82f6;
}

.stat-icon-purple {
    background: rgba(139, 92, 246, 0.12);
    color: #8b5cf6;
}

.stat-icon-cyan {
    background: rgba(6, 182, 212, 0.12);
    color: #06b6d4;
}

.stat-icon-orange {
    background: rgba(249, 115, 22, 0.12);
    color: #f97316;
}

.stat-trend {
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.2rem;
}

.trend-up {
    color: #22c55e;
    background: rgba(34, 197, 94, 0.1);
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
}

.stat-trend-neutral {
    font-size: 0.75rem;
    font-weight: 600;
    color: #06b6d4;
    background: rgba(6, 182, 212, 0.1);
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
}

.stat-label {
    font-size: 0.8rem;
    color: var(--p-text-muted-color);
    margin: 0 0 0.25rem 0;
    font-weight: 500;
}

.stat-value {
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--p-text-color);
    margin: 0;
    line-height: 1;
}

.stat-loading {
    opacity: 0.3;
}

/* ═══ Account Cell ═══ */
.account-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.account-avatar {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    flex-shrink: 0;
}

.account-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.account-name {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--p-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.account-id-display {
    font-size: 0.7rem;
    color: var(--p-text-muted-color);
    font-family: 'SF Mono', 'Cascadia Code', monospace;
}

/* ═══ Plan Badge ═══ */
.plan-badge {
    display: inline-block;
    padding: 0.2rem 0.65rem;
    border-radius: 0.35rem;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.06em;
}

.plan-badge-enterprise {
    background: rgba(139, 92, 246, 0.12);
    color: #7c3aed;
}

.plan-badge-pro {
    background: rgba(59, 130, 246, 0.12);
    color: #2563eb;
}

.plan-badge-express {
    background: rgba(249, 115, 22, 0.12);
    color: #ea580c;
}

.plan-badge-basic {
    background: rgba(107, 114, 128, 0.12);
    color: #4b5563;
}

.plan-badge-default {
    background: rgba(107, 114, 128, 0.08);
    color: #6b7280;
}

/* ═══ Date Cell ═══ */
.date-cell {
    font-size: 0.82rem;
    color: var(--p-text-color);
    white-space: nowrap;
}

/* ═══ Notes Cell ═══ */
.notes-cell {
    font-size: 0.82rem;
    color: var(--p-text-muted-color);
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
}

/* ═══ ID Cell ═══ */
.id-cell {
    font-weight: 700;
    font-size: 0.82rem;
    color: var(--p-text-color);
}
</style>
