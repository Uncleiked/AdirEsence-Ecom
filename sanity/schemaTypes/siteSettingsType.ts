import { CogIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'siteName',
      title: 'Site Name',
      type: 'string',
    }),
    defineField({
      name: 'headerCtaText',
      title: 'Header Button Text',
      type: 'string',
      initialValue: 'Shop',
    }),
    defineField({
      name: 'headerCtaLink',
      title: 'Header Button Link',
      type: 'string',
      initialValue: '/shop',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Media Links',
      type: 'object',
      fields: [
        defineField({ name: 'facebook', title: 'Facebook URL', type: 'url' }),
        defineField({ name: 'instagram', title: 'Instagram URL', type: 'url' }),
        defineField({ name: 'x', title: 'X (Twitter) URL', type: 'url' }),
        defineField({ name: 'pinterest', title: 'Pinterest URL', type: 'url' }),
        defineField({ name: 'youtube', title: 'YouTube URL', type: 'url' }),
        defineField({ name: 'tiktok', title: 'TikTok URL', type: 'url' }),
      ],
    }),
    defineField({
      name: 'footerLinks',
      title: 'Footer Links',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'title', title: 'Link Title', type: 'string' }),
            defineField({ name: 'url', title: 'URL', type: 'string' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'shippingLagos',
      title: 'Shipping Fee (Lagos)',
      type: 'number',
      initialValue: 5000,
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: 'shippingRestOfNigeria',
      title: 'Shipping Fee (Rest of Nigeria)',
      type: 'number',
      initialValue: 10000,
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: 'shippingAfrica',
      title: 'Shipping Fee (Other African Countries)',
      type: 'number',
      initialValue: 20000,
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: 'shippingInternational',
      title: 'Shipping Fee (International)',
      type: 'number',
      initialValue: 50000,
      validation: (rule) => rule.required().min(0),
    }),
  ],
})
