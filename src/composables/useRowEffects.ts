// src/composables/useRowEffects.ts
import { ref, type Ref } from 'vue';

type HighlightType = 'new' | 'updated' | 'deleted' | string;

interface Highlights {
    [id: number | string]: HighlightType;
}

interface RowData {
    id: number | string;
    [key: string]: unknown;
}

interface RowClass {
    'font-bold': boolean;
}

export function useRowEffects() {
    const highlights: Ref<Highlights> = ref({});

    function markHighlight(id: number | string, type: HighlightType, duration: number = 12000): void {
        highlights.value = { ...highlights.value, [id]: type };

        setTimeout(() => {
            if (highlights.value[id] === type) {
                const { [id]: _omit, ...rest } = highlights.value;
                highlights.value = rest;
            }
        }, duration);
    }

    function getRowClass(data: RowData): RowClass {
        return { 'font-bold': !!highlights.value?.[data.id] };
    }

    function clearHighlights(): void {
        highlights.value = {};
    }

    function clearHighlight(id: number | string): void {
        const { [id]: _omit, ...rest } = highlights.value;
        highlights.value = rest;
    }

    return {
        highlights,
        markHighlight,
        getRowClass,
        clearHighlights,
        clearHighlight
    };
}
