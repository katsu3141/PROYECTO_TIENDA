// src/app/services/carrito.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Producto } from '../models/producto.model';

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private carritoSubject = new BehaviorSubject<ItemCarrito[]>([]);
  public carrito$: Observable<ItemCarrito[]> = this.carritoSubject.asObservable();

  constructor() {
    // Cargar carrito del localStorage si existe
    this.cargarCarritoDesdeStorage();
  }

  private cargarCarritoDesdeStorage() {
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
      try {
        const carrito = JSON.parse(carritoGuardado);
        this.carritoSubject.next(carrito);
      } catch (error) {
        console.error('Error al cargar carrito:', error);
      }
    }
  }

  private guardarCarritoEnStorage() {
    localStorage.setItem('carrito', JSON.stringify(this.carritoSubject.value));
  }

  agregarProducto(producto: Producto, cantidad: number = 1) {
    const carritoActual = this.carritoSubject.value;
    const itemExistente = carritoActual.find(item => item.producto.id === producto.id);

    if (itemExistente) {
      itemExistente.cantidad += cantidad;
    } else {
      carritoActual.push({ producto, cantidad });
    }

    this.carritoSubject.next([...carritoActual]);
    this.guardarCarritoEnStorage();
  }

  eliminarProducto(productoId: number) {
    const carritoActual = this.carritoSubject.value.filter(
      item => item.producto.id !== productoId
    );
    this.carritoSubject.next(carritoActual);
    this.guardarCarritoEnStorage();
  }

  actualizarCantidad(productoId: number, cantidad: number) {
    if (cantidad <= 0) {
      this.eliminarProducto(productoId);
      return;
    }

    const carritoActual = this.carritoSubject.value;
    const item = carritoActual.find(i => i.producto.id === productoId);
    
    if (item) {
      item.cantidad = cantidad;
      this.carritoSubject.next([...carritoActual]);
      this.guardarCarritoEnStorage();
    }
  }

  getTotalItems(): number {
    return this.carritoSubject.value.reduce((total, item) => total + item.cantidad, 0);
  }

  getTotalPrecio(): number {
    return this.carritoSubject.value.reduce(
      (total, item) => total + (item.producto.precio * item.cantidad), 
      0
    );
  }

  limpiarCarrito() {
    this.carritoSubject.next([]);
    localStorage.removeItem('carrito');
  }

  getCarrito(): ItemCarrito[] {
    return this.carritoSubject.value;
  }
}