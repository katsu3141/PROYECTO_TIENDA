// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor() {}

  async ngOnInit() {
    const platform = Capacitor.getPlatform();
    console.log(`🚀 Plataforma detectada: ${platform}`);

    // 🌐 Inicializar jeep-sqlite SOLO en web
    if (platform === 'web') {
      try {
        // Definir el custom element de jeep-sqlite
        await jeepSqlite(window);
        console.log('✅ jeep-sqlite inicializado correctamente');
        
        // Crear el elemento en el DOM
        const jeepEl = document.createElement('jeep-sqlite');
        document.body.appendChild(jeepEl);
        
        // Esperar a que esté listo
        await customElements.whenDefined('jeep-sqlite');
        console.log('✅ jeep-sqlite custom element registrado');
        
        // La inicialización del WebStore la maneja el DatabaseService automáticamente
        console.log('✅ Listo para usar SQLite en web');
        
      } catch (error) {
        console.error('❌ Error inicializando jeep-sqlite:', error);
      }
    } else {
      console.log('📱 Ejecutando en móvil, usando SQLite nativo');
    }
  }
}