const fs = require("fs");
const path = require("path");

// Read the TTF font file
const fontPath = "/tmp/Roboto-Regular.ttf";
const fontBuffer = fs.readFileSync(fontPath);
const base64Font = fontBuffer.toString("base64");

// Create the font file for jsPDF
const fontFile = `
// Auto-generated Vietnamese font for jsPDF
export const RobotoRegular = '${base64Font}';
`;

// Write to file
const outputPath = path.join(
  __dirname,
  "..",
  "packages",
  "shared-components",
  "src",
  "utils",
  "RobotoFont.ts",
);
fs.writeFileSync(outputPath, fontFile);

console.log("Font converted successfully to:", outputPath);
