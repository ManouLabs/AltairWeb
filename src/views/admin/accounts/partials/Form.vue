<script setup>
import Address from '@/components/Address.vue';
import Contact from '@/components/Contact.vue';
import { useAccountService } from '@/services/useAccountService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { accountSchema } from '@/validations/account';
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
const plansOptions = ref([]);

const schema = accountSchema;

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

    loading.startPageLoading();

    const serviceAction = action.value === ACTIONS.CREATE ? useAccountService.storeAccount : (accountData) => useAccountService.updateAccount(record.value.id, accountData);

    serviceAction(record.value)
        .then((response) => {
            dialogRef.value.close({ record: response.data, action: action.value });
        })
        .catch((error) => {
            authStore.processError(error, t('common.messages.error_occurred'));
            showToast('error', action.value, 'account', 'tr');
        })
        .finally(() => {
            loading.stopPageLoading();
        });
};

const closeDialog = () => {
    dialogRef.value.close();
};

onMounted(() => {
    record.value = dialogRef.value.data.record;
    action.value = dialogRef.value.data.action;
    plansOptions.value = dialogRef.value.data.planOptions;
});
</script>
<template>
    <form @submit.prevent="onFormSubmit" class="flex flex-col space-y-4">
        <Stepper value="1">
            <StepList>
                <Step value="1">{{ t('account.steps.information') }}</Step>
                <Step value="2">{{ t('account.steps.contacts') }}</Step>
                <Step value="3">{{ t('account.steps.addresses') }}</Step>
            </StepList>

            <StepPanels>
                <StepPanel v-slot="{ activateCallback }" value="1">
                    <div class="grid grid-cols-2 gap-4 pt-2">
                        <!-- Legal Name -->
                        <div class="col-span-2">
                            <FloatLabel variant="on" class="w-full">
                                <InputText
                                    id="legal_name"
                                    v-model="record.legal_name"
                                    :disabled="loading.isPageLoading"
                                    autofocus
                                    class="w-full"
                                    maxlength="150"
                                    :invalid="authStore.errors?.['legal_name']?.[0] ? true : false"
                                    @input="() => authStore.clearErrors([`legal_name`])"
                                    @blur="() => onBlurField('legal_name')"
                                />
                                <label for="legal_name">{{ t('account.columns.legal_name') }} *</label>
                            </FloatLabel>
                            <Message v-if="authStore.errors?.['legal_name']?.[0]" severity="error" size="small">
                                {{ t(authStore.errors?.['legal_name']?.[0]) }}
                            </Message>
                        </div>

                        <div>
                            <FloatLabel variant="on" class="w-full">
                                <InputText
                                    id="trade_name"
                                    v-model="record.trade_name"
                                    :disabled="loading.isPageLoading"
                                    class="w-full"
                                    maxlength="255"
                                    :invalid="authStore.errors?.['trade_name']?.[0] ? true : false"
                                    @input="() => authStore.clearErrors([`trade_name`])"
                                    @blur="() => onBlurField('trade_name')"
                                />
                                <label for="trade_name">{{ t('account.columns.trade_name') }} *</label>
                            </FloatLabel>
                            <Message v-if="authStore.errors?.['trade_name']?.[0]" severity="error" size="small">
                                {{ t(authStore.errors?.['trade_name']?.[0]) }}
                            </Message>
                        </div>

                        <div>
                            <FloatLabel variant="on" class="w-full">
                                <InputText
                                    id="rc_number"
                                    v-model="record.rc_number"
                                    :disabled="loading.isPageLoading"
                                    class="w-full"
                                    maxlength="25"
                                    :invalid="authStore.errors?.['rc_number']?.[0] ? true : false"
                                    @input="() => authStore.clearErrors([`rc_number`])"
                                    @blur="() => onBlurField('rc_number')"
                                />
                                <label for="rc_number">{{ t('account.columns.rc_number') }}</label>
                            </FloatLabel>
                            <Message v-if="authStore.errors?.['rc_number']?.[0]" severity="error" size="small">
                                {{ t(authStore.errors?.['rc_number']?.[0]) }}
                            </Message>
                        </div>

                        <div>
                            <FloatLabel variant="on" class="w-full">
                                <InputText
                                    id="nif"
                                    v-model="record.nif"
                                    :disabled="loading.isPageLoading"
                                    class="w-full"
                                    maxlength="25"
                                    :invalid="authStore.errors?.['nif']?.[0] ? true : false"
                                    @input="() => authStore.clearErrors([`nif`])"
                                    @blur="() => onBlurField('nif')"
                                />
                                <label for="nif">{{ t('account.columns.nif') }}</label>
                            </FloatLabel>
                            <Message v-if="authStore.errors?.['nif']?.[0]" severity="error" size="small">
                                {{ t(authStore.errors?.['nif']?.[0]) }}
                            </Message>
                        </div>

                        <!-- NIS -->
                        <div>
                            <FloatLabel variant="on" class="w-full">
                                <InputText
                                    id="nis"
                                    v-model="record.nis"
                                    :disabled="loading.isPageLoading"
                                    class="w-full"
                                    maxlength="25"
                                    :invalid="authStore.errors?.['nis']?.[0] ? true : false"
                                    @input="() => authStore.clearErrors([`nis`])"
                                    @blur="() => onBlurField('nis')"
                                />
                                <label for="nis">{{ t('account.columns.nis') }}</label>
                            </FloatLabel>
                            <Message v-if="authStore.errors?.['nis']?.[0]" severity="error" size="small">
                                {{ t(authStore.errors?.['nis']?.[0]) }}
                            </Message>
                        </div>

                        <!-- RIB -->
                        <div>
                            <FloatLabel variant="on" class="w-full">
                                <InputText
                                    id="rib"
                                    v-model="record.rib"
                                    :disabled="loading.isPageLoading"
                                    class="w-full"
                                    maxlength="25"
                                    :invalid="authStore.errors?.['rib']?.[0] ? true : false"
                                    @input="() => authStore.clearErrors([`rib`])"
                                    @blur="() => onBlurField('rib')"
                                />
                                <label for="rib">{{ t('account.columns.rib') }}</label>
                            </FloatLabel>
                            <Message v-if="authStore.errors?.['rib']?.[0]" severity="error" size="small">
                                {{ t(authStore.errors?.['rib']?.[0]) }}
                            </Message>
                        </div>
                        <!-- Plan (model) -->
                        <div class="col-span-2">
                            <FloatLabel variant="on" class="w-full">
                                <Select
                                    id="plan"
                                    v-model="record.plan"
                                    :options="plansOptions"
                                    filter
                                    optionLabel="name"
                                    :disabled="loading.isPageLoading"
                                    class="w-full"
                                    :invalid="authStore.errors?.['plan']?.[0] ? true : false"
                                    @change="() => authStore.clearErrors(['plan'])"
                                    @blur="() => onBlurField('plan')"
                                />
                                <label for="plan">{{ t('account.columns.plan') }}</label>
                            </FloatLabel>
                            <Message v-if="authStore.errors?.['plan']?.[0]" severity="error" size="small">
                                {{ t(authStore.errors?.['plan']?.[0]) }}
                            </Message>
                        </div>
                        <div>
                            <div class="flex items-center gap-3">
                                <ToggleSwitch id="active" v-model="record.active" :class="{ 'p-invalid': authStore.errors?.active }" @change="onBlurField('active')" />
                                <label for="active" class="font-medium">
                                    {{ t('account.columns.active') }}
                                </label>
                            </div>
                            <Message v-if="authStore.errors?.['active']?.[0]" severity="error" size="small">
                                {{ t(authStore.errors?.['active']?.[0]) }}
                            </Message>
                        </div>
                    </div>

                    <div class="flex pt-6 justify-end">
                        <Button label="Next" icon="pi pi-arrow-right" iconPos="right" @click="activateCallback('2')" />
                    </div>
                </StepPanel>

                <StepPanel v-slot="{ activateCallback }" value="2">
                    <div class="grid grid-cols-2 gap-4 pt-2">
                        <div class="col-span-2">
                            <Contact v-model="record.contacts" :disabled="loading.isPageLoading" />
                        </div>
                    </div>
                    <div class="flex pt-6 justify-between">
                        <Button label="Back" severity="secondary" icon="pi pi-arrow-left" @click="activateCallback('1')" />
                        <Button label="Next" icon="pi pi-arrow-right" iconPos="right" @click="activateCallback('3')" />
                    </div>
                </StepPanel>

                <StepPanel v-slot="{ activateCallback }" value="3">
                    <div class="grid grid-cols-2 gap-4 pt-2">
                        <div class="col-span-2">
                            <Address v-model="record.addresses" :disabled="loading.isPageLoading" :regionOptions="[]" :cityOptions="[]" />
                        </div>
                    </div>
                    <div class="pt-6 flex justify-between">
                        <Button label="Back" severity="secondary" icon="pi pi-arrow-left" @click="activateCallback('2')" />
                        <Button label="Save" icon="pi pi-check" @click="onFormSubmit" :loading="loading.isPageLoading" />
                    </div>
                </StepPanel>
            </StepPanels>
        </Stepper>
    </form>
</template>
