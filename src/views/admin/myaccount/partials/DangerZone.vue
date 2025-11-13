<script setup>
import { useMyAccountService } from '@/services/useMyAccountService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { z } from 'zod';

const { t } = useI18n();
const loading = useLoading();
const visible = ref(false);
const authStore = useAuthStore();

const initialValues = reactive({
    email: '',
    confirmation_phrase: ''
});

const resolver = zodResolver(
    z.object({
        email: z
            .string()
            .trim()
            .email({ message: 'common.messages.invalid_email' })
            .refine((val) => val === authStore.user.email, { message: 'common.messages.invalid_email' }),
        confirmation_phrase: z.string().refine((val) => val === 'delete my account', { message: 'myaccount.messages.confirmation_phrase_incorrect' })
    })
);
const onFormSubmit = ({ valid, values }) => {
    if (valid) {
        loading.startDataLoading();
        useMyAccountService
            .deleteMyAccount(values)
            .then(() => {
                authStore.handleSessionExpired();
                showToast('success', 'delete', 'my_account', 'br');
            })
            .catch((error) => {
                authStore.processError(error, t('common.messages.error_occurred'));
            })
            .finally(() => {
                loading.stopDataLoading();
            });
    }
};
</script>
<template>
    <div class="px-0 py-5">
        <h2 class="text-xl font-bold text-center md:text-left">{{ t('myaccount.labels.danger_zone') }}</h2>
        <span class="text-gray-400 block text-center md:text-left">{{ t('myaccount.labels.danger_zone_description') }}</span>

        <div class="mt-6 flex justify-center md:justify-start items-center space-x-4">
            <p class="text-red-600 font-semibold">
                {{ t('myaccount.labels.delete_account_warning') }}
            </p>
            <Button :label="t('myaccount.labels.delete_account')" severity="danger" :loading="loading.isDataLoading" v-tooltip.top="t('myaccount.labels.delete_account_warning')" @click="visible = true" />
        </div>

        <Dialog v-model:visible="visible" modal header="Edit Profile" :style="{ width: '35rem' }">
            <template #header>
                <span class="font-bold"> {{ t('myaccount.labels.are_you_sure') }}</span>
            </template>
            <div class="flex flex-col justify-center md:justify-start space-y-4 py-2">
                <Message severity="error">{{ t('myaccount.labels.extremely_important') }}</Message>
                <p class="text-gray-600">
                    {{ t('myaccount.labels.delete_account_warning') }}
                </p>
                <Form :validateOnBlur="true" :initialValues="initialValues" :resolver="resolver" @submit="onFormSubmit" class="flex flex-col space-y-4">
                    <FormField v-slot="$field" name="email" class="w-full">
                        <FloatLabel variant="on" class="w-full">
                            <IconField class="w-full">
                                <InputIcon><i class="pi pi-envelope" /></InputIcon>
                                <InputText id="email" name="email" type="email" v-bind="$field" @input="() => authStore.clearErrors([$field.name])" class="w-full" :autocomplete="false" />
                            </IconField>
                            <label for="email">{{ t('user.columns.email') }}</label>
                        </FloatLabel>
                        <Message v-if="$field.invalid || authStore.errors.email" severity="error" size="small">
                            {{ $field.error?.message ? t($field.error.message) : authStore.errors?.email?.[0] }}
                        </Message>
                    </FormField>
                    <FormField v-slot="$field" name="confirmation_phrase" class="w-full">
                        <FloatLabel variant="on" class="w-full">
                            <IconField class="w-full">
                                <InputIcon><i class="pi pi-lock" /></InputIcon>
                                <InputText id="confirmation_phrase" name="confirmation_phrase" v-bind="$field" @input="() => authStore.clearErrors([$field.name])" class="w-full" />
                            </IconField>
                            <label for="confirmation_phrase">{{ t('myaccount.labels.confirmation_phrase_description', { confirmation_phrase: t('myaccount.labels.confirmation_phrase') }) }}</label>
                        </FloatLabel>
                        <Message v-if="$field.invalid || authStore.errors.confirmation_phrase" severity="error" size="small">
                            {{ $field.error?.message ? t($field.error.message) : authStore.errors?.confirmation_phrase?.[0] }}
                        </Message>
                    </FormField>

                    <!-- Submit button (left aligned) -->
                    <div class="col-span-1 md:col-span-2 flex justify-end pt-2">
                        <Button :label="t('myaccount.labels.delete_account')" icon="pi pi-check" type="submit" :loading="loading.isDataLoading" severity="danger" />
                    </div>
                </Form>
            </div>
        </Dialog>
    </div>
</template>
