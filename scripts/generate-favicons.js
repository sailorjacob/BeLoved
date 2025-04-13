const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Paths
const logoPathSVG = path.join(__dirname, '../public/source-images/beloved-hearts-logo.svg');
const logoPathPNG = path.join(__dirname, '../public/source-images/beloved-hearts-logo.png');
const faviconDir = path.join(__dirname, '../public/favicons');

// Create favicon directory if it doesn't exist
if (!fs.existsSync(faviconDir)) {
  fs.mkdirSync(faviconDir, { recursive: true });
}

// If the source-images directory doesn't exist, create it
const sourceDir = path.join(__dirname, '../public/source-images');
if (!fs.existsSync(sourceDir)) {
  fs.mkdirSync(sourceDir, { recursive: true });
}

// Favicon sizes
const sizes = [16, 32, 192, 512];
const appleIconSize = 180;

// Generate standard favicons
async function generateFavicons() {
  try {
    console.log('Generating favicons...');

    // Use the SVG as our source if it exists
    let sourceFile = fs.existsSync(logoPathSVG) ? logoPathSVG : logoPathPNG;
    
    if (!fs.existsSync(sourceFile)) {
      console.error('Logo file not found at:', sourceFile);
      throw new Error('No logo file found to work with');
    }
    
    console.log(`Using source file: ${sourceFile}`);
    
    // If using SVG, create an optimized version with proper viewBox
    let optimizedSourceFile = sourceFile;
    if (sourceFile.endsWith('.svg')) {
      const tmpSvgPath = path.join(faviconDir, 'temp-optimized.svg');
      let svgContent = fs.readFileSync(sourceFile, 'utf8');
      
      // Extract just the content of the SVG, adjusting the viewBox to add padding around the hearts
      const optimizedSvg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="800" height="800" viewBox="-150 -150 900 800" xmlns="http://www.w3.org/2000/svg">
  <!-- Left pink heart -->
  <path d="M300,0 C200,-100 0,-100 0,100 C0,250 150,400 300,500 C450,400 600,250 600,100 C600,-100 400,-100 300,0 Z" 
        fill="#ffb6c1" transform="translate(-150, 0) scale(0.9)" />
  
  <!-- Right red heart -->
  <path d="M300,0 C200,-100 0,-100 0,100 C0,250 150,400 300,500 C450,400 600,250 600,100 C600,-100 400,-100 300,0 Z" 
        fill="#ff0033" transform="translate(150, 0) scale(0.9)" />
        
  <!-- Bottom accent curve -->
  <path d="M250,450 C400,500 550,450 650,400" stroke="#ffb6c1" stroke-width="30" fill="none" />
</svg>`;
      
      fs.writeFileSync(tmpSvgPath, optimizedSvg);
      optimizedSourceFile = tmpSvgPath;
    }
    
    // Generate standard favicons - preserve original colors with better scaling
    for (const size of sizes) {
      await sharp(optimizedSourceFile)
        .resize(size, size, { 
          fit: 'inside',  // Changed from 'fill' to 'inside'
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(path.join(faviconDir, `favicon-${size}x${size}.png`));
      console.log(`Generated ${size}x${size} favicon`);
    }
    
    // Generate Apple touch icon
    await sharp(optimizedSourceFile)
      .resize(appleIconSize, appleIconSize, { 
        fit: 'inside',  // Changed from 'fill' to 'inside'
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(path.join(faviconDir, 'apple-touch-icon.png'));
    console.log(`Generated ${appleIconSize}x${appleIconSize} Apple touch icon`);
    
    // Create favicon.ico
    await sharp(optimizedSourceFile)
      .resize(32, 32, { 
        fit: 'inside',  // Changed from 'fill' to 'inside'
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(path.join(faviconDir, 'favicon.ico'));
    console.log('Generated favicon.ico');
    
    // For Safari pinned tabs we need a monochrome SVG
    if (sourceFile.endsWith('.svg')) {
      // Create a copy of the SVG
      fs.copyFileSync(optimizedSourceFile, path.join(faviconDir, 'safari-pinned-tab.svg'));
      
      // Update the SVG to have solid black fill for pinned tabs
      let svgContent = fs.readFileSync(path.join(faviconDir, 'safari-pinned-tab.svg'), 'utf8');
      svgContent = svgContent.replace(/fill="#[^"]*"/g, 'fill="#000000"');
      svgContent = svgContent.replace(/stroke="#[^"]*"/g, 'stroke="#000000"');
      fs.writeFileSync(path.join(faviconDir, 'safari-pinned-tab.svg'), svgContent);
    } else {
      // Create a generic heart SVG for Safari pinned tabs
      const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(212, 312)">
    <path d="M300,0 C200,-100 0,-100 0,100 C0,250 150,400 300,500 C450,400 600,250 600,100 C600,-100 400,-100 300,0 Z" 
          fill="#000000" transform="translate(-150, 0) scale(0.9)" />
    <path d="M300,0 C200,-100 0,-100 0,100 C0,250 150,400 300,500 C450,400 600,250 600,100 C600,-100 400,-100 300,0 Z" 
          fill="#000000" transform="translate(150, 0) scale(0.9)" />
    <path d="M250,450 C400,500 550,450 650,400" stroke="#000000" stroke-width="30" fill="none" />
  </g>
</svg>`;
      fs.writeFileSync(path.join(faviconDir, 'safari-pinned-tab.svg'), svgContent);
    }
    console.log('Generated safari-pinned-tab.svg');
    
    // Clean up temporary file if created
    if (optimizedSourceFile !== sourceFile && fs.existsSync(optimizedSourceFile)) {
      fs.unlinkSync(optimizedSourceFile);
    }
    
    console.log('All favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

// Run the generation
generateFavicons(); 