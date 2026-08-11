// ============================================================================
// Seed de canciones extraídas de PDFs aportados. Antes vivía como un endpoint
// GET admin-only en app/api/admin/seed-canciones/route.ts — una tarea de
// carga de datos de una sola vez no necesita ser una ruta HTTP permanente en
// producción; se movió acá para que siga el mismo patrón que los demás
// scripts/seed-canciones*.ts (idempotente por nombre, batcheado).
//
// Uso:  npx tsx --env-file=.env.local scripts/seed-canciones-pdfs.ts
// ============================================================================

import { inArray } from "drizzle-orm";
import { db } from "../db/index";
import { canciones } from "../db/schema";

const DATA = [
  // ── 1. Clamo a Cristo ──────────────────────────────────────────────────────
  {
    nombre: "Clamo a Cristo",
    artista: "Elevation Español Worship",
    metrica: "4/4",
    estado_aprobacion: "APROBADA" as const,
    letra: `[VERSO 1]
Tu nombre Jesús
Calma toda tempestad
Tu nombre Jesús
Vida a lo muerto da
Tu nombre Jesús
Es el que puede salvar
Y es digno de adorar

[CORO]
Clamo a Cristo
Clamo al nombre que sana
Reina en poder y victoria
Algo resucitará
Cada vez que clamo a Cristo
Clamo al nombre que salva
Digno de toda la gloria
Algo resucitará
Cada vez que clamo a Él

[VERSO 2]
Tengo un Rey
Que a la muerte conquistó
Las llaves Él
Con sus manos las tomó
Y con poder
La serpiente aplastó
Resucitado Gran Yo Soy

[CORO]

[VAMP] (2x)
Cadenas caen
Cada vez que clamo a Él
Demonios huyen
Cada vez que clamo a Él

[PUENTE 1]
Muerte ya no reinas más
Tumba hoy vacía estás
Muerte ya no reinas más
Tumba hoy vacía estás
Muerte ya no reinas más
Tumba hoy vacía estás

[PUENTE 2] (4x)
Lo muerto vivirá
Lo muerto vivirá
Lo muerto vivirá
En tu nombre Cristo

[CORO]
[VAMP]
[PUENTE 2] (2x)`,
    charts: `[INTRO]
C  |  C  |  Gm  |  F

[VERSO 1]
    C
Tu nombre Jesús
   Bb              F
Calma toda tempestad
    C
Tu nombre Jesús
   Bb          F
Vida a lo muerto da
    C
Tu nombre Jesús
   Bb                F
Es el que puede salvar
   Bb         F
Y es digno de adorar

[CORO]
     C
Clamo a Cristo
        Bb
Clamo al nombre que sana
  F
Reina en poder y victoria
     Bb
Algo resucitará
  F             C
Cada vez que clamo a Cristo
        Bb
Clamo al nombre que salva
  F
Digno de toda la gloria
     Bb
Algo resucitará
F    C
Cada vez que clamo a Él

[VAMP 1]
C
Cadenas caen
            Bb/C   F/C
Cada vez que clamo a Él
  Fm/C              C
Demonios huyen
            Bb/C   F/C
Cada vez que clamo a Él

[INSTRUMENTAL]
C  |  C  |  Gm  |  F  (x2)

[PUENTE 1]
C        Gm    F
Muerte ya no reinas más
C        Gm    F
Tumba hoy vacía estás

[PUENTE 2]
C
Lo muerto vivirá
C
Lo muerto vivirá
Bb
Lo muerto vivirá
      F
En tu nombre Cristo

[VAMP 2]
C          Gm
Cadenas caen
F                  C
Cada vez que clamo a Él
      Gm
Demonios huyen
F                  C
Cada vez que clamo a Él`,
  },

  // ── 2. Ven Ante Su Trono ───────────────────────────────────────────────────
  {
    nombre: "Ven Ante Su Trono",
    artista: "Elevation Worship",
    metrica: "4/4",
    estado_aprobacion: "APROBADA" as const,
    letra: `[VERSO 1]
Si abatido y dolido estás
Y cansado del peso cargar
Cristo nos llama
Si al final del camino estás
Sin saber hacia dónde mirar
Cristo nos llama

[CORO]
Ven ante su trono
El Padre te recibirá
Con sangre preciosa
Jesús borró nuestra maldad

[VERSO 2]
Deja atrás tu vergüenza y pesar
Ven a Él ya no esperes más
Cristo nos llama
Trae toda tristeza al altar
Nueva Vida Jesús te dará
Cristo nos llama

[CORO] (x2)

[PUENTE] (x2)
¡Oh cuán hermoso!
Es nuestro Salvador
Canta Aleluya, Cristo vive
Nadie es más grande
Solo Él es el Señor
Canta Aleluya, Cristo vive

[CORO] (x2)

[VERSO 3]
Hasta un día llegar frente a Él
De su amor a todos contaré`,
    charts: `[INTRO] — Key: B
1  |  4  |  1  |  4

[VERSO 1]
1          4        1
Si abatido y dolido estás
    4              6m
Y cansado del peso cargar
4
Cristo nos llama
1            4       1
Si al final del camino estás
4                6m
Sin saber hacia dónde mirar
4
Cristo nos llama

[CORO]
1    2m    6m
Ven ante su trono
        4       1
El Padre te recibirá
1     2m    6m
Con sangre preciosa
        4        1
Jesús borró nuestra maldad

[VUELTA]
1  |  4  |  1  |  4

[PUENTE]
     1
¡Oh cuán hermoso!
        6m
Es nuestro Salvador
    4              1
Canta Aleluya, Cristo vive
    1
Nadie es más grande
       6m
Solo Él es el Señor
    4              1
Canta Aleluya, Cristo vive

[VUELTA] (x2)
1  |  2m  |  6m  |  4  |  1

[VERSO 3]
1        4        1
Hasta un día llegar frente a Él
b7    4        1
De su amor a todos contaré

[OUTRO]
1  |  4  |  1  |  4  |  1`,
  },

  // ── 3. Mi Esperanza Está en Jesús ─────────────────────────────────────────
  {
    nombre: "Mi Esperanza Está en Jesús",
    artista: "Por confirmar",
    bpm: 72,
    metrica: "4/4",
    estado_aprobacion: "APROBADA" as const,
    letra: `[VERSO 1]
Un gran abismo nos separaba
Y un gran monte alto y sin fin
Desesperado yo me encontraba
Hasta que tú viniste a mí

[PRE-CORO 1]
Y en las tinieblas tu amor perfecto
Quitó la sombra de mi ser
Cumpliste toda promesa escrita
Mi esperanza está en Jesús

[VERSO 2]
Quién pensaría tan grande gracia
Que no puedo entender
El Dios eterno bajó del cielo
Para cargar con mi dolor

[PRE-CORO 2]
La cruz ha hablado, soy perdonado
Me ha redimido el Salvador
Hermoso Cristo soy tuyo y siempre
Mi esperanza está en Jesús

[CORO]
O Aleluya, gloria a quien me liberó
Aleluya, a la muerte derrotó
Las cadenas Él rompió
Y en su nombre hay salvación
Mi esperanza está en Jesús

[VERSO 3]
Por la mañana del tercer día
Su cuerpo inerte volvió a vivir
El León rugiente rompió el silencio
Y de la tumba se levantó
La victoria es tuya, oh Dios`,
    charts: `[VERSO] — Key: LA (A)
LA          MI
Un gran abismo nos separaba
    RE        FAm        MI
Y un gran monte alto y sin fin
LA          LA
Desesperado yo me encontraba
    RE        FAm    MI
Hasta que tú viniste a mí

[PRE-CORO]
RE              MI     LA
Y en las tinieblas tu amor perfecto
LA
Quitó la sombra de mi ser
RE          MI
Cumpliste toda promesa escrita
FAm               MI
Mi esperanza está en Jesús

[CORO]
RE        MI          LA         FAm
O Aleluya, gloria a quien me liberó
RE        MI          LA
Aleluya, a la muerte derrotó
     RE          MI
Las cadenas Él rompió
         LA           FAm
Y en su nombre hay salvación
RE              MI
Mi esperanza está en Jesús`,
  },

  // ── 4. Quién Más ──────────────────────────────────────────────────────────
  {
    nombre: "Quién Más",
    artista: "Gateway Worship Español",
    bpm: 68,
    metrica: "4/4",
    estado_aprobacion: "APROBADA" as const,
    letra: `[VERSO 1]
Un instrumento soy de exaltación
Y yo nací para Tu nombre levantar
Tú escuchas el cantar de la creación
Mas hay una canción que yo te puedo dar

[CORO]
Quién más es digno
Quién más es digno
No hay nadie solo Tú Cristo
Quién más es digno
Quién más es digno
No hay nadie solo Tú Cristo

[VERSO 2]
Dios infinito eres eterno
Mas escogiste habitar en mi interior
Sanaste mi dolor, Tu gloria he visto
Con gratitud yo cantaré en adoración

[CORO] (x2)

[PUENTE] (x3)
Cordero ungido reinará
Quien fue, quien es y quien vendrá
Sentado en el trono está
Santo santo
Siendo justo se entregó
Cuán grande amor nos demostró
Exaltado en majestad
Santo santo

[CORO]

[TAG] (x2)
No hay nadie solo Tú Cristo

[CORO] (x2)`,
    charts: `[VERSO] — Key: Ab
   Ab              Eb
Un instrumento soy de exaltación
    Fm7      Eb        Db9
Y yo nací para tu nombre levantar
   Ab                    Eb
Tú escuchas el cantar de la creación
    Fm7       Eb           Db9
Mas hay una canción que yo te puedo dar

[CORO]
    Ab
Quién más es digno
       Bbm7
Quién más es digno
    Fm7           Db9
No hay nadie, solo Tú, Cristo

[PUENTE]
    Db9
Cordero ungido, reinará
       Eb/G
Quien fue, quien es y quien vendrá
    Fm7
Sentado en el trono está
Ab        Eb
Santo, oh santo
Db9
Siendo justo se entregó
       Eb/G
Cuán grande amor nos demostró
    Fm7
Exaltado en majestad
Ab        Eb
Santo, oh santo`,
  },

  // ── 5. Tú Lo Llenas Todo ──────────────────────────────────────────────────
  {
    nombre: "Tú Lo Llenas Todo",
    artista: "Michael Bunster",
    metrica: "4/4",
    estado_aprobacion: "APROBADA" as const,
    letra: `[VERSO 1]
El universo gira en torno a Ti
Toda tu obra se postra
Ante tu majestad
Ante tu autoridad
Toda tormenta se sujeta a Ti
Mis pensamientos se rinden
Ante tu autoridad
Al Príncipe de paz

[CORO]
¡Tú lo llenas todo!
¡Tú lo llenas todo!
Tú eres el centro
El universo te adora
¡Tú lo ordenas todo!
¡Tú lo ordenas todo!
Tú eres el centro
El universo te adora

[PUENTE]
Porque el Señor es rey
Vestido en majestad
Más poderoso es
Que el estruendo del mar
Firme en su trono es
Por la eternidad
La creación cantará

[PUENTE 2]
Tu verdad gobierna, tu verdad gobierna
Tu reino está aquí, tu reino está aquí
Tu gloria reina, tu gloria reina
Tu justicia está aquí
Tu gobierno está aquí`,
    charts: `[VERSO]
(acordes por confirmar — tono original por confirmar)

[CORO]
¡Tú lo llenas todo!
¡Tú lo llenas todo!
Tú eres el centro
El universo te adora
¡Tú lo ordenas todo!
¡Tú lo ordenas todo!

[PUENTE]
Porque el Señor es rey
Vestido en majestad`,
  },

  // ── 6. La Orla de Su Manto (Yo Vi al Señor) ───────────────────────────────
  {
    nombre: "La Orla de Su Manto",
    artista: "Ccint Music",
    metrica: "4/4",
    estado_aprobacion: "APROBADA" as const,
    letra: `[VERSO 1]
Yo vi al Señor
Sentado en su trono
Vestido de Gloria
En lo alto está

[VERSO 2]
Y la orla de su manto
Llenaba el templo
Y sus Ángeles rodeando
Clamando están

[CORO]
Cantamos tú eres Santo
Oh tan Santo
Eres Santo oh Señor`,
    charts: `[VERSO 1] — Key: B
B
Yo vi al Señor
        G#m
Sentado en su trono
    E         C#m
Vestido de Gloria
       F#
En lo alto está

[VERSO 2]
    G#m          B
Y la orla de su manto
        G#m
Llenaba el templo
    E             C#m
Y sus Ángeles rodeando
       F#
Clamando están

[CORO]
           B
Cantamos tú eres Santo
G#m
Oh tan Santo
E      C#m    F#
Eres Santo oh Señor`,
  },
];

// Idempotente (por nombre) y batcheado — igual patrón que los otros scripts/seed-canciones*.ts.
async function seed() {
  console.log(`\nSeed: ${DATA.length} canciones (PDFs aportados)\n`);

  const existentes = new Set(
    (await db
      .select({ nombre: canciones.nombre })
      .from(canciones)
      .where(inArray(canciones.nombre, DATA.map((c) => c.nombre))))
      .map((r) => r.nombre),
  );

  const nuevas = DATA.filter((c) => !existentes.has(c.nombre));

  for (const c of DATA) {
    console.log(existentes.has(c.nombre) ? `  = ${c.nombre} (ya existía, salteada)` : `  ✓ ${c.nombre}`);
  }

  if (nuevas.length > 0) {
    await db.insert(canciones).values(nuevas);
  }

  console.log(`\n${nuevas.length} canciones insertadas, ${existentes.size} salteadas.\n`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error en seed:", err);
  process.exit(1);
});
