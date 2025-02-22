# Be Loved Scheduler

A Next.js application for managing ride scheduling and coordination for Be Loved organization.

## Features

- User Authentication (Admin, Driver, Member)
- Ride Scheduling and Management
- Driver Assignment and Tracking
- Real-time Updates
- Member Management
- Administrative Dashboard

## Tech Stack

- Next.js 14
- TypeScript
- Supabase (Authentication & Database)
- Tailwind CSS
- Shadcn/ui Components

## Prerequisites

- Node.js 18.x or later
- npm or yarn
- Supabase account

## Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/be-loved-scheduler.git
   cd be-loved-scheduler
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Copy the environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Update the `.env.local` file with your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel Deployment

1. Push your code to GitHub.

2. Connect your GitHub repository to Vercel.

3. Configure the following environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`

4. Deploy!

### Supabase Setup

1. Create a new Supabase project.

2. Run the migrations in `supabase/migrations/` to set up the database schema.

3. Configure authentication providers in the Supabase dashboard.

4. Update the site URL in the Supabase authentication settings.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 