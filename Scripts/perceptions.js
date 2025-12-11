import services from './services.js';

document.addEventListener("DOMContentLoaded", () => {
    initDynamicBonuses();
    initRealTimeCalculators(); 
    
    const btnSubmit = document.querySelector('button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.addEventListener("click", handleCalculatePerceptions);
    }
});

// ============================================
// UI & PERSISTENCIA
// ============================================
function initRealTimeCalculators() {
    const userDataJSON = sessionStorage.getItem("userData");
    if (!userDataJSON) return;

    const userData = JSON.parse(userDataJSON);
    const salarioDiario = parseFloat(userData.salary) || 0;
    
    // A. Mostrar Salario Base (Estático)
    const diasPagados = parseFloat(userData.days) || 0;
    const sueldoTotal = salarioDiario * diasPagados;
    updateLabel("baseSalary", sueldoTotal);

    // B. Referencias DOM
    const inputOvertime = document.getElementById("overtime");
    const inputVacations = document.getElementById("vacationDays");

    // --- RECUPERAR DATOS GUARDADOS (Persistencia) ---
    const savedInputs = JSON.parse(sessionStorage.getItem("perceptions_inputs") || "{}");
    
    if (inputOvertime && savedInputs.overtime) {
        inputOvertime.value = savedInputs.overtime;
    }
    if (inputVacations && savedInputs.vacations) {
        inputVacations.value = savedInputs.vacations;
    }

    // --- ACTIVAR LISTENERS (Primero creamos el listener) ---
    if (inputOvertime) {
        inputOvertime.addEventListener("input", () => {
            const horas = parseFloat(inputOvertime.value) || 0;
            const valorHora = salarioDiario / 8;
            const totalExtra = valorHora * 2 * horas; 
            updateLabel("overtimeTotal", totalExtra);
        });
    }

    if (inputVacations) {
        inputVacations.addEventListener("input", () => {
            const dias = parseFloat(inputVacations.value) || 0;
            const totalVacaciones = salarioDiario * dias; 
            updateLabel("vacationTotal", totalVacaciones);
        });
    }

    // Esto fuerza a que se ejecuten los listeners de arriba con los valores recuperados
    if (inputOvertime) triggerInputEvent(inputOvertime);
    if (inputVacations) triggerInputEvent(inputVacations);
}

// ============================================
// LÓGICA DE ENVÍO
// ============================================

async function handleCalculatePerceptions(e) {
    e.preventDefault();

    const flowType = sessionStorage.getItem("currentFlowType") || "paysheet";
    const userData = JSON.parse(sessionStorage.getItem("userData"));
    
    if (!userData) {
        Swal.fire("Error", "No se encontraron datos del empleado.", "error");
        return;
    }

    const salarioDiario = Number(userData.salary);
    const horasDobles = Number(document.getElementById('overtime')?.value) || 0;
    const diasVacaciones = Number(document.getElementById('vacationDays')?.value) || 0;

    // GUARDAR ESTADO ACTUAL
    sessionStorage.setItem("perceptions_inputs", JSON.stringify({
        overtime: horasDobles,
        vacations: diasVacaciones
    }));

    // PREPARAR LISTA DE BONOS (Manuales + Vacaciones)
    let listaBonos = getBonusesList(); 

    if (diasVacaciones > 0 && flowType === 'paysheet') {
        const montoVacaciones = salarioDiario * diasVacaciones;
        const montoPrima = montoVacaciones * 0.25;

        listaBonos.push({
            nombre: `Pago de Vacaciones (${diasVacaciones} días)`,
            percepcion: Number(montoVacaciones.toFixed(2))
        });

        listaBonos.push({
            nombre: "Prima Vacacional (25%)",
            percepcion: Number(montoPrima.toFixed(2))
        });
    }

    let payload = {};

    if (flowType === 'paysheet') {
        // NÓMINA
        payload = {
            salarioDiario: salarioDiario,
            fechaIngreso: userData.dateIn,
            diasTrabajados: Number(userData.days),
            horasExtraDobles: horasDobles,
            horasExtraTriples: 0, 
            primaDominical: false,
            otrosBonos: listaBonos 
        };

    } else {
        // FINIQUITO
        payload = {
            salarioDiario: salarioDiario,
            fechaIngreso: userData.dateIn,
            fechaSalida: userData.dateOut || new Date().toISOString().split('T')[0],
            motivoBaja: userData.motivoBaja || "renuncia_voluntaria",
            diasVacacionesPendientes: diasVacaciones, 
            diasSalarioPendientes: Number(userData.days) || 0,
            otrosBonos: getBonusesList() 
        };
    }

    try {
        const btn = e.target;
        const originalText = btn.innerText;
        btn.innerText = "Calculando...";
        btn.disabled = true;

        const result = await services.calculatePerceptions(flowType, payload);

        sessionStorage.setItem("step_perceptions_data", JSON.stringify(result));
        sessionStorage.setItem("step_perceptions_completed", "true");

        const nextUrl = flowType === 'paysheet' 
            ? 'paysheetDeductions.html' 
            : 'settlementDeductions.html';
        
        window.location.href = nextUrl;

    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Error de conexión.'
        });
        e.target.innerText = originalText;
        e.target.disabled = false;
    }
}

