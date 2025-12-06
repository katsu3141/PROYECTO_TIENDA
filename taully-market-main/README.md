# 🛒 Taully Market: Aplicación de Gestión de Inventario y Ventas

## 📋 Descripción General

**Taully Market** es una aplicación multiplataforma diseñada para la gestión de productos, inventario, ventas (carrito de compras) y reportes. Construida con **Ionic** y **Angular**, utiliza **Capacitor** para ser desplegada como aplicación móvil nativa (Android/iOS) o como aplicación web (PWA).

[![GitHub](https://img.shields.io/badge/GitHub-katsu3141-blue?logo=github)](https://github.com/katsu3141/taully-market)
[![Angular](https://img.shields.io/badge/Angular-v17+-red?logo=angular)](https://angular.io/)
[![Ionic](https://img.shields.io/badge/Ionic-v7+-purple?logo=ionic)](https://ionicframework.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-ESM-blue?logo=typescript)](https://www.typescriptlang.org/)

---

## ✨ Características Principales

### Pila Tecnológica

- **Frontend:** Angular (TypeScript)
- **Framework Móvil:** Ionic Framework
- **Build Tool:** Capacitor (compilación nativa)
- **Autenticación:** [Especificar método: Local Storage, Firebase Auth, etc.]
- **Base de Datos Local:** [Especificar: SQLite, IndexedDB, memoria local, etc.]

### Módulos Implementados

| Ruta | Descripción |
|------|-------------|
| `/login` | Autenticación de usuarios y gestión de roles |
| `/home` | Panel principal y navegación |
| `/tienda` | Vista de productos para clientes |
| `/carrito` | Gestión y finalización de pedidos |
| `/productos-lista` | Vista de inventario para administradores |
| `/producto-form` | Formulario CRUD de productos |
| `/pedidos` | Historial de movimientos y transacciones |
| `/reportes` | Informes de ventas y movimientos |

---

## 🛠️ Instalación y Configuración

### 1. Requisitos Previos

Asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) (versión LTS recomendada)
- Angular CLI: `npm install -g @angular/cli`
- Ionic CLI: `npm install -g @ionic/cli`

### 2. Clonar el Repositorio

```bash
git clone https://github.com/katsu3141/taully-market.git
cd taully-market
```

### 3. Instalar Dependencias

```bash
npm install
```

Este comando descarga todas las dependencias necesarias desde `package.json`.

### 4. Ejecutar en Modo Desarrollo

```bash
ionic serve
```

La aplicación se iniciará en `http://localhost:8100/`

---

## 📱 Compilación para Móviles

### Preparar Build de Producción

```bash
npm run build
```

### Sincronizar con Capacitor

```bash
npx cap sync
```

### Abrir en IDE Nativo

**Para Android:**
```bash
npx cap open android
```

**Para iOS:**
```bash
npx cap open ios
```

> **Nota:** Requiere Android Studio o Xcode instalado según la plataforma.

---

## 🚀 Publicar Cambios en GitHub

### Agregar README al repositorio

```bash
git add README.md
```

### Crear commit

```bash
git commit -m "📝 Add detailed README and installation instructions"
```

### Subir cambios

```bash
git push
```

---

## 🤝 Autor

**Benjamin Nina**

- GitHub: [@katsu3141](https://github.com/katsu3141)

---

## 📄 Licencia

[Especificar licencia del proyecto: MIT, Apache 2.0, etc.]

---

## 🐛 Reportar Issues

Si encuentras algún problema o tienes sugerencias, por favor abre un [issue](https://github.com/katsu3141/taully-market/issues) en el repositorio.