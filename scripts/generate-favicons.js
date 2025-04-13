const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Paths
const logoPath = path.join(__dirname, '../public/bloved-2.png');
const faviconDir = path.join(__dirname, '../public/favicons');

// Create favicon directory if it doesn't exist
if (!fs.existsSync(faviconDir)) {
  fs.mkdirSync(faviconDir, { recursive: true });
}

// Favicon sizes
const sizes = [16, 32, 192, 512];
const appleIconSize = 180;

// Generate standard favicons
async function generateFavicons() {
  try {
    console.log('Generating favicons...');
    
    // Get original logo dimensions
    const metadata = await sharp(logoPath).metadata();
    const { width, height } = metadata;
    
    // Create a square buffer with the logo properly centered
    // For the BeLoved logo, we'll use a specific approach to extract the heart portion
    // and center it properly in a square canvas with padding
    
    // First, detect the most important part of the logo (the heart icon)
    // Since the logo has two hearts, let's focus on the right side which has the red heart
    // We'll take approximately half of the logo from the right side where the red heart is
    
    const cropWidth = height; // Make it square based on height
    const cropLeft = Math.max(0, Math.floor(width / 2 - height / 4)); // Start from a position that captures the heart
    
    // Create a square buffer with the logo centered
    const squareLogoBuffer = await sharp(logoPath)
      // Crop to focus on the logo's heart portion
      .extract({ 
        left: cropLeft, 
        top: 0, 
        width: Math.min(cropWidth, width - cropLeft), 
        height: height 
      })
      // Resize to a reasonable working size while maintaining aspect ratio
      .resize({ 
        width: 500, 
        height: 500, 
        fit: 'contain', 
        background: { r: 255, g: 255, b: 255, alpha: 0 } 
      })
      // Ensure we have padding around the logo
      .extend({
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      // Create circular mask for the icon - this works well for the heart logo
      .composite([{
        input: Buffer.from(
          '<svg><circle cx="300" cy="300" r="280" fill="white"/></svg>'
        ),
        blend: 'dest-in'
      }])
      .toBuffer();
    
    // Generate standard favicons
    for (const size of sizes) {
      await sharp(squareLogoBuffer)
        .resize(size, size)
        .toFile(path.join(faviconDir, `favicon-${size}x${size}.png`));
      console.log(`Generated ${size}x${size} favicon`);
    }
    
    // Generate Apple touch icon
    await sharp(squareLogoBuffer)
      .resize(appleIconSize, appleIconSize)
      .toFile(path.join(faviconDir, 'apple-touch-icon.png'));
    console.log(`Generated ${appleIconSize}x${appleIconSize} Apple touch icon`);
    
    // Create favicon.ico (16x16 + 32x32)
    await sharp(squareLogoBuffer)
      .resize(32, 32)
      .toFile(path.join(faviconDir, 'favicon.ico'));
    console.log('Generated favicon.ico');
    
    console.log('All favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

// Run the generation
generateFavicons(); 