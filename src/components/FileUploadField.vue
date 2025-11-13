<script setup>
import { getMediaName, getMediaUrl, getMimeTypeName, isImageMedia, isVideoMedia, formatFileSize as prettySize } from '@/utilities/media';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
    modelValue: {
        type: [File, Array, String, Object],
        default: null
    },
    label: {
        type: String,
        required: true
    },
    accept: {
        type: String,
        default: 'image/*'
    },
    multiple: {
        type: Boolean,
        default: false
    },
    maxFileSize: {
        type: Number,
        default: 5000000
    },
    maxFiles: {
        type: Number,
        default: 1
    },
    required: {
        type: Boolean,
        default: false
    },
    disabled: {
        type: Boolean,
        default: false
    },
    error: {
        type: String,
        default: null
    },
    placeholder: {
        type: String,
        default: null
    },
    uploadMode: {
        type: String,
        default: 'advanced',
        validator: (value) => ['advanced', 'basic'].includes(value)
    },
    showUploadButton: {
        type: Boolean,
        default: true
    },
    showCancelButton: {
        type: Boolean,
        default: true
    },
    previewWidth: {
        type: Number,
        default: 100
    },
    emitUpdate: {
        type: Boolean,
        default: true
    }
});

const emit = defineEmits(['update:modelValue', 'upload', 'remove', 'error', 'select']);

const fileUploadRef = ref(null);
const uploadedFiles = ref([]);
const hideExisting = ref(false);

const computedPlaceholder = computed(() => {
    return props.placeholder || (props.multiple ? t('common.file_upload.select_files') : t('common.file_upload.select_file'));
});

const isInvalid = computed(() => {
    return !!props.error;
});

watch(
    () => props.modelValue,
    (newValue) => {
        hideExisting.value = false;
        if (newValue) {
            if (Array.isArray(newValue)) {
                uploadedFiles.value = newValue;
            } else if (newValue instanceof File) {
                uploadedFiles.value = [newValue];
            } else if (typeof newValue === 'string') {
                uploadedFiles.value = [];
            } else if (typeof newValue === 'object') {
                uploadedFiles.value = [];
            }
        } else {
            uploadedFiles.value = [];
        }
    },
    { immediate: true }
);

const onSelect = (event) => {
    const files = event.files;

    if (props.multiple) {
        if (props.emitUpdate) emit('update:modelValue', files);
        uploadedFiles.value = files;
    } else {
        const file = files[0];
        if (props.emitUpdate) emit('update:modelValue', file);
        uploadedFiles.value = [file];
    }

    hideExisting.value = true;

    emit('select', event);
};

const onUpload = (event) => {
    emit('upload', event);
};

const onRemove = (event) => {
    const fileToRemove = event.file;

    try {
        const urlApi = typeof window !== 'undefined' ? window.URL || window.webkitURL : undefined;
        const cachedUrl = previewUrlMap.get(fileToRemove);
        if (urlApi?.revokeObjectURL && cachedUrl) {
            urlApi.revokeObjectURL(cachedUrl);
            previewUrlMap.delete(fileToRemove);
        }
    } catch {}

    if (props.multiple) {
        const remainingFiles = uploadedFiles.value.filter((file) => file !== fileToRemove);
        uploadedFiles.value = remainingFiles;
        if (props.emitUpdate) emit('update:modelValue', remainingFiles);
    } else {
        uploadedFiles.value = [];
        if (props.emitUpdate) emit('update:modelValue', null);
    }

    emit('remove', event);
};

const onError = (event) => {
    emit('error', event);
};

const onClear = () => {
    try {
        const urlApi = typeof window !== 'undefined' ? window.URL || window.webkitURL : undefined;
        if (urlApi?.revokeObjectURL) {
            for (const url of previewUrlMap.values()) {
                urlApi.revokeObjectURL(url);
            }
        }
    } catch {}
    previewUrlMap.clear();

    uploadedFiles.value = [];
    if (props.emitUpdate) emit('update:modelValue', props.multiple ? [] : null);
    if (fileUploadRef.value) {
        fileUploadRef.value.clear();
    }
};

const hasAnyFileLoaded = computed(() => {
    return (uploadedFiles.value && uploadedFiles.value.length > 0) || !!existingMedia.value;
});

const chooseFiles = () => {
    if (fileUploadRef.value && !props.disabled && !hasAnyFileLoaded.value) {
        fileUploadRef.value.choose();
    }
};

const removeUploaded = (index) => {
    uploadedFiles.value.splice(index, 1);
    if (props.emitUpdate) emit('update:modelValue', props.multiple ? [] : null);
    emit('remove', { file: null, index });
};

const formatFileSize = (bytes) => prettySize(bytes);

const clearLocalState = () => {
    try {
        const urlApi = typeof window !== 'undefined' ? window.URL || window.webkitURL : undefined;
        if (urlApi?.revokeObjectURL) {
            for (const url of previewUrlMap.values()) {
                urlApi.revokeObjectURL(url);
            }
        }
    } catch {}
    previewUrlMap.clear();
    uploadedFiles.value = [];
    if (props.emitUpdate) emit('update:modelValue', props.multiple ? [] : null);
};

