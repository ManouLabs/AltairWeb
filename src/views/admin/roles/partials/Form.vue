<script setup>
import { useRoleService } from '@/services/useRoleService';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { inject, onMounted, ref } from 'vue';

const { showToast } = useShowToast();
const errors = ref();
const loading = useLoading();
const dialogRef = inject('dialogRef');
const record = ref({});
const action = ref();
const permissionsOptions = ref([]);

onMounted(() => {
    record.value = dialogRef.value.data.record;
    permissionsOptions.value = dialogRef.value.data.permissionsOptions;
    action.value = dialogRef.value.data.action;
});

function saveRecord() {
    record.value.permissions = permissionsOptions.value[1].map((permission) => permission.id);
    loading.startPageLoading();

    const serviceAction = action.value === ACTIONS.CREATE ? useRoleService.storeRole : (roleData) => useRoleService.updateRole(record.value.id, roleData);

    serviceAction(record.value)
        .then((response) => {
            dialogRef.value.close({ record: response.data, action: action.value });
        })
        .catch((error) => {
            errors.value = error.response.data.errors;
            showToast('error', 'error', 'role');
        })
        .finally(() => {
            loading.stopPageLoading();
        });
}
const closeDialog = () => {
    dialogRef.value.close();
};
</script>
<template>
    <form @submit.prevent="saveRecord">
        <div class="flex flex-col gap-8 pt-2">
            <div>
                <FloatLabel variant="on">
                    <label for="name" class="block font-bold mb-3">{{ $t('role.columns.name') }}</label>
                    <InputText :disabled="loading.isPageLoading" id="name" v-model.trim="record.name" autofocus fluid :invalid="errors?.name ? true : false" required />
                </FloatLabel>
                <ErrorMessage field="name" :errors="errors" />
            </div>
            <div>
                <FloatLabel>
                    <label for="guard_name" class="block font-bold mb-3">{{ $t('role.columns.guard_name') }}</label>
                    <Select
                        :disabled="loading.isPageLoading"
                        id="guard_name"
                        v-model="record.guard_name"
                        :options="['sanctum', 'api', 'web']"
                        :placeholder="$t('role.placeholders.select_guard_name')"
                        fluid
                        checkmark
                        showClear
                        :invalid="errors?.guard_name ? true : false"
                        required
                    ></Select>
                </FloatLabel>
                <ErrorMessage field="guard_name" :errors="errors" />
            </div>
            <div>
                <ErrorMessage field="permissions" :errors="errors" />
                <PickList
                    required
                    :disabled="loading.isPageLoading"
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
                        {{ $t('role.placeholders.permissions_available') }}
                    </template>
                    <template #targetheader>
                        {{ $t('role.placeholders.permissions_selected') }}
                    </template>
                    <template #option="{ option }">
                        {{ option.name }}
                    </template>
                </PickList>
            </div>
        </div>
        <div class="flex justify-end gap-2 mt-4">
            <Button :label="$t('common.labels.cancel')" icon="pi pi-times" text @click="closeDialog" />
            <Button :label="$t('common.labels.save')" icon="pi pi-check" type="submit" :loading="loading.isPageLoading" />
        </div>
    </form>
</template>
