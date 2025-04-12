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
    
    // Create a square version of the logo for favicons
    const logoBuffer = await sharp(logoPath)
      // First, extract just the icon part without text by taking a square portion
      .extract({ left: 0, top: 0, width: 126, height: 126 })
      // Make it round by creating rounded corners, or apply other transformations if needed
      .toBuffer();
    
    // Generate standard favicons
    for (const size of sizes) {
      await sharp(logoBuffer)
        .resize(size, size)
        .toFile(path.join(faviconDir, `favicon-${size}x${size}.png`));
      console.log(`Generated ${size}x${size} favicon`);
    }
    
    // Generate Apple touch icon
    await sharp(logoBuffer)
      .resize(appleIconSize, appleIconSize)
      .toFile(path.join(faviconDir, 'apple-touch-icon.png'));
    console.log(`Generated ${appleIconSize}x${appleIconSize} Apple touch icon`);
    
    // Create favicon.ico (16x16 + 32x32)
    await sharp(logoBuffer)
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