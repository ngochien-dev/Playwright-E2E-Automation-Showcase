/**
 * Allure Report Setup Script
 * Copy metadata files (environment, categories, executor) and history
 * into allure-results/ before generating the Allure report.
 * Cross-platform: works on both Windows and Linux (CI).
 */
const fs = require('fs');
const path = require('path');

const resultsDir = path.join(__dirname, 'allure-results');
const reportDir = path.join(__dirname, 'allure-report');
const metadataDir = path.join(__dirname, 'allure');

// Đảm bảo thư mục allure-results tồn tại
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// 1. Copy history từ report cũ (nếu có) → allure-results/history
const historySource = path.join(reportDir, 'history');
const historyDest = path.join(resultsDir, 'history');
if (fs.existsSync(historySource)) {
  if (!fs.existsSync(historyDest)) {
    fs.mkdirSync(historyDest, { recursive: true });
  }
  const files = fs.readdirSync(historySource);
  files.forEach(file => {
    fs.copyFileSync(
      path.join(historySource, file),
      path.join(historyDest, file)
    );
  });
  console.log(`✅ Copied ${files.length} history files for TREND chart`);
} else {
  console.log('⚠️  No previous history found (TREND will appear after 2+ runs)');
}

// 2. Copy metadata files (environment, categories, executor)
const metadataFiles = ['environment.properties', 'categories.json', 'executor.json'];
metadataFiles.forEach(file => {
  const src = path.join(metadataDir, file);
  const dest = path.join(resultsDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ Copied ${file} → allure-results/`);
  } else {
    console.log(`⚠️  ${file} not found in allure/ directory`);
  }
});

console.log('\n🚀 Allure metadata setup complete! Run "allure generate" now.');
