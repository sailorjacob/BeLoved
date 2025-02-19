# BeLoved Transportation Scheduler

A ride scheduling system for BeLoved Transportation, built with Next.js and Supabase.

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