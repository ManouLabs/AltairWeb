<script setup>
import { useI18n } from 'vue-i18n';

const props = defineProps({
    active: {
        type: Boolean,
        required: true
    },
    entity: {
        type: String,
        required: true
    },
    loading: {
        type: Boolean,
        default: false
    },
    variant: {
        type: String,
        default: 'button',
        validator: (value) => ['button', 'tag'].includes(value)
    }
});

const emit = defineEmits(['toggle']);

const { t } = useI18n();
</script>

<template>
    <Button
        v-if="variant === 'button'"
        :label="active ? t('common.labels.active') : t('common.labels.inactive')"
        :icon="active ? 'pi pi-check-circle' : 'pi pi-times-circle'"
        :severity="active ? 'success' : 'danger'"
        size="small"
        rounded
        :loading="loading"
        @click="emit('toggle')"
        v-tooltip.top="active ? t('common.tooltips.deactivate', { entity: t(`entity.${entity}`) }) : t('common.tooltips.activate', { entity: t(`entity.${entity}`) })"
    />
    <Tag
        v-else
        :value="active ? t('common.labels.active') : t('common.labels.inactive')"
        :severity="active ? 'success' : 'danger'"
        :icon="active ? 'pi pi-check-circle' : 'pi pi-times-circle'"
        rounded
        size="small"
        :pt="{ root: { class: 'cursor-pointer' } }"
        @click="emit('toggle')"
        v-tooltip.top="active ? t('common.tooltips.deactivate', { entity: t(`entity.${entity}`) }) : t('common.tooltips.activate', { entity: t(`entity.${entity}`) })"
    />
</template>
