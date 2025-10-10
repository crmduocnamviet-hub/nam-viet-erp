# Development Rules

Core development rules and conventions for Nam Việt ERP project.

## 📋 Core Rules

### 1. **Yarn Workspace**

- ✅ **ALWAYS** use Yarn Workspace commands
- ✅ Install dependencies via root: `yarn add package-name -W`
- ✅ Run scripts via workspace: `yarn workspace @nam-viet-erp/cms dev`

```bash
# ✅ Correct
yarn cms:dev
yarn sale:dev
yarn add lodash -W

# ❌ Wrong
npm install
npm run dev
cd apps/cms && yarn dev
```

### 2. **Services Package**

- ✅ **ALL** API calls must go through `@nam-viet-erp/services`
- ✅ **NO** direct Supabase calls in components
- ✅ Use service functions for data access

```typescript
// ✅ Correct
import { getProducts, createProduct } from "@nam-viet-erp/services";

const { data, error } = await getProducts({ status: "active" });

// ❌ Wrong
import { supabase } from "../supabaseClient";

const { data } = await supabase.from("products").select("*");
```

### 3. **SQL Query Files**

- ✅ Complex SQL queries must be in `packages/services/query/` folder
- ✅ Format: `query/<feature-name>.txt`
- ✅ Use query files for new table creation, migrations, or complex joins

**Example**: `packages/services/query/product-lots.txt`

```sql
-- Create product_lots table
CREATE TABLE product_lots (
  id SERIAL PRIMARY KEY,
  lot_number VARCHAR(255) NOT NULL,
  product_id INTEGER REFERENCES products(id),
  warehouse_id INTEGER REFERENCES warehouses(id),
  quantity INTEGER DEFAULT 0,
  expiry_date DATE,
  batch_code VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. **Application Structure**

- ✅ **CMS App**: Management and administration features
- ✅ **Sale App**: Sales-focused features (POS, B2B, Medical)
- ✅ Clear separation of concerns between apps

**CMS App Features**:

- Product management (CRUD)
- Inventory control
- User & permission management
- Reports and analytics
- System configuration

**Sale App Features**:

- Point of Sale (POS)
- B2B order management
- Customer/Patient management
- Medical prescriptions
- Quick inventory lookup

## 🏗️ Architecture Rules

### 5. **Component Organization**

```typescript
// ✅ Shared components → shared-components package
import { ProductForm } from "@nam-viet-erp/shared-components";

// ✅ App-specific components → app's components folder
import { CmsHeader } from "../components/CmsHeader";

// ❌ Don't duplicate components between apps
```

### 6. **State Management**

```typescript
// ✅ Use Entity Store for domain entities
import { useEntityProduct } from "@nam-viet-erp/store";

const product = useEntityProduct(productId);

// ✅ Use specialized stores for specific features
import { usePosStore } from "@nam-viet-erp/store";

const { cart, addCartItem } = usePosStore();

// ❌ Don't use local state for shared data
const [product, setProduct] = useState(null); // Wrong for shared entities
```

### 7. **Service Updates**

```typescript
// ✅ Update Entity Store after API mutations
const handleCreate = async (data) => {
  const { data: result, error } = await createProduct(data);

  if (result) {
    useEntityStore.getState().setProduct(result);
  }
};

// ❌ Don't forget to update the store
const handleCreate = async (data) => {
  await createProduct(data); // Other screens won't sync!
};
```

## 📁 File Organization Rules

### 8. **Import Paths**

```typescript
// ✅ Use workspace names for cross-package imports
import { getProducts } from "@nam-viet-erp/services";
import { ProductForm } from "@nam-viet-erp/shared-components";
import { usePosStore } from "@nam-viet-erp/store";

// ❌ Don't use relative paths across packages
import { getProducts } from "../../../packages/services/src/productService";
```

### 9. **File Naming**

```bash
# ✅ Components: PascalCase
ProductForm.tsx
LotSelectionModal.tsx
PosTabContent.tsx

