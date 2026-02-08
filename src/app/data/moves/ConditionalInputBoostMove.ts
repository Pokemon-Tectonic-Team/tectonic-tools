import { BattleState } from "@/app/data/battleState";
import { LoadedMove } from "@/preload/loadedDataClasses";
import { Move } from "../tectonic/Move";
import { PartyPokemon } from "../types/PartyPokemon";

const moveConditions: Record<string, string> = {
    DoubleDamageAvengingFaint: "Ally Fainted Last Turn",
    Round: "Other Round This Turn",
    DoubleDamageTargetHitUser: "Target Damaged User This Turn",
    StareDown: "Target Damaged User This Turn",
    DamageBoost50PercentTargetHitUser: "Target Damaged User This Turn",
    DoubleDamageBerryConsumed: "Berry Consumed This Battle",
    DoubleDamageGemConsumed: "Gem Consumed This Battle",
    HitsDiggers: "Opponent Underground",
    DoubleDamageLastMoveFailed: "Last Move Failed",
    FusionBolt: "Fusion Flare Used This Turn",
    FusionFlare: "Fusion Bolt Used This Turn",
    DamageBoost50PercentTargetNotAttacked: "Target Hasn't Moved This Turn",
    DoubleDamageTargetMoved: "Target Moved This Turn",
    PowerBoostTargetMoved25Percent: "Target Moved This Turn",
    DoubleDamageTargetLostHP: "Target Already Damaged This Turn",
    DoubleDamageUserStatsLowered: "Stats Lowered This Turn",
    PursueSwitchingFoe: "Foe Switching",
    RoughAndTumble: "Curl Up Used Previously",
    DamageBoost50PercentNotTargetFirstTurn: "Not Target's First Turn",
    PowerDoublesTargetLastAlive: "Last Non-Fainted Team Member",
    DoubleDamageFirstTurn: "User's First Turn",
    DoubleDamageTargetBelowHalf: "Target Below Half HP",
};

const moveBoosts: Record<string, number> = {
    DamageBoost50PercentTargetNotAttacked: 1.5,
    DamageBoost50PercentTargetHitUser: 1.5,
    PowerBoostTargetMoved25Percent: 1.25,
    DamageBoost50PercentNotTargetFirstTurn: 1.5,
};

export class ConditionalInputBoostMove extends Move {
    customVarName: string;
    customVarType: string = "boolean";
    needsInput: boolean = true;
    boost: number;

    constructor(move: LoadedMove) {
        super(move);
        this.customVarName = moveConditions[move.functionCode];
        this.boost = moveBoosts[move.functionCode] || 2;
    }

    public getPower(_: PartyPokemon, __: PartyPokemon, ___: BattleState, condition: boolean): number {
        return this.bp * (condition ? this.boost : 1);
    }

    static moveCodes = Object.keys(moveConditions);
}
