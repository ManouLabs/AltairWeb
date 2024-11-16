<script setup>
import { useRoleService } from '@/services/useRoleService';
import { FilterMatchMode } from '@primevue/core/api';
import { DataTable } from 'primevue';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useColumnStore } from '../../stores/useColumnStore';

const columnStore = useColumnStore();
const toast = useToast();
const { t } = useI18n();
const dt = ref();
const reccords = ref();
const reccordDialog = ref(false);
const deleteReccordDialog = ref(false);
const deleteReccordsDialog = ref(false);
const reccord = ref({});
const selectedReccords = ref();

const defaultColumns = ref([
    { field: 'name', header: t('role.name') },
    { field: 'guard_name', header: t('role.guard_name') }
]);

const selectedColumns = ref([]);
onMounted(() => {
    useRoleService.getRoles().then((paginate) => (console.log(paginate), (reccords.value = paginate.data)));
    selectedColumns.value = columnStore.getColumns('rolesColumns') || defaultColumns.value;
});

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    guard_name: { value: null, matchMode: FilterMatchMode.STARTS_WITH }
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
    guard_name: false
});

const toggleColumnFrozen = (column) => {
    frozenColumns.value[column] = !frozenColumns.value[column];
};

const submitted = ref(false);

function openNew() {
    reccord.value = {};
    submitted.value = false;
    reccordDialog.value = true;
}

function saveReccord() {
    submitted.value = true;

    if (reccord?.value.name?.trim()) {
        if (reccord.value.id) {
            reccord.value.inventoryStatus = reccord.value.inventoryStatus.value ? reccord.value.inventoryStatus.value : reccord.value.inventoryStatus;

            toast.add({
                severity: 'success',
                summary: 'Successful',
                detail: 'Role Updated',
                life: 3000
            });
        } else {
            reccord.value.id = createId();
            reccord.value.code = createId();
            reccord.value.image = 'role-placeholder.svg';
            reccord.value.inventoryStatus = reccord.value.inventoryStatus ? reccord.value.inventoryStatus.value : 'INSTOCK';
            reccords.value.push(reccord.value);
            toast.add({
                severity: 'success',
                summary: 'Successful',
                detail: 'Role Created',
                life: 3000
            });
        }

        reccordDialog.value = false;
        reccord.value = {};
    }
}

function editReccord(prod) {
    reccord.value = { ...prod };
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
        life: 3000
    });
}

