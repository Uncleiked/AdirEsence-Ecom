import { InfoOutlineIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

export const aboutType = defineType({
  name: 'about',
  title: 'About Section',
  type: 'document',
  icon: InfoOutlineIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      initialValue: 'About AdirEssence',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      initialValue: "AdirEssence is more than a brand; it's a movement bridging heritage and modern luxury. We craft every piece to preserve the rich culture of artistry while offering you premium comfort and undeniable style.",
    }),
    defineField({
      name: 'assetType',
      title: 'Asset Type',
      type: 'string',
      options: {
        list: [
          { title: 'Image', value: 'image' },
          { title: 'Video', value: 'video' },
        ],
        layout: 'radio',
      },
      initialValue: 'image',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      hidden: ({ parent }) => parent?.assetType !== 'image',
    }),
    defineField({
      name: 'video',
      title: 'Video File',
      type: 'file',
      options: {
        accept: 'video/*',
      },
      hidden: ({ parent }) => parent?.assetType !== 'video',
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL (Alternative)',
      description: 'Use this if you want to link to an external video (YouTube, Vimeo, etc.)',
      type: 'url',
      hidden: ({ parent }) => parent?.assetType !== 'video',
    }),
  ],
})
