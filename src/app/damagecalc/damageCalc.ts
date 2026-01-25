import { BattleState } from "@/app/data/battleState";
import { STABBoostAbility } from "../data/abilities/STABBoostAbility";
import { WeatherImmuneItem } from "../data/items/WeatherImmuneItem";
import { MultiHitMove } from "../data/moves/MultiHitMove";
import { Stat } from "../data/tectonic/Pokemon";
import { calcTypeMatchup } from "../data/typeChart";
import { PartyPokemon } from "../data/types/PartyPokemon";
import { MoveData } from "./components/MoveCard";

export type Side = "player" | "opponent";

export interface DamageResult {
    damage: number;
    percentage: number;
    hits: number;
    typeEffectMult: number;
    minTotal?: number;
    maxTotal?: number;
    minPercentage?: number;
    maxPercentage?: number;
}

export function calculateDamage(
    move: MoveData,
    user: PartyPokemon,
    target: PartyPokemon,
    battleState: BattleState
): DamageResult {
    if (move.move.category === "Status") return { damage: 0, percentage: 0, hits: 0, typeEffectMult: 0 };

    // TODO: Handle abilities
    // if (target.damageState.disguise) {
    //     target.damageState.calcDamage = 1;
    //     return;
    // }

    // Calculate base power of move
    const baseDmg = move.move.getPower(user, target, battleState, move.customVar);

    // In vanilla Tectonic, critical hit determination happens here
    // However, for calculation, it's determined by the UI

    // Calculate the actual damage dealt, and assign it to the damage state for tracking
    const [damage, typeEffectMult] = calculateDamageForHit(move, user, target, baseDmg, battleState);
    const percentage = damage / target.getStats(move, "opponent").hp;
    const hits = Math.ceil(1 / percentage);
    if (move.move instanceof MultiHitMove) {
        const minTotal = damage * move.move.minHits;
        const maxTotal = damage * move.move.maxHits;
        return {
            damage,
            percentage,
            hits,
            typeEffectMult,
            minTotal,
            maxTotal,
            minPercentage: minTotal / target.getStats(move, "opponent").hp,
            maxPercentage: maxTotal / target.getStats(move, "opponent").hp,
        };
    }
    return { damage, percentage, hits, typeEffectMult };
}

function calculateDamageForHit(
    move: MoveData,
    user: PartyPokemon,
    target: PartyPokemon,
    baseDmg: number,
    battleState: BattleState
): [number, number] {
    // Get the relevant attacking and defending stat values (after steps)
    const [attack, defense] = damageCalcStats(move, user, target);

    // Calculate all multiplier effects
    const [multipliers, typeEffectMult] = calcDamageMultipliers(move, user, target, battleState);

    // Main damage calculation
    let finalCalculatedDamage = calcDamageWithMultipliers(baseDmg, attack, defense, user.level, multipliers);
    finalCalculatedDamage = Math.max(Math.round(finalCalculatedDamage * multipliers.final_damage_multiplier), 1);
    finalCalculatedDamage = flatDamageReductions(finalCalculatedDamage);

    // TODO: Handle abilities
    // // Delayed Reaction
    // if (!battle.moldBreaker && target.shouldAbilityApply("DELAYEDREACTION", aiCheck)) {
    //     const delayedDamage = Math.floor(finalCalculatedDamage * 0.33);
    //     finalCalculatedDamage -= delayedDamage;
    //     if (delayedDamage > 0 && !aiCheck) {
    //         if (!target.effectActive("DelayedReaction")) {
    //             target.effects.DelayedReaction = [];
    //         }
    //         target.effects.DelayedReaction.push([2, delayedDamage]);
    //     }
    // }

    // TODO: Handle avatar logic
    // if (target.boss()) {
    //     // All damage up to the phase lower health bound is unmodified
    //     const unmodifiedDamage = Math.min(target.hp - target.avatarPhaseLowerHealthBound, finalCalculatedDamage);
    //     const modifiedDamage = finalCalculatedDamage - Math.max(unmodifiedDamage, 0);
    //     finalCalculatedDamage = unmodifiedDamage + Math.floor(modifiedDamage * (1 - AVATAR_OVERKILL_RESISTANCE));
    // }

    return [finalCalculatedDamage, typeEffectMult];
}

