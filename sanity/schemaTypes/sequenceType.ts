import { defineType, defineField } from 'sanity'

export const sequenceType = defineType({
  name: 'sequence',
  title: 'Animation Sequence',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'images',
      title: 'Image Sequence',
      description: 'Upload the frames in order for the scroll-linked animation (e.g. 120+ frames)',
      type: 'array',
      of: [{ type: 'image' }],
    }),
  ],
})
