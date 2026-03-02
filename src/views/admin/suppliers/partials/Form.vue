<script setup lang="ts">
import { useRegionService } from '@/services/useRegionService';
import { useSupplierService } from '@/services/useSupplierService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { supplierSchema } from '@/validations/supplier';
import { validate, validateField } from '@/validations/validate';
import type { SupplierData } from '@/types/supplier';
import type { Region } from '@/types/region';
import { inject, onMounted, ref } from 'vue';
import type { Ref } from 'vue';
import { useI18n } from 'vue-i18n';

interface DialogData {
    record: SupplierData | any;
    action: string;
}

interface DialogRef {
    value: {
        data: DialogData;
        close: (result?: { record: SupplierData; action: string }) => void;
    };
}

const authStore = useAuthStore();
const loading = useLoading();
const { showToast } = useShowToast();
const { t } = useI18n();

const dialogRef = inject<DialogRef>('dialogRef');
const action = ref<string>('');
const regions = ref<Region[]>([]);
const schema = supplierSchema;

const contactMethodOptions = [
    { value: 'phone', label: t('contact.types.phone'), icon: 'pi pi-phone' },
    { value: 'email', label: t('contact.types.email'), icon: 'pi pi-envelope' }
];

// Supplier type options with icons
const supplierTypes = [
    { label: t('supplier.types.manufacturer'), value: 'manufacturer', icon: 'pi pi-cog' },
    { label: t('supplier.types.wholesaler'), value: 'wholesaler', icon: 'pi pi-warehouse' },
    { label: t('supplier.types.distributor'), value: 'distributor', icon: 'pi pi-truck' },
    { label: t('supplier.types.importer'), value: 'importer', icon: 'pi pi-globe' },
    { label: t('supplier.types.service_provider'), value: 'service_provider', icon: 'pi pi-wrench' },
    { label: t('supplier.types.agent_broker'), value: 'agent_broker', icon: 'pi pi-users' },
    { label: t('supplier.types.other'), value: 'other', icon: 'pi pi-ellipsis-h' }
];

// Form state
const record: Ref<any> = ref({
    name: '',
    type: 'manufacturer',
    addresses: [{ street: '', region: null, city: null, main: true }],
    contactMethods: [{ type: 'phone', value: '' }],
    files: null
});

// Popover refs for add method
const addMethodPopoverRef = ref<any>(null);

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

const getMethodIcon = (type: string): string => {
    const option = contactMethodOptions.find((o) => o.value === type);
    return option ? option.icon : 'pi pi-info-circle';
};

const addContactMethod = (type: string): void => {
    record.value.contactMethods.push({ type, value: '' });
};

const removeContactMethod = (index: number): void => {
    record.value.contactMethods.splice(index, 1);
};

const toggleAddMethodPopover = (event: Event): void => {
    if (addMethodPopoverRef.value) addMethodPopoverRef.value.toggle(event);
};

async function loadRegions(): Promise<void> {
    try {
        const response = await useRegionService.getAllRegions();
        regions.value = response.regions || [];
    } catch (error) {
        console.error('Error loading regions:', error);
    }
}