function calcDamageWithMultipliers(
    baseDmg: number,
    attack: number,
    defense: number,
    userLevel: number,
    multipliers: DamageMultipliers
): number {
    baseDmg = Math.max(Math.round(baseDmg * multipliers.base_damage_multiplier), 1);
    attack = Math.max(Math.round(attack * multipliers.attack_multiplier), 1);
    defense = Math.max(Math.round(defense * multipliers.defense_multiplier), 1);
    return calcBasicDamage(baseDmg, userLevel, attack, defense);
}

function calcBasicDamage(
    baseDamage: number,
    attackerLevel: number,
    userAttackingStat: number,
    targetDefendingStat: number
): number {
    const pseudoLevel = 15.0 + attackerLevel / 2.0;
    const levelMultiplier = 2.0 + 0.4 * pseudoLevel;
    return Math.floor(2.0 + (levelMultiplier * baseDamage * userAttackingStat) / targetDefendingStat / 50.0);
}

function damageCalcStats(move: MoveData, userStats: PartyPokemon, targetStats: PartyPokemon): [number, number] {
    // Calculate category for adaptive moves
    const trueCategory = move.move.getDamageCategory(move, userStats, targetStats);

    const stats: Record<Side, PartyPokemon> = {
        player: userStats,
        opponent: targetStats,
    };

    // Calculate user's attack stat
    // TODO: implement moves like foul play or body press
    const attackerSide = move.move.getAttackStatSide();
    const attacking_stat_holder = stats[attackerSide];
    const attacking_stat: Stat = move.move.getAttackingStat(trueCategory);

    // TODO: implement abilities
    // if (user.shouldAbilityApply("MALICIOUSGLOW", aiCheck) && battle.moonGlowing()) {
    //     attacking_stat_holder = target;
    // }

    // in tectonic logic stat steps are handled here, but in the app it's handled in the UI

    // attack_step = 0 if target.hasActiveAbility("UNAWARE") && !battle.moldBreaker;
    // TODO: figure out how crits interact with foul play
    const attack = attacking_stat_holder.getStats(move, "player")[attacking_stat];

    // Calculate target's defense stat
    const defending_stat_holder = targetStats;
    const defending_stat: Stat = move.move.getDefendingStat(trueCategory);

    // defense_step = 0 if user.hasActiveAbility("UNAWARE");
    const defense = defending_stat_holder.getStats(move, "opponent")[defending_stat];

    return [attack, defense];
}

