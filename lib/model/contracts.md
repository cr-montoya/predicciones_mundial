# contracts.md — Contratos estadísticos del modelo (fuente de verdad del analyst)

Este documento es la fuente de verdad para el developer y el reviewer en Fase 2.
Resuelve los 6 blockers del grill y los risks 3, 4 y 5. El developer implementa
estas fórmulas sin tomar decisiones estadísticas; cualquier desviación de lo
escrito aquí debe volver al analyst antes de implementarse.

Convenciones de tipos: todos los modelos consumen las entidades normalizadas de
`lib/types.ts` (`Team`, `Player`, `Fixture`, `MatchStats`, `MatchEvent`) y
devuelven siempre `ModelOutput`. `sanityCheck(output)` de `lib/types.ts` se
ejecuta sobre toda salida cuyo `probabilities` represente una distribución
completa (suma 1.0). Ver sección 7 para las excepciones.

Todas las constantes numéricas viven en un único módulo `lib/model/constants.ts`
para que el reviewer pueda auditarlas en un solo lugar. Los nombres en mayúsculas
de este documento son esas constantes.

---

## 1. Fórmula de lambda (Blocker 1 y 2)

### 1.1 Fórmula

Modelo Poisson bivariado estilo Dixon-Coles, sin término de corrección de
dependencia (tau) en v1 (se omite por simplicidad; entra en una v2 si el QA
detecta sesgo sistemático en marcadores bajos 0-0, 1-0, 0-1, 1-1).

```
lambdaHome = AVG_GOALS_PER_TEAM * attackHome * defenseAway * homeAdvantageHome * formHome
lambdaAway = AVG_GOALS_PER_TEAM * attackAway * defenseHome * 1.0            * formAway
```

Donde:
- `attackHome  = home.attackStrength`   (coeficiente relativo a la media, ~1.0)
- `attackAway  = away.attackStrength`
- `defenseHome = home.defenseStrength`  (mayor = peor defensa, concede más)
- `defenseAway = away.defenseStrength`
- `homeAdvantageHome = home.homeAdvantage` (solo se aplica al local; el visitante
  multiplica por 1.0 implícito). En Mundial casi todos juegan en campo neutral,
  por eso `homeAdvantage` es por equipo y vale 1.0 salvo anfitriones (USA,
  Canadá, México).
- `formHome`, `formAway`: ver 1.3.

### 1.2 AVG_GOALS_PER_TEAM

`AVG_GOALS_PER_TEAM = 1.35` — constante en `lib/model/constants.ts`.

Justificación: el promedio histórico de Mundiales recientes es ~2.7 goles
totales por partido, es decir ~1.35 por equipo por partido. Se usa el valor por
equipo (no el total) porque la fórmula produce un lambda por equipo. Es una
constante de código en v1, no un parámetro configurable por partido: no hay
input por partido que la justifique todavía. Se documenta como única perilla
global del modelo de goles, fácil de recalibrar en una v1.1 si el QA observa que
los totales proyectados se desvían del histórico.

Sanity de la fórmula: para dos equipos exactamente medios
(attack=defense=form=homeAdvantage=1.0), `lambdaHome = lambdaAway = 1.35`, total
esperado 2.70 goles/partido. Correcto respecto al histórico.

### 1.3 recentForm

`recentForm` ENTRA en v1 como multiplicador adicional directo sobre el lambda del
equipo (factor `formHome` / `formAway` arriba). No se pliega dentro de
`attackStrength`: se mantiene separado para que el reviewer pueda apagarlo
poniéndolo en 1.0 sin recomputar las fuerzas, y para que el origen del dato
(forma de últimos 5-10 partidos) quede trazable.

Rango admitido tras clamping: `[0.7, 1.3]`. Se clampa para que una racha
extrema no dispare el lambda fuera del rango físico del torneo.

Fallback (Risk 4): si `team.recentForm` es `null` (sin historial todavía),
`form = 1.0` (neutro, no penaliza ni premia). Confirmado.

