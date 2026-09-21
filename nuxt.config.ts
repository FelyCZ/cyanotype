// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxtjs/seo',
    '@nuxt/ui'
  ],

  site: {
    url: 'https://blueprinting.pages.dev',
    name: 'Cyanotype',
    description: 'Client-side digital negative generator and guide for cyanotype alternative photography process.',
    defaultLocale: 'en'
  },

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true }
  },

  ogImage: {
    enabled: false
  },

  nitro: {
    prerender: {
      crawlLinks: true
    }
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
