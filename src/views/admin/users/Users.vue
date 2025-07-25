<script setup>
import { useDynamicColumns } from '@/composables/useDynamicColumns';
import dayjs from '@/plugins/dayjs';
import { useUserService } from '@/services/useUserService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useColumnStore } from '@/stores/useColumnStore';
import { useLoading } from '@/stores/useLoadingStore';
import { extractLazyParams, findRecordIndex, formatDate } from '@/utilities/helper';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { FilterMatchMode } from '@primevue/core/api';
import debounce from 'lodash-es/debounce';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

onMounted(() => {
    loadLazyData();
    subscribeToEcho();
});

const loading = useLoading();
const lazyParams = ref({});
const total = ref();
const rows = ref();
const columnStore = useColumnStore();
const authStore = useAuthStore();
const confirm = useConfirm();
const dialog = useDialog();
const formComponent = defineAsyncComponent(() => import('./partials/Form.vue'));
const { showToast } = useShowToast();
const { t } = useI18n();
const recordDataTable = ref();
const records = ref();

const record = ref(null);
const selectedRecords = ref();

const defaultFields = ['name', 'email', 'email_verified_at', 'roles', 'created_at', 'updated_at'];
const defaultColumns = computed(() =>
    defaultFields.map((field) => ({
        field,
        header: t(`user.columns.${field}`)
    }))
);

const { selectedColumns, columnChanged, savedFields } = useDynamicColumns('usersColumns', defaultFields, 'user.columns');

const subscription = ref(null);

const allRoles = ref(null);
const rolesOptions = ref([], []);

const onPage = (event) => {
    loading.startDataLoading();
    lazyParams.value = extractLazyParams(event);
    loadLazyData();
};

const loadLazyData = debounce(async () => {
    lazyParams.value.page ? (lazyParams.value.page += 1) : resetPages();
    useUserService
        .getUsers(lazyParams.value)
        .then((data) => {
            records.value = data.users;
            total.value = data.meta.total;
            rows.value = data.meta.per_page;
            allRoles.value = [data.roles, []];
        })
        .catch((error) => {
            if (error?.response?.status === 419 || error?.response?.status === 401) {
                console.error('Session expired, redirecting to login');
            }
            console.error('Error fetching roles');
        })
        .finally(() => {
            loading.stopDataLoading();
        });
}, 150);

const resetPages = () => {
    lazyParams.value.page = 0;
};

const onSort = (event) => {
    loading.startDataLoading();
    lazyParams.value = extractLazyParams(event);
    resetPages();
    recordDataTable.value.resetPage();
    loadLazyData();
};

const filters = ref(getDefaultFilters());
const onFilter = (event) => {
    loading.startDataLoading();
    lazyParams.value = extractLazyParams(event);
    resetPages();
    loadLazyData();
};

const clearFilter = () => {
    loading.startDataLoading();
    filters.value = getDefaultFilters();
    lazyParams.value = {};
    recordDataTable.value.resetPage();
    loadLazyData();
};

const searchDone = () => {
    loading.startDataLoading();
    lazyParams.value.filters = filters.value;
    resetPages();
    loadLazyData();
};

