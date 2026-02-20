<script setup>
import IconColorPicker from '@/components/IconColorPicker.vue';
import { usePlanService } from '@/services/usePlanService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { planSchema } from '@/validations/plan';
import { validate, validateField } from '@/validations/validate';
import { inject, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const authStore = useAuthStore();
const { t } = useI18n();
const { showToast } = useShowToast();
const loading = useLoading();
const record = ref({});
const dialogRef = inject('dialogRef');
const action = ref();

// Validation schema
const schema = planSchema;

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

const onFormSubmit = () => {
    if (!validateForm()) {
        return;
    }

    loading.startFormSending();

    const serviceAction = action.value === ACTIONS.CREATE ? usePlanService.storePlan : (planData) => usePlanService.updatePlan(record.value.id, planData);

    serviceAction(record.value)
        .then((response) => {
            dialogRef.value.close({ record: response.data, action: action.value });
        })
        .catch((error) => {
            authStore.processError(error, t('common.messages.error_occurred'));
            showToast('error', action.value, 'plan', 'tr');
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
    action.value = dialogRef.value.data.action;
});
</script>

<template>
    <form @submit.prevent="onFormSubmit" class="flex flex-col space-y-5">
        <!-- Section: Basic Information -->
        <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-3">
                {{ t('plan.form.section_basic') }}
            </p>
            <div class="grid grid-cols-2 gap-4">
                <!-- Level -->
                <div class="col-span-2">
                    <FloatLabel variant="on" class="w-full">
                        <IconField>
                            <InputIcon class="pi pi-sort-numeric-up" />
                            <InputNumber
                                id="level"
                                v-model="record.level"
                                :disabled="loading.isFormSending"
                                autofocus
                                class="w-full"
                                :useGrouping="false"
                                :min="1"
                                :invalid="authStore.errors?.['level']?.[0] ? true : false"
                                @blur="() => onBlurField('level')"
                            />
                        </IconField>
                        <label for="level">{{ t('plan.columns.level') }} *</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['level']?.[0]" severity="error" size="small">
                        {{ t(authStore.errors?.['level']?.[0]) }}
                    </Message>
                </div>

                <!-- Name -->
                <div class="col-span-2">
                    <FloatLabel variant="on" class="w-full">
                        <IconField>
                            <InputIcon class="pi pi-tag" />
                            <InputText
                                id="name"
                                v-model="record.name"
                                :disabled="loading.isFormSending"
                                autofocus
                                class="w-full"
                                :invalid="authStore.errors?.['name']?.[0] ? true : false"
                                @input="() => authStore.clearErrors(['name'])"
                                @blur="() => onBlurField('name')"
                            />
                        </IconField>
                        <label for="name">{{ t('plan.columns.name') }} *</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['name']?.[0]" severity="error" size="small">
                        {{ t(authStore.errors?.['name']?.[0]) }}
                    </Message>
                </div>

                <!-- Description -->
                <div class="col-span-2">
                    <FloatLabel variant="on" class="w-full">
                        <Textarea
                            id="description"
                            v-model="record.description"
                            :disabled="loading.isFormSending"
                            class="w-full"
                            rows="2"
                            autoResize
                            :invalid="authStore.errors?.['description']?.[0] ? true : false"
                            @input="() => authStore.clearErrors(['description'])"
                            @blur="() => onBlurField('description')"
                        />
                        <label for="description">{{ t('plan.columns.description') }}</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['description']?.[0]" severity="error" size="small">
                        {{ t(authStore.errors?.['description']?.[0]) }}
                    </Message>
                </div>
            </div>
        </div>

        <!-- Section: Visual Identity (IconColorPicker) -->
        <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-3">
                {{ t('plan.form.section_visual') }}
            </p>
            <IconColorPicker v-model:icon="record.icon" v-model:iconColor="record.color" :icon-error="authStore.errors?.['icon']?.[0]" :color-error="authStore.errors?.['color']?.[0]" />
        </div>

        <!-- Section: Plan Quotas -->
        <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-3">
                {{ t('plan.form.section_quotas') }}
            </p>
            <div class="grid grid-cols-2 gap-4">
                <!-- Orders -->
                <div>
                    <FloatLabel variant="on" class="w-full">
                        <IconField>
                            <InputIcon class="pi pi-shopping-cart" />
                            <InputNumber
                                id="orders"
                                v-model="record.orders"
                                :disabled="loading.isFormSending"
                                class="w-full"
                                :useGrouping="false"
                                :min="0"
                                :invalid="authStore.errors?.['orders']?.[0] ? true : false"
                                @blur="() => onBlurField('orders')"
                            />
                        </IconField>
                        <label for="orders">{{ t('plan.columns.orders') }} *</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['orders']?.[0]" severity="error" size="small">
                        {{ t(authStore.errors?.['orders']?.[0]) }}
                    </Message>
                </div>

                <!-- Products -->
                <div>
                    <FloatLabel variant="on" class="w-full">
                        <IconField>
                            <InputIcon class="pi pi-box" />
                            <InputNumber
                                id="products"
                                v-model="record.products"
                                :disabled="loading.isFormSending"
                                class="w-full"
                                :useGrouping="false"
                                :min="0"
                                :invalid="authStore.errors?.['products']?.[0] ? true : false"
                                @blur="() => onBlurField('products')"
                            />
                        </IconField>
                        <label for="products">{{ t('plan.columns.products') }} *</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['products']?.[0]" severity="error" size="small">
                        {{ t(authStore.errors?.['products']?.[0]) }}
                    </Message>
                </div>

                <!-- Users -->
                <div>
                    <FloatLabel variant="on" class="w-full">
                        <IconField>
                            <InputIcon class="pi pi-users" />
                            <InputNumber id="users" v-model="record.users" :disabled="loading.isFormSending" class="w-full" :useGrouping="false" :min="0" :invalid="authStore.errors?.['users']?.[0] ? true : false" @blur="() => onBlurField('users')" />
                        </IconField>
                        <label for="users">{{ t('plan.columns.users') }} *</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['users']?.[0]" severity="error" size="small">
                        {{ t(authStore.errors?.['users']?.[0]) }}
                    </Message>
                </div>

                <!-- Shops -->
                <div>
                    <FloatLabel variant="on" class="w-full">
                        <IconField>
                            <InputIcon class="pi pi-shop" />
                            <InputNumber id="shops" v-model="record.shops" :disabled="loading.isFormSending" class="w-full" :useGrouping="false" :min="0" :invalid="authStore.errors?.['shops']?.[0] ? true : false" @blur="() => onBlurField('shops')" />
                        </IconField>
                        <label for="shops">{{ t('plan.columns.shops') }} *</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['shops']?.[0]" severity="error" size="small">
                        {{ t(authStore.errors?.['shops']?.[0]) }}
                    </Message>
                </div>

                <!-- Roles -->
                <div>
                    <FloatLabel variant="on" class="w-full">
                        <IconField>
                            <InputIcon class="pi pi-id-card" />
                            <InputNumber id="roles" v-model="record.roles" :disabled="loading.isFormSending" class="w-full" :useGrouping="false" :min="0" :invalid="authStore.errors?.['roles']?.[0] ? true : false" @blur="() => onBlurField('roles')" />
                        </IconField>
                        <label for="roles">{{ t('plan.columns.roles') }} *</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['roles']?.[0]" severity="error" size="small">
                        {{ t(authStore.errors?.['roles']?.[0]) }}
                    </Message>
                </div>

                <!-- Categories -->
                <div>
                    <FloatLabel variant="on" class="w-full">
                        <IconField>
                            <InputIcon class="pi pi-sitemap" />
                            <InputNumber
                                id="categories"
                                v-model="record.categories"
                                :disabled="loading.isFormSending"
                                class="w-full"
                                :useGrouping="false"
                                :min="0"
                                :invalid="authStore.errors?.['categories']?.[0] ? true : false"
                                @blur="() => onBlurField('categories')"
                            />
                        </IconField>
                        <label for="categories">{{ t('plan.columns.categories') }} *</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['categories']?.[0]" severity="error" size="small">
                        {{ t(authStore.errors?.['categories']?.[0]) }}
                    </Message>
                </div>

                <!-- Shippers -->
                <div>
                    <FloatLabel variant="on" class="w-full">
                        <IconField>
                            <InputIcon class="pi pi-truck" />
                            <InputNumber
                                id="shippers"
                                v-model="record.shippers"
                                :disabled="loading.isFormSending"
                                class="w-full"
                                :useGrouping="false"
                                :min="0"
                                :invalid="authStore.errors?.['shippers']?.[0] ? true : false"
                                @blur="() => onBlurField('shippers')"
                            />
                        </IconField>
                        <label for="shippers">{{ t('plan.columns.shippers') }} *</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['shippers']?.[0]" severity="error" size="small">
                        {{ t(authStore.errors?.['shippers']?.[0]) }}
                    </Message>
                </div>

                <!-- Customers -->
                <div>
                    <FloatLabel variant="on" class="w-full">
                        <IconField>
                            <InputIcon class="pi pi-user" />
                            <InputNumber
                                id="customers"
                                v-model="record.customers"
                                :disabled="loading.isFormSending"
                                class="w-full"
                                :useGrouping="false"
                                :min="0"
                                :invalid="authStore.errors?.['customers']?.[0] ? true : false"
                                @blur="() => onBlurField('customers')"
                            />
                        </IconField>
                        <label for="customers">{{ t('plan.columns.customers') }} *</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['customers']?.[0]" severity="error" size="small">
                        {{ t(authStore.errors?.['customers']?.[0]) }}
                    </Message>
                </div>

                <!-- Contact Methods -->
                <div>
                    <FloatLabel variant="on" class="w-full">
                        <IconField>
                            <InputIcon class="pi pi-phone" />
                            <InputNumber
                                id="contact_methods"
                                v-model="record.contact_methods"
                                :disabled="loading.isFormSending"
                                class="w-full"
                                :useGrouping="false"
                                :min="0"
                                :invalid="authStore.errors?.['contact_methods']?.[0] ? true : false"
                                @blur="() => onBlurField('contact_methods')"
                            />
                        </IconField>
                        <label for="contact_methods">{{ t('plan.columns.contact_methods') }} *</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['contact_methods']?.[0]" severity="error" size="small">
                        {{ t(authStore.errors?.['contact_methods']?.[0]) }}
                    </Message>
                </div>
            </div>
        </div>

        <!-- Section: Pricing -->
        <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-3">
                {{ t('plan.form.section_pricing') }}
            </p>
            <div class="grid grid-cols-2 gap-4">
                <!-- Monthly Price -->
                <div>
                    <FloatLabel variant="on" class="w-full">
                        <IconField>
                            <InputIcon class="pi pi-dollar" />
                            <InputNumber
                                id="monthly_price"
                                v-model="record.monthly_price"
                                :disabled="loading.isFormSending"
                                class="w-full"
                                :useGrouping="false"
                                :min="0"
                                :invalid="authStore.errors?.['monthly_price']?.[0] ? true : false"
                                @blur="() => onBlurField('monthly_price')"
                            />
                        </IconField>
                        <label for="monthly_price">{{ t('plan.columns.monthly_price') }} *</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['monthly_price']?.[0]" severity="error" size="small">
                        {{ t(authStore.errors?.['monthly_price']?.[0]) }}
                    </Message>
                </div>

                <!-- Yearly Price -->
                <div>
                    <FloatLabel variant="on" class="w-full">
                        <IconField>
                            <InputIcon class="pi pi-calendar" />
                            <InputNumber
                                id="yearly_price"
                                v-model="record.yearly_price"
                                :disabled="loading.isFormSending"
                                class="w-full"
                                :useGrouping="false"
                                :min="0"
                                :invalid="authStore.errors?.['yearly_price']?.[0] ? true : false"
                                @blur="() => onBlurField('yearly_price')"
                            />
                        </IconField>
                        <label for="yearly_price">{{ t('plan.columns.yearly_price') }} *</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['yearly_price']?.[0]" severity="error" size="small">
                        {{ t(authStore.errors?.['yearly_price']?.[0]) }}
                    </Message>
                </div>
            </div>
        </div>

        <!-- Toggles -->
        <div class="flex items-center gap-6 pt-2">
            <div class="flex items-center gap-3">
                <ToggleSwitch id="active" v-model="record.active" :class="{ 'p-invalid': authStore.errors?.active }" @change="onBlurField('active')" />
                <label for="active" class="font-medium text-sm">{{ t('plan.columns.active') }}</label>
            </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-2 mt-4">
            <Button :label="t('common.labels.cancel')" icon="pi pi-times" text @click="closeDialog" />
            <Button :label="t('common.labels.save')" icon="pi pi-check" type="submit" :loading="loading.isFormSending" />
        </div>
    </form>
</template>
