<!-- ErrorMessage.vue -->

<script setup>
import { computed } from 'vue';

const props = defineProps({
    field: String,
    errors: Object
});

const hasError = computed(() => {
    return props.errors && props.errors[props.field];
});

const errorMessage = computed(() => {
    return hasError.value ? props.errors[props.field].join(', ') : '';
});
</script>
<template>
    <small v-if="hasError" class="text-red-600">
        {{ errorMessage }}
    </small>
</template>
