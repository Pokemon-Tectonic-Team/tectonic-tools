import { LoadedMove } from "@/app/data/loadedDataClasses";
import { Move } from "../tectonic/Move";
import { PokemonType } from "../tectonic/PokemonType";
import { TectonicData } from "../tectonic/TectonicData";

const extraEffectMoveCodes: Record<string, string> = {
    SuperEffectiveAgainstFighting: "FIGHTING",
    SuperEffectiveAgainstDragon: "DRAGON",
    SuperEffectiveAgainstGhost: "GHOST",
    SuperEffectiveAgainstElectric: "ELECTRIC",
};

export class ExtraEffectiveMove extends Move {
    extraEffect: PokemonType;

    constructor(move: LoadedMove) {
        super(move);
        this.extraEffect = TectonicData.types[extraEffectMoveCodes[move.functionCode]];
    }

    // no special functionality, checked in type calc

    static moveCodes = Object.keys(extraEffectMoveCodes);
}
