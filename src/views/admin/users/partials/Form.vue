<script setup lang="ts">
import { useUserService } from '@/services/useUserService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS } from '@/utilities/toast';
import { userSchema } from '@/validations/user';
import { validate, validateField } from '@/validations/validate';
import type { User, Role, UserFormData } from '@/types/user';
import { inject, onMounted, ref, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';

interface DialogData {
    record: User | UserFormData;
    rolesOptions: Role[][];
    action: string;
}

interface DialogRef {
    value: {
        data: DialogData;
        close: (result?: { record: User; action: string }) => void;
    };
}

const { t } = useI18n();
const authStore = useAuthStore();
const loading = useLoading();
const dialogRef = inject<DialogRef>('dialogRef');

const record: Ref<User | UserFormData> = ref({} as UserFormData);
const action = ref<string>('');
const rolesOptions = ref<Role[][]>([]);

onMounted(() => {
    if (dialogRef?.value) {
        record.value = dialogRef.value.data.record;
        rolesOptions.value = dialogRef.value.data.rolesOptions;
        action.value = dialogRef.value.data.action;
    }
});

// Schema helpers
const schema = userSchema;
const syncRoles = (): void => {
    try {
        (record.value as UserFormData).roles = Array.isArray(rolesOptions.value?.[1]) ? rolesOptions.value[1].map((r: Role) => r.id) : [];
    } catch {
        (record.value as UserFormData).roles = [];
    }
};
const validateForm = (): boolean => {
    syncRoles();
    const { ok, errors } = validate(schema, record.value);
    authStore.errors = ok ? {} : errors;
    return ok;
};
const onBlurField = (path: string): void => {
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
    const payload = { ...record.value } as UserFormData;
    // On update, if password empty, remove it to avoid overriding
    if (action.value !== ACTIONS.CREATE && !payload.password) {
        delete payload.password;
        delete payload.password_confirmation;
    }

    const serviceAction = action.value === ACTIONS.CREATE ? useUserService.storeUser : (userData: Partial<UserFormData>) => useUserService.updateUser((record.value as User).id, userData);

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
                    <label for="name" class="block font-bold mb-3">{{ $t('user.columns.name') }}</label>
                    <InputText :disabled="loading.isFormSending" id="name" v-model.trim="record.name" autofocus fluid :invalid="authStore.errors?.name ? true : false" @input="() => authStore.clearErrors([`name`])" @blur="onBlurField('name')" />
                </FloatLabel>
                <Message v-if="authStore.errors?.['name']?.[0]" severity="error" size="small">
                    {{ $t(authStore.errors?.['name']?.[0]) }}
                </Message>
            </div>
            <div>
                <FloatLabel variant="on">
                    <label for="email" class="block font-bold mb-3">{{ $t('user.columns.email') }}</label>
                    <InputText
                        type="email"
                        :disabled="loading.isFormSending"
                        id="email"
                        v-model.trim="record.email"
                        autofocus
                        fluid
                        :invalid="authStore.errors?.email ? true : false"
                        @input="() => authStore.clearErrors([`email`])"
                        @blur="onBlurField('email')"
                    />
                </FloatLabel>
                <Message v-if="authStore.errors?.['email']?.[0]" severity="error" size="small">
                    {{ $t(authStore.errors?.['email']?.[0]) }}
                </Message>
            </div>
            <div>
                <FloatLabel variant="on">
                    <Password
                        v-model.trim="record.password"
                        :disabled="loading.isFormSending"
                        :invalid="authStore.errors?.password ? true : false"
                        :required="action === ACTIONS.CREATE"
                        autofocus
                        fluid
                        toggleMask
                        @input="() => authStore.clearErrors([`password`])"
                        @blur="onBlurField('password')"
                    >
                        <template #header>
                            <div class="font-semibold text-xm mb-4">{{ $t('user.columns.password') }}</div>
                        </template>
                        <template #footer>
                            <Divider />
                            <ul class="pl-2 my-0 leading-normal">
                                <li>{{ $t('common.contents.password_requirements.lowercase') }}</li>
                                <li>{{ $t('common.contents.password_requirements.uppercase') }}</li>
                                <li>{{ $t('common.contents.password_requirements.numeric') }}</li>
                                <li>{{ $t('common.contents.password_requirements.minimum_length', { length: 8 }) }}</li>
                            </ul>
                        </template>
                    </Password>
                    <label for="password">{{ $t('user.columns.password') }}</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['password']?.[0]" severity="error" size="small">
                    {{ $t(authStore.errors?.['password']?.[0]) }}
                </Message>
            </div>

            <div>
                <FloatLabel variant="on">
                    <Password
                        v-model.trim="record.password_confirmation"
                        :disabled="loading.isFormSending"
                        :invalid="authStore.errors?.password_confirmation ? true : false"
                        :required="action === ACTIONS.CREATE"
                        autofocus
                        fluid
                        toggleMask
                        name="password_confirmation"
                        @input="() => authStore.clearErrors([`password_confirmation`])"
                        @blur="onBlurField('password_confirmation')"
                    />
                    <label for="password_confirmation">{{ $t('user.columns.password_confirmation') }}</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['password_confirmation']?.[0]" severity="error" size="small">
                    {{ $t(authStore.errors?.['password_confirmation']?.[0]) }}
                </Message>
            </div>

            <div>
                <PickList
                    required
                    :disabled="loading.isFormSending"
                    v-model="rolesOptions"
                    dataKey="id"
                    breakpoint="1400px"
                    :showSourceControls="false"
                    :showTargetControls="false"
                    striped
                    :invalid="authStore.errors?.roles ? true : false"
                    pt:header:class="bg-blue-500"
                    :pt="{
                        sourceListContainer: { class: authStore.errors?.roles ? 'rounded-md border border-red-500' : '' },
                        targetListContainer: { class: authStore.errors?.roles ? 'rounded-md border border-red-500' : '' }
                    }"
                    @selection-change="() => authStore.clearErrors([`roles`])"
                    @change="onBlurField('roles')"
                >
                    <template #sourceheader>
                        {{ $t('user.placeholders.roles_available') }}
                    </template>
                    <template #targetheader>
                        {{ $t('user.placeholders.roles_selected') }}
                    </template>
                    <template #option="{ option }">
                        {{ option.name }}
                    </template>
                </PickList>
                <Message v-if="authStore.errors?.['roles']?.[0]" severity="error" size="small">
                    {{ $t(authStore.errors?.['roles']?.[0]) }}
                </Message>
            </div>
        </div>
        <div class="flex justify-end gap-2 mt-4">
            <Button :label="$t('common.labels.cancel')" icon="pi pi-times" text @click="closeDialog" />
            <Button :label="$t('common.labels.save')" icon="pi pi-check" type="submit" :loading="loading.isFormSending" />
        </div>
    </form>
</template>
