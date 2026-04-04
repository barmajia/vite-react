# Contributing to AuroraChat

Thank you for your interest in contributing to AuroraChat! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Collaborate openly

## Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/aurorachat.git
   cd aurorachat
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```
5. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### 1. Before Coding
- Check existing issues and pull requests
- Create or comment on an issue to discuss your change
- Ensure your idea aligns with project goals

### 2. While Coding
- Follow the coding standards below
- Write tests for new features
- Update documentation as needed
- Keep commits atomic and focused

### 3. Before Submitting
- Run all tests: `npm run test:all`
- Run linter: `npm run lint`
- Build the project: `npm run build`
- Update CHANGELOG.md if applicable

## Coding Standards

### TypeScript

- Use strict mode (enabled in tsconfig)
- Define explicit types for function parameters and return values
- Avoid `any` type; use `unknown` if necessary
- Use interfaces for object shapes
- Export types from dedicated type files

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User | null> {
  // implementation
}

// ❌ Avoid
function getUser(id: any): Promise<any> {
  // implementation
}
```

### React Components

- Use functional components with hooks
- Destructure props
- Use meaningful component names
- Keep components small and focused

```typescript
// ✅ Good
interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <button onClick={() => onAddToCart(product.id)}>
        Add to Cart
      </button>
    </div>
  );
}
```

### File Organization

- One component per file (usually)
- Co-locate related files (component, styles, tests)
- Use index.ts for exports when appropriate

```
src/components/product/
├── ProductCard.tsx
├── ProductCard.test.tsx
├── ProductList.tsx
├── ProductList.test.tsx
└── index.ts
```

### Naming Conventions

- **Files**: PascalCase for components/types, camelCase for utilities
- **Components**: PascalCase (e.g., `ProductCard`)
- **Functions/Variables**: camelCase (e.g., `getUser`, `isLoading`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- **Types/Interfaces**: PascalCase (e.g., `User`, `ProductData`)

### CSS/Tailwind

- Use Tailwind utility classes
- Extract repeated patterns into components
- Use `clsx` or `cn` utility for conditional classes

```typescript
// ✅ Good
import { cn } from '@/lib/utils';

function Button({ variant = 'primary', className }) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded font-medium',
        variant === 'primary' && 'bg-blue-500 text-white',
        variant === 'secondary' && 'bg-gray-200 text-gray-800',
        className
      )}
    />
  );
}
```

## Testing Guidelines

### Unit Tests

- Test business logic in hooks and utilities
- Test component rendering and interactions
- Mock external dependencies (API calls, etc.)
- Aim for meaningful coverage, not 100%

```typescript
// Example test
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  it('renders product name', () => {
    const product = { id: '1', name: 'Test Product', price: 9.99 };
    render(<ProductCard product={product} onAddToCart={() => {}} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('calls onAddToCart when button clicked', () => {
    const mockOnAddToCart = vi.fn();
    const product = { id: '1', name: 'Test Product', price: 9.99 };
    
    render(<ProductCard product={product} onAddToCart={mockOnAddToCart} />);
    
    fireEvent.click(screen.getByText('Add to Cart'));
    expect(mockOnAddToCart).toHaveBeenCalledWith('1');
  });
});
```

### E2E Tests

- Test critical user flows
- Test authentication and authorization
- Test payment flows (in sandbox mode)
- Keep tests deterministic

## Commit Guidelines

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(cart): add wishlist functionality

- Implement addToWishlist hook
- Add WishlistPage component
- Update navigation menu

Closes #123
```

```bash
fix(auth): resolve session timeout issue

Fix session not persisting after page refresh by ensuring
token is stored in both memory and localStorage.
```

```bash
docs(readme): update installation instructions
```

## Pull Request Process

### Before Creating a PR

1. Ensure all tests pass
2. Run linter and fix any issues
3. Rebase on latest main branch
4. Update documentation if needed

### PR Template

When creating a PR, include:

- **Description**: What does this PR do?
- **Type**: Feature, Bug Fix, Refactor, etc.
- **Issue Link**: Related issue number
- **Testing Done**: How was it tested?
- **Screenshots**: If UI changes (before/after)
- **Checklist**:
  - [ ] Tests added/updated
  - [ ] Documentation updated
  - [ ] Linting passes
  - [ ] Build succeeds

### Review Process

1. Maintainer reviews code
2. Address feedback promptly
3. Once approved, PR will be merged
4. Delete feature branch after merge

## Questions?

Feel free to open an issue for any questions or concerns about contributing.

Thank you for contributing to AuroraChat! 🎉
