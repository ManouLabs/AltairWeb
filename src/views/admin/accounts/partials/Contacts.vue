<script setup lang="ts">
import Contact from '@/components/Contact.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineModel<any>({ required: true });
</script>

<template>
    <div class="flex flex-col gap-6">
        <h3 class="text-lg font-bold text-surface-900 dark:text-white">{{ t('account.labels.account_contacts') }}</h3>
        <Contact v-model="modelValue.contacts" />
    </div>
</template>
