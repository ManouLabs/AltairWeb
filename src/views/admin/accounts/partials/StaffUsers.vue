<script setup lang="ts">
import { useAuthStore } from '@/stores/useAuthStore';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const authStore = useAuthStore();

const record = defineModel<any>({ required: true });

// Hardcoded role options
const roleOptions = ref([
    { value: 'Admin', label: 'Admin' },
    { value: 'Staff', label: 'Staff' }
]);

// Ensure at least one user exists
watch(
    () => record.value.users,
    (val) => {
        if (!val || val.length === 0) {
            record.value.users = [createNewUser()];
        }
    },
    { immediate: true }
);

function createNewUser() {
    return {
        name: '',
        email: '',
        role: null,
        password: '',
        password_confirmation: ''
    };
}

const addUser = () => {
    record.value.users.push(createNewUser());
};

const removeUser = (index: number) => {
    if (record.value.users.length > 1) {
        record.value.users.splice(index, 1);
    }
};

const onFieldBlur = (userIndex: string | number, field: string) => {
    authStore.clearErrors([`users.${userIndex}.${field}`]);
};
</script>

<template>
    <div class="flex flex-col gap-6">
        <!-- Header -->
        <div>
            <h3 class="text-lg font-bold text-surface-900 dark:text-white">{{ t('account.staff.title') }}</h3>
            <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">{{ t('account.staff.subtitle') }}</p>
        </div>

        <!-- User cards -->
        <div class="space-y-6">
            <div v-for="(user, userIndex) in record.users" :key="userIndex" class="border border-surface-200 dark:border-surface-700 rounded-xl p-6 bg-surface-0 dark:bg-surface-900">
                <!-- Row 1: Full Name / Email / Role + Delete -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <!-- Full Name -->
                    <div>
                        <FloatLabel variant="on" class="w-full">
                            <IconField>
                                <InputIcon class="pi pi-user" />
                                <InputText
                                    :id="`user_name_${userIndex}`"
                                    v-model="user.name"
                                    class="w-full"
                                    :invalid="authStore.errors?.[`users.${userIndex}.name`]?.[0] ? true : false"
                                    @input="() => authStore.clearErrors([`users.${userIndex}.name`])"
                                    @blur="() => onFieldBlur(userIndex, 'name')"
                                />
                            </IconField>
                            <label :for="`user_name_${userIndex}`">{{ t('account.staff.full_name') }} *</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors?.[`users.${userIndex}.name`]?.[0]" severity="error" size="small">
                            {{ t(authStore.errors?.[`users.${userIndex}.name`]?.[0]!) }}
                        </Message>
                    </div>

                    <!-- Email -->
                    <div>
                        <FloatLabel variant="on" class="w-full">
                            <IconField>
                                <InputIcon class="pi pi-envelope" />
                                <InputText
                                    :id="`user_email_${userIndex}`"
                                    v-model="user.email"
                                    type="email"
                                    class="w-full"
                                    :invalid="authStore.errors?.[`users.${userIndex}.email`]?.[0] ? true : false"
                                    @input="() => authStore.clearErrors([`users.${userIndex}.email`])"
                                    @blur="() => onFieldBlur(userIndex, 'email')"
                                />
                            </IconField>
                            <label :for="`user_email_${userIndex}`">{{ t('account.staff.email_address') }} *</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors?.[`users.${userIndex}.email`]?.[0]" severity="error" size="small">
                            {{ t(authStore.errors?.[`users.${userIndex}.email`]?.[0]!) }}
                        </Message>
                    </div>

                    <!-- Role + Delete -->
                    <div class="flex gap-2">
                        <div class="flex-1">
                            <FloatLabel variant="on" class="w-full">
                                <Select
                                    :id="`user_role_${userIndex}`"
                                    v-model="user.role"
                                    :options="roleOptions"
                                    optionValue="value"
                                    optionLabel="label"
                                    class="w-full"
                                    :invalid="authStore.errors?.[`users.${userIndex}.role`]?.[0] ? true : false"
                                    @change="() => authStore.clearErrors([`users.${userIndex}.role`])"
                                />
                                <label :for="`user_role_${userIndex}`">{{ t('account.staff.role') }} *</label>
                            </FloatLabel>
                            <Message v-if="authStore.errors?.[`users.${userIndex}.role`]?.[0]" severity="error" size="small">
                                {{ t(authStore.errors?.[`users.${userIndex}.role`]?.[0]!) }}
                            </Message>
                        </div>
                        <Button v-if="record.users.length > 1" icon="pi pi-trash" @click="removeUser(Number(userIndex))" severity="danger" text rounded size="small" class="mt-1" />
                    </div>
                </div>

                <!-- Row 2: Password / Confirm Password -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Password -->
                    <div>
                        <FloatLabel variant="on" class="w-full">
                            <IconField>
                                <InputIcon class="pi pi-lock" />
                                <Password
                                    :id="`user_password_${userIndex}`"
                                    v-model="user.password"
                                    :feedback="false"
                                    toggleMask
                                    class="w-full"
                                    inputClass="w-full"
                                    :invalid="authStore.errors?.[`users.${userIndex}.password`]?.[0] ? true : false"
                                    @input="() => authStore.clearErrors([`users.${userIndex}.password`])"
                                    @blur="() => onFieldBlur(userIndex, 'password')"
                                />
                            </IconField>
                            <label :for="`user_password_${userIndex}`">{{ t('account.staff.password') }} *</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors?.[`users.${userIndex}.password`]?.[0]" severity="error" size="small">
                            {{ t(authStore.errors?.[`users.${userIndex}.password`]?.[0]!) }}
                        </Message>
                    </div>

                    <!-- Confirm Password -->
                    <div>
                        <FloatLabel variant="on" class="w-full">
                            <IconField>
                                <InputIcon class="pi pi-shield" />
                                <Password
                                    :id="`user_password_confirmation_${userIndex}`"
                                    v-model="user.password_confirmation"
                                    :feedback="false"
                                    toggleMask
                                    class="w-full"
                                    inputClass="w-full"
                                    :invalid="authStore.errors?.[`users.${userIndex}.password_confirmation`]?.[0] ? true : false"
                                    @input="() => authStore.clearErrors([`users.${userIndex}.password_confirmation`])"
                                    @blur="() => onFieldBlur(userIndex, 'password_confirmation')"
                                />
                            </IconField>
                            <label :for="`user_password_confirmation_${userIndex}`">{{ t('account.staff.confirm_password') }} *</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors?.[`users.${userIndex}.password_confirmation`]?.[0]" severity="error" size="small">
                            {{ t(authStore.errors?.[`users.${userIndex}.password_confirmation`]?.[0]!) }}
                        </Message>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add another staff member -->
        <div class="flex flex-col items-center justify-center border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-xl py-6 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200" @click="addUser">
            <div class="w-10 h-10 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-2">
                <i class="pi pi-plus text-surface-400" />
            </div>
            <span class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ t('account.staff.add_staff_member') }}</span>
        </div>
    </div>
</template>
