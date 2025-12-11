import services from './services.js';

document.addEventListener("DOMContentLoaded", () => {
    // Inicializar UI y cargar datos previos
    initDynamicDeductions();
    initLocalCalculators();
    loadPreviousStepData();

    // Pre-calcular impuestos estándar al cargar la página
    previewStandardDeductions();

    // Escuchar el botón de envío
    const btnSubmit = document.querySelector('button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.addEventListener("click", handleCalculateDeductions);
    }
});

// ==========================================
// PRE-CÁLCULO AL CARGAR
// ==========================================
async function previewStandardDeductions() {
    const flowType = sessionStorage.getItem("currentFlowType") || "paysheet";
    
    // Armamos el payload básico (sin deducciones extra, solo las de ley)
    const payload = buildPayload(flowType, []); 
    
    if (!payload) return; // Si faltan datos (el usuario no hizo el paso 1), no hacemos nada

    try {
        // Llamamos al backend
        const result = await services.calculateDeductions(flowType, payload);

        // Actualizamos los inputs visuales
        if (result.detallesCalculo) {
            // ISR
            const isrVal = result.detallesCalculo.isrDeterminado || result.detallesCalculo.isrOrdinario || 0;
            updateInputCurrency("DeductionsISR", isrVal);
            updateInputCurrency("DeductionsISRN", isrVal);

            // IMSS
            const imssVal = result.detallesCalculo.imssDeterminado || 0;
            updateInputCurrency("DeductionsIMSS", imssVal);
        }

    } catch (error) {
        console.warn("No se pudo realizar el pre-cálculo visual:", error);
    }
}

function updateInputCurrency(id, value) {
    const input = document.getElementById(id);
    if (input) {
        input.value = value.toFixed(2);
    }
}

// ==========================================
// LÓGICA PRINCIPAL (BOTÓN SIGUIENTE)
// ==========================================

async function handleCalculateDeductions(e) {
    e.preventDefault();

    const flowType = sessionStorage.getItem("currentFlowType") || "paysheet";
    
    // Recolectamos todas las deducciones extra que el usuario haya agregado
    const listaAdeudos = collectAllDeductions();

    // Armamos payload completo
    const payload = buildPayload(flowType, listaAdeudos);
    if (!payload) {
        Swal.fire("Error", "Faltan datos de los pasos anteriores.", "error");
        return;
    }

    try {
        const btn = e.target;
        const originalText = btn.innerText;
        btn.innerText = "Calculando...";
        btn.disabled = true;

        // LLAMADA AL SERVICIO
        const result = await services.calculateDeductions(flowType, payload);

        // Guardamos resultado del paso 2
        sessionStorage.setItem("step_deductions_data", JSON.stringify(result));
        sessionStorage.setItem("step_deductions_completed", "true");

        // Redireccionar al Resumen
        const nextUrl = flowType === 'paysheet' 
            ? 'paysheetResume.html' 
            : 'settlementResume.html';
        
        window.location.href = nextUrl;

    } catch (error) {
        console.error(error);
        Swal.fire({ icon: 'error', title: 'Error al calcular', text: error.message });
        e.target.innerText = "Ve el resúmen de tu nómina";
        e.target.disabled = false;
    }
}

// ==========================================
// CONSTRUCTOR DE PAYLOAD
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

// ==========================================
// FUNCIONES AUXILIARES DE UI Y LÓGICA LOCAL
// ==========================================

function collectAllDeductions() {
    let adeudos = [];

    // 1. Deducciones Dinámicas
    const container = document.getElementById("deductionsContainer");
    if (container) {
        for (let row of container.children) {
            const monto = Number(row.querySelector(".deductionTotal")?.value.replace('$','')) || 0;
            if (monto > 0) {
                adeudos.push({ nombre: "Deducción Personalizada", deduccion: monto });
            }
        }
    }

    // Deducciones Checkbox (Infonavit, etc.)
    const checkDeduction = (checkId, totalId, label) => {
        if (document.getElementById(checkId)?.checked) {
            const total = getMoneyValue(totalId);
            if (total > 0) adeudos.push({ nombre: label, deduccion: total });
        }
    };

    checkDeduction("infonavitCheck", "DeductionsTotalInfonavit", "INFONAVIT");
    checkDeduction("maintenanceCheck", "DeductionsTotalMaintenance", "Pensión Alimenticia");
    checkDeduction("FonacotCheck", "DeductionsTotalFonacot", "FONACOT");

    // 3. ISN
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
        // En finiquito sumamos las bases para mostrar un total visual
        const gravadoTotal = step1Data.baseGravableISR 
            || ((step1Data.detallesCalculo?.baseGravableOrdinaria || 0) + (step1Data.detallesCalculo?.baseGravableSeparacion || 0));
        inputGravado.value = gravadoTotal.toFixed(2);
    }
}

