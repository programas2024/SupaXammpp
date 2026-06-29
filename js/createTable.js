// ============ CONFIGURACIÓN ============
const API_URL = '/api';
let currentTableName = null;
let editingRowId = null;

// ============ REFERENCIAS DOM ============
const tableNameInput = document.getElementById('tableNameInput');
const columnsContainer = document.getElementById('columnsContainer');
const addColumnBtn = document.getElementById('addColumnBtn');
const createTableBtn = document.getElementById('createTableBtn');
const tableResponse = document.getElementById('tableResponse');
const responseMessage = document.getElementById('responseMessage');
const responseDetails = document.getElementById('responseDetails');
const tablesGrid = document.getElementById('tablesGrid');
const tableViewPanel = document.getElementById('tableViewPanel');
const selectedTableTitle = document.getElementById('selectedTableTitle');
const structureBody = document.getElementById('structureBody');
const dataBody = document.getElementById('dataBody');
const dataHeaders = document.getElementById('dataHeaders');
const noDataMessage = document.getElementById('noDataMessage');
const addRowBtn = document.getElementById('addRowBtn');
const deleteRowBtn = document.getElementById('deleteRowBtn');
const selectAllRows = document.getElementById('selectAllRows');
const refreshTablesBtn = document.getElementById('refreshTablesBtn');
const closeTableView = document.getElementById('closeTableView');

// ============ FUNCIONES ============

// Crear una nueva fila de columna
function createColumnRow() {
    const row = document.createElement('div');
    row.className = 'column-row flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200';
    row.innerHTML = `
        <input 
            type="text" 
            class="col-name flex-1 min-w-[100px] bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500" 
            placeholder="Nombre columna"
        >
        <select class="col-type bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500">
            <option value="VARCHAR(255)">VARCHAR(255)</option>
            <option value="VARCHAR(100)">VARCHAR(100)</option>
            <option value="TEXT">TEXT</option>
            <option value="INT">INT</option>
            <option value="BIGINT">BIGINT</option>
            <option value="DECIMAL(10,2)">DECIMAL(10,2)</option>
            <option value="DATE">DATE</option>
            <option value="DATETIME">DATETIME</option>
            <option value="BOOLEAN">BOOLEAN</option>
            <option value="JSON">JSON</option>
        </select>
        <div class="flex items-center space-x-1">
            <label class="flex items-center space-x-0.5 text-xs cursor-pointer px-1 py-0.5 rounded hover:bg-slate-200 transition-colors">
                <input type="checkbox" class="col-primary rounded border-slate-300 w-3.5 h-3.5">
                <span class="text-amber-600 font-bold">🔑</span>
            </label>
            <label class="flex items-center space-x-0.5 text-xs cursor-pointer px-1 py-0.5 rounded hover:bg-slate-200 transition-colors">
                <input type="checkbox" class="col-index rounded border-slate-300 w-3.5 h-3.5">
                <span class="text-blue-600 font-bold">⚡</span>
            </label>
            <label class="flex items-center space-x-0.5 text-xs cursor-pointer px-1 py-0.5 rounded hover:bg-slate-200 transition-colors">
                <input type="checkbox" class="col-nullable rounded border-slate-300 w-3.5 h-3.5" checked>
                <span class="text-slate-500">NULL</span>
            </label>
            <button class="remove-column-btn text-red-400 hover:text-red-600 transition-colors p-1">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    `;

    const removeBtn = row.querySelector('.remove-column-btn');
    removeBtn.addEventListener('click', () => {
        if (columnsContainer.querySelectorAll('.column-row').length > 1) {
            row.remove();
        } else {
            alert('Debe haber al menos una columna');
        }
    });

    return row;
}

