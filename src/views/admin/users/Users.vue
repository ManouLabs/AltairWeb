<script setup>
import { useUserService } from '@/services/useUserService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useColumnStore } from '@/stores/useColumnStore';
import { useLoading } from '@/stores/useLoadingStore';
import { extractLazyParams, findRecordIndex } from '@/utilities/helper';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { FilterMatchMode } from '@primevue/core/api';
import debounce from 'lodash-es/debounce';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const loading = useLoading();
const authStore = useAuthStore();
const columnStore = useColumnStore();
const confirm = useConfirm();
const dialog = useDialog();
const { t } = useI18n();
const { showToast } = useShowToast();
const formComponent = defineAsyncComponent(() => import('./partials/Form.vue'));

const lazyParams = ref({});
const filters = ref(getDefaultFilters());
const records = ref([]);
const rows = ref();
const total = ref();
const selectedRecords = ref();
const record = ref(null);
const lockedRow = ref([]);
const subscription = ref(null);
const allRoles = ref(null);
const rolesOptions = ref([], []);

const defaultColumns = ref([
    { field: 'name', header: t('user.columns.name') },
    { field: 'email', header: t('user.columns.email') },
    { field: 'email_verified_at', header: t('user.columns.email_verified_at') },
    { field: 'roles', header: t('user.columns.roles') },
    { field: 'created_at', header: t('user.columns.created_at') },
    { field: 'updated_at', header: t('user.columns.updated_at') }
]);

const selectedColumns = ref([]);
const frozenColumns = ref({ name: false, email: false, roles: false });
const recordDataTable = ref();

onMounted(() => {
    loadLazyData();
    subscribeToEcho();
    initializeColumns();
});

onUnmounted(() => {
    if (subscription.value) subscription.value.stopListening('DataStream');
});

function initializeColumns() {
    selectedColumns.value = columnStore.getColumns('usersColumns') || defaultColumns.value;
}

const columnChanged = (newColumns) => {
    selectedColumns.value = newColumns;
    columnStore.setColumns('usersColumns', newColumns);
};

const loadLazyData = debounce(async () => {
    lazyParams.value.page ? (lazyParams.value.page += 1) : resetPages();
    useUserService
        .getUsers(lazyParams.value)
        .then(({ users, meta, roles }) => {
            records.value = users;
            total.value = meta.total;
            rows.value = meta.per_page;
            allRoles.value = [roles, []];
        })
        .catch((error) => {
            console.error(error);
            showToast('error', 'error', 'user', 'tc');
        })
        .finally(() => loading.stopDataLoading());
}, 150);

function resetPages() {
    lazyParams.value.page = 0;
}

function subscribeToEcho() {
    subscription.value = Echo.private('data-stream.user').listen('DataStream', handleEchoEvent);
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
        if (index !== -1) records.value.splice(index, 1);
    });
}

function handleUpdate(event) {
    const index = findRecordIndex(records, event.data.id);
    if (index !== -1) records.value[index] = event.data;
}

function handleStore(event) {
    if (!records.value.some((r) => r.id === event.data.id)) {
        records.value.unshift(event.data);
    }
}

const onPage = (event) => {
    loading.startDataLoading();
    lazyParams.value = extractLazyParams(event);
    loadLazyData();
};

const onSort = (event) => {
    loading.startDataLoading();
    lazyParams.value = extractLazyParams(event);
    resetPages();
    recordDataTable.value.resetPage();
    loadLazyData();
};

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

