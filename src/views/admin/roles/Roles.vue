<script setup>
import { useRoleService } from '@/services/useRoleService';
import { useLoading } from '@/stores/useLoadingStore';
import { FilterMatchMode } from '@primevue/core/api';
import { DataTable } from 'primevue';
import { useToast } from 'primevue/usetoast';
import { onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useColumnStore } from '../../../stores/useColumnStore';

const loading = useLoading();
const errors = ref();
const columnStore = useColumnStore();
const toast = useToast();
const { t } = useI18n();
const dt = ref();
const reccords = ref();
const reccordDialog = ref(false);
const deleteReccordDialog = ref(false);
const deleteReccordsDialog = ref(false);
const permissionsOptions = ref(null);
const reccord = ref(null);
const selectedReccords = ref();

const defaultColumns = ref([
    { field: 'name', header: t('role.columns.name') },
    { field: 'guard_name', header: t('role.columns.guard_name') },
    { field: 'permissions', header: t('role.columns.permissions') }
]);

const selectedColumns = ref([]);
const subscription = ref(null);

onMounted(() => {
    subscription.value = Echo.private('data-stream.role').listen('DataStream', (event) => {
        const exists = reccords.value.some((record) => record.id === event.data.id);
        if (!exists) {
            reccords.value.unshift(event.data);
            toast.add({
                severity: 'success',
                summary: t('common.toasts.new.summary', { entity: 'Role' }),
                detail: t('common.toasts.new.detail', { entity: 'Role' }),
                life: 8000,
                group: 'br'
            });
        }
    });
    useRoleService
        .getRoles()
        .then((data) => {
            reccords.value = data.roles;
            permissionsOptions.value = [data.permissions, []];
        })
        .catch((error) => {
            toast.add({
                severity: 'error',
                summary: error.message,
                detail: error.response.data.message,
                group: 'tc',
                life: 8000
            });
        });
    selectedColumns.value = columnStore.getColumns('rolesColumns') || defaultColumns.value;
});

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    guard_name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    permissions: { value: null, matchMode: FilterMatchMode.STARTS_WITH }
});

const columnChanged = (newColumns) => {
    selectedColumns.value = newColumns;
    columnStore.setColumns('rolesColumns', newColumns);
};
const lockedRow = ref([]);

const toggleLock = (data, frozen, index) => {
    if (frozen) {
        lockedRow.value = lockedRow.value.filter((c, i) => i !== index);
        reccords.value.push(data);
    } else {
        reccords.value = reccords.value.filter((c, i) => i !== index);
        lockedRow.value.push(data);
    }
    reccords.value.sort((val1, val2) => {
        return val1.id < val2.id ? -1 : 1;
    });
};

const frozenColumns = ref({
    name: false,
    guard_name: false,
    permissions: false
});

const toggleColumnFrozen = (column) => {
    frozenColumns.value[column] = !frozenColumns.value[column];
};

function hideDialog() {
    reccordDialog.value = false;
}

function openNew() {
    reccord.value = { name: null, guard_name: null, permissions: [] };
    errors.value = null;
    reccordDialog.value = true;
}

function saveReccord() {
    reccord.value.permissions = permissionsOptions.value[1].map((permission) => permission.id);
    loading.startLoading();
    useRoleService
        .storeRole(reccord.value)
        .then((response) => {
            reccords.value.unshift(response.data);
            reccordDialog.value = false;
            reccord.value = {};
            toast.add({
                severity: 'success',
                summary: t('common.toasts.created.summary', { entity: 'Role' }),
                detail: t('common.toasts.created.detail', { entity: 'Role' }),
                life: 8000,
                group: 'tc'
            });
        })
        .catch((error) => {
            console.log('error', error);
            errors.value = error.response.data.errors;
            toast.add({
                severity: 'error',
                summary: error.message,
                detail: error.response.data.message,
                group: 'tc',
                life: 8000
            });
        })
        .finally(() => {
            loading.stopLoading();
        });
}

function editReccord(row) {
    reccord.value = { ...row };
    reccordDialog.value = true;
}

function confirmDeleteReccord(prod) {
    reccord.value = prod;
    deleteReccordDialog.value = true;
}

function deleteReccord() {
    reccords.value = reccords.value.filter((val) => val.id !== reccord.value.id);
    deleteReccordDialog.value = false;
    reccord.value = {};
    toast.add({
        severity: 'success',
        summary: 'Successful',
        detail: 'Role Deleted',
        life: 8000
    });
}

