import { LoadedAbility } from "@/app/data/loadedDataClasses";
import { TectonicData } from "../tectonic/TectonicData";
import { MatchupModifyAbility } from "./MatchupModifyAbility";

const immunityAbilities: Record<string, string[]> = {
    AERODYNAMIC: ["FLYING"],
    CHALLENGER: ["FIGHTING"],
    COLDRECEPTION: ["ICE"],
    DESERTSPIRIT: ["GROUND"],
    DRAGONSLAYER: ["DRAGON"],
    FILTHY: ["POISON"],
    FIREFIGHTER: ["FIRE"],
    FLYTRAP: ["BUG"],
    FOOLHARDY: ["PSYCHIC"],
    FULLBLUBBER: ["FIRE", "ICE"],
    GLASSFIRING: ["FIRE"],
    HEARTLESS: ["FAIRY"],
    HEARTOFJUSTICE: ["DARK"],
    INDUSTRIALIZE: ["STEEL"],
    PECKINGORDER: ["FLYING"],
    POISONABSORB: ["POISON"],
    ROCKCLIMBER: ["ROCK"],
    STEELABSORB: ["STEEL"],
    VENOMDETTA: ["POISON"],
    LEVITATE: ["GROUND"],
    MOTORDRIVE: ["ELECTRIC"],
    SAPSIPPER: ["GRASS"],
    VOLTABSORB: ["ELECTRIC"],
    WATERABSORB: ["WATER"],
    WONDERGUARD: ["QMARKS"],
    CYNIC: ["DRAGON", "FAIRY", "GHOST"],
    RUGGED: ["FIGHTING", "ROCK"],
    RESOLUTE: ["DARK", "BUG"],
};

export class TypeImmunityAbility extends MatchupModifyAbility {
    matchup = 0;
    constructor(ability: LoadedAbility) {
        super(ability);
        this.affectedTypes = immunityAbilities[ability.key].map((t) => TectonicData.types[t]);
    }

    static abilityIds = Object.keys(immunityAbilities);
}
