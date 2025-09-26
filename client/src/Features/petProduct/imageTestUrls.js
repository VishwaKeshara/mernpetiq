// Test URLs for pet product images - you can use these for testing

export const sampleImageUrls = [
  // Direct image URLs from reliable sources
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop", 
  "https://images.unsplash.com/photo-1605033246387-fcf841af7d45?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=400&h=400&fit=crop",

  // Alternative sources
  "https://picsum.photos/400/400?random=1",
  "https://picsum.photos/400/400?random=2",
  "https://picsum.photos/400/400?random=3",
  
  // Placeholder service
  "https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Pet+Food",
  "https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=Pet+Toy",
  "https://via.placeholder.com/400x400/45B7D1/FFFFFF?text=Pet+Medicine",
];

// Instructions for using images
export const imageInstructions = `
📸 IMAGE URL TIPS:

1. ✅ WORKING URLS:
   - Unsplash: https://images.unsplash.com/photo-[id]
   - Lorem Picsum: https://picsum.photos/400/400
   - Via Placeholder: https://via.placeholder.com/400x400

2. ❌ PROBLEMATIC URLS:
   - Google Images (usually redirects)
   - Social media images (private/temporary)
   - Images requiring authentication

3. 🔧 TESTING:
   - Paste URL in browser to verify it loads
   - Right-click image → "Copy Image Address"
   - Use developer tools to check for CORS errors

4. 💡 TIPS:
   - Use square images (400x400) for best display
   - Ensure URL ends with image extension (.jpg, .png, .webp)
   - Some servers block hotlinking - use image hosting services
`;