function exportCSV() {
    dt.value.exportCSV();
}

function confirmDeleteSelected() {
    deleteReccordsDialog.value = true;
}

function deleteSelectedReccords() {
    reccords.value = reccords.value.filter((val) => !selectedReccords.value.includes(val));
    deleteReccordsDialog.value = false;
    selectedReccords.value = null;
    toast.add({
        severity: 'success',
        summary: 'Successful',
        detail: 'Roles Deleted',
        life: 8000
    });
}
onUnmounted(() => {
    if (subscription.value) {
        subscription.value.stopListening('RoleCreated');
    }
});
</script>

<template>
    <div>
        <div class="card">
            <DataTable
                ref="dt"
                v-model:selection="selectedReccords"
                :value="reccords"
                dataKey="id"
                stripedRows
                removableSort
                :paginator="true"
                resizableColumns
                columnResizeMode="fit"
                :reorderableColumns="true"
                :rows="5"
                :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                :currentPageReportTemplate="'Showing {first} to {last} of {totalRecords} roles'"
                :frozenValue="lockedRow"
                scrollable
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
                            {{ t('role.titles.manage') }}
                        </h2>
                        <Toolbar class="w-full">
                            <template #start>
                                <div class="flex space-x-2">
                                    <Button v-tooltip.top="t('role.tooltips.add')" :label="t('common.actions.new')" icon="pi pi-plus" severity="primary" @click="openNew" outlined />
                                    <Button
                                        v-tooltip.top="t('role.tooltips.delete_selected')"
                                        :label="t('common.actions.delete_selected')"
                                        icon="pi pi-trash"
                                        severity="danger"
                                        @click="confirmDeleteSelected"
                                        outlined
                                        :disabled="!selectedReccords || !selectedReccords.length"
                                    />
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
                                            <InputText id="global_search" v-model="filters['global'].value" />
                                            <label for="global_search">{{ t('common.placeholders.search') }}</label>
                                        </IconField>
                                    </FloatLabel>
                                    <Button :label="t('common.actions.export')" icon="pi pi-upload" class="min-w-28 ml-2" outlined severity="info" @click="exportCSV($event)" />
                                </div>
                            </template>
                        </Toolbar>
                    </div>
                </template>

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false" :reorderableColumn="false" />
                <Column field="id" header="ID" sortable class="min-w-32" :reorderableColumn="false" />
                <Column :frozen="frozenColumns.name" v-if="selectedColumns.some((column) => column.field === 'name')" field="name" sortable class="min-w-32">
                    <template #header>
                        <div class="flex justify-between w-full items-center">
                            <div :class="{ 'font-bold': frozenColumns.name }">{{ t('role.columns.name') }}</div>
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
                        <div :class="{ 'font-bold': frozenColumns.name }">{{ data.name }}</div>
                    </template>
                </Column>
                <Column :frozen="frozenColumns.guard_name" v-if="selectedColumns.some((column) => column.field === 'guard_name')" field="guard_name" sortable class="min-w-32">
                    <template #header>
                        <div class="flex justify-between w-full items-center">
                            <div :class="{ 'font-bold': frozenColumns.guard_name }">{{ t('role.columns.guard_name') }}</div>
                            <Button
                                v-tooltip.top="frozenColumns.guard_name ? t('common.tooltips.unlock_column') : t('common.tooltips.lock_column')"
                                :icon="frozenColumns.guard_name ? 'pi pi-lock' : 'pi pi-lock-open'"
                                text
                                @click="toggleColumnFrozen('guard_name')"
                                severity="contrast"
                            />
                        </div>
                    </template>
                    <template #body="{ data }">
                        <div :class="{ 'font-bold': frozenColumns.guard_name }">{{ data.guard_name }}</div>
                    </template>
                </Column>
                <Column :frozen="frozenColumns.permissions" v-if="selectedColumns.some((column) => column.field === 'permissions')" field="permissions" sortable class="min-w-32">
                    <template #header>
                        <div class="flex justify-between w-full items-center">
                            <div :class="{ 'font-bold': frozenColumns.permissions }">{{ t('role.columns.permissions') }}</div>
                            <Button
                                v-tooltip.top="frozenColumns.permissions ? t('common.tooltips.unlock_column') : t('common.tooltips.lock_column')"
                                :icon="frozenColumns.permissions ? 'pi pi-lock' : 'pi pi-lock-open'"
                                text
                                @click="toggleColumnFrozen('permissions')"
                                severity="contrast"
                            />
                        </div>
                    </template>
                    <template #body="{ data }">
                        <div v-for="permission in data.permissions" :key="permission.id">
                            <Tag severity="info" :value="permission.name" :class="{ 'font-bold': frozenColumns.permissions }" />
                        </div>
                    </template>
                </Column>
                <Column :exportable="false" style="min-width: 12rem" :header="t('common.columns.actions')">
                    <template #body="{ data, frozenRow, index }">
                        <div class="flex justify-between">
                            <div class="flex space-x-2">
                                <Button v-tooltip.top="t('role.tooltips.view')" icon="pi pi-eye" outlined rounded @click="editReccord(data)" severity="secondary" />
                                <Button v-tooltip.top="t('role.tooltips.edit')" icon="pi pi-pencil" outlined rounded @click="editReccord(data)" />
                                <Button v-tooltip.top="t('role.tooltips.delete')" icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteReccord(data)" />
                            </div>
                            <Button
                                v-tooltip.top="frozenRow ? t('common.tooltips.unlock_row') : t('common.tooltips.lock_row')"
                                :icon="frozenRow ? 'pi pi-lock' : 'pi pi-lock-open'"
                                text
                                @click="toggleLock(data, frozenRow, index)"
                                severity="contrast"
                            />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="reccordDialog" :header="t('role.titles.add')" :modal="true">
            <div class="flex flex-col gap-8 pt-2">
                <div>
                    <FloatLabel variant="on">
                        <label for="name" class="block font-bold mb-3">{{ t('role.columns.name') }}</label>
                        <InputText :disabled="loading.isLoading" id="name" v-model.trim="reccord.name" required="true" autofocus fluid :invalid="errors?.name ? true : false" />
                    </FloatLabel>
                    <ErrorMessage field="name" :errors="errors" />
                </div>
                <div>
                    <FloatLabel>
                        <label for="guard_name" class="block font-bold mb-3">{{ t('role.columns.guard_name') }}</label>
                        <Select
                            :disabled="loading.isLoading"
                            id="guard_name"
                            v-model="reccord.guard_name"
                            :options="['api', 'web']"
                            :placeholder="t('role.placeholders.select_guard_name')"
                            fluid
                            checkmark
                            showClear
                            :invalid="errors?.guard_name ? true : false"
                        ></Select>
                    </FloatLabel>
                    <ErrorMessage field="guard_name" :errors="errors" />
                </div>
                <div>
                    <ErrorMessage field="permissions" :errors="errors" />
                    <PickList
                        :disabled="loading.isLoading"
                        v-model="permissionsOptions"
                        dataKey="id"
                        breakpoint="1400px"
                        :showSourceControls="false"
                        :showTargetControls="false"
                        striped
                        :invalid="errors?.permissions ? true : false"
                        pt:header:class="bg-blue-500"
                        :pt="{
                            sourceListContainer: { class: errors?.permissions ? 'rounded-md border border-red-500' : '' },
                            targetListContainer: { class: errors?.permissions ? 'rounded-md border border-red-500' : '' }
                        }"
                    >
                        <template #sourceheader>
                            {{ t('role.placeholders.permissions_available') }}
                        </template>
                        <template #targetheader>
                            {{ t('role.placeholders.permissions_selected') }}
                        </template>
                        <template #option="{ option }">
                            {{ option.name }}
                        </template>
                    </PickList>
                </div>
            </div>
            <template #footer>
                <Button :label="t('common.actions.cancel')" icon="pi pi-times" text @click="hideDialog" />
                <Button :label="t('common.actions.save')" icon="pi pi-check" @click="saveReccord" :loading="loading.isLoading" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteReccordDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="reccord"
                    >Are you sure you want to delete <b>{{ reccord.name }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteReccordDialog = false" />
                <Button label="Yes" icon="pi pi-check" @click="deleteReccord" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteReccordsDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="reccord">Are you sure you want to delete the selected reccords?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteReccordsDialog = false" />
                <Button label="Yes" icon="pi pi-check" text @click="deleteSelectedReccords" />
            </template>
        </Dialog>
    </div>
</template>
