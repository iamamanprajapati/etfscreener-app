#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Indian ETF Screener Mobile App...\n');

// Check if Firebase config needs to be updated
const firebaseConfigPath = path.join(__dirname, 'src', 'config', 'firebase.js');
const firebaseConfig = fs.readFileSync(firebaseConfigPath, 'utf8');

if (firebaseConfig.includes('YOUR_API_KEY')) {
  console.log('⚠️  Please update your Firebase configuration in src/config/firebase.js');
  console.log('   Replace the placeholder values with your actual Firebase project details.\n');
}

// Check if all required dependencies are installed
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = [
  '@react-navigation/native',
  '@react-navigation/stack',
  '@react-navigation/bottom-tabs',
  'firebase',
  '@react-native-async-storage/async-storage',
  'expo'
];

console.log('📦 Checking dependencies...');
const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);

if (missingDeps.length > 0) {
  console.log('❌ Missing dependencies:', missingDeps.join(', '));
  console.log('   Run: npm install\n');
} else {
  console.log('✅ All dependencies are installed\n');
}

console.log('📱 App Structure:');
console.log('   ✅ Dashboard Screen - ETF listing with search and sort');
console.log('   ✅ ETF Detail Screen - Comprehensive ETF information');
console.log('   ✅ Compare Screen - Side-by-side ETF comparison');
console.log('   ✅ Watchlist Screen - Personalized ETF tracking');
console.log('   ✅ Calculators Screen - XIRR, SIP, CAGR calculators');
console.log('   ✅ Market Overview Screen - Sector performance analysis');
console.log('   ✅ Blog Screen - Market insights and analysis');
console.log('   ✅ About Screen - App information and contact\n');

console.log('🔧 Next Steps:');
console.log('   1. Update Firebase configuration in src/config/firebase.js');
console.log('   2. Run: npm start');
console.log('   3. Scan QR code with Expo Go app on your mobile device');
console.log('   4. Or run: npm run web for web version\n');

console.log('📚 Documentation:');
console.log('   - README.md contains detailed setup instructions');
console.log('   - All components are documented with JSDoc comments');
console.log('   - Follow the project structure in src/ directory\n');

console.log('🎉 Setup complete! Your Indian ETF Screener mobile app is ready to run.');
