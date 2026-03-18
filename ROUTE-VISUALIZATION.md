# Route Visualization with repomap

## Overview

This project uses **repomap** for interactive route visualization and codebase exploration. It automatically detects routes defined with `react-router-dom` and provides a visual graph of your application structure.

## Quick Start

### Option 1: Using npm script (Recommended)
```bash
npm run routes
```

### Option 2: Using npx (No installation needed)
```bash
npx @wtdlee/repomap serve
```

### Option 3: Direct command (If installed globally)
```bash
repomap serve
```

## Access the Visualization

Once running, open your browser to:
```
http://localhost:3030
```

The server will automatically open a browser window for you.

## Features

### 🗺️ List View
- Browse all routes in a clean, filterable list
- See file paths for each route
- View authentication status
- Identify nested routes

### 🔗 Graph View
- Interactive force-directed graph
- Drag and zoom to explore
- Click nodes for details
- Visualize parent/child relationships

### 📊 Route Details
For each route, you can see:
- **File Path**: Location in your codebase
- **Path Pattern**: URL pattern (e.g., `/products/:id`)
- **Components**: Related React components
- **Auth Status**: Whether route is protected
- **Data Operations**: GraphQL/Supabase queries

## Your Aurora Routes

The visualization will show all your routes including:

### Public Routes
- `/` - Services Gateway
- `/products` - Product Listing
- `/product-details/:asin` - Product Details
- `/categories` - Categories
- `/services` - Services Marketplace

### Authenticated Routes
- `/cart` - Shopping Cart
- `/checkout` - Checkout
- `/orders` - Order History
- `/profile` - User Profile
- `/messages` - Messaging
- `/services/messages` - Services Messaging (New!)

### Services Routes
- `/services/dashboard` - Provider Dashboard
- `/services/dashboard/create-profile` - Create Provider Profile
- `/services/dashboard/create-listing` - Create Service Listing
- `/services/messages` - Services Inbox (New!)
- `/services/messages/:conversationId` - Services Chat (New!)

### Factory Routes
- `/factory` - Factory Dashboard
- `/factory/production` - Production Tracking
- `/factory/quotes` - Quote Requests
- `/factory/connections` - Factory Connections

## Configuration (Optional)

Create a `repomap.config.js` in your project root for custom settings:

```javascript
module.exports = {
  port: 3030,
  include: ['src/**/*.{ts,tsx}'],
  exclude: ['**/*.test.{ts,tsx}', '**/node_modules/**'],
  routes: {
    pattern: ['path', 'element', 'component'],
  },
};
```

## Integration with Development

Add to your development workflow:

```bash
# Terminal 1: Run development server
npm run dev

# Terminal 2: Run route visualization
npm run routes
```

This allows you to:
- See route changes in real-time
- Understand component hierarchy
- Navigate codebase quickly
- Document routes automatically

## Benefits for Your Project

1. **Onboarding**: New developers can understand the route structure quickly
2. **Documentation**: Always up-to-date route documentation
3. **Debugging**: Identify route conflicts or missing routes
4. **Refactoring**: See impact of route changes
5. **Architecture**: Visualize application structure

## Troubleshooting

**Issue: Routes not showing**
- Ensure routes are defined in `src/App.tsx` or imported route files
- Check that you're using `react-router-dom` v6+
- Verify `repomap` can access your `src` directory

**Issue: Port 3030 already in use**
```bash
# Change port in repomap.config.js
module.exports = {
  port: 3031, // Use different port
};
```

**Issue: Missing route details**
- Ensure components are imported (not lazy-loaded without proper annotations)
- Check for dynamic route patterns

## Additional Resources

- [repomap Documentation](https://github.com/wtdlee/repomap)
- [React Router Documentation](https://reactrouter.com/)

---

**Added:** March 18, 2026
**Package:** `@wtdlee/repomap` (devDependency)
**Command:** `npm run routes`
