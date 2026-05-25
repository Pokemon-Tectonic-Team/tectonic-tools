import { BattleState } from "@/app/data/battleState";
import { LoadedAbility } from "@/app/data/loadedDataClasses";
import { TectonicData } from "../tectonic/TectonicData";
import { PokemonType } from "../tectonic/PokemonType";
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
    WINTERINSULATION: ["FIRE", "ELECTRIC"],
    DESICCATE: ["WATER", "GRASS"],
    DECONTAMINATION: ["BUG", "POISON"],
};

type ImmunityCondition = (battleState?: BattleState) => boolean;

const immunityConditions: Record<string, ImmunityCondition> = {
    WINTERINSULATION: (bs) => bs?.weather === "Hail",
    DESICCATE: (bs) => bs?.weather === "Sandstorm",
    DECONTAMINATION: (bs) => bs?.weather === "Moonglow" || bs?.weather === "Blood Moon",
};

export class TypeImmunityAbility extends MatchupModifyAbility {
    matchup = 0;
    private condition: ImmunityCondition;

    constructor(ability: LoadedAbility) {
        super(ability);
        this.affectedTypes = immunityAbilities[ability.key].map((t) => TectonicData.types[t]);
        this.condition = immunityConditions[ability.key] ?? (() => true);
    }

    public modifiedMatchup(type: PokemonType, battleState?: BattleState) {
        return this.affectsType(type) && this.condition(battleState) ? 0 : 1;
    }

    static abilityIds = Object.keys(immunityAbilities);
}
