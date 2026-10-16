// 1. DATOS DE LAS CANCIONES
// =========================================
let playlistData = []; // La iniciamos vacía, la llenaremos con el JSON

// 2. REFERENCIAS AL HTML (DOM)
// =========================================
const playlistContainer = document.getElementById('playlist');
const songCountElement = document.getElementById('song-count');

// Elementos de la tarjeta "Sonando Ahora" (Derecha)
const currentImg = document.getElementById('current-img');
const currentTitle = document.getElementById('current-title');
const currentArtist = document.getElementById('current-artist');

// Elementos de la barra de reproducción (Abajo)
const playerThumb = document.getElementById('player-thumb');
const playerTitle = document.getElementById('player-title');
const playerArtist = document.getElementById('player-artist');
const btnPlayPause = document.getElementById('btn-play-pause');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const progressBar = document.getElementById('progress-bar');
const timeCurrent = document.getElementById('time-current');
const timeTotal = document.getElementById('time-total');
const volumeBar = document.getElementById('volume-bar');

// Variables de estado del reproductor
let currentSound = null; // Aquí guardaremos la instancia de Howler
let currentIndex = 0;    // Para saber qué número de canción está sonando
let isDragging = false;  // Nos dirá si el usuario está tocando la barra
let progressLoop; // Nos servirá para controlar el motor visual

// 3. FUNCIONES DE INTERFAZ
// =========================================

// Función para reproducir una canción por su índice (posición en el array)
function playSong(index) {
    if (currentSound) {
        currentSound.stop();
    }

    currentIndex = index;
    const song = playlistData[index];
    // ==========================================
    // Buscamos todos los elementos <li> de la playlist
    const todosLosItems = document.querySelectorAll('.playlist-item');
    
    // Recorremos todos y les quitamos la clase 'active'
    todosLosItems.forEach(item => item.classList.remove('active'));
    
    // Se la añadimos ÚNICAMENTE al ítem que coincide con nuestro índice
    if (todosLosItems[index]) {
        todosLosItems[index].classList.add('active');
    }
    // ==========================================


    currentSound = new Howl({
        src: [song.audio], 
        html5: false, 
        volume: parseFloat(volumeBar.value), // Coge el volumen actual de la barrita
        
        // EVENTOS DE HOWLER:
        onplay: function() {
            // Cuando arranca la música, pintamos la duración total
            timeTotal.textContent = formatTime(currentSound.duration());
            // Y arrancamos el motor que mueve la barra
            requestAnimationFrame(updateProgress);
        },
        onend: function() {
            // ¡Cuando termina la canción, simula un clic en "Siguiente"!
            btnNext.click(); 
        }
    });

    currentSound.play();
    iniciarEcualizador(); // Arrancamos el ecualizador si no estaba activo

    // Actualizamos visuales
    currentImg.src = song.cover;
    currentTitle.textContent = song.title;
    currentArtist.textContent = song.artist;
    playerThumb.src = song.cover;
    playerTitle.textContent = song.title;
    playerArtist.textContent = song.artist;
    btnPlayPause.textContent = '⏸';
}

function renderPlaylist() {
    playlistContainer.innerHTML = '';
    songCountElement.textContent = `${playlistData.length} canciones`;

    playlistData.forEach((song) => {
        const li = document.createElement('li');
        li.className = 'playlist-item';
        
        li.innerHTML = `
            <img src="${song.cover}" alt="Carátula de ${song.title}" class="song-thumb">
            <div class="song-info">
                <h3>${song.title}</h3>
                <p>${song.artist}</p>
            </div>
        `;

        li.addEventListener('click', () => {
            playSong(song.id); 
        });

        playlistContainer.appendChild(li);
    });
}

