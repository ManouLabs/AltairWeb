<script setup>
import { useMyAccountService } from '@/services/useMyAccountService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { z } from 'zod';

const props = defineProps({
    user: Object
});

const authStore = useAuthStore();
const user = props.user;
const { t } = useI18n();
const { showToast } = useShowToast();
const loading = useLoading();
const initialValues = reactive({
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

const onFormSubmit = ({ valid, values }) => {
    if (valid) {
        loading.startDataLoading();
        useMyAccountService
            .updateMyInformation(user, values)
            .then((response) => {
                authStore.user.name = response.user.name;
                authStore.user.email = response.user.email;
                showToast('success', ACTIONS.EDIT, 'my_informations', 'br');
            })
            .catch((error) => {
                showToast('error', ACTIONS.EDIT, 'my_informations', 'tc');
            })
            .finally(() => {
                loading.stopDataLoading();
            });
    }
};
</script>
<template>
    <div class="px-0 py-10">
        <Form :initialValues="initialValues" :resolver="resolver" @submit="onFormSubmit" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Name -->
            <FormField v-slot="$field" name="name" class="w-full">
                <FloatLabel variant="on" class="w-full">
                    <IconField class="w-full">
                        <InputIcon><i class="pi pi-user" /></InputIcon>
                        <InputText id="name" v-bind="$field" class="w-full" />
                    </IconField>
                    <label for="name">{{ t('user.columns.name') }}</label>
                </FloatLabel>
                <Message v-if="$field.invalid" severity="error" size="small">{{ t($field.error?.message) }}</Message>
            </FormField>

            <!-- Email -->
            <FormField v-slot="$field" name="email" class="w-full">
                <FloatLabel variant="on" class="w-full">
                    <IconField class="w-full">
                        <InputIcon><i class="pi pi-envelope" /></InputIcon>
                        <InputText id="email" type="email" v-bind="$field" class="w-full" />
                    </IconField>
                    <label for="email">{{ t('user.columns.email') }}</label>
                </FloatLabel>
                <Message v-if="$field.invalid" severity="error" size="small">{{ t($field.error?.message) }}</Message>
            </FormField>

            <!-- Submit button (left aligned) -->
            <div class="col-span-1 md:col-span-2 flex justify-start pt-2">
                <Button :label="$t('common.labels.save')" icon="pi pi-check" type="submit" :loading="loading.isPageLoading" />
            </div>
        </Form>
    </div>
</template>
