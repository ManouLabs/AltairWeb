// src/composables/useOrderHelpers.ts

export function useOrderHelpers() {
    const statusSeverity = (status: string): string => {
        const map: Record<string, string> = {
            pending: 'warn',
            confirmed: 'info',
            shipping: 'info',
            delivered: 'success',
            cancelled: 'danger',
            returned: 'danger'
        };
        return map[status] || 'secondary';
    };

    const statusIcon = (status: string): string => {
        const map: Record<string, string> = {
            pending: 'pi pi-clock',
            confirmed: 'pi pi-check',
            shipping: 'pi pi-truck',
            delivered: 'pi pi-check-circle',
            cancelled: 'pi pi-times-circle',
            returned: 'pi pi-replay'
        };
        return map[status] || 'pi pi-question-circle';
    };

    const paymentSeverity = (status: string): string => (status === 'paid' ? 'success' : 'warn');
    const paymentIcon = (status: string): string => (status === 'paid' ? 'pi pi-check-circle' : 'pi pi-clock');

    const sourceIcon = (source: string): string => {
        const map: Record<string, string> = {
            tiktok: 'pi pi-tiktok',
            whatsapp: 'pi pi-whatsapp',
            facebook: 'pi pi-facebook',
            youcan: 'pi pi-shopping-cart',
            shopify: 'pi pi-shopping-cart',
            woocommerce: 'pi pi-shopping-cart',
            direct_website: 'pi pi-globe',
            other: 'pi pi-ellipsis-h'
        };
        return map[source] || 'pi pi-question-circle';
    };

    const shippingTypeIcon = (type: string): string => (type === 'home_delivery' ? 'pi pi-home' : 'pi pi-building');

    return {
        statusSeverity,
        statusIcon,
        paymentSeverity,
        paymentIcon,
        sourceIcon,
        shippingTypeIcon
    };
}
