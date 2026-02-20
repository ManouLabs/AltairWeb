<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
    iconError?: string | null;
    colorError?: string | null;
}>();

const icon = defineModel<string | null>('icon', { default: null });
const iconColor = defineModel<string | null>('iconColor', { default: null });

// Icon search
const iconSearch = ref<string>('');

// Icons with multilingual keywords (en, fr, ar)
const iconEntries = [
    { icon: 'pi pi-home', keywords: 'home maison accueil منزل بيت' },
    { icon: 'pi pi-shopping-bag', keywords: 'shopping bag sac courses تسوق حقيبة' },
    { icon: 'pi pi-box', keywords: 'box boîte colis صندوق علبة package paquet' },
    { icon: 'pi pi-users', keywords: 'users utilisateurs team équipe مستخدمين فريق group groupe' },
    { icon: 'pi pi-bolt', keywords: 'bolt lightning éclair foudre برق صاعقة flash rapide fast' },
    { icon: 'pi pi-car', keywords: 'car voiture automobile سيارة vehicle véhicule' },
    { icon: 'pi pi-chart-bar', keywords: 'chart bar graphique barre statistiques stats رسم بياني إحصائيات' },
    { icon: 'pi pi-pencil', keywords: 'pencil edit crayon modifier قلم تعديل write écrire' },
    { icon: 'pi pi-headphones', keywords: 'headphones casque écouteurs سماعات audio' },
    { icon: 'pi pi-palette', keywords: 'palette color couleur لون design تصميم art' },
    { icon: 'pi pi-gift', keywords: 'gift cadeau هدية present reward récompense' },
    { icon: 'pi pi-star', keywords: 'star étoile نجمة favorite favori مفضل' },
    { icon: 'pi pi-tag', keywords: 'tag étiquette label وسم ملصق price prix' },
    { icon: 'pi pi-shopping-cart', keywords: 'cart panier سلة shopping courses achat' },
    { icon: 'pi pi-truck', keywords: 'truck camion livraison delivery شاحنة توصيل shipping expédition' },
    { icon: 'pi pi-cog', keywords: 'cog settings paramètres réglages إعدادات gear' },
    { icon: 'pi pi-heart', keywords: 'heart coeur cœur قلب love amour favorite' },
    { icon: 'pi pi-bookmark', keywords: 'bookmark signet marque-page إشارة مرجعية save' },
    { icon: 'pi pi-camera', keywords: 'camera appareil photo caméra كاميرا صورة' },
    { icon: 'pi pi-video', keywords: 'video vidéo film فيديو فيلم' },
    { icon: 'pi pi-image', keywords: 'image photo picture صورة illustration' },
    { icon: 'pi pi-folder', keywords: 'folder dossier مجلد ملف directory répertoire' },
    { icon: 'pi pi-file', keywords: 'file fichier ملف document' },
    { icon: 'pi pi-envelope', keywords: 'envelope email mail courrier بريد رسالة message' },
    { icon: 'pi pi-bell', keywords: 'bell cloche notification sonnette جرس إشعار alert alerte' },
    { icon: 'pi pi-calendar', keywords: 'calendar calendrier تقويم date agenda planning' },
    { icon: 'pi pi-clock', keywords: 'clock horloge heure time ساعة وقت' },
    { icon: 'pi pi-map-marker', keywords: 'map marker location lieu position emplacement موقع مكان address adresse' },
    { icon: 'pi pi-flag', keywords: 'flag drapeau علم report signaler' },
    { icon: 'pi pi-unlock', keywords: 'unlock déverrouiller ouvert مفتوح open' },
    { icon: 'pi pi-lock', keywords: 'lock verrouiller fermé مقفل secure sécurisé' },
    { icon: 'pi pi-user', keywords: 'user utilisateur مستخدم person personne compte account حساب' },
    { icon: 'pi pi-search', keywords: 'search recherche chercher بحث find trouver' },
    { icon: 'pi pi-check', keywords: 'check valid validé correct صحيح تأكيد approve approuver' },
    { icon: 'pi pi-times', keywords: 'times close fermer إغلاق cancel annuler حذف' },
    { icon: 'pi pi-plus', keywords: 'plus add ajouter إضافة nouveau new جديد' },
    { icon: 'pi pi-minus', keywords: 'minus remove supprimer retirer إزالة' },
    { icon: 'pi pi-info-circle', keywords: 'info information معلومات details détails' },
    { icon: 'pi pi-question-circle', keywords: 'question aide help سؤال مساعدة' },
    { icon: 'pi pi-exclamation-circle', keywords: 'warning alert attention تنبيه تحذير avertissement' },
    { icon: 'pi pi-phone', keywords: 'phone téléphone هاتف call appel اتصال' },
    { icon: 'pi pi-globe', keywords: 'globe world monde عالم international web' },
    { icon: 'pi pi-link', keywords: 'link lien رابط url' },
    { icon: 'pi pi-share-alt', keywords: 'share partager مشاركة social' },
    { icon: 'pi pi-download', keywords: 'download télécharger تحميل' },
    { icon: 'pi pi-upload', keywords: 'upload importer charger رفع' },
    { icon: 'pi pi-refresh', keywords: 'refresh actualiser recharger تحديث reload' },
    { icon: 'pi pi-play', keywords: 'play lire jouer تشغيل start' },
    { icon: 'pi pi-pause', keywords: 'pause إيقاف مؤقت' },
    { icon: 'pi pi-stop', keywords: 'stop arrêter إيقاف' },
    { icon: 'pi pi-forward', keywords: 'forward avancer suivant التالي تقديم next' },
    { icon: 'pi pi-backward', keywords: 'backward reculer précédent السابق' },
    { icon: 'pi pi-volume-up', keywords: 'volume sound son صوت audio' },
    { icon: 'pi pi-volume-down', keywords: 'volume low bas منخفض quiet' },
    { icon: 'pi pi-tablet', keywords: 'tablet tablette لوحة جهاز device' },
    { icon: 'pi pi-mobile', keywords: 'mobile phone portable محمول هاتف smartphone' },
    { icon: 'pi pi-desktop', keywords: 'desktop ordinateur bureau حاسوب مكتب computer' },
    { icon: 'pi pi-send', keywords: 'send envoyer إرسال submit soumettre' },
    { icon: 'pi pi-trash', keywords: 'trash delete supprimer poubelle حذف سلة' },
    { icon: 'pi pi-eye', keywords: 'eye voir view عين رؤية visible' },
    { icon: 'pi pi-eye-slash', keywords: 'hide cacher masquer إخفاء invisible' },
    { icon: 'pi pi-key', keywords: 'key clé مفتاح password mot de passe' },
    { icon: 'pi pi-credit-card', keywords: 'credit card carte crédit بطاقة ائتمان payment paiement' },
    { icon: 'pi pi-money-bill', keywords: 'money bill argent billet مال فلوس cash' },
    { icon: 'pi pi-wallet', keywords: 'wallet portefeuille محفظة' },
    { icon: 'pi pi-briefcase', keywords: 'briefcase mallette serviette حقيبة عمل business travail work' },
    { icon: 'pi pi-building', keywords: 'building bâtiment immeuble مبنى entreprise company شركة' },
    { icon: 'pi pi-lightbulb', keywords: 'lightbulb ampoule idée idea فكرة مصباح' },
    { icon: 'pi pi-moon', keywords: 'moon lune قمر night nuit dark sombre' },
    { icon: 'pi pi-sun', keywords: 'sun soleil شمس light lumière day jour' },
    { icon: 'pi pi-cloud', keywords: 'cloud nuage سحابة storage stockage' },
    { icon: 'pi pi-wifi', keywords: 'wifi internet réseau network شبكة واي فاي' },
    { icon: 'pi pi-bluetooth', keywords: 'bluetooth بلوتوث wireless sans fil' },
    { icon: 'pi pi-mic', keywords: 'mic microphone ميكروفون voice voix صوت record' },
    { icon: 'pi pi-database', keywords: 'database base données قاعدة بيانات storage' },
    { icon: 'pi pi-server', keywords: 'server serveur خادم hosting hébergement' },
    { icon: 'pi pi-code', keywords: 'code développement programming برمجة dev' },
    { icon: 'pi pi-terminal', keywords: 'terminal console طرفية command commande' },
    { icon: 'pi pi-filter', keywords: 'filter filtre filtrer تصفية' },
    { icon: 'pi pi-sort', keywords: 'sort trier ترتيب order' },
    { icon: 'pi pi-bars', keywords: 'bars menu hamburger قائمة' },
    { icon: 'pi pi-list', keywords: 'list liste قائمة items éléments' },
    { icon: 'pi pi-th-large', keywords: 'grid grille شبكة cards cartes' },
    { icon: 'pi pi-table', keywords: 'table tableau جدول data données' },
    { icon: 'pi pi-chart-line', keywords: 'chart line graphique ligne رسم بياني خط trend tendance' },
    { icon: 'pi pi-chart-pie', keywords: 'chart pie graphique camembert circulaire دائري' },
    { icon: 'pi pi-percentage', keywords: 'percentage pourcentage نسبة مئوية discount remise' },
    { icon: 'pi pi-dollar', keywords: 'dollar دولار money argent devise currency' },
    { icon: 'pi pi-euro', keywords: 'euro يورو money argent' },
    { icon: 'pi pi-ticket', keywords: 'ticket billet تذكرة coupon' },
    { icon: 'pi pi-at', keywords: 'at arobase عند email' },
    { icon: 'pi pi-hashtag', keywords: 'hashtag dièse هاشتاغ tag' },
    { icon: 'pi pi-paperclip', keywords: 'paperclip trombone مشبك attachment pièce jointe' },
    { icon: 'pi pi-history', keywords: 'history historique تاريخ log journal' },
    { icon: 'pi pi-undo', keywords: 'undo annuler تراجع' },
    { icon: 'pi pi-redo', keywords: 'redo refaire إعادة' },
    { icon: 'pi pi-verified', keywords: 'verified vérifié certifié تم التحقق badge' },
    { icon: 'pi pi-shield', keywords: 'shield bouclier درع security sécurité protection' },
    { icon: 'pi pi-crown', keywords: 'crown couronne تاج premium royal vip' },
    { icon: 'pi pi-wrench', keywords: 'wrench clé outil tool مفتاح أداة repair réparer' },
    { icon: 'pi pi-receipt', keywords: 'receipt reçu facture إيصال فاتورة invoice' },
    { icon: 'pi pi-shop', keywords: 'shop boutique magasin متجر محل store' },
    { icon: 'pi pi-warehouse', keywords: 'warehouse entrepôt مستودع stock inventory inventaire' }
];

