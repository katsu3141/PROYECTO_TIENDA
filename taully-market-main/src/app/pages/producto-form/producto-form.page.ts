// src/app/pages/producto-form/producto-form.page.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonButton, IonBackButton, IonItem, IonLabel, IonInput,
  IonSelect, IonSelectOption, IonTextarea, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, IonList, 
  IonIcon, IonSpinner, IonActionSheet, IonProgressBar,
  LoadingController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cubeOutline, informationCircleOutline, calculatorOutline,
  saveOutline, closeOutline, imageOutline, cameraOutline,
  imagesOutline, trashOutline
} from 'ionicons/icons';
import { DatabaseService } from '../../services/database.service';
import { ImageService } from '../../services/image.service';
import { Producto, CATEGORIAS } from '../../models/producto.model';

@Component({
  selector: 'app-producto-form',
  templateUrl: './producto-form.page.html',
  styleUrls: ['./producto-form.page.scss'],
  standalone: true,
  imports: [
    IonProgressBar, IonActionSheet, IonSpinner,
    IonList, IonIcon,
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonButton, IonBackButton, IonItem, IonLabel, IonInput,
    IonSelect, IonSelectOption, IonTextarea, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent
  ]
})
export class ProductoFormPage implements OnInit, OnDestroy {
  producto: Producto = {
    nombre: '',
    categoria: '',
    precio: 0,
    stock: 0,
    descripcion: '',
    imagen: undefined,
    imagenThumbnail: undefined,
    tieneImagen: false
  };

  categorias = CATEGORIAS;
  modoEdicion = false;
  productoId?: number;
  cargandoImagen = false;
  progresoImagen = 0;
  mostrarOpcionesImagen = false;
  
  // ✅ Control de loading
  private loadingElement: HTMLIonLoadingElement | null = null;

  // Botones del Action Sheet
  botonesImagen = [
    {
      text: 'Tomar Foto',
      icon: 'camera-outline',
      handler: () => {
        this.tomarFoto();
      }
    },
    {
      text: 'Elegir de Galería',
      icon: 'images-outline',
      handler: () => {
        this.seleccionarDeGaleria();
      }
    },
    {
      text: 'Cancelar',
      role: 'cancel',
      icon: 'close-outline'
    }
  ];

