<script setup lang="ts">
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { accountSchema } from '@/validations/account';
import { validateField } from '@/validations/validate';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const authStore = useAuthStore();
const loading = useLoading();
const schema = accountSchema;

const record = defineModel<any>({ required: true });

const onBlurField = (path: string) => {
    const { ok, errors } = validateField(schema, record.value, path);
    if (ok) {
        authStore.clearErrors([path]);
    } else {
        authStore.errors = { ...authStore.errors, ...errors };
    }
};
</script>

<template>
    <div class="flex flex-col gap-6">
        <div class="grid grid-cols-2 gap-4">
            <!-- Legal Name -->
            <div class="col-span-2">
                <FloatLabel variant="on" class="w-full">
                    <IconField>
                        <InputIcon class="pi pi-building" />
                        <InputText
                            id="legal_name"
                            v-model="record.legal_name"
                            :disabled="loading.isFormSending"
                            autofocus
                            class="w-full"
                            maxlength="150"
                            :invalid="authStore.errors?.['legal_name']?.[0] ? true : false"
                            @input="() => authStore.clearErrors(['legal_name'])"
                            @blur="() => onBlurField('legal_name')"
                        />
                    </IconField>
                    <label for="legal_name">{{ t('account.columns.legal_name') }} *</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['legal_name']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['legal_name']?.[0]) }}
                </Message>
            </div>

            <!-- Trade Name -->
            <div class="col-span-2">
                <FloatLabel variant="on" class="w-full">
                    <IconField>
                        <InputIcon class="pi pi-tag" />
                        <InputText
                            id="trade_name"
                            v-model="record.trade_name"
                            :disabled="loading.isFormSending"
                            class="w-full"
                            maxlength="150"
                            :invalid="authStore.errors?.['trade_name']?.[0] ? true : false"
                            @input="() => authStore.clearErrors(['trade_name'])"
                            @blur="() => onBlurField('trade_name')"
                        />
                    </IconField>
                    <label for="trade_name">{{ t('account.columns.trade_name') }}</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['trade_name']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['trade_name']?.[0]) }}
                </Message>
            </div>

            <!-- RC Number -->
            <div class="col-span-1">
                <FloatLabel variant="on" class="w-full">
                    <IconField>
                        <InputIcon class="pi pi-id-card" />
                        <InputText
                            id="rc_number"
                            v-model="record.rc_number"
                            :disabled="loading.isFormSending"
                            class="w-full"
                            maxlength="30"
                            :invalid="authStore.errors?.['rc_number']?.[0] ? true : false"
                            @input="() => authStore.clearErrors(['rc_number'])"
                            @blur="() => onBlurField('rc_number')"
                        />
                    </IconField>
                    <label for="rc_number">{{ t('account.columns.rc_number') }}</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['rc_number']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['rc_number']?.[0]) }}
                </Message>
            </div>

            <!-- NIF -->
            <div class="col-span-1">
                <FloatLabel variant="on" class="w-full">
                    <IconField>
                        <InputIcon class="pi pi-file" />
                        <InputText
                            id="nif"
                            v-model="record.nif"
                            :disabled="loading.isFormSending"
                            class="w-full"
                            maxlength="30"
                            :invalid="authStore.errors?.['nif']?.[0] ? true : false"
                            @input="() => authStore.clearErrors(['nif'])"
                            @blur="() => onBlurField('nif')"
                        />
                    </IconField>
                    <label for="nif">{{ t('account.columns.nif') }}</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['nif']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['nif']?.[0]) }}
                </Message>
            </div>

            <!-- NIS -->
            <div class="col-span-1">
                <FloatLabel variant="on" class="w-full">
                    <IconField>
                        <InputIcon class="pi pi-shield" />
                        <InputText
                            id="nis"
                            v-model="record.nis"
                            :disabled="loading.isFormSending"
                            class="w-full"
                            maxlength="30"
                            :invalid="authStore.errors?.['nis']?.[0] ? true : false"
                            @input="() => authStore.clearErrors(['nis'])"
                            @blur="() => onBlurField('nis')"
                        />
                    </IconField>
                    <label for="nis">{{ t('account.columns.nis') }}</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['nis']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['nis']?.[0]) }}
                </Message>
            </div>

            <!-- RIB -->
            <div class="col-span-1">
                <FloatLabel variant="on" class="w-full">
                    <IconField>
                        <InputIcon class="pi pi-credit-card" />
                        <InputText
                            id="rib"
                            v-model="record.rib"
                            :disabled="loading.isFormSending"
                            class="w-full"
                            maxlength="30"
                            :invalid="authStore.errors?.['rib']?.[0] ? true : false"
                            @input="() => authStore.clearErrors(['rib'])"
                            @blur="() => onBlurField('rib')"
                        />
                    </IconField>
                    <label for="rib">{{ t('account.columns.rib') }}</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['rib']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['rib']?.[0]) }}
                </Message>
            </div>
        </div>

        <!-- Active Status toggle -->
        <div class="flex items-center justify-between py-3 px-4 bg-surface-50 dark:bg-surface-800 rounded-xl">
            <div class="flex items-center gap-3">
                <i class="pi pi-check-circle text-lg text-primary" />
                <div>
                    <p class="text-sm font-semibold text-surface-900 dark:text-white">{{ t('account.labels.active_status') }}</p>
                    <p class="text-xs text-surface-500 dark:text-surface-400">{{ t('account.labels.active_status_hint') }}</p>
                </div>
            </div>
            <ToggleSwitch v-model="record.active" :disabled="loading.isFormSending" />
        </div>
    </div>
</template>
