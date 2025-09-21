# Codebase Overview

This document provides a high-level overview of the Nam Việt EMS codebase.

## Technologies

*   **Frontend:** React, TypeScript, Vite
*   **UI Framework:** Ant Design
*   **Backend:** Supabase (Database, Auth, Storage, Functions)
*   **Routing:** React Router
*   **Linting:** ESLint
*   **Package Manager:** npm

## Project Structure

The project is a standard Vite-based React application. The `src` directory contains the main application code.

```
/nam-viet/
├───.gitignore
├───eslint.config.js
├───index.html
├───package.json
├───README.md
├───tsconfig.app.json
├───tsconfig.json
├───tsconfig.node.json
├───vercel.json
├───vite.config.ts
├───.git/...
├───.vscode/
│   └───extensions.json
├───node_modules/...
├───public/
│   ├───logo192.png
│   ├───logo512.png
│   ├───manifest.json
│   └───vite.svg
├───src/
│   ├───App.css
│   ├───App.tsx
│   ├───index.css
│   ├───main.tsx
│   ├───vite-env.d.ts
│   ├───assets/
│   │   └───logo.png
│   ├───components/
│   │   └───AppLayout.tsx
│   ├───context/
│   │   └───AuthContext.tsx
│   ├───features/
│   │   ├───finance/
│   │   │   └───components/
│   │   │       ├───QRCodeDisplay.tsx
│   │   │       ├───QRCodePaymentModal.tsx
│   │   │       ├───TransactionCreationModal.tsx
│   │   │       └───TransactionViewModal.tsx
│   │   └───products/
│   │       └───components/
│   │           ├───ImageUpload.tsx
│   │           ├───PdfUpload.tsx
│   │           └───ProductForm.tsx
│   ├───hooks/
│   │   └───useDebounce.ts
│   ├───lib/
│   │   └───supabaseClient.ts
│   └───pages/
│       ├───CashLedger.tsx
│       ├───Dashboard.tsx
│       ├───FinancialTransactions.tsx
│       ├───FundManagement.tsx
│       ├───Login.tsx
│       ├───Products.tsx
│       ├───PromotionDetail.tsx
│       ├───Promotions.tsx
│       ├───PurchaseOrders.tsx
│       ├───QuickQuote.tsx
│       └───Vouchers.tsx
└───supabase/
    ├───config.toml
    ├───.temp/
    │   ├───cli-latest
    │   ├───gotrue-version
    │   ├───pooler-url
    │   ├───postgres-version
    │   ├───project-ref
    │   ├───rest-version
    │   └───storage-version
    └───enrich-product-data/
        └───index.ts
```

### `src` Directory

*   **`assets`**: Contains static assets like images.
*   **`components`**: Contains reusable components, such as the main application layout (`AppLayout.tsx`).
*   **`context`**: Contains React context providers, such as the `AuthContext.tsx` for managing user authentication.
*   **`features`**: Contains components that are specific to a particular feature, such as `finance` or `products`.
*   **`hooks`**: Contains custom React hooks, such as `useDebounce.ts`.
*   **`lib`**: Contains library initializations, such as the Supabase client (`supabaseClient.ts`).
*   **`pages`**: Contains the main pages of the application. Each file in this directory corresponds to a route.

### `supabase` Directory

*   **`functions`**: Contains serverless functions that are deployed to Supabase.
    *   **`enrich-product-data`**: A serverless function that uses the Gemini API to enrich product data.

## Application Flow

1.  The application starts in `src/main.tsx`, which renders the `App` component.
2.  The `App` component in `src/App.tsx` sets up the main application routing. It uses the `useAuth` hook to check if a user is logged in.
3.  If the user is not logged in, the `Login` page is displayed.
4.  If the user is logged in, the `AppLayout` component is displayed.
5.  The `AppLayout` component in `src/components/AppLayout.tsx` sets up the main application layout, including the sidebar menu and header. It also defines the routes for the different pages of the application.

## Features

### Authentication

*   User authentication is handled by Supabase Auth.
*   The `AuthContext` in `src/context/AuthContext.tsx` provides the user's session and loading state to the rest of the application.
*   The `Login` page in `src/pages/Login.tsx` handles the user login form.

### Products

*   The `Products` page in `src/pages/Products.tsx` displays a list of products and allows users to add, edit, and delete products.
*   The `ProductForm` component in `src/features/products/components/ProductForm.tsx` is used to create and edit products.
*   The `ImageUpload` and `PdfUpload` components in `src/features/products/components/` are used to upload product images and PDFs.
*   The `enrich-product-data` serverless function is used to enrich product data with information from the Gemini API.

### Finance

*   The `FinancialTransactions` page in `src/pages/FinancialTransactions.tsx` displays a list of financial transactions and allows users to create new transactions.
*   The `TransactionCreationModal` and `TransactionViewModal` components in `src/features/finance/components/` are used to create and view financial transactions.
*   The `QRCodeDisplay` and `QRCodePaymentModal` components in `src/features/finance/components/` are used to display and create QR codes for payments.
*   The `CashLedger` page in `src/pages/CashLedger.tsx` displays a summary of the company's cash flow.
*   The `FundManagement` page in `src/pages/FundManagement.tsx` allows users to manage the company's funds.

### Other Features

*   **Dashboard:** The `Dashboard` page in `src/pages/Dashboard.tsx` displays a summary of the company's performance.
*   **Quick Quote:** The `QuickQuote` page in `src/pages/QuickQuote.tsx` allows users to quickly generate a quote for a customer.
*   **Promotions:** The `Promotions` page in `src/pages/Promotions.tsx` allows users to create and manage promotions.
*   **Vouchers:** The `Vouchers` page in `src/pages/Vouchers.tsx` allows users to create and manage vouchers.
*   **Purchase Orders:** The `PurchaseOrders` page in `src/pages/PurchaseOrders.tsx` allows users to create and manage purchase orders.

## How to Run the Application

1.  Install the dependencies:
    ```
    npm install
    ```
2.  Start the development server:
    ```
    npm run dev
    ```
3.  Open your browser to `http://localhost:5173` (or the port specified in the Vite config).
