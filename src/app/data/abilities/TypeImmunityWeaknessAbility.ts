import { LoadedAbility } from "@/app/data/loadedDataClasses";
import { PokemonType } from "../tectonic/PokemonType";
import { TectonicData } from "../tectonic/TectonicData";
import { MatchupModifyAbility } from "./MatchupModifyAbility";

const immunityWeaknessAbilities: Record<string, string[]> = {
    // immune type first, weak type second
    DRYSKIN: ["WATER", "FIRE"],
    FINESUGAR: ["FIRE", "WATER"],
};

export class TypeImmunityWeaknessAbility extends MatchupModifyAbility {
    constructor(ability: LoadedAbility) {
        super(ability);
        this.affectedTypes = immunityWeaknessAbilities[ability.key].map((t) => TectonicData.types[t]);
    }

    public modifiedMatchup(type: PokemonType) {
        return this.affectsType(type) ? (this.affectedTypes.findIndex((t) => t.id === type.id) === 0 ? 0 : 1.25) : 1;
    }

    static abilityIds = Object.keys(immunityWeaknessAbilities);
}
