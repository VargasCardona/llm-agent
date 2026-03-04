# 🛠️ DevToolkit Agent

Agente conversacional de utilidades para desarrolladores, construido con **NestJS** y **Gemini 2.0 Flash** (Google AI). El usuario interactúa vía chat en lenguaje natural y el agente ejecuta herramientas de desarrollo automáticamente.

---

## 1. Descripción general del producto

**DevToolkit** es una aplicación web que expone un chat inteligente con un agente de IA especializado en utilidades de desarrollo. Resuelve tareas cotidianas de programadores — generar identificadores únicos, contraseñas seguras, hashes criptográficos, codificar/decodificar Base64, convertir entre timestamps y fechas, validar JSON y convertir colores — todo a través de lenguaje natural, sin necesidad de recordar comandos ni abrir múltiples herramientas online.

**Stack tecnológico:**
- **Backend:** NestJS (TypeScript) + Google Generative AI SDK
- **Frontend:** HTML/CSS/JS (chat UI con tema oscuro)
- **LLM:** Gemini 2.0 Flash con function calling (tool use)
- **Persistencia:** Chat history en archivo JSON local

## 2. Descripción general del agente

El agente funciona con un esquema de **tool use / function calling**:

1. El usuario escribe un mensaje en lenguaje natural (ej: "Genera 5 UUIDs").
2. El backend envía el mensaje a Gemini junto con las declaraciones de 8 herramientas.
3. Gemini analiza la intención y decide si necesita invocar una herramienta.
4. Si invoca una herramienta, el backend ejecuta la función localmente (sin LLM) y retorna el resultado a Gemini.
5. Gemini formula una respuesta natural incluyendo el resultado y la envía al usuario.
6. Se registra el consumo de tokens (entrada y salida) en cada interacción.

El agente mantiene historial de conversación (últimos 20 mensajes) para dar contexto a las respuestas.

### Arquitectura del proyecto

```
agent/
├── .env                            # API Key de Gemini
├── public/
│   └── index.html                  # Chat UI (HTML/CSS/JS)
└── src/
    ├── main.ts                     # Bootstrap NestJS + CORS
    ├── app.module.ts               # Root module (Config, ServeStatic, Chat)
    ├── chat/
    │   ├── chat.module.ts          # Módulo de chat
    │   ├── chat.controller.ts      # POST /api/chat, DELETE /api/history
    │   └── chat.service.ts         # Integración con Gemini + orquestación de tools
    └── tools/
        ├── tools.module.ts         # Módulo de herramientas
        ├── tools.service.ts        # Implementación de las 8 herramientas
        └── tool-declarations.ts    # Declaraciones de funciones para Gemini
```

## 3. ¿A qué público o usuarios está dirigido el agente?

- **Desarrolladores web** (frontend y backend) que necesitan generar IDs, contraseñas, hashes o convertir formatos rápidamente.
- **Estudiantes de ingeniería de software** que están aprendiendo sobre criptografía, codificación y formatos de datos.
- **DevOps / SysAdmins** que necesitan conversiones de timestamps, validación de JSON para configs, o generación de tokens.
- **Cualquier programador** que prefiera escribir "hashea 'hello world' con SHA256" en lugar de buscar la herramienta adecuada.

## 4. ¿Qué herramientas implementa?

