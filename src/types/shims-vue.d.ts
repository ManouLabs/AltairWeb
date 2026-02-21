// src/types/shims-vue.d.ts
// Type declarations for Vue single-file components

declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent<{}, {}, any>;
    export default component;
}

// Type declarations for JS modules that haven't been migrated to TypeScript yet
// These can be removed as you migrate each module to TypeScript

declare module '@/components/*.vue' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent<{}, {}, any>;
    export default component;
}

// Note: Window.Echo is declared in EchoService.ts using the proper Echo<'reverb'> type
