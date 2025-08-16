# MYscholar

A comprehensive scholarship search and management platform built with Next.js, TypeScript, and modern web technologies.

## Features

- **Smart Profile Creation**: Upload CV or complete guided questionnaire
- **Intelligent Matching**: AI-powered scholarship recommendations
- **Real-time Search**: Streaming results with progress indicators
- **Advanced Filtering**: Filter by country, degree level, deadline, and more
- **Premium Features**: Unlimited searches, CSV export, priority ranking
- **Admin Console**: Comprehensive management and analytics dashboard
- **Responsive Design**: Optimized for all devices with 3D visual effects

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Cache**: Redis
- **Deployment**: Vercel
- **AI**: Gemini 1.5 Flash for advanced ranking

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
├── lib/                 # Utility functions and configurations
├── types/               # TypeScript type definitions
└── styles/              # Global styles and Tailwind config
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.