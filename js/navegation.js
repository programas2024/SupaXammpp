/**
 * ARCHIVO DE CONTROL DE NAVEGACIÓN Y RESPONSIVE
 * Desarrollado para el manejo dinámico de vistas y menú hamburguesa.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- REFERENCIAS ELEMENTOS DEL DOM ---
    const menuHamburgerBtn = document.getElementById('menu-hamburger-btn');
    const sidebarMenu       = document.getElementById('sidebar-menu');
    const sidebarOverlay    = document.getElementById('sidebar-overlay');
    const tabsButtons       = document.querySelectorAll('.tab-btn');
    const viewContents      = document.querySelectorAll('.view-content');

    // --- ENTRADAS DE CONTROL DE PESTAÑAS (TABS) ---
    tabsButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Extrae el identificador del botón (Ej: 'btn-tablas' extrae 'tablas')
            const targetViewId = button.id.replace('btn-', '');
            
            executeTabSwitch(targetViewId, button);
            
            // Si está en móvil, cierra automáticamente la barra lateral tras elegir opción
            closeMobileSidebar();
        });
    });

    /**
     * Alterna la visibilidad de los contenedores de vistas y actualiza estados CSS
     * @param {string} viewId - Identificador de la vista a mostrar
     * @param {HTMLElement} activeButton - Nodo del botón clickeado
     */
    function executeTabSwitch(viewId, activeButton) {
        // 1. Ocultar todos los bloques de contenido de vistas
        viewContents.forEach(content => content.classList.add('hidden'));

        // 2. Mostrar la vista solicitada por parámetro
        document.getElementById(`tab-${viewId}`).classList.remove('hidden');

        // 3. Remover estados activos de todos los botones de la barra de navegación
        tabsButtons.forEach(btn => {
            btn.classList.remove('bg-sky-50', 'text-sky-600');
            btn.classList.add('text-slate-600', 'hover:bg-slate-50');
        });

        // 4. Inyectar clases de estado activo al botón seleccionado
        activeButton.classList.remove('text-slate-600', 'hover:bg-slate-50');
        activeButton.classList.add('bg-sky-50', 'text-sky-600');
    }


    // --- CONTROL DE MENÚ ADAPTATIVO (RESPONSIVE HAMBURGER) ---

    // Abre/Cierra el sidebar desde el botón de hamburguesa móvil
    menuHamburgerBtn.addEventListener('click', () => {
        const isMenuOpen = sidebarMenu.classList.contains('translate-x-0');
        if (isMenuOpen) {
            closeMobileSidebar();
        } else {
            openMobileSidebar();
        }
    });

    // Cierra el menú móvil si el usuario toca la capa oscura difuminada de fondo
    sidebarOverlay.addEventListener('click', closeMobileSidebar);

    function openMobileSidebar() {
        sidebarMenu.classList.remove('-translate-x-full');
        sidebarMenu.classList.add('translate-x-0');
        sidebarOverlay.classList.remove('hidden');
    }

    function closeMobileSidebar() {
        sidebarMenu.classList.remove('translate-x-0');
        sidebarMenu.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('hidden');
    }
});