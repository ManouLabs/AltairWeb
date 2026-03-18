<script setup lang="ts">
/**
 * CustomerCard — Reusable customer info display
 *
 * Sizes:
 * - sm: compact row for DataTable columns (avatar + name + phone/email inline + reputation bar)
 * - md: card for sidebars (avatar + status dot + name + contact details + reputation + address)
 * - lg: full card for forms (avatar + status dot + name + close btn + contact + reputation + address)
 */
import InitialsAvatar from '@/components/common/InitialsAvatar.vue';
import ReputationBadge from '@/components/common/ReputationBadge.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = withDefaults(
    defineProps<{
        /** Customer object from the API */
        customer: {
            id?: number;
            name: string;
            phone?: string | null;
            email?: string | null;
            status?: string | null;
            reputation?: any;
            addresses?: any[];
            contactMethods?: any[];
        };
        /** Display size variant */
        size?: 'sm' | 'md' | 'lg';
        /** Show close/remove button (lg size) */
        closable?: boolean;
    }>(),
    {
        size: 'md',
        closable: false
    }
);

const emit = defineEmits<{
    close: [];
}>();

function getPhone(): string | null {
    if (props.customer.phone) return props.customer.phone;
    const methods = props.customer.contactMethods || [];
    const m = methods.find((c: any) => c.type === 'mobile' || c.type === 'phone');
    return m?.value ?? null;
}

function getEmail(): string | null {
    if (props.customer.email) return props.customer.email;
    const methods = props.customer.contactMethods || [];
    const m = methods.find((c: any) => c.type === 'email');
    return m?.value ?? null;
}

function getAddress(): string | null {
    if (!props.customer.addresses?.length) return null;
    const addr = props.customer.addresses[0];
    const parts = [addr.street, addr.city?.name, addr.region?.name].filter(Boolean);
    return parts.length ? parts.join(', ') : null;
}
</script>

<template>
    <!-- SM: compact row for DataTable -->
    <div v-if="size === 'sm'" class="customer-card-sm">
        <div class="flex items-start gap-2.5">
            <InitialsAvatar :name="customer.name" size="sm" class="mt-0.5" />
            <div class="flex-1 min-w-0">
                <span class="font-semibold text-sm text-surface-800 dark:text-surface-100 truncate block">{{ customer.name }}</span>
                <div class="flex items-center gap-2 text-[10px] text-surface-400 mt-0.5">
                    <span v-if="getPhone()" class="flex items-center gap-0.5">
                        <i class="pi pi-phone text-[9px]"></i> {{ getPhone() }}
                    </span>
                    <span v-if="getEmail()" class="flex items-center gap-0.5 truncate">
                        <i class="pi pi-envelope text-[9px]"></i> {{ getEmail() }}
                    </span>
                </div>
            </div>
        </div>
        <div class="mt-1">
            <ReputationBadge :reputation="customer.reputation" size="sm" />
        </div>
        <div v-if="getAddress()" class="flex items-center gap-1 text-[10px] text-surface-400 mt-0.5">
            <i class="pi pi-map-marker text-[9px]"></i>
            <span class="truncate">{{ getAddress() }}</span>
        </div>
    </div>

    <!-- MD: card for sidebars (QuickView, Exchange) -->
    <div v-else-if="size === 'md'" class="customer-card-md">
        <!-- Header: avatar + name -->
        <div class="flex items-center gap-3 mb-3">
            <div class="relative">
                <InitialsAvatar :name="customer.name" size="lg" />
                <span
                    class="absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-surface-900 rounded-full"
                    :class="customer.status === 'blocked' ? 'bg-red-500' : 'bg-green-500'"
                ></span>
            </div>
            <span class="font-bold text-surface-800 dark:text-surface-100">{{ customer.name }}</span>
        </div>

        <!-- Body: Contact Info (left) + Reputation (right) -->
        <div class="flex items-start gap-6">
            <!-- Left: Contact Info -->
            <div class="flex-1 flex flex-col gap-2 text-xs text-surface-600 dark:text-surface-300">
                <div v-if="getPhone()" class="flex items-center gap-2">
                    <i class="pi pi-phone text-surface-400 text-[11px]"></i>
                    <span>{{ getPhone() }}</span>
                </div>
                <div v-if="getEmail()" class="flex items-center gap-2">
                    <i class="pi pi-envelope text-surface-400 text-[11px]"></i>
                    <span>{{ getEmail() }}</span>
                </div>
            </div>

            <!-- Right: Reputation -->
            <div v-if="customer.reputation" class="w-1/2">
                <ReputationBadge :reputation="customer.reputation" size="md" />
            </div>
        </div>

        <!-- Address -->
        <div v-if="getAddress()" class="flex items-center gap-2 text-xs text-surface-400 mt-3">
            <i class="pi pi-map-marker text-[11px]"></i>
            <span>{{ getAddress() }}</span>
        </div>
    </div>

    <!-- LG: full card for forms (with close button, bg container) -->
    <div v-else class="customer-card-lg p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
        <Message v-if="customer.status === 'blocked'" severity="warn" icon="pi pi-exclamation-triangle" :closable="false" class="mb-4">
            {{ t('order.labels.blocked_customer_warning') }}
        </Message>

        <!-- Header: avatar + name + close -->
        <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
                <div class="relative">
                    <InitialsAvatar :name="customer.name" size="lg" />
                    <span
                        class="absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-surface-800 rounded-full"
                        :class="customer.status === 'blocked' ? 'bg-red-500' : 'bg-green-500'"
                    ></span>
                </div>
                <span class="font-bold text-surface-800 dark:text-surface-100">{{ customer.name }}</span>
            </div>
            <Button v-if="closable" icon="pi pi-times" text rounded size="small" severity="secondary" @click="emit('close')" />
        </div>

        <!-- Body: Contact Info (left) + Reputation (right) -->
        <div class="flex items-start gap-6">
            <!-- Left: Contact Info -->
            <div class="flex-1 flex flex-col gap-2 text-xs text-surface-600 dark:text-surface-300">
                <div v-if="getPhone()" class="flex items-center gap-2">
                    <i class="pi pi-phone text-surface-400 text-[11px]"></i>
                    <span>{{ getPhone() }}</span>
                </div>
                <div v-if="getEmail()" class="flex items-center gap-2">
                    <i class="pi pi-envelope text-surface-400 text-[11px]"></i>
                    <span>{{ getEmail() }}</span>
                </div>
            </div>

            <!-- Right: Reputation -->
            <div v-if="customer.reputation" class="w-1/2">
                <ReputationBadge :reputation="customer.reputation" size="md" />
            </div>
        </div>

        <!-- Address -->
        <div v-if="getAddress()" class="flex items-center gap-2 text-xs text-surface-400 mt-3">
            <i class="pi pi-map-marker text-[11px]"></i>
            <span>{{ getAddress() }}</span>
        </div>
    </div>
</template>
