const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Path to the contract
const contractPath = path.join(__dirname, 'contracts', 'stPEAQ.sol');
const outputPath = path.join(__dirname, 'stPEAQ-flattened.sol');

// Run the hardhat flatten command
try {
  console.log('Flattening contract...');
  const flattenedCode = execSync(
    `npx hardhat flatten ${contractPath}`
  ).toString();

  // Remove duplicate SPDX license identifiers and pragma statements
  let processedCode = flattenedCode;
  const spdxPattern = /\/\/ SPDX-License-Identifier: .+\n/g;
  const pragmaPattern = /pragma solidity .+;\n/g;

  // Get the first occurrence of SPDX and pragma
  const firstSpdx = flattenedCode.match(spdxPattern)?.[0] || '';
  const firstPragma = flattenedCode.match(pragmaPattern)?.[0] || '';

  // Remove all SPDX and pragma statements
  processedCode = processedCode.replace(spdxPattern, '');
  processedCode = processedCode.replace(pragmaPattern, '');

  // Add back the first occurrence at the beginning
  processedCode = firstSpdx + firstPragma + processedCode;

  // Write the flattened code to a file
  fs.writeFileSync(outputPath, processedCode);
  console.log(
    `Contract flattened successfully. Output saved to: ${outputPath}`
  );
} catch (error) {
  console.error('Error flattening contract:', error.message);
}
