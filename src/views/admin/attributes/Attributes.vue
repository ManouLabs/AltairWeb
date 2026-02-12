<script setup lang="ts">
import ActiveToggleButton from '@/components/ActiveToggleButton.vue';
import DataTableHighlightTag from '@/components/DataTableHighlightTag.vue';
import RowActionMenu from '@/components/common/RowActionMenu.vue';
import { useDataTable } from '@/composables/useDataTable';
import { useDynamicColumns } from '@/composables/useDynamicColumns';
import { useLock } from '@/composables/useLock';
import { useRowEffects } from '@/composables/useRowEffects';
import dayjs from '@/plugins/dayjs';
import { useAttributeService } from '@/services/useAttributeService';
import { useAuthStore } from '@/stores/useAuthStore';
import { findRecordIndex } from '@/utilities/helper';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import type { AttributeData } from '@/types/attribute';
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
    type: FilterMatchMode.EQUALS,
    created_at: FilterMatchMode.DATE_IS
};

const { total, rows, records, selectedRecords, recordDataTable, filters, onPage, onSort, onFilter, clearFilter, searchDone, exportCSV, initialize } = useDataTable<AttributeData>(
    (params: Record<string, unknown>) =>
        useAttributeService.getAttributes(params).then((data) => {
            dataLoaded.value = true;
            return {
                data: data.attributes,
                meta: data.meta
            };
        }),
    defaultFiltersConfig
);

const authStore = useAuthStore();
const confirm = useConfirm();
const router = useRouter();
const { showToast } = useShowToast();
const { t } = useI18n();

const { highlights, markHighlight, getRowClass } = useRowEffects();

const defaultFields = ['name', 'type', 'categories', 'values', 'active', 'created_at'];
const { lockedRow, toggleLock, frozenColumns, toggleColumnFrozen } = useLock(defaultFields, records);

const dataLoaded = ref(false);
const loadingActiveId = ref<number | null>(null);

interface Column {
    field: string;
    header: string;
}

const defaultColumns = computed<Column[]>(() =>
    defaultFields.map((field) => ({
        field,
        header: t(`attribute.columns.${field}`)
    }))
);

const { selectedColumns, columnChanged } = useDynamicColumns('attributesColumns', defaultFields, 'attribute.columns');

const subscription = ref<any>(null);

interface EchoEvent {
    action: string;
    data: AttributeData | number[];
}

