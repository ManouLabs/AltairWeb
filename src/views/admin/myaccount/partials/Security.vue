<script setup lang="ts">
import { useMyAccountService } from '@/services/useMyAccountService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import type { UpdatePasswordData, UpdatePasswordResponse } from '@/types/myaccount';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { z } from 'zod';

const authStore = useAuthStore();

const { t } = useI18n();
const { showToast } = useShowToast();
const loading = useLoading();
const isSubmitting = ref<boolean>(false);

const initialValues = reactive<UpdatePasswordData>({
    current_password: '',
    password: '',
    password_confirmation: ''
});

const resolver = zodResolver(
    z
        .object({
            current_password: z
                .string()
                .min(8, { message: t('common.messages.minimum_length', { length: 8 }) })
                .max(255, { message: t('common.messages.max_length', { length: 255 }) })
                .regex(/[a-z]/, { message: 'common.messages.require_lowercase' })
                .regex(/[A-Z]/, { message: 'common.messages.require_uppercase' })
                .regex(/[0-9]/, { message: 'common.messages.require_numeric' })
                .nonempty({ message: 'common.messages.is_required' }),
            password: z
                .string()
                .min(8, { message: t('common.messages.minimum_length', { length: 8 }) })
                .max(255, { message: t('common.messages.max_length', { length: 255 }) })
                .regex(/[a-z]/, { message: 'common.messages.require_lowercase' })
                .regex(/[A-Z]/, { message: 'common.messages.require_uppercase' })
                .regex(/[0-9]/, { message: 'common.messages.require_numeric' })
                .nonempty({ message: 'common.messages.is_required' }),
            password_confirmation: z
                .string()
                .min(8, { message: t('common.messages.minimum_length', { length: 8 }) })
                .max(255, { message: t('common.messages.max_length', { length: 255 }) })
                .regex(/[a-z]/, { message: 'common.messages.require_lowercase' })
                .regex(/[A-Z]/, { message: 'common.messages.require_uppercase' })
                .regex(/[0-9]/, { message: 'common.messages.require_numeric' })
                .nonempty({ message: 'common.messages.is_required' })
        })
        .refine((data) => data.password === data.password_confirmation, {
            message: 'common.messages.passwords_do_not_match',
            path: ['password_confirmation']
        })
        .refine((data) => data.current_password !== data.password, {
            message: 'common.messages.current_and_new_password_same',
            path: ['password']
        })
);

interface FormSubmitEvent {
    valid: boolean;
    values: UpdatePasswordData;
}

const onFormSubmit = ({ valid, values }: FormSubmitEvent): void => {
    if (valid) {
        isSubmitting.value = true;
        loading.startPageLoading();
        useMyAccountService
            .updatePassword(values)
            .then((response: UpdatePasswordResponse) => {
                showToast('success', ACTIONS.EDIT, 'password', 'tc');
            })
            .catch((error: any) => {
                authStore.processError(error, t('common.messages.error_occurred'));
            })
            .finally(() => {
                isSubmitting.value = false;
                loading.stopPageLoading();
            });
    }
};
</script>
<template>
    <div class="px-0 py-5">
        <h2 class="text-xl font-bold">{{ t('myaccount.labels.change_password') }}</h2>
        <span class="text-gray-400">{{ t('myaccount.labels.change_password_description') }}</span>
        <Form :validateOnBlur="true" :initialValues="initialValues" :resolver="resolver" @submit="onFormSubmit" class="flex flex-col gap-2">
            <FormField v-slot="$field" name="current_password" class="w-full mt-6">
                <FloatLabel variant="on" class="w-full">
                    <IconField class="w-full">
                        <InputIcon class="pi pi-key" />
                        <Password id="current_password" name="current_password" v-bind="$field" @input="() => authStore.clearErrors([$field.name])" :toggleMask="true" class="mb-4" fluid :feedback="false" :disabled="isSubmitting" />
                    </IconField>
                    <label for="current_password">{{ t('user.columns.current_password') }}</label>
                </FloatLabel>
                <Message v-if="$field.invalid || authStore.errors.current_password" severity="error" size="small">
                    {{ $field.error?.message ? t($field.error.message) : authStore.errors?.current_password?.[0] }}
                </Message>
            </FormField>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField v-slot="$field" name="password" class="w-full">
                    <FloatLabel variant="on" class="w-full">
                        <IconField class="w-full">
                            <InputIcon class="pi pi-key" />
                            <Password
                                id="password"
                                name="password"
                                :pt="{ input: { autocomplete: 'new-password' } }"
                                v-bind="$field"
                                @input="() => authStore.clearErrors([$field.name])"
                                :toggleMask="true"
                                class="mb-4"
                                fluid
                                :feedback="true"
                                :disabled="isSubmitting"
                            >
                                <template #header>
                                    <div class="font-semibold text-xm mb-4">{{ $t('user.columns.new_password') }}</div>
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
                        </IconField>
                        <label for="password">{{ t('user.columns.new_password') }}</label>
                    </FloatLabel>
                    <Message v-if="$field.invalid || authStore.errors.password" severity="error" size="small">
                        {{ $field.error?.message ? t($field.error.message) : authStore.errors?.password?.[0] }}
                    </Message>
                </FormField>

                <FormField v-slot="$field" name="password_confirmation" class="w-full">
                    <FloatLabel variant="on" class="w-full">
                        <IconField class="w-full">
                            <InputIcon class="pi pi-key" />
                            <Password id="password_confirmation" name="password_confirmation" v-bind="$field" @input="() => authStore.clearErrors([$field.name])" :toggleMask="true" class="mb-4" fluid :feedback="false" :disabled="isSubmitting" />
                        </IconField>
                        <label for="password_confirmation">{{ t('user.columns.confirm_new_password') }}</label>
                    </FloatLabel>
                    <Message v-if="$field.invalid || authStore.errors.password_confirmation" severity="error" size="small">
                        {{ $field.error?.message ? t($field.error.message) : authStore.errors.password_confirmation?.[0] }}
                    </Message>
                </FormField>
            </div>
            <div class="col-span-1 md:col-span-2 flex justify-start">
                <Button :label="$t('myaccount.labels.change_password')" icon="pi pi-check" type="submit" :loading="isSubmitting" :disabled="isSubmitting" />
            </div>
        </Form>
    </div>
</template>