function pbCalcAbilityDamageMultipliers(
    move: MoveData,
    user: PartyPokemon,
    target: PartyPokemon,
    battleState: BattleState,
    multipliers: DamageMultipliers
): DamageMultipliers {
    // Global abilities
    // if (
    //     (battle.pbCheckGlobalAbility("DARKAURA") && type === "DARK") ||
    //     (battle.pbCheckGlobalAbility("FAIRYAURA") && type === "FAIRY")
    // ) {
    //     if (battle.pbCheckGlobalAbility("AURABREAK")) {
    //         multipliers.base_damage_multiplier *= 2 / 3.0;
    //     } else {
    //         multipliers.base_damage_multiplier *= 4 / 3.0;
    //     }
    // }
    // if (battle.pbCheckGlobalAbility("RUINOUS")) {
    //     multipliers.base_damage_multiplier *= 1.4;
    // }

    // User or user ally ability effects that alter damage
    multipliers.base_damage_multiplier *= user.ability.movePowerMultiplier(move, user, target);
    multipliers.attack_multiplier *= user.ability.attackMultiplier(move, user, battleState);
    // user.eachAlly((b: any) => {
    //     b.eachAbilityShouldApply(aiCheck, (ability: any) => {
    //         BattleHandlers.triggerDamageCalcUserAllyAbility(
    //             ability,
    //             user,
    //             target,
    //             this,
    //             multipliers,
    //             baseDmg,
    //             type,
    //             aiCheck
    //         );
    //     });
    // });

    // // Target or target ally ability effects that alter damage
    // if (!battle.moldBreaker) {
    //     target.eachAbilityShouldApply(aiCheck, (ability: any) => {
    //         BattleHandlers.triggerDamageCalcTargetAbility(
    //             ability,
    //             user,
    //             target,
    //             this,
    //             multipliers,
    //             baseDmg,
    //             type,
    //             aiCheck
    //         );
    //     });
    //     target.eachAlly((b: any) => {
    //         b.eachAbilityShouldApply(aiCheck, (ability: any) => {
    //             BattleHandlers.triggerDamageCalcTargetAllyAbility(
    //                 ability,
    //                 user,
    //                 target,
    //                 this,
    //                 multipliers,
    //                 baseDmg,
    //                 type,
    //                 aiCheck
    //             );
    //         });
    //     });
    // }
    return multipliers;
}

function applySunDebuff(move: MoveData, user: PartyPokemon, battleState: BattleState) {
    if (user.items.some((i) => i instanceof WeatherImmuneItem)) {
        return false;
    }
    // i'm not 100% sure we're actually passing ability flags yet, i'll check when we get to implementing abilitites
    if (user.ability.flags.includes("SunshineSynergy") || user.ability.flags.includes("AllWeatherSynergy")) {
        return false;
    }
    if (user.types.type1.id === "FIRE" || user.types.type2?.id === "FIRE" || user.types.type1.id === "GRASS" || user.types.type2?.id === "GRASS") {
        return false;
    }
    if (["FIRE", "GRASS"].includes(move.move.getType(user, battleState).id)) {
        return false;
    }
    return true;
}

function applyRainDebuff(move: MoveData, user: PartyPokemon, battleState: BattleState) {
    if (user.items.some((i) => i instanceof WeatherImmuneItem)) {
        return false;
    }
    if (user.ability.flags.includes("RainstormSynergy") || user.ability.flags.includes("AllWeatherSynergy")) {
        return false;
    }
    if (user.types.type1.id === "WATER" || user.types.type2?.id === "WATER" || user.types.type1.id === "ELECTRIC" || user.types.type2?.id === "ELECTRIC") {
        return false;
    }

    if (["WATER", "ELECTRIC"].includes(move.move.getType(user, battleState).id)) {
        return false;
    }
    return true;
}

