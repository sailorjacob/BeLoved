# Be-Loved Scheduler

A ride scheduling application built with Next.js, Supabase, and TypeScript.

## Features

- Member ride scheduling
- Driver ride management
- Admin dashboard
- Real-time ride status updates
- Recurring ride scheduling
- Driver assignment system

## Tech Stack

- Next.js 14
- TypeScript
- Supabase (Authentication & Database)
- Tailwind CSS
- Shadcn UI

## Prerequisites

- Node.js 18+ 
- npm or yarn
- A Supabase account

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/your-username/be-loved-scheduler.git
cd be-loved-scheduler
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up Supabase:
   - Create a new project at [Supabase](https://supabase.com)
   - Copy the SQL from `supabase/migrations/20240320000000_initial_schema.sql` and run it in the Supabase SQL editor
   - Get your project URL and anon key from the project settings

4. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase project URL and anon key

5. Run the development server:
```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Profiles
- User profiles for members, drivers, and admins
- Linked to Supabase Auth

### Rides
- Ride scheduling information
- Status tracking
- Payment tracking
- Recurring ride settings

### Driver Profiles
- Driver-specific information
- Ride completion statistics
- Status tracking

## Authentication

The app uses Supabase Authentication with the following user types:
- Members (can schedule rides)
- Drivers (can manage assigned rides)
- Admins (can manage all rides and users)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Environment Setup

### Development

1. Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

2. Update the environment variables in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_dev_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENV=development
```

### Production

1. Set up environment variables in your Vercel project settings:
```
NEXT_PUBLIC_SUPABASE_URL=your_prod_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_ENV=production
```

## Supabase Configuration

### Development

1. Create a new Supabase project for development
2. Enable Email Auth provider
3. Configure Auth Redirect URLs:
   - `http://localhost:3000/auth/callback`
4. Set up Row Level Security (RLS) policies
5. Add CORS origins:
   - `http://localhost:3000`

### Production

1. Create a new Supabase project for production
2. Enable Email Auth provider
3. Configure Auth Redirect URLs:
   - `https://your-domain.com/auth/callback`
4. Set up Row Level Security (RLS) policies
5. Add CORS origins:
   - `https://your-domain.com`

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Deployment

1. Push your changes to the main branch
2. Vercel will automatically deploy your changes
3. Ensure environment variables are set in Vercel
4. Verify Supabase production configuration

## Type Generation

To update TypeScript types for your Supabase database:

1. Install Supabase CLI
2. Login to Supabase
3. Generate types:
```bash
supabase gen types typescript --project-id your-project-id > types/supabase.ts
```

## Common Issues

### Authentication Issues
- Verify environment variables are set correctly
- Check Supabase Auth configuration
- Ensure redirect URLs are configured
- Check CORS settings in Supabase

### Database Issues
- Verify RLS policies
- Check database connection
- Ensure types are up to date

### Deployment Issues
- Verify production environment variables
- Check build logs in Vercel
- Ensure all dependencies are installed 

## Crew Carwash Stars Feature

The application includes a feature for tracking driver check-ins at Crew Carwash. This feature:

- Allows drivers to check in up to 5 times per week
- Tracks weekly stars (resets every Sunday at midnight)
- Maintains a cumulative total stars count for the driver's career
- Displays both weekly and total stars on the driver's dashboard

### Implementation Details

- Weekly stars are stored in the `weekly_stars_count` field in the `driver_profiles` table
- Total lifetime stars are stored in the `total_stars` field
- A database trigger automatically increments both weekly and total stars when a new check-in is recorded
- A Supabase Edge Function resets the weekly stars count every Sunday at midnight

### Deployment

To deploy the Edge Function and set up the weekly reset job:

```bash
# Make the script executable
chmod +x supabase/scripts/deploy-edge-function.sh

# Run the deployment script
./supabase/scripts/deploy-edge-function.sh
```

## Test Update

This line was added to test GitHub pushing functionality. 