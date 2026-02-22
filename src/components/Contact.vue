<script setup>
import { useAuthStore } from '@/stores/useAuthStore';
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
    { value: 'email', label: t('contact.types.email'), icon: 'pi pi-envelope' },
    { value: 'landline', label: t('contact.types.landline'), icon: 'pi pi-phone' },
    { value: 'mobile', label: t('contact.types.mobile'), icon: 'pi pi-mobile' },
    { value: 'url', label: t('contact.types.url'), icon: 'pi pi-globe' }
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

const addContactMethod = (contactIndex, type) => {
    const newMethod = {
        contact_id: null,
        type: type,
        value: ''
    };
    localContacts.value[contactIndex].contactMethods.push(newMethod);
};

const removeContactMethod = (contactIndex, methodIndex) => {
    localContacts.value[contactIndex].contactMethods.splice(methodIndex, 1);
};

const getMethodIcon = (type) => {
    const option = contactMethodOptions.find((o) => o.value === type);
    return option ? option.icon : 'pi pi-info-circle';
};

// Popover toggling for "add method" type picker
const addMethodPopoverRefs = ref({});
const toggleAddMethodPopover = (contactIndex, event) => {
    const popover = addMethodPopoverRefs.value[contactIndex];
    if (popover) popover.toggle(event);
};

const onFieldBlur = (contactIndex, field) => {
    authStore.clearErrors([`contacts.${contactIndex}.${field}`]);
};

const onMethodFieldBlur = (contactIndex, methodIndex) => {
    authStore.clearErrors([`contacts.${contactIndex}.contactMethods.${methodIndex}.value`]);
};
</script>

