# Fastlytics Frontend

The official frontend repository for **Fastlytics**, a high-performance Formula 1 analytics platform. This application provides granular telemetry analysis, real-time race data, and historical performance comparisons in a visually striking interface.

## Features

- **Advanced Telemetry Analysis**: Interactive charts for throttle/brake traces, RPM, and speed comparisons.
- **Race Weekend Hub**: Live dashboard with session countdowns and weather updates.
- **Championship Standings**: Real-time driver and constructor points tracking.
- **Circuit Insights**: detailed historical data and track layout info.
- **Cyber-Brutalist Design**: A distinct aesthetic combining high contrast metrics with raw data presentation.

## Technology Stack

- **Core**: [React](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query), [Zustand](https://zustand-demo.pmnd.rs/)
- **Visualization**: [Recharts](https://recharts.org/), [Tremor](https://www.tremor.so/)

## Getting Started

### Prerequisites

- Node.js v18+
- Git

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/fastlytics/fastlytics-frontend.git
    cd fastlytics-frontend
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Configure environment**

    ```bash
    cp .env.example .env
    ```

    Update `.env` with your specific configuration (Supabase URL, API keys, etc.).

4.  **Start development server**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## Backend Setup

This frontend requires the **Fastlytics Backend** to function correctly.
Please refer to the [Fastlytics Backend Repository](https://github.com/fastlytics/fastlytics-backend) for API setup instructions.

## Contributing

We welcome contributions! Please review our [Contribution Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Distributed under the **AGPL-3.0** License. See `LICENSE` for more information.
