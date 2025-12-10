document.getElementById("addBonusBtn").addEventListener("click", function () {
  const container = document.createElement("div");
  container.className =
    "border rounded-xl p-6 shadow max-w-3xl mx-auto bg-white space-y-6 relative group";

  container.innerHTML = `
    <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-semibold text-gray-800">Bonos / Comisiones</h2>
        
        <button 
            type="button" 
            class="delete-bonus-btn text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded text-sm font-medium transition-colors">
            Eliminar
        </button>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <label class="font-medium">
        Nombre de percepción:
        <input
          class="perceptionName border rounded p-2 w-full mt-1"
          type="text"
        />
      </label>

      <label class="font-medium">
        Tipo de percepción:
        <select class="perceptionType border rounded p-2 w-full mt-1">
          <option>Regular</option>
          <option>Extraordinaria</option>
        </select>
      </label>

      <label class="font-medium">
        Impuestos:
        <select class="perceptionTaxes border rounded p-2 w-full mt-1">
          <option>Gravados</option>
          <option>Exentos</option>
        </select>
      </label>
    </div>

    <div class="grid grid-cols-3 gap-6 mt-6">
      <label class="font-medium">
        Porcentaje:
        <input
          class="perceptionPercentage border rounded p-2 w-full mt-1"
          type="number"
          min="0"
          max="100"
          value="0"
        />
      </label>

      <label class="font-medium">
        Base a aplicar:
        <input
          class="perceptionBase border rounded p-2 w-full mt-1"
          type="number"
          min="0"
          value="0"
        />
      </label>

      <label class="font-medium">
        Fijo:
        <input
          class="perceptionFixed border rounded p-2 w-full mt-1"
          type="number"
          min="0"
          value="0"
        />
      </label>
    </div>

    <label class="font-medium block">
      Total de Percepciones:
      <div class="flex items-center mt-1">
        <span class="mr-2 font-semibold">$</span>
        <input
          class="perceptionTotal border rounded p-2 w-40 bg-gray-50"
          type="number"
          readonly
          value="0"
          placeholder="0000.00"
        />
      </div>
    </label>

    <div class="flex justify-center">
      <button
        class="btnAddRegularPerception bg-white border border-gray-300 rounded px-4 py-2 shadow hover:bg-gray-100 transition"
      >
        Agregar percepción regular
      </button>
    </div>
  `;

  document.getElementById("bonusContainer").appendChild(container);

  const deleteBtn = container.querySelector(".delete-bonus-btn");

  deleteBtn.addEventListener("click", function () {
    container.remove();
    /*Se supone que también hay que eliminar también en caso de que se haga un sobrecálculo o algo*/
  });
});

