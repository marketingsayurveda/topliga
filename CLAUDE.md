1. Quitar el canonical y ajustar indexación

Solo en index.html — los otros dos ya traen noindex según el README:

Borra o cambia <link rel="canonical" href="..."> si apunta a topliga.sk. No indexable no debe tener canonical hacia otro dominio.
Cambia <meta name="robots" content="index,follow"> a noindex, nofollow.
Crea robots.txt en la raíz con Disallow: /, mismo patrón que Ayurveda. 3. La integración de formularios — el bloque grande

Esto es lo que anticipamos que era trabajo real. Ve a assets/js/forms.js, función sendRegistration() al final del archivo. Ahí hay un ejemplo comentado con fetch — pero no lo uses tal cual, porque necesitas que Netlify detecte el formulario en build time, y eso requiere un formulario estático oculto en el HTML.

En cada uno de los dos HTML de registro, agrega justo antes de cerrar </body>:

html

<form name="registracia-tim" data-netlify="true" netlify-honeypot="bot-field" hidden>
  <input type="text" name="meno" />
  <input type="email" name="email" />
  <!-- un input por cada campo real del formulario -->
  <input type="text" name="bot-field" />
</form>

Nombre distinto en cada página (registracia-tim y registracia-jednotlivec), así separas las notificaciones si hace falta.

Después, en sendRegistration(), cambia el cuerpo para que haga POST a Netlify en formato x-www-form-urlencoded, con el form-name correspondiente incluido en el body. Yo dejaría fuera del envío los tres campos de tipo file (logo, foto de equipo, perfil) — tal como sugiere el propio README, son opcionales y meterlos complica el envío con FormData/multipart justo cuando hay poco margen de tiempo.

Cuando termines esta parte, pruébalo localmente no sirve — Netlify Forms solo funciona en un deploy real. Vas a tener que subir y probar directo ahí.

2. Footer y contacto

En los 3 archivos, reemplaza el placeholder info@topliga.sk por lo que confirmes con Adam (todavía no llegó el email final de notificaciones — usa el mismo adamnemcikeu@gmail.com que dio como temporal si no hay otro, y anótalo pendiente).

3. Links legales — BLOQUEADO, no avances aquí todavía

Adam solo mandó el link de GDPR. Faltan reglas del juego y tabla de multas. No pongas el link de GDPR en las tres casillas del checkbox como parche — espera su respuesta o el consentimiento queda mal formado. Puedes dejar avanzado todo lo demás mientras tanto.

4. Fecha límite y og:image

Revisa assets/js/main.js, el array DEADLINES al inicio, y confirma que las fechas (17.8 y 31.8) sean correctas según lo que Adam ya validó.

Genera o pide el og:image de 1200×630px. Si no llega a tiempo, lanza sin él y agrégalo después — no bloquea funcionalidad, solo el preview social.

5. Estructura de carpetas y deploy

Como es un proyecto nuevo (no hay migración de contenido previo en este repo), estructura desde cero:

/
├── index.html
├── registracia-timu.html
├── registracia-jednotlivca.html
├── assets/
│ ├── css/style.css
│ ├── js/main.js
│ ├── js/forms.js
│ └── img/znak.png
├── robots.txt
└── \_redirects (solo si necesitas manejar el path del subdominio)

Sobre el \_redirects: aquí no aplica el mismo truco de Ayurveda porque no hay path tipo /ayurveda — Adam no mencionó ningún subpath para go.topliga.sk, la landing va directo en la raíz del subdominio. Confírmalo con él si tienes duda, pero por ahora asume raíz.
