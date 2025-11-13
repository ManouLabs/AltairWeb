<script setup>
import { useAuthStore } from '@/stores/useAuthStore';
import { customerSchema } from '@/validations/customer';
import { validateField } from '@/validations/validate';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const authStore = useAuthStore();
const props = defineProps({
    modelValue: {
        type: Array,
        default: () => []
    },
    disabled: {
        type: Boolean,
        default: false
    }
});
const emit = defineEmits(['update:modelValue', 'change']);

// Contact method types based on API enum
const contactMethodOptions = [
    { value: 'email', label: t('contact.types.email'), icon: 'pi-envelope', validation: 'email' },
    { value: 'landline', label: t('contact.types.landline'), icon: 'pi-phone', validation: 'landline' },
    { value: 'mobile', label: t('contact.types.mobile'), icon: 'pi-mobile', validation: 'mobile' },
    { value: 'url', label: t('contact.types.url'), icon: 'pi-globe', validation: 'url' }
];

// Civility options
const civilityOptions = [
    { value: 'Mr', label: t('contact.civility.mr') },
    { value: 'Mrs', label: t('contact.civility.mrs') },
    { value: 'Ms', label: t('contact.civility.ms') },
    { value: 'Dr', label: t('contact.civility.dr') }
];

// Local reactive data
const localContacts = ref([]);

// Safe clone helper (avoid structuredClone on reactive/proxy values)
const clone = (v) => JSON.parse(JSON.stringify(v ?? []));

// Sync from parent when modelValue reference changes (no deep)
watch(
    () => props.modelValue,
    (newValue) => {
        localContacts.value = Array.isArray(newValue) ? clone(newValue) : [];
    },
    { immediate: true }
);

// Watch local changes and emit
watch(
    localContacts,
    (newValue) => {
        const payload = clone(newValue);
        // Avoid redundant emit if nothing effectively changed vs prop
        const sameAsProp = JSON.stringify(payload) === JSON.stringify(props.modelValue ?? []);
        if (sameAsProp) return;
        emit('update:modelValue', payload);
        emit('change', payload);
    },
    { deep: true }
);

// Helper function to create a new contact
function createNewContact() {
    return {
        civility: null,
        first_name: '',
        last_name: '',
        contactMethods: [{ contact_id: null, type: 'mobile', value: '' }]
    };
}

// Methods
const addContact = () => {
    localContacts.value.push(createNewContact());
};

const removeContact = (index) => {
    if (localContacts.value.length > 1) {
        localContacts.value.splice(index, 1);
    }
};

const addContactMethod = (contactIndex) => {
    const newMethod = {
        contact_id: null,
        type: 'email',
        value: ''
    };
    localContacts.value[contactIndex].contactMethods.push(newMethod);
};

const removeContactMethod = (contactIndex, methodIndex) => {
    localContacts.value[contactIndex].contactMethods.splice(methodIndex, 1);
};

// Field-level validation on blur for contact fields (civility, first_name, last_name)
const validateContactField = (contactIndex, fieldKey) => {
    const fieldPath = `contacts.${contactIndex}.${fieldKey}`;
    const data = { contacts: localContacts.value };
    const { ok, errors } = validateField(customerSchema, data, fieldPath);
    if (ok) {
        authStore.clearErrors([fieldPath]);
    } else {
        authStore.errors = { ...authStore.errors, ...errors };
    }
};

// Field-level validation on blur for contact method value
const validateContactMethodValue = (contactIndex, methodIndex) => {
    const fieldPath = `contacts.${contactIndex}.contactMethods.${methodIndex}.value`;
    const data = { contacts: localContacts.value };
    const { ok, errors } = validateField(customerSchema, data, fieldPath);
    if (ok) {
        authStore.clearErrors([fieldPath]);
    } else {
        authStore.errors = { ...authStore.errors, ...errors };
    }
};
</script>