// Obtener datos de las columnas
function getColumnsData() {
    const rows = columnsContainer.querySelectorAll('.column-row');
    const columns = [];

    rows.forEach(row => {
        const name = row.querySelector('.col-name').value.trim();
        const type = row.querySelector('.col-type').value;
        const nullable = row.querySelector('.col-nullable').checked;
        const isPrimary = row.querySelector('.col-primary').checked;
        const hasIndex = row.querySelector('.col-index').checked;

        if (name) {
            columns.push({
                name: name,
                type: type,
                nullable: nullable,
                primary: isPrimary,
                index: hasIndex,
                default: null
            });
        }
    });

    return columns;
}

// Mostrar mensaje de respuesta
function showResponse(success, message, details = null) {
    tableResponse.classList.remove('hidden');
    const container = tableResponse.querySelector('div');
    
    if (success) {
        container.className = 'bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-sm';
        responseMessage.textContent = message;
    } else {
        container.className = 'bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm';
        responseMessage.textContent = '❌ ' + message;
    }

    if (details) {
        responseDetails.textContent = JSON.stringify(details, null, 2);
        responseDetails.parentElement.style.display = 'block';
    } else {
        responseDetails.parentElement.style.display = 'none';
    }
}

// ============ CARGAR TABLAS EN GRID ============
async function loadTablesGrid() {
    try {
        const response = await fetch(`${API_URL}/tables`);
        const data = await response.json();
        
        const mysqlTables = data.mysql || [];
        const pgTables = data.postgres || [];
        
        // Combinar y eliminar duplicados
        const mysqlNames = mysqlTables.map(t => Object.values(t)[0]);
        const pgNames = pgTables.map(t => t.table_name);
        const allTables = [...new Set([...mysqlNames, ...pgNames])];

        if (allTables.length === 0) {
            tablesGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <svg class="w-16 h-16 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
                    </svg>
                    <p class="text-slate-500 font-medium">No hay tablas creadas aún</p>
                    <p class="text-slate-400 text-sm">Crea tu primera tabla usando el formulario de arriba</p>
                </div>
            `;
            return;
        }

        // Renderizar grid de tablas
        let html = '';
        allTables.forEach(table => {
            const hasMysql = mysqlNames.includes(table);
            const hasPg = pgNames.includes(table);
            
            html += `
                <div class="table-card bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer hover:border-sky-400" data-table="${table}">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <h4 class="font-bold text-slate-800 text-sm truncate">📋 ${table}</h4>
                            <div class="flex items-center gap-2 mt-2">
                                ${hasMysql ? '<span class="text-[10px] font-bold bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">🐬 MySQL</span>' : ''}
                                ${hasPg ? '<span class="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">🐘 PostgreSQL</span>' : ''}
                            </div>
                        </div>
                        <div class="flex gap-1">
                            <button class="view-table-btn text-sky-500 hover:text-sky-700 p-1 rounded hover:bg-sky-50 transition-colors" data-table="${table}" title="Ver estructura y datos">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                </svg>
                            </button>
                            <button class="delete-table-btn text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" data-table="${table}" title="Eliminar tabla">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        tablesGrid.innerHTML = html;

        // Eventos para ver tabla
        document.querySelectorAll('.view-table-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tableName = btn.dataset.table;
                viewTable(tableName);
            });
        });

        // Eventos para eliminar tabla
        document.querySelectorAll('.delete-table-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tableName = btn.dataset.table;
                if (confirm(`¿Estás seguro de eliminar la tabla '${tableName}'?`)) {
                    deleteTable(tableName);
                }
            });
        });

        // Click en la tarjeta para ver tabla
        document.querySelectorAll('.table-card').forEach(card => {
            card.addEventListener('click', () => {
                const tableName = card.dataset.table;
                viewTable(tableName);
            });
        });

    } catch (error) {
        tablesGrid.innerHTML = `
            <div class="col-span-full text-center py-8 text-red-400">
                ❌ Error cargando tablas: ${error.message}
            </div>
        `;
        console.error('Error loading tables:', error);
    }
}