```
formHome = clamp(home.recentForm ?? 1.0, 0.7, 1.3)
formAway = clamp(away.recentForm ?? 1.0, 0.7, 1.3)
```

### 1.4 Clamp final del lambda

Tras aplicar todos los factores:

```
lambdaHome = clamp(lambdaHome, LAMBDA_MIN, LAMBDA_MAX)
lambdaAway = clamp(lambdaAway, LAMBDA_MIN, LAMBDA_MAX)
```

`LAMBDA_MIN = 0.20`, `LAMBDA_MAX = 4.50`.

El rango operativo esperado de un lambda "sano" es `[0.5, 3.5]` (declarado en
`lib/types.ts`). El clamp es más ancho a propósito: solo es una red de seguridad
contra coeficientes corruptos en DB, no debe activarse en partidos normales. Si
el QA observa que el clamp se activa en un partido realista (p. ej. Brasil vs un
equipo muy débil), eso es señal de coeficientes mal calibrados en ingesta, no un
problema del modelo de goles. `LAMBDA_MIN > 0` garantiza que nunca hay lambda
cero o negativo (evita distribuciones degeneradas).

### 1.5 Ranking FIFA (Blocker 2)

`fifaRanking` SE OMITE en la fórmula de lambda en v1.

Razones:
1. En el seed inicial todos los equipos tienen `fifa_ranking = NULL`; incorporarlo
   ahora no aportaría señal y obligaría a inventar un fallback para 48 NULLs.
2. La fuerza relativa del rival ya está capturada por `attackStrength` y
   `defenseStrength`, que son la vía estadísticamente correcta de meter calidad
   de equipo en un Poisson. Añadir el ranking encima sería doble conteo de la
   misma señal.

El campo `fifaRanking` permanece en DB y en `lib/types.ts` para uso futuro. Si en
una v2 se quiere usar como prior cuando faltan partidos históricos, la conversión
recomendada (no implementada en v1) sería un multiplicador log-normalizado sobre
los 48 equipos: `rankFactor(rank) = 1 + K * (log(49 - rank) - mean_log) / std_log`,
con `K` pequeño (~0.10). Queda documentado como nota, NO se implementa.

### 1.6 Inputs de DB que necesita el modelo de lambda

Del registro `Team` (tabla `teams`) para local y visitante:
`attackStrength`, `defenseStrength`, `homeAdvantage`, `recentForm`. No requiere
joins adicionales: las fuerzas ya vienen calculadas en ingesta a partir de
`avgGoalsScored` / `avgGoalsConceded`. El modelo de goles NO lee `fixtures`
terminados directamente; consume el `Team` ya normalizado.

---

## 2. Matriz de marcadores — MAX_GOALS (Blocker 3)

`MAX_GOALS = 8` — constante en `lib/model/constants.ts`.

La matriz de marcadores es `(MAX_GOALS + 1) x (MAX_GOALS + 1) = 9 x 9 = 81`
celdas. Celda `[i][j] = Poisson(i; lambdaHome) * Poisson(j; lambdaAway)`,
asumiendo independencia entre goles de local y visitante (válido en v1 sin tau).

Justificación de 8: para el lambda más alto realista (`LAMBDA_MAX = 4.5`), la
masa acumulada de la Poisson hasta k=8 es ~0.9998. Para lambdas típicos (<=3.5)
la cola perdida es despreciable. 81 celdas es trivial de computar 10.000+ veces.

### 2.1 Renormalización obligatoria

Como se trunca en MAX_GOALS, falta una fracción mínima de masa en las colas. El
modelo DEBE renormalizar dividiendo cada celda por la suma total de la matriz
ANTES de derivar cualquier mercado:

```
total = sum(matrix)            // ~0.9996..0.99999
matrix[i][j] /= total          // ahora sum(matrix) == 1.0 exacto
```

