import { MoveData } from "@/app/damagecalc/components/MoveCard";
import { LoadedAbility } from "@/app/data/loadedDataClasses";
import { Ability } from "../tectonic/Ability";

type damageBoostConditionFunction = (move: MoveData) => boolean;

const baseDamageBoostConditions: Record<string, damageBoostConditionFunction> = {
    RECKLESS: (move: MoveData) => move.move.isRecoil(),
    TECHNICIAN: (move: MoveData) => move.move.bp <= 60,
    EARSPLITTING: (move: MoveData) => move.move.flags.includes("Sound"),
    HOOLIGAN: (move: MoveData) => move.move.flags.includes("Sound") || move.move.isRecoil(),
    LOUD: (move: MoveData) => move.move.flags.includes("Sound"),
    KNUCKLEDUSTER: (move: MoveData) => move.move.flags.includes("Punch"),
    IRONFIST: (move: MoveData) => move.move.flags.includes("Punch"),
    SWORDPLAY: (move: MoveData) => move.move.flags.includes("Slice") || move.move.flags.includes("Blade"),
    RAZORSEDGE: (move: MoveData) => move.move.flags.includes("Blade"),
    MEGALAUNCHER: (move: MoveData) => move.move.flags.includes("Pulse"),
    BADOMEN: (move: MoveData) => move.move.flags.includes("Foretold"),
    BRISK: (move: MoveData) => move.move.flags.includes("Wind"),
    GALEFORCE: (move: MoveData) => move.move.flags.includes("Wind"),
    BEAMING: (move: MoveData) => move.move.flags.includes("Light"),
    RADIATE: (move: MoveData) => move.move.flags.includes("Light"),
    HEAVYDUTYHOOVES: (move: MoveData) => move.move.flags.includes("Kick") || move.move.flags.includes("Kicking"),
    IRONHEEL: (move: MoveData) => move.move.flags.includes("Kick") || move.move.flags.includes("Kicking"),
    STRONGJAW: (move: MoveData) => move.move.flags.includes("Biting") || move.move.flags.includes("Bite"),
    STONEMANE: (move: MoveData) => move.move.isRecoil(),
    GRIPSTRENGTH: (move: MoveData) => move.move.isBind(),
};

const baseDamageBoostValues: Record<string, number> = {
    RECKLESS: 1.3,
    TECHNICIAN: 1.5,
    EARSPLITTING: 1.5,
    HOOLIGAN: 1.3,
    LOUD: 1.3,
    KNUCKLEDUSTER: 1.5,
    IRONFIST: 1.3,
    SWORDPLAY: 1.3,
    RAZORSEDGE: 1.3,
    MEGALAUNCHER: 1.5,
    BADOMEN: 1.3,
    BRISK: 1.3,
    GALEFORCE: 1.5,
    BEAMING: 1.3,
    RADIATE: 1.5,
    HEAVYDUTYHOOVES: 1.3,
    IRONHEEL: 1.3,
    STRONGJAW: 1.5,
    STONEMANE: 1.2,
    GRIPSTRENGTH: 1.5,
    FUELHUNGRY: 1.5,
};

export class BaseDamageBoostAbility extends Ability {
    private condition: damageBoostConditionFunction;
    private boostValue: number;
    constructor(ability: LoadedAbility) {
        super(ability);
        this.condition = baseDamageBoostConditions[ability.key] ?? (() => true);
        this.boostValue = baseDamageBoostValues[ability.key];
    }

    public movePowerMultiplier(move: MoveData) {
        return this.condition(move) ? this.boostValue : 1;
    }

    static abilityIds = Object.keys(baseDamageBoostValues);
}