| # | Herramienta | Descripción |
|---|-------------|-------------|
| 1 | `generateUUID` | Genera uno o más identificadores UUID v4 (hasta 50) |
| 2 | `generatePassword` | Genera contraseñas seguras con longitud y charset configurables (mayúsculas, minúsculas, números, símbolos) |
| 3 | `hashText` | Calcula el hash criptográfico de un texto con SHA256, SHA512 o MD5 |
| 4 | `base64Encode` | Codifica texto plano a Base64 |
| 5 | `base64Decode` | Decodifica una cadena Base64 a texto plano |
| 6 | `timestampConvert` | Convierte entre Unix timestamps (segundos/milisegundos), fechas ISO 8601 y formato legible. Soporta "now" para la hora actual |
| 7 | `jsonValidate` | Valida un string JSON y lo retorna formateado (pretty-print), o indica el error de parseo |
| 8 | `colorConvert` | Convierte colores entre formatos HEX y RGB (ambas direcciones). Soporta shorthand hex (#F00) |

Todas las herramientas son **funcionales** — ejecutan lógica real con Node.js crypto, Buffer y Date APIs.

## 5. Estimación de tokens por usuario por mes y su costo

**Cálculo por interacción:**
- Tokens de entrada promedio: ~500 tokens (system instruction + historial reciente de 20 mensajes + mensaje del usuario)
- Tokens de salida promedio: ~150 tokens
- Total por interacción: ~650 tokens
- Cuando se usa una herramienta hay 2 llamadas a Gemini, así que se duplica: ~1,300 tokens

**Cálculo mensual (usuario activo típico):**
- ~20 interacciones/día × 22 días laborales = 440 interacciones/mes
- Asumiendo 60% usan herramienta: (264 × 1,300) + (176 × 650) = **~457,600 tokens/mes/usuario**

**Costo con Gemini 2.0 Flash:**
- Input: $0.10 / 1M tokens
- Output: $0.40 / 1M tokens
- Estimado: ~320K input tokens × $0.10/1M + ~137K output tokens × $0.40/1M
- **≈ $0.087 USD/mes/usuario** (~$0.09)

## 6. Estimación de facturación total mensual

| Escenario | Usuarios activos | Costo/mes |
|-----------|-----------------|-----------|
| Pequeño (startup/equipo) | 50 | ~$4.35 USD |
| Mediano (empresa) | 500 | ~$43.50 USD |
| Grande (SaaS público) | 5,000 | ~$435 USD |
| Masivo | 50,000 | ~$4,350 USD |

Gemini 2.0 Flash es uno de los modelos más económicos del mercado, lo que hace viable el producto incluso con miles de usuarios.

## 7. ¿Qué técnicas de prompt aplica para reducir el consumo de tokens?

1. **System instruction conciso:** Las instrucciones del sistema están escritas como una lista compacta de reglas en una sola cadena, evitando párrafos extensos o ejemplos redundantes. (~80 tokens vs ~300+ de un prompt detallado).

2. **Historial recortado (sliding window):** Solo se envían los últimos 20 mensajes (`.slice(-20)`) como contexto, en lugar del historial completo. Esto pone un techo fijo al crecimiento del prompt.

3. **`maxOutputTokens: 1024`:** Se limita la longitud máxima de las respuestas de Gemini, evitando outputs desproporcionadamente largos.

4. **Instrucción de brevedad:** La regla "Keep answers short; avoid unnecessary filler" instruye al modelo a ser conciso, reduciendo tokens de salida.

5. **Respuesta en idioma del usuario:** Evita traducciones innecesarias que añadirían tokens extra.

## 8. ¿Qué otras estrategias podría aplicar para mitigar la facturación alta?

1. **Caché de resultados:** Si un usuario pide la misma operación dos veces (ej: mismo hash del mismo texto), devolver el resultado cacheado sin llamar a Gemini.

2. **Detección local de intención:** Para mensajes simples con patrones claros (ej: "genera un UUID"), ejecutar la herramienta directamente sin pasar por el LLM, ahorrando el 100% de tokens en esas interacciones.

3. **Rate limiting por usuario:** Limitar la cantidad de requests por minuto/hora para evitar abuso.

4. **Compresión/resumen de historial:** En lugar de enviar los últimos N mensajes literales, resumirlos periódicamente en un solo mensaje compacto.

5. **Modelo tiered:** Usar un modelo ultra-barato (Gemini Flash Lite) para el routing de herramientas simplesy reservar el modelo más capaz solo para conversaciones complejas.

6. **Batching de operaciones:** Permitir al usuario pedir múltiples operaciones en un solo mensaje ("genera 3 UUIDs, hashea 'test' con MD5 y convierte #FF0000 a RGB") para reducir el overhead de múltiples llamadas.

7. **Cuotas de uso gratuito + plan de pago:** Ofrecer un límite de tokens gratuitos por mes y cobrar por uso adicional, trasladando parte del costo.

## 9. ¿Sería viable y/o pertinente usar diferentes LLM en su agente?

**Sí, es viable y altamente recomendable.** Estrategias concretas:

| Modelo | Uso sugerido | Razón |
|--------|-------------|-------|
| **Gemini 2.0 Flash** (actual) | Tool calling + respuestas generales | Excelente relación costo/velocidad, buen soporte de function calling |
| **Gemini Flash Lite** | Routing simple de herramientas | Aún más barato para detectar qué tool usar |
| **GPT-4o-mini** | Fallback / comparación | Alternativa confiable si Gemini tiene downtime |
| **Claude Haiku** | Respuestas conversacionales sin tools | Muy bueno en instrucciones y bajo costo |
| **Modelo local (Ollama + Llama)** | Desarrollo/testing sin costo | Ideal para pruebas sin gastar en API |

**Implementación:**
- Se podría usar un **router LLM** que envíe queries simples de herramientas al modelo más barato y queries conversacionales complejas al modelo más capaz.
- La arquitectura actual con NestJS facilita esto: basta con crear un `LlmRouterService` que elija el modelo según la complejidad detectada del mensaje.
- También sirve como **estrategia de resiliencia**: si un proveedor falla, se redirige al otro automáticamente.

---

## Configuración y ejecución

### Requisitos
- Node.js 18+
- API Key de Google Gemini

### Instalación

```bash
cd agent
npm install
```

### Configurar API Key

Editar el archivo `.env` en la raíz de `agent/`:

```
GEMINI_API_KEY=tu_api_key_aqui
```

### Ejecutar

```bash
# Modo desarrollo (watch)
npm run start:dev

# Modo producción
npm run build
npm run start:prod
```

Abrir **http://localhost:3000** en el navegador para acceder al chat.

### Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/chat` | Enviar mensaje (`{ "message": "texto" }`) |
| DELETE | `/api/history` | Limpiar historial de conversación |
