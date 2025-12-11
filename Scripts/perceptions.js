import services from './services.js';

document.addEventListener("DOMContentLoaded", () => {
    initRealTimeCalculators(); 
    restoreDynamicBonuses(); 
    initAddBonusButton();

    const btnSubmit = document.querySelector('button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.addEventListener("click", handleCalculatePerceptions);
    }
});

// ============================================
// LÓGICA DE CÁLCULO EN TIEMPO REAL
// ============================================
function initRealTimeCalculators() {
    const userDataJSON = sessionStorage.getItem("userData");
    if (!userDataJSON) return;

    const userData = JSON.parse(userDataJSON);
    const salarioDiario = parseFloat(userData.salary) || 0;
    
    // Mostrar Salario Base
    const diasPagados = parseFloat(userData.days) || 0;
    const sueldoTotal = salarioDiario * diasPagados;
    updateLabel("baseSalary", sueldoTotal);

    // Referencias DOM (Horas/Vacaciones)
    const inputOvertime = document.getElementById("overtime");
    const inputVacations = document.getElementById("vacationDays");

    // Referencias DOM (Aguinaldo)
    const checkBonus = document.getElementById("bonusCheck");
    const inputBonusDays = document.getElementById("bonusDays");
    const inputWorkedDays = document.getElementById("workedDays");
    const labelBonusTotal = document.getElementById("bonusTotalLabel");

    // RECUPERAR DATOS GUARDADOS (Persistencia)
    const savedInputs = JSON.parse(sessionStorage.getItem("perceptions_inputs") || "{}");
    
    // Restaurar Horas/Vacaciones
    if (inputOvertime && savedInputs.overtime) inputOvertime.value = savedInputs.overtime;
    if (inputVacations && savedInputs.vacations) inputVacations.value = savedInputs.vacations;

    // Restaurar Aguinaldo
    if (checkBonus) {
        if (savedInputs.bonusChecked) checkBonus.checked = true;
        if (inputBonusDays && savedInputs.bonusDays) inputBonusDays.value = savedInputs.bonusDays;
        if (inputWorkedDays && savedInputs.bonusWorked) inputWorkedDays.value = savedInputs.bonusWorked;
    }

    // FUNCIONES DE CÁLCULO
    
    const calcularHorasExtra = () => {
        if (!inputOvertime) return;
        const horas = parseFloat(inputOvertime.value) || 0;
        const valorHora = salarioDiario / 8;
        const total = valorHora * 2 * horas; 
        updateLabel("overtimeTotal", total);
        saveFixedInputsState();
    };

    const calcularVacaciones = () => {
        if (!inputVacations) return;
        const dias = parseFloat(inputVacations.value) || 0;
        const total = salarioDiario * dias;
        updateLabel("vacationTotal", total);
        saveFixedInputsState();
    };

    const calcularAguinaldo = () => {
        if (!checkBonus) return;
        
        const isActive = checkBonus.checked;
        const diasAguinaldo = parseFloat(inputBonusDays.value) || 15;
        const diasTrabajados = parseFloat(inputWorkedDays.value) || 0;

        // Activar/Desactivar inputs
        if (inputBonusDays) inputBonusDays.disabled = !isActive;
        if (inputWorkedDays) inputWorkedDays.disabled = !isActive;
        
        // Estilo visual (Opacidad)
        if (labelBonusTotal) labelBonusTotal.classList.toggle("opacity-50", !isActive);

        if (!isActive) {
            if (labelBonusTotal) labelBonusTotal.innerText = "$0.00";
        } else {
            // Fórmula: (Salario * Días_Ley) / 365 * Días_Trabajados
            const montoAnual = salarioDiario * diasAguinaldo;
            const proporcional = (montoAnual / 365) * diasTrabajados;
            updateLabel("bonusTotalLabel", proporcional);
        }
        saveFixedInputsState();
    };

    // LISTENERS
    if (inputOvertime) inputOvertime.addEventListener("input", calcularHorasExtra);
    if (inputVacations) inputVacations.addEventListener("input", calcularVacaciones);
    
    if (checkBonus) {
        checkBonus.addEventListener("change", calcularAguinaldo);
        inputBonusDays.addEventListener("input", calcularAguinaldo);
        inputWorkedDays.addEventListener("input", calcularAguinaldo);
    }

    // EJECUCIÓN INICIAL
    calcularHorasExtra();
    calcularVacaciones();
    calcularAguinaldo();
}

