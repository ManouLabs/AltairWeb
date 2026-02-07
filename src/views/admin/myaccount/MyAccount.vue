<script setup lang="ts">
import { useFileableService } from '@/services/useFileableService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import type { UploadProfilePictureResponse } from '@/types/myaccount';

import { zodResolver } from '@primevue/forms/resolvers/zod';
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { z } from 'zod';
import Activity from './partials/Activity.vue';
import DangerZone from './partials/DangerZone.vue';
import MyInformations from './partials/MyInformations.vue';
import Preferences from './partials/Preferences.vue';
import Security from './partials/Security.vue';

const { t } = useI18n();

const formRef = ref<any>(null);
const authStore = useAuthStore();

const loading = useLoading();
const user = computed(() => authStore.user);
const { showToast } = useShowToast();
const isUploading = ref<boolean>(false);

const initialValues = reactive<{ file: File | null }>({
    file: null
});

function onFileChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file && !isUploading.value) {
        formRef.value.setFieldValue('file', file);
        formRef.value.submit();
    }
}
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const resolver = zodResolver(
    z.object({
        file: z
            .any()
            .refine((file) => file instanceof File && file.size <= MAX_FILE_SIZE, { message: 'common.messages.max_image_size', path: ['file'] })
            .refine((file) => file instanceof File && ACCEPTED_IMAGE_TYPES.includes(file.type), { message: 'common.messages.image_type', path: ['file'] })
    })
);

interface FormSubmitEvent {
    valid: boolean;
    values: { file: File };
}

const onFormSubmit = ({ valid, values }: FormSubmitEvent): void => {
    if (valid) {
        isUploading.value = true;
        loading.startPageLoading();
        useFileableService
            .uploadProfilePicture(values.file)
            .then((response: UploadProfilePictureResponse) => {
                authStore.user.profile_image = response.profile_image;

                showToast('success', ACTIONS.EDIT, 'profile_image', 'tc');
            })
            .catch((error: any) => {
                authStore.processError(error, t('common.messages.error_occurred'));
            })
            .finally(() => {
                isUploading.value = false;
                loading.stopPageLoading();
            });
    }
};

// Helper to calculate usage percentage
function getUsagePercent(current: number | undefined, max: number | undefined): number {
    if (!current || !max) return 0;
    return Math.min(Math.round((current / max) * 100), 100);
}