const handleHeaderClear = (clearCallback) => {
    if (typeof clearCallback === 'function') clearCallback();
    clearLocalState();
};

const isChooseDisabled = (files) => {
    const hasFilesInSlot = Array.isArray(files) && files.length > 0;
    return props.disabled || hasFilesInSlot || uploadedFiles.value.length > 0 || !!existingMedia.value;
};

const handleChoose = (chooseCallback, files) => {
    if (isChooseDisabled(files)) return;
    if (typeof chooseCallback === 'function') chooseCallback();
};

const getFileIcon = (file) => {
    if (!file.type) return 'pi pi-file';

    if (file.type.startsWith('image/')) {
        return 'pi pi-image';
    } else if (file.type.startsWith('video/')) {
        return 'pi pi-video';
    } else if (file.type.startsWith('audio/')) {
        return 'pi pi-volume-up';
    } else {
        return 'pi pi-file';
    }
};

const getFileType = (file) => {
    if (!file.type) return 'Unknown';

    const typeMap = {
        'image/jpeg': 'JPEG Image',
        'image/jpg': 'JPG Image',
        'image/png': 'PNG Image',
        'image/bmp': 'BMP Image',
        'image/gif': 'GIF Image',
        'image/webp': 'WebP Image',
        'video/mp4': 'MP4 Video',
        'video/avi': 'AVI Video',
        'video/mov': 'MOV Video',
        'video/wmv': 'WMV Video',
        'video/flv': 'FLV Video',
        'video/mkv': 'MKV Video',
        'video/webm': 'WebM Video'
    };

    return typeMap[file.type] || file.type.split('/')[1].toUpperCase();
};

const previewUrlMap = new Map();
const getObjectURL = (file) => {
    if (!file) return null;
    if (file.objectURL) return file.objectURL;

    const cached = previewUrlMap.get(file);
    if (cached) return cached;

    const urlApi = typeof window !== 'undefined' ? window.URL || window.webkitURL : undefined;
    if (urlApi?.createObjectURL && file instanceof Blob) {
        try {
            const url = urlApi.createObjectURL(file);
            previewUrlMap.set(file, url);
            return url;
        } catch {
            return null;
        }
    }
    return null;
};

defineExpose({
    clear: onClear,
    choose: chooseFiles,
    upload: () => fileUploadRef.value?.upload(),
    getSelectedFiles: () => uploadedFiles.value
});

const existingMedia = computed(() => {
    const v = props.modelValue;
    if (!v || hideExisting.value) return null;
    if (v instanceof File || Array.isArray(v)) return null;
    if (typeof v === 'string') {
        return { url: v, original_name: getMediaName(v) };
    }
    if (typeof v === 'object' && (v.url || v.path)) {
        return v;
    }
    return null;
});

const onClearExisting = () => {
    hideExisting.value = true;
    if (props.emitUpdate) emit('update:modelValue', null);
    emit('remove', { file: existingMedia.value || null, reason: 'existing' });
};
</script>