function openDialog() {
    dialog.open(formComponent, {
        props: {
            header: t('common.titles.add', { entity: t('entity.user') }),
            style: { width: '30vw' },
            breakpoints: { '960px': '75vw', '640px': '90vw' },
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
                const index = findRecordIndex(records, result.data.record.id);
                if (result.data.action === ACTIONS.CREATE) {
                    records.value.unshift(result.data.record);
                    showToast('success', ACTIONS.CREATE, 'user', 'tc');
                } else if (result.data.action === ACTIONS.EDIT && index !== -1) {
                    records.value[index] = result.data.record;
                    showToast('success', ACTIONS.EDIT, 'user', 'tc');
                }
            }
        }
    });
}

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
                        if (index !== -1) records.value.splice(index, 1);
                    });
                    showToast('success', ACTIONS.DELETE, 'user', 'tc');
                })
                .catch((error) => {
                    console.error(error);
                    showToast('error', 'error', 'user', 'tc');
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
    if (subscription.value) subscription.value.stopListening('DataStream');
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
                v-model:filters="filters"
                :globalFilterFields="selectedColumns.map((c) => c.field)"
                filterDisplay="menu"
                :paginator="true"
                :rows="rows"
                :totalRecords="total"
                @page="onPage"
                @sort="onSort"
                @filter="onFilter"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25, 50, 100]"
                currentPageReportTemplate="{{ t('common.paggination.showing_to_of_entity', { first: '{first}', last: '{last}', totalRecords: '{totalRecords}', entity: t('entity.users') }) }}"
                resizableColumns
                columnResizeMode="fit"
                reorderableColumns
                scrollable
                stripedRows
                rowHover
                size="small"
                :frozenValue="lockedRow"
                sortField="id"
                :sortOrder="-1"
            >
                <template #header>
                    <Toolbar class="w-full justify-between">
                        <template #start>
                            <div class="flex gap-2">
                                <Button v-if="authStore.hasPermission('store_user')" :label="t('common.labels.new')" icon="pi pi-plus" severity="primary" outlined @click="addRecord" />
                                <Button
                                    v-if="authStore.hasPermission('delete_user')"
                                    :label="t('common.labels.delete_selected')"
                                    icon="pi pi-trash"
                                    severity="danger"
                                    outlined
                                    :disabled="!selectedRecords?.length"
                                    @click="
                                        confirmDeleteRecord(
                                            $event,
                                            selectedRecords.map((u) => u.id)
                                        )
                                    "
                                />
                                <Button icon="pi pi-filter-slash" :label="t('common.labels.clear_all_filters')" outlined severity="secondary" @click="clearFilter" />
                            </div>
                        </template>
                        <template #center>
                            <FloatLabel class="w-full">
                                <MultiSelect id="selected_columns" :modelValue="selectedColumns" :options="defaultColumns" optionLabel="header" @update:modelValue="columnChanged" />
                                <label for="selected_columns">{{ t('common.placeholders.displayed_columns') }}</label>
                            </FloatLabel>
                        </template>
                        <template #end>
                            <div class="flex gap-2">
                                <FloatLabel class="w-full">
                                    <IconField>
                                        <InputIcon><i class="pi pi-search" /></InputIcon>
                                        <InputText id="global_search" v-model="filters.global.value" @keyup.enter="searchDone" />
                                        <label for="global_search">{{ t('common.placeholders.search') }}</label>
                                    </IconField>
                                </FloatLabel>
                                <Button v-if="authStore.hasPermission('export_user')" :label="t('common.labels.export')" icon="pi pi-upload" outlined severity="info" class="min-w-28" @click="exportCSV" />
                            </div>
                        </template>
                    </Toolbar>
                </template>

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false" />

                <Column v-for="col in selectedColumns" :key="col.field" :field="col.field" :header="col.header" sortable>
                    <template #body="{ data }">
                        <DataCell>{{ formatColumnValue(col.field, data[col.field]) }}</DataCell>
                    </template>
                </Column>

                <Column :exportable="false" style="min-width: 12rem" :header="t('common.columns.actions')">
                    <template #body="{ data, frozenRow, index }">
                        <DataCell>
                            <div class="flex justify-between">
                                <div class="flex gap-2">
                                    <Button v-if="authStore.hasPermission('view_user')" icon="pi pi-eye" outlined rounded severity="secondary" @click="editRecord(data)" />
                                    <Button v-if="authStore.hasPermission('update_user')" icon="pi pi-pencil" outlined rounded @click="editRecord(data)" />
                                    <Button v-if="authStore.hasPermission('delete_user')" icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteRecord($event, [data.id])" />
                                </div>
                                <Button :icon="frozenRow ? 'pi pi-lock' : 'pi pi-lock-open'" text severity="contrast" @click="toggleLock(data, frozenRow, index)" />
                            </div>
                        </DataCell>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>
