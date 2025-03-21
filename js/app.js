// Configuración de la API
const API_CONFIG = {
    BASE_URL: 'https://api.football-data.org/v4/',
    API_KEY: '758ee9a309b44430879db8947de24812', // Reemplaza con tu API key
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

// Configuración de CORS Proxy para entorno local
const CORS_PROXY = {
    enabled: true, // Cambia a false si usas una extensión CORS
    url: 'https://corsproxy.io/?'
    // Alternativas:
    // url: 'https://api.allorigins.win/raw?url='
    // url: 'https://cors-anywhere.herokuapp.com/'
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
                                <span class="text-2xl font-bold text-blue-900">${match.score.fullTime.home !== null ? match.score.fullTime.home : '-'}</span>
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
                                <span class="text-2xl font-bold text-blue-900">${match.score.fullTime.away !== null ? match.score.fullTime.away : '-'}</span>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderStatsCard(stat, title, description) {
        return `
            <div class="bg-white rounded-xl shadow-md p-6">
                <h3 class="text-gray-500 text-sm font-medium">${title}</h3>
                <p class="mt-2 text-3xl font-bold text-blue-900">${stat}</p>
                <p class="mt-1 text-gray-600 text-sm">${description}</p>
            </div>
        `;
    }
};

// Función para consumir la API
async function fetchData(endpoint, params = {}) {
    try {
        const queryString = new URLSearchParams(params).toString();
        let url = `${API_CONFIG.BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
        
        // Agregar proxy CORS si está habilitado
        if (CORS_PROXY.enabled) {
            url = `${CORS_PROXY.url}${encodeURIComponent(url)}`;
        }
        
        console.log(`Realizando petición a: ${endpoint}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Auth-Token': API_CONFIG.API_KEY
            }
        });

        if (!response.ok) {
            // Manejo específico de errores según la documentación
            if (response.status === 400) {
                throw new Error('Solicitud incorrecta. Revisa los parámetros.');
            } else if (response.status === 403) {
                throw new Error('No tienes permiso para acceder a este recurso. Verifica tu API key.');
            } else if (response.status === 429) {
                throw new Error('Has excedido el límite de peticiones (10/min). Espera antes de realizar más solicitudes.');
            } else {
                throw new Error(`Error de red: ${response.status}`);
            }
        }

        const data = await response.json();
        
        // Monitoreo de límites de API (solo si no usamos proxy)
        if (!CORS_PROXY.enabled && response.headers) {
            const requestsLeft = response.headers.get('X-Requests-Available-Minute');
            if (requestsLeft) {
                console.log(`Peticiones restantes: ${requestsLeft}/minuto`);
            }
        }
        
        return data;
    } catch (error) {
        console.error('Error de API:', error);
        throw error;
    }
}

