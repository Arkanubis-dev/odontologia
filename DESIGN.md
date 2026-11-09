---
name: Alejandra Bedoya - Psicología
description: Sistema de diseño terapéutico basado en serenidad, tonos minerales y calidez clínica.
colors:
  midnight: "#031926"
  teal-slate: "#468189"
  sage: "#77ACA2"
  opal-soft: "#9DBEBB"
  linen: "#F4E9CD"
  porcelain: "#FBF8F1"
  white: "#FFFFFF"
typography:
  display:
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  sub:
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
  micro:
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
  caption:
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.midnight}"
    textColor: "{colors.white}"
    rounded: "{rounded.xl}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.teal-slate}"
  button-accent:
    backgroundColor: "{colors.teal-slate}"
    textColor: "{colors.white}"
    rounded: "{rounded.xl}"
    padding: "10px 20px"
  card-surface:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.xl}"
---

# Design System: Alejandra Bedoya Psicología

## 1. Direction and Philosophy
La experiencia visual de la clínica psicológica debe evocar paz mental, seguridad y profesionalismo.
Se destierra el "AI slop" (sombras pesadas con halos de color, bordes de 4px laterales estridentes, animaciones de rebote infantiles y fuentes del sistema sin personalidad). Cada elemento tiene un propósito terapéutico: reducir la carga cognitiva y acoger al consultante.

## 2. Color Palette & Semantics
- **Midnight Navy (`#031926`)**: Autoridad clínica, solidez, contraste y serenidad. Se usa en encabezados primarios, botones principales y fondos profundos.
- **Slate Teal (`#468189`)**: Color de acción y confianza. Vínculos activos, botones secundarios y acentos clave.
- **Sage (`#77ACA2`)**: Equilibrio emocional y bienestar. Indicadores de progreso, estados positivos y acentos suaves.
- **Soft Opal (`#9DBEBB`)**: Bordes sutiles, líneas divisorias tenues y fondos atenuados.
- **Cream Linen (`#F4E9CD`)**: Calidez humana y contención. Destacados amables y tarjetas de bienvenida.
- **Alabaster Porcelain (`#FBF8F1`)**: Lienzo principal de fondo. Cálido y orgánico, reduce la fatiga visual que produce el blanco puro frío.

## 3. Typography
- Pila de fuentes: `var(--font-geist-sans), system-ui, -apple-system, sans-serif`.
- Jerarquías nítidas con espaciado generoso sobre títulos y compacto bajo subtítulos.
- Métrica de lectura óptima: 60-75 caracteres por línea en reflexiones y notas emocionales.

## 4. Craft Floor Standards
- **Bordes**: Delicados y translúcidos (`border border-[#9DBEBB]/40`). Se prohíben bordes laterales gruesos (`border-l-4`).
- **Elevación**: Sombras suaves con desenfoque orgánico (`shadow-xs` a `shadow-md`), sin halos artificiales.
- **Micro-interacciones**: Transiciones con desaceleración natural (`transition-all duration-200 ease-out`), eliminando rebotes espasmódicos (`animate-bounce`).
- **Superficies del navegador**: Selección de texto personalizada (`::selection`), barras de desplazamiento estilizadas y foco accesible adaptado al color corporativo.