function pbCalcWeatherDamageMultipliers(
    move: MoveData,
    user: PartyPokemon,
    target: PartyPokemon,
    battleState: BattleState,
    multipliers: DamageMultipliers
): DamageMultipliers {
    const weather = battleState.weather;
    const type = move.move.getType(user, battleState).id;
    switch (weather) {
        case "Sunshine":
        case "Harsh Sunlight":
            if (type === "FIRE") {
                const damageBonus = weather === "Harsh Sunlight" ? 0.5 : 0.3;
                // TODO: implement curses
                // if (battle.curseActive("CURSE_BOOSTED_SUN")) {
                //     damageBonus *= 2;
                // }
                multipliers.final_damage_multiplier *= 1 + damageBonus;
            } else if (applySunDebuff(move, user, battleState)) {
                const damageReduction = 0.15;
                // TODO: Implement abilities
                // if (battle.pbCheckGlobalAbility("BLINDINGLIGHT")) {
                //     damageReduction *= 2;
                // }
                // TODO: Implement curses
                // if (battle.curseActive("CURSE_BOOSTED_SUN")) {
                //     damageReduction *= 2;
                // }
                multipliers.final_damage_multiplier *= 1 - damageReduction;
            }
            break;
        case "Rainstorm":
        case "Heavy Rain":
            if (type === "WATER") {
                const damageBonus = weather === "Heavy Rain" ? 0.5 : 0.3;
                // TODO: Implement curses
                // if (battle.curseActive("CURSE_BOOSTED_RAIN")) {
                //     damageBonus *= 2;
                // }
                multipliers.final_damage_multiplier *= 1 + damageBonus;
            } else if (applyRainDebuff(move, user, battleState)) {
                const damageReduction = 0.15;
                // TODO: Implement abilities
                // if (battle.pbCheckGlobalAbility("DREARYCLOUDS")) {
                //     damageReduction *= 2;
                // }
                // TODO: Implement curses
                // if (battle.curseActive("CURSE_BOOSTED_RAIN")) {
                //     damageReduction *= 2;
                // }
                multipliers.final_damage_multiplier *= 1 - damageReduction;
            }
            break;
        case "Eclipse":
        case "Ring Eclipse":
            if (type === "PSYCHIC" || (type === "DRAGON" && weather === "Ring Eclipse")) {
                const damageBonus = weather === "Ring Eclipse" ? 0.5 : 0.3;
                multipliers.final_damage_multiplier *= 1 + damageBonus;
            }

            // TODO: Implement abilities
            // if (battle.pbCheckOpposingAbility("DISTRESSING", user.index)) {
            //     multipliers.final_damage_multiplier *= 0.8;
            // }
            break;
        case "Moonglow":
        case "Blood Moon":
            if (type === "FAIRY" || (type === "DARK" && weather === "Blood Moon")) {
                const damageBonus = weather === "Blood Moon" ? 0.5 : 0.3;
                multipliers.final_damage_multiplier *= 1 + damageBonus;
            }
            break;
    }
    return multipliers;
}

