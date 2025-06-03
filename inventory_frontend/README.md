# Inventory Management System Frontend

A modern inventory management system built with Next.js, TypeScript, Material-UI, and Redux Toolkit.

## Features

- Modern UI with Material-UI components
- Responsive design for all devices
- Authentication and authorization
- Dashboard with key metrics
- Item management with barcode scanning
- Real-time alerts and notifications
- State management with Redux Toolkit

## Prerequisites

- Node.js 18.x or later
- npm 9.x or later

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd inventory-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory and add your environment variables:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8080/api
   ```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check for code issues

## Project Structure

```
inventory-frontend/
├── app/                    # Next.js app directory
│   ├── (authenticated)/    # Protected routes
│   │   ├── dashboard/      # Dashboard page
│   │   ├── items/         # Items management
│   │   └── alerts/        # Alerts page
│   ├── components/        # Reusable components
│   ├── services/          # API services
│   ├── store/            # Redux store and slices
│   └── login/            # Login page
├── public/               # Static files
└── styles/              # Global styles
```

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Material-UI](https://mui.com/) - UI components
- [Redux Toolkit](https://redux-toolkit.js.org/) - State management
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Axios](https://axios-http.com/) - HTTP client

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