function subscribeToEcho() {
    subscription.value = Echo.private('data-stream.user').listen('DataStream', (event) => {
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
}

function handleUpdate(event) {
    const index = findRecordIndex(records, event.data.id);
    if (index !== -1) {
        records.value[index] = event.data;
    }
}

function handleStore(event) {
    const exists = records.value.some((record) => record.id === event.data.id);
    if (!exists) {
        records.value.unshift(event.data);
    }
}

const lockedRow = ref([]);

const toggleLock = (data, frozen, index) => {
    if (frozen) {
        lockedRow.value = lockedRow.value.filter((c, i) => i !== index);
        records.value = [...records.value, data];
    } else {
        records.value = records.value.filter((c, i) => i !== index);
        lockedRow.value = [...lockedRow.value, data];
    }
    records.value.sort((val1, val2) => (val1.id < val2.id ? -1 : 1));
};

const frozenColumns = ref({
    name: false,
    email: false,
    roles: false
});

const toggleColumnFrozen = (column) => {
    frozenColumns.value = { ...frozenColumns.value, [column]: !frozenColumns.value[column] };
};

function addRecord() {
    record.value = { name: null, email: null, password: null, password_confirmation: null, roles: [] };
    rolesOptions.value = allRoles.value;
    openDialog();
}
function editRecord(row) {
    record.value = row;
    rolesOptions.value[1] = row.roles;
    rolesOptions.value[0] = allRoles.value[0].filter((role) => !rolesOptions.value[1].some((sr) => sr.id === role.id));
    openDialog();
}
const openDialog = () => {
    dialog.open(formComponent, {
        props: {
            header: t('common.titles.add', { entity: t('entity.user') }),
            style: {
                width: '30vw'
            },
            breakpoints: {
                '960px': '75vw',
                '640px': '90vw'
            },
            modal: true,
            maximizable: true
        },
        data: {
            record: record.value,
            rolesOptions: rolesOptions.value,
            action: record.value.id ? ACTIONS.EDIT : ACTIONS.CREATE
        },
        onClose: (result) => {
            if (result && result.data?.record?.id) {
                switch (result.data?.action) {
                    case ACTIONS.CREATE:
                        records.value.unshift(result.data.record);
                        showToast('success', ACTIONS.CREATE, 'user', 'tc');
                        break;
                    case ACTIONS.EDIT: {
                        const index = findRecordIndex(records, result.data.record.id);
                        records.value[index] = result.data.record;
                        showToast('success', ACTIONS.EDIT, 'user', 'tc');
                        break;
                    }
                    default:
                        console.error(`Unhandled action: ${result.action}`);
                }
            }
        }
    });
};

function confirmDeleteRecord(event, usersIds) {
    confirm.require({
        modal: true,
        target: event.currentTarget,
        message: usersIds.length > 1 ? t('common.confirmations.delete_selected.message', { entity: t('entity.users') }) : t('common.confirmations.delete.message', { entity: t('entity.user') }),
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
            useUserService
                .deleteUsers(usersIds)
                .then(() => {
                    usersIds.forEach((id) => {
                        const index = findRecordIndex(records, id);
                        if (index !== -1) {
                            records.value.splice(index, 1);
                        }
                    });
                    showToast('success', ACTIONS.DELETE, 'user', 'tc');
                })
                .catch((error) => {
                    if (error?.response?.status === 419 || error?.response?.status === 401) {
                        console.error('Session expired, redirecting to login');
                    }
                    console.error('Error fetching roles');
                });
        }
    });
}

function getDefaultFilters() {
    return {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        id: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { value: null, matchMode: FilterMatchMode.CONTAINS },
        email: { value: null, matchMode: FilterMatchMode.CONTAINS },
        email_verified_at: { value: null, matchMode: FilterMatchMode.DATE_IS },
        roles: {
            value: null,
            matchMode: FilterMatchMode.IN,
            relation: { name: 'roles', column: 'name' }
        },
        created_at: { value: null, matchMode: FilterMatchMode.DATE_IS },
        updated_at: { value: null, matchMode: FilterMatchMode.DATE_IS }
    };
}
function exportCSV() {
    recordDataTable.value.exportCSV();
}
onUnmounted(() => {
    if (subscription.value) {
        subscription.value.stopListening('DataStream');
    }
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
                :currentPageReportTemplate="t('common.paggination.showing_to_of_entity', { first: '{first}', last: '{last}', totalRecords: '{totalRecords}', entity: t('entity.roles') })"
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
                :pt="{
                    table: { style: 'min-width: 50rem' },
                    bodyrow: ({ props }) => ({
                        class: [{ 'font-bold': props.frozenRow }]
                    })
                }"
            >
                <template #header>
                    <div class="flex items-center">
                        <h2 class="text-xl font-bold min-w-40">
                            {{ t('common.titles.manage', { entity: t('entity.users') }) }}
                        </h2>
                        <Toolbar class="w-full">
                            <template #start>
                                <div class="flex space-x-2">
                                    <Button
                                        v-if="authStore.hasPermission('store_user')"
                                        v-tooltip.top="t('common.tooltips.add', { entity: t('entity.user') })"
                                        :label="t('common.labels.new')"
                                        icon="pi pi-plus"
                                        severity="primary"
                                        @click="addRecord"
                                        outlined
                                    />
                                    <Button
                                        v-if="authStore.hasPermission('delete_user')"
                                        v-tooltip.top="t('common.tooltips.delete_selected', { entity: t('entity.users') })"
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
                                    <MultiSelect id="selected_columns" :modelValue="selectedColumns" :options="defaultColumns" optionLabel="header" @update:modelValue="columnChanged" />
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
                                    <Button
                                        v-if="authStore.hasPermission('export_user')"
                                        v-tooltip.top="t('common.tooltips.export_selection', { entity: t('entity.users') })"
                                        :label="t('common.labels.export')"
                                        icon="pi pi-upload"
                                        class="min-w-28 ml-2"
                                        outlined
                                        severity="info"
                                        @click="exportCSV($event)"
                                    />
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
                        <div class="flex justify-between w-full items-center">
                            <div :class="{ 'font-bold': frozenColumns.name }">{{ t('user.columns.name') }}</div>
                            <Button
                                v-tooltip.top="frozenColumns.name ? t('common.tooltips.unlock_column') : t('common.tooltips.lock_column')"
                                :icon="frozenColumns.name ? 'pi pi-lock' : 'pi pi-lock-open'"
                                text
                                @click="toggleColumnFrozen('name')"
                                severity="contrast"
                            />
                        </div>
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div :class="{ 'font-bold': frozenColumns.name }">{{ data.name }}</div></DataCell
                        >
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
                    columnKey="email"
                    field="email"
                    :frozen="frozenColumns.email"
                    v-if="selectedColumns.some((column) => column.field === 'email')"
                    sortable
                    class="min-w-32"
                >
                    <template #header>
                        <div class="flex justify-between w-full items-center">
                            <div :class="{ 'font-bold': frozenColumns.email }">{{ t('user.columns.email') }}</div>
                            <Button
                                v-tooltip.top="frozenColumns.email ? t('common.tooltips.unlock_column') : t('common.tooltips.lock_column')"
                                :icon="frozenColumns.email ? 'pi pi-lock' : 'pi pi-lock-open'"
                                text
                                @click="toggleColumnFrozen('email')"
                                severity="contrast"
                            />
                        </div>
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div :class="{ 'font-bold': frozenColumns.email }">{{ data.email }}</div></DataCell
                        >
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
                    dataType="date"
                    columnKey="email_verified_at"
                    field="email_verified_at"
                    :frozen="frozenColumns.email_verified_at"
                    v-if="selectedColumns.some((column) => column.field === 'email_verified_at')"
                    sortable
                    class="min-w-40"
                >
                    <template #header>
                        <div class="flex justify-between w-full items-center">
                            <div :class="{ 'font-bold': frozenColumns.email_verified_at }">{{ t('user.columns.email_verified_at') }}</div>
                            <Button
                                v-tooltip.top="frozenColumns.email_verified_at ? t('common.tooltips.unlock_column') : t('common.tooltips.lock_column')"
                                :icon="frozenColumns.email_verified_at ? 'pi pi-lock' : 'pi pi-lock-open'"
                                text
                                @click="toggleColumnFrozen('email_verified_at')"
                                severity="contrast"
                            />
                        </div>
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div :class="{ 'font-bold': frozenColumns.email_verified_at }">{{ dayjs(data.email_verified_at).format('l') }}</div>
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <div class="flex flex-col gap-2">
                            <Dropdown
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
                                <DatePicker v-model="filterModel.value" dateFormat="yy-mm-dd" :showClear="false" :manualInput="false" @dateSelect="(e) => formatDate(e, filterModel)" />
                                <InputGroupAddon>
                                    <Button size="small" icon="pi pi-check" severity="primary" @click="applyFilter()" />
                                    <Button
                                        size="small"
                                        icon="pi pi-times"
                                        severity="danger"
                                        outlined
                                        :disabled="!filterModel.value"
                                        @click="
                                            (() => {
                                                filterModel.value = null;
                                                applyFilter();
                                            })()
                                        "
                                    />
                                </InputGroupAddon>
                            </InputGroup>
                        </div>
                    </template>
                </Column>
                <Column
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    :showClearButton="false"
                    :showApplyButton="false"
                    columnKey="roles"
                    :frozen="frozenColumns.roles"
                    v-if="selectedColumns.some((column) => column.field === 'roles')"
                    field="roles"
                    class="min-w-32"
                >
                    <template #header>
                        <div class="flex justify-between w-full items-center">
                            <div :class="{ 'font-bold': frozenColumns.roles }">{{ t('user.columns.roles') }}</div>
                            <Button
                                v-tooltip.top="frozenColumns.roles ? t('common.tooltips.unlock_column') : t('common.tooltips.lock_column')"
                                :icon="frozenColumns.roles ? 'pi pi-lock' : 'pi pi-lock-open'"
                                text
                                @click="toggleColumnFrozen('roles')"
                                severity="contrast"
                            />
                        </div>
                    </template>
                    <template #body="{ data }">
                        <DataCell class="grid grid-cols-4 w-full">
                            <div v-for="role in data.roles" :key="role.id" class="w-full">
                                <Tag severity="info" :value="role.name" :class="{ 'font-bold': frozenColumns.roles }" />
                            </div>
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <InputGroup>
                            <MultiSelect size="small" v-model="filterModel.value" :options="allRoles[0]" optionLabel="name" optionValue="name">
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
                <Column
                    :showClearButton="false"
                    :showApplyButton="false"
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    dataType="date"
                    columnKey="created_at"
                    field="created_at"
                    :frozen="frozenColumns.created_at"
                    v-if="selectedColumns.some((column) => column.field === 'created_at')"
                    sortable
                    class="min-w-40"
                >
                    <template #header>
                        <div class="flex justify-between w-full items-center">
                            <div :class="{ 'font-bold': frozenColumns.created_at }">{{ t('user.columns.created_at') }}</div>
                            <Button
                                v-tooltip.top="frozenColumns.created_at ? t('common.tooltips.unlock_column') : t('common.tooltips.lock_column')"
                                :icon="frozenColumns.created_at ? 'pi pi-lock' : 'pi pi-lock-open'"
                                text
                                @click="toggleColumnFrozen('created_at')"
                                severity="contrast"
                            />
                        </div>
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div :class="{ 'font-bold': frozenColumns.created_at }">{{ dayjs(data.created_at).format('l') }}</div>
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <div class="flex flex-col gap-2">
                            <!-- Match Mode Selector -->
                            <Dropdown
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

                            <!-- Date Input + Apply/Clear -->
                            <InputGroup>
                                <DatePicker v-model="filterModel.value" dateFormat="yy-mm-dd" :showClear="false" :manualInput="false" @dateSelect="(e) => formatDate(e, filterModel)" />
                                <InputGroupAddon>
                                    <Button size="small" icon="pi pi-check" severity="primary" @click="applyFilter()" />
                                    <Button
                                        size="small"
                                        icon="pi pi-times"
                                        severity="danger"
                                        outlined
                                        :disabled="!filterModel.value"
                                        @click="
                                            (() => {
                                                filterModel.value = null;
                                                applyFilter();
                                            })()
                                        "
                                    />
                                </InputGroupAddon>
                            </InputGroup>
                        </div>
                    </template>
                </Column>
                <Column
                    :showClearButton="false"
                    :showApplyButton="false"
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    dataType="date"
                    columnKey="updated_at"
                    field="updated_at"
                    :frozen="frozenColumns.updated_at"
                    v-if="selectedColumns.some((column) => column.field === 'updated_at')"
                    sortable
                    class="min-w-40"
                >
                    <template #header>
                        <div class="flex justify-between w-full items-center">
                            <div :class="{ 'font-bold': frozenColumns.updated_at }">{{ t('user.columns.updated_at') }}</div>
                            <Button
                                v-tooltip.top="frozenColumns.updated_at ? t('common.tooltips.unlock_column') : t('common.tooltips.lock_column')"
                                :icon="frozenColumns.updated_at ? 'pi pi-lock' : 'pi pi-lock-open'"
                                text
                                @click="toggleColumnFrozen('updated_at')"
                                severity="contrast"
                            />
                        </div>
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div :class="{ 'font-bold': frozenColumns.updated_at }">{{ dayjs(data.updated_at).format('l') }}</div>
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <div class="flex flex-col gap-2">
                            <Dropdown
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
                                <DatePicker v-model="filterModel.value" :showClear="false" @dateSelect="(e) => formatDate(e, filterModel)" />
                                <InputGroupAddon>
                                    <Button size="small" icon="pi pi-check" severity="primary" @click="applyFilter()" />
                                    <Button
                                        size="small"
                                        icon="pi pi-times"
                                        severity="danger"
                                        outlined
                                        :disabled="!filterModel.value"
                                        @click="
                                            (() => {
                                                filterModel.value = null;
                                                applyFilter();
                                            })()
                                        "
                                    />
                                </InputGroupAddon>
                            </InputGroup>
                        </div>
                    </template>
                </Column>
                <Column columnKey="actions" :exportable="false" style="min-width: 12rem" :header="t('common.columns.actions')">
                    <template #body="{ data, frozenRow, index }">
                        <DataCell>
                            <div class="flex justify-between">
                                <div class="flex space-x-2">
                                    <Button v-if="authStore.hasPermission('view_user')" v-tooltip.top="t('common.tooltips.view', { entity: t('entity.user') })" icon="pi pi-eye" outlined rounded @click="editRecord(data)" severity="secondary" />
                                    <Button v-if="authStore.hasPermission('update_user')" v-tooltip.top="t('common.tooltips.edit', { entity: t('entity.user') })" icon="pi pi-pencil" outlined rounded @click="editRecord(data)" />
                                    <Button
                                        v-if="authStore.hasPermission('delete_user')"
                                        v-tooltip.top="$t('common.tooltips.delete', { entity: t('entity.user') })"
                                        icon="pi pi-trash"
                                        outlined
                                        rounded
                                        severity="danger"
                                        @click="confirmDeleteRecord($event, [data.id])"
                                    />
                                </div>
                                <Button
                                    v-tooltip.top="frozenRow ? t('common.tooltips.unlock_row') : t('common.tooltips.lock_row')"
                                    :icon="frozenRow ? 'pi pi-lock' : 'pi pi-lock-open'"
                                    text
                                    @click="toggleLock(data, frozenRow, index)"
                                    severity="contrast"
                                />
                            </div>
                        </DataCell>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>