function pbCalcStatusesDamageMultipliers(
    move: MoveData,
    user: PartyPokemon,
    target: PartyPokemon,
    multipliers: DamageMultipliers
): DamageMultipliers {
    // TODO: Handle abilities
    // const toil = battle.pbCheckOpposingAbility("TOILANDTROUBLE", user.index);
    // Burn
    if (
        user.statusEffect === "Burn" &&
        move.move.category === "Physical" &&
        !move.move.ignoreStatus("Burn")
        //!user.shouldAbilityApply("BURNHEAL", checkingForAI)
    ) {
        let damageReduction = 1.0 / 3.0;
        // TODO: Handle avatars
        // if (user.boss() && AVATAR_DILUTED_STATUS_CONDITIONS) {
        //     damageReduction = 1.0 / 5.0;
        // }
        // TODO: Handle curses
        // if (user.pbOwnedByPlayer() && battle.curseActive("CURSE_STATUS_DOUBLED")) {
        //     damageReduction *= 2;
        // }
        // TODO: Handle abilities
        // if (toil) {
        //     damageReduction *= 1.5;
        // }
        // if (user.hasActiveAbility("CLEANFREAK")) {
        //     damageReduction *= 2;
        // }
        damageReduction = Math.min(damageReduction, 1);
        multipliers.final_damage_multiplier *= 1.0 - damageReduction;
    }
    // Frostbite
    if (
        user.statusEffect === "Frostbite" &&
        move.move.category === "Special" &&
        !move.move.ignoreStatus("Frostbite")
        //!user.shouldAbilityApply("FROSTHEAL", checkingForAI)
    ) {
        let damageReduction = 1.0 / 3.0;
        // if (user.boss() && AVATAR_DILUTED_STATUS_CONDITIONS) {
        //     damageReduction = 1.0 / 5.0;
        // }
        // if (user.pbOwnedByPlayer() && battle.curseActive("CURSE_STATUS_DOUBLED")) {
        //     damageReduction *= 2;
        // }
        // if (toil) {
        //     damageReduction *= 1.5;
        // }
        // if (user.hasActiveAbility("CLEANFREAK")) {
        //     damageReduction *= 2;
        // }
        damageReduction = Math.min(damageReduction, 1);
        multipliers.final_damage_multiplier *= 1.0 - damageReduction;
    }
    // Numb
    if (user.statusEffect === "Numb") {
        let damageReduction = 1.0 / 4.0;
        // if (user.boss() && AVATAR_DILUTED_STATUS_CONDITIONS) {
        //     damageReduction = 3.0 / 20.0;
        // }
        // if (user.pbOwnedByPlayer() && battle.curseActive("CURSE_STATUS_DOUBLED")) {
        //     damageReduction *= 2;
        // }
        // if (toil) {
        //     damageReduction *= 1.5;
        // }
        // if (user.hasActiveAbility("CLEANFREAK")) {
        //     damageReduction *= 2;
        // }
        damageReduction = Math.min(damageReduction, 1);
        multipliers.final_damage_multiplier *= 1.0 - damageReduction;
    }
    // Dizzy
    if (
        target.statusEffect === "Dizzy"
        //!target.shouldAbilityApply(["MARVELSKIN", "MARVELSCALE"], checkingForAI)
    ) {
        const damageIncrease = 1.0 / 4.0;
        // if (target.boss() && AVATAR_DILUTED_STATUS_CONDITIONS) {
        //     damageIncrease = 3.0 / 20.0;
        // }
        // if (target.pbOwnedByPlayer() && battle.curseActive("CURSE_STATUS_DOUBLED")) {
        //     damageIncrease *= 2;
        // }
        // if (target.hasActiveAbility("CLEANFREAK")) {
        //     damageIncrease *= 2;
        // }
        multipliers.final_damage_multiplier *= 1.0 + damageIncrease;
        // Waterlog
    }
    if (
        target.statusEffect === "Waterlog"
        //!target.shouldAbilityApply(["MARVELSKIN", "MARVELSCALE"], checkingForAI)
    ) {
        const damageIncrease = 1.0 / 4.0;
        // if (target.boss() && AVATAR_DILUTED_STATUS_CONDITIONS) {
        //     damageIncrease = 3.0 / 20.0;
        // }
        // if (target.pbOwnedByPlayer() && battle.curseActive("CURSE_STATUS_DOUBLED")) {
        //     damageIncrease *= 2;
        // }
        // if (target.hasActiveAbility("CLEANFREAK")) {
        //     damageIncrease *= 2;
        // }
        multipliers.final_damage_multiplier *= 1.0 + damageIncrease;
    }

    // Fracture
    if (user.volatileStatusEffects["Fracture"]) {
        multipliers.final_damage_multiplier *= 0.66;
    }
    return multipliers;
}

function pbCalcProtectionsDamageMultipliers(
    move: MoveData,
    user: PartyPokemon,
    target: PartyPokemon,
    battleState: BattleState,
    multipliers: DamageMultipliers
): DamageMultipliers {
    // Aurora Veil, Reflect, Light Screen
    // TODO: Abilities that ignore screens?
    if (!move.move.ignoresScreens() && !doesMoveCrit(move, target) /* && !user.ignoreScreens(checkingForAI)*/) {
        if (
            battleState.sideState.auroraVeil ||
            (battleState.sideState.reflect && move.move.getDamageCategory(move, user, target) === "Physical") ||
            (battleState.sideState.lightScreen && move.move.getDamageCategory(move, user, target) === "Special")
        ) {
            multipliers.final_damage_multiplier *= battleState.multiBattle ? 2 / 3.0 : 0.5;

            // } else if (target.pbOwnSide.effectActive("DiamondField")) {
            //     if (battle.pbSideBattlerCount(target) > 1) {
            //         multipliers.final_damage_multiplier *= 3 / 4.0;
            //     } else {
            //         multipliers.final_damage_multiplier *= 2 / 3.0;
            //     }
        }

        // // Repulsion Field
        // if (baseDamage >= 100 && target.pbOwnSide.effectActive("RepulsionField")) {
        //     if (battle.pbSideBattlerCount(target) > 1) {
        //         multipliers.final_damage_multiplier *= 2 / 3.0;
        //     } else {
        //         multipliers.final_damage_multiplier *= 0.5;
        //     }
        // }
    }
    // Partial protection moves
    // if (target.effectActive(["StunningCurl", "RootShelter", "VenomGuard"])) {
    //     multipliers.final_damage_multiplier *= 0.5;
    // }
    // if (target.effectActive("EmpoweredDetect")) {
    //     multipliers.final_damage_multiplier *= 0.5;
    // }
    // if (target.pbOwnSide.effectActive("Bulwark")) {
    //     multipliers.final_damage_multiplier *= 0.5;
    // }
    // For when bosses are partway piercing protection
    // if (target.damageState.partiallyProtected) {
    //     multipliers.final_damage_multiplier *= 0.5;
    // }
    return multipliers;
}