  constructor(
    private dbService: DatabaseService,
    private imageService: ImageService,
    private router: Router,
    private route: ActivatedRoute,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      cubeOutline,
      informationCircleOutline,
      calculatorOutline,
      saveOutline,
      closeOutline,
      imageOutline,
      cameraOutline,
      imagesOutline,
      trashOutline
    });
  }

  async ngOnInit() {
    console.log('🎬 Inicializando formulario de producto...');
    
    this.productoId = Number(this.route.snapshot.paramMap.get('id'));
    
    if (this.productoId && !isNaN(this.productoId)) {
      this.modoEdicion = true;
      await this.cargarProducto();
    } else {
      // ✅ Modo creación: limpiar formulario
      this.limpiarFormulario();
      console.log('📝 Formulario limpio para nuevo producto');
    }
  }

  ngOnDestroy() {
    // ✅ Limpiar loading si existe
    this.cerrarLoading();
    console.log('🧹 Componente destruido y recursos liberados');
  }

  /**
   * 🧹 Limpiar formulario completamente
   */
  private limpiarFormulario() {
    this.producto = {
      nombre: '',
      categoria: '',
      precio: 0,
      stock: 0,
      descripcion: '',
      imagen: undefined,
      imagenThumbnail: undefined,
      tieneImagen: false
    };
    this.cargandoImagen = false;
    this.progresoImagen = 0;
    this.modoEdicion = false;
    this.productoId = undefined;
  }

  /**
   * 📥 Cargar producto existente
   */
  async cargarProducto() {
    if (!this.productoId) return;
    
    const loading = await this.loadingCtrl.create({
      message: 'Cargando producto...',
      spinner: 'crescent',
      duration: 5000
    });
    
    try {
      await loading.present();
      console.log(`📥 Cargando producto ID: ${this.productoId}`);
      
      const producto = await this.dbService.getProducto(this.productoId);
      
      if (producto) {
        // ✅ Asignar producto (clonar para evitar referencias)
        this.producto = { ...producto };
        
        console.log('✅ Producto cargado:', {
          id: producto.id,
          nombre: producto.nombre,
          tieneImagen: producto.tieneImagen,
          tamanoImagen: producto.imagen ? (producto.imagen.length / 1024 / 1024).toFixed(2) + ' MB' : 'Sin imagen'
        });
        
        // ✅ Forzar detección de cambios
        this.cdr.detectChanges();
      }
      
      await loading.dismiss();
      
    } catch (error) {
      console.error('❌ Error cargando producto:', error);
      await loading.dismiss();
      await this.mostrarToast('Error al cargar el producto', 'danger');
    }
  }

  /**
   * 📸 Mostrar opciones de imagen
   */
  abrirOpcionesImagen() {
    if (this.cargandoImagen) {
      console.log('⚠️ Ya hay una imagen cargándose');
      return;
    }
    this.mostrarOpcionesImagen = true;
  }

  /**
   * 📷 Tomar foto con la cámara
   */
  async tomarFoto() {
    this.mostrarOpcionesImagen = false;
    await this.seleccionarImagen(true);
  }

  /**
   * 🖼️ Seleccionar desde galería
   */
  async seleccionarDeGaleria() {
    this.mostrarOpcionesImagen = false;
    await this.seleccionarImagen(false);
  }

  /**
   * 🎨 Método principal para seleccionar/capturar imagen
   * ✅ FIXED: Manejo robusto de estados y loading
   */
  private async seleccionarImagen(useCamera: boolean) {
    // ✅ Prevenir múltiples cargas simultáneas
    if (this.cargandoImagen) {
      console.log('⚠️ Ya hay una carga en proceso');
      return;
    }
    
    // ✅ Timeout de seguridad - cerrar loading después de 15 segundos
    const timeoutId = setTimeout(async () => {
      console.log('⏰ Timeout alcanzado - cerrando loading forzadamente');
      await this.cerrarLoading();
      this.resetearEstadoCarga();
      this.cdr.detectChanges();
    }, 15000);
    
    try {
      // ✅ Activar estado de carga
      this.cargandoImagen = true;
      this.progresoImagen = 0;
      this.cdr.detectChanges(); // ✅ Forzar actualización inmediata
      
      // ✅ Crear loading con timeout
      this.loadingElement = await this.loadingCtrl.create({
        message: 'Procesando imagen...',
        spinner: 'crescent',
        duration: 10000 // 10 segundos máximo
      });
      
      await this.loadingElement.present();
      
      // Paso 1: Seleccionar imagen (33%)
      this.progresoImagen = 0.33;
      console.log('🔄 Paso 1: Seleccionando imagen...');
      
      const imagenBase64 = await this.imageService.seleccionarImagen(useCamera);
      
      // Usuario canceló
      if (!imagenBase64) {
        console.log('⚠️ No se seleccionó ninguna imagen');
        clearTimeout(timeoutId); // ✅ Limpiar timeout
        await this.cerrarLoading();
        this.resetearEstadoCarga();
        this.cdr.detectChanges(); // ✅ CRÍTICO: Forzar actualización de UI
        return;
      }

      // Paso 2: Validar tamaño (66%)
      this.progresoImagen = 0.66;
      console.log('🔄 Paso 2: Validando tamaño...');
      
      if (!this.imageService.validarTamano(imagenBase64)) {
        console.log('❌ Imagen muy grande');
        clearTimeout(timeoutId); // ✅ Limpiar timeout
        await this.cerrarLoading();
        this.resetearEstadoCarga();
        this.cdr.detectChanges(); // ✅ CRÍTICO: Forzar actualización de UI
        return;
      }

      // Paso 3: Crear miniatura (100%)
      if (this.loadingElement) {
        this.loadingElement.message = 'Creando miniatura...';
      }
      console.log('🔄 Paso 3: Creando miniatura...');
      
      const thumbnail = await this.imageService.crearMiniatura(imagenBase64);
      this.progresoImagen = 1;

      // ✅ Asignar al producto
      this.producto.imagen = imagenBase64;
      this.producto.imagenThumbnail = thumbnail;
      this.producto.tieneImagen = true;

      console.log('✅ Imagen procesada exitosamente');
      console.log('📊 Tamaño imagen:', (imagenBase64.length / 1024 / 1024).toFixed(2), 'MB');
      console.log('📊 Tamaño miniatura:', (thumbnail.length / 1024 / 1024).toFixed(2), 'MB');
      
      // ✅ Limpiar timeout y cerrar loading
      clearTimeout(timeoutId);
      await this.cerrarLoading();
      this.resetearEstadoCarga();
      
      // ✅ Forzar actualización de vista
      this.cdr.detectChanges();
      
      await this.mostrarToast('✅ Imagen cargada correctamente', 'success');
      
    } catch (error: any) {
      console.error('❌ Error seleccionando imagen:', error);
      
      clearTimeout(timeoutId); // ✅ Limpiar timeout
      await this.cerrarLoading();
      this.resetearEstadoCarga();
      this.cdr.detectChanges(); // ✅ CRÍTICO: Forzar actualización de UI
      
      // ✅ Detectar cancelación del usuario (múltiples casos)
      const errorMsg = error.message || error.toString() || '';
      const isCancelled = 
        errorMsg.includes('cancel') || 
        errorMsg.includes('User cancelled') ||
        error.code === 'USER_CANCELLED' ||
        error.name === 'CapacitorException';
      
      if (!isCancelled) {
        // Solo mostrar error si NO fue cancelación
        await this.mostrarToast('Error al cargar la imagen', 'danger');
      } else {
        console.log('✅ Cancelación manejada correctamente');
      }
    }
  }

  /**
   * 🔄 Resetear estado de carga
   */
  private resetearEstadoCarga() {
    this.cargandoImagen = false;
    this.progresoImagen = 0;
    this.mostrarOpcionesImagen = false; // ✅ También cerrar action sheet
    console.log('🔄 Estado de carga reseteado');
  }

  /**
   * 🔒 Cerrar loading de forma segura
   */
  private async cerrarLoading() {
    if (this.loadingElement) {
      try {
        await this.loadingElement.dismiss();
        this.loadingElement = null;
        console.log('✅ Loading cerrado');
      } catch (error) {
        console.log('⚠️ Loading ya estaba cerrado');
        this.loadingElement = null;
      }
    }
  }

  /**
   * 🗑️ Eliminar imagen del producto
   */
  async eliminarImagen() {
    // Prevenir eliminación durante carga
    if (this.cargandoImagen) {
      await this.mostrarToast('Espera a que termine la carga actual', 'warning');
      return;
    }
    
    const confirmacion = await this.mostrarConfirmacion(
      '¿Estás seguro de eliminar la imagen?'
    );
    
    if (confirmacion) {
      // ✅ Limpiar todas las referencias
      this.producto.imagen = undefined;
      this.producto.imagenThumbnail = undefined;
      this.producto.tieneImagen = false;
      
      this.imageService.eliminarImagen();
      
      // ✅ Forzar actualización
      this.cdr.detectChanges();
      
      await this.mostrarToast('Imagen eliminada', 'warning');
      console.log('✅ Imagen eliminada del producto');
    }
  }

  /**
   * 💾 Guardar producto
   */
  async guardarProducto() {
    if (!this.validarFormulario()) {
      return;
    }

    // Prevenir guardado durante carga de imagen
    if (this.cargandoImagen) {
      await this.mostrarToast('Espera a que termine de cargar la imagen', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.modoEdicion ? 'Actualizando...' : 'Guardando...',
      spinner: 'crescent'
    });

    try {
      await loading.present();

      if (this.modoEdicion && this.productoId) {
        this.producto.id = this.productoId;
        await this.dbService.actualizarProducto(this.producto);
        await loading.dismiss();
        await this.mostrarToast('✅ Producto actualizado', 'success');
      } else {
        await this.dbService.crearProducto(this.producto);
        await loading.dismiss();
        await this.mostrarToast('✅ Producto creado', 'success');
      }

      // ✅ Limpiar y navegar
      this.limpiarFormulario();
      this.router.navigate(['/productos']);
      
    } catch (error) {
      await loading.dismiss();
      console.error('Error guardando producto:', error);
      await this.mostrarToast('❌ Error al guardar', 'danger');
    }
  }

  /**
   * ✅ Validar formulario
   */
  validarFormulario(): boolean {
    if (!this.producto.nombre || this.producto.nombre.trim() === '') {
      this.mostrarToast('⚠️ El nombre es obligatorio', 'warning');
      return false;
    }

    if (!this.producto.categoria || this.producto.categoria === '') {
      this.mostrarToast('⚠️ Selecciona una categoría', 'warning');
      return false;
    }

    if (this.producto.precio <= 0) {
      this.mostrarToast('⚠️ El precio debe ser mayor a 0', 'warning');
      return false;
    }

    if (this.producto.stock < 0) {
      this.mostrarToast('⚠️ El stock no puede ser negativo', 'warning');
      return false;
    }

    return true;
  }

  /**
   * ❌ Cancelar edición
   */
  async cancelar() {
    // Confirmar si hay cambios
    if (this.producto.nombre || this.producto.tieneImagen) {
      const confirmar = await this.mostrarConfirmacion(
        '¿Descartas los cambios realizados?'
      );
      
      if (!confirmar) {
        return;
      }
    }
    
    // ✅ Limpiar todo y volver
    await this.cerrarLoading();
    this.limpiarFormulario();
    this.router.navigate(['/home']);
  }

  /**
   * 🍞 Mostrar toast
   */
  private async mostrarToast(mensaje: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }

  /**
   * ❓ Mostrar confirmación
   */
  private async mostrarConfirmacion(mensaje: string): Promise<boolean> {
    return new Promise((resolve) => {
      const confirmacion = confirm(mensaje);
      resolve(confirmacion);
    });
  }
}