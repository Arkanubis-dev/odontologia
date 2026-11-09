# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Consultantes (pacientes)**: personas que buscan acompañamiento psicológico profesional, confidencial y empático en terapia individual, de pareja o laboral.
- **Psicóloga especialista** (Dra. Alejandra Bedoya / Dra. Alyson López Sánchez): gestionando sesiones clínicas, evaluaciones, tareas terapéuticas, seguimiento emocional y chat en tiempo real.
- **Super Administrador**: gestionando la plataforma, usuarios, citas, disponibilidad horaria y asignación de roles.

## Product Purpose
Proporcionar un espacio digital cálido, seguro y accesible que humaniza la consulta terapéutica: agendamiento de citas presenciales o virtuales con Google Meet, registro del diario emocional con reflexiones guiadas, asignación y seguimiento de tareas terapéuticas, chat en vivo sincronizado y calificaciones transparentes del servicio.

## Positioning
Una plataforma terapéutica diseñada desde la serenidad y la cercanía humana, alejada de la frialdad médica tradicional o de plantillas corporativas genéricas. Cada interacción transmite calma, privacidad y rigor clínico.

## Operating Context
- Pacientes en momentos de vulnerabilidad o búsqueda de claridad emocional que acceden principalmente desde móviles (70%+) o computadores personales.
- Sesiones sincronizadas con Google Calendar / Google Meet y comunicación confidencial en tiempo real.
- Portal privado para pacientes y panel de control integral para especialistas y administración.

## Capabilities and Constraints
- Autenticación segura mediante Supabase Auth (Google OAuth y correo/contraseña).
- Citas con estados: Pendiente, Confirmado, Finalizado, Cancelado.
- Diario emocional con escala de ánimo y notas de introspección.
- Chat en vivo sincronizado con indicador de presencia en tiempo real.
- Calificaciones y testimonios reales tras finalizar sesiones.
- Restricción visual: paleta de colores terapéutica cálida (`#031926`, `#468189`, `#77ACA2`, `#9DBEBB`, `#F4E9CD`, `#FBF8F1`), cero "AI slop", sin bordes gruesos de costado (`border-l-4`), sin animaciones rebotantes estridentes.

## Brand Commitments
- Nombre: Alejandra Bedoya | Psicología Laboral & Terapéutica.
- Tono de voz: empático, respetuoso, reflexivo, claro y profesional.
- Confidencialidad y calidez como premisas innegociables.

## Evidence on Hand
- Código fuente en Next.js (App Router, Turbopack, Tailwind CSS).
- Base de datos relacional Supabase con esquemas de citas, perfiles, tareas, registro emocional y calificaciones.
- Fotos y perfiles de especialistas reales.

## Product Principles
1. **Calma ante todo**: la interfaz reduce la ansiedad con espacios limpios, tonos naturales y tipografía legible.
2. **Claridad y franqueza**: las acciones terapéuticas y de citas son transparentes y directas, sin fricción cognitiva.
3. **Privacidad como valor**: cada dato personal, nota emocional y mensaje se trata con la máxima confidencialidad.
4. **Respeto al dispositivo**: fluidez absoluta en móvil sin desplazamientos bruscos, zoom involuntario o elementos fuera de lugar.