function pbCalcTypeBasedDamageMultipliers(
    move: MoveData,
    user: PartyPokemon,
    target: PartyPokemon,
    battleState: BattleState,
    multipliers: DamageMultipliers
): [DamageMultipliers, number] {
    let stabActive = false;
    // TODO: handle abilities
    // if (user.shouldAbilityApply("IMPRESSIONABLE", checkingForAI)) {
    //     let anyPartyMemberHasType = false;
    //     user.ownerParty.forEach((partyMember: any) => {
    //         if (partyMember.personalID !== user.personalID && type && partyMember.hasType(type)) {
    //             anyPartyMemberHasType = true;
    //         }
    //     });
    //     stabActive = anyPartyMemberHasType;
    // } else {
    const type = move.move.getType(user, battleState);
    stabActive = move.move.isSTAB(user);

    //}
    // TODO: Handle curses
    // stabActive = stabActive && !(user.pbOwnedByPlayer() && battle.curses.includes("DULLED"));
    // TODO: handle abilities
    // stabActive = stabActive && !battle.pbCheckGlobalAbility("SIGNALJAM");

    // STAB
    if (stabActive) {
        let stab = 1.5;
        if (user.ability instanceof STABBoostAbility) {
            stab *= user.ability.boost;
        }
        multipliers.final_damage_multiplier *= stab;
    }

    // Type effectiveness
    // variable type moves are handled here in Tectonic, but on the data level here
    const effectiveness = calcTypeMatchup(
        { type: type, move: move.move, ability: user.ability },
        { type1: target.types.type1, type2: target.types.type2, ability: target.ability }
    );
    multipliers.final_damage_multiplier *= effectiveness;

    // TODO: Misc effects like Charge
    // if (user.effectActive("Charge") && type === "ELECTRIC") {
    //     multipliers.base_damage_multiplier *= 2;
    //     if (!checkingForAI) {
    //         user.applyEffect("ChargeExpended");
    //     }
    // }

    // TODO: Volatile Toxin
    // if (target.effectActive("VolatileToxin") && type === "GROUND") {
    //     multipliers.base_damage_multiplier *= 2;
    // }

    // TODO: Turbulent Sky
    // if (user.pbOwnSide.effectActive("TurbulentSky")) {
    //     multipliers.final_damage_multiplier *= 1.3;
    // }
    return [multipliers, effectiveness];
}

// function pbCalcTribeBasedDamageMultipliers(
//     user: any,
//     target: any,
//     type: any,
//     multipliers: any,
//     checkingForAI: boolean = false
// ): void {
//     // Bushwacker tribe
//     if (user.hasTribeBonus("BUSHWACKER")) {
//         if (checkingForAI) {
//             const expectedTypeMod = battle.battleAI.pbCalcTypeModAI(type, user, target, this);
//             if (Effectiveness.resistant(expectedTypeMod)) {
//                 multipliers.final_damage_multiplier *= 1.5;
//             }
//         } else {
//             if (Effectiveness.resistant(target.damageState.typeMod)) {
//                 multipliers.final_damage_multiplier *= 1.5;
//             }
//         }
//     }

