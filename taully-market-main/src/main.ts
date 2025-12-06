// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

// 🆕 Importar PWA Elements para Camera API
import { defineCustomElements as pwaElements } from '@ionic/pwa-elements/loader';

// 🆕 Importar jeep-sqlite para soporte web de SQLite
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';
import { Capacitor } from '@capacitor/core';

/**
 * 🚀 Inicializar aplicación con todos los elementos necesarios
 */
async function initializeApp() {
  try {
    console.log('🚀 Inicializando aplicación...');
    
    // 1️⃣ Registrar PWA Elements (necesario para Camera en web)
    console.log('📸 Registrando PWA Elements...');
    pwaElements(window);
    
    // 2️⃣ Registrar jeep-sqlite solo en web (para SQLite)
    const platform = Capacitor.getPlatform();
    console.log(`🔍 Plataforma detectada: ${platform}`);
    
    if (platform === 'web') {
      console.log('🌐 Registrando jeep-sqlite para web...');
      jeepSqlite(window);
      
      // Esperar a que el componente esté definido
      await customElements.whenDefined('jeep-sqlite');
      console.log('✅ jeep-sqlite registrado correctamente');
      
      // Pequeño delay para asegurar inicialización completa
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 3️⃣ Bootstrap de Angular
    console.log('⚡ Iniciando Angular...');
    await bootstrapApplication(AppComponent, {
      providers: [
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        provideIonicAngular(),
        provideRouter(routes),
      ],
    });
    
    console.log('✅ Aplicación inicializada exitosamente');
    
  } catch (error) {
    console.error('❌ Error inicializando aplicación:', error);
    
    // Mostrar error amigable al usuario
    document.body.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: #1a1a2e;
        color: #eaeaea;
        font-family: Arial, sans-serif;
        padding: 20px;
        text-align: center;
      ">
        <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
        <h1 style="margin: 0 0 10px 0;">Error al iniciar la aplicación</h1>
        <p style="color: #a0a0a0; margin: 0 0 20px 0;">
          Ocurrió un problema al cargar Taully Market
        </p>
        <button 
          onclick="window.location.reload()" 
          style="
            background: linear-gradient(135deg, #e94560, #533483);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(233, 69, 96, 0.4);
          "
        >
          🔄 Reintentar
        </button>
        <details style="margin-top: 30px; text-align: left; max-width: 600px;">
          <summary style="cursor: pointer; color: #e94560;">
            Ver detalles técnicos
          </summary>
          <pre style="
            background: #0f0f0f;
            padding: 15px;
            border-radius: 8px;
            overflow: auto;
            font-size: 12px;
            margin-top: 10px;
          ">${error}</pre>
        </details>
      </div>
    `;
  }
}

// 🎯 Ejecutar inicialización
initializeApp();