function saveFixedInputsState() {
    // Guardamos todo en un solo objeto
    const state = {
        overtime: document.getElementById('overtime')?.value || 0,
        vacations: document.getElementById('vacationDays')?.value || 0,
        bonusChecked: document.getElementById('bonusCheck')?.checked || false,
        bonusDays: document.getElementById('bonusDays')?.value || 15,
        bonusWorked: document.getElementById('workedDays')?.value || 365
    };
    sessionStorage.setItem("perceptions_inputs", JSON.stringify(state));
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
        <label class="font-medium text-gray-600 block mb-1">Nombre:</label>
        <input class="perceptionName border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-200 outline-none" type="text" placeholder="Ej. Bono puntualidad" />
    </div>
    <div class="grid grid-cols-3 gap-4">
        <label class="font-medium text-gray-600 block">Porcentaje (%):
            <input class="perceptionPercentage border border-gray-300 rounded-lg p-2 w-full mt-1 outline-none" type="number" min="0" />
        </label>
        <label class="font-medium text-gray-600 block">Base ($):
            <input class="perceptionBase border border-gray-300 rounded-lg p-2 w-full mt-1 outline-none" type="number" min="0" />
        </label>
        <label class="font-medium text-gray-600 block">Fijo ($):
            <input class="perceptionFixed border border-gray-300 rounded-lg p-2 w-full mt-1 outline-none" type="number" min="0" />
        </label>
    </div>
    <div class="mt-4 p-3 bg-gray-50 rounded-lg flex justify-between items-center border border-gray-100">
        <span class="font-bold text-gray-700">Total:</span>
        <div class="flex items-center">
             <span class="text-gray-500 mr-2">$</span>
             <input class="perceptionTotal bg-transparent font-bold text-xl text-green-600 text-right w-32 outline-none" type="number" readonly value="0.00" />
        </div>
    </div>`;

    document.getElementById("bonusContainer").appendChild(container);
    
    // Referencias
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
    inputs.forEach(inp => {
        inp.addEventListener('input', () => {
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

    // Guardar estado antes de salir
    saveFixedInputsState();
    saveBonusesToStorage();

    // RECOLECTAR BONOS DINÁMICOS
    let listaBonos = getBonusesListFromDOM();

    // AGREGAR VACACIONES (Si aplica)
    if (diasVacaciones > 0 && flowType === 'paysheet') {
        const montoVacaciones = salarioDiario * diasVacaciones;
        const montoPrima = montoVacaciones * 0.25;
        listaBonos.push({ nombre: `Pago de Vacaciones (${diasVacaciones} días)`, percepcion: Number(montoVacaciones.toFixed(2)) });
        listaBonos.push({ nombre: "Prima Vacacional (25%)", percepcion: Number(montoPrima.toFixed(2)) });
    }

    // AGREGAR AGUINALDO (Si está activo)
    const checkBonus = document.getElementById("bonusCheck");
    if (checkBonus && checkBonus.checked && flowType === 'paysheet') {
        const diasAguinaldo = Number(document.getElementById("bonusDays").value);
        const diasTrabajados = Number(document.getElementById("workedDays").value);
        
        // Fórmula proporcional
        const montoAnual = salarioDiario * diasAguinaldo;
        const proporcional = (montoAnual / 365) * diasTrabajados;

        if (proporcional > 0) {
            listaBonos.push({ 
                nombre: "Aguinaldo (Proporcional)", 
                percepcion: Number(proporcional.toFixed(2)) 
            });
        }
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
            otrosBonos: listaBonos // Aquí van Vacaciones + Aguinaldo + Personalizados
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