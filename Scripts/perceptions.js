import services from './services.js';

document.addEventListener("DOMContentLoaded", () => {
    // Iniciar Restauración y UI
    initRealTimeCalculators(); 
    restoreDynamicBonuses(); 
    initAddBonusButton();

    // Listener del botón Siguiente
    const btnSubmit = document.querySelector('button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.addEventListener("click", handleCalculatePerceptions);
    }
});

// ============================================
// LÓGICA DE CÁLCULO EN TIEMPO REAL (HORAS Y VACACIONES)
// ============================================
function initRealTimeCalculators() {
    const userDataJSON = sessionStorage.getItem("userData");
    if (!userDataJSON) return;

    const userData = JSON.parse(userDataJSON);
    const salarioDiario = parseFloat(userData.salary) || 0;
    
    // Mostrar Salario Base (Estático)
    const diasPagados = parseFloat(userData.days) || 0;
    const sueldoTotal = salarioDiario * diasPagados;
    updateLabel("baseSalary", sueldoTotal);

    // Referencias DOM
    const inputOvertime = document.getElementById("overtime");
    const inputVacations = document.getElementById("vacationDays");

    // Recuperar Inputs Guardados
    const savedInputs = JSON.parse(sessionStorage.getItem("perceptions_inputs") || "{}");
    if (inputOvertime && savedInputs.overtime) inputOvertime.value = savedInputs.overtime;
    if (inputVacations && savedInputs.vacations) inputVacations.value = savedInputs.vacations;

    // DEFINICIÓN DE FUNCIONES DE CÁLCULO
    // Creamos las funciones aquí para poder llamarlas al inicio Y al escribir
    
    const calcularHorasExtra = () => {
        if (!inputOvertime) return;
        const horas = parseFloat(inputOvertime.value) || 0;
        const valorHora = salarioDiario / 8;
        const total = valorHora * 2 * horas; // Dobles
        updateLabel("overtimeTotal", total);
        saveFixedInputsState(); // Guardar cambios
    };

    const calcularVacaciones = () => {
        if (!inputVacations) return;
        const dias = parseFloat(inputVacations.value) || 0;
        const total = salarioDiario * dias;
        updateLabel("vacationTotal", total);
        saveFixedInputsState(); // Guardar cambios
    };

    // ASIGNAR LISTENERS (Escuchar cambios)
    if (inputOvertime) inputOvertime.addEventListener("input", calcularHorasExtra);
    if (inputVacations) inputVacations.addEventListener("input", calcularVacaciones);

    // EJECUCIÓN INICIAL (¡Esto llena los labels al cargar la página!)
    calcularHorasExtra();
    calcularVacaciones();
}

function saveFixedInputsState() {
    const overtime = document.getElementById('overtime')?.value || 0;
    const vacations = document.getElementById('vacationDays')?.value || 0;
    sessionStorage.setItem("perceptions_inputs", JSON.stringify({ overtime, vacations }));
}

// ============================================
// LÓGICA DE BONOS DINÁMICOS
// ============================================

function initAddBonusButton() {
    const addBtn = document.getElementById("addBonusBtn");
    if (!addBtn) return;

    addBtn.addEventListener("click", () => {
        createBonusRow(); 
        saveBonusesToStorage();
    });
}

function restoreDynamicBonuses() {
    const savedBonuses = JSON.parse(sessionStorage.getItem("perceptions_bonuses_list") || "[]");
    savedBonuses.forEach(bonoData => createBonusRow(bonoData));
}