# ✅ Services: camelCase + Service suffix
productService.ts
lotManagementService.ts
inventoryService.ts

# ✅ Stores: camelCase + Store suffix
posStore.ts
entityStore.ts
authStore.ts

# ✅ Utilities: camelCase
menuGenerator.ts
priceCalculator.ts

# ✅ Types: PascalCase + .d.ts or interfaces
types.d.ts
IProduct.ts
```

### 10. **Query Files**

```bash
# ✅ Location: packages/services/query/
packages/services/query/
├── products.txt          # Product-related queries
├── product-lots.txt      # Lot management queries
├── inventory.txt         # Inventory queries
└── orders.txt           # Order queries

# ✅ Content: SQL queries with comments
-- Create product_lots table
CREATE TABLE product_lots (...);

-- Index for faster lookups
CREATE INDEX idx_lots_product ON product_lots(product_id);
```

## 🔧 Development Workflow Rules

### 11. **Branch Strategy**

```bash
# ✅ Feature branches
git checkout -b feature/product-lot-management
git checkout -b fix/pos-cart-issue
git checkout -b refactor/entity-store

# ✅ Descriptive commits
git commit -m "Add product lot selection modal for POS"
git commit -m "Fix cart quantity validation for lot-managed products"

# ❌ Don't commit directly to main
git checkout main
git commit -m "changes" # Wrong!
```

### 12. **Code Quality**

```bash
# ✅ Run linting before commit
yarn lint

# ✅ Fix linting issues
yarn workspace @nam-viet-erp/cms lint --fix
yarn workspace @nam-viet-erp/sale lint --fix

# ✅ Husky pre-commit hooks
# Automatically runs lint-staged on commit
```

### 13. **Testing**

```typescript
// ✅ Test services with mock data
import { getProducts } from '@nam-viet-erp/services';

