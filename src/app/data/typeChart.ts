import { ExtraTypeAbility } from "./abilities/ExtraTypeAbility";
import { ExtraEffectiveMove } from "./moves/ExtraEffectiveMove";
import { ExtraTypeMove } from "./moves/ExtraTypeMove";
import { HitsFliersMove } from "./moves/HitsFliersMove";
import { Ability } from "./tectonic/Ability";
import { Move } from "./tectonic/Move";
import { PokemonType } from "./tectonic/PokemonType";
import { TectonicData } from "./tectonic/TectonicData";
import { PartyPokemon } from "./types/PartyPokemon";
import { isNull } from "./util";

interface AttackerData {
    type: PokemonType;
    move?: Move;
    abilities?: Ability[];
}

interface DefenderData {
    type1: PokemonType;
    type2?: PokemonType;
    abilities?: Ability[];
}

// Calculates the best mult value given all attacker moves in that case
export function calcTypeMatchup(atk: AttackerData, def: DefenderData) {
    const atkType = atk.type;
    const defType1 = def.type1;
    let thirdType: PokemonType | null = null;

    let defType1Calc = TectonicData.typeChart[atkType.index][defType1.index];

    // certain moves pierce ground immunity
    // TODO: Revisit this to make it more generic when e.g. gravity is implemented
    if (atk.move instanceof HitsFliersMove && atk.type.id === "GROUND") {
        defType1Calc = Math.max(defType1Calc, 1);
    }

    let defType2Calc = 1.0;
    let defAbilityCalc = 1.0;
    if (def.type2 !== undefined) {
        const defType2 = def.type2;
        defType2Calc = TectonicData.typeChart[atkType.index][defType2.index];
        // certain moves pierce ground immunity
        if (atk.move instanceof HitsFliersMove && atk.type.id === "GROUND") {
            defType2Calc = Math.max(defType2Calc, 1);
        }
    }

    // Process all defender abilities (supports Fragile Locket dual abilities)
    for (const defAbility of def.abilities ?? []) {
        // Apply modifiedMatchup from each ability
        defAbilityCalc *= defAbility.modifiedMatchup(atk.type);
        // certain moves pierce ground immunity
        if (defAbilityCalc === 0 && atk.move instanceof HitsFliersMove && atk.type.id === "GROUND") {
            defAbilityCalc = 1;
        }

        if (defAbility instanceof ExtraTypeAbility) {
            const defType3 = defAbility.extraType;
            if (
                defType3.id !== defType1.id &&
                defType3.id !== def.type2?.id
            ) {
                defAbilityCalc *= TectonicData.typeChart[atkType.index][defType3.index];
                thirdType = defType3;
            }
        }

        // Special ability effects based on type matchup
        if (defAbility.id == "WONDERGUARD" && defType1Calc * defType2Calc <= 1) {
            defAbilityCalc = 0;
        } else if (defAbility.id == "UNFAZED" && defType1Calc * defType2Calc == 1) {
            defAbilityCalc *= 0.8;
        } else if (defAbility.id == "WELLSUITED" && defType1Calc * defType2Calc < 1) {
            defAbilityCalc *= 0.5;
        } else if (defAbility.id == "FILTER" && defType1Calc * defType2Calc > 1) {
            defAbilityCalc *= 0.75;
        }
    }

    let atkAbilityCalc = 1.0;
    let atkMoveCalc = 1;

    // Process all attacker abilities (supports Fragile Locket dual abilities)
    const atkAbilities = atk.abilities ?? [];
    for (const atkAbility of atkAbilities) {
        if (atkAbility.flags.includes("MoldBreaking")) {
            defAbilityCalc = 1.0;
        } else if (atkAbility.id == "BREAKTHROUGH") {
            defType1Calc = defType1Calc == 0 ? 1.0 : defType1Calc;
            defType2Calc = defType2Calc == 0 ? 1.0 : defType2Calc;
            defAbilityCalc = defAbilityCalc == 0 && thirdType != null ? 1.0 : defAbilityCalc;
        } else if (atkAbility.id == "TINTEDLENS") {
            atkAbilityCalc *= defType1Calc * defType2Calc * defAbilityCalc < 1 ? 2 : 1;
        } else if (atkAbility.id == "EXPERTISE" && defType1Calc * defType2Calc > 1) {
            // only boost super effective hits
            atkAbilityCalc *= 1.3;
        } else if (atkAbility.id == "DRAGONSLAYER" && (defType1.id === "DRAGON" || def.type2?.id === "DRAGON")) {
            atkAbilityCalc *= 2;
        }
    }

    const atkMove = atk.move;
    if (atkMove && atkMove.isAttackingMove()) {
        if (atkMove instanceof ExtraEffectiveMove) {
            const effectiveType = atkMove.extraEffect;
            if (
                effectiveType.id === def.type1.id ||
                effectiveType.id === def.type2?.id ||
                effectiveType.id === thirdType?.id
            ) {
                atkMoveCalc = 2;
            }
        }

        if (atkMove instanceof ExtraTypeMove) {
            // should not recur by a depth of more than 1, since move is no longer defined
            atkMoveCalc *= calcTypeMatchup({ type: atkMove.extraType, abilities: atkAbilities }, def);
        }
    }

    return defType1Calc * defType2Calc * defAbilityCalc * atkAbilityCalc * atkMoveCalc;
}

export function calcBestMoveMatchup(mon: PartyPokemon, def: DefenderData): number {
    const calcs = mon.moves
        .filter((m) => m != undefined && !isNull(m) && m.isAttackingMove())
        .map((m) => calcTypeMatchup({ type: m.type, move: m, abilities: mon.getActiveAbilities() }, def));
    return calcs.length > 0 ? Math.max(...calcs) : 1;
}