// Inicializar Aplicación
async function initializeApp() {
    try {
        ui.showLoading();
        
        // Cargar competiciones desde datos predefinidos
        API_CONFIG.POPULAR_COMPETITIONS.forEach(competition => {
            const option = document.createElement('option');
            option.value = competition.id;
            option.textContent = competition.name;
            elements.competitionSelect.appendChild(option);
        });
        
        // Añadir el mensaje sobre el plan gratuito y CORS
        const infoElement = document.createElement('div');
        infoElement.className = 'mt-8 p-4 bg-blue-100 text-blue-800 rounded-xl shadow-sm max-w-3xl mx-auto';
        infoElement.innerHTML = `
            <div class="flex items-start">
                <svg class="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                    <p class="font-medium mb-1">Información de la API</p>
                    <p class="text-sm mb-2">
                        Esta aplicación utiliza el plan gratuito de football-data.org, que permite 10 llamadas por minuto.
                    </p>
                    <p class="text-sm">
                        ${CORS_PROXY.enabled ? 
                            'Usando proxy CORS para desarrollo local.' : 
                            'Conexión directa a la API. Necesitarás una extensión que permita CORS.'}
                    </p>
                </div>
            </div>
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

        // Obtener detalles de la competición
        const competitionData = await fetchData(`competitions/${competitionId}`);
        updateApiCallCount();
        
        // Mostrar encabezado de la competición
        const competitionHeader = document.createElement('div');
        competitionHeader.className = 'mb-8 text-center bg-white p-6 rounded-xl shadow-md max-w-3xl mx-auto';
        competitionHeader.innerHTML = `
            <h2 class="text-2xl font-bold text-blue-900 mb-2">${competitionData.name}</h2>
            <div class="text-gray-600">
                <span class="mr-4">Temporada: ${competitionData.currentSeason ? competitionData.currentSeason.startDate.split('-')[0] + '/' + competitionData.currentSeason.endDate.split('-')[0] : 'No disponible'}</span>
                <span>Área: ${competitionData.area.name}</span>
            </div>
        `;
        elements.dataContainer.appendChild(competitionHeader);

        // Obtener equipos
        const teamsData = await fetchData(`competitions/${competitionId}/teams`);
        updateApiCallCount();

        // Renderizar estadísticas
        if (teamsData.teams && teamsData.teams.length > 0) {
            const statsSection = document.createElement('div');
            statsSection.className = 'grid grid-cols-1 md:grid-cols-3 gap-6 mb-8';
            
            statsSection.innerHTML = 
                ui.renderStatsCard(teamsData.teams.length, 'Equipos', 'Total de equipos en la competición') +
                ui.renderStatsCard(teamsData.competition.numberOfAvailableSeasons, 'Temporadas', 'Historial disponible') +
                ui.renderStatsCard(teamsData.season ? teamsData.season.currentMatchday || 'N/A' : 'N/A', 'Jornada Actual', 'Estado de la competición');
            
            elements.dataContainer.appendChild(statsSection);
        }

        // Renderizar equipos
        if (teamsData.teams && teamsData.teams.length > 0) {
            const teamsSection = document.createElement('div');
            teamsSection.className = 'mb-12';
            teamsSection.innerHTML = `
                <h2 class="text-2xl font-bold text-blue-900 mb-6 pl-2 border-l-4 border-blue-500">Equipos de ${teamsData.competition.name}</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            `;
            
            teamsData.teams.forEach(team => {
                teamsSection.innerHTML += ui.renderTeamCard(team);
            });
            
            teamsSection.innerHTML += '</div>';
            elements.dataContainer.appendChild(teamsSection);
        }

        // Obtener partidos próximos (máximo 10, según límites API)
        const matchesData = await fetchData(`competitions/${competitionId}/matches`, {
            dateFrom: new Date().toISOString().split('T')[0], // Desde hoy
            limit: 10,
            status: 'SCHEDULED' // Solo partidos programados
        });
        updateApiCallCount();

        // Renderizar partidos próximos
        if (matchesData.matches && matchesData.matches.length > 0) {
            const matchesSection = document.createElement('div');
            matchesSection.className = 'mb-12';
            matchesSection.innerHTML = `
                <h2 class="text-2xl font-bold text-blue-900 mb-6 pl-2 border-l-4 border-blue-500">Próximos Partidos</h2>
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
            const recentMatchesData = await fetchData(`competitions/${competitionId}/matches`, {
                status: 'FINISHED',
                limit: 10 // Limitamos a 10 para no exceder API
            });
            updateApiCallCount();
            
            if (recentMatchesData.matches && recentMatchesData.matches.length > 0) {
                const matchesSection = document.createElement('div');
                matchesSection.className = 'mb-12';
                matchesSection.innerHTML = `
                    <h2 class="text-2xl font-bold text-blue-900 mb-6 pl-2 border-l-4 border-blue-500">Partidos Recientes</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                `;
                
                // Ordenar partidos por fecha (más recientes primero)
                const sortedMatches = recentMatchesData.matches.sort((a, b) => 
                    new Date(b.utcDate) - new Date(a.utcDate)
                );
                
                sortedMatches.slice(0, 9).forEach(match => {
                    matchesSection.innerHTML += ui.renderMatchCard(match);
                });
                
                matchesSection.innerHTML += '</div>';
                elements.dataContainer.appendChild(matchesSection);
            }
        }

        // Añadir pie de página con información de API
        const footerSection = document.createElement('div');
        footerSection.className = 'mt-12 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm';
        footerSection.innerHTML = `
            <p>Datos proporcionados por football-data.org</p>
            <p class="mt-1">Límite de API: 10 llamadas/minuto (Plan gratuito)</p>
            <p class="mt-1">Llamadas realizadas en esta consulta: ${apiCallCount}</p>
        `;
        elements.dataContainer.appendChild(footerSection);

        ui.hideLoading();
    } catch (error) {
        console.error('Error al cargar datos:', error);
        if (error.message.includes('429')) {
            ui.showError('Has excedido el límite de peticiones. Espera un minuto antes de realizar más solicitudes.');
        } else if (CORS_PROXY.enabled && error.message.includes('network')) {
            ui.showError('Error de red. Es posible que el proxy CORS no esté funcionando. Intenta con otro proxy o una extensión CORS.');
        } else {
            ui.showError(`Error: ${error.message}`);
        }
    }
});

// Iniciar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando aplicación de fútbol...');
    initializeApp();
});