// Convierte los segundos en formato Minutos:Segundos
function formatTime(secs) {
    const minutes = Math.floor(secs / 60) || 0;
    const seconds = Math.floor(secs - minutes * 60) || 0;
    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

// Función que se ejecuta constantemente para mover la barra
function updateProgress() {
    cancelAnimationFrame(progressLoop);
    // Comprobamos si hay alguna canción en el reproductor (suene o no)
    if (currentSound) {
        if (currentSound.playing() && !isDragging) {
            const seek = currentSound.seek();
            if (typeof seek === 'number') {
                timeCurrent.textContent = formatTime(seek);
                progressBar.value = (seek / currentSound.duration()) * 100 || 0;
            }
        }
        
        // Volvemos a arrancar el bucle SIEMPRE. Lo sacamos fuera del "if(playing)".
        progressLoop = requestAnimationFrame(updateProgress); 
    }
}

// =========================================
// 4. INICIALIZAR LA APLICACIÓN (ASÍNCRONO)
// =========================================

function cargarPrimeraCancion() {
    const primeraCancion = playlistData[0]; 

    currentImg.src = primeraCancion.cover;
    currentTitle.textContent = primeraCancion.title;
    currentArtist.textContent = primeraCancion.artist;

    playerThumb.src = primeraCancion.cover;
    playerTitle.textContent = primeraCancion.title;
    playerArtist.textContent = primeraCancion.artist;
    document.querySelectorAll('.playlist-item')[0].classList.add('active');
}

// Función asíncrona para conectarse al JSON
async function iniciarReproductor() {
    try {
        const respuesta = await fetch('playlist.json');
        playlistData = await respuesta.json();
        renderPlaylist();
        cargarPrimeraCancion();
    } catch (error) {
        console.error("Error al cargar la lista de reproducción:", error);
        alert("Ocurrió un error al cargar las canciones. Asegúrate de estar usando un servidor local (Live Server).");
    }
}

// Arrancamos el motor
iniciarReproductor();

// 5. EVENTOS DE LOS CONTROLES
// =========================================

// Evento para el botón de Play/Pause
btnPlayPause.addEventListener('click', () => {
    if (currentSound) {
        if (currentSound.playing()) {
            currentSound.pause(); // La pausamos
            btnPlayPause.textContent = '▶'; // Cambiamos el icono a Play
        } 
        else {
            currentSound.play(); // La reanudamos
            btnPlayPause.textContent = '⏸'; // Cambiamos el icono a Pausa
        }
    } else {
        /*Si no hay ninguna canción cargada y le damos a play, 
        reproducimos la primera de la lista por defecto.*/
        playSong(0);
    }
});

// Evento para el botón de Siguiente (⏭)
btnNext.addEventListener('click', () => {
    let nextIndex = currentIndex + 1;
    if (nextIndex >= playlistData.length) {
        nextIndex = 0;
    }
    playSong(nextIndex);
});

// Evento para el botón de Anterior (⏮)
btnPrev.addEventListener('click', () => {
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
        prevIndex = playlistData.length - 1;
    }
    playSong(prevIndex);
});

// Evento para arrastrar la barra de progreso
// Cuando hacemos clic o tocamos la barra, empezamos a arrastrar
progressBar.addEventListener('mousedown', () => isDragging = true);
progressBar.addEventListener('touchstart', () => isDragging = true);

// Mientras arrastramos (sin soltar el clic)
progressBar.addEventListener('input', (e) => {
    if (currentSound) {
        // Solo calculamos el tiempo y actualizamos el texto para dar feedback visual instantáneo
        const seekTo = currentSound.duration() * (e.target.value / 100);
        timeCurrent.textContent = formatTime(seekTo);
    }
});

// Cuando soltamos el clic (el 'change' salta al soltar)
progressBar.addEventListener('change', (e) => {
    if (currentSound) {
        // Ahora sí, le decimos a Howler que mueva la canción a ese segundo exacto
        const seekTo = currentSound.duration() * (e.target.value / 100);
        currentSound.seek(seekTo);
    }
    isDragging = false; // Ya hemos terminado de arrastrar
});

// Evento para cambiar el volumen
volumeBar.addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value);
    Howler.volume(vol); // Howler cambia el volumen global (de 0.0 a 1.0)
});

// =========================================
// 6. ECUALIZADOR Y VISUALIZADOR (Web Audio API)
// =========================================

