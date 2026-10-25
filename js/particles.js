// js/particles.js - Motor ligero de partículas estilo fondo Geometry Dash

class ParticleEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.maxParticles = 35; // Cantidad moderada para excelente fluidez (60/120 fps)
        this.isRunning = false;
        this.animationFrameId = null;
    }

    init() {
        // 1. Crear canvas de fondo dinámicamente si no existe
        if (!document.getElementById('gd-particle-canvas')) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'gd-particle-canvas';
            this.canvas.style.position = 'fixed';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100vw';
            this.canvas.style.height = '100vh';
            this.canvas.style.pointerEvents = 'none'; // No bloquea clics
            this.canvas.style.zIndex = '0';           // Detrás del contenido
            this.canvas.style.opacity = '0.45';      // Brillo tenue y elegante
            document.body.prepend(this.canvas);
        } else {
            this.canvas = document.getElementById('gd-particle-canvas');
        }

        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // 2. Comprobar preferencia guardada en localStorage
        const savedPref = localStorage.getItem('gd_particles_enabled');
        if (savedPref === 'false') {
            this.toggle(false);
            return;
        }

        // 3. Inicializar partículas
        this.particles = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(this.createParticle(true));
        }

        this.start();
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticle(randomY = false) {
        const size = Math.random() * 8 + 4; // Entre 4px y 12px
        return {
            x: Math.random() * (this.canvas ? this.canvas.width : window.innerWidth),
            y: randomY ? Math.random() * (this.canvas ? this.canvas.height : window.innerHeight) : (this.canvas ? this.canvas.height + 20 : window.innerHeight + 20),
            size: size,
            speedY: Math.random() * 0.7 + 0.3, // Ascenso suave
            speedX: (Math.random() - 0.5) * 0.3, // Leve deriva horizontal
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.02,
            alpha: Math.random() * 0.5 + 0.2 // Transparencia tenue
        };
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        const loop = () => {
            if (!this.isRunning) return;
            this.render();
            this.animationFrameId = requestAnimationFrame(loop);
        };
        this.animationFrameId = requestAnimationFrame(loop);
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    toggle(enable) {
        if (enable) {
            if (this.canvas) this.canvas.style.display = 'block';
            if (this.particles.length === 0) {
                for (let i = 0; i < this.maxParticles; i++) {
                    this.particles.push(this.createParticle(true));
                }
            }
            this.start();
            localStorage.setItem('gd_particles_enabled', 'true');
        } else {
            this.stop();
            if (this.canvas) {
                this.canvas.style.display = 'none';
                this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
            localStorage.setItem('gd_particles_enabled', 'false');
        }
    }

    render() {
        const { ctx, canvas } = this;
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Detectar si el tema claro está activo para adecuar el color de partícula
        const isLight = document.body.classList.contains('theme-light');
        const fillColor = isLight ? 'rgba(71, 85, 105, ' : 'rgba(255, 255, 255, ';

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            p.y -= p.speedY;
            p.x += p.speedX;
            p.rotation += p.rotSpeed;

            // Dibujar partícula cuadrada/rombo con rotación
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = `${fillColor}${p.alpha})`;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();

            // Si sale por arriba o los costados, reaparece abajo
            if (p.y < -30 || p.x < -30 || p.x > canvas.width + 30) {
                this.particles[i] = this.createParticle(false);
            }
        }
    }
}

export const particleEngine = new ParticleEngine();