//     // Assassin tribe
//     if (user.hasTribeBonus("ASSASSIN") && user.firstTurn()) {
//         multipliers.final_damage_multiplier *= 1.2;
//     }

//     // Artillery tribe
//     if (user.hasTribeBonus("ARTILLERY") && !user.firstTurn()) {
//         multipliers.final_damage_multiplier *= 1.2;
//     }

//     // Mystic tribe
//     if (user.hasTribeBonus("MYSTIC") && user.lastRoundMoveType === 2) {
//         // Status
//         multipliers.final_damage_multiplier *= 1.25;
//     }

//     // Warrior tribe
//     if (user.hasTribeBonus("WARRIOR")) {
//         if (checkingForAI) {
//             const expectedTypeMod = battle.battleAI.pbCalcTypeModAI(type, user, target, this);
//             if (Effectiveness.super_effective(expectedTypeMod)) {
//                 multipliers.final_damage_multiplier *= 1.12;
//             }
//         } else {
//             if (Effectiveness.super_effective(target.damageState.typeMod)) {
//                 multipliers.final_damage_multiplier *= 1.12;
//             }
//         }
//     }

//     // Scavenger tribe
//     if (user.hasTribeBonus("SCAVENGER")) {
//         if (checkingForAI) {
//             if (user.hasGem()) {
//                 multipliers.final_damage_multiplier *= 1.25;
//             }
//         } else {
//             if (user.effectActive("GemConsumed")) {
//                 multipliers.final_damage_multiplier *= 1.25;
//             }
//         }
//     }

//     // Harmonic tribe
//     if (target.hasTribeBonus("HARMONIC")) {
//         multipliers.final_damage_multiplier *= 0.9;
//     }

//     // Charmer tribe
//     if (target.hasTribeBonus("CHARMER") && target.effectActive("SwitchedIn")) {
//         multipliers.final_damage_multiplier *= 0.8;
//     }

//     // Stampede tribe
//     if (target.hasTribeBonus("STAMPEDE") && target.effectActive("ChoseAttack")) {
//         multipliers.final_damage_multiplier *= 0.88;
//     }

//     // Noble tribe
//     if (target.hasTribeBonus("NOBLE") && target.effectActive("ChoseStatus")) {
//         multipliers.final_damage_multiplier *= 0.88;
//     }
// }

export interface DamageMultipliers {
    base_damage_multiplier: number;
    attack_multiplier: number;
    defense_multiplier: number;
    final_damage_multiplier: number;
}

