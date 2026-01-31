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
        tiktok: { type: 'tiktok', value: null },
        facebook: { type: 'facebook', value: null },
        instagram: { type: 'instagram', value: null }
    },
    files: null
});
const dialogRef = inject('dialogRef');
const action = ref();

const syncStatusFromActive = () => {
    if (!record.value) return;
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

const prepareFormData = () => {
    const data = { ...record.value };

    // Extract actual File object for multipart/form-data upload
    if (data.files) {
        if (data.files instanceof File) {
            data.file = data.files;
        } else if (Array.isArray(data.files) && data.files.length > 0 && data.files[0] instanceof File) {
            data.file = data.files[0];
        }
    }
    delete data.files;

    return data;
};

const onFormSubmit = () => {
    syncStatusFromActive();

    if (!validateForm()) return;
    loading.startFormSending();

    const formData = prepareFormData();
    const serviceAction = action.value === ACTIONS.CREATE ? useShopService.storeShop : (data) => useShopService.updateShop(record.value.id, data);

    serviceAction(formData)
        .then((response) => {
            dialogRef.value.close({ record: response.data, action: action.value });
        })
        .catch((error) => {
            authStore.processError && authStore.processError(error, t('common.messages.error'));
            showToast('error', action.value, 'shop', 'tr');
        })
        .finally(() => {
            loading.stopFormSending();
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
                    <IconField>
                        <InputIcon class="pi pi-shop" />
                        <InputText
                            id="name"
                            v-model="record.name"
                            :disabled="loading.isFormSending"
                            class="w-full"
                            maxlength="150"
                            :invalid="authStore.errors?.['name']?.[0] ? true : false"
                            @input="() => authStore.clearErrors(['name'])"
                            @blur="() => onBlurField('name')"
                            autofocus
                        />
                    </IconField>
                    <label for="name">{{ t('shop.columns.name') }} *</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['name']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['name']?.[0]) }}</Message>
            </div>

            <div class="col-span-1">
                <FloatLabel variant="on" class="w-full">
                    <Textarea
                        id="description"
                        v-model="record.description"
                        :disabled="loading.isFormSending"
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
                    <div>
                        <FloatLabel variant="on" class="w-full">
                            <IconField>
                                <InputIcon class="pi pi-phone" />
                                <InputText
                                    id="phone"
                                    v-model="record.contactMethods.phone.value"
                                    :disabled="loading.isFormSending"
                                    class="w-full"
                                    maxlength="50"
                                    :invalid="authStore.errors?.['contactMethods.phone.value']?.[0] ? true : false"
                                    @input="() => authStore.clearErrors(['contactMethods.phone.value'])"
                                    @blur="() => onBlurField('contactMethods.phone.value')"
                                />
                            </IconField>
                            <label for="phone">{{ t('shop.columns.phone') }}</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors?.['contactMethods.phone.value']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['contactMethods.phone.value']?.[0]) }}</Message>
                    </div>
                    <div>
                        <FloatLabel variant="on" class="w-full">
                            <IconField>
                                <InputIcon class="pi pi-envelope" />
                                <InputText
                                    id="email"
                                    v-model="record.contactMethods.email.value"
                                    :disabled="loading.isFormSending"
                                    class="w-full"
                                    maxlength="150"
                                    :invalid="authStore.errors?.['contactMethods.email.value']?.[0] ? true : false"
                                    @input="() => authStore.clearErrors(['contactMethods.email.value'])"
                                    @blur="() => onBlurField('contactMethods.email.value')"
                                />
                            </IconField>
                            <label for="email">{{ t('shop.columns.email') }}</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors?.['contactMethods.email.value']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['contactMethods.email.value']?.[0]) }}</Message>
                    </div>
                    <div>
                        <FloatLabel variant="on" class="w-full">
                            <IconField>
                                <InputIcon class="pi pi-whatsapp" />
                                <InputText
                                    id="whatsapp"
                                    v-model="record.contactMethods.whatsapp.value"
                                    :disabled="loading.isFormSending"
                                    class="w-full"
                                    maxlength="50"
                                    :invalid="authStore.errors?.['contactMethods.whatsapp.value']?.[0] ? true : false"
                                    @input="() => authStore.clearErrors(['contactMethods.whatsapp.value'])"
                                    @blur="() => onBlurField('contactMethods.whatsapp.value')"
                                />
                            </IconField>
                            <label for="whatsapp">{{ t('shop.columns.whatsapp') }}</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors?.['contactMethods.whatsapp.value']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['contactMethods.whatsapp.value']?.[0]) }}</Message>
                    </div>
                </div>
            </div>
            <div class="col-span-1 border border-surface-200 dark:border-surface-700 rounded-lg p-6 bg-surface-0 dark:bg-surface-900">
                <h3 class="text-lg font-semibold mb-4">{{ t('common.labels.address') }}</h3>
                <Address v-model="record.addresses" :multiple="false" />
            </div>
            <div class="col-span-1 border border-surface-200 dark:border-surface-700 rounded-lg p-6 bg-surface-0 dark:bg-surface-900">
                <h3 class="text-lg font-semibold mb-4">{{ t('common.labels.online_presence') }}</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div v-for="key in ['website', 'facebook', 'instagram', 'linkedin', 'tiktok']" :key="key">
                        <FloatLabel variant="on" class="w-full">
                            <IconField>
                                <InputIcon
                                    :class="{
                                        'pi pi-globe': key === 'website',
                                        'pi pi-facebook': key === 'facebook',
                                        'pi pi-instagram': key === 'instagram',
                                        'pi pi-linkedin': key === 'linkedin',
                                        'pi pi-tiktok': key === 'tiktok'
                                    }"
                                />
                                <InputText
                                    :id="key"
                                    v-model="record.contactMethods[key].value"
                                    :disabled="loading.isFormSending"
                                    class="w-full"
                                    maxlength="250"
                                    :invalid="authStore.errors?.[`contactMethods.${key}.value`]?.[0] ? true : false"
                                    @input="() => authStore.clearErrors([`contactMethods.${key}.value`])"
                                    @blur="() => onBlurField(`contactMethods.${key}.value`)"
                                />
                            </IconField>
                            <label :for="key">{{ t(`shop.columns.${key}`) }}</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors?.[`contactMethods.${key}.value`]?.[0]" severity="error" size="small">{{ t(authStore.errors?.[`contactMethods.${key}.value`]?.[0]) }}</Message>
                    </div>
                </div>
            </div>
            <div class="col-span-1">
                <h3 class="text-lg font-semibold mb-2">{{ t('common.labels.logo') }}</h3>
                <FileUploadField
                    v-model="record.files"
                    :label="t('shop.columns.file')"
                    accept="image/*"
                    :multiple="false"
                    :maxFiles="1"
                    :maxFileSize="5000000"
                    :error="authStore.errors?.['files']?.[0] ? t(authStore.errors?.['files']?.[0]) : null"
                    @select="() => authStore.clearErrors(['files'])"
                />
            </div>

            <div class="col-span-1">
                <div class="flex items-center gap-3">
                    <ToggleSwitch id="active" v-model="record.active" :class="{ 'p-invalid': authStore.errors?.active }" @change="() => (syncStatusFromActive(), onBlurField('active'))" />
                    <label for="active" class="font-medium">
                        {{ t('shop.columns.active') }}
                    </label>
                </div>
                <Message v-if="authStore.errors?.['active']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['active']?.[0]) }}</Message>
            </div>
        </div>

        <div class="flex justify-end gap-2 mt-4">
            <Button :label="t('common.labels.cancel')" icon="pi pi-times" text @click="closeDialog" />
            <Button :label="t('common.labels.save')" icon="pi pi-check" type="submit" :loading="loading.isFormSending" />
        </div>
    </form>
</template>