async function saveRecord(): Promise<void> {
    if (!validateForm()) return;

    try {
        loading.startFormSending();
        authStore.errors = {};

        // Build contact methods as object keyed by type
        const contactMethods: Record<string, any> = {};
        for (const method of record.value.contactMethods) {
            if (method.value) {
                const key = method.id ? `existing_${method.id}` : method.type;
                contactMethods[key] = { type: method.type, value: method.value };
                if (method.id) contactMethods[key].id = method.id;
            }
        }

        // Normalize addresses
        const normalizedAddresses = record.value.addresses.map((addr: any) => ({
            ...addr,
            region: addr.region && typeof addr.region === 'object' ? addr.region.id : addr.region,
            city: addr.city && typeof addr.city === 'object' ? addr.city.id : addr.city
        }));

        const currentFile = record.value.files;
        const hasFile = currentFile instanceof File || currentFile === null;
        let result: any;

        if (currentFile instanceof File) {
            const formData = new FormData();
            formData.append('name', record.value.name);
            formData.append('type', record.value.type);
            formData.append('addresses', JSON.stringify(normalizedAddresses));
            formData.append('contactMethods', JSON.stringify(contactMethods));
            formData.append('file', currentFile);

            if (action.value === ACTIONS.EDIT) {
                result = await useSupplierService.updateSupplier(record.value.id, formData);
            } else {
                result = await useSupplierService.storeSupplier(formData);
            }
        } else if (currentFile === null && action.value === ACTIONS.EDIT) {
            const formData = new FormData();
            formData.append('name', record.value.name);
            formData.append('type', record.value.type);
            formData.append('addresses', JSON.stringify(normalizedAddresses));
            formData.append('contactMethods', JSON.stringify(contactMethods));
            formData.append('remove_file', '1');
            result = await useSupplierService.updateSupplier(record.value.id, formData);
        } else {
            const payload = {
                name: record.value.name,
                type: record.value.type,
                addresses: normalizedAddresses,
                contactMethods
            };

            if (action.value === ACTIONS.EDIT) {
                result = await useSupplierService.updateSupplier(record.value.id, payload);
            } else {
                result = await useSupplierService.storeSupplier(payload as any);
            }
        }

        dialogRef?.value.close({ record: result?.data || record.value, action: action.value });
    } catch (error: any) {
        if (error?.response?.status === 422 && error?.response?.data?.errors) {
            authStore.errors = error.response.data.errors;
        } else {
            showToast('error', action.value === ACTIONS.EDIT ? ACTIONS.EDIT : ACTIONS.CREATE, 'supplier', 'tc', error);
        }
    } finally {
        loading.stopFormSending();
    }
}

const closeDialog = (): void => {
    dialogRef?.value.close();
};

onMounted(async () => {
    await loadRegions();

    if (dialogRef?.value?.data) {
        const data = dialogRef.value.data;
        action.value = data.action;

        if (data.action === ACTIONS.EDIT && data.record) {
            const supplier = data.record as SupplierData;
            record.value = {
                id: supplier.id,
                name: supplier.name,
                type: supplier.type,
                addresses: supplier.addresses?.length
                    ? supplier.addresses.map((addr: any) => ({
                          ...addr,
                          region: addr.region?.id ?? addr.region,
                          city: addr.city?.id ?? addr.city
                      }))
                    : [{ street: '', region: null, city: null, main: true }],
                contactMethods: supplier.contactMethods?.length ? supplier.contactMethods.map((cm: any) => ({ id: cm.id, type: cm.type, value: cm.value || '' })) : [{ type: 'phone', value: '' }],
                files: supplier.logo || null
            };
        }
    }
});
</script>