Sin esta renormalización, `sanityCheck` de mercados derivados podría fallar por
acumulación de la masa truncada. La renormalización es lo que garantiza que 1X2,
over/under, BTTS y marcador exacto sumen 1.0 ±0.001.

### 2.2 Derivación de mercados desde la matriz

- `result_1x2`: home = suma celdas i>j; draw = suma i==j; away = suma i<j.
- `double_chance`: 1X = home+draw; 12 = home+away; X2 = draw+away (cada salida es
  un mercado binario, ver nota sanityCheck en sección 7.4).
- `over_under_goals` (líneas 1.5, 2.5, 3.5): over = suma celdas con i+j > línea;
  under = 1 - over. Una salida por línea.
- `btts`: yes = suma celdas i>=1 y j>=1; no = 1 - yes.
- `exact_score`: top 5 celdas por probabilidad. Ver sección 7.3 (NO suma 1.0).
- `clean_sheet`: por equipo. cleanSheetHome = suma celdas j==0;
  cleanSheetAway = suma celdas i==0. Ver 7.4 (mercados binarios independientes).

---

## 3. Tarjetas y corners (Blocker 4 / Risk 3)

`N_RECENT_MATCHES = 5` — ventana histórica para promedios (últimos 5 partidos del
equipo con datos en `match_stats`). Constante compartida con `recentForm`.

### 3.1 Tarjetas — CON historial

Índice de tarjetas ponderado por equipo (la roja pesa el doble que la amarilla):

```
cardIndex(teamId) = mean_over_last_N( yellowCards + 2 * redCards )
expectedTotalCards = cardIndex(home) + cardIndex(away)
expectedTotalCards *= STAGE_MULTIPLIER(round)
```

`STAGE_MULTIPLIER` (ajuste por importancia del partido):
- `group`        -> 1.00
- `round_of_32`  -> 1.05
- `round_of_16`  -> 1.10
- `quarter_final`-> 1.15
- `semi_final`   -> 1.20
- `final`        -> 1.20
- `round` null o desconocido -> 1.00

Justificación: la intensidad disciplinaria sube en eliminatorias; el tope 1.20
evita inflar en exceso. Estos multiplicadores son una perilla de calibración en
`constants.ts`.

Mercados de tarjetas (`total_cards`):
- Línea principal over/under **3.5** (de plan.md). El total de tarjetas se modela
  como una Poisson con `lambda = expectedTotalCards`:
  `over3.5 = 1 - PoissonCDF(3, lambda)`; `under3.5 = 1 - over3.5`. Suma 1.0.
- Probabilidad de al menos una roja se reporta como mercado binario aparte
  (ver 7.4), con `lambdaRed = mean_over_last_N(redCards)` por equipo sumado:
  `P(>=1 roja) = 1 - Poisson(0; lambdaRedHome + lambdaRedAway)`.

Confidence tarjetas con historial: `high` si ambos equipos tienen >= N_RECENT
partidos con `match_stats` no nulos; `medium` si al menos uno tiene entre 1 y
N_RECENT-1 partidos.

### 3.2 Tarjetas — SIN historial (fallback, Risk 3)

Cuando `match_stats` está vacío para uno o ambos equipos (estado inicial tras el
seed), no se promedia nada: se usa la media histórica del Mundial.

```
WC_AVG_YELLOW_PER_MATCH = 3.5   // amarillas por partido (total)
WC_AVG_RED_PER_MATCH    = 0.10  // rojas por partido (total)
expectedTotalCards = WC_AVG_YELLOW_PER_MATCH + 2 * WC_AVG_RED_PER_MATCH = 3.70
```

Sin STAGE_MULTIPLIER (no hay señal suficiente para ajustar). Mismas líneas
over/under 3.5 vía Poisson. Confidence: **low** (obligatorio).

### 3.3 Corners — CON historial

```
expectedCorners(teamId) = mean_over_last_N( corners )
expectedTotalCorners = expectedCorners(home) + expectedCorners(away)
```

Línea dinámica over/under: se redondea el total esperado al 0.5 más cercano.

