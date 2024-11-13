<script setup>
import { useRoleService } from '@/services/useRoleService';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useColumnStore } from '../../stores/useColumnStore';

const columnStore = useColumnStore();
const toast = useToast();
const { t } = useI18n();
const dt = ref();
const roles = ref();
const roleDialog = ref(false);
const deleteRoleDialog = ref(false);
const deleteRolesDialog = ref(false);
const role = ref({});
const selectedRoles = ref();

const defaultColumns = ref([
    { field: 'name', header: t('role.name') },
    { field: 'guard_name', header: t('role.guard_name') }
]);

const selectedColumns = ref([]);
onMounted(() => {
    useRoleService.getRoles().then((paginate) => (console.log(paginate), (roles.value = paginate.data)));
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
const submitted = ref(false);

function openNew() {
    role.value = {};
    submitted.value = false;
    roleDialog.value = true;
}

function saveRole() {
    submitted.value = true;

    if (role?.value.name?.trim()) {
        if (role.value.id) {
            role.value.inventoryStatus = role.value.inventoryStatus.value ? role.value.inventoryStatus.value : role.value.inventoryStatus;
            roles.value[findIndexById(role.value.id)] = role.value;
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Role Updated', life: 3000 });
        } else {
            role.value.id = createId();
            role.value.code = createId();
            role.value.image = 'role-placeholder.svg';
            role.value.inventoryStatus = role.value.inventoryStatus ? role.value.inventoryStatus.value : 'INSTOCK';
            roles.value.push(role.value);
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Role Created', life: 3000 });
        }

        roleDialog.value = false;
        role.value = {};
    }
}

function editRole(prod) {
    role.value = { ...prod };
    roleDialog.value = true;
}

function confirmDeleteRole(prod) {
    role.value = prod;
    deleteRoleDialog.value = true;
}

function deleteRole() {
    roles.value = roles.value.filter((val) => val.id !== role.value.id);
    deleteRoleDialog.value = false;
    role.value = {};
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Role Deleted', life: 3000 });
}

function findIndexById(id) {
    let index = -1;
    for (let i = 0; i < roles.value.length; i++) {
        if (roles.value[i].id === id) {
            index = i;
            break;
        }
    }

    return index;
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
    deleteRolesDialog.value = true;
}

function deleteselectedRoles() {
    roles.value = roles.value.filter((val) => !selectedRoles.value.includes(val));
    deleteRolesDialog.value = false;
    selectedRoles.value = null;
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Roles Deleted', life: 3000 });
}
</script>

<template>
    <div>
        <div class="card">
            <DataTable
                ref="dt"
                v-model:selection="selectedRoles"
                :value="roles"
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
            >
                <template #header>
                    <div class="flex items-center">
                        <h2 class="text-xl font-bold min-w-40">{{ t('role.manage_role') }}</h2>
                        <Toolbar class="w-full">
                            <template #start>
                                <Button :label="t('role.new')" icon="pi pi-plus" severity="primary" class="mr-2" @click="openNew" outlined />
                                <Button :label="t('role.delete_selected')" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected" outlined :disabled="!selectedRoles || !selectedRoles.length" />
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
                <Column field="id" header="ID" sortable style="min-width: 12rem" :reorderableColumn="false" />
                <Column v-if="selectedColumns.some((column) => column.field === 'name')" field="name" :header="t('role.name')" sortable style="min-width: 16rem" />
                <Column v-if="selectedColumns.some((column) => column.field === 'guard_name')" field="guard_name" :header="t('role.guard_name')" sortable style="min-width: 16rem" />
                <Column :exportable="false" style="min-width: 12rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editRole(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteRole(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="roleDialog" :style="{ width: '450px' }" header="Role Details" :modal="true">
            <div class="flex flex-col gap-6">
                <img v-if="role.image" :src="`https://primefaces.org/cdn/primevue/images/role/${role.image}`" :alt="role.image" class="block m-auto pb-4" />
                <div>
                    <label for="name" class="block font-bold mb-3">Name</label>
                    <InputText id="name" v-model.trim="role.name" required="true" autofocus :invalid="submitted && !role.name" fluid />
                    <small v-if="submitted && !role.name" class="text-red-500">Name is required.</small>
                </div>
                <div>
                    <label for="description" class="block font-bold mb-3">Description</label>
                    <Textarea id="description" v-model="role.description" required="true" rows="3" cols="20" fluid />
                </div>
                <div>
                    <label for="inventoryStatus" class="block font-bold mb-3">Inventory Status</label>
                    <Select id="inventoryStatus" v-model="role.inventoryStatus" :options="statuses" optionLabel="label" placeholder="Select a Status" fluid></Select>
                </div>

                <div>
                    <span class="block font-bold mb-4">Category</span>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="category1" v-model="role.category" name="category" value="Accessories" />
                            <label for="category1">Accessories</label>
                        </div>
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="category2" v-model="role.category" name="category" value="Clothing" />
                            <label for="category2">Clothing</label>
                        </div>
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="category3" v-model="role.category" name="category" value="Electronics" />
                            <label for="category3">Electronics</label>
                        </div>
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="category4" v-model="role.category" name="category" value="Fitness" />
                            <label for="category4">Fitness</label>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="price" class="block font-bold mb-3">Price</label>
                        <InputNumber id="price" v-model="role.price" mode="currency" currency="USD" locale="en-US" fluid />
                    </div>
                    <div class="col-span-6">
                        <label for="quantity" class="block font-bold mb-3">Quantity</label>
                        <InputNumber id="quantity" v-model="role.quantity" integeronly fluid />
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Save" icon="pi pi-check" @click="saveRole" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteRoleDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="role"
                    >Are you sure you want to delete <b>{{ role.name }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteRoleDialog = false" />
                <Button label="Yes" icon="pi pi-check" @click="deleteRole" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteRolesDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="role">Are you sure you want to delete the selected roles?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteRolesDialog = false" />
                <Button label="Yes" icon="pi pi-check" text @click="deleteselectedRoles" />
            </template>
        </Dialog>
    </div>
</template>
