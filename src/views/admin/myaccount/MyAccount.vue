<script setup lang="ts">
import { useFileableService } from '@/services/useFileableService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { useQuotaStore } from '@/stores/useQuotaStore';
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
const quotaStore = useQuotaStore();

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

const onFormSubmit = ({ valid, values }: { valid: boolean; values: Record<string, any> }): void => {
    if (valid) {
        isUploading.value = true;
        loading.startPageLoading();
        useFileableService
            .uploadProfilePicture(values.file as File)
            .then((response: UploadProfilePictureResponse) => {
                if (authStore.user) {
                    authStore.user.profile_image = response.profile_image;
                }

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

// Plan usage resources to display
const planResources = [
    { key: 'orders', icon: 'pi pi-shopping-cart', color: 'from-cyan-400 to-blue-500' },
    { key: 'users', icon: 'pi pi-users', color: 'from-violet-400 to-purple-500' },
    { key: 'shops', icon: 'pi pi-shop', color: 'from-emerald-400 to-teal-500' },
    { key: 'products', icon: 'pi pi-box', color: 'from-amber-400 to-orange-500' }
];

onMounted(async () => {
    await authStore.fetchUser();
    if (!quotaStore.loaded) quotaStore.fetchQuotas();
    loading.stopPageLoading();
});
</script>
<template>
    <div v-if="user" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-sm font-bold text-slate-800 dark:text-white">{{ t('myaccount.labels.plan_usage') }}</h3>
                    <Tag v-if="user.account?.plan?.name" :value="user.account.plan.name" severity="info" size="small" />
                </div>
                <div class="space-y-4">
                    <div v-for="res in planResources" :key="res.key">
                        <div class="flex justify-between items-center mb-2">
                            <span class="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                                <i :class="res.icon" class="text-xs text-slate-400"></i>
                                {{ t(`entity.${res.key}`) }}
                            </span>
                            <span class="text-xs font-semibold" :class="quotaStore.getStatus(res.key) === 'danger' ? 'text-red-500' : quotaStore.getStatus(res.key) === 'warning' ? 'text-amber-500' : 'text-slate-500'">
                                {{ quotaStore.getUsage(res.key) }} / {{ quotaStore.getLimit(res.key) !== null ? quotaStore.getLimit(res.key) : '∞' }}
                            </span>
                        </div>
                        <div class="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                class="h-full rounded-full transition-all duration-500 bg-gradient-to-r"
                                :class="[quotaStore.getStatus(res.key) === 'danger' ? 'from-red-400 to-red-500' : quotaStore.getStatus(res.key) === 'warning' ? 'from-amber-400 to-orange-500' : res.color]"
                                :style="{ width: (quotaStore.getLimit(res.key) !== null ? quotaStore.getPercentage(res.key) : 0) + '%' }"
                            ></div>
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

    <!-- Skeleton Loading State -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Panel Skeleton -->
        <div class="space-y-6">
            <!-- Profile Card Skeleton -->
            <div class="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                <div class="flex flex-col items-center">
                    <Skeleton shape="circle" size="6rem" />
                    <Skeleton width="10rem" height="1.25rem" class="mt-4" />
                    <Skeleton width="7rem" height="0.85rem" class="mt-2" />
                    <div class="flex gap-2 mt-3">
                        <Skeleton width="5rem" height="1.5rem" borderRadius="9999px" />
                        <Skeleton width="4rem" height="1.5rem" borderRadius="9999px" />
                    </div>
                    <div class="w-full h-px bg-surface-200 dark:bg-surface-700 my-5"></div>
                    <div class="w-full space-y-3">
                        <div class="flex items-center gap-3">
                            <Skeleton width="1rem" height="1rem" shape="circle" />
                            <Skeleton width="4rem" height="0.75rem" />
                            <Skeleton width="8rem" height="0.75rem" />
                        </div>
                        <div class="flex items-center gap-3">
                            <Skeleton width="1rem" height="1rem" shape="circle" />
                            <Skeleton width="4rem" height="0.75rem" />
                            <Skeleton width="12rem" height="0.75rem" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Plan Usage Card Skeleton -->
            <div class="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                <Skeleton width="8rem" height="0.85rem" class="mb-4" />
                <div class="space-y-4">
                    <div v-for="i in 5" :key="i">
                        <div class="flex justify-between items-center mb-2">
                            <Skeleton width="4rem" height="0.7rem" />
                            <Skeleton width="5rem" height="0.7rem" />
                        </div>
                        <Skeleton height="0.375rem" borderRadius="9999px" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Panel Skeleton -->
        <div class="lg:col-span-2 space-y-6">
            <!-- Tabs Card Skeleton -->
            <div class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                <div class="flex gap-1 px-4 pt-4 border-b border-surface-200 dark:border-surface-700">
                    <Skeleton v-for="i in 5" :key="i" :width="i === 5 ? '6rem' : '8rem'" height="2.25rem" borderRadius="8px 8px 0 0" />
                </div>
                <div class="p-6 space-y-6">
                    <div class="space-y-4">
                        <Skeleton height="3rem" class="w-full" />
                        <Skeleton height="3rem" class="w-full" />
                        <Skeleton height="3rem" class="w-1/2" />
                    </div>
                    <Skeleton width="7rem" height="2.25rem" borderRadius="8px" />
                </div>
            </div>

            <!-- Status Cards Row Skeleton -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="i in 2" :key="i" class="bg-white dark:bg-surface-800 rounded-2xl p-5 border border-surface-200 dark:border-surface-700">
                    <div class="flex items-start gap-4">
                        <Skeleton width="3rem" height="3rem" shape="circle" />
                        <div class="flex-1">
                            <Skeleton width="8rem" height="0.85rem" class="mb-2" />
                            <Skeleton width="12rem" height="0.7rem" class="mb-3" />
                            <Skeleton width="100%" height="0.7rem" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
