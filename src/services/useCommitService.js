// src/services/useCommitService.js
import apiClient from './axios';

export const useCommitService = {
    /**
     * Get all files from Git commits with filtering and pagination
     * @param {Object} params - Lazy params from DataTable
     * @returns {Promise<{data: Array, meta: Object}>}
     */
    async getCommitFiles(params) {
        const response = await apiClient.post('/api/admin/commits/files', params);
        return response.data;
    },

    /**
     * Get file content from a specific commit
     * @param {string} commitHash - Git commit hash
     * @param {string} filePath - File path in repository
     * @returns {Promise<Object>}
     */
    async getFileContent(commitHash, filePath) {
        const response = await apiClient.post('/api/admin/commits/file-content', {
            commit: commitHash,
            path: filePath
        });
        return response.data;
    },

    /**
     * Get commit history for a specific file
     * @param {string} filePath - File path in repository
     * @returns {Promise<Array>}
     */
    async getFileHistory(filePath) {
        const response = await apiClient.post('/api/admin/commits/file-history', {
            path: filePath
        });
        return response.data;
    },

    /**
     * Search files across all commits
     * @param {string} searchTerm - Search term for file names
     * @returns {Promise<Array>}
     */
    async searchFiles(searchTerm) {
        const response = await apiClient.post('/api/admin/commits/search', {
            search: searchTerm
        });
        return response.data;
    }
};