<template>
    <div class="file-upload-field">
        <!-- Label -->
        <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ label }} *
            <span v-if="required" class="text-red-500 ml-1">*</span>
        </label>

        <!-- FileUpload Component -->
        <FileUpload
            ref="fileUploadRef"
            :mode="uploadMode"
            :multiple="multiple"
            :accept="accept"
            :maxFileSize="maxFileSize"
            :fileLimit="maxFiles"
            :disabled="disabled"
            :class="{ 'p-invalid': isInvalid }"
            :chooseLabel="computedPlaceholder"
            :showUploadButton="showUploadButton"
            :showCancelButton="showCancelButton"
            :pt="{
                root: { class: 'w-full' },
                content: { class: 'border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center' },
                chooseButton: {
                    class: props.disabled ? 'opacity-50 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md transition-colors'
                }
            }"
            @select="onSelect"
            @upload="onUpload"
            @remove="onRemove"
            @error="onError"
        >
            <template #header="{ chooseCallback, clearCallback, files }">
                <div class="flex justify-between items-center">
                    <div class="flex gap-2">
                        <Button @click="handleChoose(chooseCallback, files)" :label="t('common.file_upload.choose')" icon="pi pi-plus" severity="primary" size="small" :disabled="isChooseDisabled(files)" />
                        <Button v-if="files && files.length > 0" @click="handleHeaderClear(clearCallback)" :label="t('common.file_upload.clear')" icon="pi pi-times" severity="secondary" outlined size="small" :disabled="disabled" />
                    </div>
                </div>
            </template>

            <template #content="{ files, removeFileCallback }">
                <div v-if="(files && files.length > 0) || (uploadedFiles && uploadedFiles.length > 0)" class="space-y-3">
                    <div v-for="(file, index) in files && files.length ? files : uploadedFiles" :key="index" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="flex items-center space-x-3">
                            <!-- File preview for images -->
                            <div v-if="file.type && file.type.startsWith('image/')" class="flex-shrink-0">
                                <img :src="getObjectURL(file)" :alt="file.name" :width="previewWidth" class="rounded-md object-cover" :style="{ height: previewWidth + 'px' }" />
                            </div>

                            <!-- Video preview -->
                            <div v-else-if="file.type && file.type.startsWith('video/')" class="flex-shrink-0 relative">
                                <video :width="previewWidth" :style="{ height: previewWidth + 'px' }" class="rounded-md object-cover" preload="metadata">
                                    <source :src="getObjectURL(file)" :type="file.type" />
                                </video>
                                <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-md">
                                    <i class="pi pi-play text-white text-2xl"></i>
                                </div>
                            </div>

                            <!-- File icon for other media types -->
                            <div v-else class="flex-shrink-0 w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-md flex items-center justify-center">
                                <i :class="getFileIcon(file)" class="text-xl text-gray-500 dark:text-gray-400"></i>
                            </div>

                            <!-- File details -->
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {{ file.name }}
                                </p>
                                <p class="text-sm text-gray-500 dark:text-gray-400">{{ formatFileSize(file.size) }} • {{ getFileType(file) }}</p>
                            </div>
                        </div>

                        <!-- Remove button -->
                        <Button v-if="files && files.length" @click="removeFileCallback(index)" icon="pi pi-trash" severity="danger" text size="small" :disabled="disabled" class="ml-2" />
                        <Button v-else @click="removeUploaded(index)" icon="pi pi-trash" severity="danger" text size="small" :disabled="disabled" class="ml-2" />
                    </div>
                </div>

                <!-- Empty state or existing media preview (read-only) -->
                <div v-else>
                    <div v-if="existingMedia" class="space-y-3">
                        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div class="flex items-center space-x-3">
                                <!-- Image preview -->
                                <div v-if="isImageMedia(existingMedia)" class="flex-shrink-0">
                                    <img :src="getMediaUrl(existingMedia)" :alt="getMediaName(existingMedia)" :width="previewWidth" class="rounded-md object-cover" :style="{ height: previewWidth + 'px' }" />
                                </div>
                                <!-- Video preview -->
                                <div v-else-if="isVideoMedia(existingMedia)" class="flex-shrink-0 relative">
                                    <video :width="previewWidth" :style="{ height: previewWidth + 'px' }" class="rounded-md object-cover" preload="metadata">
                                        <source :src="getMediaUrl(existingMedia)" :type="existingMedia.mime_type || undefined" />
                                    </video>
                                    <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-md">
                                        <i class="pi pi-play text-white text-2xl"></i>
                                    </div>
                                </div>
                                <!-- Other file icon -->
                                <div v-else class="flex-shrink-0 w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-md flex items-center justify-center">
                                    <i class="pi pi-file text-xl text-gray-500 dark:text-gray-400"></i>
                                </div>

                                <!-- File details -->
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {{ getMediaName(existingMedia) }}
                                    </p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                                        <span v-if="existingMedia.size">{{ formatFileSize(existingMedia.size) }}</span>
                                        <span v-if="existingMedia.size && existingMedia.mime_type"> • </span>
                                        <span>{{ getMimeTypeName(existingMedia.mime_type) }}</span>
                                    </p>
                                </div>
                            </div>
                            <!-- Remove existing media button -->
                            <Button @click="onClearExisting" icon="pi pi-trash" severity="danger" text size="small" :disabled="disabled" class="ml-2" />
                        </div>
                    </div>

                    <div v-else class="text-center py-8">
                        <i class="pi pi-cloud-upload text-4xl text-gray-400 dark:text-gray-500 mb-4"></i>
                        <p class="text-gray-600 dark:text-gray-400 mb-2">{{ computedPlaceholder }}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-500">
                            {{ t('common.file_upload.drag_drop_hint') }}
                        </p>
                        <p v-if="maxFileSize" class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ t('common.file_upload.max_size') }}: {{ formatFileSize(maxFileSize) }}</p>
                    </div>
                </div>
            </template>
        </FileUpload>

        <!-- Error message -->
        <Message v-if="error" severity="error" size="small" class="mt-2">{{ error }}</Message>

        <!-- Help text -->
        <small v-if="!error && (accept || maxFileSize)" class="text-gray-500 dark:text-gray-400 block mt-2">
            <span v-if="accept">{{ t('common.file_upload.accepted_formats') }}: {{ accept }}</span>
            <span v-if="accept && maxFileSize"> • </span>
            <span v-if="maxFileSize">{{ t('common.file_upload.max_size') }}: {{ formatFileSize(maxFileSize) }}</span>
        </small>
    </div>
</template>

<style scoped>
.file-upload-field :deep(.p-fileupload-content) {
    border: 2px dashed #d1d5db;
    border-radius: 0.5rem;
    background: transparent;
}

.file-upload-field :deep(.p-fileupload-content:hover) {
    border-color: #9ca3af;
}

.file-upload-field :deep(.p-invalid .p-fileupload-content) {
    border-color: #ef4444;
}

.p-error {
    color: #ef4444;
    font-size: 0.875rem;
}
</style>
