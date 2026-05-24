import { LoadedMove } from "@/app/data/loadedDataClasses";
import { Move } from "../tectonic/Move";
import { PokemonType } from "../tectonic/PokemonType";
import { TectonicData } from "../tectonic/TectonicData";

const extraTypeMoveCodes: Record<string, string> = {
    EffectivenessIncludesFlyingType: "FLYING",
    EffectivenessIncludesPsychicType: "PSYCHIC",
};

export class ExtraTypeMove extends Move {
    extraType: PokemonType;

    constructor(move: LoadedMove) {
        super(move);
        this.extraType = TectonicData.types[extraTypeMoveCodes[move.functionCode]];
    }

    static moveCodes = Object.keys(extraTypeMoveCodes);
}
