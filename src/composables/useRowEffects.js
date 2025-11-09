import { ref } from 'vue';

export function useRowEffects() {
    const highlights = ref({});

    function markHighlight(id, type, duration = 12000) {
        highlights.value = { ...highlights.value, [id]: type };

        setTimeout(() => {
            if (highlights.value[id] === type) {
                const { [id]: _omit, ...rest } = highlights.value;
                highlights.value = rest;
            }
        }, duration);
    }

    function getRowClass(data) {
        return { 'font-bold': !!highlights.value?.[data.id] };
    }

    function clearHighlights() {
        highlights.value = {};
    }

    function clearHighlight(id) {
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
