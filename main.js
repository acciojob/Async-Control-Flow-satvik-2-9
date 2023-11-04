const fs = require('fs');
const { promisify } = require('util');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// We don't need these anymore since we're not using them
// const readFileAsync = promisify(fs.readFile);

async function parseCsv(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  return new Promise((resolve, reject) => {
    const data = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => data.push(row))
      .on('end', () => resolve(data))
      .on('error', (error) => reject(error));
  });
}

async function mergeCsvFiles(files, outputFile) {
  try {
    const promises = files.map(file => parseCsv(file));
    const allData = await Promise.all(promises);

    // Assuming all CSV files have the same headers
    const headers = Object.keys(allData[0][0]);
    const csvWriter = createCsvWriter({
      path: outputFile,
      header: headers.map((header) => ({ id: header, title: header })),
    });

    await csvWriter.writeRecords(allData.flat());
    console.log('Merge Complete');
  } catch (error) {
    throw new Error(`An error occurred: ${error.message}`);
  }
}

if (require.main === module) {
  const [,, outputFile, ...files] = process.argv;

  if (!outputFile || files.length === 0) {
    console.error('Usage: node main.js <outputFile> <file1> <file2> ...');
    process.exit(1);
  }

  mergeCsvFiles(files, outputFile)
    .catch(error => {
      console.error(error.message);
      return error.message;
    });
}

// Exporting `mergeCsvFiles` for testing purposes
module.exports = { mergeCsvFiles };
