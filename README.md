# AibaiMall

A modern e-commerce website with admin dashboard for digital products in Tanzania. Built with Next.js, React, TypeScript, and Tailwind CSS.

## Features

### Customer Features
- 🛍️ **Product Catalog** - Browse digital products by category
- 🔍 **Search & Filter** - Find products quickly
- 🛒 **Shopping Cart** - Add, remove, and manage items
- 💳 **Checkout System** - Multiple payment methods (M-PESA, Airtel Money, Tigo Pesa)
- 📱 **Mobile Responsive** - Works perfectly on all devices
- ⚡ **Instant Delivery** - Digital products delivered immediately

### Admin Features
- 🔐 **Secure Login** - Username: PETTERR, Password: 54321
- 📊 **Dashboard Analytics** - Visitor statistics, sales data, conversion rates
- 📦 **Product Management** - Add, edit, delete products
- 📋 **Order Management** - Track and update order status
- 💰 **Payment Settings** - Configure mobile money payment details
- 📈 **Real-time Analytics** - Monitor website performance

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AibaiMall
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### For Customers
1. Browse products on the homepage
2. Add items to cart
3. Proceed to checkout
4. Choose payment method
5. Complete order

### For Admins
1. Click "Admin" link in the top navigation
2. Login with credentials:
   - Username: `PETTERR`
   - Password: `54321`
3. Access dashboard features:
   - **Overview**: Key metrics and recent activity
   - **Products**: Manage product catalog
   - **Orders**: Track and update orders
   - **Analytics**: View website statistics
   - **Payment Settings**: Configure payment details

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **UI Components**: Radix UI, Lucide React Icons
- **State Management**: React Hooks, Local Storage
- **Payment**: Mobile Money Integration (M-PESA, Airtel, Tigo)



## Payment Configuration

The admin can configure payment details in the dashboard:

- **M-PESA**: +255 753033342 (Peter Sichilima)
- **Airtel Money**: +255 689 489 845 (Peter Sichilima)
- **Tigo Pesa**: +255 0677780801 (Peter Sichilima)

These settings are stored in localStorage and can be updated anytime.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. **New Products**: Use the admin dashboard to add products
2. **Custom Categories**: Modify the CATEGORIES array in `app/page.tsx`
3. **Payment Methods**: Update payment settings in admin dashboard
4. **Styling**: Modify Tailwind classes or add custom CSS

## Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Static Export (InfinityFree compatible)**
   ```bash
   npm run export
   ```
   - This generates the static site in the `out` folder.
   - Upload the contents of `out` to your InfinityFree `htdocs/` directory via File Manager or FTP.
   - Ensure your domain/subdomain points to the hosting account.

3. **Other Platforms**
   - Vercel
   - Netlify
   - AWS
   - DigitalOcean

## Security Notes

- Admin credentials are hardcoded for demo purposes
- In production, implement proper authentication
- Use environment variables for sensitive data
- Add rate limiting and CSRF protection

## Support

For support or questions:
- Email: peterjoram897@gmail.com
- WhatsApp: +255 689 489 845
- Location: Dar es Salaam, Tanzania

## License

© 2024 AibaiMall. All rights reserved.