<template>
    <div class="contacts-component">
        <!-- Add Contact Button -->
        <div class="flex justify-end mb-6">
            <Button icon="pi pi-plus" :label="t('contact.buttons.add_contact')" @click="addContact" outlined />
        </div>

        <!-- Contacts List -->
        <div class="space-y-6">
            <div v-for="(contact, contactIndex) in localContacts" :key="contactIndex" class="contact-card border border-surface-200 dark:border-surface-700 rounded-lg p-6 bg-surface-0 dark:bg-surface-900 shadow-sm">
                <!-- Remove Contact Button (for contacts beyond the first) -->
                <div v-if="localContacts.length > 1" class="flex justify-end mb-4">
                    <Button icon="pi pi-trash" @click="removeContact(contactIndex)" severity="danger" size="small" outlined :title="t('contact.buttons.remove_contact')" />
                </div>

                <!-- Contact Details -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <!-- Civility -->
                    <div class="flex flex-col">
                        <FloatLabel variant="on">
                            <Select
                                :id="`civility_${contactIndex}`"
                                v-model="contact.civility"
                                :disabled="disabled"
                                :options="civilityOptions"
                                optionValue="value"
                                optionLabel="label"
                                class="w-full"
                                :placeholder="t('contact.labels.civility')"
                                :invalid="authStore.errors?.[`contacts.${contactIndex}.civility`]?.[0] ? true : false"
                                @input="() => authStore.clearErrors([`contacts.${contactIndex}.civility`])"
                                @blur="() => validateContactField(contactIndex, 'civility')"
                            />
                            <label :for="`civility_${contactIndex}`">{{ t('contact.labels.civility') }} *</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors?.[`contacts.${contactIndex}.civility`]?.[0]" severity="error" size="small">
                            {{ t(authStore.errors?.[`contacts.${contactIndex}.civility`]?.[0]) }}
                        </Message>
                    </div>

                    <!-- First Name -->
                    <div class="flex flex-col">
                        <FloatLabel variant="on">
                            <InputText
                                :id="`firstName_${contactIndex}`"
                                v-model="contact.first_name"
                                class="w-full"
                                :invalid="authStore.errors?.[`contacts.${contactIndex}.first_name`]?.[0] ? true : false"
                                :disabled="disabled"
                                @input="() => authStore.clearErrors([`contacts.${contactIndex}.first_name`])"
                                @blur="() => validateContactField(contactIndex, 'first_name')"
                            />
                            <label :for="`firstName_${contactIndex}`">{{ t('contact.labels.first_name') }} *</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors?.[`contacts.${contactIndex}.first_name`]?.[0]" severity="error" size="small">
                            {{ t(authStore.errors?.[`contacts.${contactIndex}.first_name`]?.[0]) }}
                        </Message>
                    </div>

                    <!-- Last Name -->
                    <div class="flex flex-col">
                        <FloatLabel variant="on">
                            <InputText
                                :id="`lastName_${contactIndex}`"
                                v-model="contact.last_name"
                                class="w-full"
                                :disabled="disabled"
                                :invalid="authStore.errors?.[`contacts.${contactIndex}.last_name`]?.[0] ? true : false"
                                @input="() => authStore.clearErrors([`contacts.${contactIndex}.last_name`])"
                                @blur="() => validateContactField(contactIndex, 'last_name')"
                            />
                            <label :for="`lastName_${contactIndex}`">{{ t('contact.labels.last_name') }} *</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors?.[`contacts.${contactIndex}.last_name`]?.[0]" severity="error" size="small">
                            {{ t(authStore.errors?.[`contacts.${contactIndex}.last_name`]?.[0]) }}
                        </Message>
                    </div>
                </div>

                <!-- Contact Methods Section -->
                <div class="contact-methods">
                    <div class="flex justify-between items-center mb-4">
                        <Button icon="pi pi-plus" :label="t('contact.buttons.add_contact_method')" @click="addContactMethod(contactIndex)" size="small" outlined />
                    </div>

                    <div v-if="contact.contactMethods.length === 0" class="text-muted-color text-center py-4">
                        {{ t('contact.messages.no_contact_methods') }}
                    </div>

                    <Fieldset :legend="t('contact.labels.contact_methods')" class="mb-4 p-4 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
                        <div v-if="contact.contactMethods.length > 0" class="space-y-3">
                            <div v-for="(contactMethod, methodIndex) in contact.contactMethods" :key="methodIndex">
                                <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                                    <!-- Contact Type -->
                                    <div class="md:col-span-3">
                                        <div class="flex flex-col">
                                            <FloatLabel variant="on">
                                                <Select
                                                    :id="`contact_method_type_${contactIndex}_${methodIndex}`"
                                                    v-model="contactMethod.type"
                                                    :disabled="disabled"
                                                    :options="contactMethodOptions"
                                                    optionValue="value"
                                                    optionLabel="label"
                                                    class="w-full"
                                                    :invalid="authStore.errors?.[`contacts.${contactIndex}.contactMethods.${methodIndex}.type`]?.[0] ? true : false"
                                                    @input="() => authStore.clearErrors([`contacts.${contactIndex}.contactMethods.${methodIndex}.type`])"
                                                    @blur="() => validateContactMethodValue(contactIndex, methodIndex)"
                                                />
                                                <label :for="`contact_method_type_${contactIndex}_${methodIndex}`">{{ t('contact.labels.type') }} *</label>
                                            </FloatLabel>
                                            <Message v-if="authStore.errors?.[`contacts.${contactIndex}.contactMethods.${methodIndex}.type`]?.[0]" severity="error" size="small">
                                                {{ t(authStore.errors?.[`contacts.${contactIndex}.contactMethods.${methodIndex}.type`]?.[0]) }}
                                            </Message>
                                        </div>
                                    </div>

                                    <!-- Contact Value -->
                                    <div class="md:col-span-7">
                                        <div class="flex flex-col">
                                            <FloatLabel variant="on">
                                                <InputText
                                                    :id="`contact_method_value_${contactIndex}_${methodIndex}`"
                                                    v-model="contactMethod.value"
                                                    :disabled="disabled"
                                                    :placeholder="t(`contact.placeholders.${contactMethod.type}`)"
                                                    class="w-full"
                                                    :invalid="authStore.errors?.[`contacts.${contactIndex}.contactMethods.${methodIndex}.value`]?.[0] ? true : false"
                                                    @input="() => authStore.clearErrors([`contacts.${contactIndex}.contactMethods.${methodIndex}.value`])"
                                                    @blur="() => validateContactMethodValue(contactIndex, methodIndex)"
                                                />
                                            </FloatLabel>
                                            <Message v-if="authStore.errors?.[`contacts.${contactIndex}.contactMethods.${methodIndex}.value`]?.[0]" severity="error" size="small">
                                                {{ t(authStore.errors?.[`contacts.${contactIndex}.contactMethods.${methodIndex}.value`]?.[0]) }}
                                            </Message>
                                        </div>
                                    </div>

                                    <!-- Remove Button -->
                                    <div class="md:col-span-2 flex items-center justify-center">
                                        <Button icon="pi pi-trash" @click="removeContactMethod(contactIndex, methodIndex)" severity="danger" size="small" outlined :title="t('contact.buttons.remove')" v-if="contact.contactMethods.length > 1" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-muted-color text-center py-4">
                            {{ t('contact.messages.no_contact_methods') }}
                        </div>
                    </Fieldset>
                </div>
            </div>
        </div>
    </div>
</template>
