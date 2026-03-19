const fs = require('fs');
const path = require('path');
const localesDir = path.join(__dirname, 'public', 'locales');

const keys = {
  "common": {
    "justNow": "Just now",
    "minutesAgo": "{{count}}m ago",
    "hoursAgo": "{{count}}h ago",
    "daysAgo": "{{count}}d ago",
    "markAllRead": "Mark all read",
    "noNotifications": "No notifications",
    "viewAllNotifications": "View all notifications",
    "reviews": "Reviews",
    "dashboard": "Dashboard"
  },
  "auth": {
    "joinNow": "Join Now",
    "signIn": "Sign In",
    "signOut": "Sign Out"
  },
  "services": { 
    "loading": "Loading services...", 
    "categoryNotFound": "Category not found", 
    "browseAll": "Browse All Services", 
    "backToServices": "Back to Services", 
    "subcategories": "Subcategories", 
    "listingsFound": "{{count}} Listings Found", 
    "viewDetails": "View Details →", 
    "provider": "Provider:", 
    "unknown": "Unknown", 
    "noListings": "No listings in this category yet", 
    "checkBack": "Check back later or explore other categories",
    "findTalent": "Find Talent",
    "healthcare": "Healthcare",
    "allServices": "All Services",
    "shopProducts": "Shop Products",
    "searchPlaceholder": "Search services...",
    "verified": "Verified",
    "becomeProvider": "Become a Provider",
    "auroraServices": "Aurora Services"
  },
  "servicesHome": { 
    "heroTitle": "Find Expert Services & Freelancers", 
    "heroSubtitle": "From software development to consulting, find the right professional for your needs.", 
    "searchPlaceholder": "Search for services...", 
    "browseByCategory": "Browse by Category", 
    "recentListings": "Recent Service Listings", 
    "viewAll": "View All →", 
    "active": "Active:", 
    "yes": "Yes", 
    "no": "No", 
    "noListings": "No service listings yet", 
    "createFirst": "Create First Listing", 
    "areYouProvider": "Are you a Service Provider?", 
    "joinAurora": "Join Aurora and start offering your services. Create your profile and connect with clients.", 
    "startOffering": "Start Offering Services" 
  },
  "productList": { "noProducts": "No products found.", "noProductsDesc": "Sorry, we couldn't find any products.", "sort": "Sort by", "newest": "Newest First", "oldest": "Oldest First", "priceLowHigh": "Price: Low to High", "priceHighLow": "Price: High to Low", "nameAZ": "Name: A to Z", "nameZA": "Name: Z to A", "title": "Products", "subtitle": "Browse our collection", "searchResults": "Results for \"{{query}}\"", "showingResults": "Showing {{start}}-{{end}} of {{total}} products", "showingAll": "Showing {{count}} products", "allProducts": "All Products" },
  "filter": { "title": "Filters", "category": "Category", "allCategories": "All Categories", "brand": "Brand", "allBrands": "All Brands", "priceRange": "Price Range", "min": "Min", "max": "Max", "minRating": "Minimum Rating", "anyRating": "Any Rating", "fourPlusStars": "4+ Stars", "threePlusStars": "3+ Stars", "twoPlusStars": "2+ Stars", "onePlusStar": "1+ Stars", "clearAll": "Clear All" },
  "productDetail": { "signInToCart": "Please sign in to add items to cart", "addedToCart": "Added to cart!", "failedAddToCart": "Failed to add to cart", "signInToChat": "Please sign in to chat with seller", "sellerInfoUnavailable": "Seller information not available", "cannotChatSelf": "You can't chat with yourself", "linkCopied": "Link copied to clipboard!", "signInToReview": "Please sign in to write a review", "reviewSubmitted": "Review submitted!", "failedSubmitReview": "Failed to submit review", "loading": "Loading product...", "notFound": "Product not found", "notFoundDesc": "The product you're looking for doesn't exist or has been removed.", "soldBy": "Sold by", "seller": "Seller", "onlyLeft": "Only {{count}} left", "buyNow": "Buy Now", "startingChat": "Starting chat...", "askSeller": "Ask Seller a Question", "freeShipping": "Free Shipping", "freeShippingDesc": "On orders over $50", "securePaymentDesc": "100% protected", "easyReturns": "Easy Returns", "easyReturnsDesc": "30-day policy", "support247": "24/7 Support", "supportDesc": "Here to help", "customerReviews": "Customer Reviews", "basedOnReviews": "Based on {{count}} reviews", "writeReview": "Write a Review", "commentOptional": "Comment (optional)", "commentPlaceholder": "Share your experience with this product...", "submitReview": "Submit Review", "noReviewsYet": "No reviews yet", "beFirstReview": "Be the first to review this product" },
  "category": { "notFound": "Category not found", "notFoundDesc": "The category you're looking for doesn't exist or is inactive." },
  "serviceDetail": { "signInToBook": "Please sign in to book this service", "bookingComingSoon": "Service booking feature coming soon!", "contactForPricing": "Contact for pricing", "loading": "Loading service details...", "notFound": "Service not found", "browseServices": "Browse Services", "serviceProvider": "Service Provider", "providerSince": "Provider since {{date}}", "projectReqs": "Project Requirements", "reqPlaceholder": "Describe your project requirements, timeline, and any specific needs...", "bookService": "Book This Service", "secureBooking": "Secure booking", "satisfactionGuaranteed": "Satisfaction guaranteed", "fastDelivery": "Fast delivery" }
};

fs.readdirSync(localesDir).forEach(lang => {
  const file = path.join(localesDir, lang, 'translation.json');
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    let changed = false;
    
    // Process sections
    for (const section in keys) {
      if (!data[section]) {
        data[section] = keys[section];
        changed = true;
      } else {
        // Deep merge for existing sections (like common)
        for (const key in keys[section]) {
          if (!data[section][key]) {
            data[section][key] = keys[section][key];
            changed = true;
          }
        }
      }
    }
    
    if (changed) {
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      console.log('Fixed ' + lang);
    }
  }
});