function calcDamageMultipliers(
    move: MoveData,
    user: PartyPokemon,
    target: PartyPokemon,
    battleState: BattleState
): [DamageMultipliers, number] {
    let multipliers: DamageMultipliers = {
        attack_multiplier: 1,
        base_damage_multiplier: 1,
        defense_multiplier: 1,
        final_damage_multiplier: 1,
    };
    // TODO: Handle abilities
    multipliers = pbCalcAbilityDamageMultipliers(move, user, target, battleState, multipliers);
    multipliers = pbCalcWeatherDamageMultipliers(move, user, target, battleState, multipliers);
    multipliers = pbCalcStatusesDamageMultipliers(move, user, target, multipliers);
    // TODO: Handle Protect-esque moves
    multipliers = pbCalcProtectionsDamageMultipliers(move, user, target, battleState, multipliers);
    const typeResult = pbCalcTypeBasedDamageMultipliers(move, user, target, battleState, multipliers);
    multipliers = typeResult[0];
    const typeEffectMult = typeResult[1];
    // TODO: Handle tribes
    // multipliers = pbCalcTribeBasedDamageMultipliers(user, target, type, multipliers);

    for (const item of user.items) {
        multipliers = item.offensiveMultiplier(multipliers, move, user, target, battleState, typeEffectMult);
    }
    for (const item of target.items) {
        multipliers = item.defensiveMultiplier(multipliers, move, user, target, battleState, typeEffectMult);
    }

    // TODO: Misc effects
    // if (target.effectActive("DeathMark")) {
    //     multipliers.final_damage_multiplier *= 1.5;
    // }

    // // Parental Bond's second attack
    // if (user.effects.ParentalBond === 1) {
    //     multipliers.base_damage_multiplier *= 0.25;
    // }
    // // Me First
    // if (user.effectActive("MeFirst")) {
    //     multipliers.base_damage_multiplier *= 1.5;
    // }
    // // Helping Hand
    // if (user.effectActive("HelpingHand") && !(this instanceof PokeBattle_Confusion)) {
    //     multipliers.base_damage_multiplier *= 1.5;
    // }
    // // Helping Hand
    // if (user.effectActive("Spotting") && !(this instanceof PokeBattle_Confusion)) {
    //     multipliers.base_damage_multiplier *= 1.5;
    // }
    // // Shimmering Heat
    // if (target.effectActive("ShimmeringHeat")) {
    //     multipliers.final_damage_multiplier *= 0.67;
    // }
    // // Echo
    // if (user.effectActive("Echo")) {
    //     multipliers.final_damage_multiplier *= 0.75;
    // }

    // // Mass Attack
    // if (battle.pbCheckGlobalAbility("MASSATTACK")) {
    //     const hpFraction = user.hp / user.totalhp;
    //     multipliers.final_damage_multiplier *= 1 - hpFraction;
    // }

    // Multi-targeting attacks
    if (move.move.isSpread() && battleState.multiBattle) {
        // TODO: Handle abilities
        // if (user.shouldAbilityApply("RESONANT", aiCheck)) {
        //     multipliers.final_damage_multiplier *= 1.25;
        // } else {
        multipliers.final_damage_multiplier *= 0.75;
        //}
    }

    // Battler properties
    // TODO: Handle avatar inherent buffs
    // multipliers.base_damage_multiplier *= user.dmgMult;
    // multipliers.base_damage_multiplier *= Math.max(0, 1.0 - target.dmgResist);

    // Critical hits
    if (doesMoveCrit(move, target)) {
        // TODO: Implement moves with increased critical hit damage
        multipliers.final_damage_multiplier *= move.move.getCriticalMultiplier();
    }

    // Random variance (What used to be for that)
    // TODO: handle selfhits
    //if (!(this instanceof PokeBattle_Confusion) && !(this instanceof PokeBattle_Charm)) {
    multipliers.final_damage_multiplier *= 0.9;
    //}

    // TODO: Move-specific final damage modifiers
    //multipliers.final_damage_multiplier = pbModifyDamage(multipliers.final_damage_multiplier, user, target);
    return [multipliers, typeEffectMult];
}

function flatDamageReductions(finalCalculatedDamage: number): number {
    // TODO: Abilities
    // if (target.shouldAbilityApply("DRAGONSBLOOD", aiCheck) && !battle.moldBreaker) {
    //     finalCalculatedDamage -= target.level;
    //     if (!aiCheck) {
    //         target.aiLearnsAbility("DRAGONSBLOOD");
    //     }
    // }

    // TODO: Field effects
    // if (battle.field.effectActive("WillfulRoom")) {
    //     finalCalculatedDamage -= 30;
    // }

    finalCalculatedDamage = Math.max(finalCalculatedDamage, 1);

    // TODO: Handle abilities
    // if (user.hasActiveAbility("NOBLEBLADE") && target.effectActive("ChoseStatus")) {
    //     finalCalculatedDamage = 0;
    // }

    return finalCalculatedDamage;
}

function doesMoveCrit(moveData: MoveData, target: PartyPokemon) {
    return moveData.criticalHit || target.volatileStatusEffects.Jinx;
}
