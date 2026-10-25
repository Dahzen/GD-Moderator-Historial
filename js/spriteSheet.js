// js/spriteSheet.js
import { SPRITESHEETS, SPRITE_MAPPINGS, fallbackBadges } from './config.js';

const cache = {
    sheets: {},
    images: {},
    renderedIcons: {}
};

// Parsea el XML .plist de TexturePacker
async function parsePlist(url) {
    const res = await fetch(url);
    const text = await res.text();
    const xml = new DOMParser().parseFromString(text, 'text/xml');
    const dict = xml.querySelector('dict > dict');
    const frames = {};

    if (!dict) return frames;

    let currentKey = null;
    for (const el of dict.children) {
        if (el.tagName === 'key') {
            currentKey = el.textContent.trim();
        } else if (el.tagName === 'dict' && currentKey) {
            let rectStr = '';
            let rotated = false;
            for (let i = 0; i < el.children.length; i++) {
                if (el.children[i].textContent === 'textureRect') {
                    rectStr = el.children[i + 1]?.textContent || '';
                }
                if (el.children[i].textContent === 'textureRotated') {
                    rotated = el.children[i + 1]?.tagName === 'true';
                }
            }
            const nums = rectStr.match(/\d+/g)?.map(Number);
            if (nums && nums.length === 4) {
                frames[currentKey] = {
                    x: nums[0],
                    y: nums[1],
                    w: rotated ? nums[3] : nums[2],
                    h: rotated ? nums[2] : nums[3],
                    rotated
                };
            }
        }
    }
    return frames;
}

// Inicializa y precarga las texturas y sus coordenadas
export async function initSpriteSheets() {
    for (const [key, config] of Object.entries(SPRITESHEETS)) {
        try {
            const frames = await parsePlist(config.plist);
            const img = new Image();
            img.src = config.image;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${config.image}`));
            });
            cache.sheets[key] = frames;
            cache.images[key] = img;
        } catch (err) {
            console.error(`Error cargando hoja [${key}]:`, err);
        }
    }
}

// Función auxiliar: busca un frame en cualquiera de las hojas cargadas
function findFrameInSheets(spriteName) {
    // Variantes de nombres comunes en los .plist de Geometry Dash
    const variants = [
        spriteName,
        spriteName.replace(/\.png$/i, ''),
        spriteName + '.png',
        spriteName.replace(/\.png$/i, '') + '-uhd.png',
        spriteName.replace(/\.png$/i, '') + '-hd.png'
    ];

    for (const [sheetKey, frames] of Object.entries(cache.sheets)) {
        for (const variant of variants) {
            if (frames[variant]) {
                return {
                    sheet: sheetKey,
                    sprite: variant,
                    frame: frames[variant]
                };
            }
        }
    }
    return null;
}

// Devuelve un <img> recortado listo para insertarse en el DOM
export function getSpriteImage(keyOrRole, targetSize = 24, cssClass = 'badge-img') {
    const imgEl = document.createElement('img');
    imgEl.className = cssClass;
    imgEl.alt = keyOrRole;

    // 1. Verificar si existe mapeo explícito en SPRITE_MAPPINGS
    let targetSheet = null;
    let targetSprite = null;
    let frame = null;

    if (SPRITE_MAPPINGS && SPRITE_MAPPINGS[keyOrRole]) {
        const mapping = SPRITE_MAPPINGS[keyOrRole];
        targetSheet = mapping.sheet;
        targetSprite = mapping.sprite;
        frame = cache.sheets[targetSheet]?.[targetSprite];
    }

    // 2. Si no hubo mapeo o frame, buscar directamente en todas las hojas cargadas
    if (!frame) {
        const match = findFrameInSheets(keyOrRole);
        if (match) {
            targetSheet = match.sheet;
            targetSprite = match.sprite;
            frame = match.frame;
        }
    }

    const sourceImage = targetSheet ? cache.images[targetSheet] : null;

    // 3. Si no existe en las hojas de sprites, evaluar fallback o devolver null limpio
    if (!frame || !sourceImage) {
        if (fallbackBadges && fallbackBadges[keyOrRole]) {
            imgEl.src = fallbackBadges[keyOrRole];
            return imgEl;
        }
        return null;
    }

    // DPR forzado al menos a 2 para garantizar super-muestreo nítido de texturas UHD
    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    const cacheKey = `${targetSheet}_${targetSprite}_${targetSize}_x${dpr}`;
    if (cache.renderedIcons[cacheKey]) {
        imgEl.src = cache.renderedIcons[cacheKey];
        return imgEl;
    }

    // Lienzo interno en alta resolución física
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(targetSize * dpr);
    canvas.height = Math.round(targetSize * dpr);

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.scale(dpr, dpr);

    const origW = frame.rotated ? frame.h : frame.w;
    const origH = frame.rotated ? frame.w : frame.h;

    const scale = targetSize / Math.max(origW, origH);
    const dw = origW * scale;
    const dh = origH * scale;
    const dx = (targetSize - dw) / 2;
    const dy = (targetSize - dh) / 2;

    ctx.save();
    if (frame.rotated) {
        ctx.translate(targetSize / 2, targetSize / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.drawImage(
            sourceImage,
            frame.x, frame.y, frame.h, frame.w,
            -dh / 2, -dw / 2, dh, dw
        );
    } else {
        ctx.drawImage(
            sourceImage,
            frame.x, frame.y, frame.w, frame.h,
            dx, dy, dw, dh
        );
    }
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/png');
    cache.renderedIcons[cacheKey] = dataUrl;
    imgEl.src = dataUrl;

    return imgEl;
}
