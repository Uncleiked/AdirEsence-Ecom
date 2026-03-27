import { StarIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

export const heroType = defineType({
  name: 'hero',
  title: 'Hero Section',
  type: 'document',
  icon: StarIcon,
  fields: [

    defineField({
      name: 'animationSequence',
      title: 'Background Animation Sequence',
      description: 'Select an animation sequence to display as the background. This is currently the ONLY supported background type for the Hero section.',
      type: 'reference',
      to: [{ type: 'sequence' }],
    }),
    defineField({
      name: 'beatA',
      title: 'Animation Beat A (0-20% scroll)',
      type: 'object',
      fields: [
        { name: 'title', title: 'Title', type: 'string', initialValue: 'THE SILHOUETTE' },
        { name: 'subtitle', title: 'Subtitle', type: 'string', initialValue: 'Engineered for the elements.' },
      ],
    }),
    defineField({
      name: 'beatB',
      title: 'Animation Beat B (25-45% scroll)',
      type: 'object',
      fields: [
        { name: 'title', title: 'Title', type: 'string', initialValue: 'FABRIC / MATERIAL TECH' },
        { name: 'description', title: 'Description', type: 'text', initialValue: 'Micro-woven breathable mesh designed to adapt to your environment, maintaining optimal thermal equilibrium in any climate.' },
      ],
    }),
    defineField({
      name: 'beatC',
      title: 'Animation Beat C (50-70% scroll)',
      type: 'object',
      fields: [
        { name: 'title', title: 'Title', type: 'string', initialValue: 'CRAFTSMANSHIP / UTILITY' },
        { name: 'description', title: 'Description', type: 'text', initialValue: 'Laser-cut seams and weather-sealed zips. Every stitch calculated for maximum performance without compromising the minimalist aesthetic.' },
      ],
    }),
    defineField({
      name: 'beatD',
      title: 'Animation Beat D (75-100% scroll)',
      type: 'object',
      fields: [
        { name: 'title', title: 'Title', type: 'string', initialValue: 'DISCOVER MORE' },
        { name: 'subtitle', title: 'Subtitle', type: 'string', initialValue: 'Step into the future of wear.' },
        { name: 'buttonText', title: 'Button Text', type: 'string', initialValue: 'Pre-order Now' },
      ],
    }),
  ],
})
