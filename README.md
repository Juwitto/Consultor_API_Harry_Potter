# Guía Interactiva: API Fetch en JavaScript & HP-API

Guía didáctica e interactiva para la asignatura Diseño de Sistemas de Internet. Explica cómo consumir servicios web asíncronos en JavaScript con la API nativa `fetch()`, usando la API pública de Harry Potter (`https://hp-api.onrender.com/api`).

---

##  Estructura del Proyecto

```text
harry-potter-fetch/
├── index.html         # Página principal: laboratorio interactivo y guía teórica
├── css/
│   └── styles.css     # Diseño nocturno con pergamino y colores de cada casa
├── js/
│   └── app.js         # Consumo de la API, métricas, filtrado y renderizado
└── README.md          # Documentación del proyecto
```

---

##  Características

1. **Laboratorio de peticiones en vivo:** consulta personajes por casa (Gryffindor, Slytherin, Ravenclaw, Hufflepuff), estudiantes, profesores y hechizos.
2. **Tema por casa:** al elegir una casa, el laboratorio cambia sus colores.
3. **Medición de rendimiento:** muestra el estado HTTP, la latencia en milisegundos, el tipo de contenido y la cantidad de registros recibidos.
4. **Doble implementación:** el mismo flujo con `async/await` y con promesas (`.then / .catch`).
5. **Filtro en el navegador:** busca por nombre sobre los datos ya descargados, sin repetir la petición.
6. **Visor de código y JSON:** pestañas para ver la respuesta bruta y el código JavaScript ejecutado.
7. **Seguridad básica:** los textos de la API se escapan con `esc()` antes de insertarse con `innerHTML`.

---

##  Endpoints usados

| Endpoint | Devuelve |
| --- | --- |
| `/api/characters/house/:casa` | Personajes de una casa |
| `/api/characters/students` | Estudiantes de Hogwarts |
| `/api/characters/staff` | Personal de Hogwarts |
| `/api/spells` | Hechizos con su descripción |

Cada endpoint responde con un arreglo de objetos (a diferencia de PokéAPI, que devolvía un objeto por Pokémon).

>  La API está en un hosting gratuito que se "duerme" por inactividad. La primera petición puede tardar varios segundos.

---

## Resumen técnico: ¿cómo funciona `fetch()`?

### 1. Con `async / await` (sintaxis moderna)

```javascript
async function obtenerGryffindor() {
  const url = 'https://hp-api.onrender.com/api/characters/house/gryffindor';

  try {
    // 1. Iniciar la petición HTTP GET
    const respuesta = await fetch(url);

    // 2. Verificar el estado de la respuesta (200 OK)
    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }

    // 3. Convertir el cuerpo a JSON (un arreglo)
    const personajes = await respuesta.json();

    console.log('Total:', personajes.length);
    console.log('Primero:', personajes[0].name);
  } catch (error) {
    console.error('Error al realizar fetch:', error.message);
  }
}
```

### 2. Con promesas tradicionales (`.then() / .catch()`)

```javascript
function obtenerGryffindorConPromesas() {
  fetch('https://hp-api.onrender.com/api/characters/house/gryffindor')
    .then(respuesta => {
      if (!respuesta.ok) {
        throw new Error(`Error HTTP: ${respuesta.status}`);
      }
      return respuesta.json();
    })
    .then(personajes => {
      console.log('Total:', personajes.length);
    })
    .catch(error => {
      console.error('Error:', error.message);
    });
}
```

---

##  Cómo ejecutarlo

1. Abre la carpeta del proyecto en VS Code.
2. Abre `index.html` en el navegador (o usa la extensión **Live Server**).
3. Necesitas conexión a internet para consultar la API y cargar las fuentes de Google Fonts.

---
*© 2026 - Diseño de Sistemas de Internet | Universidad Nacional de Ingeniería*