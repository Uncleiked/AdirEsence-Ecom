import { type SchemaTypeDefinition } from 'sanity'

import { categoryType } from './categoryType'
import { customerType } from './customerType'
import { orderType } from './orderType'
import { productType } from './productType'
import { siteSettingsType } from './siteSettingsType'
import { sequenceType } from './sequenceType'
import { aboutType } from './aboutType'
import { heroType } from './heroType'
import { featureType } from './featureType'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [categoryType, customerType, productType, orderType, siteSettingsType, sequenceType, aboutType, heroType, featureType],
}
