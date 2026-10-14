/**
 * FetchHogwarts - Lógica de la aplicación
 * Explica y demuestra la API Fetch de JavaScript con la HP-API
 * https://hp-api.onrender.com/api
 */

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'https://hp-api.onrender.com/api';
    const MAX_CARDS = 12;

    // Elementos del DOM
    const lab = document.getElementById('laboratorio');
    const endpointSelect = document.getElementById('endpointSelect');
    const searchInput = document.getElementById('searchInput');
    const btnFetchAsync = document.getElementById('btnFetchAsync');
    const btnFetchPromises = document.getElementById('btnFetchPromises');
    const metricsBar = document.getElementById('metricsBar');
    const metricStatus = document.getElementById('metricStatus');
    const metricTime = document.getElementById('metricTime');
    const metricType = document.getElementById('metricType');
    const metricCount = document.getElementById('metricCount');
    const metricMode = document.getElementById('metricMode');
    const resultsDisplay = document.getElementById('resultsDisplay');
    const jsonOutput = document.getElementById('jsonOutput');
    const codeSnippetContent = document.getElementById('codeSnippetContent');
    const codeTitle = document.getElementById('codeTitle');
    const btnCopyJson = document.getElementById('btnCopyJson');
    const btnCopyCode = document.getElementById('btnCopyCode');

    const houseNames = {
        gryffindor: 'Gryffindor',
        slytherin: 'Slytherin',
        ravenclaw: 'Ravenclaw',
        hufflepuff: 'Hufflepuff'
    };

    let lastFetchedJsonString = '';

    // Eventos
    btnFetchAsync.addEventListener('click', () => fetchAsync());
    btnFetchPromises.addEventListener('click', () => fetchPromises());

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') fetchAsync();
    });

    // Al cambiar de endpoint, el laboratorio toma los colores de la casa elegida
    endpointSelect.addEventListener('change', () => {
        applyHouseTheme(endpointSelect.value);
    });

    // Pestañas
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.getAttribute('data-tab')).classList.add('active');
        });
    });

    // Copiar al portapapeles
    btnCopyJson.addEventListener('click', () => {
        if (!lastFetchedJsonString) return;
        copyText(lastFetchedJsonString, btnCopyJson);
    });

    btnCopyCode.addEventListener('click', () => {
        copyText(codeSnippetContent.textContent, btnCopyCode);
    });

    function copyText(text, button) {
        navigator.clipboard.writeText(text).then(() => {
            const original = button.textContent;
            button.textContent = '✅ ¡Copiado!';
            setTimeout(() => (button.textContent = original), 2000);
        });
    }

    /* ======================================================================
       Opción 1: fetch con async / await
       ====================================================================== */
    async function fetchAsync() {
        const endpoint = endpointSelect.value;
        const term = searchInput.value.trim().toLowerCase();
        const url = `${API_BASE}/${endpoint}`;

        showLoadingState();
        updateCodeDisplayAsync(endpoint, term);

        const startTime = performance.now();

        try {
            // Paso 1: petición HTTP GET
            const response = await fetch(url);
            const latency = Math.round(performance.now() - startTime);

            // Paso 2: comprobar el estado HTTP
            if (!response.ok) {
                updateMetrics(`${response.status} ${response.statusText}`, latency, null, 0, 'async/await', false);
                throw new Error(`No se pudo consultar "${endpoint}" (código HTTP ${response.status})`);
            }

            // Paso 3: convertir el cuerpo a JSON
            const data = await response.json();
            updateMetrics(`${response.status} OK`, latency, response.headers.get('content-type'), data.length, 'async/await', true);

            // Paso 4: filtrar y mostrar
            showResults(data, endpoint, term);
        } catch (error) {
            handleError(error);
        }
    }

    /* ======================================================================
       Opción 2: fetch con promesas (.then / .catch)
       ====================================================================== */
    function fetchPromises() {
        const endpoint = endpointSelect.value;
        const term = searchInput.value.trim().toLowerCase();
        const url = `${API_BASE}/${endpoint}`;

        showLoadingState();
        updateCodeDisplayPromises(endpoint, term);

        const startTime = performance.now();
        let statusText = '';
        let latency = 0;
        let contentType = '';

        fetch(url)
            .then(response => {
                latency = Math.round(performance.now() - startTime);
                statusText = `${response.status} ${response.ok ? 'OK' : response.statusText}`;
                contentType = response.headers.get('content-type');

                if (!response.ok) {
                    updateMetrics(statusText, latency, contentType, 0, '.then() / promesas', false);
                    throw new Error(`No se pudo consultar "${endpoint}" (código HTTP ${response.status})`);
                }
                return response.json();
            })
            .then(data => {
                updateMetrics(statusText, latency, contentType, data.length, '.then() / promesas', true);
                showResults(data, endpoint, term);
            })
            .catch(error => handleError(error));
    }

    /* ======================================================================
       Funciones de ayuda
       ====================================================================== */

    // Escapa texto externo antes de insertarlo con innerHTML (evita XSS)
    function esc(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function applyHouseTheme(endpoint) {
        const match = endpoint.match(/house\/(\w+)/);
        lab.setAttribute('data-house', match ? match[1] : 'none');
    }

    function showResults(data, endpoint, term) {
        lastFetchedJsonString = JSON.stringify(data, null, 2);
        jsonOutput.textContent = lastFetchedJsonString;

        const filtered = term ? data.filter(item => matchesTerm(item, term)) : data;

        if (endpoint === 'spells') {
            renderSpells(filtered, data.length);
        } else {
            renderCharacters(filtered, data.length);
        }
    }

    function matchesTerm(item, term) {
        const names = [item.name, ...(item.alternate_names || [])];
        return names.some(n => String(n).toLowerCase().includes(term));
    }

    function showLoadingState() {
        metricsBar.classList.remove('hidden');
        resultsDisplay.innerHTML = `
            <div class="spinner-container">
                <div class="spinner"></div>
                <p>Realizando la petición <code>fetch()</code> a la HP-API...</p>
                <p>La primera llamada puede tardar unos segundos si la API estaba dormida.</p>
            </div>
        `;
        jsonOutput.textContent = '// Cargando datos del servidor...';
    }

    function updateMetrics(statusText, latency, contentType, count, mode, isSuccess) {
        metricStatus.textContent = statusText;
        metricStatus.className = isSuccess ? 'badge badge-success' : 'badge badge-danger';
        metricTime.textContent = `${latency} ms`;
        metricType.textContent = contentType ? contentType.split(';')[0] : '—';
        metricCount.textContent = count;
        metricMode.textContent = mode;
    }

    function handleError(error) {
        // Un TypeError en fetch indica fallo de red, CORS o API inaccesible
        const message = error instanceof TypeError
            ? 'No se pudo conectar con la API. Revisa tu conexión e inténtalo de nuevo.'
            : error.message;

        metricStatus.textContent = metricStatus.textContent || 'Error';
        if (!metricStatus.classList.contains('badge-danger')) {
            metricStatus.textContent = 'Sin conexión';
            metricStatus.className = 'badge badge-danger';
        }

        renderErrorState(message);
        jsonOutput.textContent = `// Error:\n${message}`;
    }

    function renderErrorState(message) {
        resultsDisplay.innerHTML = `
            <div class="placeholder-state" style="color: var(--danger);">
                <span class="placeholder-icon">⚠️</span>
                <h3>La petición no funcionó</h3>
                <p>${esc(message)}</p>
            </div>
        `;
    }

    function renderEmptyState(total) {
        resultsDisplay.innerHTML = `
            <div class="placeholder-state">
                <span class="placeholder-icon">🕯️</span>
                <p>Ningún resultado coincide con tu filtro (la API devolvió ${total} registros).</p>
                <p>Borra el texto del filtro y vuelve a ejecutar.</p>
            </div>
        `;
    }

    function capitalize(text) {
        return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
    }

    function wandText(wand) {
        if (!wand || (!wand.wood && !wand.core && !wand.length)) return 'Sin registro';
        const parts = [];
        if (wand.wood) parts.push(wand.wood);
        if (wand.core) parts.push(wand.core);
        if (wand.length) parts.push(`${wand.length}"`);
        return parts.join(' · ');
    }

    function renderCharacters(list, total) {
        if (list.length === 0) {
            renderEmptyState(total);
            return;
        }

        const shown = list.slice(0, MAX_CARDS);

        const cards = shown.map(c => {
            const house = (c.house || '').toLowerCase();
            const houseLabel = houseNames[house] || 'Sin casa';
            const initial = esc((c.name || '?').charAt(0));
            const photo = c.image
                ? `<img src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy" onerror="this.outerHTML='<span class=&quot;char-initial&quot;>${initial}</span>'">`
                : `<span class="char-initial">${initial}</span>`;

            return `
                <article class="char-card" data-house="${esc(house)}">
                    <div class="char-photo">${photo}</div>
                    <div class="char-body">
                        <h3 class="char-name">${esc(c.name)}</h3>
                        <p class="char-actor">${c.actor ? 'Interpretado por ' + esc(c.actor) : 'Actor no registrado'}</p>
                        <span class="house-tag">${esc(houseLabel)}</span>
                        <dl class="char-facts">
                            <dt>Especie</dt><dd>${esc(c.species || '—')}</dd>
                            <dt>Ascendencia</dt><dd>${esc(c.ancestry || '—')}</dd>
                            <dt>Nacimiento</dt><dd>${esc(c.dateOfBirth || c.yearOfBirth || '—')}</dd>
                            <dt>Varita</dt><dd style="text-transform:none;">${esc(wandText(c.wand))}</dd>
                            <dt>Patronus</dt><dd>${esc(c.patronus || '—')}</dd>
                            <dt>Estado</dt><dd>${c.alive ? 'Vivo' : 'Fallecido'}</dd>
                        </dl>
                    </div>
                </article>
            `;
        }).join('');

        resultsDisplay.innerHTML = `
            <div class="results-wrap">
                <p class="results-meta">Mostrando ${shown.length} de ${list.length} personajes
                    (la API devolvió ${total}).</p>
                <div class="cards-grid">${cards}</div>
            </div>
        `;
    }

    function renderSpells(list, total) {
        if (list.length === 0) {
            renderEmptyState(total);
            return;
        }

        const shown = list.slice(0, MAX_CARDS * 2);

        const cards = shown.map(s => `
            <article class="spell-card">
                <h3 class="spell-name">${esc(s.name)}</h3>
                <p class="spell-desc">${esc(s.description || 'Sin descripción')}</p>
            </article>
        `).join('');

        resultsDisplay.innerHTML = `
            <div class="results-wrap">
                <p class="results-meta">Mostrando ${shown.length} de ${list.length} hechizos
                    (la API devolvió ${total}).</p>
                <div class="cards-grid">${cards}</div>
            </div>
        `;
    }

    /* ======================================================================
       Código que se muestra en la pestaña "Código ejecutado"
       ====================================================================== */
    function updateCodeDisplayAsync(endpoint, term) {
        codeTitle.textContent = 'Código JavaScript (async / await)';
        const lines = [
            '// Petición HTTP usando async / await',
            'async function consultarApi() {',
            "  const url = 'https://hp-api.onrender.com/api/" + endpoint + "';",
            '',
            '  try {',
            '    // 1. Iniciar la petición fetch',
            '    const respuesta = await fetch(url);',
            '',
            '    // 2. Verificar el estado HTTP (200 OK)',
            '    if (!respuesta.ok) {',
            "      throw new Error('Error HTTP: ' + respuesta.status);",
            '    }',
            '',
            '    // 3. Convertir el cuerpo de la respuesta a JSON (un arreglo)',
            '    const datos = await respuesta.json();'
        ];

        if (term) {
            lines.push(
                '',
                '    // 4. Filtrar por nombre en el navegador',
                "    const resultado = datos.filter(item =>",
                "      item.name.toLowerCase().includes('" + term + "')",
                '    );',
                "    console.log('Coincidencias:', resultado);",
                '    return resultado;'
            );
        } else {
            lines.push(
                '',
                "    console.log('Registros recibidos:', datos.length);",
                '    return datos;'
            );
        }

        lines.push(
            '  } catch (error) {',
            "    console.error('Error al realizar fetch:', error);",
            '  }',
            '}',
            '',
            'consultarApi();'
        );

        codeSnippetContent.textContent = lines.join('\n');
    }

    function updateCodeDisplayPromises(endpoint, term) {
        codeTitle.textContent = 'Código JavaScript (promesas .then / .catch)';
        const lines = [
            '// Petición HTTP usando promesas (.then / .catch)',
            'function consultarApiConPromesas() {',
            "  const url = 'https://hp-api.onrender.com/api/" + endpoint + "';",
            '',
            '  fetch(url)',
            '    .then(respuesta => {',
            '      // 1. Verificar el estado HTTP',
            '      if (!respuesta.ok) {',
            "        throw new Error('Error HTTP: ' + respuesta.status);",
            '      }',
            '      // 2. Devolver la promesa de la conversión a JSON',
            '      return respuesta.json();',
            '    })',
            '    .then(datos => {'
        ];

        if (term) {
            lines.push(
                '      // 3. Filtrar por nombre en el navegador',
                '      const resultado = datos.filter(item =>',
                "        item.name.toLowerCase().includes('" + term + "')",
                '      );',
                "      console.log('Coincidencias:', resultado);"
            );
        } else {
            lines.push("      console.log('Registros recibidos:', datos.length);");
        }

        lines.push(
            '    })',
            '    .catch(error => {',
            "      console.error('Error al realizar fetch:', error);",
            '    });',
            '}',
            '',
            'consultarApiConPromesas();'
        );

        codeSnippetContent.textContent = lines.join('\n');
    }

    // Carga inicial: la casa de Gryffindor
    applyHouseTheme(endpointSelect.value);
    fetchAsync();
});
