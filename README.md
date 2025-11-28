# 🏎️ Fastlytics

**Fastlytics** is a high-performance, cyber-brutalist Formula 1 analytics platform designed for fans who crave data depth without the engineering degree. It provides real-time insights, historical data analysis, and telemetry comparisons in a visually striking interface.

![Fastlytics Banner](https://placehold.co/1200x400/000000/DC2626?text=FASTLYTICS&font=oswald)

## 🚀 Features

### � Frontend (React + Vite)
Built with a **cyber-brutalist** aesthetic, focusing on raw data presentation, high contrast, and performance.

*   **📊 Advanced Telemetry Analysis**:
    *   **Throttle & Brake Traces**: Compare driver inputs through corners.
    *   **RPM & Speed Analysis**: Visualize engine performance and top speeds.
    *   **Gear Shift Maps**: Animated visualizations of gear changes around the circuit.
    *   **Track Dominance**: Heatmaps showing where drivers gain or lose time.
*   **🏎️ Race Weekend Hub**:
    *   **Live Dashboard**: Countdown to the next session, weather updates, and immediate insights.
    *   **Interactive Calendar**: Browse past and upcoming races with detailed circuit info.
*   **🏆 Championship Standings**:
    *   **Driver & Team Standings**: Up-to-date points, wins, and podiums.
    *   **"Champion" Status**: Automatically highlights mathematical winners.
*   **🔍 SEO Optimized**: Dynamic meta tags and structured data for better discoverability.

### ⚙️ Backend (FastAPI + Python)
A robust API layer powered by **FastF1** to fetch and process granular Formula 1 data.

*   **⚡ High-Performance API**: Built with **FastAPI** for low-latency responses.
*   **📚 FastF1 Integration**: Direct access to official F1 timing and telemetry data.
*   **💾 Smart Caching**:
    *   **Local Caching**: Processed data is stored locally to minimize external API calls.
    *   **Supabase Integration**: Uses PostgreSQL for structured data storage and authentication.
*   **🔄 Automated Ingestion**: Scripts to seed and update race data automatically.

---

## 🛠️ Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend** | [React](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/), [HugeIcons](https://hugeicons.com/) |
| **State & Data** | [TanStack Query](https://tanstack.com/query), [Zustand](https://zustand-demo.pmnd.rs/) |
| **Charts** | [Recharts](https://recharts.org/), [Tremor](https://www.tremor.so/) |
| **Backend** | [FastAPI](https://fastapi.tiangolo.com/), [Python 3.10+](https://www.python.org/) |
| **Data Source** | [FastF1](https://docs.fastf1.dev/) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **Deployment** | Docker, Vercel (Frontend), Cloud Platform (Backend) |

---

## 📂 Project Structure

```bash
Fastlytics/
├── backend-api/          # Python FastAPI Backend
│   ├── api/              # API Routes and Endpoints
│   ├── data_cache/       # Local JSON cache for processed F1 data
│   ├── main.py           # Application entry point
│   ├── processor.py      # Data processing scripts
│   └── requirements.txt  # Python dependencies
├── src/                  # React Frontend
│   ├── components/       # Reusable UI components & Charts
│   ├── pages/            # Main application pages (Dashboard, Race, etc.)
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utilities and helpers
├── public/               # Static assets
└── package.json          # Frontend dependencies
```

---

## ⚡ Getting Started

### Prerequisites
*   **Node.js** v18+
*   **Python** 3.10+
*   **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/subhashhhhhh/Fastlytics.git
cd Fastlytics
```

### 2. Frontend Setup
1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Configure environment variables:
    ```bash
    cp .env.example .env
    ```
    *   Update `.env` with your specific keys (e.g., `VITE_UMAMI_WEBSITE_ID`).
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:5173`.

### 3. Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend-api
    ```
2.  Create a virtual environment (recommended):
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure environment variables:
    Create a `.env` file in `backend-api/` with the following:
    ```env
    FASTLYTICS_API_KEY=your_secret_key
    FRONTEND_URL=http://localhost:5173
    ```
5.  Run the data processor (initial data fetch):
    ```bash
    python processor.py
    ```
6.  Start the API server:
    ```bash
    uvicorn main:app --reload
    ```
    The API will be available at `http://localhost:8000`.

---

## 🤝 Contributing

We welcome contributions from the community! Whether it's fixing a bug, improving the documentation, or adding a new feature.

1.  **Fork** the repository.
2.  Create a new **branch** (`git checkout -b feature/AmazingFeature`).
3.  **Commit** your changes (`git commit -m 'Add some AmazingFeature'`).
4.  **Push** to the branch (`git push origin feature/AmazingFeature`).
5.  Open a **Pull Request**.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🙏 Acknowledgments

*   **[FastF1](https://github.com/theOehrly/Fast-F1)** - The backbone of our data analysis.
*   **[Supabase](https://supabase.com/)** - For providing an excellent backend-as-a-service.
*   **[Shadcn UI](https://ui.shadcn.com/)** - For the beautiful, accessible component primitives.
