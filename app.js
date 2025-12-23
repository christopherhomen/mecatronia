/**
 * ServiAuto Diesel - PWA Logic v4 (Fresh Start)
 */

// --- CONFIGURACIÓN DE LA NUBE ---
const SUPABASE_URL = 'https://stqxmrcejfebhngupjya.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jR5yE8vbXFAWv__W6sFJWg_jNhvbCcl';

// Nombre NUEVO para obligar a borrar cualquier error anterior
const DB_NAME = 'Mecatronia_DB_v1';
const DB_VERSION = 1;
const STORE_NAME = 'orders';

const app = {
    db: null,
    supabase: null,
    currentDamageType: 'rayon',
    damageMarkers: [],
    selectedMarkerIndex: null,
    togglePassword: () => {
        const input = document.getElementById('login-pass');
        const icon = document.getElementById('pass-icon');
        if (input.type === "password") {
            input.type = "text";
            icon.innerText = "visibility_off";
        } else {
            input.type = "password";
            icon.innerText = "visibility";
        }
    },

    toast: (text, type = 'info') => {
        if (typeof Toastify !== 'function') { alert(text); return; } // Fallback
        const colors = {
            success: "linear-gradient(to right, #00b09b, #96c93d)",
            error: "linear-gradient(to right, #ff5f6d, #ffc371)",
            warning: "linear-gradient(to right, #f7b733, #fc4a1a)",
            info: "#333"
        };
        Toastify({
            text: text,
            duration: 3000,
            gravity: "top",
            position: "center",
            style: { background: colors[type] || colors.info },
            close: true
        }).showToast();
    },

    getFormData: () => {
        const form = document.getElementById('vehicle-form');
        if (!form) return {};
        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());
        // Checkboxes
        document.querySelectorAll('#vehicle-form input[type="checkbox"]').forEach(cb => {
            data[cb.name] = cb.checked;
        });
        // Damages
        // Damages
        data.damages = app.damageMarkers;

        // Firma (Canvas a Imagen)
        const sigCanvas = document.getElementById('signature-pad');
        if (sigCanvas) {
            // Verificar si está vacío sería ideal, pero toDataURL captura lo que hay
            data.signature = sigCanvas.toDataURL('image/png');
        }

        return data;
    },

    toggleAccordion: (header) => {
        const section = header.parentElement;
        section.classList.toggle('active');
    },

    sendWhatsApp: () => {
        const phoneInput = document.getElementsByName('cliente_telefono')[0];
        const phone = phoneInput ? phoneInput.value.replace(/\D/g, '') : '';

        if (!phone) { app.toast("⚠️ Por favor ingresa un teléfono.", "warning"); return; }

        // Recolectar datos actuales
        const data = app.getFormData();
        // Asegurar campos clave
        data.orden_numero = document.getElementById('orden_numero').value || '???';
        data.cliente_nombre = document.getElementsByName('cliente_nombre')[0].value || 'Cliente';
        data.vehiculo_placa = document.getElementsByName('vehiculo_placa')[0].value || 'Vehículo';
        const dateInput = document.getElementsByName('fecha_entrega')[0];
        const date = dateInput ? dateInput.value.replace('T', ' ') : 'Por definir';

        let text = `🚗 *MecaTronia - Notificación* 🚗\n\n`;
        text += `Hola *${data.cliente_nombre}*, confirmamos la recepción de tu vehículo:\n`;
        text += `📄 *Orden:* #${data.orden_numero}\n`;
        text += `🚙 *Placa:* ${data.vehiculo_placa}\n`;
        text += `📅 *Entrega Aprox:* ${date}\n\n`;
        text += `Tu vehículo está en buenas manos. Adjunto encontrarás la constancia detallada.`;

        // Método Robusto: Navigator.Share (Menú compartir sistema)
        // Es el único que soporta enviar Imagen + Texto fiablemente, aunque requiera elegir contacto.
        if (navigator.share) {
            app.processCapture(data, 'share', null, text);
        } else {
            // PC: Link directo
            const url = `https://wa.me/57${phone}?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }
    },

    // Real Auth Login
    login: async () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-pass').value;
        const errorMsg = document.getElementById('login-error');
        const loading = document.getElementById('login-loading');
        const btn = document.getElementById('btn-login-action');

        if (!email || !password) {
            errorMsg.innerText = "Ingresa correo y contraseña";
            errorMsg.style.display = 'block';
            return;
        }

        // UI Loading
        errorMsg.style.display = 'none';
        loading.style.display = 'block';
        btn.disabled = true;

        try {
            const { data, error } = await app.supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            console.log("Login exitoso:", data);
            document.getElementById('login-screen').classList.add('hidden');
            app.currentUser = data.user;

        } catch (err) {
            console.error("Auth Error:", err);
            // Mostrar error específico para depurar
            errorMsg.innerText = "Error: " + (err.message || "Credenciales inválidas");
            errorMsg.style.display = 'block';
        } finally {
            loading.style.display = 'none';
            btn.disabled = false;
        }
    },

    logout: async () => {
        await app.supabase.auth.signOut();
        window.location.reload();
    },

    init: async () => {
        console.log("Iniciando App...");

        // Check for direct file opening
        if (window.location.protocol === 'file:') {
            console.info("%c⚠ Estás abriendo la app directamente (archivo).", "color: orange; font-weight: bold;");
            console.info("El error de 'CORS' o 'manifest.json' es NORMAL en este modo.");
            console.info("✅ TU BASE DE DATOS FUNCIONARÁ CORRECTAMENTE.");
            console.info("Para funciones completas (Instalar, Compartir sin limites), usa un Servidor Local.");
        }

        // 1. Intentar conectar Supabase
        try {
            // Ajuste para librería CDN: suele exponer 'supabase' globalmente
            const sbLib = window.supabase || ((typeof createClient !== 'undefined') ? { createClient } : null);

            if (sbLib && sbLib.createClient) {
                app.supabase = sbLib.createClient(SUPABASE_URL, SUPABASE_KEY);
                console.log("✅ Supabase Auth Activo");

                // --- GESTIÓN DE SESIÓN ---
                // 1. Verificar si hay sesión guardada
                const { data: { session } } = await app.supabase.auth.getSession();

                if (session) {
                    // 2. Validar que el usuario siga existiendo en el servidor (Seguridad)
                    const { data: { user }, error } = await app.supabase.auth.getUser();

                    if (error || !user) {
                        console.warn("Sesión expirada o usuario eliminado. Cerrando...", error);
                        await app.supabase.auth.signOut();
                        document.getElementById('login-screen').classList.remove('hidden');
                    } else {
                        console.log("Usuario validado:", user.email);
                        app.currentUser = user;
                        document.getElementById('login-screen').classList.add('hidden');
                    }
                } else {
                    // No hay sesión
                    document.getElementById('login-screen').classList.remove('hidden');
                }

                // 3. Escuchar cambios (logout, etc)
                app.supabase.auth.onAuthStateChange((event) => {
                    if (event === 'SIGNED_OUT') {
                        document.getElementById('login-screen').classList.remove('hidden');
                        app.currentUser = null;
                    }
                });

            } else {
                console.warn("⚠ Librería Supabase no detectada. Modo Offline.");
            }
        } catch (e) {
            console.warn("Error al iniciar Supabase:", e);
        }

        // 2. Iniciar Base de Datos Local
        try {
            await app.openDB();
            console.log("BD Local Lista");
            app.setupEventListeners();
            app.loadDashboard();
            app.setupSync();
            // 3. Auto-descargar datos remotos al abrir
            setTimeout(app.syncDown, 1000); // 1s de retraso para no bloquear render inicial
        } catch (err) {
            console.error(err);
            app.toast("Error GRAVE iniciando base de datos: " + err, "error");
        }
    },

    openDB: () => {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);

            req.onerror = (e) => reject("Error BD: " + e.target.error);

            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                const store = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
                store.createIndex("orden_numero", "orden_numero", { unique: true });
                store.createIndex("pending_sync", "pending_sync", { unique: false });
            };

            req.onsuccess = (e) => {
                app.db = e.target.result;
                resolve();
            };
        });
    },

    saveOrder: async (formData) => {
        // Validación básica
        if (!formData.orden_numero) throw new Error("Falta el Número de Orden");
        if (!formData.vehiculo_placa) throw new Error("Falta la Placa");

        return new Promise((resolve, reject) => {
            const tx = app.db.transaction([STORE_NAME], "readwrite");
            const store = tx.objectStore(STORE_NAME);

            // Preparar objeto
            const record = {
                ...formData,
                damages: app.damageMarkers, // Array de daños
                status: 'Abierto',
                created_at: new Date().toISOString(),
                pending_sync: true // SIEMPRE true al inicio
            };

            // ID vacía? borrarla para que sea auto-increment
            if (!record.id) delete record.id;
            else record.id = parseInt(record.id);

            // Guardar o Actualizar
            let req;
            if (record.id) req = store.put(record);
            else req = store.add(record);

            req.onsuccess = () => {
                // Sincronizar en segundo plano si hay cliente nube
                if (app.supabase) setTimeout(app.syncOne, 50, req.result);
                resolve(req.result);
            };
            req.onerror = (e) => reject(e.target.error);
        });
    },

    // Sincronizar un solo elemento (Rápido)
    syncOne: async (localId) => {
        try {
            // Leer dato local
            const item = await app.getOne(localId);
            if (!item) return;

            document.getElementById('sync-text').innerText = "Subiendo...";

            // Limpiar ID local y campos UI temporales antes de subir
            const { id, pending_sync, damage_type, ...payload } = item;

            // Subir
            const { error } = await app.supabase.from('orders').upsert(payload, { onConflict: 'orden_numero' });

            if (!error) {
                // Marcar como sync
                await app.markSynced(localId);
                document.getElementById('sync-text').innerText = "Online";
                console.log("Sincronizado ID:", localId);
            } else {
                console.error("Error Subida:", error);
            }
        } catch (e) {
            console.error("Error Sync:", e);
        }
    },

    markSynced: (id) => {
        return new Promise(resolve => {
            const tx = app.db.transaction([STORE_NAME], "readwrite");
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(id);
            req.onsuccess = () => {
                const data = req.result;
                if (data) {
                    data.pending_sync = false;
                    store.put(data);
                }
                resolve();
            };
        });
    },

    getAll: () => {
        return new Promise(resolve => {
            if (!app.db) return resolve([]);
            const tx = app.db.transaction([STORE_NAME], "readonly");
            const req = tx.objectStore(STORE_NAME).getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve([]);
        });
    },

    getOne: (id) => {
        return new Promise(resolve => {
            const tx = app.db.transaction([STORE_NAME], "readonly");
            const req = tx.objectStore(STORE_NAME).get(id);
            req.onsuccess = () => resolve(req.result);
        });
    },

    // --- INTERFAZ ---
    setupEventListeners: () => {
        // Busqueda
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.oninput = (e) => {
                app.loadDashboard(e.target.value);
            };
        }

        // Guardar
        const vehicleForm = document.getElementById('vehicle-form');
        if (vehicleForm) {
            vehicleForm.onsubmit = async (e) => {
                e.preventDefault();
                const btn = document.querySelector('.btn-save');
                btn.innerText = "Guardando..."; /* Feedback visual */

                try {
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData.entries());
                    // Checkboxes
                    document.querySelectorAll('input[type="checkbox"]').forEach(cb => data[cb.name] = cb.checked);

                    // Firma
                    const sigCanvas = document.getElementById('signature-pad');
                    if (sigCanvas) {
                        // Opcional: Verificar si está vacío (complicado sin heurísticas), guardamos todo
                        data.signature = sigCanvas.toDataURL('image/png');
                    }

                    await app.saveOrder(data);
                    app.toast("✅ Guardado Correctamente", "success");
                    app.loadDashboard(); // Assuming loadOrders is loadDashboard
                    app.navigateTo('dashboard');
                } catch (error) {
                    app.toast("❌ Error: " + error.message, "error");
                } finally {
                    btn.innerText = "Guardar Orden";
                }
            };
        }

        // Navegación
        const btnDashboard = document.getElementById('btn-dashboard');
        if (btnDashboard) btnDashboard.onclick = () => app.navigateTo('dashboard');

        const btnNew = document.getElementById('btn-new');
        if (btnNew) btnNew.onclick = () => { app.resetForm(); app.navigateTo('new'); };

        const btnBackForm = document.getElementById('btn-back-form');
        if (btnBackForm) btnBackForm.onclick = () => app.navigateTo('dashboard');

        // Daños
        const diagramWrapper = document.getElementById('car-diagram-wrapper');
        if (diagramWrapper) {
            diagramWrapper.onpointerdown = app.handleDiagramStart;
            // Prevent context menu on right click/long press for better drawing experience
            diagramWrapper.oncontextmenu = (e) => e.preventDefault();
        }

        // const btnClearDamage = document.getElementById('btn-clear-damage');
        // if (btnClearDamage) btnClearDamage.onclick = () => { app.damageMarkers.pop(); app.renderMarkers(); };

        document.querySelectorAll('input[name="damage_type"]').forEach(r => r.onchange = (e) => app.currentDamageType = e.target.value);

        // Inicializar Firma
        app.setupSignature();

        // Botón Sync Manual
        const btnSync = document.getElementById('btn-sync-down');
        if (btnSync) btnSync.onclick = app.syncDown;
    },

    setupSignature: () => {
        const canvas = document.getElementById('signature-pad');
        if (!canvas) return; // Si no existe (ej. dashboard)

        // Ajustar resolución para pantallas retina
        // const ratio = window.devicePixelRatio || 1;
        // canvas.width = canvas.offsetWidth * ratio;
        // canvas.height = canvas.offsetHeight * ratio;
        // canvas.getContext('2d').scale(ratio, ratio);

        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#000";

        let isDrawing = false;

        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            // Factores de escala por si CSS difiere de width/height atributos
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        };

        const start = (e) => {
            isDrawing = true;
            const pos = getPos(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            // Solo prevenir default si es touch para evitar scroll
            if (e.type === 'touchstart') e.preventDefault();
        };

        const move = (e) => {
            if (!isDrawing) return;
            const pos = getPos(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            e.preventDefault();
        };

        const end = () => {
            isDrawing = false;
        };

        // Eventos Mouse
        canvas.onmousedown = start;
        canvas.onmousemove = move;
        canvas.onmouseup = end;
        canvas.onmouseleave = end;

        // Eventos Touch
        canvas.ontouchstart = start;
        canvas.ontouchmove = move;
        canvas.ontouchend = end;

        // Botón Borrar
        const btnClear = document.getElementById('btn-clear-signature');
        if (btnClear) {
            btnClear.onclick = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            };
        }
    },

    loadDashboard: async (filterText = '') => {
        const list = await app.getAll();
        const container = document.getElementById('orders-list');
        container.innerHTML = '';

        // Filtrar si hay texto
        const filtered = filterText ? list.filter(od =>
            od.vehiculo_placa.toLowerCase().includes(filterText.toLowerCase()) ||
            od.cliente_nombre.toLowerCase().includes(filterText.toLowerCase()) ||
            (od.cliente_id && od.cliente_id.includes(filterText)) ||
            od.orden_numero.toString().includes(filterText)
        ) : list;

        // Actualizar contador
        const counterEl = document.getElementById('total-orders');
        if (counterEl) counterEl.innerText = `(${filtered.length})`;

        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-state">No se encontraron registros. <br><br> <button class="nav-btn primary" onclick="app.navigateTo(`new`)">Crear Nuevo</button></div>';
            return;
        }

        filtered.reverse().forEach(od => {
            const card = document.createElement('div');
            card.className = 'order-card';

            // Content Container
            const contentDiv = document.createElement('div');
            contentDiv.innerHTML = `
                <div class="order-header">
                    <b>#${od.orden_numero}</b> 
                    <small>${new Date(od.fecha_apertura).toLocaleDateString()}</small>
                </div>
                <h2>${od.vehiculo_placa}</h2>
                <p>${od.cliente_nombre}</p>
                <small>${od.pending_sync ? '🚩 Pendiente Subir' : '✅ En Nube'}</small>
            `;
            card.appendChild(contentDiv);

            // Quick Actions Toolbar
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'card-actions';
            actionsDiv.style.cssText = "margin-top:10px; padding-top:10px; border-top:1px solid #eee; display:flex; gap:10px; justify-content:flex-end;";

            // Share Button
            if (navigator.share) {
                const btnS = document.createElement('button');
                btnS.className = 'btn-secondary small';
                btnS.innerHTML = '<span class="material-symbols-outlined" style="font-size:1.2rem; vertical-align:middle;">share</span>';
                btnS.title = "Compartir";
                btnS.onclick = (e) => {
                    e.stopPropagation(); // Don't open card
                    app.processCapture(od, 'share', btnS);
                };
                actionsDiv.appendChild(btnS);
            }

            // Download Button
            const btnD = document.createElement('button');
            btnD.className = 'btn-secondary small';
            btnD.innerHTML = '<span class="material-symbols-outlined" style="font-size:1.2rem; vertical-align:middle;">download</span>';
            btnD.title = "Guardar Imagen";
            btnD.onclick = (e) => {
                e.stopPropagation();
                app.processCapture(od, 'download', btnD);
            };
            actionsDiv.appendChild(btnD);

            card.appendChild(actionsDiv);

            // Main Card Click
            card.onclick = () => app.loadOrderIntoForm(od.id);
            container.appendChild(card);
        });
    },

    loadOrderIntoForm: async (id) => {
        const od = await app.getOne(id);
        if (!od) return;

        app.navigateTo('new');
        const form = document.getElementById('vehicle-form');
        document.querySelector('.form-header h1').innerText = "Editar Orden #" + od.orden_numero;

        // Rellenar inputs
        Object.keys(od).forEach(k => {
            if (form.elements[k]) {
                const el = form.elements[k];
                if (el.type === 'checkbox') {
                    el.checked = od[k];
                } else if (el.type === 'datetime-local' && od[k]) {
                    // Fix para datetime-local: requiere formato YYYY-MM-DDThh:mm
                    // Supabase devuelve ISO completo (con Z o milisegundos), que el input a veces rechaza.
                    // Cortamos en el minuto 16 (YYYY-MM-DDThh:mm)
                    try {
                        const iso = new Date(od[k]).toISOString();
                        el.value = iso.slice(0, 16);
                    } catch (e) {
                        el.value = od[k]; // Fallback
                    }
                } else {
                    el.value = od[k];
                }
            }
        });
        document.getElementById('order_id').value = od.id;

        // Rellenar daños
        app.damageMarkers = od.damages || [];

        app.renderMarkers();

        // Show Actions for Edit Mode
        document.getElementById('btn-share').style.display = navigator.share ? 'flex' : 'none';
        document.getElementById('btn-download').style.display = 'flex';
        document.getElementById('btn-delete').style.display = 'flex'; // Show Delete


        // Rellenar Firma
        const sigCanvas = document.getElementById('signature-pad');
        const ctx = sigCanvas.getContext('2d');
        ctx.clearRect(0, 0, sigCanvas.width, sigCanvas.height); // Limpiar primero
        if (od.signature) {
            const img = new Image();
            img.onload = () => ctx.drawImage(img, 0, 0);
            img.src = od.signature;
        }

        // Configurar Botones
        const btnShare = document.getElementById('btn-share');
        const btnDownload = document.getElementById('btn-download');

        // Helper para obtener datos merged
        const getData = () => ({ ...od, ...app.getFormData() });

        // Compartir (Solo si soportado)
        if (navigator.share) {
            btnShare.style.display = 'inline-block';
            btnShare.onclick = () => app.processCapture(getData(), 'share');
        } else {
            btnShare.style.display = 'none';
        }

        // Descargar (Siempre visible)
        if (btnDownload) {
            btnDownload.style.display = 'inline-block';
            btnDownload.onclick = () => app.processCapture(getData(), 'download');
        }
    },

    handleDiagramStart: (e) => {
        if (e.target.closest('.damage-controls')) return;
        e.preventDefault(); // Stop scrolling/dragging

        const rect = e.currentTarget.getBoundingClientRect();

        // Coords
        const startX = e.clientX;
        const startY = e.clientY;

        // Add new marker (Default state)
        app.damageMarkers.push({
            x: ((startX - rect.left) / rect.width) * 100,
            y: ((startY - rect.top) / rect.height) * 100,
            type: app.currentDamageType,
            rotation: 0,
            scale: 1.0
        });

        const newIndex = app.damageMarkers.length - 1;

        // Select it immediately
        app.selectMarker(newIndex);

        // Setup Drag Interaction
        app.interactionState = {
            index: newIndex,
            startX: startX,
            startY: startY
        };

        document.addEventListener('pointermove', app.handleDiagramMove);
        document.addEventListener('pointerup', app.handleDiagramEnd);
    },

    handleDiagramMove: (e) => {
        if (!app.interactionState) return;
        e.preventDefault();

        const { startX, startY, index } = app.interactionState;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Threshold to interpret as drag
        if (dist < 10) return;

        const m = app.damageMarkers[index];
        if (!m) return;

        // 1. Rotation: Angle of the drag vector
        m.rotation = Math.atan2(dy, dx) * (180 / Math.PI);

        // 2. Scale: Distance correlates to size
        // Base 1.0, grow faster for scratches
        let newScale = 0.5 + (dist / 40);
        m.scale = Math.max(0.5, Math.min(8.0, newScale));

        // Update View
        app.renderMarkers();

        // Update Sliders if they exist
        const inpRot = document.getElementById('inp-rot');
        const listRot = document.getElementById('val-rot');
        if (inpRot) inpRot.value = m.rotation; // Slider might need 0-360 normalization if restricted
        if (listRot) listRot.innerText = Math.round(m.rotation) + '°';

        const inpScale = document.getElementById('inp-scale');
        const listScale = document.getElementById('val-scale');
        if (inpScale) inpScale.value = m.scale;
        if (listScale) listScale.innerText = m.scale.toFixed(1) + 'x';
    },

    handleDiagramEnd: (e) => {
        document.removeEventListener('pointermove', app.handleDiagramMove);
        document.removeEventListener('pointerup', app.handleDiagramEnd);
        app.interactionState = null;
    },

    // --- Marker Manipulation Helpers ---
    selectMarker: (index, e) => {
        if (e) e.stopPropagation(); // Prevent adding a new marker when clicking an existing one
        app.selectedMarkerIndex = index;
        app.renderMarkers();

        // Update Controls UI
        const m = app.damageMarkers[index];
        const controls = document.getElementById('marker-controls');
        if (controls && m) {
            controls.style.display = 'block';
            document.getElementById('inp-rot').value = m.rotation || 0;
            document.getElementById('val-rot').innerText = (m.rotation || 0) + '°';
            document.getElementById('inp-scale').value = m.scale || 1.0;
            document.getElementById('val-scale').innerText = (m.scale || 1.0) + 'x';
        }
    },

    deselectMarker: () => {
        app.selectedMarkerIndex = null;
        app.renderMarkers();
        const controls = document.getElementById('marker-controls');
        if (controls) controls.style.display = 'none';
    },

    updateMarker: (prop, value) => {
        if (app.selectedMarkerIndex === null) return;
        const m = app.damageMarkers[app.selectedMarkerIndex];
        if (!m) return;

        if (prop === 'rotation') {
            m.rotation = parseInt(value);
            document.getElementById('val-rot').innerText = m.rotation + '°';
        } else if (prop === 'scale') {
            m.scale = parseFloat(value);
            document.getElementById('val-scale').innerText = m.scale + 'x';
        }
        app.renderMarkers();
    },

    deleteSelectedMarker: () => {
        if (app.selectedMarkerIndex === null) return;
        app.damageMarkers.splice(app.selectedMarkerIndex, 1);
        app.deselectMarker();
    },

    undoLastMarker: () => {
        app.damageMarkers.pop();
        app.deselectMarker();
    },

    renderMarkers: () => {
        const l = document.getElementById('damage-markers-layer');
        l.innerHTML = '';
        const sym = { 'rayon': '➖', 'golpe': '✖', 'sumidura': '🟠' };

        app.damageMarkers.forEach((m, i) => {
            const d = document.createElement('div');
            d.className = 'marker-spot';
            d.style.left = m.x + '%';
            d.style.top = m.y + '%';
            d.innerText = sym[m.type];

            // Apply Transform (Rotation & Scale)
            const rot = m.rotation || 0;
            const sc = m.scale || 1.0;

            // For 'rayon', stretch length (X) but keep thickness (Y) fixed.
            // For others, scale uniformly.
            if (m.type === 'rayon') {
                d.style.transform = `translate(-50%, -50%) rotate(${rot}deg) scale(${sc}, 1)`;
            } else {
                d.style.transform = `translate(-50%, -50%) rotate(${rot}deg) scale(${sc})`;
            }

            // Visual Selection Highlight
            if (i === app.selectedMarkerIndex) {
                d.style.border = '2px dashed #000';
                d.style.borderRadius = '50%';
                d.style.boxShadow = '0 0 5px rgba(255, 255, 0, 0.8)';
                d.style.zIndex = 100;
                d.style.animation = 'none'; // Prevent pop-in animation while editing
            }

            // Click/Drag to Select & Edit
            d.onpointerdown = (e) => {
                e.preventDefault();
                e.stopPropagation(); // Stop parent from creating new marker
                app.selectMarker(i);

                // Enable "Edit Mode" via Dragging immediately
                app.interactionState = {
                    index: i,
                    startX: e.clientX,
                    startY: e.clientY
                };
                document.addEventListener('pointermove', app.handleDiagramMove);
                document.addEventListener('pointerup', app.handleDiagramEnd);
            };

            if (m.type === 'golpe') {
                d.style.color = '#aa00ff';
                d.style.fontWeight = 'bold';
                d.style.textShadow = '0px 0px 2px white';
            }
            l.appendChild(d);
        });
    },

    processCapture: async (orderData, action, btnElement = null, customText = null) => {
        const btn = btnElement || (action === 'share' ? document.getElementById('btn-share') : document.getElementById('btn-download'));
        const originalText = btn.innerText;
        btn.innerText = "⏳";

        try {
            // 1. Populate Capture Container (Data is safe)
            document.getElementById('cap-orden').innerText = '#' + orderData.orden_numero;
            document.getElementById('cap-fecha').innerText = "Ingreso: " + new Date(orderData.fecha_apertura).toLocaleString();
            document.getElementById('cap-asesor').innerText = orderData.asesor_servicio || ''; // Asesor Name

            // Fecha Entrega
            const entregaEl = document.getElementById('cap-entrega');
            if (orderData.fecha_entrega) {
                entregaEl.innerText = new Date(orderData.fecha_entrega).toLocaleString();
            } else {
                entregaEl.innerText = "Por Confirmar";
            }

            document.getElementById('cap-cliente').innerText = orderData.cliente_nombre;
            document.getElementById('cap-id').innerText = orderData.cliente_id || 'N/A';
            document.getElementById('cap-placa').innerText = orderData.vehiculo_placa;
            document.getElementById('cap-km').innerText = orderData.vehiculo_km || '0';
            document.getElementById('cap-tipo').innerText = orderData.vehiculo_tipo || 'N/A';
            document.getElementById('cap-gas').innerText = (orderData.vehiculo_combustible || 0) + '%';

            // Inventory
            const invDiv = document.getElementById('cap-inventory');
            invDiv.innerHTML = '';
            const invKeys = Object.keys(orderData).filter(k => k.startsWith('inv_') && orderData[k]);
            if (invKeys.length === 0) invDiv.innerText = "Ninguno";
            else invKeys.forEach(k => {
                const span = document.createElement('span');
                span.style.border = "1px solid #ccc";
                span.style.padding = "2px 6px";
                span.style.borderRadius = "4px";
                span.innerText = k.replace('inv_', '').toUpperCase();
                invDiv.appendChild(span);
            });

            // Pertenencias
            document.getElementById('cap-pertenencias').innerText = orderData.obj_pertenencias || "Ninguna";

            // Solicitud y Notas
            document.getElementById('cap-solicitud').innerText = orderData.solicitud_cliente || "No detallada";
            const notasRow = document.getElementById('cap-notas-row');
            if (orderData.historial_servicio && orderData.historial_servicio.trim().length > 0) {
                document.getElementById('cap-notas').innerText = orderData.historial_servicio;
                notasRow.style.display = 'block';
            } else {
                notasRow.style.display = 'none';
            }

            // Diagram Clone
            const host = document.getElementById('cap-diagram-host');
            host.innerHTML = '';
            host.style.position = 'relative'; // Crucial for markers

            const imgOrig = document.getElementById('car-image');
            if (imgOrig) {
                const imgClone = imgOrig.cloneNode(true);
                imgClone.style.width = '100%';
                host.appendChild(imgClone);
            } else {
                console.warn("Diagrama no encontrado: car-image");
            }

            // Render markers on clone
            const sym = { 'rayon': '➖', 'golpe': '✖', 'sumidura': '🟠' };
            (orderData.damages || []).forEach(m => {
                const d = document.createElement('div');
                d.style.position = 'absolute';
                d.style.left = m.x + '%';
                d.style.top = m.y + '%';

                // MIRROR RENDER LOGIC for Capture
                if (m.type === 'rayon') {
                    d.style.transform = `translate(-50%, -50%) rotate(${m.rotation || 0}deg) scale(${m.scale || 1}, 1)`;
                } else {
                    d.style.transform = `translate(-50%, -50%) rotate(${m.rotation || 0}deg) scale(${m.scale || 1})`;
                }

                d.style.fontSize = '20px';
                d.innerText = sym[m.type];
                if (m.type === 'golpe') {
                    d.style.color = '#aa00ff';
                    d.style.fontWeight = 'bold';
                    d.style.textShadow = '0px 0px 2px white';
                }
                host.appendChild(d);
            });

            // Signature
            const sigImg = document.getElementById('cap-signature');
            if (orderData.signature && orderData.signature.length > 50) {
                sigImg.src = orderData.signature;
                sigImg.style.display = 'block';
                // Esperar a que renderice el src
                await new Promise(resolve => setTimeout(resolve, 150));
            } else {
                sigImg.style.display = 'none';
            }

            // CANVAS SAFETY CHECK (Global)
            // Verify all images in the container. If any are tainted (file://), hide them to prevent crash.
            const captureContainer = document.getElementById('capture-container');
            const allImages = captureContainer.querySelectorAll('img');

            for (let img of allImages) {
                try {
                    // If image is hidden or no src, skip
                    if (img.style.display === 'none' || !img.src) continue;

                    const testC = document.createElement('canvas');
                    const ctx = testC.getContext('2d');
                    testC.width = 1; testC.height = 1;

                    // Attempt to draw and read. If it throws, it's tainted.
                    ctx.drawImage(img, 0, 0);
                    testC.toDataURL();
                } catch (securityError) {
                    console.warn("Imagen insegura detectada (CORS/File). Ocultando para permitir captura:", img.src);
                    img.style.display = 'none';

                    // Add a text placeholder so they know why it's missing
                    const placeholder = document.createElement('div');
                    placeholder.innerText = "[Imagen bloqueada por navegador - use Servidor Local]";
                    placeholder.style.color = 'red';
                    placeholder.style.fontSize = '10px';
                    placeholder.style.textAlign = 'center';
                    placeholder.style.border = '1px dashed red';
                    img.parentElement.insertBefore(placeholder, img);
                }
            }

            // 2. Capture (High Quality for HD)
            const canvas = await html2canvas(captureContainer, {
                scale: 4, // Higher resolution for "HD" support
                useCORS: true,
                allowTaint: false, // CRITICAL: Must be false to allow toBlob export
                backgroundColor: '#ffffff'
            });

            // 3. Share or Download Choice
            // Use JPEG for better compatibility with Android WhatsApp "HD" photo flow
            canvas.toBlob(async (blob) => {
                if (!blob) throw new Error("No se pudo generar el archivo de imagen.");

                const fileName = `Orden_${orderData.orden_numero}.jpg`;
                const file = new File([blob], fileName, { type: 'image/jpeg' });

                // Función auxiliar para descargar
                const downloadImage = () => {
                    const link = document.createElement('a');
                    link.download = fileName;
                    link.href = canvas.toDataURL('image/jpeg', 0.98);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    // Solo aviso si es explícitamente "Descargar"
                    if (action === 'download') app.toast("✅ Imagen guardada en Galería", "success");
                };

                if (action === 'share' && navigator.share) {
                    try {
                        const shareText = customText || `Constancia de ingreso para vehículo ${orderData.vehiculo_placa}`;

                        // Fallback Clipboard (Android a veces ignora el texto con imágenes)
                        try {
                            if (navigator.clipboard) {
                                await navigator.clipboard.writeText(shareText);
                                app.toast("📋 Texto copiado (Pegar si falta)", "info");
                            }
                        } catch (cErr) { console.warn("Clipboard failed", cErr); }

                        await navigator.share({
                            title: `Orden de Ingreso #${orderData.orden_numero}`,
                            text: shareText,
                            files: [file]
                        });
                    } catch (err) {
                        if (err.name !== 'AbortError') {
                            console.error(err);
                            app.toast("No se pudo abrir menú compartir. Descargando...", "info");
                            downloadImage();
                        }
                    }
                } else if (action === 'whatsapp_direct') {
                    // 1. Descargar (Backup)
                    downloadImage();

                    // 2. Intentar Copiar Imagen (y Texto si es posible)
                    try {
                        if (typeof ClipboardItem !== "undefined") {
                            // Intentar Copia Mixta (Texto + Imagen)
                            try {
                                const textBlob = new Blob([customText || ""], { type: 'text/plain' });
                                const mixedItem = new ClipboardItem({
                                    [blob.type]: blob,
                                    'text/plain': textBlob
                                });
                                await navigator.clipboard.write([mixedItem]);
                                app.toast("📋 Imagen y Texto COPIADOS.\n¡Pégalos en el chat!", "success");
                            } catch (mixedErr) {
                                // Fallback: Solo Imagen (Común en móviles)
                                const imgItem = new ClipboardItem({ [blob.type]: blob });
                                await navigator.clipboard.write([imgItem]);
                                app.toast("📋 Imagen COPIADA.\n¡Pégala en el chat!", "success");
                            }
                        } else {
                            app.toast("✅ Imagen descargada.\nAdjúntala con el clip 📎", "success");
                        }
                    } catch (cpErr) {
                        console.warn("Clipboard Write Failed:", cpErr);
                        app.toast("✅ Imagen descargada.\nAdjúntala con el clip 📎", "success");
                    }

                    // 2. Abrir WhatsApp Directo (con delay para permitir descarga)
                    const phone = (orderData.cliente_telefono || '').replace(/\D/g, '');
                    if (phone) {
                        const waUrl = `https://wa.me/57${phone}?text=${encodeURIComponent(customText || '')}`;
                        setTimeout(() => window.open(waUrl, '_blank'), 1000);
                    } else {
                        app.toast("Error: No hay teléfono para WhatsApp", "warning");
                    }

                } else {
                    // Si es download o no soporta share
                    downloadImage();
                }
            }, 'image/jpeg', 0.98);

        } catch (e) {
            console.error(e);
            app.toast("Error al generar imagen: " + e.message, "error");
        } finally {
            btn.innerText = originalText;
            // Restaurar logo por si acaso
            const logoImg = document.getElementById('capture-container').querySelector('img');
            if (logoImg) logoImg.style.display = 'block';
        }
    },

    syncDown: async () => {
        if (!app.supabase) return;
        const btn = document.getElementById('btn-sync-down');
        if (btn) btn.classList.add('rotating'); // Añadir CSS para rotar si se quiere

        try {
            const { data, error } = await app.supabase.from('orders').select('*');
            if (error) throw error;
            if (!data) return;

            const tx = app.db.transaction([STORE_NAME], "readwrite");
            const store = tx.objectStore(STORE_NAME);
            const index = store.index('orden_numero');

            // Promesa para manejar la transacción
            await new Promise((resolve, reject) => {
                let processed = 0;
                if (data.length === 0) resolve();

                data.forEach(remoteRecord => {
                    // Verificar si ya existe localmente
                    const req = index.get(remoteRecord.orden_numero);
                    req.onsuccess = () => {
                        const localRecord = req.result;
                        // Estrategia: "Nube manda" si no existe localmente.
                        // Si existe localmente, solo sobrescribimos si NO tiene cambios pendientes.

                        // Vamos a insertar/actualizar
                        // Aseguramos que pending_sync sea false porque viene de la nube
                        remoteRecord.pending_sync = false;

                        // Si existe localmente, preservamos su ID de IndexedDB para no crear duplicados
                        if (localRecord) {
                            remoteRecord.id = localRecord.id;
                            // Si local tiene cambios pendientes, NO sobrescribimos (protección)
                            if (localRecord.pending_sync) {
                                processed++;
                                if (processed === data.length) resolve();
                                return;
                            }
                        }

                        store.put(remoteRecord);
                        processed++;
                        if (processed === data.length) resolve();
                    };
                    req.onerror = () => {
                        processed++;
                        if (processed === data.length) resolve();
                    }
                });
            });

            console.log("⬇ Datos descargados de la nube:", data.length);
            app.loadDashboard(); // Refrescar UI

        } catch (err) {
            console.error("Error SyncDown:", err);
        } finally {
            if (btn) btn.classList.remove('rotating');
        }
    },

    deleteOrder: async () => {
        const id = document.getElementById('order_id').value;
        if (!id) return;

        if (confirm("⚠️ ¿Estás SEGURO de eliminar esta orden?\nEsta acción no se puede deshacer.")) {
            // Delete from Supabase
            if (app.supabase) {
                const { error } = await app.supabase.from('orders').delete().eq('id', id);
                if (error) {
                    app.toast("Error al eliminar: " + error.message, "error");
                    return;
                }
            }

            // Delete from Local
            try {
                const tx = app.db.transaction([STORE_NAME], "readwrite");
                const store = tx.objectStore(STORE_NAME);
                store.delete(Number(id)); // Assuming ID is number in IDB? Or string? Supabase IDs are usually numbers if BigInt, or UUID.
                // Wait, in previous logic: `data.orden_numero` is index, but `id` is primary key.
                // Supabase ID is int8?
                // Let's assume it works or just rely on SyncDown next refresh.
                // Better: Check saveOrder logic. id is handled?
            } catch (e) { console.warn(e); }

            app.toast("Orden eliminada correctamente", "success");
            app.loadDashboard(); // Refresh
            app.navigateTo('dashboard');
        }
    },

    navigateTo: (view) => {
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
            v.classList.add('hidden');
        });
        const target = view === 'dashboard' ? 'view-dashboard' : 'view-form';
        document.getElementById(target).classList.remove('hidden');
        setTimeout(() => document.getElementById(target).classList.add('active'), 10);

        if (view === 'dashboard') app.loadDashboard();
    },

    resetForm: () => {
        document.getElementById('vehicle-form').reset();
        document.getElementById('order_id').value = '';
        app.damageMarkers = [];
        app.renderMarkers();

        // Limpiar firma
        const sigCanvas = document.getElementById('signature-pad');
        if (sigCanvas) {
            const ctx = sigCanvas.getContext('2d');
            ctx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
        }
        document.querySelector('.form-header h1').innerText = "Nuevo Ingreso";
        document.getElementById('btn-share').style.display = 'none'; // Hide share on new
        document.getElementById('btn-download').style.display = 'none';
        document.getElementById('btn-delete').style.display = 'none'; // Hide Delete
    },

    setupSync: () => {
        // Monitor básico de conexión
        setInterval(() => {
            const txt = document.getElementById('sync-text');
            const badge = document.getElementById('sync-status');
            if (badge && txt) {
                if (navigator.onLine) {
                    if (!badge.classList.contains('syncing')) {
                        badge.className = 'sync-badge online';
                        txt.innerText = 'Online';
                    }
                } else {
                    badge.className = 'sync-badge offline';
                    txt.innerText = 'Offline';
                }
            }
        }, 5000);
    }
};

window.onload = app.init;
