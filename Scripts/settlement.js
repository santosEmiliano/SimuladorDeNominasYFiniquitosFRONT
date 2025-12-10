document
  .getElementById("addDeductionBtn")
  .addEventListener("click", function () {
    const wrap = document.createElement("div");
    wrap.className =
      "border rounded-xl p-6 bg-white shadow max-w-3xl mx-auto space-y-4";

    wrap.innerHTML = `

    <label class="flex items-center gap-2 font-semibold mb-3">
      Deducción personalizada
    </label>

    <button 
        type="button" 
        class="deleteDeduction text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded text-sm font-medium transition-colors">
        Eliminar
    </button>

    <div class="grid grid-cols-3 gap-6 mt-2">
      <label class="font-medium">
        Porcentaje:
        <input
          class="deductionPercentage"
          type="number"
          min="0"
          class="mt-1 border rounded-lg p-2 w-full no-spinner focus:ring-2 focus:ring-blue-300"
          placeholder="0"
        />
      </label>
      <label class="font-medium">
        Cuota Fija:
        <input
          class="deductionFixed"
          type="number"
          min="0"
          class="mt-1 border rounded-lg p-2 w-full no-spinner focus:ring-2 focus:ring-blue-300"
          placeholder="0"
        />
      </label>
      <label class="font-medium">
        Total:
        <input
          class="deductionTotal"
          type="text"
          readonly
          class="mt-1 border rounded-lg p-2 w-full no-spinner focus:ring-2 focus:ring-blue-300"
          value="$0.00"
        />
      </label>

    </div>
  `;

    document.getElementById("deductionsContainer").appendChild(wrap);

    const deleteBtn = wrap.querySelector(".deleteDeduction");
    deleteBtn.addEventListener("click", function () {
      wrap.remove();
    });

    /*Se supone que también hay que eliminar también en caso de que se haga un sobrecálculo o algo*/
  });

  