import { LoadedMove } from "@/preload/loadedDataClasses";
import { BattleState } from "../battleState";
import { Move } from "../tectonic/Move";
import { PartyPokemon } from "../types/PartyPokemon";

interface FixedDamageConfig {
    calc: (customVar: number) => number;
    varName: string;
    getDefault: (user: PartyPokemon, target: PartyPokemon, battleState: BattleState) => number;
}

const fixedDamageConfigs: Record<string, FixedDamageConfig> = {
    FixedDamageHalfTargetHP: {
        calc: (hp) => Math.floor(hp / 2),
        varName: "Target HP",
        getDefault: (_u, target, bs) => target.getStats(undefined, "opponent", bs).hp,
    },
    FixedDamageHalfTargetHealUserByHalfOfDamageDone: {
        calc: (hp) => Math.floor(hp / 2),
        varName: "Target HP",
        getDefault: (_u, target, bs) => target.getStats(undefined, "opponent", bs).hp,
    },
    CounterPhysicalDamage: {
        calc: (dmg) => Math.max(Math.floor(dmg * 2), 1),
        varName: "Damage Taken",
        getDefault: () => 0,
    },
    CounterSpecialDamage: {
        calc: (dmg) => Math.max(Math.floor(dmg * 2), 1),
        varName: "Damage Taken",
        getDefault: () => 0,
    },
    CounterDamagePlusHalf: {
        calc: (dmg) => Math.max(Math.floor(dmg * 1.5), 1),
        varName: "Damage Taken",
        getDefault: () => 0,
    },
    MultiTurnAttackBideThenReturnDoubleDamage: {
        calc: (dmg) => Math.max(Math.floor(dmg * 2), 1),
        varName: "Damage Taken",
        getDefault: () => 0,
    },
};

export class FixedDamageMove extends Move {
    private config: FixedDamageConfig;

    constructor(move: LoadedMove) {
        super(move);
        this.config = fixedDamageConfigs[move.functionCode];
        this.needsInput = true;
        this.customVarType = "number";
        this.customVarName = this.config.varName;
    }

    public getFixedDamage(_user: PartyPokemon, _target: PartyPokemon, _battleState: BattleState, customVar: unknown): number {
        return this.config.calc((customVar as number) || 0);
    }

    public getPower(_user: PartyPokemon, _target: PartyPokemon, _battleState: BattleState, customVar: unknown): number {
        return this.config.calc((customVar as number) || 0);
    }

    public getDefaultCustomVar(user: PartyPokemon, target: PartyPokemon, battleState: BattleState): number {
        return this.config.getDefault(user, target, battleState);
    }

    static moveCodes = Object.keys(fixedDamageConfigs);
}
