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

    let currentKey = null;
    for (const el of dict.children) {
        if (el.tagName === 'key') {
            currentKey = el.textContent;
        } else if (el.tagName === 'dict' && currentKey) {
            let rectStr = '';
            let rotated = false;
            for (let i = 0; i < el.children.length; i++) {
                if (el.children[i].textContent === 'textureRect') {
                    rectStr = el.children[i + 1].textContent;
                }
                if (el.children[i].textContent === 'textureRotated') {
                    rotated = el.children[i + 1].tagName === 'true';
                }
            }
            const nums = rectStr.match(/\d+/g).map(Number);
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

// Inicializa y precarga las 3 texturas y sus coordenadas
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

// Devuelve un <img> recortado listo para insertarse en el DOM
export function getSpriteImage(keyOrRole, targetSize = 24, cssClass = 'badge-img') {
    const imgEl = document.createElement('img');
    imgEl.className = cssClass;
    imgEl.alt = keyOrRole;

    const mapping = SPRITE_MAPPINGS[keyOrRole];
    if (!mapping) {
        if (fallbackBadges[keyOrRole]) imgEl.src = fallbackBadges[keyOrRole];
        return imgEl;
    }

    const cacheKey = `${mapping.sheet}_${mapping.sprite}_${targetSize}`;
    if (cache.renderedIcons[cacheKey]) {
        imgEl.src = cache.renderedIcons[cacheKey];
        return imgEl;
    }

    const frame = cache.sheets[mapping.sheet]?.[mapping.sprite];
    const sourceImage = cache.images[mapping.sheet];

    if (!frame || !sourceImage) {
        if (fallbackBadges[keyOrRole]) imgEl.src = fallbackBadges[keyOrRole];
        return imgEl;
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');

    const scale = targetSize / Math.max(frame.w, frame.h);
    const dw = frame.w * scale;
    const dh = frame.h * scale;
    const dx = (targetSize - dw) / 2;
    const dy = (targetSize - dh) / 2;

    ctx.drawImage(sourceImage, frame.x, frame.y, frame.w, frame.h, dx, dy, dw, dh);

    const dataUrl = canvas.toDataURL('image/png');
    cache.renderedIcons[cacheKey] = dataUrl;
    imgEl.src = dataUrl;

    return imgEl;
}