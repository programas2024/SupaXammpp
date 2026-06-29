const express = require('express');
const mysql = require('mysql2');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ============ SERVIR ARCHIVOS ESTÁTICOS ============
// Servir archivos desde la raíz (para index.html)
app.use(express.static(__dirname));

// Servir CSS y JS desde la carpeta SupaXammpp
app.use('/css', express.static(path.join(__dirname, 'SupaXammpp', 'css')));
app.use('/js', express.static(path.join(__dirname, 'SupaXammpp', 'js')));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ============ CONEXIÓN A MYSQL ============
const mysqlPool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root123',
    database: 'mi_app_mysql',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

// ============ CONEXIÓN A POSTGRESQL ============
const pgPool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'root',
    password: 'root123',
    database: 'mi_app_postgres',
    max: 10,
    idleTimeoutMillis: 30000,
});

// ============ ENDPOINTS API ============

// 1. CREAR TABLA
app.post('/api/create-table', async (req, res) => {
    const { tableName, columns } = req.body;

    if (!tableName || !columns || columns.length === 0) {
        return res.status(400).json({ 
            error: 'Nombre de tabla y columnas son requeridos' 
        });
    }

    const validTableName = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName);
    if (!validTableName) {
        return res.status(400).json({ 
            error: 'Nombre de tabla inválido. Solo letras, números y guión bajo' 
        });
    }

    try {
        let columnDefinitions = columns.map(col => {
            const colName = col.name;
            const colType = col.type;
            const colNullable = col.nullable ? '' : ' NOT NULL';
            const colDefault = col.default ? ` DEFAULT ${col.default}` : '';
            let definition = `${colName} ${colType}${colNullable}${colDefault}`;
            
            if (col.primary) {
                definition += ' PRIMARY KEY';
            }
            
            return definition;
        });

        let indexDefinitions = [];
        columns.forEach(col => {
            if (col.index && !col.primary) {
                indexDefinitions.push(`INDEX idx_${col.name} (${col.name})`);
            }
        });

        let columnsSQL = columnDefinitions.join(', ');
        if (indexDefinitions.length > 0) {
            columnsSQL += ', ' + indexDefinitions.join(', ');
        }

        const mysqlSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnsSQL})`;
        await mysqlPool.query(mysqlSQL);

        let pgColumnDefinitions = columns.map(col => {
            const colName = col.name;
            const colType = col.type;
            const colNullable = col.nullable ? '' : ' NOT NULL';
            let definition = `${colName} ${colType}${colNullable}`;
            
            if (col.primary) {
                definition += ' PRIMARY KEY';
            }
            
            return definition;
        });

        let pgColumnsSQL = pgColumnDefinitions.join(', ');
        const pgSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (${pgColumnsSQL})`;
        await pgPool.query(pgSQL);

        for (const col of columns) {
            if (col.index && !col.primary) {
                const indexSQL = `CREATE INDEX IF NOT EXISTS idx_${col.name} ON ${tableName} (${col.name})`;
                await pgPool.query(indexSQL);
            }
        }

        res.json({
            success: true,
            message: `✅ Tabla '${tableName}' creada en MySQL y PostgreSQL`,
            mysqlQuery: mysqlSQL,
            pgQuery: pgSQL
        });

    } catch (error) {
        console.error('Error creando tabla:', error);
        res.status(500).json({
            error: 'Error al crear la tabla',
            details: error.message
        });
    }
});

// 2. LISTAR TABLAS
app.get('/api/tables', async (req, res) => {
    try {
        const [mysqlTables] = await mysqlPool.query('SHOW TABLES');
        const pgTables = await pgPool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        res.json({
            mysql: mysqlTables,
            postgres: pgTables.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. ESTRUCTURA DE TABLA
app.get('/api/table-structure/:tableName', async (req, res) => {
    const { tableName } = req.params;
    
    try {
        const [mysqlStructure] = await mysqlPool.query(`DESCRIBE ${tableName}`);
        const pgStructure = await pgPool.query(`
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_name = $1
        `, [tableName]);

        res.json({
            mysql: mysqlStructure,
            postgres: pgStructure.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. DATOS DE TABLA
app.get('/api/table-data/:tableName', async (req, res) => {
    const { tableName } = req.params;
    
    try {
        const [columns] = await mysqlPool.query(`SHOW COLUMNS FROM ${tableName}`);
        const colNames = columns.map(c => c.Field);
        
        const [rows] = await mysqlPool.query(`SELECT * FROM ${tableName}`);
        
        res.json({
            columns: colNames,
            data: rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ INICIAR SERVIDOR ============
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📁 Serviendo CSS desde: ${path.join(__dirname, 'SupaXammpp', 'css')}`);
    console.log(`📁 Serviendo JS desde: ${path.join(__dirname, 'SupaXammpp', 'js')}`);
});