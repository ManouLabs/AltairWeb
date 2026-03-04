<script setup lang="ts">
/**
 * InitialsAvatar — Reusable avatar circle that shows name initials
 * with a deterministic background color based on the name hash.
 *
 * Props:
 *  - name: string to derive initials & color from
 *  - size: 'xs' | 'sm' | 'md' | 'lg' (default 'md')
 *  - shape: 'circle' | 'rounded' (default 'circle')
 */
import { computed } from 'vue';

const props = withDefaults(
    defineProps<{
        name?: string | null;
        size?: 'xs' | 'sm' | 'md' | 'lg';
        shape?: 'circle' | 'rounded';
    }>(),
    {
        name: null,
        size: 'md',
        shape: 'circle'
    }
);

const avatarColors: string[] = ['#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#9333EA'];

function hashString(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = (h << 5) - h + s.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

const initials = computed((): string => {
    if (!props.name) return '??';
    const parts = String(props.name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '??';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
});

const bgColor = computed((): string => {
    const idx = hashString(props.name || '') % avatarColors.length;
    return avatarColors[idx];
});

const sizeClasses: Record<string, string> = {
    xs: 'w-6 h-6 text-[9px]',
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm'
};

const shapeClass = computed(() => (props.shape === 'rounded' ? 'rounded-lg' : 'rounded-full'));
</script>

<template>
    <div class="flex items-center justify-center font-bold flex-shrink-0 text-white select-none" :class="[sizeClasses[size], shapeClass]" :style="{ backgroundColor: bgColor }">
        {{ initials }}
    </div>
</template>
