<script setup lang="ts">
import FormHeader from '@/components/FormHeader.vue';
import { useAccountService } from '@/services/useAccountService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { accountSchema } from '@/validations/account';
import { validate, validateField } from '@/validations/validate';
import { Form as PForm } from '@primevue/forms';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { computed, nextTick, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import Addresses from './partials/Addresses.vue';
import Contacts from './partials/Contacts.vue';
import Information from './partials/Information.vue';
import PlanSelection from './partials/PlanSelection.vue';
import StaffUsers from './partials/StaffUsers.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();
const { showToast } = useShowToast();
const loading = useLoading();

const isEdit = computed(() => !!route.params.id);
const isLoading = ref(true);
const activeStep = ref('1');
const stepperRef = ref();
const formKey = ref(0);

const record = ref<any>({
    legal_name: null,
    trade_name: null,
    rc_number: null,
    nif: null,
    nis: null,
    rib: null,
    active: true,
    contacts: [{ civility: null, first_name: '', last_name: '', contactMethods: [{ contact_id: null, type: 'mobile', value: '' }] }],
    addresses: [{ street: '', region: null, city: null, main: true }],
    subscription: { plan_id: null, billing_period: 'month', quantity: 1, starts_at: new Date() },
    users: [{ name: '', email: '', role: null, password: '', password_confirmation: '' }]
});

const schema = accountSchema;
const resolver = zodResolver(schema);

const currentSubtitle = computed(() => {
    const subtitles: Record<string, string> = {
        '1': t('account.form.step1_subtitle'),
        '2': t('account.form.step2_subtitle'),
        '3': t('account.form.step3_subtitle'),
        '4': t('account.form.step4_subtitle'),
        '5': t('account.form.step5_subtitle')
    };
    return subtitles[activeStep.value] || '';
});

const stepFields: Record<string, string[]> = {
    '1': ['legal_name', 'trade_name', 'rc_number', 'nif', 'nis', 'rib'],
    '2': ['addresses'],
    '3': ['contacts'],
    '4': ['subscription'],
    '5': ['users']
};

const stepLabels = computed(() => [t('account.steps.info'), t('account.steps.addresses'), t('account.steps.contacts'), t('account.steps.plans'), t('account.steps.staff')]);

const getStepPt = (stepIndex: number) => {
    const currentStep = Number(activeStep.value);
    const isCompleted = stepIndex < currentStep;
    const isActive = stepIndex === currentStep;

    return {
        header: { class: 'flex-col gap-2 text-lg font-bold' },
        number: {
            class: [
                'w-10 h-10 text-sm font-semibold shadow-none',
                isCompleted ? 'border-cyan-500 text-cyan-500 bg-transparent dark:border-cyan-400 dark:text-cyan-400' : '',
                isActive ? 'border-transparent text-white' : '',
                !isCompleted && !isActive ? 'border-surface-300 text-surface-400 bg-transparent dark:border-surface-600 dark:text-surface-500 dark:bg-transparent' : ''
            ],
            style: isActive ? { background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)' } : {}
        },
        title: {
            class: ['font-semibold', isActive ? 'text-primary dark:text-primary-400' : 'text-surface-400 dark:text-surface-500']
        }
    };
};

const validateCurrentStep = (): boolean => {
    const fields = stepFields[activeStep.value] || [];
    const result = validate(schema, record.value);

    if (result.ok) {
        authStore.clearErrors(fields);
        return true;
    }

    const stepErrors: Record<string, string[]> = {};
    let hasStepErrors = false;

    for (const [key, messages] of Object.entries(result.errors)) {
        if (fields.some((field) => key === field || key.startsWith(field + '.'))) {
            stepErrors[key] = messages;
            hasStepErrors = true;
        }
    }

    if (hasStepErrors) {
        authStore.errors = { ...authStore.errors, ...stepErrors };
        return false;
    }

    authStore.clearErrors(fields);
    return true;
};

const goToStep = (targetStep: string) => {
    if (targetStep === activeStep.value) return;

    if (validateCurrentStep()) {
        activeStep.value = targetStep;
    }
};

const onStepChange = (newStep: string | number) => {
    const targetStep = String(newStep);
    if (targetStep === activeStep.value) return;

    if (validateCurrentStep()) {
        activeStep.value = targetStep;
    } else {
        // PrimeVue internally sets d_value before emitting, reset it
        nextTick(() => {
            if (stepperRef.value) {
                stepperRef.value.d_value = activeStep.value;
            }
        });
    }
};

const onFormSubmit = ({ valid }: any) => {
    if (!valid) return;

    loading.startFormSending();

    const serviceAction = isEdit.value ? (data: any) => useAccountService.updateAccount(record.value.id, data) : useAccountService.storeAccount;

    serviceAction(record.value)
        .then(() => {
            showToast('success', isEdit.value ? ACTIONS.EDIT : ACTIONS.CREATE, 'account', 'tc');
            router.push({ name: 'accounts' });
        })
        .catch((error: any) => {
            if (error?.response?.status === 422 && error?.response?.data?.errors) {
                const serverErrors: Record<string, string[]> = error.response.data.errors;
                authStore.errors = serverErrors;

                // Navigate to the first step that has an error
                const errorKeys = Object.keys(serverErrors);
                for (const [step, fields] of Object.entries(stepFields)) {
                    const hasError = errorKeys.some((errKey) => fields.some((field) => errKey === field || errKey.startsWith(field + '.')));
                    if (hasError) {
                        activeStep.value = step;
                        break;
                    }
                }
            } else {
                showToast('error', isEdit.value ? ACTIONS.EDIT : ACTIONS.CREATE, 'account', 'tc');
            }
        })
        .finally(() => {
            loading.stopFormSending();
        });
};

function goBack() {
    router.push({ name: 'accounts' });
}

async function loadAccount() {
    if (!isEdit.value) return;

    try {
        loading.startDataLoading();
        const response = await useAccountService.getAccount(Number(route.params.id));
        record.value = response.data;

        // Convert starts_at string to Date object for DatePicker
        if (record.value.subscription?.starts_at) {
            record.value.subscription.starts_at = new Date(record.value.subscription.starts_at);
        }

        // Convert address region/city objects to IDs for Select components
        if (record.value.addresses) {
            record.value.addresses = record.value.addresses.map((addr: any) => ({
                ...addr,
                region: addr.region?.id ?? addr.region,
                city: addr.city?.id ?? addr.city
            }));
        }

        formKey.value++;
    } catch (error) {
        console.error('Error loading account:', error);
        showToast('error', ACTIONS.EDIT, 'account', 'tc');
    } finally {
        loading.stopDataLoading();
    }
}

onMounted(async () => {
    await loadAccount();
    isLoading.value = false;
    loading.stopPageLoading();
});
</script>

<template>
    <div>
        <!-- Page Header with back arrow -->
        <FormHeader
            :title="isEdit ? t('common.titles.edit', { entity: t('entity.account') }) : t('common.titles.add', { entity: t('entity.account') })"
            :description="currentSubtitle"
            :icon="isEdit ? 'pi pi-id-card' : 'pi pi-plus-circle'"
            iconColor="#8B5CF6"
            class="mb-6"
        />

        <!-- Loading Skeleton -->
        <div v-if="isLoading" class="flex flex-col gap-6">
            <div class="card">
                <!-- Stepper Skeleton -->
                <div class="flex items-center justify-between mb-8">
                    <Skeleton v-for="n in 5" :key="n" width="80px" height="80px" shape="circle" />
                </div>
                <!-- Fields Skeleton -->
                <Skeleton height="48px" class="w-full mb-6" />
                <Skeleton height="48px" class="w-full mb-6" />
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Skeleton height="48px" class="w-full" />
                    <Skeleton height="48px" class="w-full" />
                    <Skeleton height="48px" class="w-full" />
                    <Skeleton height="48px" class="w-full" />
                </div>
                <!-- Active status skeleton -->
                <div class="flex items-center justify-between py-3 px-4 bg-surface-50 dark:bg-surface-800 rounded-xl">
                    <div class="flex items-center gap-3">
                        <Skeleton width="24px" height="24px" shape="circle" />
                        <div>
                            <Skeleton width="100px" height="16px" class="mb-1" />
                            <Skeleton width="220px" height="12px" />
                        </div>
                    </div>
                    <Skeleton width="44px" height="24px" borderRadius="16px" />
                </div>
            </div>
        </div>

        <!-- Actual Form -->
        <PForm v-else :key="formKey" v-slot="$form" :initialValues="record" :resolver="resolver" :validateOnBlur="true" @submit="onFormSubmit">
            <div class="card">
                <Stepper
                    ref="stepperRef"
                    :value="activeStep"
                    @update:value="onStepChange"
                    :pt="{
                        separator: {
                            style: {
                                background: 'none',
                                height: '0',
                                borderTop: '2px dashed transparent',
                                borderImage: 'linear-gradient(90deg, #06b6d4, #8b5cf6) 1'
                            }
                        }
                    }"
                >
                    <StepList>
                        <Step v-for="(stepLabel, index) in stepLabels" :key="index + 1" :value="String(index + 1)" :pt="getStepPt(index + 1)">
                            {{ stepLabel }}
                        </Step>
                    </StepList>
                    <StepPanels>
                        <StepPanel value="1">
                            <Information v-model="record" />
                            <div class="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
                                <Button :label="t('common.labels.cancel')" severity="secondary" outlined @click="goBack" :disabled="loading.isFormSending" />
                                <Button :label="t('common.labels.next_step')" icon="pi pi-arrow-right" iconPos="right" @click="goToStep('2')" :disabled="loading.isFormSending" />
                            </div>
                        </StepPanel>
                        <StepPanel value="2">
                            <Addresses v-model="record" />
                            <div class="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
                                <Button :label="t('common.labels.previous_step')" icon="pi pi-arrow-left" severity="secondary" outlined @click="goToStep('1')" :disabled="loading.isFormSending" />
                                <Button :label="t('common.labels.next_step')" icon="pi pi-arrow-right" iconPos="right" @click="goToStep('3')" :disabled="loading.isFormSending" />
                            </div>
                        </StepPanel>
                        <StepPanel value="3">
                            <Contacts v-model="record" />
                            <div class="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
                                <Button :label="t('common.labels.previous_step')" icon="pi pi-arrow-left" severity="secondary" outlined @click="goToStep('2')" :disabled="loading.isFormSending" />
                                <Button :label="t('common.labels.next_step')" icon="pi pi-arrow-right" iconPos="right" @click="goToStep('4')" :disabled="loading.isFormSending" />
                            </div>
                        </StepPanel>
                        <StepPanel value="4">
                            <PlanSelection v-model="record" />
                            <div class="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
                                <Button :label="t('common.labels.previous_step')" icon="pi pi-arrow-left" severity="secondary" outlined @click="goToStep('3')" :disabled="loading.isFormSending" />
                                <Button :label="t('common.labels.next_step')" icon="pi pi-arrow-right" iconPos="right" @click="goToStep('5')" :disabled="loading.isFormSending" />
                            </div>
                        </StepPanel>
                        <StepPanel value="5">
                            <StaffUsers v-model="record" />
                            <div class="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
                                <Button :label="t('common.labels.previous_step')" icon="pi pi-arrow-left" severity="secondary" outlined @click="goToStep('4')" :disabled="loading.isFormSending" />
                                <Button
                                    type="submit"
                                    :label="isEdit ? t('common.labels.edit_entity', { entity: t('entity.account') }) : t('account.staff.complete_onboarding')"
                                    :icon="isEdit ? 'pi pi-pencil' : 'pi pi-check-circle'"
                                    :loading="loading.isFormSending"
                                />
                            </div>
                        </StepPanel>
                    </StepPanels>
                </Stepper>
            </div>
        </PForm>
    </div>
</template>
