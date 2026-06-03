import { db } from "../db/index";
import { canciones } from "../db/schema";

const ALBUM = "When Wind Meets Fire (2024) — Elevation Worship";

const DATA = [
  {
    nombre: "What A Miracle",
    artista: "Elevation Worship feat. Chris Brown & Leeland Mooring",
    bpm: 67,
    metrica: "3/4",
    estado_aprobacion: "APROBADA" as const,
    letra: `[VERSE 1]
You said that You would never leave
You said that You would never go
My God who keeps His promises
Who stays when everyone else goes

[PRE-CHORUS]
It still amazes me
Still amazes me

[CHORUS]
What a miracle, what a miracle
What a miracle You are to me
What a miracle, what a miracle
That You would give Your life for me

[VERSE 2]
You came to find me in my shame
You spoke and called me by my name
The broken one became the bride
The one who was lost now stands in light

[PRE-CHORUS]
It still amazes me
Still amazes me

[CHORUS]

[BRIDGE]
What a God, what a God
Who would lay His glory down
What a God, what a God
Who would die to raise us up
What a miracle, what a miracle
What a miracle You are`,
    charts: `[INTRO]
1  4/1  |  6m  4  5

[VERSE]
1  4  1  |  6m  4  5
6m  5  |  4  2m
1/5  5  1  1sus

[PRE-CHORUS]
4  5  |  1  5
4  5  |  5sus  5

[CHORUS]
4  5  |  1  5/3  6m  1/3
4  5  |  6m  3m
4  5  |  1  5/3  6m  1/3
4  5  |  1sus  1

[BRIDGE]  (x3)
1sus  1  1sus  1  |  6m  5  4  2m

[BRIDGE 2]
1sus  1  |  4/3  1/5
1sus  1  |  6m  5  4  2m  (x2)

[TAG]
6m  5  4  2m
6m  5/3  4  2m`,
  },
  {
    nombre: "When Wind Meets Fire",
    artista: "Elevation Worship feat. Chris Brown & Tiffany Hudson",
    bpm: 167,
    metrica: "4/4",
    estado_aprobacion: "APROBADA" as const,
    letra: `[VERSE 1]
There's a sound of rushing wind
There's a roar from heaven's throne
Every nation, every tongue
Crying holy, You alone

[VERSE 2]
Tongues of fire on the field
Every dead thing coming to life
Let the Spirit breathe again
Every valley filled with light

[CHORUS]
When wind meets fire
Something holy rises higher
When the Spirit falls
Nothing, nothing stops it at all
Come breathe on us
Come wind and fire

[BRIDGE]
You are the wind, You are the fire
You are the breath in our lungs
You are the wind, You are the fire
Let Your glory come
Let Your glory come

[CHORUS]`,
    charts: `[INTRO]
1  |  4  |  b7  |  4

[VERSE]
1  |  4  |  b7  |  4  (x2)

[PRE-CHORUS]
1  |  4  |  b7  |  5

[CHORUS]
1  |  4  |  b7  |  5  (x2)
1  |  4  |  5  |  5

[BRIDGE]
4  |  b7  |  1  |  1  (x4)

[TAG]
1  |  4  |  b7  |  4  (x2)`,
  },
  {
    nombre: "Sure Been Good",
    artista: "Elevation Worship",
    bpm: 68,
    metrica: "4/4",
    estado_aprobacion: "APROBADA" as const,
    letra: `[VERSE 1]
I've seen mountains bow before You
I've seen rivers part and oceans still
I've seen chains fall off in darkness
Every promise You have kept fulfilled

[VERSE 2]
Through the valley You were faithful
Every sorrow You redeemed for joy
I have nothing I could give You
But this life I lay before Your throne

[CHORUS]
Sure been good, sure been good
Every moment of my life
Sure been good, sure been good
Every moment You've been right here by my side

[BRIDGE]
All my life You've been so faithful
All my days You've been so good
Every morning, every evening
Your mercy always understood
Sure been good`,
    charts: `[VERSE]
1  |  4  |  6m  |  5  (x2)

[PRE-CHORUS]
6m  |  4  |  1  |  5

[CHORUS]
1  |  4  |  1  |  5
1  |  4  |  5sus  5

[BRIDGE]
4  |  1  |  5  |  6m
4  |  1  |  5  |  5  (x2)`,
  },
  {
    nombre: "Faithful Then / Faithful Now",
    artista: "Elevation Worship feat. Chris Brown",
    bpm: 72,
    metrica: "4/4",
    estado_aprobacion: "APROBADA" as const,
    letra: `[VERSE 1]
God of Abraham, of Isaac
Every promise kept throughout the years
Mountains moved and seas were parted
Your faithfulness will never disappear

[VERSE 2]
Through the fire and through the desert
Standing still when all around would fall
You have never once forsaken
And You'll never turn Your back at all

[CHORUS]
Faithful then and faithful now
Faithful forever, never changing
Faithful then and faithful now
Yesterday, today, forever You're the same

[BRIDGE]
What You said You will do
Every word of truth will stand
What You said You will do
It's all resting in Your hands
Faithful God, faithful God
Faithful then and faithful now`,
    charts: `[VERSE]
1  |  5  |  6m  |  4  (x2)

[PRE-CHORUS]
6m  |  4  |  1  |  5

[CHORUS]
1  |  4  |  1  |  5
1  |  4  |  5sus  5

[BRIDGE]
4  |  1  |  5  |  6m
4  |  1  |  5  |  5  (x3)`,
  },
  {
    nombre: "God Is Not Against Me",
    artista: "Elevation Worship",
    bpm: 76,
    metrica: "4/4",
    estado_aprobacion: "APROBADA" as const,
    letra: `[VERSE 1]
Through the trials and the darkness
Through the seasons I can't see
I have learned this one conviction
God is working all things for me

[VERSE 2]
Nothing formed against will prosper
Every weapon falls right at my feet
I'm not fighting for a victory
I'm fighting from the one He's given me

[CHORUS]
God is not against me
God is not against me
He is for me, He is for me
Nothing in this world can ever separate
The love of God from me

[BRIDGE]
If God be for us
Who can stand against us
The cross has proved it
His love will never end
If God be for us
We are more than conquerors
Through Christ who loved us
His love will never end`,
    charts: `[VERSE]
1  |  4  |  6m  |  5  (x2)

[PRE-CHORUS]
6m  |  5  |  4  |  4

[CHORUS]
1  |  5  |  4  |  4
1  |  5  |  5sus  5

[BRIDGE]
6m  |  4  |  1  |  5  (x4)`,
  },
  {
    nombre: "Great Is",
    artista: "Elevation Worship feat. Jenna Barrientes",
    bpm: 73,
    metrica: "4/4",
    estado_aprobacion: "APROBADA" as const,
    letra: `[VERSE 1]
Morning by morning new mercies I see
All I have needed Your hand has provided
Great is Your faithfulness, Lord, unto me

[VERSE 2]
Pardon for sin and a peace that endures
Your own dear presence to cheer and to guide
Strength for today and bright hope for tomorrow

[CHORUS]
Great is Your faithfulness
Great is Your faithfulness
Morning by morning new mercies I see
All I have needed Your hand has provided
Great is Your faithfulness, Lord, unto me

[BRIDGE]
You have been faithful
You will be faithful
Faithful forever
Great is Your name
You have been faithful
You will be faithful
Every morning
Great is Your name`,
    charts: `[INTRO]
1  |  4  |  5  |  4

[VERSE]
1  |  4  |  6m  |  5  (x2)

[CHORUS]
1  |  4  |  5  |  6m
4  |  1  |  5  |  5

[BRIDGE]
4  |  1  |  5  |  6m  (x3)
4  |  5  |  1`,
  },
];

async function seed() {
  console.log(`\nSeed: ${ALBUM}\n`);

  for (const cancion of DATA) {
    await db.insert(canciones).values(cancion);
    console.log(`  ✓ ${cancion.nombre}`);
  }

  console.log(`\n${DATA.length} canciones insertadas.\n`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error en seed:", err);
  process.exit(1);
});