```
cornersLine = roundToNearestHalf(expectedTotalCorners)
// roundToNearestHalf(x) = round(x * 2) / 2
```

Nota de corrección sobre el enunciado del blocker: el blocker propone
`median(...)` sobre una suma de dos escalares, lo que es indefinido (la mediana
de un solo número es ese número). La definición operativa correcta es: la línea
es el VALOR ESPERADO total redondeado al 0.5 más cercano. Se usa esa. Si en una
v2 se quiere una línea más robusta a outliers, se computará la mediana de la
DISTRIBUCIÓN simulada de corners totales, no de la suma de medias.

Mercado over/under corners vía Poisson con `lambda = expectedTotalCorners`:
`over = 1 - PoissonCDF(floor(cornersLine), lambda)`; `under = 1 - over`. Suma 1.0.
El campo de etiqueta del output incluye la línea usada (p. ej. `over_10.5`).

Confidence corners: misma regla que tarjetas (high / medium según cobertura de
`match_stats`).

### 3.4 Corners — SIN historial (fallback, Risk 3)

```
WC_AVG_CORNERS_PER_MATCH = 10.0   // corners totales por partido
expectedTotalCorners = 10.0
cornersLine = 10.5                 // roundToNearestHalf(10.0) = 10.0; línea estándar 10.5
```

Para evitar empates exactos sobre la línea entera, la línea de fallback se fija
en 10.5. Poisson con lambda 10.0. Confidence: **low** (obligatorio).

### 3.5 Inputs de DB para tarjetas y corners

De `match_stats` (join con `fixtures` para ordenar por `kickoffUtc` y tomar los
últimos N partidos terminados de cada equipo): `corners`, `yellowCards`,
`redCards`. Filtrar filas donde el valor relevante sea `null` (no cuentan como 0;
se ignoran de la media). Si tras el filtro quedan 0 partidos, se aplica el
fallback de 3.2 / 3.4.

---

## 4. Goleadores (Blocker 5)

Mercados: `anytime_scorer` (goleador en cualquier momento) y `first_scorer`
(primer goleador). `golden_boot` (Bota de Oro) se resuelve por Monte Carlo,
sección 5.

`MIN_MINUTES_ELIGIBLE = 90`. Un jugador con `minutesPlayed < 90` o
`goalsPerMinute == null` (muestra nula) se excluye del reparto.

### 4.1 Reparto del lambda del equipo entre jugadores

Para el equipo (local o visitante) con su `lambdaEquipo` ya calculado en sección 1:

```
elegibles = players(team).filter(p => p.minutesPlayed >= 90 && p.goalsPerMinute != null && p.goalsPerMinute > 0)
denom = sum(p.goalsPerMinute for p in elegibles)
weight(i)        = elegibles[i].goalsPerMinute / denom
expectedGoals(i) = weight(i) * lambdaEquipo
P(i anota >=1)   = 1 - Poisson(0; expectedGoals(i)) = 1 - exp(-expectedGoals(i))
```

`anytime_scorer`: el output lista `P(i anota >=1)` por jugador. Esto NO es una
distribución que sume 1.0 (varios jugadores pueden anotar en el mismo partido):
ver sección 7.2 para el tratamiento de `sanityCheck`.

`first_scorer` (aproximación v1): la probabilidad de que el jugador i sea el
primer goleador del partido es proporcional a su `expectedGoals(i)` sobre el
total de goles esperados de AMBOS equipos, más la probabilidad de que no haya
goles (mercado "sin goleador"):

```
lambdaMatch = lambdaHome + lambdaAway
P(sin goleador) = exp(-lambdaMatch)                 // P(0-0)
P(first = i)    = (1 - P(sin goleador)) * expectedGoals(i) / lambdaMatch
```

