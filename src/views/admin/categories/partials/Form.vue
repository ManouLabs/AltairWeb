<script setup lang="ts">
import { useCategoryService } from '@/services/useCategoryService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { categorySchema } from '@/validations/category';
import { validate, validateField } from '@/validations/validate';
import { inject, onMounted, ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
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

// Icon search and selection
const iconSearch = ref<string>('');
const commonIcons = [
    'pi pi-home',
    'pi pi-shopping-bag',
    'pi pi-box',
    'pi pi-users',
    'pi pi-bolt',
    'pi pi-car',
    'pi pi-chart-bar',
    'pi pi-pencil',
    'pi pi-headphones',
    'pi pi-palette',
    'pi pi-gift',
    'pi pi-star',
    'pi pi-tag',
    'pi pi-shopping-cart',
    'pi pi-truck',
    'pi pi-cog',
    'pi pi-heart',
    'pi pi-bookmark',
    'pi pi-camera',
    'pi pi-video',
    'pi pi-image',
    'pi pi-folder',
    'pi pi-file',
    'pi pi-envelope',
    'pi pi-bell',
    'pi pi-calendar',
    'pi pi-clock',
    'pi pi-map-marker',
    'pi pi-flag',
    'pi pi-unlock',
    'pi pi-lock',
    'pi pi-user',
    'pi pi-search',
    'pi pi-check',
    'pi pi-times',
    'pi pi-plus',
    'pi pi-minus',
    'pi pi-info-circle',
    'pi pi-question-circle',
    'pi pi-exclamation-circle',
    'pi pi-phone',
    'pi pi-globe',
    'pi pi-link',
    'pi pi-share-alt',
    'pi pi-download',
    'pi pi-upload',
    'pi pi-refresh',
    'pi pi-play',
    'pi pi-pause',
    'pi pi-stop',
    'pi pi-forward',
    'pi pi-backward',
    'pi pi-volume-up',
    'pi pi-volume-down',
    'pi pi-tablet',
    'pi pi-mobile',
    'pi pi-desktop',
    'pi pi-send',
    'pi pi-trash',
    'pi pi-eye',
    'pi pi-eye-slash',
    'pi pi-key',
    'pi pi-credit-card',
    'pi pi-money-bill',
    'pi pi-wallet',
    'pi pi-briefcase',
    'pi pi-building',
    'pi pi-lightbulb',
    'pi pi-moon',
    'pi pi-sun',
    'pi pi-cloud',
    'pi pi-wifi',
    'pi pi-bluetooth',
    'pi pi-mic',
    'pi pi-database',
    'pi pi-server',
    'pi pi-code',
    'pi pi-terminal',
    'pi pi-cog',
    'pi pi-filter',
    'pi pi-sort',
    'pi pi-bars',
    'pi pi-list',
    'pi pi-th-large',
    'pi pi-grid',
    'pi pi-table',
    'pi pi-chart-line',
    'pi pi-chart-pie',
    'pi pi-percentage',
    'pi pi-dollar',
    'pi pi-euro',
    'pi pi-pound',
    'pi pi-bitcoin',
    'pi pi-shopping-bag',
    'pi pi-ticket',
    'pi pi-at',
    'pi pi-hashtag',
    'pi pi-paperclip',
    'pi pi-history',
    'pi pi-undo',
    'pi pi-redo'
];

const filteredIcons = computed(() => {
    if (!iconSearch.value) return commonIcons;
    const query = iconSearch.value.toLowerCase();
    return commonIcons.filter((icon) => icon.toLowerCase().includes(query));
});

// Expanded color options (20 colors as per screenshot)
const accentColors = ['#3B82F6', '#1D4ED8', '#6366F1', '#4F46E5', '#A855F7', '#8B5CF6', '#EC4899', '#D946EF', '#F43F5E', '#E11D48', '#EF4444', '#F97316', '#F59E0B', '#FACC15', '#84CC16', '#10B981', '#059669', '#06B6D4', '#0F172A', '#94A3B8'];

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
        <div class="flex flex-col gap-4 p-5 bg-surface-50 dark:bg-surface-900/40 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-inner">
            <label class="text-sm font-bold text-surface-700 dark:text-surface-200 uppercase tracking-wide">{{ t('category.labels.icon_and_color') }}</label>

            <!-- Icon Picker -->
            <div class="flex flex-col gap-3">
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText v-model="iconSearch" :placeholder="t('category.placeholders.search_icon')" class="w-full !bg-surface-0 dark:!bg-surface-900" />
                </IconField>

                <div class="grid grid-cols-6 gap-2 max-h-[110px] overflow-y-auto p-1 custom-scrollbar pr-2">
                    <button
                        v-for="icon in filteredIcons"
                        :key="icon"
                        type="button"
                        class="w-full aspect-square border border-surface-200 dark:border-surface-700 rounded-xl bg-surface-0 dark:bg-surface-800 cursor-pointer transition-all flex items-center justify-center hover:border-primary hover:shadow-sm text-surface-600 dark:text-surface-400 group"
                        :class="{ '!border-primary !bg-primary-50 dark:!bg-primary-900/30 !text-primary !border-2 shadow-sm': record.icon === icon }"
                        @click="record.icon = icon"
                    >
                        <i :class="icon" class="text-xl group-hover:scale-110 transition-transform"></i>
                    </button>
                    <div v-if="filteredIcons.length === 0" class="col-span-6 py-6 text-center text-sm text-surface-500 italic">
                        {{ t('category.messages.no_icons_found') }}
                    </div>
                </div>
            </div>

            <!-- Accent Colors -->
            <div class="flex flex-col gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
                <span class="text-[10px] font-black uppercase tracking-widest text-surface-500 dark:text-surface-400">{{ t('category.labels.accent_color') }} :</span>
                <div class="grid grid-cols-10 gap-2">
                    <button
                        v-for="color in accentColors"
                        :key="color"
                        type="button"
                        class="w-7 h-7 rounded-full border border-surface-200 dark:border-surface-700 cursor-pointer transition-all hover:scale-125 flex items-center justify-center p-0"
                        :class="{ 'ring-2 ring-primary ring-offset-2 dark:ring-offset-surface-900 z-10': record.icon_color === color }"
                        :style="{ backgroundColor: color }"
                        @click="record.icon_color = color"
                    >
                        <i v-if="record.icon_color === color" class="pi pi-check text-[9px] text-white"></i>
                    </button>
                </div>
            </div>
        </div>

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

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #334155;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #cbd5e1;
}
</style>