const filteredIcons = computed(() => {
    if (!iconSearch.value) return iconEntries;
    const query = iconSearch.value.toLowerCase();
    return iconEntries.filter((entry) => entry.icon.toLowerCase().includes(query) || entry.keywords.toLowerCase().includes(query));
});

// Accent color options
const accentColors = ['#3B82F6', '#1D4ED8', '#6366F1', '#4F46E5', '#A855F7', '#8B5CF6', '#EC4899', '#D946EF', '#F43F5E', '#E11D48', '#EF4444', '#F97316', '#F59E0B', '#FACC15', '#84CC16', '#10B981', '#059669', '#06B6D4', '#0F172A', '#94A3B8'];
</script>

<template>
    <div class="flex flex-col gap-4 p-5 bg-surface-50 dark:bg-surface-900/40 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-inner">
        <label class="text-sm font-bold text-surface-700 dark:text-surface-200 uppercase tracking-wide">{{ t('common.icon_picker.title') }}</label>

        <!-- Icon Picker -->
        <div class="flex flex-col gap-3">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="iconSearch" :placeholder="t('common.icon_picker.search_icon')" class="w-full !bg-surface-0 dark:!bg-surface-900" />
            </IconField>

            <div class="grid grid-cols-8 gap-1.5 max-h-[110px] overflow-y-auto p-1 custom-scrollbar pr-2">
                <Button
                    v-for="entry in filteredIcons"
                    :key="entry.icon"
                    :icon="entry.icon"
                    :outlined="icon !== entry.icon"
                    :severity="icon === entry.icon ? undefined : 'secondary'"
                    class="!w-20 !h-20 !rounded-lg"
                    :style="icon === entry.icon ? { borderColor: iconColor || '#8B5CF6', color: iconColor || '#8B5CF6', backgroundColor: (iconColor || '#8B5CF6') + '12' } : {}"
                    @click="icon = entry.icon"
                    :pt="{ icon: { class: 'text-2xl' } }"
                />
                <div v-if="filteredIcons.length === 0" class="col-span-8 py-6 text-center text-sm text-surface-500 italic">
                    {{ t('common.icon_picker.no_icons_found') }}
                </div>
            </div>
            <Message v-if="props.iconError" severity="error" size="small" variant="simple">
                {{ t(props.iconError) }}
            </Message>
        </div>

        <!-- Accent Colors -->
        <div class="flex flex-col gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
            <span class="text-[10px] font-black uppercase tracking-widest text-surface-500 dark:text-surface-400">{{ t('common.icon_picker.accent_color') }} :</span>
            <div class="grid grid-cols-10 gap-2">
                <button
                    v-for="color in accentColors"
                    :key="color"
                    type="button"
                    class="w-7 h-7 p-0 border-2 border-transparent rounded-lg cursor-pointer flex items-center justify-center text-white text-[9px] transition-all duration-150 outline-none hover:scale-125"
                    :class="{ 'ring-2 ring-primary ring-offset-2 dark:ring-offset-surface-900 z-10': iconColor === color }"
                    :style="{ backgroundColor: color, borderColor: color }"
                    @click="iconColor = color"
                >
                    <i v-if="iconColor === color" class="pi pi-check" />
                </button>
            </div>
            <Message v-if="props.colorError" severity="error" size="small" variant="simple">
                {{ t(props.colorError) }}
            </Message>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #334155;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #cbd5e1;
}
</style>
