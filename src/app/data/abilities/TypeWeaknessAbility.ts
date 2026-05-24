import { LoadedAbility } from "@/app/data/loadedDataClasses";
import { TectonicData } from "../tectonic/TectonicData";
import { MatchupModifyAbility } from "./MatchupModifyAbility";

const weaknessAbilities: Record<string, [number, string]> = {
    FLUFFY: [2, "FIRE"],
};

export class TypeWeaknessAbility extends MatchupModifyAbility {
    constructor(ability: LoadedAbility) {
        super(ability);
        this.matchup = weaknessAbilities[ability.key][0];
        this.affectedTypes = [TectonicData.types[weaknessAbilities[ability.key][1]]];
    }

    static abilityIds = Object.keys(weaknessAbilities);
}
