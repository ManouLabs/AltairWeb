<script setup>
import { useAuthStore } from '@/stores/useAuthStore';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import MyInformations from './partials/MyInformations.vue';
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
        <Card>
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

        <!-- Right Panel: Tabs & Info -->
        <div class="lg:col-span-2 space-y-6">
            <Card>
                <template #content>
                    <Tabs value="0" lazy>
                        <TabList>
                            <Tab value="0"> <i class="pi pi-user mr-2"></i>{{ t('common.titles.my_informations') }} </Tab>
                            <Tab value="1"> <i class="pi pi-shield mr-2"></i>{{ t('myaccount.tabs.security') }} </Tab>
                            <Tab value="2"> <i class="pi pi-cog mr-2"></i>{{ t('myaccount.tabs.preferences') }} </Tab>
                            <Tab value="3"> <i class="pi pi-exclamation-triangle mr-2"></i>{{ t('myaccount.tabs.danger') }} </Tab>
                            <Tab value="4"> <i class="pi pi-history mr-2"></i>{{ t('myaccount.tabs.activity') }} </Tab>
                        </TabList>
                        <TabPanels>
                            <TabPanel value="0">
                                <MyInformations :user="user" />
                            </TabPanel>
                            <TabPanel value="1">
                                <Security />
                            </TabPanel>
                            <TabPanel value="2">
                                <p class="m-0">
                                    At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique
                                    sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil
                                    impedit quo minus.
                                </p>
                            </TabPanel>
                            <TabPanel value="3">
                                <p class="m-0">
                                    At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique
                                    sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil
                                    impedit quo minus.
                                </p>
                            </TabPanel>
                            <TabPanel value="4">
                                <p class="m-0">
                                    At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique
                                    sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil
                                    impedit quo minus.
                                </p>
                            </TabPanel>
                            <TabPanel value="4">
                                <div class="space-y-4">
                                    <div class="border p-4 rounded shadow">
                                        <h3 class="font-semibold mb-1">Login from new device</h3>
                                        <p class="text-sm text-gray-600">2025-05-20 14:32 — Chrome on Windows</p>
                                    </div>
                                    <div class="border p-4 rounded shadow">
                                        <h3 class="font-semibold mb-1">Password changed</h3>
                                        <p class="text-sm text-gray-600">2025-05-18 09:15</p>
                                    </div>
                                    <div class="border p-4 rounded shadow">
                                        <h3 class="font-semibold mb-1">Profile updated</h3>
                                        <p class="text-sm text-gray-600">2025-05-15 17:03</p>
                                    </div>
                                </div>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </template>
            </Card>
        </div>
    </div>
</template>
