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
                <Message v-if="$field.invalid" severity="error" size="small">{{ $field.error?.message }}</Message>
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
                <Message v-if="$field.invalid" severity="error" size="small">{{ $field.error?.message }}</Message>
            </FormField>

            <!-- Phone -->
            <FormField v-slot="$field" name="phone" class="w-full">
                <FloatLabel variant="on" class="w-full">
                    <IconField class="w-full">
                        <InputIcon><i class="pi pi-phone" /></InputIcon>
                        <InputText id="phone" v-bind="$field" class="w-full" />
                    </IconField>
                    <label for="phone">{{ t('user.columns.phone') }}</label>
                </FloatLabel>
                <Message v-if="$field.invalid" severity="error" size="small">{{ $field.error?.message }}</Message>
            </FormField>

            <!-- Address -->
            <FormField v-slot="$field" name="address" class="w-full">
                <FloatLabel variant="on" class="w-full">
                    <IconField class="w-full">
                        <InputIcon><i class="pi pi-map-marker" /></InputIcon>
                        <InputText id="address" v-bind="$field" class="w-full" />
                    </IconField>
                    <label for="address">{{ t('user.columns.address') }}</label>
                </FloatLabel>
                <Message v-if="$field.invalid" severity="error" size="small">{{ $field.error?.message }}</Message>
            </FormField>

            <!-- Submit button (left aligned) -->
            <div class="col-span-1 md:col-span-2 flex justify-start pt-2">
                <Button :label="$t('common.labels.save')" icon="pi pi-check" type="submit" :loading="loading.isPageLoading" />
            </div>
        </Form>
    </div>
</template>

<script setup>
import { useLoading } from '@/stores/useLoadingStore';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { useToast } from 'primevue/usetoast';
import { defineProps, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { z } from 'zod';

const props = defineProps({
    user: Object
});
const user = props.user;
const { t } = useI18n();
const toast = useToast();
const loading = useLoading();
const initialValues = reactive({
    name: user.name,
    email: user.email,
    phone: user?.phone,
    address: user?.address
});

const resolver = zodResolver(
    z.object({
        name: z.string().min(1, { message: t('user.columns.name') + ' est requis.' }),
        email: z.string().email({ message: t('user.columns.email') + ' est invalide.' }),
        phone: z.string().min(1, { message: t('user.columns.phone') + ' est requis.' }),
        address: z.string().min(1, { message: t('user.columns.address') + ' est requise.' })
    })
);

const onFormSubmit = ({ valid, values }) => {
    if (valid) {
        toast.add({ severity: 'success', summary: '✔️ Données enregistrées', life: 3000 });
        console.log('📦 Submitted values:', values);
    }
};
</script>