// ============ VER TABLA ============
async function viewTable(tableName) {
    currentTableName = tableName;
    tableViewPanel.classList.remove('hidden');
    selectedTableTitle.querySelector('span').textContent = tableName;

    try {
        // Cargar estructura
        const structResponse = await fetch(`${API_URL}/table-structure/${tableName}`);
        if (!structResponse.ok) throw new Error('Error al cargar estructura');
        const structData = await structResponse.json();

        // Renderizar estructura
        const mysqlStruct = structData.mysql || [];
        structureBody.innerHTML = '';
        
        if (mysqlStruct.length === 0) {
            structureBody.innerHTML = '<tr><td colspan="5" class="text-center text-slate-400 py-4">No hay estructura disponible</td></tr>';
        } else {
            mysqlStruct.forEach(col => {
                const tr = document.createElement('tr');
                const isPrimary = col.Key === 'PRI';
                const isIndex = col.Key === 'MUL' || col.Key === 'UNI';
                tr.innerHTML = `
                    <td class="p-3 font-mono font-semibold">${col.Field}</td>
                    <td class="p-3">${col.Type}</td>
                    <td class="p-3">${col.Null === 'YES' ? '✅ Sí' : '❌ No'}</td>
                    <td class="p-3">${isPrimary ? '🔑 Primaria' : '-'}</td>
                    <td class="p-3">${isIndex ? '⚡ Sí' : '-'}</td>
                `;
                structureBody.appendChild(tr);
            });
        }

        // Cargar datos
        await loadTableData(tableName);

    } catch (error) {
        console.error('Error viewing table:', error);
        structureBody.innerHTML = `<tr><td colspan="5" class="text-center text-red-400 py-4">❌ ${error.message}</td></tr>`;
    }
}

// ============ CARGAR DATOS DE TABLA ============
async function loadTableData(tableName) {
    try {
        const response = await fetch(`${API_URL}/table-data/${tableName}`);
        if (!response.ok) throw new Error('Error al cargar datos');
        const data = await response.json();

        const rows = data.data || [];
        const columns = data.columns || [];

        if (rows.length === 0 || columns.length === 0) {
            dataHeaders.innerHTML = '';
            dataBody.innerHTML = '';
            noDataMessage.classList.remove('hidden');
            return;
        }

        noDataMessage.classList.add('hidden');

        // Headers
        let headerHtml = '<th class="p-3 w-8"><input type="checkbox" id="selectAllRows" class="rounded border-slate-300"></th>';
        columns.forEach(col => {
            headerHtml += `<th class="p-3 font-bold">${col}</th>`;
        });
        headerHtml += '<th class="p-3 w-12">Acciones</th>';
        dataHeaders.innerHTML = headerHtml;

        // Body
        let bodyHtml = '';
        rows.forEach((row, index) => {
            bodyHtml += '<tr class="hover:bg-slate-50 transition-colors" data-row-id="' + index + '">';
            bodyHtml += `<td class="p-3"><input type="checkbox" class="row-selector rounded border-slate-300" data-row-id="${index}"></td>`;
            columns.forEach(col => {
                bodyHtml += `<td class="p-3 font-mono text-xs">${row[col] !== null ? row[col] : 'NULL'}</td>`;
            });
            bodyHtml += `
                <td class="p-3">
                    <button class="edit-row-btn text-sky-500 hover:text-sky-700 p-1 rounded hover:bg-sky-50 transition-colors" data-row-id="${index}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button class="delete-row-action-btn text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" data-row-id="${index}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </td>
            `;
            bodyHtml += '</tr>';
        });
        dataBody.innerHTML = bodyHtml;

        // Eventos para editar fila
        document.querySelectorAll('.edit-row-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const rowId = parseInt(btn.dataset.rowId);
                editRow(rowId);
            });
        });

        // Eventos para eliminar fila individual
        document.querySelectorAll('.delete-row-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const rowId = parseInt(btn.dataset.rowId);
                if (confirm('¿Eliminar esta fila?')) {
                    deleteRow(rowId);
                }
            });
        });

        // Seleccionar todas
        const selectAll = document.getElementById('selectAllRows');
        if (selectAll) {
            selectAll.addEventListener('change', () => {
                document.querySelectorAll('.row-selector').forEach(cb => {
                    cb.checked = selectAll.checked;
                });
                updateDeleteButtonVisibility();
            });
        }

        // Selección individual
        document.querySelectorAll('.row-selector').forEach(cb => {
            cb.addEventListener('change', updateDeleteButtonVisibility);
        });

        updateDeleteButtonVisibility();

    } catch (error) {
        console.error('Error loading data:', error);
        dataBody.innerHTML = `<tr><td colspan="10" class="text-center text-red-400 py-4">❌ ${error.message}</td></tr>`;
    }
}

