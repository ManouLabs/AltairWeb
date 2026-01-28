<script setup>
import { useShopService } from '@/services/useShopService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { shopSchema } from '@/validations/shop';
import { validate, validateField } from '@/validations/validate';
import { inject, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const authStore = useAuthStore();
const loading = useLoading();
const { showToast } = useShowToast();
const { t } = useI18n();

const record = ref({
    name: null,
    description: null,
    active: true,
    addresses: [{ street: '', region: null, city: null, main: true }],
    contactMethods: {
        phone: { type: 'phone', value: null },
        email: { type: 'email', value: null },
        whatsapp: { type: 'whatsapp', value: null },
        website: { type: 'website', value: null },
        linkedin: { type: 'linkedin', value: null },
        tiktok: { type: 'tiktok', value: null }
    },
    file: null,
    status: 'active'
});
const dialogRef = inject('dialogRef');
const action = ref();

const syncStatusFromActive = () => {
    if (!record.value) return;
    record.value.status = record.value.active ? 'active' : 'inactive';
};

const schema = shopSchema;

const validateForm = () => {
    const { ok, errors } = validate(schema, record.value);
    authStore.errors = ok ? {} : errors;
    return ok;
};

const onBlurField = (path) => {
    const { ok, errors } = validateField(schema, record.value, path);
    if (ok) authStore.clearErrors([path]);
    else authStore.errors = { ...authStore.errors, ...errors };
};

const onFormSubmit = () => {
    syncStatusFromActive();

    if (!validateForm()) return;
    loading.startPageLoading();

    const serviceAction = action.value === ACTIONS.CREATE ? useShopService.storeShop : (data) => useShopService.updateShop(record.value.id, data);

    serviceAction(record.value)
        .then((response) => {
            dialogRef.value.close({ record: response.data, action: action.value });
        })
        .catch((error) => {
            authStore.processError && authStore.processError(error, t('common.messages.error'));
            showToast('error', action.value, 'shop', 'tr');
        })
        .finally(() => {
            loading.stopPageLoading();
        });
};

const closeDialog = () => dialogRef.value.close();

onMounted(() => {
    const incoming = dialogRef.value.data.record || {};
    const incomingContacts = incoming.contactMethods || {};
    const normalizedContacts = { ...record.value.contactMethods };
    for (const key of Object.keys(normalizedContacts)) {
        const val = incomingContacts[key];
        if (val && typeof val === 'object' && (val.type || val.value)) {
            normalizedContacts[key] = { type: val.type ?? key, value: val.value ?? null };
        } else if (val || val === 0) {
            normalizedContacts[key] = { type: key, value: val };
        }
    }

    record.value = {
        ...record.value, // keeps defaults
        ...incoming,
        contactMethods: normalizedContacts
    };
    action.value = dialogRef.value.data.action;
    syncStatusFromActive();
});
</script>

<template>
    <form @submit.prevent="onFormSubmit" class="flex flex-col space-y-4">
        <div class="grid grid-cols-1 gap-4 pt-2">
            <div class="col-span-1">
                <FloatLabel variant="on" class="w-full">
                    <InputText
                        id="name"
                        v-model="record.name"
                        :disabled="loading.isPageLoading"
                        class="w-full"
                        maxlength="150"
                        :invalid="authStore.errors?.['name']?.[0] ? true : false"
                        @input="() => authStore.clearErrors(['name'])"
                        @blur="() => onBlurField('name')"
                        autofocus
                    />
                    <label for="name">{{ t('shop.columns.name') }} *</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['name']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['name']?.[0]) }}</Message>
            </div>

            <div class="col-span-1">
                <FloatLabel variant="on" class="w-full">
                    <Textarea
                        id="description"
                        v-model="record.description"
                        :disabled="loading.isPageLoading"
                        class="w-full"
                        maxlength="500"
                        rows="4"
                        :invalid="authStore.errors?.['description']?.[0] ? true : false"
                        @input="() => authStore.clearErrors(['description'])"
                        @blur="() => onBlurField('description')"
                    />
                    <label for="description">{{ t('shop.columns.description') }}</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['description']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['description']?.[0]) }}</Message>
            </div>
            <div class="col-span-1 border border-surface-200 dark:border-surface-700 rounded-lg p-6 bg-surface-0 dark:bg-surface-900">
                <h3 class="text-lg font-semibold mb-2">{{ t('contact.labels.contacts') }}</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FloatLabel variant="on" class="w-full">
                        <InputText
                            id="phone"
                            v-model="record.contactMethods.phone.value"
                            :disabled="loading.isPageLoading"
                            class="w-full"
                            maxlength="50"
                            :invalid="authStore.errors?.['contactMethods.phone']?.[0] ? true : false"
                            @input="() => authStore.clearErrors(['contactMethods.phone'])"
                            @blur="() => onBlurField('contactMethods.phone')"
                        />
                        <label for="phone">{{ t('shop.columns.phone') }}</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['contactMethods.phone']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['contactMethods.phone']?.[0]) }}</Message>

                    <FloatLabel variant="on" class="w-full">
                        <InputText
                            id="email"
                            v-model="record.contactMethods.email.value"
                            :disabled="loading.isPageLoading"
                            class="w-full"
                            maxlength="150"
                            :invalid="authStore.errors?.['contactMethods.email']?.[0] ? true : false"
                            @input="() => authStore.clearErrors(['contactMethods.email'])"
                            @blur="() => onBlurField('contactMethods.email')"
                        />
                        <label for="email">{{ t('shop.columns.email') }}</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['contactMethods.email']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['contactMethods.email']?.[0]) }}</Message>

                    <FloatLabel variant="on" class="w-full">
                        <InputText
                            id="whatsapp"
                            v-model="record.contactMethods.whatsapp.value"
                            :disabled="loading.isPageLoading"
                            class="w-full"
                            maxlength="50"
                            :invalid="authStore.errors?.['contactMethods.whatsapp']?.[0] ? true : false"
                            @input="() => authStore.clearErrors(['contactMethods.whatsapp'])"
                            @blur="() => onBlurField('contactMethods.whatsapp')"
                        />
                        <label for="whatsapp">{{ t('shop.columns.whatsapp') }}</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['contactMethods.whatsapp']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['contactMethods.whatsapp']?.[0]) }}</Message>
                </div>
            </div>
            <div class="col-span-1 border border-surface-200 dark:border-surface-700 rounded-lg p-6 bg-surface-0 dark:bg-surface-900">
                <h3 class="text-lg font-semibold mb-4">{{ t('common.labels.address') }} *</h3>
                <Address v-model="record.addresses" :disabled="loading.isPageLoading" :multiple="false" />
            </div>
            <div class="col-span-1 border border-surface-200 dark:border-surface-700 rounded-lg p-6 bg-surface-0 dark:bg-surface-900">
                <h3 class="text-lg font-semibold mb-4">{{ t('common.labels.online_presence') }}</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FloatLabel variant="on" class="w-full">
                        <InputText
                            id="website"
                            v-model="record.contactMethods.website.value"
                            :disabled="loading.isPageLoading"
                            class="w-full"
                            maxlength="250"
                            :invalid="authStore.errors?.['contactMethods.website']?.[0] ? true : false"
                            @input="() => authStore.clearErrors(['contactMethods.website'])"
                            @blur="() => onBlurField('contactMethods.website')"
                        />
                        <label for="website">{{ t('shop.columns.website') }}</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['contactMethods.website']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['contactMethods.website']?.[0]) }}</Message>

                    <FloatLabel variant="on" class="w-full">
                        <InputText
                            id="linkedin"
                            v-model="record.contactMethods.linkedin.value"
                            :disabled="loading.isPageLoading"
                            class="w-full"
                            maxlength="250"
                            :invalid="authStore.errors?.['contactMethods.linkedin']?.[0] ? true : false"
                            @input="() => authStore.clearErrors(['contactMethods.linkedin'])"
                            @blur="() => onBlurField('contactMethods.linkedin')"
                        />
                        <label for="linkedin">{{ t('shop.columns.linkedin') }}</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['contactMethods.linkedin']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['contactMethods.linkedin']?.[0]) }}</Message>

                    <FloatLabel variant="on" class="w-full">
                        <InputText
                            id="tiktok"
                            v-model="record.contactMethods.tiktok.value"
                            :disabled="loading.isPageLoading"
                            class="w-full"
                            maxlength="250"
                            :invalid="authStore.errors?.['contactMethods.tiktok']?.[0] ? true : false"
                            @input="() => authStore.clearErrors(['contactMethods.tiktok'])"
                            @blur="() => onBlurField('contactMethods.tiktok')"
                        />
                        <label for="tiktok">{{ t('shop.columns.tiktok') }}</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['contactMethods.tiktok']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['contactMethods.tiktok']?.[0]) }}</Message>
                </div>
            </div>
            <div class="col-span-1">
                <h3 class="text-lg font-semibold mb-2">{{ t('common.labels.logo') }}</h3>
                <FileUploadField
                    v-model="record.file"
                    :disabled="loading.isPageLoading"
                    :label="t('shop.columns.file')"
                    accept="image/*"
                    :multiple="false"
                    :maxFiles="1"
                    :maxFileSize="5000000"
                    :error="authStore.errors?.['file']?.[0] ? t(authStore.errors?.['file']?.[0]) : null"
                    @select="() => authStore.clearErrors(['file'])"
                />
            </div>

            <div class="col-span-1">
                <div class="flex items-center gap-3">
                    <ToggleSwitch id="active" v-model="record.active" :disabled="loading.isPageLoading" :class="{ 'p-invalid': authStore.errors?.active }" @change="() => (syncStatusFromActive(), onBlurField('active'))" />
                    <label for="active" class="font-medium">
                        {{ t('shop.columns.active') }}
                    </label>
                </div>
                <Message v-if="authStore.errors?.['active']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['active']?.[0]) }}</Message>
            </div>
        </div>

        <div class="flex justify-end gap-2 mt-4">
            <Button :label="t('common.labels.cancel')" icon="pi pi-times" text @click="closeDialog" />
            <Button :label="t('common.labels.save')" icon="pi pi-check" type="submit" :loading="loading.isPageLoading" />
        </div>
    </form>
</template>
