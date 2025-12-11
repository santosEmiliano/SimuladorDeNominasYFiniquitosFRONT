import services from './services.js';

document.addEventListener("DOMContentLoaded", () => {
    // Inicializar UI
    initAddDeductionButton();
    
    // Cargar datos del paso anterior (Base Gravable)
    loadPreviousStepData();

    // Restaurar estado (Checkboxes fijos + Deducciones dinámicas)
    restoreDeductionInputsState();
    restoreDynamicDeductions();
    
    // Activar calculadoras locales
    initLocalCalculators(); 

    // Pre-cálculo silencioso (ISR/IMSS)
    previewStandardDeductions();

    // Listener del botón Siguiente
    const btnSubmit = document.querySelector('button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.addEventListener("click", handleCalculateDeductions);
    }
});

// ==========================================
// LÓGICA DE DEDUCCIONES DINÁMICAS (NUEVO)
// ==========================================

function initAddDeductionButton() {
    const btn = document.getElementById("addDeductionBtn");
    if (!btn) return;

    btn.addEventListener("click", () => {
        createDeductionRow();
        saveDynamicDeductions(); // Guardamos el estado al agregar
    });
}

function restoreDynamicDeductions() {
    // Recuperamos la lista guardada
    const savedList = JSON.parse(sessionStorage.getItem("deductions_custom_list") || "[]");
    savedList.forEach(data => createDeductionRow(data));
}

