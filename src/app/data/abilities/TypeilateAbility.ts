import { LoadedAbility } from "@/preload/loadedDataClasses";
import { Move } from "../tectonic/Move";
import { PokemonType } from "../tectonic/PokemonType";
import { TectonicData } from "../tectonic/TectonicData";
import { MoveTypeChangeAbility } from "./MoveTypeChangeAbility";

const typeilateAbilities: Record<string, string> = {
    AERILATE: "FLYING",
    GALVANIZE: "ELECTRIC",
};

export class TypeilateAbility extends MoveTypeChangeAbility {
    public moveType: PokemonType;

    constructor(ability: LoadedAbility) {
        super(ability);
        this.moveType = TectonicData.types[typeilateAbilities[ability.key]];
    }

    public shouldChangeType(move: Move): boolean {
        return move.type.id === "NORMAL";
    }

    public movePowerMultiplier(): number {
        if (this.moveType.id === "NORMAL") return 1.3;
        return 1;
    }

    static abilityIds = Object.keys(typeilateAbilities);
}
