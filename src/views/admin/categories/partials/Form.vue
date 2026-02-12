<script setup lang="ts">
import { useCategoryService } from '@/services/useCategoryService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { categorySchema } from '@/validations/category';
import { validate, validateField } from '@/validations/validate';
import { inject, onMounted, ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import IconColorPicker from '@/components/IconColorPicker.vue';
import type { CategoryData, CategoryFormData } from '@/types/category';

const authStore = useAuthStore();
const { t } = useI18n();
const { showToast } = useShowToast();
const loading = useLoading();
const record = ref<CategoryFormData>({} as CategoryFormData);
const allCategories = ref<CategoryData[]>([]);
const dialogRef = inject<any>('dialogRef');
const action = ref<string>();

// TreeSelect uses { [key]: true } object format for v-model
const selectedParentKey = ref<Record<string, boolean> | null>(null);

// Sync selectedParentKey -> record.parent_id
watch(selectedParentKey, (newVal) => {
    if (newVal === null || newVal === undefined || Object.keys(newVal).length === 0) {
        record.value.parent_id = null;
    } else {
        const key = Object.keys(newVal)[0];
        record.value.parent_id = key === 'root' ? null : Number(key);
    }
});

// Validation schema
const schema = categorySchema;

const validateForm = () => {
    const { ok, errors } = validate(schema, record.value);
    authStore.errors = ok ? {} : errors;
    return ok;
};

const onBlurField = (path: string) => {
    const { ok, errors } = validateField(schema, record.value, path);
    if (ok) {
        authStore.clearErrors([path]);
    } else {
        authStore.errors = { ...authStore.errors, ...errors };
    }
};

// Tree options for TreeSelect
const treeSelectNodes = computed(() => {
    const buildTree = (items: CategoryData[], parentId: number | null = null): any[] => {
        return items
            .filter((item: CategoryData) => item.parent_id === parentId && item.id !== record.value.id) // Exclude self to avoid circular dependency
            .map((item: CategoryData) => {
                const children = buildTree(items, item.id);
                return {
                    key: String(item.id),
                    label: item.name,
                    data: item.id, // TreeSelect uses this as value
                    value: item.id, // Explicit value for TreeSelect
                    icon: item.icon || 'pi pi-folder',
                    children: children.length > 0 ? children : undefined
                };
            });
    };

    // Add "None" option as root
    const rootOption = {
        key: 'root',
        label: t('category.labels.none_root'),
        data: null,
        value: null,
        icon: 'pi pi-folder-open'
    };

    return [rootOption, ...buildTree(allCategories.value)];
});

const onFormSubmit = () => {
    if (!validateForm()) {
        return;
    }

    loading.startFormSending();

    const serviceAction = action.value === ACTIONS.CREATE ? (data: CategoryFormData) => useCategoryService.storeCategory(data) : (data: CategoryFormData) => useCategoryService.updateCategory(record.value.id!, data);

    serviceAction(record.value)
        .then((response: any) => {
            dialogRef.value.close({ record: response.data, action: action.value });
        })
        .catch((error: any) => {
            authStore.processError(error, t('common.messages.error_occurred'));
            showToast('error', action.value as any, 'category', 'tr');
        })
        .finally(() => {
            loading.stopFormSending();
        });
};

const closeDialog = () => {
    dialogRef.value.close();
};

onMounted(() => {
    record.value = dialogRef.value.data.record;
    allCategories.value = dialogRef.value.data.allCategories || [];
    action.value = dialogRef.value.data.action;

    // Initialize selectedParentKey from record.parent_id
    if (record.value.parent_id != null) {
        selectedParentKey.value = { [String(record.value.parent_id)]: true } as Record<string, boolean>;
    } else {
        selectedParentKey.value = { root: true } as Record<string, boolean>;
    }
});
</script>

<template>
    <form @submit.prevent="onFormSubmit" class="flex flex-col gap-5">
        <!-- Category Name -->
        <div class="pt-2">
            <FloatLabel variant="on">
                <IconField>
                    <InputIcon>
                        <i class="pi pi-th-large" />
                    </InputIcon>
                    <InputText
                        id="name"
                        v-model="record.name"
                        :disabled="loading.isFormSending"
                        class="w-full"
                        :invalid="authStore.errors?.['name']?.[0] ? true : false"
                        @input="() => authStore.clearErrors(['name'])"
                        @blur="() => onBlurField('name')"
                        :placeholder="t('category.placeholders.category_name')"
                    />
                </IconField>
                <label for="name">{{ t('category.columns.name') }} <span class="text-red-500">*</span></label>
            </FloatLabel>
            <Message v-if="authStore.errors?.['name']?.[0]" severity="error" size="small" variant="simple">
                {{ t(authStore.errors?.['name']?.[0]) }}
            </Message>
        </div>

        <!-- Parent Category -->
        <div>
            <FloatLabel variant="on">
                <IconField>
                    <InputIcon class="z-10">
                        <i class="pi pi-folder" />
                    </InputIcon>
                    <TreeSelect
                        id="parent_id"
                        v-model="selectedParentKey"
                        :options="treeSelectNodes"
                        :placeholder="t('category.placeholders.select_parent')"
                        class="w-full !pl-10"
                        :disabled="loading.isFormSending"
                        :invalid="authStore.errors?.['parent_id']?.[0] ? true : false"
                    />
                    <label for="parent_id" class="!ml-10">{{ t('category.columns.parent_id') }}</label>
                </IconField>
            </FloatLabel>
            <Message v-if="authStore.errors?.['parent_id']?.[0]" severity="error" size="small" variant="simple">
                {{ t(authStore.errors?.['parent_id']?.[0]) }}
            </Message>
        </div>

        <!-- Icon & Color Section -->
        <IconColorPicker v-model:icon="record.icon" v-model:icon-color="record.icon_color" />

        <!-- Visibility Toggle -->
        <div class="flex justify-between items-center py-2 px-1">
            <div class="flex flex-col gap-0.5">
                <span class="text-sm font-semibold">{{ t('category.labels.visibility_status') }}</span>
                <span class="text-xs text-surface-500 dark:text-surface-400">{{ t('category.labels.visibility_description') }}</span>
            </div>
            <ToggleSwitch v-model="record.publish" />
        </div>

        <!-- Active Toggle -->
        <div class="flex justify-between items-center py-2 px-1 border-t border-surface-100 dark:border-surface-800">
            <div class="flex flex-col gap-0.5">
                <span class="text-sm font-semibold">{{ t('category.labels.active_status') }}</span>
                <span class="text-xs text-surface-500 dark:text-surface-400">{{ t('category.labels.active_description') }}</span>
            </div>
            <ToggleSwitch v-model="record.active" />
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-3 pt-4 mt-2 border-t border-surface-200 dark:border-surface-700">
            <Button :label="t('common.labels.cancel')" severity="secondary" text @click="closeDialog" :disabled="loading.isFormSending" />
            <Button :label="t('common.labels.save')" type="submit" :loading="loading.isFormSending" rounded />
        </div>
    </form>
</template>

<style scoped></style>
