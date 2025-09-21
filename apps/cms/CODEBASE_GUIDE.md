# Nam Việt EMS - Comprehensive Codebase Guide

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

-   **Database:** A PostgreSQL database stores all application data, including products, transactions, users, etc.
-   **Storage:** Files are stored in Supabase Storage buckets:
    -   `product-images`: For product pictures.
    -   `transaction-attachments`: For financial documents.
-   **Edge Functions:** Custom server-side logic is implemented as Deno-based serverless functions in the `supabase/functions` directory.
    -   `enrich-product-data`: An AI-powered function that uses the Gemini API to automatically generate product descriptions, tags, and categories from a product name.
    -   `extract-from-pdf`: (Inferred) A function to parse uploaded PDF files and extract structured data to pre-fill forms.

## 5. Data Models (Database Schema)

The core of the application revolves around these primary database tables:

-   `products`: Stores all information about a product, including its name, SKU, pricing details (`cost_price`, `wholesale_price`, `retail_price`), and descriptive metadata (`category`, `tags`, `manufacturer`).
-   `warehouses`: Defines the different storage locations (e.g., "Kho B2B", "Kho Bán Lẻ").
-   `inventory`: A linking table that tracks the stock levels (`quantity`, `min_stock`, `max_stock`) of each `product` in each `warehouse`.
-   `transactions`: Records all financial movements (income/expense). It includes details like amount, type, status (`chờ duyệt`, `đã chi`), payment method, and attachments.
-   `funds`: Represents different sources of money, either cash or bank accounts (`type: 'cash' | 'bank'`). It stores the initial balance.
-   `banks`: Contains a list of banks used for financial transactions.
-   `promotions`: Defines promotional campaigns, including their type (`percentage`, `fixed_amount`), value, and applicability conditions (e.g., minimum order value, applicable product categories).
-   `vouchers`: Stores individual discount codes linked to a specific `promotion`.
-   `purchase_orders`: Represents orders placed with suppliers to replenish stock.
-   `suppliers`: Stores information about product suppliers.

## 6. Core Features in Detail

-   **Product Management:**
    -   Full CRUD (Create, Read, Update, Delete) functionality for products.
    -   **AI Data Enrichment:** Users can click a button to automatically populate the product's description, category, and tags using an AI model.
    -   **PDF Data Extraction:** Users can upload a PDF (e.g., a supplier's product sheet) to automatically fill in the product creation form.
    -   **Inventory Settings:** For each product, users can define minimum and maximum stock levels on a per-warehouse basis.
    -   **Dynamic Price Calculation:** The product form automatically calculates wholesale and retail prices based on cost price and desired profit margins.

-   **Financial Management:**
    -   **Transaction Recording:** Users can create detailed income and expense records, including attaching documentary evidence.
    -   **Approval Workflow:** Expense transactions follow a simple workflow (`Chờ duyệt` -> `Đã duyệt - Chờ chi` -> `Đã chi`).
    -   **QR Code Generation:** For expense payments via bank transfer, the system automatically generates a VietQR code to streamline the payment process for the accountant.
    -   **Fund & Ledger Management:** The `CashLedger` provides a real-time overview of the balance in each fund and the total company balance. It also supports internal fund transfers.

-   **B2B Sales (Quick Quote):**
    -   A dedicated page for salespeople to quickly look up the best possible wholesale price for any product.
    -   The pricing engine automatically calculates the final price by applying the most advantageous active promotion applicable to that product.

-   **Purchasing:**
    -   The `PurchaseOrders` page provides an overview of all orders.
    -   Includes a feature to **automatically generate draft purchase orders** for all products that have fallen below their defined minimum stock level.

## 7. Getting Started

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

## 8. Deployment

The project is configured for deployment on **Vercel**, as indicated by the `vercel.json` file. This file ensures that all routes are correctly handled by the client-side router in the SPA.
