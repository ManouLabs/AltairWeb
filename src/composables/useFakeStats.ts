// Fake stats composable for category module
// TODO: Replace with real Product/Order data when models exist

/**
 * Generate consistent fake statistics for categories
 * Uses category ID as seed for consistent values across renders
 */
export function useFakeStats() {
    // Seeded random function for consistency
    const seededRandom = (seed: number, min: number, max: number): number => {
        const x = Math.sin(seed * 9999) * 10000;
        const rand = x - Math.floor(x);
        return Math.floor(rand * (max - min + 1)) + min;
    };

    const getFakeProductCount = (categoryId: number): number => {
        return seededRandom(categoryId, 50, 1500);
    };

    const getFakeSubCategoryProductCount = (categoryId: number): number => {
        return seededRandom(categoryId * 7, 20, 500);
    };

    const getFakeSalesImpact = (categoryId: number): string => {
        const value = seededRandom(categoryId * 3, -50, 250) / 10;
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(1)}%`;
    };

    const getFakeSalesImpactValue = (categoryId: number): number => {
        return seededRandom(categoryId * 3, -50, 250) / 10;
    };

    const getFakeAvgPrice = (categoryId: number): string => {
        const value = seededRandom(categoryId * 5, 1500, 50000) / 100;
        return `$${value.toFixed(2)}`;
    };

    const getFakeCategoryReference = (categoryId: number): string => {
        const refNum = seededRandom(categoryId * 11, 100, 999);
        return `#0${refNum}`;
    };

    const getFakeTotalCount = (categoryId: number): string => {
        const count = getFakeProductCount(categoryId);
        return count.toLocaleString();
    };

    return {
        getFakeProductCount,
        getFakeSubCategoryProductCount,
        getFakeSalesImpact,
        getFakeSalesImpactValue,
        getFakeAvgPrice,
        getFakeCategoryReference,
        getFakeTotalCount
    };
}