function createDeductionRow(data = null) {
    const container = document.getElementById("deductionsContainer");
    if (!container) return;

    const card = document.createElement("div");
    card.className = "deduction-card border rounded-xl p-6 bg-white shadow max-w-3xl mx-auto space-y-4 mb-4 relative transition-all duration-300 hover:shadow-md";
    
    // HTML inyectado
    card.innerHTML = `
        <div class="flex justify-between items-center mb-2">
             <h3 class="text-lg font-semibold text-gray-700">Deducción Personalizada</h3>
             <button type="button" class="deleteDeduction text-red-500 hover:text-red-700 font-bold px-3 py-1 bg-red-50 rounded transition">Eliminar</button>
        </div>

        <div class="mb-4">
            <label class="font-medium text-gray-600 block mb-1">Nombre de la deducción:</label>
            <input class="deductionName border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-200 outline-none transition" type="text" placeholder="Ej. Préstamo personal" />
        </div>

        <div class="grid grid-cols-3 gap-6">
            <label class="font-medium text-gray-600 block">Porcentaje (%):
                <input class="deductionPercentage mt-1 border border-gray-300 rounded-lg p-2 w-full outline-none focus:ring-2 focus:ring-blue-200" type="number" min="0" placeholder="0" />
            </label>
            <label class="font-medium text-gray-600 block">Cuota Fija ($):
                <input class="deductionFixed mt-1 border border-gray-300 rounded-lg p-2 w-full outline-none focus:ring-2 focus:ring-blue-200" type="number" min="0" placeholder="0.00" />
            </label>
            
            <div class="bg-gray-50 rounded-lg p-2 border border-gray-100">
                <label class="font-bold text-gray-700 block text-sm">Total:</label>
                <div class="flex items-center mt-1">
                    <span class="text-gray-500 mr-1">$</span>
                    <input class="deductionTotal bg-transparent font-bold text-lg text-red-600 w-full outline-none" type="number" readonly value="0.00" />
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(card);

    // Referencias
    const iName = card.querySelector(".deductionName");
    const iPct = card.querySelector(".deductionPercentage");
    const iFixed = card.querySelector(".deductionFixed");
    const iTotal = card.querySelector(".deductionTotal");

    // Si es restauración, llenamos datos
    if (data) {
        iName.value = data.nombre || "";
        iPct.value = data.porcentaje || "";
        iFixed.value = data.fijo || "";
        calculateDynamicRow(iPct, iFixed, iTotal);
    }

    // Listeners: Calcular y Guardar al escribir
    const inputs = [iName, iPct, iFixed];
    inputs.forEach(inp => {
        inp.addEventListener("input", () => {
            calculateDynamicRow(iPct, iFixed, iTotal);
            saveDynamicDeductions();
        });
    });

    // Eliminar
    card.querySelector(".deleteDeduction").addEventListener("click", () => {
        card.remove();
        saveDynamicDeductions();
    });
}

function calculateDynamicRow(iPct, iFixed, iTotal) {
    const base = Number(document.getElementById("DeductionsGravado").value) || 0;
    const pct = parseFloat(iPct.value) || 0;
    const fixed = parseFloat(iFixed.value) || 0;
    
    const total = (base * (pct / 100)) + fixed;
    iTotal.value = total.toFixed(2);
}

function saveDynamicDeductions() {
    const container = document.getElementById("deductionsContainer");
    const list = [];
    if (container) {
        const cards = container.querySelectorAll(".deduction-card");
        cards.forEach(card => {
            list.push({
                nombre: card.querySelector(".deductionName").value,
                porcentaje: card.querySelector(".deductionPercentage").value,
                fijo: card.querySelector(".deductionFixed").value
            });
        });
    }
    sessionStorage.setItem("deductions_custom_list", JSON.stringify(list));
}

// ==========================================
// PERSISTENCIA DE INPUTS FIJOS (Infonavit, etc)
// ==========================================

function saveDeductionInputsState() {
    const state = {
        infonavitCheck: document.getElementById("infonavitCheck")?.checked || false,
        infonavitPct: document.getElementById("DeductionsPercentageInfontavit")?.value || "",
        infonavitFixed: document.getElementById("DeductionsFixedFeeInfonavit")?.value || "",
        
        maintenanceCheck: document.getElementById("maintenanceCheck")?.checked || false,
        maintenancePct: document.getElementById("DeductionsPercentageMaintenance")?.value || "",
        maintenanceFixed: document.getElementById("DeductionsFixedFeeMaintenance")?.value || "",

        fonacotCheck: document.getElementById("FonacotCheck")?.checked || false,
        fonacotPct: document.getElementById("DeductionsPercentageFonacot")?.value || "",
        fonacotFixed: document.getElementById("DeductionsFixedFeeFonacot")?.value || "",

        isnCheck: document.getElementById("ApplyISN")?.checked || false
    };
    sessionStorage.setItem("deductions_inputs", JSON.stringify(state));
}

function restoreDeductionInputsState() {
    const stateJSON = sessionStorage.getItem("deductions_inputs");
    if (!stateJSON) return;
    const state = JSON.parse(stateJSON);

    const restoreBlock = (checkId, pctId, fixId, totalId, savedCheck, savedPct, savedFix) => {
        const elCheck = document.getElementById(checkId);
        const elPct = document.getElementById(pctId);
        const elFix = document.getElementById(fixId);
        if (elCheck) elCheck.checked = savedCheck;
        if (elPct) elPct.value = savedPct;
        if (elFix) elFix.value = savedFix;
        calculateRow(checkId, pctId, fixId, totalId);
    };

    restoreBlock("infonavitCheck", "DeductionsPercentageInfontavit", "DeductionsFixedFeeInfonavit", "DeductionsTotalInfonavit", state.infonavitCheck, state.infonavitPct, state.infonavitFixed);
    restoreBlock("maintenanceCheck", "DeductionsPercentageMaintenance", "DeductionsFixedFeeMaintenance", "DeductionsTotalMaintenance", state.maintenanceCheck, state.maintenancePct, state.maintenanceFixed);
    restoreBlock("FonacotCheck", "DeductionsPercentageFonacot", "DeductionsFixedFeeFonacot", "DeductionsTotalFonacot", state.fonacotCheck, state.fonacotPct, state.fonacotFixed);

    const isnCheck = document.getElementById("ApplyISN");
    if (isnCheck) isnCheck.checked = state.isnCheck;
}

// ==========================================
// CALCULADORAS LOCALES (Checkboxes)
// ==========================================

function initLocalCalculators() {
    const setupCalc = (checkId, pctId, fixId, totalId) => {
        const inputs = [document.getElementById(checkId), document.getElementById(pctId), document.getElementById(fixId)];
        inputs.forEach(el => {
            if (el) {
                const eventType = el.type === 'checkbox' ? 'change' : 'input';
                el.addEventListener(eventType, () => {
                    calculateRow(checkId, pctId, fixId, totalId);
                    saveDeductionInputsState(); 
                });
            }
        });
    };
    setupCalc("infonavitCheck", "DeductionsPercentageInfontavit", "DeductionsFixedFeeInfonavit", "DeductionsTotalInfonavit");
    setupCalc("maintenanceCheck", "DeductionsPercentageMaintenance", "DeductionsFixedFeeMaintenance", "DeductionsTotalMaintenance");
    setupCalc("FonacotCheck", "DeductionsPercentageFonacot", "DeductionsFixedFeeFonacot", "DeductionsTotalFonacot");

    const isnCheck = document.getElementById("ApplyISN");
    if (isnCheck) isnCheck.addEventListener("change", saveDeductionInputsState);
}

function calculateRow(checkId, pctId, fixId, totalId) {
    const isChecked = document.getElementById(checkId)?.checked;
    const output = document.getElementById(totalId);
    if (!isChecked) {
        if (output) output.innerText = "$0.00";
        return;
    }
    const pct = Number(document.getElementById(pctId)?.value) || 0;
    const fixed = Number(document.getElementById(fixId)?.value) || 0;
    const base = Number(document.getElementById("DeductionsGravado").value) || 0;

    const total = (base * (pct / 100)) + fixed;
    if (output) output.innerText = `$${total.toFixed(2)}`;
}

// ==========================================
// PRE-CÁLCULO & ENVÍO
// ==========================================

async function previewStandardDeductions() {
    const flowType = sessionStorage.getItem("currentFlowType") || "paysheet";
    const payload = buildPayload(flowType, []); 
    if (!payload) return; 
    try {
        const result = await services.calculateDeductions(flowType, payload);
        if (result.detallesCalculo) {
            const isrVal = result.detallesCalculo.isrDeterminado || result.detallesCalculo.isrOrdinario || 0;
            updateInputCurrency("DeductionsISR", isrVal);
            updateInputCurrency("DeductionsISRN", isrVal); 
            const imssVal = result.detallesCalculo.imssDeterminado || 0;
            updateInputCurrency("DeductionsIMSS", imssVal);
        }
    } catch (error) { console.warn("Pre-cálculo:", error); }
}

async function handleCalculateDeductions(e) {
    e.preventDefault();
    const flowType = sessionStorage.getItem("currentFlowType") || "paysheet";
    
    // Guardamos estado final
    saveDeductionInputsState();
    saveDynamicDeductions();

    const listaAdeudos = collectAllDeductions();
    const payload = buildPayload(flowType, listaAdeudos);

    if (!payload) {
        Swal.fire("Error", "Faltan datos de los pasos anteriores.", "error");
        return;
    }

    try {
        const btn = e.target;
        btn.innerText = "Calculando...";
        btn.disabled = true;

        const result = await services.calculateDeductions(flowType, payload);

        sessionStorage.setItem("step_deductions_data", JSON.stringify(result));
        sessionStorage.setItem("step_deductions_completed", "true");

        window.location.href = flowType === 'paysheet' ? 'paysheetResume.html' : 'settlementResume.html';

    } catch (error) {
        console.error(error);
        Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        e.target.innerText = "Ve el resúmen de tu nómina";
        e.target.disabled = false;
    }
}

// ==========================================
// UTILERIAS Y RECOLECCIÓN
// ==========================================

function buildPayload(flowType, listaAdeudos) {
    const userData = JSON.parse(sessionStorage.getItem("userData"));
    const step1Data = JSON.parse(sessionStorage.getItem("step_perceptions_data"));
    if (!userData || !step1Data) return null;

    if (flowType === 'paysheet') {
        return {
            salarioDiario: Number(userData.salary),
            diasPeriodo: userData.period === 'Semanal' ? 7 : userData.period === 'Quincenal' ? 15 : 30,
            faltas: 0, 
            baseGravableISR: step1Data.baseGravableISR,
            sbcCalculado: step1Data.sbcCalculado,
            adeudos: listaAdeudos
        };
    } else {
        return {
            baseGravableOrdinaria: step1Data.detallesCalculo.baseGravableOrdinaria,
            baseGravableSeparacion: step1Data.detallesCalculo.baseGravableSeparacion,
            adeudos: listaAdeudos
        };
    }
}

function collectAllDeductions() {
    let adeudos = [];

    // Recolectar Dinámicas
    const container = document.getElementById("deductionsContainer");
    if (container) {
        const cards = container.querySelectorAll(".deduction-card");
        cards.forEach(card => {
            const name = card.querySelector(".deductionName").value || "Deducción Personalizada";
            const amount = Number(card.querySelector(".deductionTotal").value) || 0;
            if (amount > 0) {
                adeudos.push({ nombre: name, deduccion: amount });
            }
        });
    }

    // Fijos
    const checkDeduction = (checkId, totalId, label) => {
        if (document.getElementById(checkId)?.checked) {
            const total = getMoneyValue(totalId);
            if (total > 0) adeudos.push({ nombre: label, deduccion: total });
        }
    };
    checkDeduction("infonavitCheck", "DeductionsTotalInfonavit", "INFONAVIT");
    checkDeduction("maintenanceCheck", "DeductionsTotalMaintenance", "Pensión Alimenticia");
    checkDeduction("FonacotCheck", "DeductionsTotalFonacot", "FONACOT");

    if (document.getElementById("ApplyISN")?.checked) {
         const base = Number(document.getElementById("DeductionsGravado").value) || 0;
         const isn = base * 0.02; 
         if(isn > 0) adeudos.push({ nombre: "ISN (Retenido)", deduccion: Number(isn.toFixed(2)) });
    }

    return adeudos;
}

function loadPreviousStepData() {
    const step1Data = JSON.parse(sessionStorage.getItem("step_perceptions_data"));
    if (!step1Data) return;
    const inputGravado = document.getElementById("DeductionsGravado");
    if (inputGravado) {
        const gravadoTotal = step1Data.baseGravableISR 
            || ((step1Data.detallesCalculo?.baseGravableOrdinaria || 0) + (step1Data.detallesCalculo?.baseGravableSeparacion || 0));
        inputGravado.value = gravadoTotal.toFixed(2);
    }
}

function updateInputCurrency(id, value) {
    const input = document.getElementById(id);
    if (input) input.value = value.toFixed(2);
}

function getMoneyValue(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return 0;
    return Number(el.innerText.replace(/[^0-9.-]+/g,"")) || 0;
}