# mentor.energy (Next.js)

An educational mentorship platform connecting geology/energy sector students with industry mentors in Nigeria.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Auth)
- **AI**: Anthropic Claude SDK
- **Icons**: Lucide React
- **State Management**: Zustand

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/gidiguru/mentor-energy-next.git
cd mentor-energy-next
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Protected dashboard
│   ├── mentors/           # Mentor browsing
│   ├── profile/           # User profile
│   ├── resources/         # Learning resources
│   └── signup/            # Registration
├── components/            # React components
├── lib/
│   ├── supabase/         # Supabase clients
│   ├── stores/           # Zustand stores
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
└── middleware.ts         # Auth middleware
```

## Features

- Multi-provider authentication (Email, Google, LinkedIn)
- User profiles with discipline/qualification tracking
- Learning modules with progress tracking
- AI-powered career guidance chatbot
- Mentor discovery and connection
- Responsive design with dark mode

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

This project can be deployed to:
- Vercel (recommended for Next.js)
- Netlify
- Any Node.js hosting platform

## License

MIT