Esta sí es una distribución completa: `sum_i P(first=i) + P(sin goleador) == 1.0`
(porque `sum_i expectedGoals(i) == lambdaMatch` cuando todos los goles esperados
del partido se reparten entre jugadores elegibles de ambos equipos). El output de
`first_scorer` DEBE incluir la clave `no_scorer` con `P(sin goleador)` para que
`sanityCheck` pase.

Importante para que cuadre: el reparto reparte exactamente `lambdaHome` entre los
elegibles del local y `lambdaAway` entre los del visitante. Si un equipo no tiene
jugadores elegibles, su lambda no se reparte y rompería la normalización de
`first_scorer`; en ese caso ver 4.2.

### 4.2 Fallback — sin jugadores (Blocker 5)

Cuando la tabla `players` está vacía para un equipo (o ningún jugador alcanza
`MIN_MINUTES_ELIGIBLE`):

- `anytime_scorer`: `probabilities = {}` (objeto vacío), `confidence = 'low'`.
- `first_scorer`: si NINGUNO de los dos equipos tiene elegibles ->
  `probabilities = {}`, `confidence = 'low'`. Si solo un equipo tiene elegibles,
  se reparte solo su lambda y se ajusta la clave `no_scorer` para que la
  distribución cierre en 1.0:
  `P(no_scorer) = 1 - sum_i P(first=i)`. Esto reasigna implícitamente la masa del
  equipo sin datos a "sin goleador", que es la lectura honesta de "no sabemos
  quién anotaría por ese equipo". Confidence: `low`.

El objeto vacío `{}` es un estado válido y esperado, NO un error. El developer NO
debe rellenarlo con datos sintéticos.

### 4.3 Inputs de DB para goleadores

De `players` (tabla `players`, filtrar por `teamId`): `name`, `position`,
`goalsPerMinute`, `minutesPlayed`. El `lambdaEquipo` viene del modelo de goles
(sección 1), no de DB directamente.

---

## 5. Estructura del torneo para Monte Carlo (Blocker 6)

`MONTE_CARLO_ITERATIONS = 10000` (mínimo del CLAUDE.md). Recomendado 20000 si el
tiempo de cómputo lo permite, para estabilizar la cola de P(campeón) de equipos
poco probables. El developer puede subirlo; nunca bajarlo de 10000.

Cada iteración simula el torneo completo y cuenta frecuencias:
- `tournament_winner`: frecuencia de cada equipo como campeón / total iteraciones.
- `golden_boot`: en cada iteración, los goles simulados se reparten entre
  jugadores con los mismos pesos de la sección 4.1; se acumula el goleador del
  torneo y se cuenta frecuencia de Bota de Oro por jugador.

### 5.1 Simulación de un partido individual dentro de Monte Carlo

Se muestrean goles de cada equipo con su lambda (secciones 1) usando muestreo de
Poisson (`homeGoals ~ Poisson(lambdaHome)`, `awayGoals ~ Poisson(lambdaAway)`).
NO se usa la matriz truncada para muestrear (la matriz es para derivar mercados
exactos); el muestreo de Poisson nativo es correcto y no necesita MAX_GOALS.

### 5.2 Fase de grupos

12 grupos (A-L) de 4 equipos. Round robin: 6 partidos por grupo. Puntos
3/1/0. Desempate (orden): puntos, diferencia de goles, goles a favor, y como
último recurso un coin flip aleatorio (suficiente para Monte Carlo).

Clasifican: los 2 primeros de cada grupo (24 equipos) + los 8 mejores terceros
(32 equipos a ronda de 32). Los "8 mejores terceros" se ordenan por el mismo
criterio de desempate agregando puntos del tercero de cada grupo y se toman los 8
primeros.

### 5.3 Ronda de 32 en adelante — emparejamiento

DECISIÓN v1: **sorteo aleatorio entre los 32 clasificados** en cada iteración, NO
el bracket oficial FIFA.

Justificación: es pragmático, no introduce sesgo sistemático y es suficiente para
estimar P(campeón) y P(Bota de Oro), que es el objetivo. El bracket fijo cambiaría
la varianza de los caminos pero no de forma material para el ranking de campeón.
Se documenta como simplificación consciente; una v2 puede cargar el bracket
oficial una vez anunciado (el campo `Fixture.round` ya soporta las fases).

