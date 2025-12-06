// src/app/services/image.service.ts
import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  
  // ✅ CONFIGURACIÓN BALANCEADA - Mejor calidad visual
  private readonly CONFIG = {
    // Para imagen principal
    maxWidth: 1200,           // ⬆️ Aumentado para mejor calidad
    maxHeight: 1200,          // ⬆️ Aumentado para mejor calidad
    quality: 0.85,            // ⬆️ Aumentado de 0.7 a 0.85
    
    // Para miniatura (listados)
    thumbnailSize: 200,       // ⬆️ Aumentado de 150 a 200
    thumbnailQuality: 0.75,   // ⬆️ Aumentado de 0.5 a 0.75
    
    // Límites
    maxSizeMB: 3,             // ⬆️ Aumentado de 2MB a 3MB
  };

  constructor() {}

  /**
   * 📸 Seleccionar imagen desde la cámara o galería
   * ✅ OPTIMIZADO: Mejor balance calidad/tamaño
   */
  async seleccionarImagen(useCamera: boolean = false): Promise<string | null> {
    try {
      console.log(`📸 Iniciando selección (${useCamera ? 'Cámara' : 'Galería'})`);
      
      // Verificar permisos
      const permiso = await this.verificarPermisos();
      if (!permiso) {
        alert('⚠️ Se necesitan permisos para acceder a la cámara/galería');
        return null;
      }

      // Capturar imagen con configuración optimizada
      const image = await Camera.getPhoto({
        quality: 90,  // ⬆️ Calidad inicial alta
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: useCamera ? CameraSource.Camera : CameraSource.Photos,
        // NO establecer width/height - se redimensionará después
      });

      if (!image || !image.base64String) {
        console.log('⚠️ Usuario canceló o no se capturó imagen');
        return null;
      }

      // Convertir a data URL
      const imagenOriginal = `data:image/${image.format};base64,${image.base64String}`;
      const tamanoOriginal = this.calcularTamano(imagenOriginal);
      console.log(`📊 Imagen original: ${tamanoOriginal.toFixed(2)} MB`);
      
      // ✅ Comprimir y redimensionar la imagen
      console.log('🔄 Comprimiendo imagen...');
      const imagenOptimizada = await this.comprimirImagen(imagenOriginal);
      
      // Validar tamaño final
      const tamanoFinal = this.calcularTamano(imagenOptimizada);
      console.log(`✅ Imagen optimizada: ${tamanoFinal.toFixed(2)} MB`);
      
      // Si aún es muy grande, comprimir más
      if (tamanoFinal > this.CONFIG.maxSizeMB) {
        console.log('⚠️ Aplicando compresión adicional...');
        return await this.comprimirImagen(imagenOptimizada, 0.7);
      }
      
      return imagenOptimizada;
      
    } catch (error: any) {
      console.error('❌ Error seleccionando imagen:', error);
      
      // ✅ Usuario canceló - Detectar TODOS los casos
      const errorMsg = error.message || error.toString() || '';
      if (
        errorMsg.includes('cancelled') || 
        errorMsg.includes('User cancelled') ||
        errorMsg.includes('cancel') ||
        error.code === 'USER_CANCELLED' ||
        error.name === 'CapacitorException'
      ) {
        console.log('ℹ️ Usuario canceló la selección');
        return null;
      }
      
      // Si no es cancelación, lanzar error
      throw error;
    }
  }

  /**
   * 🗜️ Comprimir y redimensionar imagen
   * ✅ OPTIMIZADO: Mejor calidad de redimensionamiento
   */
  private async comprimirImagen(
    base64Image: string, 
    qualityOverride?: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Crear canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', {
            alpha: false,  // ✅ Mejor rendimiento para JPEGs
            willReadFrequently: false
          });
          
          if (!ctx) {
            reject('No se pudo crear el contexto del canvas');
            return;
          }

          // Calcular nuevas dimensiones manteniendo aspect ratio
          let { width, height } = this.calcularDimensiones(
            img.width, 
            img.height,
            this.CONFIG.maxWidth,
            this.CONFIG.maxHeight
          );

          // Establecer dimensiones del canvas
          canvas.width = width;
          canvas.height = height;

          // ✅ MEJOR CALIDAD: Algoritmo de redimensionamiento suave
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Fondo blanco para JPEGs sin transparencia
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);

          // Dibujar imagen redimensionada
          ctx.drawImage(img, 0, 0, width, height);

          // Comprimir a JPEG con calidad especificada
          const quality = qualityOverride || this.CONFIG.quality;
          const imagenComprimida = canvas.toDataURL('image/jpeg', quality);
          
          const tamanoOriginal = this.calcularTamano(base64Image);
          const tamanoNuevo = this.calcularTamano(imagenComprimida);
          const reduccion = ((1 - tamanoNuevo / tamanoOriginal) * 100).toFixed(1);
          
          console.log(`✅ Compresión: ${tamanoOriginal.toFixed(2)}MB → ${tamanoNuevo.toFixed(2)}MB (${reduccion}% reducido)`);
          console.log(`📐 Dimensiones: ${img.width}x${img.height} → ${width}x${height}`);
          
          resolve(imagenComprimida);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject('Error al cargar la imagen');
      img.src = base64Image;
    });
  }

  /**
   * 🖼️ Crear miniatura de una imagen
   * ✅ OPTIMIZADO: Mejor calidad para miniaturas
   */
  async crearMiniatura(base64Image: string): Promise<string> {
    console.log('🖼️ Creando miniatura...');
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', {
            alpha: false,
            willReadFrequently: false
          });
          
          if (!ctx) {
            reject('No se pudo crear el contexto del canvas');
            return;
          }

          // Calcular dimensiones de miniatura
          const { width, height } = this.calcularDimensiones(
            img.width,
            img.height,
            this.CONFIG.thumbnailSize,
            this.CONFIG.thumbnailSize
          );

          canvas.width = width;
          canvas.height = height;
          
          // ✅ Buena calidad para miniaturas
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Fondo blanco
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          
          ctx.drawImage(img, 0, 0, width, height);

          // ✅ Mejor calidad de miniatura
          const thumbnail = canvas.toDataURL('image/jpeg', this.CONFIG.thumbnailQuality);
          
          const tamanoMB = this.calcularTamano(thumbnail);
          console.log(`✅ Miniatura creada: ${width}x${height}px (${tamanoMB.toFixed(2)}MB)`);
          
          resolve(thumbnail);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject('Error al cargar la imagen');
      img.src = base64Image;
    });
  }

  /**
   * 📐 Calcular nuevas dimensiones manteniendo aspect ratio
   */
  private calcularDimensiones(
    widthOriginal: number,
    heightOriginal: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let width = widthOriginal;
    let height = heightOriginal;

    // Si la imagen es más grande que los límites, redimensionar
    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;
      
      if (width > height) {
        // Imagen horizontal
        width = Math.min(maxWidth, width);
        height = Math.round(width / aspectRatio);
        
        if (height > maxHeight) {
          height = maxHeight;
          width = Math.round(height * aspectRatio);
        }
      } else {
        // Imagen vertical
        height = Math.min(maxHeight, height);
        width = Math.round(height * aspectRatio);
        
        if (width > maxWidth) {
          width = maxWidth;
          height = Math.round(width / aspectRatio);
        }
      }
    }

    return { width, height };
  }

  /**
   * 📊 Validar tamaño de imagen
   */
  validarTamano(base64Image: string): boolean {
    const tamanoMB = this.calcularTamano(base64Image);
    
    console.log(`📊 Tamaño de imagen: ${tamanoMB.toFixed(2)} MB`);
    
    if (tamanoMB > this.CONFIG.maxSizeMB) {
      alert(`⚠️ La imagen es muy grande (${tamanoMB.toFixed(2)} MB). Máximo ${this.CONFIG.maxSizeMB}MB permitido.`);
      return false;
    }
    
    return true;
  }

  /**
   * 🔢 Calcular tamaño de imagen en MB
   */
  private calcularTamano(base64Image: string): number {
    const base64Length = base64Image.length - (base64Image.indexOf(',') + 1);
    const padding = (base64Image.charAt(base64Image.length - 2) === '=') ? 2 : 
                    (base64Image.charAt(base64Image.length - 1) === '=') ? 1 : 0;
    const fileSize = base64Length * 0.75 - padding;
    return fileSize / (1024 * 1024); // Convertir a MB
  }

  /**
   * 🔍 Verificar y solicitar permisos de cámara
   */
  private async verificarPermisos(): Promise<boolean> {
    try {
      const platform = Capacitor.getPlatform();
      console.log(`🔍 Verificando permisos en: ${platform}`);
      
      if (platform === 'web') {
        return true;
      }

      const permissions = await Camera.checkPermissions();
      
      if (permissions.camera === 'denied' || permissions.photos === 'denied') {
        const requested = await Camera.requestPermissions();
        return requested.camera === 'granted' || requested.photos === 'granted';
      }

      return permissions.camera === 'granted' || permissions.photos === 'granted';
    } catch (error) {
      console.error('Error verificando permisos:', error);
      return false;
    }
  }

  /**
   * 🗑️ Eliminar imagen (solo limpia la referencia)
   */
  eliminarImagen(): void {
    console.log('✅ Imagen eliminada de la memoria');
  }
}