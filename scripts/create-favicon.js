const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createSquareFavicon() {
  const sourcePath = path.join(process.env.HOME, 'Downloads', 'DoorIQ KEY .png');
  const outputPath = path.join(__dirname, '..', 'app', 'icon.png');
  
  // Read the source image
  const image = sharp(sourcePath);
  const metadata = await image.metadata();
  
  const { width, height } = metadata;
  const maxDimension = Math.max(width, height);
  
  console.log(`Source image: ${width}x${height}`);
  console.log(`Creating square canvas: ${maxDimension}x${maxDimension}`);
  
  // Use extend to add transparent padding to make it square
  const paddingTop = Math.floor((maxDimension - height) / 2);
  const paddingBottom = maxDimension - height - paddingTop;
  const paddingLeft = Math.floor((maxDimension - width) / 2);
  const paddingRight = maxDimension - width - paddingLeft;
  
  // First extend to make it square
  const squareImage = await image
    .extend({
      top: paddingTop,
      bottom: paddingBottom,
      left: paddingLeft,
      right: paddingRight,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();
  
  // Now resize the square image to 512x512
  await sharp(squareImage)
    .resize(512, 512, {
      fit: 'fill'
    })
    .png()
    .toFile(outputPath);
  
  console.log(`Created square favicon at: ${outputPath}`);
}

createSquareFavicon().catch(console.error);

