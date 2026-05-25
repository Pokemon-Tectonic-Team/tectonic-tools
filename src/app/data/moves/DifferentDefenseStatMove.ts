import { LoadedMove } from "@/app/data/loadedDataClasses";
import { Move } from "../tectonic/Move";
import { Stat } from "../tectonic/Pokemon";

const differentDefenseStatMoveCodes: Record<string, Stat> = {
    DoesPhysicalDamage: "defense",
    DoesSpecialDamage: "spdef",
    TargetsAttackDefends: "attack",
    TargetsSpAtkDefends: "spatk",
};

export class DifferentDefenseStatMove extends Move {
    defenseStat: Stat;

    constructor(move: LoadedMove) {
        super(move);
        this.defenseStat = differentDefenseStatMoveCodes[move.functionCode];
    }

    public getDefendingStat(): Stat {
        return this.defenseStat;
    }

    static moveCodes = Object.keys(differentDefenseStatMoveCodes);
}
