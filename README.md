# StreetSupply

A modern platform connecting street food vendors with trusted suppliers. Built with Next.js, Supabase, Tailwind CSS, and Radix UI.

---

## 🚀 Project Overview
StreetSupply is a B2B platform designed to streamline the supply chain for street food vendors and suppliers. It provides:
- Vendor dashboard for ordering supplies
- Supplier dashboard for managing products and orders
- Admin dashboard for supplier approvals and platform oversight
- Authentication and role-based access

---

## ✨ Features
- **Vendor Portal**: Browse products, manage cart, place orders, view order history, set location, and submit complaints
- **Supplier Portal**: Manage products, view and fulfill orders, track stats
- **Admin Portal**: Approve/reject suppliers, view platform analytics
- **Authentication**: Secure login and registration for vendors, suppliers, and admins
- **Role-based Dashboards**: Custom UI and features for each user type
- **Responsive UI**: Mobile-friendly, modern design

---

## 🛠️ Tech Stack
- **Frontend**: Next.js 15, React 19, Tailwind CSS, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: React Context, custom hooks
- **Other**: TypeScript, Zod, Lucide Icons

---

## ⚡ Getting Started

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd streetsupply-app
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Set up environment variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
NODE_ENV=development
```

### 4. Run the development server
```bash
pnpm dev
```
Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database & Migrations
- All SQL migration scripts are in the `scripts/` directory.
- To set up a new database, run the scripts in order:
  ```bash
  psql <your-db-url> < scripts/01-create-tables.sql
  psql <your-db-url> < scripts/02-create-policies.sql
  # ...and so on
  ```
- Uses Supabase for authentication, RLS, and storage.

---

## 📦 Project Structure
```
app/                # Next.js app directory
components/         # UI and dashboard components
hooks/              # Custom React hooks (auth, cart, etc.)
lib/                # Supabase client and utilities
public/             # Static assets
scripts/            # SQL migration scripts
styles/             # Global styles (Tailwind)
```

---

## 📝 Scripts
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Lint codebase

---

## 🙌 Contributing
1. Fork the repo
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your fork and open a Pull Request

---

## 🛡️ License
MIT

---

## 📬 Contact
For questions or support, open an issue or contact the maintainer. 