onMounted(() => {
    authStore.fetchUser();
});
</script>
<template>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Profile Panel -->
        <div class="space-y-6">
            <!-- Profile Card -->
            <div class="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                <div class="flex flex-col items-center">
                    <!-- Avatar -->
                    <Form ref="formRef" :validateOnBlur="true" :initialValues="initialValues" :resolver="resolver" @submit="onFormSubmit">
                        <FormField v-slot="$field" name="file" class="relative">
                            <div class="w-24 h-24 relative">
                                <!-- Loading overlay -->
                                <div v-if="isUploading" class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center z-10">
                                    <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="4" />
                                </div>
                                <img v-if="user.profile_image" :src="user.profile_image" alt="Profile" class="w-full h-full object-cover rounded-full border-4 border-white shadow-lg" />
                                <div v-else class="w-full h-full rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
                                    <i class="pi pi-user text-3xl text-slate-600"></i>
                                </div>
                                <label
                                    class="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
                                    :class="{ 'pointer-events-none opacity-50': isUploading }"
                                >
                                    <i class="pi pi-camera text-slate-600 text-xs"></i>
                                    <input type="file" accept="image/*" class="hidden" @change="onFileChange" :disabled="isUploading" />
                                </label>
                            </div>
                            <Message v-if="$field.invalid || authStore.errors.file" severity="error" size="small" class="mt-2">
                                {{ $field.error?.message ? t($field.error.message) : authStore.errors?.file?.[0] }}
                            </Message>
                        </FormField>
                    </Form>

                    <!-- Name & Role -->
                    <h2 class="text-lg font-bold text-slate-800 dark:text-white mt-4">{{ user.name }}</h2>
                    <p class="text-sm text-slate-500 dark:text-slate-400">{{ user.account?.plan?.name || 'Administrator' }}</p>

                    <!-- Role Tags -->
                    <div class="flex flex-wrap justify-center gap-2 mt-3">
                        <span v-for="role in user.roles" :key="role" class="px-3 py-1 text-xs font-medium rounded-full bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300 border border-violet-200 dark:border-violet-700">
                            {{ role }}
                        </span>
                    </div>

                    <!-- Divider -->
                    <div class="w-full h-px bg-slate-200 dark:bg-slate-700 my-5"></div>

                    <!-- Contact Info -->
                    <div class="w-full space-y-3">
                        <div class="flex items-center gap-3 text-sm">
                            <i class="pi pi-user text-slate-400 text-sm"></i>
                            <span class="text-slate-500 dark:text-slate-400">{{ t('myaccount.labels.name') }}:</span>
                            <span class="text-slate-700 dark:text-slate-200 font-medium">{{ user.name }}</span>
                        </div>
                        <div class="flex items-center gap-3 text-sm">
                            <i class="pi pi-envelope text-slate-400 text-sm"></i>
                            <span class="text-slate-500 dark:text-slate-400">{{ t('myaccount.labels.email') }}:</span>
                            <span class="text-slate-700 dark:text-slate-200 font-medium">{{ user.email }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Plan Usage Card -->
            <div class="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                <h3 class="text-sm font-bold text-slate-800 dark:text-white mb-4">{{ t('myaccount.labels.plan_usage') }}</h3>
                <div class="space-y-4">
                    <!-- Orders -->
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-xs font-medium text-slate-600 dark:text-slate-300">{{ t('entity.orders') }}</span>
                            <span class="text-xs text-slate-500">{{ user.account?.usage?.orders || 0 }} / {{ user.account?.plan?.limits?.orders || '∞' }}</span>
                        </div>
                        <div class="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full transition-all" :style="{ width: getUsagePercent(user.account?.usage?.orders, user.account?.plan?.limits?.orders) + '%' }"></div>
                        </div>
                    </div>
                    <!-- Users -->
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-xs font-medium text-slate-600 dark:text-slate-300">{{ t('entity.users') }}</span>
                            <span class="text-xs text-slate-500">{{ user.account?.usage?.users || 0 }} / {{ user.account?.plan?.limits?.users || '∞' }}</span>
                        </div>
                        <div class="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full transition-all" :style="{ width: getUsagePercent(user.account?.usage?.users, user.account?.plan?.limits?.users) + '%' }"></div>
                        </div>
                    </div>
                    <!-- Shops -->
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-xs font-medium text-slate-600 dark:text-slate-300">{{ t('entity.shops') }}</span>
                            <span class="text-xs text-slate-500">{{ user.account?.usage?.shops || 0 }} / {{ user.account?.plan?.limits?.shops || '∞' }}</span>
                        </div>
                        <div class="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full transition-all" :style="{ width: getUsagePercent(user.account?.usage?.shops, user.account?.plan?.limits?.shops) + '%' }"></div>
                        </div>
                    </div>
                    <!-- Products -->
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-xs font-medium text-slate-600 dark:text-slate-300">{{ t('entity.products') }}</span>
                            <span class="text-xs text-slate-500">{{ user.account?.usage?.products || 0 }} / {{ user.account?.plan?.limits?.products || '∞' }}</span>
                        </div>
                        <div class="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full transition-all" :style="{ width: getUsagePercent(user.account?.usage?.products, user.account?.plan?.limits?.products) + '%' }"></div>
                        </div>
                    </div>
                    <!-- Shippers -->
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-xs font-medium text-slate-600 dark:text-slate-300">{{ t('entity.shippers') }}</span>
                            <span class="text-xs text-slate-500">{{ user.account?.usage?.shippers || 0 }} / {{ user.account?.plan?.limits?.shippers || '∞' }}</span>
                        </div>
                        <div class="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full transition-all" :style="{ width: getUsagePercent(user.account?.usage?.shippers, user.account?.plan?.limits?.shippers) + '%' }"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Right Panel: Tabs & Info -->
        <div class="lg:col-span-2 space-y-6">
            <Card>
                <template #content>
                    <Tabs value="0" lazy>
                        <TabList>
                            <Tab value="0"> <i class="pi pi-user mr-2"></i>{{ t('myaccount.tabs.my_informations') }} </Tab>
                            <Tab value="1"> <i class="pi pi-shield mr-2"></i>{{ t('myaccount.tabs.security') }} </Tab>
                            <Tab value="2"> <i class="pi pi-cog mr-2"></i>{{ t('myaccount.tabs.preferences') }} </Tab>
                            <Tab value="3"> <i class="pi pi-history mr-2"></i>{{ t('myaccount.tabs.activity') }} </Tab>
                            <Tab value="4">
                                <span class="text-red-500"><i class="pi pi-exclamation-triangle mr-2"></i>{{ t('myaccount.tabs.danger') }} </span></Tab
                            >
                        </TabList>
                        <TabPanels>
                            <TabPanel value="0">
                                <MyInformations />
                            </TabPanel>
                            <TabPanel value="1">
                                <Security />
                            </TabPanel>
                            <TabPanel value="2">
                                <Preferences />
                            </TabPanel>
                            <TabPanel value="3">
                                <Activity />
                            </TabPanel>
                            <TabPanel value="4">
                                <DangerZone />
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </template>
            </Card>

            <!-- Status Cards Row -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Account Status Card -->
                <div class="bg-white dark:bg-surface-800 rounded-2xl p-5 border border-surface-200 dark:border-surface-700">
                    <div class="flex items-start gap-4">
                        <div class="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                            <i class="pi pi-verified text-emerald-500 text-xl"></i>
                        </div>
                        <div>
                            <h4 class="text-sm font-bold text-slate-800 dark:text-white">{{ t('myaccount.labels.account_status') }}</h4>
                            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                {{ t('myaccount.labels.verified_since') }} {{ user.email_verified_at ? new Date(user.email_verified_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A' }}
                            </p>
                            <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{{ t('myaccount.labels.account_status_description') }}</p>
                        </div>
                    </div>
                </div>

                <!-- Last Login Card -->
                <div class="bg-white dark:bg-surface-800 rounded-2xl p-5 border border-surface-200 dark:border-surface-700">
                    <div class="flex items-start gap-4">
                        <div class="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                            <i class="pi pi-clock text-amber-500 text-xl"></i>
                        </div>
                        <div>
                            <h4 class="text-sm font-bold text-slate-800 dark:text-white">{{ t('myaccount.labels.last_login') }}</h4>
                            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{{ user.last_login_at ? new Date(user.last_login_at).toLocaleString() : t('myaccount.labels.never') }}</p>
                            <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                                <span v-if="user.last_login_ip">{{ t('myaccount.labels.logged_from_ip') }}: {{ user.last_login_ip }}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
