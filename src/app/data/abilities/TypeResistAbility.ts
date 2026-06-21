import { LoadedAbility } from "@/app/data/loadedDataClasses";
import { TectonicData } from "../tectonic/TectonicData";
import { MatchupModifyAbility } from "./MatchupModifyAbility";

const halfDmgAbilities: Record<string, string[]> = {
    EXORCIST: ["PSYCHIC", "GHOST"],
    FEATHERCOAT: ["ICE", "FLYING"],
    REALIST: ["DRAGON", "FAIRY", "GHOST"],
    TOUGH: ["FIGHTING", "ROCK"],
    UNAFRAID: ["DARK", "BUG"],
    THICKFAT: ["FIRE", "ICE"],
    WATERBUBBLE: ["FIRE"],
    STEAMPOWER: ["WATER"],
    THERMOSTASIS: ["FIRE", "ICE"],
};

export class TypeResistAbility extends MatchupModifyAbility {
    matchup = 0.5;
    constructor(ability: LoadedAbility) {
        super(ability);
        this.affectedTypes = halfDmgAbilities[ability.key].map((t) => TectonicData.types[t]);
    }

    static abilityIds = Object.keys(halfDmgAbilities);
}