// ============================================
// UTILERIAS
// ============================================

function triggerInputEvent(element) {
    const event = new Event('input', { bubbles: true });
    element.dispatchEvent(event);
}

function updateLabel(elementId, amount) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerText = new Intl.NumberFormat('es-MX', { 
            style: 'currency', currency: 'MXN' 
        }).format(amount);
    }
}

function getBonusesList() {
    const container = document.getElementById("bonusContainer");
    if (!container) return [];
    const bonuses = [];
    for (let row of container.children) {
        const name = row.querySelector(".perceptionName")?.value;
        const amount = Number(row.querySelector(".perceptionTotal")?.value) || 0;
        if (amount > 0) {
            bonuses.push({ nombre: name || "Bono", percepcion: amount });
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
            <button type="button" class="delete-bonus-btn text-red-500 hover:text-red-700 font-bold px-3 py-1">Eliminar</button>
        </div>
        <div class="grid grid-cols-2 gap-4">
            <label class="font-medium">Nombre: <input class="perceptionName border rounded p-2 w-full mt-1" type="text" /></label>
            <label class="font-medium">Tipo: <select class="perceptionType border rounded p-2 w-full mt-1"><option>Regular</option><option>Extraordinaria</option></select></label>
        </div>
        <div class="grid grid-cols-3 gap-6 mt-6">
            <label class="font-medium">Porcentaje: <input class="perceptionPercentage border rounded p-2 w-full mt-1" type="number" min="0" value="0" /></label>
            <label class="font-medium">Base: <input class="perceptionBase border rounded p-2 w-full mt-1" type="number" min="0" value="0" /></label>
            <label class="font-medium">Fijo: <input class="perceptionFixed border rounded p-2 w-full mt-1" type="number" min="0" value="0" /></label>
        </div>
        <label class="font-medium block mt-4">Total:
            <input class="perceptionTotal border rounded p-2 w-40 bg-gray-50 font-bold text-green-600" type="number" readonly value="0" />
        </label>
        `;
        document.getElementById("bonusContainer").appendChild(container);

        const inputs = container.querySelectorAll('input');
        inputs.forEach(input => input.addEventListener('input', () => {
            const pct = parseFloat(container.querySelector(".perceptionPercentage").value) || 0;
            const base = parseFloat(container.querySelector(".perceptionBase").value) || 0;
            const fixed = parseFloat(container.querySelector(".perceptionFixed").value) || 0;
            container.querySelector(".perceptionTotal").value = ((base * (pct / 100)) + fixed).toFixed(2);
        }));

        container.querySelector(".delete-bonus-btn").addEventListener("click", () => container.remove());
    });
}