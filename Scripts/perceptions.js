import services from './services.js';

document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicializar UI y cargar datos previos
    initDynamicBonuses();
    loadUserDataPreview();

    // Buscamos el botón que tenga el texto "Calcula tus Deducciones" o sea submit
    const btnSubmit = document.querySelector('button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.addEventListener("click", handleCalculatePerceptions);
    }
});

// ==========================================
// LÓGICA DE CONEXIÓN (FETCH)
// ==========================================

async function handleCalculatePerceptions(e) {
    e.preventDefault(); // Evitar recarga formulario

    const flowType = sessionStorage.getItem("currentFlowType") || "paysheet";
    const userDataJSON = sessionStorage.getItem("userData");
    
    if (!userDataJSON) {
        Swal.fire("Error", "No se encontraron datos del empleado. Vuelve al inicio.", "error");
        return;
    }

    const userData = JSON.parse(userDataJSON);
    let payload = {};

    // --- RECOLECCIÓN DE DATOS SEGÚN EL FLUJO ---

    if (flowType === 'paysheet') {
        // NÓMINA
        // Mapeamos los datos que pide calculos.controller.js
        payload = {
            salarioDiario: Number(userData.salary),
            fechaIngreso: userData.dateIn,
            diasTrabajados: Number(userData.days),
            horasExtraDobles: Number(document.getElementById('overtime')?.value) || 0,
            horasExtraTriples: 0,
            primaDominical: false, // Falta input en HTML, default false
            otrosBonos: getBonusesList() // Función auxiliar abajo
        };

    } else {
        // FINIQUITO
        // Mapeamos los datos para finiquito
        
        payload = {
            salarioDiario: Number(userData.salary),
            fechaIngreso: userData.dateIn,
            fechaSalida: userData.dateOut || new Date().toISOString().split('T')[0], // Fallback a hoy
            motivoBaja: userData.motivoBaja || "renuncia_voluntaria",
            diasVacacionesPendientes: Number(document.getElementById('vacationDays')?.value) || 0,
            diasSalarioPendientes: Number(userData.days) || 0, // Usamos los días trabajados como pendientes de pago
            otrosBonos: getBonusesList()
        };
    }

    try {

        console.log("Datos que se enviarán al back:", payload);
        // Feedback de carga
        const btn = e.target;
        const originalText = btn.innerText;
        btn.innerText = "Calculando...";
        btn.disabled = true;

        // LLAMADA AL SERVICIO
        const result = await services.calculatePerceptions(flowType, payload);

        // Guardar resultado y marcar paso como completado
        sessionStorage.setItem("step_perceptions_data", JSON.stringify(result));
        sessionStorage.setItem("step_perceptions_completed", "true");

        // Redireccionar
        const nextUrl = flowType === 'paysheet' 
            ? 'paysheetDeductions.html' 
            : 'settlementDeductions.html';
        
        window.location.href = nextUrl;

    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'Error en el cálculo',
            text: error.message || 'Revisa la conexión con el servidor.'
        });
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// ==========================================
// FUNCIONES AUXILIARES UI
// ==========================================

function loadUserDataPreview() {
    const userData = JSON.parse(sessionStorage.getItem("userData"));
    if (userData) {
        const baseInput = document.getElementById("baseSalary");
        if (baseInput) {
            // Calculamos un estimado visual (Salario * Dias)
            const totalBase = (parseFloat(userData.salary) * parseFloat(userData.days)).toFixed(2);
            baseInput.value = totalBase;
        }
    }
}

function getBonusesList() {
    const container = document.getElementById("bonusContainer");
    if (!container) return [];

    const rows = container.children;
    const bonuses = [];

    for (let row of rows) {
        const name = row.querySelector(".perceptionName")?.value;
        const amount = Number(row.querySelector(".perceptionTotal")?.value) || 0; // Usamos el total calculado en esa fila
        
        // Solo agregamos si tiene monto > 0
        if (amount > 0) {
            bonuses.push({
                nombre: name || "Bono",
                percepcion: amount
            });
        }
    }
    return bonuses;
}

function initDynamicBonuses() {
    const addBtn = document.getElementById("addBonusBtn");
    if(!addBtn) return;

    addBtn.addEventListener("click", function () {
        const container = document.createElement("div");
        container.className = "border rounded-xl p-6 shadow max-w-3xl mx-auto bg-white space-y-6 relative group mb-4";

        container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-semibold text-gray-800">Bonos / Comisiones</h2>
            <button type="button" class="delete-bonus-btn text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded text-sm font-medium transition-colors">Eliminar</button>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <label class="font-medium">Nombre de percepción: <input class="perceptionName border rounded p-2 w-full mt-1" type="text" /></label>
            <label class="font-medium">Tipo: 
                <select class="perceptionType border rounded p-2 w-full mt-1">
                    <option>Regular</option><option>Extraordinaria</option>
                </select>
            </label>
        </div>

        <div class="grid grid-cols-3 gap-6 mt-6">
            <label class="font-medium">Porcentaje: <input class="perceptionPercentage border rounded p-2 w-full mt-1" type="number" min="0" max="100" value="0" /></label>
            <label class="font-medium">Base a aplicar: <input class="perceptionBase border rounded p-2 w-full mt-1" type="number" min="0" value="0" /></label>
            <label class="font-medium">Fijo: <input class="perceptionFixed border rounded p-2 w-full mt-1" type="number" min="0" value="0" /></label>
        </div>

        <label class="font-medium block mt-4">Total de Percepciones:
            <div class="flex items-center mt-1">
                <span class="mr-2 font-semibold">$</span>
                <input class="perceptionTotal border rounded p-2 w-40 bg-gray-50" type="number" readonly value="0" />
            </div>
        </label>
        `;

        document.getElementById("bonusContainer").appendChild(container);

        // Lógica de cálculo interno de la fila (Porcentaje * Base + Fijo)
        const inputs = container.querySelectorAll('input');
        inputs.forEach(input => input.addEventListener('input', () => updateRowTotal(container)));

        // Eliminar fila
        container.querySelector(".delete-bonus-btn").addEventListener("click", () => container.remove());
    });
}

function updateRowTotal(row) {
    const pct = parseFloat(row.querySelector(".perceptionPercentage").value) || 0;
    const base = parseFloat(row.querySelector(".perceptionBase").value) || 0;
    const fixed = parseFloat(row.querySelector(".perceptionFixed").value) || 0;
    
    const total = (base * (pct / 100)) + fixed;
    row.querySelector(".perceptionTotal").value = total.toFixed(2);
}