<script setup>
import { useCategoryService } from '@/services/useCategoryService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { categorySchema } from '@/validations/category';
import { validate, validateField } from '@/validations/validate';
import { inject, onMounted, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const authStore = useAuthStore();
const { t } = useI18n();
const { showToast } = useShowToast();
const loading = useLoading();
const record = ref({});
const allCategories = ref([]);
const dialogRef = inject('dialogRef');
const action = ref();

// Validation schema
const schema = categorySchema;

const validateForm = () => {
    const { ok, errors } = validate(schema, record.value);
    authStore.errors = ok ? {} : errors;
    return ok;
};

const onBlurField = (path) => {
    const { ok, errors } = validateField(schema, record.value, path);
    if (ok) {
        authStore.clearErrors([path]);
    } else {
        authStore.errors = { ...authStore.errors, ...errors };
    }
};

// Icon options
const iconOptions = ['pi pi-home', 'pi pi-shopping-bag', 'pi pi-box', 'pi pi-users', 'pi pi-bolt', 'pi pi-car', 'pi pi-chart-bar', 'pi pi-pencil', 'pi pi-headphones', 'pi pi-palette', 'pi pi-gift', 'pi pi-star'];

// Accent color options
const accentColors = [
    { value: '#3B82F6', label: 'Blue' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#6366F1', label: 'Indigo' },
    { value: '#EC4899', label: 'Pink' }
];

// Parent options with "None" option
const parentOptions = computed(() => {
    const options = [{ id: null, name: t('category.labels.none_root') }];
    return [...options, ...allCategories.value];
});

const onFormSubmit = () => {
    if (!validateForm()) {
        return;
    }

    loading.startFormSending();

    const serviceAction = action.value === ACTIONS.CREATE ? useCategoryService.storeCategory : (categoryData) => useCategoryService.updateCategory(record.value.id, categoryData);

    serviceAction(record.value)
        .then((response) => {
            dialogRef.value.close({ record: response.data, action: action.value });
        })
        .catch((error) => {
            authStore.processError(error, t('common.messages.error_occurred'));
            showToast('error', action.value, 'category', 'tr');
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
});
</script>

<template>
    <form @submit.prevent="onFormSubmit" class="category-form">
        <!-- Form Header -->
        <div class="form-header">
            <div class="header-icon" :style="{ backgroundColor: (record.icon_color || '#3B82F6') + '20' }">
                <i :class="record.icon || 'pi pi-folder'" :style="{ color: record.icon_color || '#3B82F6' }"></i>
            </div>
            <div class="header-text">
                <h3>{{ action === 'create' ? t('category.form.title_new') : t('category.form.title_edit') }}</h3>
                <p>{{ t('category.form.subtitle') }}</p>
            </div>
        </div>

        <!-- Category Name -->
        <div class="form-field">
            <label for="name" class="field-label">{{ t('category.columns.name') }} <span class="required">*</span></label>
            <InputText
                id="name"
                v-model="record.name"
                :disabled="loading.isFormSending"
                class="w-full"
                :placeholder="t('category.placeholders.category_name')"
                :invalid="authStore.errors?.['name']?.[0] ? true : false"
                @input="() => authStore.clearErrors(['name'])"
                @blur="() => onBlurField('name')"
            />
            <Message v-if="authStore.errors?.['name']?.[0]" severity="error" size="small">
                {{ t(authStore.errors?.['name']?.[0]) }}
            </Message>
        </div>

        <!-- Parent Category -->
        <div class="form-field">
            <label for="parent_id" class="field-label">{{ t('category.columns.parent_id') }}</label>
            <Select id="parent_id" v-model="record.parent_id" :options="parentOptions" optionLabel="name" optionValue="id" :disabled="loading.isFormSending" class="w-full" />
        </div>

        <!-- Icon & Color Section -->
        <div class="form-field">
            <label class="field-label">{{ t('category.labels.icon_and_color') }}</label>

            <!-- Icon Grid -->
            <div class="icon-grid">
                <button v-for="icon in iconOptions" :key="icon" type="button" class="icon-btn" :class="{ selected: record.icon === icon }" @click="record.icon = icon">
                    <i :class="icon"></i>
                </button>
            </div>

            <!-- Accent Colors -->
            <div class="accent-section">
                <span class="accent-label">{{ t('category.labels.accent') }} :</span>
                <div class="color-options">
                    <button
                        v-for="color in accentColors"
                        :key="color.value"
                        type="button"
                        class="color-btn"
                        :class="{ selected: record.icon_color === color.value }"
                        :style="{ backgroundColor: color.value }"
                        :title="color.label"
                        @click="record.icon_color = color.value"
                    ></button>
                </div>
            </div>
        </div>

        <!-- Visibility Toggle -->
        <div class="toggle-field">
            <div class="toggle-info">
                <span class="toggle-label">{{ t('category.labels.visibility_status') }}</span>
                <span class="toggle-description">{{ t('category.labels.visibility_description') }}</span>
            </div>
            <ToggleSwitch v-model="record.publish" />
        </div>

        <!-- Active Toggle -->
        <div class="toggle-field">
            <div class="toggle-info">
                <span class="toggle-label">{{ t('category.labels.active_status') }}</span>
                <span class="toggle-description">{{ t('category.labels.active_description') }}</span>
            </div>
            <ToggleSwitch v-model="record.active" />
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
            <Button :label="t('common.labels.cancel')" text @click="closeDialog" :disabled="loading.isFormSending" />
            <Button :label="t('common.labels.save')" type="submit" :loading="loading.isFormSending" />
        </div>
    </form>
</template>

<style scoped>
.category-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.form-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--surface-border);
}

.header-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.header-icon i {
    font-size: 1.25rem;
}

.header-text h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
}

.header-text p {
    margin: 0.25rem 0 0 0;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.field-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-color);
}

.required {
    color: var(--red-500);
}

/* Icon Grid */
.icon-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0.5rem;
}

.icon-btn {
    width: 100%;
    aspect-ratio: 1;
    border: 2px solid var(--surface-border);
    border-radius: 10px;
    background: var(--surface-ground);
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.icon-btn i {
    font-size: 1.125rem;
    color: var(--text-color-secondary);
}

.icon-btn:hover {
    border-color: var(--primary-color);
}

.icon-btn.selected {
    border-color: var(--primary-color);
    background: var(--primary-color);
}

.icon-btn.selected i {
    color: white;
}

/* Accent Colors */
.accent-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.75rem;
}

.accent-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-color-secondary);
}

.color-options {
    display: flex;
    gap: 0.5rem;
}

.color-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 3px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
}

.color-btn:hover {
    transform: scale(1.1);
}

.color-btn.selected {
    border-color: var(--surface-0);
    box-shadow: 0 0 0 2px var(--primary-color);
}

/* Toggle Fields */
.toggle-field {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-top: 1px solid var(--surface-border);
}

.toggle-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
}

.toggle-label {
    font-size: 0.875rem;
    font-weight: 500;
}

.toggle-description {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
}

/* Form Actions */
.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding-top: 1rem;
    border-top: 1px solid var(--surface-border);
}
</style>