<template>
    <div class="contacts-component">
        <div class="space-y-6">
            <!-- Contact cards -->
            <div v-for="(contact, contactIndex) in localContacts" :key="contactIndex" class="border border-surface-200 dark:border-surface-700 rounded-xl p-6 bg-surface-0 dark:bg-surface-900">
                <!-- Contact details: Civility / First Name / Last Name -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                    <!-- Civility -->
                    <div>
                        <FloatLabel variant="on" class="w-full">
                            <Select
                                :id="`civility_${contactIndex}`"
                                v-model="contact.civility"
                                :disabled="disabled"
                                :options="civilityOptions"
                                optionValue="value"
                                optionLabel="label"
                                class="w-full"
                                :invalid="authStore.errors?.[`contacts.${contactIndex}.civility`]?.[0] ? true : false"
                                @change="() => authStore.clearErrors([`contacts.${contactIndex}.civility`])"
                                @blur="() => onFieldBlur(contactIndex, 'civility')"
                            />
                            <label :for="`civility_${contactIndex}`">{{ t('contact.labels.civility') }} *</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors?.[`contacts.${contactIndex}.civility`]?.[0]" severity="error" size="small">
                            {{ t(authStore.errors?.[`contacts.${contactIndex}.civility`]?.[0]) }}
                        </Message>
                    </div>

                    <!-- First Name -->
                    <div>
                        <FloatLabel variant="on" class="w-full">
                            <InputText
                                :id="`firstName_${contactIndex}`"
                                v-model="contact.first_name"
                                class="w-full"
                                :invalid="authStore.errors?.[`contacts.${contactIndex}.first_name`]?.[0] ? true : false"
                                :disabled="disabled"
                                @input="() => authStore.clearErrors([`contacts.${contactIndex}.first_name`])"
                                @blur="() => onFieldBlur(contactIndex, 'first_name')"
                            />
                            <label :for="`firstName_${contactIndex}`">{{ t('contact.labels.first_name') }} *</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors?.[`contacts.${contactIndex}.first_name`]?.[0]" severity="error" size="small">
                            {{ t(authStore.errors?.[`contacts.${contactIndex}.first_name`]?.[0]) }}
                        </Message>
                    </div>

                    <!-- Last Name + Delete button -->
                    <div class="flex gap-2">
                        <div class="flex-1">
                            <FloatLabel variant="on" class="w-full">
                                <InputText
                                    :id="`lastName_${contactIndex}`"
                                    v-model="contact.last_name"
                                    class="w-full"
                                    :disabled="disabled"
                                    :invalid="authStore.errors?.[`contacts.${contactIndex}.last_name`]?.[0] ? true : false"
                                    @input="() => authStore.clearErrors([`contacts.${contactIndex}.last_name`])"
                                    @blur="() => onFieldBlur(contactIndex, 'last_name')"
                                />
                                <label :for="`lastName_${contactIndex}`">{{ t('contact.labels.last_name') }} *</label>
                            </FloatLabel>
                            <Message v-if="authStore.errors?.[`contacts.${contactIndex}.last_name`]?.[0]" severity="error" size="small">
                                {{ t(authStore.errors?.[`contacts.${contactIndex}.last_name`]?.[0]) }}
                            </Message>
                        </div>
                        <Button v-if="localContacts.length > 1" icon="pi pi-trash" @click="removeContact(contactIndex)" severity="danger" text rounded size="small" class="mt-1" :title="t('contact.buttons.remove_contact')" />
                    </div>
                </div>

                <!-- Contact Methods section -->
                <div class="border border-surface-200 dark:border-surface-700 rounded-xl p-4 bg-surface-50 dark:bg-surface-800">
                    <span class="text-[11px] font-bold text-surface-400 uppercase tracking-wider">{{ t('contact.labels.contact_methods') }}</span>

                    <!-- Methods chips + inline add pill -->
                    <div class="flex flex-wrap items-center gap-2 mt-3">
                        <!-- Existing method chips (FloatLabel + IconField inside chip) -->
                        <div
                            v-for="(contactMethod, methodIndex) in contact.contactMethods"
                            :key="methodIndex"
                            class="flex items-center gap-1 bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-md pl-1 pr-2 py-0.5"
                        >
                            <FloatLabel variant="on">
                                <IconField>
                                    <InputIcon :class="getMethodIcon(contactMethod.type)" />
                                    <InputText
                                        :id="`method_${contactIndex}_${methodIndex}`"
                                        v-model="contactMethod.value"
                                        :disabled="disabled"
                                        class="border-0 bg-transparent shadow-none text-sm w-44 dark:!bg-transparent"
                                        :invalid="authStore.errors?.[`contacts.${contactIndex}.contactMethods.${methodIndex}.value`]?.[0] ? true : false"
                                        @input="() => authStore.clearErrors([`contacts.${contactIndex}.contactMethods.${methodIndex}.value`])"
                                        @blur="() => onMethodFieldBlur(contactIndex, methodIndex)"
                                    />
                                </IconField>
                                <label :for="`method_${contactIndex}_${methodIndex}`">{{ contactMethodOptions.find((o) => o.value === contactMethod.type)?.label || contactMethod.type }}</label>
                            </FloatLabel>
                            <button v-if="contact.contactMethods.length > 1" class="text-surface-400 hover:text-red-500 transition-colors cursor-pointer" @click="removeContactMethod(contactIndex, methodIndex)">
                                <i class="pi pi-times text-xs" />
                            </button>
                        </div>

                        <!-- Inline add pill (same size as chips) -->
                        <div
                            class="flex items-center gap-1.5 border border-dashed border-surface-300 dark:border-surface-600 rounded-md px-3 py-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200"
                            @click="(e) => toggleAddMethodPopover(contactIndex, e)"
                        >
                            <i class="pi pi-plus text-xs text-primary" />
                            <span class="text-xs font-semibold text-primary uppercase tracking-wider">{{ t('contact.buttons.add_contact_method') }}</span>
                        </div>

                        <!-- Popover type picker -->
                        <Popover :ref="(el) => (addMethodPopoverRefs[contactIndex] = el)">
                            <div class="flex flex-col gap-1 p-1 min-w-[140px]">
                                <div
                                    v-for="opt in contactMethodOptions"
                                    :key="opt.value"
                                    class="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                                    @click="
                                        addContactMethod(contactIndex, opt.value);
                                        toggleAddMethodPopover(contactIndex, $event);
                                    "
                                >
                                    <i :class="opt.icon" class="text-sm text-primary" />
                                    <span class="text-sm text-surface-700 dark:text-surface-200">{{ opt.label }}</span>
                                </div>
                            </div>
                        </Popover>
                    </div>

                    <!-- Validation errors for methods -->
                    <template v-for="(contactMethod, methodIndex) in contact.contactMethods" :key="`err_${methodIndex}`">
                        <Message v-if="authStore.errors?.[`contacts.${contactIndex}.contactMethods.${methodIndex}.value`]?.[0]" severity="error" size="small" class="mt-2">
                            {{ t(authStore.errors?.[`contacts.${contactIndex}.contactMethods.${methodIndex}.value`]?.[0]) }}
                        </Message>
                    </template>
                </div>
            </div>
        </div>

        <!-- Add another contact -->
        <div
            class="mt-6 flex flex-col items-center justify-center border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-xl py-6 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200"
            @click="addContact"
        >
            <div class="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
                <i class="pi pi-user-plus text-lg text-surface-400" />
            </div>
            <span class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ t('contact.buttons.add_contact') }}</span>
            <span class="text-xs text-surface-400 uppercase tracking-wider mt-1">{{ t('contact.labels.add_contact_hint') }}</span>
        </div>
    </div>
</template>