Restricción mínima del sorteo: emparejar evitando, cuando sea posible, que dos
equipos del mismo grupo se crucen en la ronda de 32 (réplica laxa de la regla
real). Si el sorteo aleatorio no encuentra acomodo en pocos intentos, se acepta
el cruce (no vale la pena un solver para Monte Carlo).

### 5.4 Eliminación directa

Round of 32 -> 16 -> octavos (round_of_16) -> cuartos -> semis -> final.
Eliminación directa estándar: el ganador de cada partido avanza.

### 5.5 Penaltis

Empate en 90 minutos -> penaltis. `P_PENALTY_HOME_WIN = 0.5` (coin flip 50/50).

Justificación: históricamente las tandas de penaltis en Mundiales no muestran una
ventaja estadísticamente significativa estable atribuible a la "fuerza" del
equipo; el 50/50 es el estimador honesto y no introduce sesgo. Es una constante
en `constants.ts`; si en una v2 se quiere modular por fuerza ofensiva, se
reemplaza por una función, pero v1 fija 0.5.

(En knockout no hay "local" real salvo anfitriones; el coin flip 50/50 ignora la
etiqueta home/away, que es lo correcto en campo neutral.)

---

## 6. Tabla de modelVersion (Risk 5)

Semver `major.minor`: minor sube al cambiar parámetros/constantes; major al
cambiar el enfoque matemático. Todos arrancan en `"1.0"`.

| Módulo / Model                                   | modelVersion |
|--------------------------------------------------|:------------:|
| Skill Poisson (poisson.ts, PMF/CDF, matriz)      | `1.0`        |
| Model result_1x2                                 | `1.0`        |
| Model double_chance                              | `1.0`        |
| Model over_under_goals                           | `1.0`        |
| Model btts                                       | `1.0`        |
| Model exact_score                                | `1.0`        |
| Model clean_sheet                                | `1.0`        |
| Model total_cards (cards.ts)                     | `1.0`        |
| Model corners (corners.ts)                       | `1.0`        |
| Model first_scorer / anytime_scorer (scorers.ts) | `1.0`        |
| Model tournament_winner / golden_boot (montecarlo.ts) | `1.0`   |

Reglas de bump:
- Cambiar `AVG_GOALS_PER_TEAM`, `STAGE_MULTIPLIER`, líneas, `N_RECENT_MATCHES`,
  rangos de clamp, etc. -> minor (p. ej. `1.1`).
- Introducir el término tau de Dixon-Coles, meter `fifaRanking` en el lambda,
  cambiar el muestreo del torneo, usar bracket oficial -> major (p. ej. `2.0`).

---

## 7. sanityCheck y distribuciones que NO suman 1.0

`sanityCheck` de `lib/types.ts` exige que `probabilities` sume 1.0 ±0.001. Eso es
correcto SOLO para mercados que son una distribución de probabilidad completa
sobre salidas mutuamente excluyentes y exhaustivas. Varios mercados de este
modelo NO lo son. Regla para el developer:

### 7.1 Mercados que SÍ deben pasar sanityCheck (suman 1.0)

`result_1x2`, `over_under_goals` (cada línea por separado: over+under=1),
`btts` (yes+no=1), `first_scorer` (incluyendo clave `no_scorer`),
`tournament_winner` (suma sobre 48 equipos = 1).

### 7.2 Mercados que NO suman 1.0 — no llamar al sanityCheck estándar

- `anytime_scorer`: cada jugador es un evento independiente "anota o no"; varios
  pueden anotar. La suma de `P(>=1)` puede exceder 1.0. NO ejecutar
  `sanityCheck`. En su lugar, validación propia: cada probabilidad en `[0, 1]`,
  y si hay elegibles, ninguna debe ser exactamente 0 ni exactamente 1
  (degenerada). El `{}` vacío del fallback (4.2) es válido y se salta toda
  validación de suma.