// ============ EDITAR FILA ============
function editRow(rowId) {
    const row = dataBody.querySelector(`tr[data-row-id="${rowId}"]`);
    if (!row) return;

    const cells = row.querySelectorAll('td:not(:first-child):not(:last-child)');
    const headers = dataHeaders.querySelectorAll('th:not(:first-child):not(:last-child)');
    
    // Convertir a inputs editables
    cells.forEach((cell, index) => {
        const currentValue = cell.textContent;
        const colName = headers[index]?.textContent || '';
        cell.innerHTML = `
            <input type="text" class="edit-input w-full bg-white border border-sky-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-sky-500" 
                   value="${currentValue === 'NULL' ? '' : currentValue}" 
                   data-col="${colName}"
                   data-row="${rowId}">
        `;
    });

    // Cambiar botón editar a guardar
    const editBtn = row.querySelector('.edit-row-btn');
    if (editBtn) {
        editBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
        `;
        editBtn.className = 'save-row-btn text-emerald-500 hover:text-emerald-700 p-1 rounded hover:bg-emerald-50 transition-colors';
        editBtn.dataset.rowId = rowId;
        
        // Evento guardar
        editBtn.onclick = () => saveRow(rowId);
    }
}

// ============ GUARDAR FILA ============
async function saveRow(rowId) {
    const inputs = document.querySelectorAll(`.edit-input[data-row="${rowId}"]`);
    const headers = dataHeaders.querySelectorAll('th:not(:first-child):not(:last-child)');
    
    const data = {};
    inputs.forEach((input, index) => {
        const colName = headers[index]?.textContent || '';
        data[colName] = input.value;
    });

    try {
        const response = await fetch(`${API_URL}/update-row/${currentTableName}/${rowId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            await loadTableData(currentTableName);
        } else {
            alert('Error al guardar los cambios');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// ============ ELIMINAR FILA ============
async function deleteRow(rowId) {
    try {
        const response = await fetch(`${API_URL}/delete-row/${currentTableName}/${rowId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadTableData(currentTableName);
        } else {
            alert('Error al eliminar la fila');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// ============ ELIMINAR TABLA ============
async function deleteTable(tableName) {
    try {
        const response = await fetch(`${API_URL}/delete-table/${tableName}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadTablesGrid();
            tableViewPanel.classList.add('hidden');
            showResponse(true, `✅ Tabla '${tableName}' eliminada`);
        } else {
            const data = await response.json();
            showResponse(false, data.error || 'Error al eliminar la tabla');
        }
    } catch (error) {
        showResponse(false, 'Error: ' + error.message);
    }
}

// ============ AÑADIR FILA ============
addRowBtn.addEventListener('click', async () => {
    if (!currentTableName) return;

    // Obtener estructura para saber qué columnas tiene
    try {
        const response = await fetch(`${API_URL}/table-structure/${currentTableName}`);
        const data = await response.json();
        const columns = data.mysql || [];

        if (columns.length === 0) return;

        // Crear objeto con valores vacíos
        const newData = {};
        columns.forEach(col => {
            newData[col.Field] = '';
        });

        // Enviar a backend
        const insertResponse = await fetch(`${API_URL}/insert-row/${currentTableName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newData)
        });

        if (insertResponse.ok) {
            await loadTableData(currentTableName);
        } else {
            alert('Error al añadir fila');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

// ============ ELIMINAR FILAS SELECCIONADAS ============
deleteRowBtn.addEventListener('click', async () => {
    const selected = document.querySelectorAll('.row-selector:checked');
    if (selected.length === 0) return;

    if (!confirm(`¿Eliminar ${selected.length} fila(s)?`)) return;

    // Eliminar de una por una (o en lote si el backend lo soporta)
    for (const cb of selected) {
        const rowId = parseInt(cb.dataset.rowId);
        await deleteRow(rowId);
    }
});

// ============ ACTUALIZAR VISIBILIDAD BOTÓN ELIMINAR ============
function updateDeleteButtonVisibility() {
    const selected = document.querySelectorAll('.row-selector:checked');
    if (selected.length > 0) {
        deleteRowBtn.classList.remove('hidden');
        deleteRowBtn.textContent = `🗑️ Eliminar (${selected.length})`;
    } else {
        deleteRowBtn.classList.add('hidden');
    }
}

// ============ EVENTOS ============

// Añadir columna
addColumnBtn.addEventListener('click', () => {
    const newRow = createColumnRow();
    columnsContainer.appendChild(newRow);
});

// Crear tabla
createTableBtn.addEventListener('click', async () => {
    const tableName = tableNameInput.value.trim();
    const columns = getColumnsData();

    if (!tableName) {
        showResponse(false, 'Por favor, ingresa un nombre para la tabla');
        return;
    }

    if (!tableName.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
        showResponse(false, 'Nombre de tabla inválido. Solo letras, números y guión bajo');
        return;
    }

    if (columns.length === 0) {
        showResponse(false, 'Agrega al menos una columna');
        return;
    }

    const invalidColumns = columns.filter(col => !col.name);
    if (invalidColumns.length > 0) {
        showResponse(false, 'Todas las columnas deben tener un nombre');
        return;
    }

    createTableBtn.disabled = true;
    createTableBtn.textContent = '⏳ Creando...';

    try {
        const response = await fetch(`${API_URL}/create-table`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableName, columns })
        });

        const data = await response.json();

        if (response.ok) {
            showResponse(true, '✅ ' + data.message, {
                mysqlQuery: data.mysqlQuery,
                pgQuery: data.pgQuery
            });
            await loadTablesGrid();
            tableNameInput.value = '';
            // Limpiar columnas
            const rows = columnsContainer.querySelectorAll('.column-row');
            rows.forEach((row, index) => {
                if (index > 0) row.remove();
            });
            // Resetear primera fila
            const firstRow = columnsContainer.querySelector('.column-row');
            if (firstRow) {
                firstRow.querySelector('.col-name').value = '';
                firstRow.querySelector('.col-primary').checked = false;
                firstRow.querySelector('.col-index').checked = false;
                firstRow.querySelector('.col-nullable').checked = true;
            }
        } else {
            showResponse(false, data.error || 'Error al crear la tabla', data.details);
        }
    } catch (error) {
        showResponse(false, 'Error de conexión con el servidor', error.message);
        console.error('Error:', error);
    } finally {
        createTableBtn.disabled = false;
        createTableBtn.textContent = '🚀 Crear Tabla en ambas DBs';
    }
});

// Cerrar vista de tabla
closeTableView.addEventListener('click', () => {
    tableViewPanel.classList.add('hidden');
    currentTableName = null;
});

// Refrescar tablas
refreshTablesBtn.addEventListener('click', loadTablesGrid);

// ============ INICIALIZACIÓN ============

if (columnsContainer.querySelectorAll('.column-row').length === 0) {
    columnsContainer.appendChild(createColumnRow());
}

loadTablesGrid();
setInterval(loadTablesGrid, 30000);