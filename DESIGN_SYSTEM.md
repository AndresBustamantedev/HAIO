# DESIGN_SYSTEM.md

> HAIO Design System
> Version: 1.0
> Última actualización: 2026-07-29

---

# Objetivo

El objetivo del Design System es mantener una interfaz consistente, moderna y escalable en toda la aplicación.

Todo componente nuevo debe seguir estas reglas antes de ser implementado.

---

# Filosofía

HAIO debe transmitir:

- Profesionalidad
- Simplicidad
- Rapidez
- Claridad
- Elegancia

Inspiración visual:

- Vercel
- Linear
- Stripe Dashboard
- Notion
- GitHub

Evitar interfaces recargadas.

---

# Colores

## Primario

```
Blue 600
#2563EB
```

Uso:

- Botones principales
- Enlaces
- Elementos activos

---

## Secundario

```
Slate 700
#334155
```

---

## Fondo

Modo claro

```
#FFFFFF
```

Modo oscuro

```
#0F172A
```

---

## Superficie

Claro

```
#F8FAFC
```

Oscuro

```
#1E293B
```

---

## Estados

Éxito

```
#16A34A
```

Advertencia

```
#F59E0B
```

Error

```
#DC2626
```

Información

```
#2563EB
```

---

# Tipografía

Fuente principal

```
Geist
```

Fallback

```
Inter
```

Fallback final

```
sans-serif
```

---

## Tamaños

| Elemento | Tamaño |
|----------|---------|
| H1 | 36px |
| H2 | 30px |
| H3 | 24px |
| H4 | 20px |
| Texto | 16px |
| Pequeño | 14px |
| Caption | 12px |

---

# Espaciado

Sistema basado en 4px.

```
4
8
12
16
20
24
32
40
48
64
```

---

# Bordes

Inputs

```
8px
```

Cards

```
12px
```

Modales

```
16px
```

---

# Sombras

Cards

```
shadow-sm
```

Dropdown

```
shadow-md
```

Modal

```
shadow-xl
```

---

# Iconografía

Utilizar exclusivamente:

Lucide React

No mezclar librerías.

---

# Botones

## Primary

Color azul.

Acción principal.

---

## Secondary

Fondo gris.

Acción secundaria.

---

## Outline

Borde únicamente.

---

## Ghost

Sin fondo.

---

## Destructive

Rojo.

Eliminar.

---

# Inputs

Todos los inputs deben incluir:

- Label
- Placeholder
- Validación
- Mensaje de error
- Estado disabled
- Estado loading

---

# Cards

Toda card debe contener:

- Título
- Contenido
- Acciones opcionales

Padding mínimo:

```
24px
```

---

# Tablas

Todas las tablas deben incluir:

- Búsqueda
- Ordenación
- Paginación
- Estados vacíos
- Loading
- Responsive

---

# Formularios

Agrupar información por bloques.

Ejemplo

Información general

Contacto

Dirección

Notas

---

# Estados

Cada componente debe soportar:

- Default
- Hover
- Focus
- Active
- Disabled
- Loading
- Error

---

# Feedback

Utilizar:

Toast

para acciones rápidas.

Dialog

para acciones críticas.

---

# Loading

Preferir Skeleton.

Evitar Spinner salvo procesos largos.

---

# Empty State

Debe incluir:

- Icono
- Título
- Descripción
- Acción principal

---

# Responsive

## Desktop

Sidebar expandida.

---

## Tablet

Sidebar colapsada.

---

## Mobile

Sidebar tipo Drawer.

---

# Dark Mode

Todos los componentes deben ser compatibles.

No utilizar colores fijos.

Siempre utilizar variables del tema.

---

# Accesibilidad

Todo componente debe:

- ser navegable con teclado
- tener focus visible
- cumplir contraste WCAG
- incluir atributos ARIA cuando sea necesario

---

# Animaciones

Duración

150ms - 250ms

Utilizar Motion.

Evitar animaciones excesivas.

---

# Convenciones

Todos los componentes deben ser:

- reutilizables
- tipados
- documentados
- independientes

No duplicar componentes.

---

# Regla final

Antes de crear un componente comprobar:

- ¿Ya existe uno similar?
- ¿Puede reutilizarse?
- ¿Respeta el Design System?
- ¿Funciona en móvil?
- ¿Funciona en modo oscuro?
- ¿Es accesible?