<script setup lang="ts">
import { useRoleService } from '@/services/useRoleService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS } from '@/utilities/toast';
import { roleSchema } from '@/validations/role';
import { validate, validateField } from '@/validations/validate';
import type { RoleData, RoleFormData, Permission } from '@/types/role';
import { inject, onMounted, ref, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';

interface DialogData {
    record: RoleData | RoleFormData;
    permissionsOptions: Permission[][];
    action: string;
}

interface DialogRef {
    value: {
        data: DialogData;
        close: (result?: { record: RoleData; action: string }) => void;
    };
}

const { t } = useI18n();
const authStore = useAuthStore();
const loading = useLoading();
const dialogRef = inject<DialogRef>('dialogRef');

const record: Ref<RoleData | RoleFormData> = ref({} as RoleFormData);
const action = ref<string>('');
const permissionsOptions = ref<Permission[][]>([]);

onMounted(() => {
    if (dialogRef?.value) {
        record.value = dialogRef.value.data.record;
        permissionsOptions.value = dialogRef.value.data.permissionsOptions;
        action.value = dialogRef.value.data.action;
    }
});

const schema = roleSchema;
const syncPermissions = (): void => {
    try {
        (record.value as RoleFormData).permissions = Array.isArray(permissionsOptions.value?.[1]) ? permissionsOptions.value[1].map((p: Permission) => p.id) : [];
    } catch {
        (record.value as RoleFormData).permissions = [];
    }
};
const validateForm = (): boolean => {
    syncPermissions();
    const { ok, errors } = validate(schema, record.value);
    authStore.errors = ok ? {} : errors;
    return ok;
};
const onBlurField = (path: string): void => {
    if (path === 'permissions') syncPermissions();
    const { ok, errors } = validateField(schema, record.value, path);
    if (ok) {
        authStore.clearErrors([path]);
    } else {
        authStore.errors = { ...authStore.errors, ...errors };
    }
};

async function saveRecord(): Promise<void> {
    if (!validateForm()) return;

    loading.startFormSending();
    const payload = { ...record.value } as RoleFormData;
    const serviceAction = action.value === ACTIONS.CREATE ? useRoleService.storeRole : (roleData: Partial<RoleFormData>) => useRoleService.updateRole((record.value as RoleData).id, roleData);

    serviceAction(payload)
        .then((response) => {
            dialogRef?.value.close({ record: response.data, action: action.value });
        })
        .catch((error: any) => {
            authStore.processError(error, t('common.messages.error_occurred'));
        })
        .finally(() => {
            loading.stopFormSending();
        });
}
const closeDialog = (): void => {
    dialogRef?.value.close();
};
</script>
<template>
    <form @submit.prevent="saveRecord">
        <div class="flex flex-col gap-8 pt-2">
            <div>
                <FloatLabel variant="on">
                    <label for="name" class="block font-bold mb-3">{{ $t('role.columns.name') }}</label>
                    <InputText :disabled="loading.isFormSending" id="name" v-model.trim="record.name" autofocus fluid :invalid="authStore.errors?.name ? true : false" @input="() => authStore.clearErrors([`name`])" @blur="onBlurField('name')" />
                </FloatLabel>
                <Message v-if="authStore.errors?.['name']?.[0]" severity="error" size="small">
                    {{ $t(authStore.errors?.['name']?.[0]) }}
                </Message>
            </div>
            <!-- guard_name removed (server will enforce hard-coded guard) -->
            <div>
                <Message v-if="authStore.errors?.['permissions']?.[0]" severity="error" size="small">
                    {{ $t(authStore.errors?.['permissions']?.[0]) }}
                </Message>
                <PickList
                    required
                    :disabled="loading.isFormSending"
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
            <Button :label="$t('common.labels.save')" icon="pi pi-check" type="submit" :loading="loading.isFormSending" />
        </div>
    </form>
</template>
