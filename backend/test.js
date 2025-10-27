// test-inspect.js
const pdfModule = require('pdf-parse');

console.log('=== PDF Module Inspection ===');
console.log('Type:', typeof pdfModule);
console.log('Keys:', Object.keys(pdfModule));
console.log('\n=== Checking PDFParse ===');

if (pdfModule.PDFParse) {
  console.log('PDFParse exists');
  console.log('PDFParse type:', typeof pdfModule.PDFParse);
  console.log('PDFParse prototype methods:', Object.getOwnPropertyNames(pdfModule.PDFParse.prototype));
}

console.log('\n=== Checking VerbosityLevel ===');
if (pdfModule.VerbosityLevel) {
  console.log('VerbosityLevel:', pdfModule.VerbosityLevel);
}

console.log('\n=== Trying to instantiate ===');
try {
  const { PDFParse, VerbosityLevel } = pdfModule;
  const parser = new PDFParse(Buffer.from('test'), { verbosity: VerbosityLevel.ERRORS });
  console.log('Parser instance created');
  console.log('Parser methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(parser)));
} catch (error) {
  console.error('Error creating parser:', error.message);
}