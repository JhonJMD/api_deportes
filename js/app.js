// Configuración de la API
const API_CONFIG = {
    BASE_URL: 'https://api.football-data.org/v4',
    API_KEY: '1234567890abcdef1234567890abcdef', // Reemplazar con tu API key real
    ENDPOINTS: {
        COMPETITIONS: '/competitions',
        MATCHES: '/matches',
        TEAMS: '/teams'
    }
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
        const url = `${API_CONFIG.BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetch(url, {
            headers: {
                'X-Auth-Token': API_CONFIG.API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`Error de red: ${response.status}`);
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
        const { competitions } = await fetchData(API_CONFIG.ENDPOINTS.COMPETITIONS);
        
        // Poblar el selector de competiciones
        competitions.forEach(competition => {
            const option = document.createElement('option');
            option.value = competition.id;
            option.textContent = competition.name;
            elements.competitionSelect.appendChild(option);
        });
        
        ui.hideLoading();
    } catch (error) {
        ui.showError('No se pudieron cargar las competiciones');
    }
}

// Event Listeners
elements.competitionSelect.addEventListener('change', async (e) => {
    const competitionId = e.target.value;
    if (!competitionId) return;

    try {
        ui.showLoading();
        ui.clearDataContainer();

        // Obtener equipos y partidos
        const [teamsData, matchesData] = await Promise.all([
            fetchData(`${API_CONFIG.ENDPOINTS.COMPETITIONS}/${competitionId}/teams`),
            fetchData(`${API_CONFIG.ENDPOINTS.COMPETITIONS}/${competitionId}/matches`)
        ]);

        // Renderizar equipos
        teamsData.teams.forEach(team => {
            elements.dataContainer.innerHTML += ui.renderTeamCard(team);
        });

        // Renderizar partidos recientes (últimos 5)
        matchesData.matches.slice(0, 5).forEach(match => {
            elements.dataContainer.innerHTML += ui.renderMatchCard(match);
        });

        ui.hideLoading();
    } catch (error) {
        ui.showError('No se pudieron cargar los datos de la competición');
    }
});

// Iniciar la aplicación
initializeApp();