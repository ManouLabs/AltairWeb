<script setup>
import { useCommitService } from '@/services/useCommitService';
import { formatDate } from '@/utilities/helper';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { inject, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const dialogRef = inject('dialogRef');
const { file } = dialogRef.value.data;
const { t } = useI18n();
const { showToast } = useShowToast();

const loading = ref(false);
const fileContent = ref('');
const fileHistory = ref([]);
const activeTab = ref(0);

onMounted(async () => {
    await loadFileContent();
    await loadFileHistory();
});

async function loadFileContent() {
    try {
        loading.value = true;
        const response = await useCommitService.getFileContent(file.commit_hash, file.file_path);
        fileContent.value = response.content || t('commit.messages.no_content');
    } catch (error) {
        console.error('Error loading file content:', error);
        fileContent.value = t('commit.messages.error_loading_content');
    } finally {
        loading.value = false;
    }
}

async function loadFileHistory() {
    try {
        const response = await useCommitService.getFileHistory(file.file_path);
        fileHistory.value = response.history || [];
    } catch (error) {
        console.error('Error loading file history:', error);
        fileHistory.value = [];
    }
}

function formatCommitHash(hash) {
    return hash ? hash.substring(0, 8) : '';
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            showToast({
                severity: 'success',
                summary: t('common.labels.copy'),
                detail: t('commit.messages.copied_to_clipboard'),
                life: 2000
            });
        })
        .catch((error) => {
            console.error('Failed to copy to clipboard:', error);
            showToast({
                severity: 'error',
                summary: t('common.labels.error'),
                detail: t('commit.messages.copy_failed'),
                life: 3000
            });
        });
}

function close() {
    dialogRef.value.close();
}
</script>

<template>
    <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between p-4 border-b">
            <div class="flex flex-col gap-1">
                <h3 class="text-lg font-semibold m-0">{{ file.file_name }}</h3>
                <p class="text-sm text-gray-600 m-0">{{ file.file_path }}</p>
            </div>
            <Button icon="pi pi-times" text rounded @click="close" />
        </div>

        <TabView v-model:activeIndex="activeTab" class="px-4">
            <TabPanel :header="t('commit.tabs.file_content')">
                <div class="flex flex-col gap-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <code class="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                {{ formatCommitHash(file.commit_hash) }}
                            </code>
                            <span class="text-sm text-gray-600">{{ file.author_name }}</span>
                            <span class="text-sm text-gray-600">•</span>
                            <span class="text-sm text-gray-600">{{ formatDate(file.committed_at) }}</span>
                        </div>
                        <Button icon="pi pi-copy" :label="t('common.labels.copy')" text size="small" @click="copyToClipboard(fileContent)" />
                    </div>

                    <div v-if="loading" class="flex justify-center p-8">
                        <ProgressSpinner />
                    </div>
                    <div v-else class="border rounded p-4 bg-gray-50 dark:bg-gray-900 overflow-auto" style="max-height: 60vh">
                        <pre class="text-sm m-0 whitespace-pre-wrap break-words">{{ fileContent }}</pre>
                    </div>

                    <div class="border-t pt-3">
                        <p class="text-sm font-semibold mb-2">{{ t('commit.labels.commit_message') }}:</p>
                        <p class="text-sm text-gray-700 dark:text-gray-300">{{ file.commit_message }}</p>
                    </div>
                </div>
            </TabPanel>

            <TabPanel :header="t('commit.tabs.file_history')">
                <div v-if="fileHistory.length === 0" class="text-center text-gray-500 p-8">
                    {{ t('commit.messages.no_history') }}
                </div>
                <Timeline v-else :value="fileHistory" align="left" class="customized-timeline">
                    <template #marker="slotProps">
                        <span class="flex w-8 h-8 items-center justify-center text-white rounded-full z-10 shadow-sm bg-primary">
                            <i class="pi pi-code"></i>
                        </span>
                    </template>
                    <template #content="slotProps">
                        <Card class="mb-4">
                            <template #title>
                                <div class="flex items-center gap-2">
                                    <code class="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                        {{ formatCommitHash(slotProps.item.commit_hash) }}
                                    </code>
                                    <Button icon="pi pi-copy" text rounded size="small" @click="copyToClipboard(slotProps.item.commit_hash)" v-tooltip.top="t('common.tooltips.copy')" />
                                </div>
                            </template>
                            <template #subtitle>
                                <div class="flex items-center gap-2 text-sm">
                                    <span>{{ slotProps.item.author_name }}</span>
                                    <span>•</span>
                                    <span>{{ formatDate(slotProps.item.committed_at) }}</span>
                                </div>
                            </template>
                            <template #content>
                                <p class="text-sm">{{ slotProps.item.commit_message }}</p>
                            </template>
                        </Card>
                    </template>
                </Timeline>
            </TabPanel>
        </TabView>

        <div class="flex justify-end gap-2 p-4 border-t">
            <Button :label="t('common.labels.close')" severity="secondary" @click="close" />
        </div>
    </div>
</template>

<style scoped>
:deep(.p-tabview-nav-link) {
    padding: 0.75rem 1rem;
}

:deep(.p-tabview-panels) {
    padding: 1rem 0;
}

:deep(.customized-timeline .p-timeline-event-content) {
    line-height: 1;
}

:deep(.customized-timeline .p-card) {
    margin-top: 0;
}
</style>
