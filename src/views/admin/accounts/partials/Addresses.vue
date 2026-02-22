<script setup lang="ts">
import Address from '@/components/Address.vue';

defineModel<any>({ required: true });
</script>

<template>
    <div class="flex flex-col gap-6">
        <Address v-model="modelValue.addresses" :multiple="true" />
    </div>
</template>
