import {inngest} from './client'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Coupon from '@/models/Coupon'

// Inngest Function to save user data to a database
export const syncUserCreation = inngest.createFunction(
    {id: 'sync-user-create'},
 
    async ({ event }) => {
        await connectDB();
        const {data} = event
        await User.create({
            _id: data.id,
            email: data.email_addresses[0].email_address,
            name: `${data.first_name} ${data.last_name}`,
            image: data.image_url,
        })
    }
)

// Inngest Function to update user data in database 
export const syncUserUpdation = inngest.createFunction(
    {id: 'sync-user-update'},

    async ({ event }) => {
        await connectDB();
        const { data } = event
        await User.findByIdAndUpdate(data.id, {
            email: data.email_addresses[0].email_address,
            name: `${data.first_name} ${data.last_name}`,
            image: data.image_url,
        })
    }
)

// Inngest Function to delete user from database
export const syncUserDeletion = inngest.createFunction(
    {id: 'sync-user-delete'},
 
    async ({ event }) => {
        await connectDB();
        const { data } = event
        await User.findByIdAndDelete(data.id)
    }
)

// Inngest Function to delete coupon on expiry
export const deleteCouponOnExpiry = inngest.createFunction(
    {id: 'delete-coupon-on-expiry'},
    { event: 'app/coupon.expired' },
    async ({ event, step }) => {
        const { data } = event
        const expiryDate = new Date(data.expires_at)
        await step.sleepUntil('wait-for-expiry', expiryDate)

        await step.run('delete-coupon-from-database', async () => {
            await connectDB();
            await Coupon.findOneAndDelete({ code: data.code })
        })
    }
)


// Inngest Function to send daily promotional emails
export const sendDailyPromotionalEmail = inngest.createFunction(
    { id: 'send-daily-promotional-email' },
    { cron: '30 16 * * *' },
    async ({ step }) => {
        const template = await step.run('get-random-template', async () => {
            const { getRandomTemplate } = await import('@/lib/promotionalEmailTemplates');
            return getRandomTemplate();
        });
        const customers = await step.run('fetch-customers', async () => {
            await connectDB();
            const users = await User.find({ email: { $exists: true, $ne: null, $ne: '' } }).lean();
            return users;
        });
        const products = await step.run('fetch-products', async () => {
            await connectDB();
            const Product = (await import('@/models/Product')).default;
            const featuredProducts = await Product.find({ isPublished: true, stock: { $gt: 0 } }).sort({ sold: -1 }).limit(4).select('name price salePrice images').lean();
            return featuredProducts.map(p => ({ name: p.name, price: p.salePrice || p.price, originalPrice: p.salePrice ? p.price : null, image: p.images?.[0] }));
        });
        const emailResults = await step.run('send-emails', async () => {
            const { sendMail } = await import('@/lib/email');
            const results = [];
            for (const customer of customers) {
                try {
                    await sendMail({ to: customer.email, subject: template.subject, html: template.template(products) });
                    results.push({ email: customer.email, status: 'sent', template: template.id });
                } catch (error) {
                    results.push({ email: customer.email, status: 'failed', error: error.message });
                }
            }
            return results;
        });
        return { template: template.id, totalCustomers: customers.length, emailsSent: emailResults.filter(r => r.status === 'sent').length };
    }
)