function subscribeToEcho(): void {
    const channel = Echo.private(`data-stream.attribute${authStore.user.account_id}`);
    subscription.value = channel.listen('DataStream', (event: EchoEvent) => {
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
    const data = event.data as AttributeData;
    const index = findRecordIndex(records, data.id);
    if (index !== -1) {
        records.value[index] = data;
        markHighlight(data.id, 'updated');
    }
}

function handleStore(event: EchoEvent): void {
    const data = event.data as AttributeData;
    const exists = records.value.some((record: AttributeData) => record.id === data.id);
    if (!exists) {
        records.value.unshift(data);
        markHighlight(data.id, 'new');
    }
}

function addRecord(): void {
    router.push({ name: 'attribute-create' });
}

function editRecord(row: AttributeData): void {
    router.push({ name: 'attribute-edit', params: { id: row.id } });
}

function confirmDeleteRecord(event: MouseEvent | null, attributeIds: number[]): void {
    confirm.require({
        modal: true,
        target: event?.currentTarget as HTMLElement,
        message: attributeIds.length > 1 ? t('common.confirmations.delete_selected.message', { entity: t('entity.attributes') }) : t('common.confirmations.delete.message', { entity: t('entity.attribute') }),
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
            useAttributeService
                .deleteAttributes(attributeIds)
                .then(() => {
                    for (const id of attributeIds) {
                        const index = findRecordIndex(records, id);
                        if (index !== -1) {
                            records.value.splice(index, 1);
                        }
                    }
                    showToast('success', ACTIONS.DELETE, 'attribute', 'tc');
                })
                .catch((error: any) => {
                    if (error?.response?.status === 419 || error?.response?.status === 401) {
                        console.error('Session expired, redirecting to login');
                    }
                    console.error('Error deleting attributes');
                });
        }
    });
}

function toggleActive(attributeId: number): void {
    loadingActiveId.value = attributeId;
    useAttributeService
        .toggleActiveAttribute(attributeId)
        .then((response) => {
            const index = findRecordIndex(records, attributeId);
            if (index !== -1) {
                records.value[index] = response.data;
                markHighlight(attributeId, 'updated');
            }
            showToast('success', ACTIONS.EDIT, 'attribute', 'tc');
        })
        .catch(() => {
            console.error('Error toggling attribute');
        })
        .finally(() => {
            loadingActiveId.value = null;
        });
}

// Type icon mapping
const typeIcons: Record<string, string> = {
    dropdown: 'pi pi-chevron-down',
    text: 'pi pi-align-left',
    switches: 'pi pi-toggle-on',
    multiselect: 'pi pi-list-check',
    date: 'pi pi-calendar',
    numeric: 'pi pi-hashtag',
    boolean: 'pi pi-check-square',
    file: 'pi pi-file'
};

const typeSeverities: Record<string, string> = {
    dropdown: 'info',
    text: 'secondary',
    switches: 'success',
    multiselect: 'warn',
    date: 'contrast',
    numeric: 'info',
    boolean: 'success',
    file: 'secondary'
};

onUnmounted(() => {
    if (subscription.value) {
        subscription.value.stopListening('DataStream');
    }
});
</script>

<template>
    <div>
        <!-- Page Header (always visible) -->
        <PageHeader icon="pi pi-sliders-h" icon-color="#F59E0B" :title="t('common.titles.manage', { entity: t('entity.attributes') })" :description="t('attribute.labels.manage_subtitle')">
            <template #actions>
                <Button
                    v-if="authStore.hasPermission('export_attributes')"
                    v-tooltip.top="t('common.tooltips.export_selection', { entity: t('entity.attributes') })"
                    :label="t('common.labels.export')"
                    icon="pi pi-upload"
                    outlined
                    severity="info"
                    :disabled="!dataLoaded"
                    @click="exportCSV($event)"
                />
                <Button
                    v-if="authStore.hasPermission('create_attributes')"
                    v-tooltip.top="t('common.tooltips.add', { entity: t('entity.attribute') })"
                    :label="'+ ' + t('common.labels.new') + ' ' + t('entity.attribute')"
                    severity="primary"
                    :disabled="!dataLoaded"
                    @click="addRecord"
                />
            </template>
        </PageHeader>

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
                :currentPageReportTemplate="t('common.paggination.showing_to_of_entity', { first: '{first}', last: '{last}', totalRecords: '{totalRecords}', entity: t('entity.attributes') })"
                resizableColumns
                columnResizeMode="fit"
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
                                    v-if="authStore.hasPermission('delete_attributes')"
                                    v-tooltip.top="t('common.tooltips.delete_selected', { entity: t('entity.attributes') })"
                                    :label="t('common.labels.delete_selected')"
                                    icon="pi pi-trash"
                                    severity="danger"
                                    @click="
                                        confirmDeleteRecord(
                                            $event,
                                            selectedRecords.map((record: AttributeData) => record.id)
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
                            :text="t('attribute.columns.name')"
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
                                <i :class="typeIcons[data.type] || 'pi pi-tag'" class="text-surface-400"></i>
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
                    class="min-w-28"
                >
                    <template #header>
                        <HeaderCell
                            :text="t('attribute.columns.type')"
                            :frozen="frozenColumns.type"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('type')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <Tag :value="t(`attribute.types.${data.type}`)" :severity="typeSeverities[data.type] || 'secondary'" :icon="typeIcons[data.type]" />
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <InputGroup>
                            <Select
                                v-model="filterModel.value"
                                :options="[
                                    { label: t('attribute.types.dropdown'), value: 'dropdown' },
                                    { label: t('attribute.types.text'), value: 'text' },
                                    { label: t('attribute.types.switches'), value: 'switches' },
                                    { label: t('attribute.types.multiselect'), value: 'multiselect' },
                                    { label: t('attribute.types.date'), value: 'date' },
                                    { label: t('attribute.types.numeric'), value: 'numeric' },
                                    { label: t('attribute.types.boolean'), value: 'boolean' },
                                    { label: t('attribute.types.file'), value: 'file' }
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

                <!-- Categories Column -->
                <Column columnKey="categories" field="categories" :frozen="frozenColumns.categories" v-if="selectedColumns.some((column: Column) => column.field === 'categories')" class="min-w-36">
                    <template #header>
                        <HeaderCell
                            :text="t('attribute.columns.categories')"
                            :frozen="frozenColumns.categories"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('categories')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div class="flex items-center gap-1 flex-wrap" v-if="data.categories && data.categories.length">
                                <Tag v-for="cat in data.categories.slice(0, 3)" :key="cat.id" :value="cat.name" severity="secondary" class="text-xs" />
                                <span v-if="data.categories.length > 3" class="text-xs text-surface-500 font-medium"> +{{ data.categories.length - 3 }} {{ t('common.labels.more') }} </span>
                            </div>
                            <span v-else class="text-surface-400 text-xs italic">—</span>
                        </DataCell>
                    </template>
                </Column>

                <!-- Values Column -->
                <Column columnKey="values" field="values" :frozen="frozenColumns.values" v-if="selectedColumns.some((column: Column) => column.field === 'values')" class="min-w-36">
                    <template #header>
                        <HeaderCell
                            :text="t('attribute.columns.values')"
                            :frozen="frozenColumns.values"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('values')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div class="flex items-center gap-1 flex-wrap" v-if="data.values && data.values.length">
                                <Tag v-for="val in data.values.slice(0, 4)" :key="val.id" :value="val.value" severity="info" class="text-xs" />
                                <span v-if="data.values.length > 4" class="text-xs text-surface-500 font-medium"> +{{ data.values.length - 4 }} {{ t('common.labels.more') }} </span>
                            </div>
                            <span v-else class="text-surface-400 text-xs italic">—</span>
                        </DataCell>
                    </template>
                </Column>

                <!-- Active Column -->
                <Column columnKey="active" field="active" :frozen="frozenColumns.active" v-if="selectedColumns.some((column: Column) => column.field === 'active')" class="min-w-24">
                    <template #header>
                        <HeaderCell
                            :text="t('attribute.columns.active')"
                            :frozen="frozenColumns.active"
                            :reorderTooltip="t('common.tooltips.reorder_columns')"
                            :lockTooltip="t('common.tooltips.lock_column')"
                            :unlockTooltip="t('common.tooltips.unlock_column')"
                            @toggle="toggleColumnFrozen('active')"
                        />
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <ActiveToggleButton :active="data.active" entity="attribute" :loading="loadingActiveId === data.id" @toggle="toggleActive(data.id)" />
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
                            :text="t('attribute.columns.created_at')"
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
                                        { label: t('common.labels.view'), icon: 'pi pi-eye', command: () => editRecord(data), visible: authStore.hasPermission('view_attributes') },
                                        { label: t('common.labels.edit'), icon: 'pi pi-pencil', command: () => editRecord(data), visible: authStore.hasPermission('update_attributes') },
                                        { label: t('common.labels.delete'), icon: 'pi pi-trash', severity: 'danger', command: () => confirmDeleteRecord(null, [data.id]), visible: authStore.hasPermission('delete_attributes') }
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
        </template>
    </div>
</template>
