import { LoadedMove } from "@/app/data/loadedDataClasses";
import { BattleState } from "../battleState";
import { StatusEffect } from "../conditions";
import { Move } from "../tectonic/Move";
import { PartyPokemon } from "../types/PartyPokemon";
import { isNull } from "../util";

type ConditionFunction = (user: PartyPokemon, target: PartyPokemon, battleState: BattleState) => boolean;

function punishStatus(status: StatusEffect) {
    return (_: PartyPokemon, target: PartyPokemon) => target.statusEffect === status;
}

const moveConditions: Record<string, ConditionFunction> = {
    DoubleDamageNoItem: (user: PartyPokemon) => user.items.filter((i) => !isNull(i)).length === 0,
    DoubleDamageFaster: (user: PartyPokemon, target: PartyPokemon, battleState: BattleState) =>
        user.getStats(undefined, undefined, battleState).speed >
        target.getStats(undefined, undefined, battleState).speed,
    InertiaShock: (user: PartyPokemon, target: PartyPokemon, battleState: BattleState) =>
        user.getStats(undefined, undefined, battleState).speed >
        target.getStats(undefined, undefined, battleState).speed,
    RemovesTargetItemDamageBoost50Percent: (_: PartyPokemon, target: PartyPokemon) =>
        target.items.filter((i) => !isNull(i)).length > 0,
    DoubleDamageTargetStatused: (_: PartyPokemon, target: PartyPokemon) => target.statusEffect !== "None", // Does Hex interact with Volatile SEs?
    ImpurityBlaze: (_: PartyPokemon, target: PartyPokemon) => target.statusEffect !== "None",
    DoubleDamageAgainstBurned: punishStatus("Burn"),
    DoubleDamageAgainstPoisoned: punishStatus("Poison"),
    TripleDamageAgainstPoisoned: punishStatus("Poison"),
    DoubleDamageAgainstFrostbitten: punishStatus("Frostbite"),
    HealUserByHalfOfDamageDoneDoubleDamageIfTargetAsleep: punishStatus("Sleep"),
    HealUserByHalfOfDamageDoneDoubleDamageIfTargetAsleepCanOverheal: punishStatus("Sleep"),
    // Smelling Salts and Wake-Up Slap aren't identical to Venoshock etc,
    // but the status-curing part isn't relevant to a single turn of damage calculation
    SmellingSalts: punishStatus("Numb"),
    WakeUpSlap: punishStatus("Sleep"),
    DoubleDamageGravity: (_: PartyPokemon, __: PartyPokemon, battleState: BattleState) => battleState.gravity,
    DamageBoostEclipse50Percent: (_: PartyPokemon, __: PartyPokemon, battleState: BattleState) =>
        battleState.weather === "Eclipse" || battleState.weather === "Ring Eclipse",
    Bully: (_: PartyPokemon, target: PartyPokemon) => Object.values(target.statSteps).some((s) => s !== 0),
};

const moveBoosts: Record<string, number> = {
    RemovesTargetItemDamageBoost50Percent: 1.5,
    TripleDamageAgainstPoisoned: 3,
    InertiaShock: 1.5,
    DamageBoostEclipse50Percent: 1.5,
    Bully: 1.5,
};

export class ConditionalAutoBoostMove extends Move {
    condition: ConditionFunction;
    boost: number;

    constructor(move: LoadedMove) {
        super(move);
        // we use a default boost instead of a default condition here because there
        // are a lot of boosts with the same value
        // and we need one of the lists to hold every move ID to populate moveCodes
        this.condition = moveConditions[move.functionCode];
        this.boost = moveBoosts[move.functionCode] || 2;
    }
    public getPower(user: PartyPokemon, target: PartyPokemon, battleState: BattleState): number {
        return this.bp * (this.condition(user, target, battleState) ? this.boost : 1);
    }

    static moveCodes = Object.keys(moveConditions);
}
