const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createGoogleFavicons() {
  const sourcePath = path.join(__dirname, '..', 'public', 'dooriq-key.png');
  const publicDir = path.join(__dirname, '..', 'public');
  
  // Check if source file exists
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source file not found: ${sourcePath}`);
    process.exit(1);
  }
  
  console.log(`Using source image: ${sourcePath}`);
  
  // Read source image metadata
  const sourceImage = sharp(sourcePath);
  const metadata = await sourceImage.metadata();
  console.log(`Source image: ${metadata.width}x${metadata.height}`);
  
  // Create favicon.ico (must contain 16x16 and 32x32)
  // For .ico, we'll create PNG files first and then convert
  // Note: sharp doesn't support .ico directly, so we'll create separate PNGs
  // and use a proper .ico converter or create optimized PNGs
  
  // Create favicon-16x16.png
  await sourceImage
    .clone()
    .resize(16, 16, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('Created favicon-16x16.png');
  
  // Create favicon-32x32.png
  await sourceImage
    .clone()
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('Created favicon-32x32.png');
  
  // Create favicon.ico (48x48 for Google - multiple of 48px)
  // Since sharp doesn't directly support .ico, we'll create a 48x48 PNG
  // and name it favicon.ico (browsers will accept PNG as .ico)
  // For proper .ico, we'd need an additional library, but PNG works fine
  await sourceImage
    .clone()
    .resize(48, 48, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Created favicon.ico (48x48)');
  
  // Create apple-touch-icon.png (180x180)
  await sourceImage
    .clone()
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png (180x180)');
  
  // Also create additional sizes for better Google compatibility (96x96, 144x144)
  await sourceImage
    .clone()
    .resize(96, 96, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(publicDir, 'favicon-96x96.png'));
  console.log('Created favicon-96x96.png');
  
  await sourceImage
    .clone()
    .resize(144, 144, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(publicDir, 'favicon-144x144.png'));
  console.log('Created favicon-144x144.png');
  
  console.log('\n✅ All favicon files created successfully!');
  console.log('Files created in:', publicDir);
}

createGoogleFavicons().catch(console.error);

