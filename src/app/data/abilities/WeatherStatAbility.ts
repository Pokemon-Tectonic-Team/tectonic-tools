import { LoadedAbility } from "@/app/data/loadedDataClasses";
import { BattleState } from "../battleState";
import { eclipseWeathers, hailWeathers, moonWeathers, rainWeathers, sandWeathers, sunWeathers, WeatherCondition } from "../conditions";
import { Ability } from "../tectonic/Ability";
import { Stat, Stats } from "../tectonic/Pokemon";

interface WeatherStatConfig {
    weathers: WeatherCondition[];
    boosts: [Stat, number][];
}

const weatherStatAbilities: Record<string, WeatherStatConfig> = {
    // Speed doublers
    CHLOROPHYLL: { weathers: sunWeathers, boosts: [["speed", 2]] },
    SWIFTSWIM: { weathers: rainWeathers, boosts: [["speed", 2]] },
    SANDRUSH: { weathers: sandWeathers, boosts: [["speed", 2]] },
    SLUSHRUSH: { weathers: hailWeathers, boosts: [["speed", 2]] },
    ANARCHIC: { weathers: eclipseWeathers, boosts: [["speed", 2]] },
    NIGHTLIFE: { weathers: moonWeathers, boosts: [["speed", 2]] },
    // Defense doublers
    DESERTARMOR: { weathers: sandWeathers, boosts: [["defense", 2]] },
    SAFEPASSAGE: { weathers: rainWeathers, boosts: [["defense", 2]] },
    SOLONOCTURNE: { weathers: moonWeathers, boosts: [["defense", 2]] },
    // SpDef doublers
    HEATVEIL: { weathers: sunWeathers, boosts: [["spdef", 2]] },
    ICEMIRROR: { weathers: hailWeathers, boosts: [["spdef", 2]] },
    WARPINGEFFECT: { weathers: eclipseWeathers, boosts: [["spdef", 2]] },
    // Single stat 1.3x
    SUNCHASER: { weathers: sunWeathers, boosts: [["attack", 1.3]] },
    EARTHSHAKER: { weathers: sandWeathers, boosts: [["attack", 1.3]] },
    SLEETSHAKER: { weathers: hailWeathers, boosts: [["attack", 1.3]] },
    LUNATIC: { weathers: moonWeathers, boosts: [["attack", 1.3]] },
    OVERWHELM: { weathers: rainWeathers, boosts: [["spatk", 1.3]] },
    FELLOMEN: { weathers: eclipseWeathers, boosts: [["spatk", 1.3]] },
    ILLUMINANCE: { weathers: moonWeathers, boosts: [["spatk", 1.3]] },
    SUMMITSPIRIT: { weathers: hailWeathers, boosts: [["spatk", 1.3]] },
    // Single stat 1.5x
    SOLARPOWER: { weathers: sunWeathers, boosts: [["spatk", 1.5]] },
    NIGHTSTALKER: { weathers: moonWeathers, boosts: [["attack", 1.5]] },
    // Multi-stat boosts
    SOLARCELL: { weathers: sunWeathers, boosts: [["spatk", 1.3], ["spdef", 1.3]] },
    CLOUDBURST: { weathers: rainWeathers, boosts: [["spatk", 1.3], ["speed", 1.3]] },
    FROSTFANGED: { weathers: hailWeathers, boosts: [["attack", 1.3], ["speed", 1.3]] },
    FLOWERGIFT: { weathers: sunWeathers, boosts: [["attack", 1.5], ["spdef", 1.5]] },
    TAIGATREKKER: { weathers: hailWeathers, boosts: [["speed", 1.5]] },
    SILVERLINING: { weathers: rainWeathers, boosts: [["speed", 1.5]] },
};

export class WeatherStatAbility extends Ability {
    private config: WeatherStatConfig;

    constructor(ability: LoadedAbility) {
        super(ability);
        this.config = weatherStatAbilities[ability.key];
    }

    public modifyStats(stats: Stats, battleState?: BattleState): Stats {
        if (battleState && this.config.weathers.includes(battleState.weather)) {
            for (const [stat, mult] of this.config.boosts) {
                stats[stat] *= mult;
            }
        }
        return stats;
    }

    static abilityIds = Object.keys(weatherStatAbilities);
}
