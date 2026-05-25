import { LoadedMove } from "@/app/data/loadedDataClasses";
import { Move } from "../tectonic/Move";

interface MultiHits {
    minHits: number;
    maxHits: number;
}

const multiHitMoveCodes: Record<string, MultiHits> = {
    HitTwoToFiveTimes: {
        minHits: 2,
        maxHits: 5,
    },
    HitTwoToFiveTimesAlwaysHits: {
        minHits: 2,
        maxHits: 5,
    },
    HitTwoToFiveTimesNumb: {
        minHits: 2,
        maxHits: 5,
    },
    Rampage3HitTwoToFiveTimes: {
        minHits: 2,
        maxHits: 5,
    },
    HitTwoToFiveTimesAddMoneyGainedFromBattleEachHit: {
        minHits: 2,
        maxHits: 5,
    },
    HitTwoTimes: {
        minHits: 2,
        maxHits: 2,
    },
    HitTwoTimesFlinchTarget: {
        minHits: 2,
        maxHits: 2,
    },
    HitThreeTimes: {
        minHits: 3,
        maxHits: 3,
    },
};

export class MultiHitMove extends Move {
    minHits: number;
    maxHits: number;

    constructor(move: LoadedMove) {
        super(move);
        const hits = multiHitMoveCodes[move.functionCode];
        this.minHits = hits.minHits;
        this.maxHits = hits.maxHits;
    }

    static moveCodes = Object.keys(multiHitMoveCodes);
}