- `golden_boot`: es una distribución sobre jugadores y SÍ suma 1.0 (un único
  máximo goleador del torneo por iteración). Pasa sanityCheck. (Empates de Bota
  de Oro en una iteración se reparten en fracción 1/k entre los k empatados para
  preservar la suma.)

### 7.3 exact_score (top 5) — NO suma 1.0

`exact_score` devuelve solo los 5 marcadores más probables; su suma es <1.0 (el
resto de la masa está en marcadores no listados). NO ejecutar `sanityCheck`
estándar. Validación propia: cada probabilidad en `(0, 1)`, lista ordenada
descendente, y la suma de las 5 < 1.0. Opcionalmente el output puede incluir una
clave `other` con la masa restante para que sume 1.0; si se incluye, entonces sí
pasa sanityCheck. Decisión v1: incluir `other` y pasar sanityCheck (más limpio y
auditable).

### 7.4 Mercados binarios independientes — validar suma == 1.0 por par

- `double_chance`: 1X, 12, X2 NO son mutuamente excluyentes entre sí (suman 2.0
  en conjunto porque cada resultado simple cae en dos dobles). Modelar como TRES
  mercados binarios separados o como un único output donde se valida que
  `1X + X2 - X == 1` no aplica. Decisión v1: emitir `double_chance` como output
  informativo con las tres probabilidades y NO ejecutar sanityCheck de suma 1.0
  sobre las tres juntas. Validación propia: cada valor en `(0,1)` y coherencia
  `1X = home+draw`, `12 = home+away`, `X2 = draw+away` derivadas de `result_1x2`.
- `clean_sheet`: cleanSheetHome y cleanSheetAway son dos eventos independientes,
  no suman 1.0. Validación propia: ambos en `[0, 1]`.
- `P(>=1 roja)` (parte de tarjetas): evento binario único; se reporta como par
  {yes, no} que sí suma 1.0 y pasa sanityCheck.

### 7.5 Recomendación de implementación (para el developer)

Exponer dos validadores en el modelo:
1. `sanityCheck(output)` (ya existe en `lib/types.ts`): para los mercados de 7.1
   y los pares binarios que sí cierran (over/under, btts, >=1 roja, golden_boot).
2. `sanityCheckProbabilityBounds(output)` (nuevo, a definir en
   `lib/model/sanity.ts`): valida solo que cada probabilidad esté en `[0, 1]` y
   que no haya degeneradas (exactamente 0 o 1) cuando hay datos; acepta `{}`
   vacío. Se aplica a `anytime_scorer`, `exact_score` (si no se usa `other`),
   `double_chance`, `clean_sheet`.

El reviewer debe verificar que cada mercado llama al validador correcto según
esta sección.

---

## 8. Resumen de constantes (lib/model/constants.ts)

```
AVG_GOALS_PER_TEAM        = 1.35
LAMBDA_MIN                = 0.20
LAMBDA_MAX                = 4.50
FORM_MIN                  = 0.70
FORM_MAX                  = 1.30
MAX_GOALS                 = 8
N_RECENT_MATCHES          = 5
STAGE_MULTIPLIER          = { group:1.00, round_of_32:1.05, round_of_16:1.10,
                              quarter_final:1.15, semi_final:1.20, final:1.20 }
WC_AVG_YELLOW_PER_MATCH   = 3.5
WC_AVG_RED_PER_MATCH      = 0.10
WC_AVG_CORNERS_PER_MATCH  = 10.0
CORNERS_FALLBACK_LINE     = 10.5
CARDS_LINE                = 3.5
MIN_MINUTES_ELIGIBLE      = 90
MONTE_CARLO_ITERATIONS    = 10000
P_PENALTY_HOME_WIN        = 0.5
```

Toda constante recalibrable vive aquí. Cambiar cualquiera -> bump de minor en el
modelo afectado (sección 6).