function initLocalCalculators() {
    const setupCalc = (checkId, pctId, fixId, totalId) => {
        const inputs = [document.getElementById(checkId), document.getElementById(pctId), document.getElementById(fixId)];
        inputs.forEach(el => {
            if(el) el.addEventListener('input', () => calculateRow(checkId, pctId, fixId, totalId));
            if(el && el.type === 'checkbox') el.addEventListener('change', () => calculateRow(checkId, pctId, fixId, totalId));
        });
    };

    setupCalc("infonavitCheck", "DeductionsPercentageInfontavit", "DeductionsFixedFeeInfonavit", "DeductionsTotalInfonavit");
    setupCalc("maintenanceCheck", "DeductionsPercentageMaintenance", "DeductionsFixedFeeMaintenance", "DeductionsTotalMaintenance");
    setupCalc("FonacotCheck", "DeductionsPercentageFonacot", "DeductionsFixedFeeFonacot", "DeductionsTotalFonacot");
}

function calculateRow(checkId, pctId, fixId, totalId) {
    const isChecked = document.getElementById(checkId)?.checked;
    const output = document.getElementById(totalId);
    
    if (!isChecked) {
        output.innerText = "$0.00";
        return;
    }

    const pct = Number(document.getElementById(pctId)?.value) || 0;
    const fixed = Number(document.getElementById(fixId)?.value) || 0;
    const base = Number(document.getElementById("DeductionsGravado").value) || 0;

    const total = (base * (pct / 100)) + fixed;
    output.innerText = `$${total.toFixed(2)}`;
}

function getMoneyValue(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return 0;
    return Number(el.innerText.replace(/[^0-9.-]+/g,"")) || 0;
}

function initDynamicDeductions() {
    const btn = document.getElementById("addDeductionBtn");
    if (!btn) return;

    btn.addEventListener("click", function () {
        const wrap = document.createElement("div");
        wrap.className = "border rounded-xl p-6 bg-white shadow max-w-3xl mx-auto space-y-4 mb-4 relative";
        
        wrap.innerHTML = `
            <div class="flex justify-between items-center">
                 <label class="font-semibold text-gray-700">Deducción personalizada</label>
                 <button type="button" class="deleteDeduction text-red-500 hover:text-red-700 text-sm font-bold">Eliminar</button>
            </div>
            <div class="grid grid-cols-3 gap-6 mt-2">
                <label class="font-medium">Porcentaje: <input class="deductionPercentage mt-1 border rounded-lg p-2 w-full" type="number" min="0" placeholder="0" /></label>
                <label class="font-medium">Cuota Fija: <input class="deductionFixed mt-1 border rounded-lg p-2 w-full" type="number" min="0" placeholder="0" /></label>
                <label class="font-medium">Total: <input class="deductionTotal mt-1 border rounded-lg p-2 w-full bg-gray-50" type="text" readonly value="$0.00" /></label>
            </div>
        `;
        document.getElementById("deductionsContainer").appendChild(wrap);

        const inputs = wrap.querySelectorAll("input:not([readonly])");
        inputs.forEach(inp => inp.addEventListener("input", () => {
             const pct = Number(wrap.querySelector(".deductionPercentage").value) || 0;
             const fixed = Number(wrap.querySelector(".deductionFixed").value) || 0;
             const base = Number(document.getElementById("DeductionsGravado").value) || 0;
             const total = (base * (pct / 100)) + fixed;
             wrap.querySelector(".deductionTotal").value = total.toFixed(2);
        }));

        wrap.querySelector(".deleteDeduction").addEventListener("click", () => wrap.remove());
    });
}