function createId() {
    let id = '';
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 5; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
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
        life: 3000
    });
}
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
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} roles"
                :frozenValue="lockedRow"
                scrollable
                scrollHeight="400px"
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
                            {{ t('role.manage_role') }}
                        </h2>
                        <Toolbar class="w-full">
                            <template #start>
                                <div class="flex space-x-2">
                                    <Button v-tooltip.top="t('role.add_tooltip')" :label="t('role.new')" icon="pi pi-plus" severity="primary" @click="openNew" outlined />
                                    <Button
                                        v-tooltip.top="t('role.delete_selected_tooltip')"
                                        :label="t('role.delete_selected')"
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
                                    <label for="selected_columns">{{ t('role.displayed_column') }}</label>
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
                                            <label for="global_search">{{ t('role.search_placeholder') }}</label>
                                        </IconField>
                                    </FloatLabel>
                                    <Button :label="t('role.export')" icon="pi pi-upload" class="min-w-28 ml-2" outlined severity="info" @click="exportCSV($event)" />
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
                            <div :class="{ 'font-bold': frozenColumns.name }">{{ t('role.name') }}</div>
                            <Button v-tooltip.top="t('role.lock_row_tooltip')" :icon="frozenColumns.name ? 'pi pi-lock' : 'pi pi-lock-open'" text @click="toggleColumnFrozen('name')" severity="contrast" />
                        </div>
                    </template>
                    <template #body="{ data }">
                        <div :class="{ 'font-bold': frozenColumns.name }">{{ data.name }}</div>
                    </template>
                </Column>
                <Column :frozen="frozenColumns.guard_name" v-if="selectedColumns.some((column) => column.field === 'guard_name')" field="guard_name" sortable class="min-w-32">
                    <template #header>
                        <div class="flex justify-between w-full items-center">
                            <div :class="{ 'font-bold': frozenColumns.guard_name }">{{ t('role.guard_name') }}</div>
                            <Button v-tooltip.top="t('role.lock_row_tooltip')" :icon="frozenColumns.guard_name ? 'pi pi-lock' : 'pi pi-lock-open'" text @click="toggleColumnFrozen('guard_name')" severity="contrast" />
                        </div>
                    </template>
                    <template #body="{ data }">
                        <div :class="{ 'font-bold': frozenColumns.guard_name }">{{ data.name }}</div>
                    </template>
                </Column>
                <Column :exportable="false" style="min-width: 12rem" :header="t('role.actions')">
                    <template #body="{ data, frozenRow, index }">
                        <div class="flex justify-between">
                            <div class="flex space-x-2">
                                <Button v-tooltip.top="t('role.view_tooltip')" icon="pi pi-eye" outlined rounded @click="editReccord(data)" severity="secondary" />
                                <Button v-tooltip.top="t('role.edit_tooltip')" icon="pi pi-pencil" outlined rounded @click="editReccord(data)" />
                                <Button v-tooltip.top="t('role.delete_tooltip')" icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteReccord(data)" />
                            </div>
                            <Button v-tooltip.top="t('role.lock_row_tooltip')" :icon="frozenRow ? 'pi pi-lock' : 'pi pi-lock-open'" text @click="toggleLock(data, frozenRow, index)" severity="contrast" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="reccordDialog" :style="{ width: '450px' }" header="Role Details" :modal="true">
            <div class="flex flex-col gap-6">
                <img v-if="reccord.image" :src="`https://primefaces.org/cdn/primevue/images/role/${reccord.image}`" :alt="reccord.image" class="block m-auto pb-4" />
                <div>
                    <label for="name" class="block font-bold mb-3">Name</label>
                    <InputText id="name" v-model.trim="reccord.name" required="true" autofocus :invalid="submitted && !reccord.name" fluid />
                    <small v-if="submitted && !reccord.name" class="text-red-500">Name is required.</small>
                </div>
                <div>
                    <label for="description" class="block font-bold mb-3">Description</label>
                    <Textarea id="description" v-model="reccord.description" required="true" rows="3" cols="20" fluid />
                </div>
                <div>
                    <label for="inventoryStatus" class="block font-bold mb-3">Inventory Status</label>
                    <Select id="inventoryStatus" v-model="reccord.inventoryStatus" :options="statuses" optionLabel="label" placeholder="Select a Status" fluid></Select>
                </div>

                <div>
                    <span class="block font-bold mb-4">Category</span>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="category1" v-model="reccord.category" name="category" value="Accessories" />
                            <label for="category1">Accessories</label>
                        </div>
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="category2" v-model="reccord.category" name="category" value="Clothing" />
                            <label for="category2">Clothing</label>
                        </div>
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="category3" v-model="reccord.category" name="category" value="Electronics" />
                            <label for="category3">Electronics</label>
                        </div>
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="category4" v-model="reccord.category" name="category" value="Fitness" />
                            <label for="category4">Fitness</label>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="price" class="block font-bold mb-3">Price</label>
                        <InputNumber id="price" v-model="reccord.price" mode="currency" currency="USD" locale="en-US" fluid />
                    </div>
                    <div class="col-span-6">
                        <label for="quantity" class="block font-bold mb-3">Quantity</label>
                        <InputNumber id="quantity" v-model="reccord.quantity" integeronly fluid />
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Save" icon="pi pi-check" @click="saveReccord" />
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
