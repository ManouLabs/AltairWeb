<script setup>
import { useFileableService } from '@/services/useFileableService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';

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

const formRef = ref(null);
const authStore = useAuthStore();

const loading = useLoading();
const user = computed(() => authStore.user);
const { showToast } = useShowToast();
const initialValues = reactive({
    file: null
});

function onFileChange(event) {
    const file = event.target.files?.[0];
    if (file) {
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
const onFormSubmit = ({ valid, values }) => {
    if (valid) {
        loading.startDataLoading();
        useFileableService
            .uploadProfilePicture(values.file)
            .then((response) => {
                authStore.user.profile_image = response.profile_image;

                showToast('success', ACTIONS.EDIT, 'profile_image', 'br');
            })
            .catch((error) => {
                authStore.processError(error, t('common.messages.error_occurred'));
            })
            .finally(() => {
                loading.stopDataLoading();
            });
    }
};

onMounted(() => {
    authStore.fetchUser();
});
</script>
<template>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Profile Panel -->
        <div>
            <Card class="h-auto max-h-none">
                <template #content>
                    <div class="flex flex-col items-center">
                        <Form ref="formRef" :validateOnBlur="true" :initialValues="initialValues" :resolver="resolver" @submit="onFormSubmit">
                            <FormField v-slot="$field" name="file" class="relative w-28 h-28 rounded-s-full">
                                <img v-if="user.profile_image" :src="user.profile_image" alt="Profile" class="w-full h-full object-cover rounded-full border-4 border-white shadow" />
                                <i v-else class="pi pi-user rounded-full border-4 border-white shadow bg-gray-200 flex items-center justify-center h-full text-gray-400"></i>
                                <label class="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow cursor-pointer">
                                    <i class="pi pi-camera text-black text-sm"></i>
                                    <input type="file" accept="image/*" class="hidden" @change="onFileChange" />
                                </label>
                                <Message v-if="$field.invalid || authStore.errors.file" severity="error" size="small">
                                    {{ $field.error?.message ? t($field.error.message) : authStore.errors?.file?.[0] }}
                                </Message>
                            </FormField>
                        </Form>
                        <h2 class="text-xl font-semibold mt-4">{{ user.name }}</h2>
                        <p class="flex flex-wrap gap-2 mt-2">
                            <Tag v-for="role in user.roles" :key="role" :value="role" rounded></Tag>
                        </p>

                        <div class="mt-4 w-full text-sm space-y-1">
                            <p>
                                <strong>{{ t('myaccount.labels.name') }}:</strong> {{ user.name }}
                            </p>
                            <p>
                                <strong>{{ t('myaccount.labels.email') }}:</strong> {{ user.email }}
                            </p>
                        </div>
                    </div>
                </template>
            </Card>
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
        </div>
    </div>
</template>
