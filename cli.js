const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function generateInterfaceForTable(tableName) {
  const columns = await prisma.$queryRaw(`SHOW COLUMNS FROM ${tableName}`);
  const interfaceCode = generateInterfaceCode(tableName, columns);
  const interfaceFileName = `${tableName}.interface.ts`;
  fs.writeFileSync(interfaceFileName, interfaceCode);
  console.log(`Interface generated for table: ${tableName}`);
}

function generateInterfaceCode(tableName, columns) {
  const interfaceCode = `// ${tableName}.interface.ts
export interface ${tableName} {
`;
  for (const column of columns) {
    const columnName = column['Field'];
    const columnType = mapColumnTypeToTypeScript(column['Type']);
    interfaceCode += `  ${columnName}${column['Null'] === 'YES' ? '?' : ''}: ${columnType};\n`;
  }
  interfaceCode += '}\n\n';
  return interfaceCode;
}

function mapColumnTypeToTypeScript(columnType) {
  // Map database column types to TypeScript types as needed.
  // You can expand this mapping as necessary for your use case.
  if (columnType.includes('int')) {
    return 'number';
  } else if (columnType.includes('varchar') || columnType.includes('text')) {
    return 'string';
  } else if (columnType.includes('datetime')) {
    return 'Date';
  } else {
    return 'any';
  }
}

const tableName = process.argv[2]; // Read the table name from command-line argument
if (!tableName) {
  console.error('Please provide a table name as a command-line argument.');
  process.exit(1);
}

generateInterfaceForTable(tableName).then(() => {
  console.log('Interface generation complete.');
  process.exit(0);
});
