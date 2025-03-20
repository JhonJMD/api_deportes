// Configuración de la API
const API_CONFIG = {
    BASE_URL: 'https://api.football-data.org/v4',
    API_KEY: '758ee9a309b44430879db8947de24812', // Tu API key
    ENDPOINTS: {
        COMPETITIONS: '/competitions',
        MATCHES: '/matches',
        TEAMS: '/teams'
    },
    // Competiciones populares para filtrado inicial (según documentación)
    POPULAR_COMPETITIONS: [
        {id: 2000, name: 'FIFA World Cup'},
        {id: 2001, name: 'UEFA Champions League'},
        {id: 2002, name: 'Bundesliga'},
        {id: 2003, name: 'Eredivisie'},
        {id: 2013, name: 'Serie A'},
        {id: 2014, name: 'Primera Division'},
        {id: 2015, name: 'Ligue 1'},
        {id: 2016, name: 'Championship'},
        {id: 2017, name: 'Primeira Liga'},
        {id: 2018, name: 'European Championship'},
        {id: 2019, name: 'Serie A'},
        {id: 2021, name: 'Premier League'}
    ]
};

// Elementos del DOM
const elements = {
    competitionSelect: document.getElementById('competitionSelect'),
    dataContainer: document.getElementById('dataContainer'),
    loadingState: document.getElementById('loadingState'),
    errorState: document.getElementById('errorState'),
    errorMessage: document.getElementById('errorMessage')
};

