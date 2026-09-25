import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    guide: defineCollection({
      type: 'page',
      source: 'guide/**/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        order: z.number(),
        icon: z.string().optional()
      })
    })
  }
})