const eqBass = document.getElementById('eq-bass');
const eqMid = document.getElementById('eq-mid');
const eqTreble = document.getElementById('eq-treble');
const btnResetEq = document.getElementById('reset-eq');
const visualizerContainer = document.getElementById('visualizer');

eqBass.min = -40; eqBass.max = 40;
eqMid.min = -40; eqMid.max = 40;
eqTreble.min = -40; eqTreble.max = 40;

// Variables de Audio
let bassFilter, midFilter, trebleFilter;
let analyser, dataArray;
let eqInicializado = false;

// Variables Visuales
const NUM_BARS = 30; // Número de barras que tendrá el visualizador
const visualizerBars = []; // Aquí guardaremos las barras HTML

// GENERAR LAS BARRAS HTML UNA SOLA VEZ
for(let i = 0; i < NUM_BARS; i++) {
    const bar = document.createElement('div');
    bar.className = 'bar';
    visualizerContainer.appendChild(bar);
    visualizerBars.push(bar); // Guardamos la referencia para animarlas luego
}

// INICIAR EL ECUALIZADOR Y EL ANALIZADOR
function iniciarEcualizador() {
    if (eqInicializado || !Howler.ctx) return;

    // Creamos los Filtros del Ecualizador
    bassFilter = Howler.ctx.createBiquadFilter();
    bassFilter.type = 'lowshelf'; 
    bassFilter.frequency.value = 200; 

    midFilter = Howler.ctx.createBiquadFilter();
    midFilter.type = 'peaking'; 
    midFilter.frequency.value = 1000; 
    midFilter.Q.value = 1; 

    trebleFilter = Howler.ctx.createBiquadFilter();
    trebleFilter.type = 'highshelf'; 
    trebleFilter.frequency.value = 3000; 

    analyser = Howler.ctx.createAnalyser();
    analyser.fftSize = 128; // Resolución del análisis (nos dará 64 barras de datos)
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    Howler.masterGain.disconnect();

    Howler.masterGain.connect(bassFilter);
    bassFilter.connect(midFilter);
    midFilter.connect(trebleFilter);
    trebleFilter.connect(analyser);
    analyser.connect(Howler.ctx.destination);

    eqInicializado = true;
    
    // Arrancamos el motor de la animación visual
    requestAnimationFrame(animateVisualizer);
}

// 2. EL MOTOR DE LA ANIMACIÓN VISUAL
function animateVisualizer() {
    if (currentSound && currentSound.playing() && eqInicializado) {
        analyser.getByteFrequencyData(dataArray);

        for (let i = 0; i < NUM_BARS; i++) {
            // Quitamos la caída suave para que bailen rápido con la música
            visualizerBars[i].classList.remove('smooth-drop'); 
            
            const barHeight = (dataArray[i] / 255) * 100;
            visualizerBars[i].style.height = Math.max(barHeight, 5) + '%';
        }
    } 
    else if (eqInicializado) {
        for (let i = 0; i < NUM_BARS; i++) {
            // Añadimos la clase para que caigan lentamente
            visualizerBars[i].classList.add('smooth-drop');
            visualizerBars[i].style.height = '5%';
        }
    }
    
    requestAnimationFrame(animateVisualizer);
}

// 3. EVENTOS DE LAS BARRAS DEL ECUALIZADOR
eqBass.addEventListener('input', (e) => {
    if (eqInicializado) bassFilter.gain.value = parseFloat(e.target.value);
});
eqMid.addEventListener('input', (e) => {
    if (eqInicializado) midFilter.gain.value = parseFloat(e.target.value);
});
eqTreble.addEventListener('input', (e) => {
    if (eqInicializado) trebleFilter.gain.value = parseFloat(e.target.value);
});

// 4. BOTÓN DE RESTABLECER
btnResetEq.addEventListener('click', () => {
    eqBass.value = 0; eqMid.value = 0; eqTreble.value = 0;
    if (eqInicializado) {
        bassFilter.gain.value = 0;
        midFilter.gain.value = 0;
        trebleFilter.gain.value = 0;
    }
});