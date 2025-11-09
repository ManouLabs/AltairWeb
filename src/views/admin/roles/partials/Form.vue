<script setup>
import { useRoleService } from '@/services/useRoleService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS } from '@/utilities/toast';
import { roleSchema } from '@/validations/role';
import { validate, validateField } from '@/validations/validate';
import { inject, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const authStore = useAuthStore();
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

const schema = roleSchema;
const syncPermissions = () => {
    try {
        record.value.permissions = Array.isArray(permissionsOptions.value?.[1]) ? permissionsOptions.value[1].map((p) => p.id) : [];
    } catch {
        record.value.permissions = [];
    }
};
const validateForm = () => {
    syncPermissions();
    const { ok, errors } = validate(schema, record.value);
    authStore.errors = ok ? {} : errors;
    return ok;
};
const onBlurField = (path) => {
    if (path === 'permissions') syncPermissions();
    const { ok, errors } = validateField(schema, record.value, path);
    if (ok) {
        authStore.clearErrors([path]);
    } else {
        authStore.errors = { ...authStore.errors, ...errors };
    }
};

async function saveRecord() {
    if (!validateForm()) return;

    loading.startPageLoading();
    const payload = { ...record.value };
    const serviceAction = action.value === ACTIONS.CREATE ? useRoleService.storeRole : (roleData) => useRoleService.updateRole(record.value.id, roleData);

    serviceAction(payload)
        .then((response) => {
            dialogRef.value.close({ record: response.data, action: action.value });
        })
        .catch((error) => {
            authStore.processError(error, t('common.messages.error_occurred'));
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
                    <InputText :disabled="loading.isPageLoading" id="name" v-model.trim="record.name" autofocus fluid :invalid="authStore.errors?.name ? true : false" @input="() => authStore.clearErrors([`name`])" @blur="onBlurField('name')" />
                </FloatLabel>
                <Message v-if="authStore.errors?.['name']?.[0]" severity="error" size="small">
                    {{ $t(authStore.errors?.['name']?.[0]) }}
                </Message>
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
                        :invalid="authStore.errors?.guard_name ? true : false"
                        required
                        @input="() => authStore.clearErrors([`guard_name`])"
                        @change="onBlurField('guard_name')"
                    ></Select>
                </FloatLabel>
                <Message v-if="authStore.errors?.['guard_name']?.[0]" severity="error" size="small">
                    {{ $t(authStore.errors?.['guard_name']?.[0]) }}
                </Message>
            </div>
            <div>
                <Message v-if="authStore.errors?.['permissions']?.[0]" severity="error" size="small">
                    {{ $t(authStore.errors?.['permissions']?.[0]) }}
                </Message>
                <PickList
                    required
                    :disabled="loading.isPageLoading"
                    v-model="permissionsOptions"
                    dataKey="id"
                    breakpoint="1400px"
                    :showSourceControls="false"
                    :showTargetControls="false"
                    striped
                    :invalid="authStore.errors?.permissions ? true : false"
                    pt:header:class="bg-blue-500"
                    :pt="{
                        sourceListContainer: { class: authStore.errors?.permissions ? 'rounded-md border border-red-500' : '' },
                        targetListContainer: { class: authStore.errors?.permissions ? 'rounded-md border border-red-500' : '' }
                    }"
                    @selection-change="() => authStore.clearErrors([`permissions`])"
                    @change="onBlurField('permissions')"
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
