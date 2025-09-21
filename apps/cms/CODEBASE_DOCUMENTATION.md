# Nam Việt EMS - Codebase Documentation

This document provides a detailed explanation of the Nam Việt EMS (Enterprise Management System) codebase, including its architecture, data models, and core features.

## 1. Technologies

-   **Frontend:** React, TypeScript, Vite
-   **UI Framework:** Ant Design
-   **Backend Platform:** Supabase
-   **Routing:** React Router (`react-router-dom`)
-   **Linting:** ESLint
-   **Package Manager:** npm

## 2. Project Structure

The project follows a standard Vite-based React application structure.

```
/nam-viet/
├───src/
│   ├───assets/         # Static assets like logos
│   ├───components/     # Reusable UI components (e.g., AppLayout)
│   ├───context/        # React Context providers (e.g., AuthContext)
│   ├───features/       # Feature-specific components (e.g., ProductForm)
│   ├───hooks/          # Custom React hooks (e.g., useDebounce)
│   ├───lib/            # Library initializations (e.g., Supabase client)
│   └───pages/          # Top-level page components corresponding to routes
├───supabase/
│   └───functions/      # Serverless Edge Functions
└───...                 # Configuration files
```

## 3. Application Architecture

### Frontend

-   **Component-Based:** The UI is built with React, organized into three main categories:
    -   `pages`: Each file represents a distinct view or page accessible via a URL route.
    -   `features`: Contains more complex components that encapsulate a specific piece of business logic (e.g., `ProductForm`, `TransactionCreationModal`).
    -   `components`: Holds generic, reusable UI components like the main `AppLayout`.
-   **Routing:** `react-router-dom` is used for all client-side routing. The main routes are defined in `src/App.tsx` and `src/components/AppLayout.tsx`.
-   **State Management:**
    -   **Authentication:** User session and authentication state are managed globally via a React Context in `src/context/AuthContext.tsx`.
    -   **Component State:** Most feature-level state is managed locally within the respective components using `useState` and `useEffect`.
    -   **Debouncing:** A custom `useDebounce` hook is employed in search functionalities to delay API calls and improve performance.
-   **UI & Styling:** The application uses the [Ant Design](https://ant.design/) component library. A custom theme (`namVietTheme`) is defined in `src/components/AppLayout.tsx` to standardize colors and component styles, ensuring a consistent look and feel.

### Backend (Supabase)

-   **Database:** A PostgreSQL database hosts all application data. See the Data Models section for the schema.
-   **Authentication:** Supabase Auth handles user login and session management.
-   **Storage:** Supabase Storage is used to store user-uploaded files:
    -   `product-images`: For product pictures.
    -   `transaction-attachments`: For receipts or documents related to financial transactions.
-   **Serverless Functions:** Custom business logic is deployed as Deno-based Edge Functions:
    -   `enrich-product-data`: Called from the product form, this function uses the Gemini API to automatically generate a product description, tags, and category based on the product's name.
    -   `extract-from-pdf`: (Inferred from code) Called from the product form, this function likely extracts structured data from an uploaded PDF file to pre-fill the form fields.

## 4. Data Models (Database Schema)

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

## 5. Core Features in Detail

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

## 6. How to Run the Application

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Set up environment variables:** Create a `.env` file in the root directory and add your Supabase URL and Anon Key:
    ```
    VITE_SUPABASE_URL=YOUR_SUPABASE_URL
    VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```
3.  **Start the development server:**
    ```bash
    npm run dev
    ```
4.  Open your browser to `http://localhost:5173` (or the port specified in the Vite config).

## 7. Deployment

The presence of a `vercel.json` file indicates that the application is configured for deployment on the **Vercel** platform. The `rewrites` configuration ensures that all paths are correctly handled by the single-page application (SPA) routing.