<template>
    <div class="flex flex-col gap-6 p-6">
        <!-- Logo Upload Area -->
        <FileUploadField
            v-model="record.files"
            variant="avatar"
            icon="pi pi-building"
            accept="image/*"
            :maxFileSize="2000000"
            :label="t('entity.supplier')"
            :error="authStore.errors?.['file']?.[0] ? t(authStore.errors?.['file']?.[0]) : null"
            @select="() => authStore.clearErrors(['file'])"
        />

        <!-- GENERAL INFORMATION Section -->
        <div>
            <!-- Supplier Name -->
            <div class="mb-4">
                <FloatLabel variant="on" class="w-full">
                    <IconField>
                        <InputIcon class="pi pi-tag" />
                        <InputText
                            id="name"
                            v-model="record.name"
                            :disabled="loading.isFormSending"
                            autofocus
                            class="w-full"
                            maxlength="200"
                            :invalid="authStore.errors?.['name']?.[0] ? true : false"
                            @input="() => authStore.clearErrors(['name'])"
                            @blur="() => onBlurField('name')"
                        />
                    </IconField>
                    <label for="name">{{ t('supplier.columns.name') }} *</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['name']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['name']?.[0]) }}
                </Message>
            </div>

            <!-- Supplier Type -->
            <div>
                <label class="text-sm font-medium text-surface-700 dark:text-surface-200 mb-2 block">{{ t('supplier.columns.type') }}</label>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    <div
                        v-for="sType in supplierTypes"
                        :key="sType.value"
                        class="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all duration-200 min-w-[80px]"
                        :class="record.type === sType.value ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm' : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'"
                        @click="record.type = sType.value"
                    >
                        <i :class="sType.icon" class="text-lg" :style="{ color: record.type === sType.value ? 'var(--p-primary-color)' : 'var(--p-text-muted-color)' }" />
                        <span class="text-[10px] font-bold uppercase tracking-wider" :class="record.type === sType.value ? 'text-primary' : 'text-surface-400'">
                            {{ sType.label }}
                        </span>
                    </div>
                </div>
                <Message v-if="authStore.errors?.['type']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['type']?.[0]) }}
                </Message>
            </div>
        </div>

        <!-- CONTACT METHODS Section (inline repeater) -->
        <div>
            <div class="border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                <h3 class="text-lg font-semibold mb-4">{{ t('common.labels.contact_methods') }}</h3>
                <div class="flex flex-wrap items-center gap-2">
                    <!-- Existing method chips -->
                    <div v-for="(contactMethod, methodIndex) in record.contactMethods" :key="methodIndex" class="flex items-center gap-1 bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-md pl-1 pr-2 py-0.5">
                        <FloatLabel variant="on">
                            <IconField>
                                <InputIcon :class="getMethodIcon(contactMethod.type)" />
                                <InputText
                                    :id="`method_${methodIndex}`"
                                    v-model="contactMethod.value"
                                    :disabled="loading.isFormSending"
                                    class="border-0 bg-transparent shadow-none text-sm w-44 dark:!bg-transparent"
                                    :invalid="authStore.errors?.[`contactMethods.${methodIndex}.value`]?.[0] ? true : false"
                                    @input="() => authStore.clearErrors([`contactMethods.${methodIndex}.value`])"
                                    @blur="() => onBlurField(`contactMethods.${methodIndex}.value`)"
                                />
                            </IconField>
                            <label :for="`method_${methodIndex}`">{{ contactMethodOptions.find((o) => o.value === contactMethod.type)?.label || contactMethod.type }}</label>
                        </FloatLabel>
                        <button v-if="record.contactMethods.length > 1" class="text-surface-400 hover:text-red-500 transition-colors cursor-pointer" @click="removeContactMethod(Number(methodIndex))">
                            <i class="pi pi-times text-xs" />
                        </button>
                    </div>

                    <!-- Inline add pill -->
                    <div
                        class="flex items-center gap-1.5 border border-dashed border-surface-300 dark:border-surface-600 rounded-md px-3 py-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200"
                        @click="(e) => toggleAddMethodPopover(e)"
                    >
                        <i class="pi pi-plus text-xs text-primary" />
                        <span class="text-xs font-semibold text-primary uppercase tracking-wider">{{ t('contact.buttons.add_contact_method') }}</span>
                    </div>

                    <!-- Popover type picker -->
                    <Popover ref="addMethodPopoverRef">
                        <div class="flex flex-col gap-1 p-1 min-w-[140px]">
                            <div
                                v-for="opt in contactMethodOptions"
                                :key="opt.value"
                                class="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                                @click="
                                    addContactMethod(opt.value);
                                    toggleAddMethodPopover($event);
                                "
                            >
                                <i :class="opt.icon" class="text-sm text-primary" />
                                <span class="text-sm text-surface-700 dark:text-surface-200">{{ opt.label }}</span>
                            </div>
                        </div>
                    </Popover>
                </div>

                <!-- Validation errors for methods -->
                <template v-for="(contactMethod, methodIndex) in record.contactMethods" :key="`err_${methodIndex}`">
                    <Message v-if="authStore.errors?.[`contactMethods.${methodIndex}.value`]?.[0]" severity="error" size="small" class="mt-2">
                        {{ authStore.errors?.[`contactMethods.${methodIndex}.value`]?.[0] }}
                    </Message>
                </template>
            </div>
        </div>

        <!-- BUSINESS ADDRESS Section (single, not repeater) -->

        <h3 class="text-lg font-semibold mb-4">{{ t('common.labels.address') }}</h3>
        <Address v-model="record.addresses" :multiple="false" :regions="regions" />

        <!-- Footer Actions -->
        <div class="flex justify-end gap-2 mt-4">
            <Button :label="t('common.labels.cancel')" icon="pi pi-times" text @click="closeDialog" />
            <Button :label="t('common.labels.save')" icon="pi pi-check" @click="saveRecord" :loading="loading.isFormSending" />
        </div>
    </div>
</template>