// Funciones de UI
const ui = {
    showLoading() {
        elements.loadingState.classList.remove('hidden');
        elements.errorState.classList.add('hidden');
    },

    hideLoading() {
        elements.loadingState.classList.add('hidden');
    },

    showError(message) {
        elements.errorState.classList.remove('hidden');
        elements.errorMessage.textContent = message;
        this.hideLoading();
    },

    clearDataContainer() {
        elements.dataContainer.innerHTML = '';
    },

    formatDate(dateString) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    },

    renderTeamCard(team) {
        return `
            <div class="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-xl font-bold text-blue-900">${team.name}</h3>
                        ${team.crest ? `
                            <div class="w-16 h-16 rounded-full overflow-hidden shadow-md">
                                <img src="${team.crest}" alt="${team.name}" class="w-full h-full object-contain">
                            </div>
                        ` : ''}
                    </div>
                    <div class="space-y-3">
                        <div class="flex items-center text-gray-600">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Fundado: ${team.founded || 'No disponible'}</span>
                        </div>
                        <div class="flex items-center text-gray-600">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Estadio: ${team.venue || 'No disponible'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderMatchCard(match) {
        const isFinished = match.status === 'FINISHED';
        const date = this.formatDate(match.utcDate);
        
        return `
            <div class="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div class="p-6">
                    <div class="text-sm text-blue-600 mb-4 font-medium">${date}</div>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <span class="font-semibold text-gray-800">${match.homeTeam.name}</span>
                            </div>
                            ${isFinished ? `
                                <span class="text-2xl font-bold text-blue-900">${match.score.fullTime.home}</span>
                            ` : ''}
                        </div>
                        <div class="flex justify-center">
                            <span class="px-4 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                ${isFinished ? 'Finalizado' : 'vs'}
                            </span>
                        </div>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <span class="font-semibold text-gray-800">${match.awayTeam.name}</span>
                            </div>
                            ${isFinished ? `
                                <span class="text-2xl font-bold text-blue-900">${match.score.fullTime.away}</span>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};

// Funciones de la API
async function fetchData(endpoint, params = {}) {
    try {
        const queryString = new URLSearchParams(params).toString();
        
        // Según la documentación, las solicitudes directas deben funcionar con el token correcto
        const url = `${API_CONFIG.BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
        
        // Usando cors-anywhere como alternativa si es necesario
        // const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        // const url = `${proxyUrl}${API_CONFIG.BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
        
        console.log(`Realizando petición a: ${endpoint}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Auth-Token': API_CONFIG.API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            // Manejo específico de errores según la documentación
            if (response.status === 400) {
                throw new Error('Solicitud incorrecta. Revisa los parámetros.');
            } else if (response.status === 403) {
                throw new Error('No tienes permiso para acceder a este recurso. Verifica tu API key.');
            } else if (response.status === 429) {
                throw new Error('Has excedido el límite de peticiones. Espera antes de realizar más solicitudes.');
            } else {
                throw new Error(`Error de red: ${response.status}`);
            }
        }

        return await response.json();
    } catch (error) {
        console.error('Error de API:', error);
        throw error;
    }
}

// Inicializar Aplicación
async function initializeApp() {
    try {
        ui.showLoading();
        
        // Dos opciones para inicializar:
        // 1. Usar la lista predefinida (más rápido y sin consumir cuota)
        // 2. Hacer una llamada a la API (consume cuota pero obtiene datos actualizados)
        
        // Opción 1: Usar competiciones populares predefinidas
        API_CONFIG.POPULAR_COMPETITIONS.forEach(competition => {
            const option = document.createElement('option');
            option.value = competition.id;
            option.textContent = competition.name;
            elements.competitionSelect.appendChild(option);
        });
        
        /* Opción 2: Obtener de la API (descomentar si prefieres esta opción)
        const { competitions } = await fetchData(API_CONFIG.ENDPOINTS.COMPETITIONS);
        competitions.forEach(competition => {
            const option = document.createElement('option');
            option.value = competition.id;
            option.textContent = competition.name;
            elements.competitionSelect.appendChild(option);
        });
        */
        
        // Añadir el mensaje sobre el plan gratuito
        const infoElement = document.createElement('div');
        infoElement.className = 'mt-4 p-4 bg-blue-100 text-blue-800 rounded-md';
        infoElement.innerHTML = `
            <p class="text-sm">
                <strong>Nota:</strong> Esta aplicación utiliza el plan gratuito de football-data.org, 
                que permite 10 llamadas por minuto. Selecciona una competición para ver equipos y partidos.
            </p>
        `;
        document.querySelector('.container').appendChild(infoElement);
        
        ui.hideLoading();
    } catch (error) {
        console.error('Error al inicializar:', error);
        ui.showError('No se pudieron cargar las competiciones. Verifica la consola para más detalles.');
    }
}

// Event Listeners
elements.competitionSelect.addEventListener('change', async (e) => {
    const competitionId = e.target.value;
    if (!competitionId) return;

    try {
        ui.showLoading();
        ui.clearDataContainer();

        // Contador para llamadas a la API
        let apiCallCount = 0;
        const updateApiCallCount = () => {
            apiCallCount++;
            console.log(`Llamadas a la API realizadas: ${apiCallCount}/10 permitidas por minuto`);
        };

        // Obtener equipos
        const teamsData = await fetchData(`${API_CONFIG.ENDPOINTS.COMPETITIONS}/${competitionId}/teams`);
        updateApiCallCount();

        // Renderizar equipos
        if (teamsData.teams && teamsData.teams.length > 0) {
            const teamsSection = document.createElement('div');
            teamsSection.innerHTML = `
                <h2 class="text-2xl font-bold text-blue-900 mb-4">Equipos de ${teamsData.competition.name}</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            `;
            
            teamsData.teams.forEach(team => {
                teamsSection.innerHTML += ui.renderTeamCard(team);
            });
            
            teamsSection.innerHTML += '</div>';
            elements.dataContainer.appendChild(teamsSection);
        }

        // Obtener partidos con filtros según la documentación
        // Limitamos a partidos de la temporada actual y máximo 10 partidos
        const matchesData = await fetchData(`${API_CONFIG.ENDPOINTS.COMPETITIONS}/${competitionId}/matches`, {
            dateFrom: new Date().toISOString().split('T')[0], // Desde hoy
            limit: 10,
            status: 'SCHEDULED' // Solo partidos programados
        });
        updateApiCallCount();

        // Renderizar partidos próximos
        if (matchesData.matches && matchesData.matches.length > 0) {
            const matchesSection = document.createElement('div');
            matchesSection.className = 'mt-10';
            matchesSection.innerHTML = `
                <h2 class="text-2xl font-bold text-blue-900 mb-4">Próximos Partidos</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            `;
            
            // Ordenar partidos por fecha
            const sortedMatches = matchesData.matches.sort((a, b) => 
                new Date(a.utcDate) - new Date(b.utcDate)
            );
            
            sortedMatches.forEach(match => {
                matchesSection.innerHTML += ui.renderMatchCard(match);
            });
            
            matchesSection.innerHTML += '</div>';
            elements.dataContainer.appendChild(matchesSection);
        } else {
            // Si no hay partidos programados, intentamos obtener partidos finalizados recientes
            const recentMatchesData = await fetchData(`${API_CONFIG.ENDPOINTS.COMPETITIONS}/${competitionId}/matches`, {
                status: 'FINISHED',
                limit: 5
            });
            updateApiCallCount();
            
            if (recentMatchesData.matches && recentMatchesData.matches.length > 0) {
                const matchesSection = document.createElement('div');
                matchesSection.className = 'mt-10';
                matchesSection.innerHTML = `
                    <h2 class="text-2xl font-bold text-blue-900 mb-4">Partidos Recientes</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                `;
                
                // Ordenar partidos por fecha (más recientes primero)
                const sortedMatches = recentMatchesData.matches.sort((a, b) => 
                    new Date(b.utcDate) - new Date(a.utcDate)
                );
                
                sortedMatches.forEach(match => {
                    matchesSection.innerHTML += ui.renderMatchCard(match);
                });
                
                matchesSection.innerHTML += '</div>';
                elements.dataContainer.appendChild(matchesSection);
            }
        }

        ui.hideLoading();
    } catch (error) {
        console.error('Error al cargar datos:', error);
        if (error.message.includes('429')) {
            ui.showError('Has excedido el límite de peticiones. Espera un minuto antes de realizar más solicitudes.');
        } else {
            ui.showError('No se pudieron cargar los datos de la competición. Verifica la consola para más detalles.');
        }
    }
});

// Función para comprobar la configuración de CORS
async function testCorsConfiguration() {
    try {
        console.log('Comprobando configuración CORS...');
        
        // Intentamos una petición simple para ver si funciona directamente sin proxy
        const response = await fetch(`${API_CONFIG.BASE_URL}/competitions/2021`, {
            method: 'GET',
            headers: {
                'X-Auth-Token': API_CONFIG.API_KEY
            }
        });
        
        if (response.ok) {
            console.log('✅ Conexión directa a la API funciona correctamente.');
            return true;
        } else {
            console.log(`❌ Error en conexión directa: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error('Error al comprobar CORS:', error);
        
        // Si hay error de CORS, mostramos instrucciones para usar una extensión
        const corsHelp = document.createElement('div');
        corsHelp.className = 'mt-4 p-4 bg-red-100 text-red-800 rounded-md';
        corsHelp.innerHTML = `
            <h3 class="font-bold">Problema de CORS detectado</h3>
            <p class="mt-2">Para resolver este problema, tienes estas opciones:</p>
            <ol class="list-decimal list-inside mt-2">
                <li>Instala una extensión como "Allow CORS" para Chrome/Firefox</li>
                <li>Usa la aplicación desde un servidor local con Node.js</li>
                <li>Implementa un proxy del lado del servidor</li>
            </ol>
        `;
        document.querySelector('.container').appendChild(corsHelp);
        
        return false;
    }
}

// Iniciar la aplicación
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando aplicación de fútbol...');
    
    // Añadir mensaje de carga inicial
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'text-center text-blue-600 my-4';
    loadingMessage.textContent = 'Comprobando conexión a la API...';
    document.querySelector('.container').appendChild(loadingMessage);
    
    // Comprobar si tenemos problemas de CORS
    const corsWorks = await testCorsConfiguration();
    
    // Eliminar mensaje de carga
    loadingMessage.remove();
    
    // Si la conexión directa funciona o tenemos un proxy, inicializar
    initializeApp();
});