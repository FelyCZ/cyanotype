// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxtjs/seo',
    '@nuxt/content',
    '@nuxt/ui',
    '@nuxtjs/i18n'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  site: {
    url: 'https://blueprinting.pages.dev',
    name: 'Cyanotype',
    description: 'Client-side digital negative generator and guide for cyanotype alternative photography process.',
    defaultLocale: 'en'
  },

  routeRules: {
    '/': { prerender: true },
    '/guide/**': { prerender: true }
  },

  compatibilityDate: '2026-06-30',

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
        '/guide',
        '/guide/solutions',
        '/guide/procedure',
        '/guide/context'
      ]
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  i18n: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'cs', language: 'cs-CZ', name: 'Čeština', file: 'cs.json' }
    ],
    strategy: 'no_prefix'
  },

  ogImage: {
    enabled: false
  }
})
