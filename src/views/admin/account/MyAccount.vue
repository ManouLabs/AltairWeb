<script setup>
import { useAuthStore } from '@/stores/useAuthStore';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Activity from './partials/Activity.vue';
import DangerZone from './partials/DangerZone.vue';
import MyInformations from './partials/MyInformations.vue';
import Preferences from './partials/Preferences.vue';
import Security from './partials/Security.vue';
const { t } = useI18n();

const profileImage = ref('/default-profile.jpg');
const authStore = useAuthStore();

const user = ref(authStore.user);

const onImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            profileImage.value = e.target.result;
        };
        reader.readAsDataURL(file);
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
                        <div class="relative w-28 h-28">
                            <i class="pi pi-user rounded-full border-4 border-white shadow bg-gray-200 flex items-center justify-center h-full text-5xl text-gray-400"></i>
                            <label class="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow cursor-pointer">
                                <i class="pi pi-camera text-black text-sm"></i>
                                <input type="file" accept="image/*" class="hidden" @change="onImageChange" />
                            </label>
                        </div>
                        <h2 class="text-xl font-semibold mt-4">{{ user.name }}</h2>
                        <p class="text-gray-500">{{ user.roles }}</p>

                        <div class="mt-4 w-full text-sm space-y-1">
                            <p>
                                <b>{{ t('myaccount.labels.name') }}:</b> {{ user.name }}
                            </p>
                            <p>
                                <b>{{ t('myaccount.labels.email') }}:</b> {{ user.email }}
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
