import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real, index, uniqueIndex, check } from 'drizzle-orm/sqlite-core';
export const users = sqliteTable('users', {
 id:text('id').primaryKey(), email:text('email').notNull(), name:text('name').notNull(),
 role:text('role',{enum:['user','maker']}).notNull().default('user'), commune:text('commune').notNull().default('Santiago'),
 lat:real('lat').notNull().default(-33.4489), lng:real('lng').notNull().default(-70.6693),
 bio:text('bio').notNull().default(''), specialties:text('specialties').notNull().default('[]'), basePrice:integer('base_price').notNull().default(0),
 createdAt:text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
},t=>[check('users_role',sql`${t.role} in ('user','maker')`),check('users_price',sql`${t.basePrice}>=0`)]);
export const images=sqliteTable('images',{id:text('id').primaryKey(),ownerId:text('owner_id').notNull().references(()=>users.id),contentType:text('content_type').notNull(),createdAt:text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)});
export const requests=sqliteTable('repair_requests',{
 id:text('id').primaryKey(),userId:text('user_id').notNull().references(()=>users.id),itemName:text('item_name').notNull(),category:text('category').notNull(),
 description:text('description').notNull(),imageId:text('image_id'),commune:text('commune').notNull(),
 status:text('status',{enum:['open','in_progress','completed','cancelled']}).notNull().default('open'),acceptedOfferId:text('accepted_offer_id'),
 demo:integer('is_demo',{mode:'boolean'}).notNull().default(false),createdAt:text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
},t=>[index('idx_requests_user').on(t.userId,t.createdAt),index('idx_requests_status').on(t.status),check('requests_status',sql`${t.status} in ('open','in_progress','completed','cancelled')`)]);
export const offers=sqliteTable('offers',{
 id:text('id').primaryKey(),requestId:text('request_id').notNull().references(()=>requests.id),makerId:text('maker_id').notNull().references(()=>users.id),
 price:integer('price').notNull(),message:text('message').notNull(),days:integer('days').notNull(),status:text('status',{enum:['pending','accepted','rejected','withdrawn']}).notNull().default('pending'),
 createdAt:text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
},t=>[uniqueIndex('uq_offer_maker').on(t.requestId,t.makerId),uniqueIndex('uq_offer_accepted').on(t.requestId).where(sql`${t.status}='accepted'`),index('idx_offer_maker').on(t.makerId),check('offer_price',sql`${t.price}>0`),check('offer_status',sql`${t.status} in ('pending','accepted','rejected','withdrawn')`)]);
export const reviews=sqliteTable('reviews',{id:text('id').primaryKey(),offerId:text('offer_id').notNull().references(()=>offers.id),reviewerId:text('reviewer_id').notNull().references(()=>users.id),makerId:text('maker_id').notNull().references(()=>users.id),rating:integer('rating').notNull(),comment:text('comment').notNull(),createdAt:text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)},t=>[uniqueIndex('uq_review_offer').on(t.offerId),index('idx_review_maker').on(t.makerId),check('review_rating',sql`${t.rating} between 1 and 5`)]);
