<script setup lang="ts">
import { useCustomerService } from '@/services/useCustomerService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { customerSchema } from '@/validations/customer';
import { validate, validateField } from '@/validations/validate';
import type { CustomerData, CustomerFormData, Address, ContactMethods } from '@/types/customer';
import { inject, onMounted, ref, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';

interface DialogData {
    record: CustomerData | CustomerFormData;
    action: string;
    regions?: any[];
}

interface DialogRef {
    value: {
        data: DialogData;
        close: (result?: { record: CustomerData; action: string }) => void;
    };
}

const authStore = useAuthStore();
const loading = useLoading();
const { showToast } = useShowToast();
const { t } = useI18n();

const record: Ref<CustomerFormData> = ref({
    name: null,
    status: 'active',
    blocking_reason: null,
    addresses: [{ street: '', region: null, city: null, main: true }],
    contactMethods: {
        phone: { type: 'phone', value: null } as { type: string; value: string | null },
        email: { type: 'email', value: null } as { type: string; value: string | null }
    }
});
const dialogRef = inject<DialogRef>('dialogRef');
const action = ref<string>('');
// Initialize regions directly from dialog data (before template renders)
const regions = ref<any[]>(dialogRef?.value?.data?.regions || []);

const isBlocked = ref(false);

const schema = customerSchema;

const validateForm = (): boolean => {
    const { ok, errors } = validate(schema, record.value);
    authStore.errors = ok ? {} : errors;
    return ok;
};

const onBlurField = (path: string): void => {
    const { ok, errors } = validateField(schema, record.value, path);
    if (ok) authStore.clearErrors([path]);
    else authStore.errors = { ...authStore.errors, ...errors };
};

interface PreparedFormData extends Partial<CustomerFormData> {
    addresses?: Address[];
    contactMethods?: any;
}

const prepareFormData = (): PreparedFormData => {
    const data: PreparedFormData = { ...record.value };

    // Normalize addresses: extract IDs from region/city objects
    if (Array.isArray(data.addresses)) {
        data.addresses = data.addresses.map((addr: Address) => ({
            ...addr,
            region: addr.region && typeof addr.region === 'object' ? addr.region.id : addr.region,
            city: addr.city && typeof addr.city === 'object' ? addr.city.id : addr.city
        }));
    }

    // Filter out contact methods with null/empty values to prevent NOT NULL violations
    if (data.contactMethods && typeof data.contactMethods === 'object') {
        const filteredContacts: Record<string, any> = {};
        for (const [key, contact] of Object.entries(data.contactMethods)) {
            // Only include contact methods that have a non-null, non-empty value
            if (contact && typeof contact === 'object' && 'value' in contact) {
                const value = (contact as { value: string | null }).value;
                if (value !== null && value !== undefined && value !== '') {
                    filteredContacts[key] = contact;
                }
            }
        }
        data.contactMethods = filteredContacts;
    }

    // Handle blocking status
    if (isBlocked.value) {
        data.status = 'blocked';
    } else {
        data.status = 'active';
        data.blocking_reason = null;
    }

    return data;
};

const onFormSubmit = (): void => {
    // Validate blocking reason when blocked
    if (isBlocked.value && (!record.value.blocking_reason || record.value.blocking_reason.length < 10)) {
        authStore.errors = {
            ...authStore.errors,
            blocking_reason: ['customer.labels.blocking_reason_min']
        };
        return;
    }

    if (!validateForm()) return;
    loading.startFormSending();

    const formData = prepareFormData();
    const serviceAction = action.value === ACTIONS.CREATE ? useCustomerService.storeCustomer : (data: Partial<CustomerFormData>) => useCustomerService.updateCustomer((record.value as CustomerFormData & { id: number }).id, data);

    serviceAction(formData as CustomerFormData)
        .then((response) => {
            dialogRef?.value.close({ record: response.data, action: action.value });
        })
        .catch((error: any) => {
            authStore.processError && authStore.processError(error, t('common.messages.error'));
            showToast('error', action.value, 'customer', 'tr');
        })
        .finally(() => {
            loading.stopFormSending();
        });
};

const closeDialog = (): void => dialogRef?.value.close();

interface ContactMethodInput {
    id?: number;
    type?: string;
    value?: string | null;
}

onMounted(() => {
    if (!dialogRef?.value) return;

    const incoming = dialogRef.value.data.record || ({} as CustomerFormData);

    // Transform array to keyed object if needed (backend returns array, form expects object)
    let incomingContacts: any = (incoming as CustomerData).contactMethods || {};
    if (Array.isArray(incomingContacts)) {
        const contactObj: Record<string, ContactMethodInput> = {};
        for (const contact of incomingContacts) {
            if (contact.type) {
                contactObj[contact.type] = contact;
            }
        }
        incomingContacts = contactObj;
    }

    const normalizedContacts = { ...record.value.contactMethods } as Record<string, ContactMethodInput>;
    for (const key of Object.keys(normalizedContacts)) {
        const val = incomingContacts[key];
        if (val && typeof val === 'object' && (val.type || val.value)) {
            normalizedContacts[key] = { id: val.id, type: val.type ?? key, value: val.value ?? null };
        } else if (val || val === 0) {
            normalizedContacts[key] = { type: key, value: val };
        }
    }

    // Pass addresses as-is - Address component will normalize and extract cities from region
    const normalizedAddresses = Array.isArray(incoming.addresses) && incoming.addresses.length > 0 ? incoming.addresses : record.value.addresses;

    record.value = {
        ...record.value, // keeps defaults
        ...incoming,
        addresses: normalizedAddresses,
        contactMethods: normalizedContacts as ContactMethods
    };

    // Set blocked state from incoming status
    isBlocked.value = (incoming as CustomerData).status === 'blocked';

    action.value = dialogRef.value.data.action;
    // Regions are already initialized from dialogRef.value.data.regions
});
</script>

<template>
    <form @submit.prevent="onFormSubmit" class="flex flex-col space-y-4">
        <div class="grid grid-cols-1 gap-4 pt-2">
            <div class="col-span-1">
                <FloatLabel variant="on" class="w-full">
                    <IconField>
                        <InputIcon class="pi pi-user" />
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
                    <label for="name">{{ t('customer.columns.name') }} *</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['name']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['name']?.[0]) }}</Message>
            </div>

            <div class="col-span-1 border border-surface-200 dark:border-surface-700 rounded-lg p-6 bg-surface-0 dark:bg-surface-900">
                <h3 class="text-lg font-semibold mb-2">{{ t('contact.labels.contacts') }}</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <FloatLabel variant="on" class="w-full">
                            <IconField>
                                <InputIcon class="pi pi-phone" />
                                <InputText
                                    id="phone"
                                    v-model="record.contactMethods.phone!.value"
                                    :disabled="loading.isFormSending"
                                    class="w-full"
                                    maxlength="50"
                                    :invalid="authStore.errors?.['contactMethods.phone.value']?.[0] ? true : false"
                                    @input="() => authStore.clearErrors(['contactMethods.phone.value'])"
                                    @blur="() => onBlurField('contactMethods.phone.value')"
                                />
                            </IconField>
                            <label for="phone">{{ t('customer.columns.phone') }} *</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors?.['contactMethods.phone.value']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['contactMethods.phone.value']?.[0]) }}</Message>
                    </div>
                    <div>
                        <FloatLabel variant="on" class="w-full">
                            <IconField>
                                <InputIcon class="pi pi-envelope" />
                                <InputText
                                    id="email"
                                    v-model="record.contactMethods.email!.value"
                                    :disabled="loading.isFormSending"
                                    class="w-full"
                                    maxlength="150"
                                    :invalid="authStore.errors?.['contactMethods.email.value']?.[0] ? true : false"
                                    @input="() => authStore.clearErrors(['contactMethods.email.value'])"
                                    @blur="() => onBlurField('contactMethods.email.value')"
                                />
                            </IconField>
                            <label for="email">{{ t('customer.columns.email') }}</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors?.['contactMethods.email.value']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['contactMethods.email.value']?.[0]) }}</Message>
                    </div>
                </div>
            </div>
            <div class="col-span-1 border border-surface-200 dark:border-surface-700 rounded-lg p-6 bg-surface-0 dark:bg-surface-900">
                <h3 class="text-lg font-semibold mb-4">{{ t('common.labels.address') }}</h3>
                <Address v-model="record.addresses" :multiple="false" :regions="regions" />
            </div>

            <!-- Blocking Section -->
            <div class="col-span-1 border border-surface-200 dark:border-surface-700 rounded-lg p-6 bg-surface-0 dark:bg-surface-900">
                <div class="flex items-center gap-3 mb-3">
                    <ToggleSwitch id="blocked" v-model="isBlocked" :disabled="loading.isFormSending" />
                    <label for="blocked" class="font-medium">{{ t('customer.labels.block_customer') }}</label>
                </div>

                <transition name="fade">
                    <div v-if="isBlocked" class="space-y-3">
                        <Message severity="warn" :closable="false">
                            <i class="pi pi-exclamation-triangle mr-2"></i>
                            {{ t('customer.labels.block_warning') }}
                        </Message>
                        <FloatLabel variant="on" class="w-full">
                            <Textarea
                                id="blocking_reason"
                                v-model="record.blocking_reason"
                                :disabled="loading.isFormSending"
                                class="w-full"
                                maxlength="500"
                                rows="3"
                                :invalid="authStore.errors?.['blocking_reason']?.[0] ? true : false"
                                @input="() => authStore.clearErrors(['blocking_reason'])"
                                @blur="() => onBlurField('blocking_reason')"
                            />
                            <label for="blocking_reason">{{ t('customer.columns.blocking_reason') }} *</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors?.['blocking_reason']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['blocking_reason']?.[0]) }}</Message>
                    </div>
                </transition>
            </div>
        </div>

        <div class="flex justify-end gap-2 mt-4">
            <Button :label="t('common.labels.cancel')" icon="pi pi-times" text @click="closeDialog" />
            <Button :label="t('common.labels.save')" icon="pi pi-check" type="submit" :loading="loading.isFormSending" />
        </div>
    </form>
</template>
