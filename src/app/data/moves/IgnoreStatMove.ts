import { LoadedMove } from "@/app/data/loadedDataClasses";
import { Move } from "../tectonic/Move";
import { Stat } from "../tectonic/Pokemon";

const ignoreStatMoveCodes: Record<string, Stat[]> = {
    IgnoreTargetDefSpDefEvaStatStages: ["defense", "spdef"],
    // may need its own subclass when abilities implemented
    IgnoreTargetDefSpDefEvaStatStagesAndTargetAbility: ["defense", "spdef"],
};

export class IgnoreStatMove extends Move {
    ignoreStats: Stat[];

    constructor(move: LoadedMove) {
        super(move);
        this.ignoreStats = ignoreStatMoveCodes[move.functionCode];
    }

    static moveCodes = Object.keys(ignoreStatMoveCodes);
}