describe('Product Service', () => {
  it('should fetch products', async () => {
    const { data, error } = await getProducts({ status: 'active' });
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});

// ✅ Test components with React Testing Library
import { render, screen } from '@testing-library/react';
import { ProductForm } from '@nam-viet-erp/shared-components';

test('renders product form', () => {
  render(<ProductForm />);
  expect(screen.getByLabelText('Product Name')).toBeInTheDocument();
});
```

## 🎯 TypeScript Rules

### 14. **Type Safety**

```typescript
// ✅ Use proper types from @nam-viet-erp/types or local types
import { IProduct, IProductLot } from "@nam-viet-erp/types";

const createProduct = (
  data: Omit<IProduct, "id">,
): Promise<{ data: IProduct | null; error: any }> => {
  // ...
};

// ❌ Don't use 'any' unless absolutely necessary
const createProduct = (data: any): Promise<any> => {
  // Wrong!
  // ...
};
```

### 15. **Interface vs Type**

```typescript
// ✅ Use Interface for object shapes
interface IProduct {
  id: number;
  name: string;
  price: number;
}

// ✅ Use Type for unions, intersections, utilities
type ProductStatus = "active" | "inactive" | "discontinued";
type ProductWithLots = IProduct & { lots: IProductLot[] };
```

## 🔐 Security Rules

### 16. **Environment Variables**

```bash
# ✅ Store sensitive data in .env
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-key

# ✅ Never commit .env files
# .gitignore should include:
.env
.env.local
.env.production

# ❌ Don't hardcode credentials
const supabaseUrl = 'https://xxxxx.supabase.co'; // Wrong!
```

### 17. **Permission Checks**

```typescript
// ✅ Check permissions before rendering
import { Screen, useScreens } from '@nam-viet-erp/shared-components';

const { hasPermission } = useScreens();

if (!hasPermission('pos.access')) {
  return <AccessDenied />;
}

// ✅ Use Screen component with automatic permission check
<Screen screenKey="pos.main" fallback={<AccessDenied />} />

// ❌ Don't skip permission checks
return <PosPage />; // Wrong! No permission check
```

## 🚀 Performance Rules

### 18. **Optimize Re-renders**

```typescript
// ✅ Use selective subscriptions
const product = useEntityProduct(productId); // Only re-renders when THIS product changes

// ✅ Use useMemo for expensive calculations
const sortedProducts = useMemo(
  () => products.sort((a, b) => a.name.localeCompare(b.name)),
  [products],
);

// ❌ Don't subscribe to entire store unnecessarily
const { products } = useEntityStore(); // Re-renders on ANY change
const product = products[productId]; // Inefficient
```

### 19. **API Call Optimization**

```typescript
// ✅ Use Entity Store to reduce API calls
const product = useEntityProduct(productId); // Cached in store

useEffect(() => {
  if (!product) {
    // Only fetch if not in store
    const fetch = async () => {
      const { data } = await getProductById(productId);
      if (data) {
        useEntityStore.getState().setProduct(data);
      }
    };
    fetch();
  }
}, [productId, product]);

// ❌ Don't fetch on every render
useEffect(() => {
  getProductById(productId); // Fetches every time!
}, [productId]);
```

## 📝 Documentation Rules

### 20. **Code Comments**

```typescript
// ✅ Comment complex logic
/**
 * Calculates the best price for a product based on active promotions.
 * Supports both percentage and fixed amount discounts.
 *
 * @param product - The product to calculate price for
 * @param promotions - List of active promotions
 * @returns Price info with final price and applied promotion
 */
const calculateBestPrice = (
  product: IProduct,
  promotions: IPromotion[],
): PriceInfo => {
  // ...
};

// ✅ Explain why, not what
// Use uppercase for lot numbers to maintain consistency with barcode scanning
form.setFieldValue("lot_number", value.toUpperCase());

// ❌ Don't state the obvious
// Set the value to uppercase
form.setFieldValue("lot_number", value.toUpperCase());
```

### 21. **README Files**

```bash
# ✅ Each package should have README.md
packages/
├── services/
│   ├── README.md          # Service usage guide
│   └── src/
├── shared-components/
│   ├── README.md          # Component library guide
│   └── src/
└── store/
    ├── README.md          # State management guide
    ├── ENTITY_STORE_GUIDE.md
    ├── QUICK_START.md
    └── src/
```

## ⚠️ Common Mistakes to Avoid

### ❌ Don't:

1. **Install packages in individual workspaces**

   ```bash
   cd apps/cms
   yarn add package # Wrong!
   ```

2. **Make direct Supabase calls**

   ```typescript
   import { supabase } from "./supabase";
   await supabase.from("products").select("*"); // Wrong!
   ```

3. **Forget to update Entity Store**

   ```typescript
   await createProduct(data);
   // Missing: useEntityStore.getState().setProduct(data);
   ```

4. **Use relative paths across packages**

   ```typescript
   import { ProductForm } from "../../../packages/shared-components"; // Wrong!
   ```

5. **Commit sensitive data**
   ```bash
   git add .env # Wrong!
   git commit -m "add config"
   ```

## ✅ Quick Checklist

Before committing code:

- [ ] Used `@nam-viet-erp/services` for all API calls
- [ ] Added SQL queries to `packages/services/query/` if needed
- [ ] Updated Entity Store after mutations
- [ ] Used proper TypeScript types
- [ ] Added necessary comments for complex logic
- [ ] Ran `yarn lint` and fixed issues
- [ ] Tested in both CMS and Sale apps if shared code
- [ ] No sensitive data in commits
- [ ] Proper workspace imports (no relative paths)
- [ ] Permission checks for protected features

## 📚 Related Documentation

- [Workspace Architecture](../architecture/workspace-architecture.md)
- [State Management](../architecture/state-management.md)
- [Coding Standards](./coding-standards.md)
- [Git Workflow](./git-workflow.md)
