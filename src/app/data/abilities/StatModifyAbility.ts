import { LoadedAbility } from "@/app/data/loadedDataClasses";
import { Ability } from "../tectonic/Ability";
import { Stat, Stats } from "../tectonic/Pokemon";

// RADIATE works differently on live and dev - currently implementing live version
const statModifyAbilities: Record<string, [Stat, number]> = {
    RADIATE: ["spatk", 1.3],
    PUREFORCE: ["attack", 1.5],
    PUREENERGY: ["spatk", 1.5],
    DEEPSTING: ["attack", 1.5],
    COLDCALCULATION: ["spatk", 1.75],
    FEELTHEBURN: ["attack", 1.75],
    FLUSTERFLOCK: ["attack", 2],
    FUELHUNGRY: ["attack", 1.3],
    OVERTHINKING: ["spatk", 1.3],
    EXOTHERMENGINE: ["speed", 1.5],
    GORILLATACTICS: ["attack", 1.5],
    TOUGHCLAWS: ["attack", 1.3],
    ASSAULTSPINES: ["spdef", 2],
    ICESCALES: ["spdef", 2],
    FURCOAT: ["defense", 2],
};

export class StatModifyAbility extends Ability {
    private modifiedStat: Stat;
    private statMult: number;

    constructor(ability: LoadedAbility) {
        super(ability);
        this.modifiedStat = statModifyAbilities[ability.key][0];
        this.statMult = statModifyAbilities[ability.key][1];
    }

    public modifyStats(stats: Stats): Stats {
        stats[this.modifiedStat] *= this.statMult;
        return stats;
    }

    static abilityIds = Object.keys(statModifyAbilities);
}
