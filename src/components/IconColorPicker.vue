<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const icon = defineModel<string | null>('icon', { default: null });
const iconColor = defineModel<string | null>('iconColor', { default: null });

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
    return commonIcons.filter((ic) => ic.toLowerCase().includes(query));
});

// Accent color options
const accentColors = ['#3B82F6', '#1D4ED8', '#6366F1', '#4F46E5', '#A855F7', '#8B5CF6', '#EC4899', '#D946EF', '#F43F5E', '#E11D48', '#EF4444', '#F97316', '#F59E0B', '#FACC15', '#84CC16', '#10B981', '#059669', '#06B6D4', '#0F172A', '#94A3B8'];
</script>

<template>
    <div class="flex flex-col gap-4 p-5 bg-surface-50 dark:bg-surface-900/40 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-inner">
        <label class="text-sm font-bold text-surface-700 dark:text-surface-200 uppercase tracking-wide">{{ t('common.icon_picker.title') }}</label>

        <!-- Icon Picker -->
        <div class="flex flex-col gap-3">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="iconSearch" :placeholder="t('common.icon_picker.search_icon')" class="w-full !bg-surface-0 dark:!bg-surface-900" />
            </IconField>

            <div class="grid grid-cols-6 gap-2 max-h-[110px] overflow-y-auto p-1 custom-scrollbar pr-2">
                <button
                    v-for="ic in filteredIcons"
                    :key="ic"
                    type="button"
                    class="w-full aspect-square border border-surface-200 dark:border-surface-700 rounded-xl bg-surface-0 dark:bg-surface-800 cursor-pointer transition-all flex items-center justify-center hover:border-primary hover:shadow-sm text-surface-600 dark:text-surface-400 group"
                    :class="{ '!border-primary !bg-primary-50 dark:!bg-primary-900/30 !text-primary !border-2 shadow-sm': icon === ic }"
                    @click="icon = ic"
                >
                    <i :class="ic" class="text-xl group-hover:scale-110 transition-transform"></i>
                </button>
                <div v-if="filteredIcons.length === 0" class="col-span-6 py-6 text-center text-sm text-surface-500 italic">
                    {{ t('common.icon_picker.no_icons_found') }}
                </div>
            </div>
        </div>

        <!-- Accent Colors -->
        <div class="flex flex-col gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
            <span class="text-[10px] font-black uppercase tracking-widest text-surface-500 dark:text-surface-400">{{ t('common.icon_picker.accent_color') }} :</span>
            <div class="grid grid-cols-10 gap-2">
                <button
                    v-for="color in accentColors"
                    :key="color"
                    type="button"
                    class="w-7 h-7 rounded-full border border-surface-200 dark:border-surface-700 cursor-pointer transition-all hover:scale-125 flex items-center justify-center p-0"
                    :class="{ 'ring-2 ring-primary ring-offset-2 dark:ring-offset-surface-900 z-10': iconColor === color }"
                    :style="{ backgroundColor: color }"
                    @click="iconColor = color"
                >
                    <i v-if="iconColor === color" class="pi pi-check text-[9px] text-white"></i>
                </button>
            </div>
        </div>
    </div>
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