function createBonusRow(data = null) {
    const container = document.createElement("div");
    container.className = "bonus-card border rounded-xl p-6 shadow max-w-3xl mx-auto bg-white space-y-4 relative group mb-4 transition-all duration-300 hover:shadow-md";
    
    container.innerHTML = `
    <div class="flex justify-between items-center mb-2">
        <h3 class="text-lg font-semibold text-gray-700">Percepción Personalizada</h3>
        <button type="button" class="delete-bonus-btn text-red-500 hover:text-red-700 font-bold px-3 py-1 bg-red-50 rounded transition">Eliminar</button>
    </div>
    <div class="mb-4">
        <label class="font-medium text-gray-600 block mb-1">Nombre de la percepción:</label>
        <input class="perceptionName border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-200 outline-none transition" type="text" placeholder="Ej. Bono de puntualidad" />
    </div>
    <div class="grid grid-cols-3 gap-4">
        <label class="font-medium text-gray-600 block">Porcentaje (%):
            <input class="perceptionPercentage border border-gray-300 rounded-lg p-2 w-full mt-1 focus:ring-2 focus:ring-blue-200 outline-none" type="number" min="0" placeholder="0" />
        </label>
        <label class="font-medium text-gray-600 block">Base ($):
            <input class="perceptionBase border border-gray-300 rounded-lg p-2 w-full mt-1 focus:ring-2 focus:ring-blue-200 outline-none" type="number" min="0" placeholder="0.00" />
        </label>
        <label class="font-medium text-gray-600 block">Cuota Fija ($):
            <input class="perceptionFixed border border-gray-300 rounded-lg p-2 w-full mt-1 focus:ring-2 focus:ring-blue-200 outline-none" type="number" min="0" placeholder="0.00" />
        </label>
    </div>
    <div class="mt-4 p-3 bg-gray-50 rounded-lg flex justify-between items-center border border-gray-100">
        <span class="font-bold text-gray-700">Total a Pagar:</span>
        <div class="flex items-center">
             <span class="text-gray-500 mr-2">$</span>
             <input class="perceptionTotal bg-transparent font-bold text-xl text-green-600 text-right w-32 outline-none" type="number" readonly value="0.00" />
        </div>
    </div>`;

    document.getElementById("bonusContainer").appendChild(container);

    const iName = container.querySelector(".perceptionName");
    const iPct = container.querySelector(".perceptionPercentage");
    const iBase = container.querySelector(".perceptionBase");
    const iFixed = container.querySelector(".perceptionFixed");
    const iTotal = container.querySelector(".perceptionTotal");

    if (data) {
        iName.value = data.nombre || "";
        iPct.value = data.porcentaje || "";
        iBase.value = data.base || "";
        iFixed.value = data.fijo || "";
        calculateRowTotal(iPct, iBase, iFixed, iTotal);
    }

    const inputs = [iName, iPct, iBase, iFixed];
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            calculateRowTotal(iPct, iBase, iFixed, iTotal);
            saveBonusesToStorage();
        });
    });

    container.querySelector(".delete-bonus-btn").addEventListener("click", () => {
        container.remove();
        saveBonusesToStorage();
    });
}

function calculateRowTotal(iPct, iBase, iFixed, iTotal) {
    const pct = parseFloat(iPct.value) || 0;
    const base = parseFloat(iBase.value) || 0;
    const fixed = parseFloat(iFixed.value) || 0;
    const total = (base * (pct / 100)) + fixed;
    iTotal.value = total.toFixed(2);
}

function saveBonusesToStorage() {
    const container = document.getElementById("bonusContainer");
    const bonusesToSave = [];
    if (container) {
        const cards = container.querySelectorAll(".bonus-card");
        cards.forEach(card => {
            bonusesToSave.push({
                nombre: card.querySelector(".perceptionName").value,
                porcentaje: card.querySelector(".perceptionPercentage").value,
                base: card.querySelector(".perceptionBase").value,
                fijo: card.querySelector(".perceptionFixed").value
            });
        });
    }
    sessionStorage.setItem("perceptions_bonuses_list", JSON.stringify(bonusesToSave));
}

// ============================================
// ENVÍO DE DATOS
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

    // Aseguramos guardar estado antes de salir
    saveFixedInputsState();
    saveBonusesToStorage();

    // Recolectar Bonos (Manuales + Vacaciones)
    let listaBonos = getBonusesListFromDOM();

    if (diasVacaciones > 0 && flowType === 'paysheet') {
        const montoVacaciones = salarioDiario * diasVacaciones;
        const montoPrima = montoVacaciones * 0.25;
        listaBonos.push({ nombre: `Pago de Vacaciones (${diasVacaciones} días)`, percepcion: Number(montoVacaciones.toFixed(2)) });
        listaBonos.push({ nombre: "Prima Vacacional (25%)", percepcion: Number(montoPrima.toFixed(2)) });
    }

    let payload = {};
    if (flowType === 'paysheet') {
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
        payload = {
            salarioDiario: salarioDiario,
            fechaIngreso: userData.dateIn,
            fechaSalida: userData.dateOut || new Date().toISOString().split('T')[0],
            motivoBaja: userData.motivoBaja || "renuncia_voluntaria",
            diasVacacionesPendientes: diasVacaciones, 
            diasSalarioPendientes: Number(userData.days) || 0,
            otrosBonos: getBonusesListFromDOM() 
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

        window.location.href = flowType === 'paysheet' ? 'paysheetDeductions.html' : 'settlementDeductions.html';

    } catch (error) {
        console.error(error);
        Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'Error de conexión.' });
        e.target.innerText = originalText;
        e.target.disabled = false;
    }
}

// UTILS
function updateLabel(id, amount) {
    const el = document.getElementById(id);
    if (el) el.innerText = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

function getBonusesListFromDOM() {
    const container = document.getElementById("bonusContainer");
    if (!container) return [];
    const bonuses = [];
    const cards = container.querySelectorAll(".bonus-card");
    cards.forEach(card => {
        const name = card.querySelector(".perceptionName").value;
        const amount = Number(card.querySelector(".perceptionTotal").value) || 0;
        if (amount > 0) {
            bonuses.push({ nombre: name || "Bono Personalizado", percepcion: amount });
        }
    });
    return bonuses;
}