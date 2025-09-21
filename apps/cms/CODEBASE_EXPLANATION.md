# Nam Việt EMS - Codebase Explanation

This document provides a comprehensive explanation of the Nam Việt Enterprise Management System (EMS) codebase, designed to help developers understand its structure, architecture, and core functionalities.

## 1. Introduction

Nam Việt EMS is a web-based application built to manage various aspects of the Nam Việt enterprise, including product and inventory management, financial transactions, sales, and purchasing. It features a modern React frontend and leverages Supabase for its backend services.

## 2. Tech Stack

The project is built with a modern and robust set of technologies:

-   **Frontend:** [React](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/) and [Vite](https://vitejs.dev/) for a fast development experience.
-   **UI Framework:** [Ant Design](https://ant.design/) is used for a comprehensive set of UI components, providing a consistent and professional look and feel.
-   **Backend:** [Supabase](https://supabase.com/) provides the backend-as-a-service, including:
    -   **Database:** A PostgreSQL database for data storage.
    -   **Authentication:** Manages user login and sessions.
    -   **Storage:** For file uploads like product images and transaction attachments.
    -   **Edge Functions:** Serverless Deno functions for custom backend logic.
-   **Routing:** [React Router](https://reactrouter.com/) (`react-router-dom`) handles all client-side navigation.
-   **Linting:** [ESLint](https://eslint.org/) is configured to maintain code quality.
-   **Package Manager:** [npm](https://www.npmjs.com/) is used for managing project dependencies.

## 3. Project Structure

The codebase is organized in a standard Vite/React project structure.

```
/nam-viet/
├── src/                  # Main application source code
│   ├── assets/           # Static files like images and logos
│   ├── components/       # Reusable, generic UI components (e.g., AppLayout)
│   ├── context/          # React Context providers (e.g., AuthContext)
│   ├── features/         # Components for specific business features (e.g., ProductForm)
│   ├── hooks/            # Custom React hooks (e.g., useDebounce)
│   ├── lib/              # Library initializations (e.g., Supabase client)
│   └── pages/            # Top-level components, each corresponding to a page/route
├── supabase/             # Supabase-specific configuration and code
│   └── functions/        # Serverless Edge Functions
└── ...                   # Root configuration files (package.json, vite.config.ts, etc.)
```

## 4. Architecture and Core Concepts

### Frontend Architecture

The frontend is a Single Page Application (SPA) built with React.

-   **Component Model:** The UI is broken down into three logical tiers:
    1.  **`pages`**: Top-level components that represent a full view (e.g., `Dashboard.tsx`, `Products.tsx`).
    2.  **`features`**: Complex, feature-specific components that encapsulate business logic (e.g., `ProductForm.tsx`, `TransactionCreationModal.tsx`).
    3.  **`components`**: Small, reusable, and generic UI elements (e.g., `AppLayout.tsx`).
-   **Routing:** `react-router-dom` maps URL paths to their corresponding `pages` components. The main routing logic is defined in `src/App.tsx` and `src/components/AppLayout.tsx`.
-   **State Management:**
    -   **Authentication:** User login state is managed globally via `AuthContext` (`src/context/AuthContext.tsx`), making session information available throughout the app.
    -   **Local State:** Most components manage their own state using React's `useState` and `useEffect` hooks.
-   **Data Fetching:** The application communicates with the Supabase backend via the client library initialized in `src/lib/supabaseClient.ts`.

### Backend Architecture (Supabase)

Supabase serves as the all-in-one backend.

-   **Database:** A PostgreSQL database stores all application data, including products, transactions, users, etc. The schema is described in `CODEBASE_DOCUMENTATION.md`.
-   **Storage:** Files are stored in Supabase Storage buckets:
    -   `product-images`: For product pictures.
    -   `transaction-attachments`: For financial documents.
-   **Edge Functions:** Custom server-side logic is implemented as Deno-based serverless functions in the `supabase/functions` directory.
    -   `enrich-product-data`: An AI-powered function that uses the Gemini API to automatically generate product descriptions, tags, and categories from a product name.
    -   `extract-from-pdf`: (Inferred) A function to parse uploaded PDF files and extract structured data to pre-fill forms.

## 5. Key Features

-   **Product Management:** Full CRUD for products with AI-powered data enrichment and PDF data extraction to streamline product creation. Inventory levels (min/max stock) can be set per warehouse.
-   **Financial Management:** Record income/expense transactions with an approval workflow for expenses. The system can generate VietQR codes for easy bank transfer payments. A real-time cash ledger provides an overview of all funds.
-   **B2B Sales (Quick Quote):** A tool for salespeople to quickly find the best wholesale price for a product, automatically applying the most advantageous active promotion.
-   **Purchasing:** The system can automatically generate draft purchase orders for products that are below their minimum stock levels.

## 6. Getting Started

Follow these steps to run the application locally.

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Environment Variables:** Create a `.env` file in the project root and add your Supabase project credentials:
    ```
    VITE_SUPABASE_URL=YOUR_SUPABASE_URL
    VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```
3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
4.  Open your browser and navigate to `http://localhost:5173`.

## 7. Deployment

The project is configured for deployment on **Vercel**, as indicated by the `vercel.json` file. This file ensures that all routes are correctly handled by the client-side router in the SPA.
