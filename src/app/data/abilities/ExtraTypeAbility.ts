import { LoadedAbility } from "@/app/data/loadedDataClasses";
import { Ability } from "../tectonic/Ability";
import { PokemonType } from "../tectonic/PokemonType";
import { TectonicData } from "../tectonic/TectonicData";

const isAlsoTypeAbilities: Record<string, string> = {
    HAUNTED: "GHOST",
    INFECTED: "GRASS",
    RUSTWRACK: "STEEL",
    SLUGGISH: "BUG",
    UNIDENTIFIED: "MUTANT",
};

export class ExtraTypeAbility extends Ability {
    public extraType: PokemonType;
    constructor(ability: LoadedAbility) {
        super(ability);
        this.extraType = TectonicData.types[isAlsoTypeAbilities[ability.key]];
    }

    static abilityIds = Object.keys(isAlsoTypeAbilities);
}
