// src/services/useCommitService.js
import apiClient from './axios';

/**
 * Mock implementation for Git commits file search
 * In production, this would connect to a Laravel backend API
 * For now, generates mock data based on the repository structure
 */

// Helper function to generate mock data
function generateMockCommitFiles() {
    const files = [
        'src/App.vue',
        'src/main.js',
        'src/router/index.js',
        'src/composables/useDataTable.js',
        'src/composables/useDynamicColumns.js',
        'src/views/admin/accounts/Accounts.vue',
        'src/views/admin/users/Users.vue',
        'src/views/admin/plans/Plans.vue',
        'src/services/useAccountService.js',
        'src/services/useUserService.js',
        'package.json',
        'vite.config.mjs',
        'tailwind.config.js',
        'README.md',
        'src/locales/en.json',
        'src/locales/fr.json',
        'src/locales/ar.json',
        'src/stores/useAuthStore.js',
        'src/utilities/helper.js',
        'src/plugins/dayjs.js'
    ];

    const authors = [
        'Bouhenna Othmane',
        'John Doe',
        'Jane Smith',
        'copilot-swe-agent[bot]'
    ];

    const commitMessages = [
        'Initial commit',
        'Add feature',
        'Fix bug',
        'Update dependencies',
        'Refactor code',
        'Improve performance',
        'Add translations',
        'Update documentation',
        'Fix styling issues',
        'Add new component'
    ];

    const mockData = [];
    let id = 1;

    files.forEach((filePath) => {
        const fileName = filePath.split('/').pop();
        const commitHash = Math.random().toString(36).substring(2, 10);
        const author = authors[Math.floor(Math.random() * authors.length)];
        const message = commitMessages[Math.floor(Math.random() * commitMessages.length)];
        const daysAgo = Math.floor(Math.random() * 90);
        const committedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

        mockData.push({
            id: id++,
            file_name: fileName,
            file_path: filePath,
            commit_hash: commitHash,
            commit_message: message,
            author_name: author,
            committed_at: committedAt
        });
    });

    return mockData;
}

// Generate mock data once
const mockCommitFiles = generateMockCommitFiles();

export const useCommitService = {
    /**
     * Get all files from Git commits with filtering and pagination
     * @param {Object} params - Lazy params from DataTable
     * @returns {Promise<{data: Array, meta: Object}>}
     */
    async getCommitFiles(params) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        // In production, this would be:
        // const response = await apiClient.post('/api/admin/commits/files', params);
        // return response.data;

        // Mock implementation for testing
        let filteredData = [...mockCommitFiles];

        // Apply global filter
        if (params.filters?.global?.value) {
            const searchTerm = params.filters.global.value.toLowerCase();
            filteredData = filteredData.filter(file => 
                file.file_name.toLowerCase().includes(searchTerm) ||
                file.file_path.toLowerCase().includes(searchTerm) ||
                file.commit_message.toLowerCase().includes(searchTerm) ||
                file.author_name.toLowerCase().includes(searchTerm)
            );
        }

        // Apply column filters
        if (params.filters) {
            Object.entries(params.filters).forEach(([field, filter]) => {
                if (field !== 'global' && filter.value) {
                    const searchValue = filter.value.toLowerCase();
                    filteredData = filteredData.filter(file => 
                        file[field]?.toString().toLowerCase().includes(searchValue)
                    );
                }
            });
        }

        // Apply sorting
        if (params.sortField) {
            const sortOrder = params.sortOrder === 1 ? 1 : -1;
            filteredData.sort((a, b) => {
                const aVal = a[params.sortField] || '';
                const bVal = b[params.sortField] || '';
                return aVal > bVal ? sortOrder : aVal < bVal ? -sortOrder : 0;
            });
        }

        // Apply pagination
        const page = params.page || 1;
        const rows = params.rows || 10;
        const start = (page - 1) * rows;
        const end = start + rows;
        const paginatedData = filteredData.slice(start, end);

        return {
            data: paginatedData,
            meta: {
                total: filteredData.length,
                per_page: rows,
                current_page: page
            }
        };
    },

    /**
     * Get file content from a specific commit
     * @param {string} commitHash - Git commit hash
     * @param {string} filePath - File path in repository
     * @returns {Promise<Object>}
     */
    async getFileContent(commitHash, filePath) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 200));

        // In production:
        // const response = await apiClient.post('/api/admin/commits/file-content', {
        //     commit: commitHash,
        //     path: filePath
        // });
        // return response.data;

        // Mock implementation
        const mockContent = `// ${filePath}
// This is mock file content for demonstration
// In production, this would fetch actual file content from Git

export default {
    name: 'MockComponent',
    data() {
        return {
            message: 'Hello from ${filePath}'
        }
    }
}`;

        return {
            content: mockContent
        };
    },

    /**
     * Get commit history for a specific file
     * @param {string} filePath - File path in repository
     * @returns {Promise<Array>}
     */
    async getFileHistory(filePath) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 200));

        // In production:
        // const response = await apiClient.post('/api/admin/commits/file-history', {
        //     path: filePath
        // });
        // return response.data;

        // Mock implementation
        const mockHistory = [];
        const authors = ['Bouhenna Othmane', 'John Doe', 'Jane Smith'];
        const messages = [
            'Initial implementation',
            'Add new features',
            'Fix issues',
            'Update logic',
            'Refactor code'
        ];

        for (let i = 0; i < 5; i++) {
            const daysAgo = Math.floor(Math.random() * 60) + i * 10;
            mockHistory.push({
                commit_hash: Math.random().toString(36).substring(2, 10),
                author_name: authors[Math.floor(Math.random() * authors.length)],
                commit_message: messages[i],
                committed_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
            });
        }

        return {
            history: mockHistory
        };
    },

    /**
     * Search files across all commits
     * @param {string} searchTerm - Search term for file names
     * @returns {Promise<Array>}
     */
    async searchFiles(searchTerm) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 200));

        // In production:
        // const response = await apiClient.post('/api/admin/commits/search', {
        //     search: searchTerm
        // });
        // return response.data;

        // Mock implementation
        const searchLower = searchTerm.toLowerCase();
        return mockCommitFiles.filter(file => 
            file.file_name.toLowerCase().includes(searchLower) ||
            file.file_path.toLowerCase().includes(searchLower)
        );
    }
};
