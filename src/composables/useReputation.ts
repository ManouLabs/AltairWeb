import { useI18n } from 'vue-i18n';

export interface ReputationData {
    level: 'excellent' | 'good' | 'medium' | 'poor' | 'new';
    label: string;
    percentage: number | null;
    delivered: number;
    returned: number;
    color: string;
    bgColor: string;
}

const LEVEL_STYLES: Record<string, { color: string; bgColor: string }> = {
    excellent: { color: '#10b981', bgColor: '#d1fae5' },
    good: { color: '#3b82f6', bgColor: '#dbeafe' },
    medium: { color: '#f59e0b', bgColor: '#fef3c7' },
    poor: { color: '#ef4444', bgColor: '#fee2e2' },
    new: { color: '#64748b', bgColor: '#f1f5f9' }
};

/**
 * Maps raw reputation data from the API to UI-ready data with colors and labels.
 */
export function useReputation() {
    const { t } = useI18n();

    function mapReputation(apiData: { level: string; percentage: number | null; delivered: number; returned: number } | null | undefined): ReputationData {
        if (!apiData) {
            return {
                level: 'new',
                label: t('customer.reputation.levels.new'),
                percentage: null,
                delivered: 0,
                returned: 0,
                color: LEVEL_STYLES.new.color,
                bgColor: LEVEL_STYLES.new.bgColor
            };
        }

        const level = apiData.level as ReputationData['level'];
        const styles = LEVEL_STYLES[level] ?? LEVEL_STYLES.new;
        const labelKey = level === 'poor' ? 'customer.reputation.levels.low' : `customer.reputation.levels.${level}`;

        return {
            level,
            label: t(labelKey),
            percentage: apiData.percentage,
            delivered: apiData.delivered,
            returned: apiData.returned,
            color: styles.color,
            bgColor: styles.bgColor
        };
    }

    return { mapReputation };
}
