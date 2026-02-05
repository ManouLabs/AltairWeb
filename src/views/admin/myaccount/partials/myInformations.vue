<script setup lang="ts">
import { useMyAccountService } from '@/services/useMyAccountService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import type { UpdateMyInformationData, UpdateMyInformationResponse } from '@/types/myaccount';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { z } from 'zod';

const authStore = useAuthStore();

const { t } = useI18n();
const { showToast } = useShowToast();
const loading = useLoading();
const isSubmitting = ref<boolean>(false);

const initialValues = reactive<UpdateMyInformationData>({
    name: authStore.user.name,
    email: authStore.user.email
});

const resolver = zodResolver(
    z.object({
        name: z
            .string()
            .max(255, { message: 'common.messages.max_length' })
            .min(1, { message: 'common.messages.is_required' })
            .regex(/^[A-Za-zÀ-ÿ\s'-]+$/, { message: 'common.messages.alpha_only' }),
        email: z.string().max(255, { message: 'common.messages.max_length' }).min(5, { message: 'common.messages.is_required' }).trim().email({ message: 'common.messages.invalid_email' })
    })
);

interface FormSubmitEvent {
    valid: boolean;
    values: UpdateMyInformationData;
}

const onFormSubmit = ({ valid, values }: FormSubmitEvent): void => {
    if (valid) {
        isSubmitting.value = true;
        loading.startPageLoading();
        useMyAccountService
            .updateMyInformation(values)
            .then((response: UpdateMyInformationResponse) => {
                authStore.user.name = response.user.name;
                authStore.user.email = response.user.email;
                showToast('success', ACTIONS.EDIT, 'my_informations', 'tc');
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
        <h2 class="text-xl font-bold">{{ t('myaccount.labels.change_informations') }}</h2>
        <span class="text-gray-400 block">{{ t('myaccount.labels.change_informations_description') }}</span>
        <Form :validateOnBlur="true" :initialValues="initialValues" :resolver="resolver" @submit="onFormSubmit" class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <FormField v-slot="$field" name="name" class="w-full">
                <FloatLabel variant="on" class="w-full">
                    <IconField class="w-full">
                        <InputIcon><i class="pi pi-user" /></InputIcon>
                        <InputText id="name" name="name" @input="() => authStore.clearErrors([$field.name])" v-bind="$field" class="w-full" :disabled="isSubmitting" />
                    </IconField>
                    <label for="name">{{ t('user.columns.name') }}</label>
                </FloatLabel>
                <Message v-if="$field.invalid || authStore.errors.name" severity="error" size="small">
                    {{ $field.error?.message ? t($field.error.message) : authStore.errors?.name?.[0] }}
                </Message>
            </FormField>
            <FormField v-slot="$field" name="email" class="w-full">
                <FloatLabel variant="on" class="w-full">
                    <IconField class="w-full">
                        <InputIcon><i class="pi pi-envelope" /></InputIcon>
                        <InputText id="email" name="email" type="email" v-bind="$field" @input="() => authStore.clearErrors([$field.name])" class="w-full" :autocomplete="false" :disabled="isSubmitting" />
                    </IconField>
                    <label for="email">{{ t('user.columns.email') }}</label>
                </FloatLabel>
                <Message v-if="$field.invalid || authStore.errors.email" severity="error" size="small">
                    {{ $field.error?.message ? t($field.error.message) : authStore.errors?.email?.[0] }}
                </Message>
            </FormField>

            <!-- Submit button (left aligned) -->
            <div class="col-span-1 md:col-span-2 flex justify-start pt-2">
                <Button :label="$t('common.labels.save')" icon="pi pi-check" type="submit" :loading="isSubmitting" :disabled="isSubmitting" />
            </div>
        </Form>
    </div>
</template>
