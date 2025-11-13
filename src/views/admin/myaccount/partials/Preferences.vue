<script setup>
import { useAuthStore } from '@/stores/useAuthStore';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useLoading } from '@/stores/useLoadingStore';
import { useSettingStore } from '@/stores/useSettingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { z } from 'zod';

const { t } = useI18n();

const authStore = useAuthStore();
const settingsStore = useSettingStore();
const layoutStore = useLayoutStore();
const { showToast } = useShowToast();
const options = [
    {
        label: 'Dark',
        value: 'dark',
        image: '/themes/dark.jpg'
    },
    {
        label: 'Light',
        value: 'light',
        image: '/themes/light.jpg'
    },
    {
        label: 'System',
        value: 'system',
        image: '/themes/system.jpg'
    }
];
const loading = useLoading();

// Locale options & flags
const supportedLocales = ref(import.meta.env.VITE_SUPPORTED_LOCALES ? import.meta.env.VITE_SUPPORTED_LOCALES.split(',') : ['fr', 'en', 'ar']);

const localeFlags = ref(Object.fromEntries(import.meta.env.VITE_LOCALE_FLAGS.split(',').map((item) => item.split(':'))));
const setLocale = (locale) => {
    layoutStore.setLocale(locale);
};

const flagClass = (locale) => `flag flag-${localeFlags.value[locale]} ${layoutStore.locale === 'ar' ? 'ml-2' : 'mr-2'}`;
const initialValues = reactive({
    theme: settingsStore.settings?.theme ?? 'light'
});
const resolver = zodResolver(
    z.object({
        theme: z.string().nonempty({ message: 'common.messages.is_required' })
    })
);
const onFormSubmit = ({ valid, values }) => {
    if (valid) {
        loading.startDataLoading();
        useMyAccountService
            .updatePassword(values)
            .then((response) => {
                showToast('success', ACTIONS.EDIT, 'password', 'br');
            })
            .catch((error) => {
                authStore.processError(error, t('common.messages.error_occurred'));
            })
            .finally(() => {
                loading.stopDataLoading();
            });
    }
};
</script>
<template>
    <div class="px-0 py-10">
        <h2 class="text-xl font-bold text-center md:text-left">{{ t('myaccount.labels.theme_mode') }}</h2>
        <span class="text-gray-400 block text-center md:text-left">{{ t('myaccount.labels.theme_mode_description') }}</span>
        <Form :validateOnBlur="true" :initialValues="initialValues" :resolver="resolver" @submit="onFormSubmit" class="flex flex-col gap-2">
            <FormField v-slot="$field" name="theme" class="w-full mt-6">
                <SelectButton
                    name="theme"
                    v-bind="$field"
                    @input="
                        (val) => {
                            $field.handleChange(val);
                            authStore.clearErrors([$field.name]);
                        }
                    "
                    @change="
                        (val) => {
                            layoutStore.setTheme(val.value);
                        }
                    "
                    :options="options"
                    optionLabel="label"
                    optionValue="value"
                    dataKey="value"
                    :unselectable="false"
                    class="w-full bg-transparent theme-select-button"
                    :allowEmpty="false"
                >
                    <template #option="slotProps">
                        <div
                            class="flex flex-col items-center p-2 rounded-lg w-full"
                            :class="{
                                'border-primary-500 shadow-md border-2': $field.value === slotProps.option.value
                            }"
                        >
                            <img :src="slotProps.option.image" alt="" class="w-64 rounded-md mb-2 object-cover" />
                            <span class="text-sm font-bold">{{ slotProps.option.label }}</span>
                            <i class="pi pi-check absolute bottom-4 left-6 bg-primary-500 rounded-full p-1 text-white" v-if="$field.value === slotProps.option.value"></i>
                        </div>
                    </template>
                </SelectButton>
                <Message v-if="$field.invalid || authStore.errors.theme" severity="error" size="small">
                    {{ $field.error?.message ? t($field.error.message) : authStore.errors?.theme?.[0] }}
                </Message>
            </FormField>
            <Divider />
            <div>
                <h2 class="text-xl font-bold text-center md:text-left">{{ t('myaccount.labels.language') }}</h2>
                <span class="text-gray-400 block text-center md:text-left">{{ t('myaccount.labels.language_description') }}</span>
            </div>

            <FormField v-slot="$field" name="language" class="w-full mt-4 flex items-center justify-center md:justify-start">
                <SelectButton v-model="layoutStore.locale" :options="supportedLocales" :allowEmpty="false" @change="setLocale(layoutStore.locale)">
                    <template #option="slotProps">
                        <div class="flex items-center">
                            <img :alt="slotProps.option" src="https://primefaces.org/cdn/primevue/images/flag/flag_placeholder.png" :class="flagClass(slotProps.option)" style="width: 18px" />
                            <span class="uppercase">{{ slotProps.option }}</span>
                        </div>
                    </template>
                </SelectButton>
                <Message v-if="$field.invalid || authStore.errors.theme" severity="error" size="small">
                    {{ $field.error?.message ? t($field.error.message) : authStore.errors?.theme?.[0] }}
                </Message>
            </FormField>
        </Form>
    </div>
</template>
<style>
.theme-select-button .p-togglebutton,
.theme-select-button .p-togglebutton-checked .p-togglebutton-content,
.theme-select-button .p-togglebutton-checked {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
}
</style>
