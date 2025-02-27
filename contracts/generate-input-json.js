const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to the contract
const contractName = 'stPEAQ';
const contractPath = path.join(__dirname, 'contracts', `${contractName}.sol`);
const outputPath = path.join(__dirname, `${contractName}-input.json`);

// Run hardhat with the --input-json flag to get the input JSON
try {
  console.log('Generating Standard-Input-JSON...');

  // Create a temporary file to store the compiler input
  const tempFile = path.join(__dirname, 'temp-compiler-input.json');

  // Run hardhat compile with the solc input option
  execSync(`npx hardhat compile --solc-input-file ${tempFile} --no-compile`);

  // Read the generated input file
  const inputJson = JSON.parse(fs.readFileSync(tempFile, 'utf8'));

  // Filter to only include our target contract
  const filteredSources = {};
  for (const [sourcePath, sourceData] of Object.entries(inputJson.sources)) {
    if (sourcePath.includes(contractName)) {
      filteredSources[sourcePath] = sourceData;
    }
  }

  // Create a new input JSON with just our contract
  const standardInputJson = {
    language: inputJson.language,
    sources: filteredSources,
    settings: inputJson.settings,
  };

  // Write the filtered input JSON to the output file
  fs.writeFileSync(outputPath, JSON.stringify(standardInputJson, null, 2));

  // Clean up the temporary file
  fs.unlinkSync(tempFile);

  console.log(
    `Standard-Input-JSON generated successfully. Output saved to: ${outputPath}`
  );
} catch (error) {
  console.error('Error generating Standard-Input-JSON:', error.message);
}
