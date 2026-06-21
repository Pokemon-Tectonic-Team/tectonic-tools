import { LoadedData, LoadedDataJson, LoadedEncounterMap } from "@/app/data/loadedDataClasses";
import loadedData from "public/data/loadedData.json";
import { AttackMultBoostAbility } from "../abilities/AttackMultBoostAbility";
import { BaseDamageBoostAbility } from "../abilities/BaseDamageBoostAbility";
import { CancelWeatherAbility } from "../abilities/CancelWeatherAbility";
import { ConditionalCritAbility } from "../abilities/ConditionalCritAbility";
import { DefensiveDamageAbility } from "../abilities/DefensiveDamageAbility";
import { DisguiseAbility } from "../abilities/DisguiseAbility";
import { FasterBoostDamageAbility } from "../abilities/FasterBoostDamageAbility";
import { OffensiveDamageBoostAbility } from "../abilities/OffensiveDamageBoostAbility";
import { ParanoidAbility } from "../abilities/ParanoidAbility";
import { STABBoostAbility } from "../abilities/STABBoostAbility";
import { StatModifyAbility } from "../abilities/StatModifyAbility";
import { TwoItemAbility } from "../abilities/TwoItemAbility";
import { TypeilateAbility } from "../abilities/TypeilateAbility";
import { TypeImmunityAbility } from "../abilities/TypeImmunityAbility";
import { TypeImmunityWeaknessAbility } from "../abilities/TypeImmunityWeaknessAbility";
import { TypeResistAbility } from "../abilities/TypeResistAbility";
import { TypeWeaknessAbility } from "../abilities/TypeWeaknessAbility";
import { WeatherStatAbility } from "../abilities/WeatherStatAbility";
import { CategoryBoostingItem } from "../items/CategoryBoostingItem";
import { EvioliteItem } from "../items/EvioliteItem";
import { FlatDamageBoostItem } from "../items/FlatDamageBoostItem";
import { FragileLocketItem } from "../items/FragileLocketItem";
import { LumberAxeItem } from "../items/LumberAxeItem";
import { StatBoostItem } from "../items/StatBoostItem";
import { StatLockItem } from "../items/StatLockItem";
import { SuperEffectiveBoostItem } from "../items/SuperEffectiveBoostItem";
import { SuperEffectiveResistItem } from "../items/SuperEffectiveResistItem";
import { TypeBoostingItem } from "../items/TypeBoostingItem";
import { TypeChangingItem } from "../items/TypeChangingItem";
import { WeatherImmuneItem } from "../items/WeatherImmuneItem";
import { AllyDefScalingMove } from "../moves/AllyDefScalingMove";
import { ConditionalAutoBoostMove } from "../moves/ConditionalAutoBoostMove";
import { ConditionalCritMove } from "../moves/ConditionalCritMove";
import { ConditionalInputBoostMove } from "../moves/ConditionalInputBoostMove";
import { DesperationMove } from "../moves/DesperationMove";
import { DifferentAttackingStatMove } from "../moves/DifferentAttackStatMove";
import { DifferentDefenseStatMove } from "../moves/DifferentDefenseStatMove";
import { ExtraEffectiveMove } from "../moves/ExtraEffectiveMove";
import { ExtraTypeMove } from "../moves/ExtraTypeMove";
import { FacadeMove } from "../moves/FacadeMove";
import { FaintedAllyScalingMove } from "../moves/FaintedAllyScalingMove";
import { FixedDamageMove } from "../moves/FixedDamageMove";
import { GutCheckMove } from "../moves/GutCheckMove";
import { HeightUserScalingMove } from "../moves/HeightUserScalingMove";
import { HPScalingMove } from "../moves/HPScalingMove";
import { IgnoreStatMove } from "../moves/IgnoreStatMove";
import { MultiHitMove } from "../moves/MultiHitMove";
import { RepeatScalingMove } from "../moves/RepeatScalingMove";
import { SlownessScalingMove } from "../moves/SlownessScalingMove";
import { SpeedScalingMove } from "../moves/SpeedScalingMove";
import { SpikeScalingMove } from "../moves/SpikeScalingMove";
import { SpitUpMove } from "../moves/SpitUpMove";
import { StackingMove } from "../moves/StackingMove";
import { StepScalingMove } from "../moves/StepScalingMove";
import { SuperAdaptiveMove } from "../moves/SuperAdaptiveMove";
import { TargetAttackMove } from "../moves/TargetAttackMove";
import { UserBelowHalfDoubleMove } from "../moves/UserBelowHalfDoubleMove";
import { VariableTypeMove } from "../moves/VariableTypeMove";
import { WeightTargetScalingMove } from "../moves/WeightTargetScalingMove";
import { WeightUserScalingMove } from "../moves/WeightUserScalingMove";
import { Ability } from "./Ability";
import { Item } from "./Item";
import { Move } from "./Move";
import { Pokemon } from "./Pokemon";
import { PokemonType } from "./PokemonType";
import { Trainer } from "./Trainer";
import { TrainerType } from "./TrainerType";
import { Tribe } from "./Tribe";

const data = loadedData as LoadedDataJson;
const moveSubclasses = [
    ConditionalCritMove,
    AllyDefScalingMove,
    ConditionalAutoBoostMove,
    ConditionalInputBoostMove,
    DesperationMove,
    DifferentAttackingStatMove,
    DifferentDefenseStatMove,
    ExtraEffectiveMove,
    FixedDamageMove,
    ExtraTypeMove,
    FacadeMove,
    FaintedAllyScalingMove,
    GutCheckMove,
    HeightUserScalingMove,
    HPScalingMove,
    IgnoreStatMove,
    MultiHitMove,
    RepeatScalingMove,
    SpeedScalingMove,
    SlownessScalingMove,
    SpikeScalingMove,
    SpitUpMove,
    StackingMove,
    StepScalingMove,
    SuperAdaptiveMove,
    TargetAttackMove,
    UserBelowHalfDoubleMove,
    VariableTypeMove,
    WeightTargetScalingMove,
    WeightUserScalingMove,
];
const moveModifiers: Array<{ moveCodes: string[]; apply: (move: Move) => void }> = [
    {
        moveCodes: [
            "AlwaysHits",
            "FrostbiteTargetAlwaysHitsInHail",
            "HitTwoToFiveTimesAlwaysHits",
            "NumbTargetAlwaysHitsInRainstormHitsTargetInSky",
            "RemoveProtections",
            "RemoveProtectionsBypassSubstituteAlwaysHits",
            "TwoTurnAttackInvulnerableRemoveProtections",
        ],
        apply: (m) => {
            m.bypassesProtect = true;
        },
    },
    {
        moveCodes: ["RemoveScreens"],
        apply: (m) => {
            m.ignoresScreens = true;
        },
    },
    {
        moveCodes: ["HitsTargetInSkyGroundsTarget"],
        apply: (m) => {
            m.hitsFliers = true;
        },
    },
    {
        moveCodes: ["DoubleDamageOnCrit"],
        apply: (m) => {
            m.criticalMultiplier = 3;
        },
    },
    {
        moveCodes: ["IgnoreTargetAbility"],
        apply: (m) => {
            m.ignoresTargetAbility = true;
        },
    },
];
const itemSubclasses = [
    CategoryBoostingItem,
    EvioliteItem,
    FlatDamageBoostItem,
    FragileLocketItem,
    LumberAxeItem,
    StatBoostItem,
    StatLockItem,
    SuperEffectiveBoostItem,
    SuperEffectiveResistItem,
    TypeBoostingItem,
    TypeChangingItem,
    WeatherImmuneItem,
    FragileLocketItem,
];

const abilitySubclasses = [
    AttackMultBoostAbility,
    BaseDamageBoostAbility,
    CancelWeatherAbility,
    ConditionalCritAbility,
    DefensiveDamageAbility,
    DisguiseAbility,
    FasterBoostDamageAbility,
    OffensiveDamageBoostAbility,
    ParanoidAbility,
    STABBoostAbility,
    StatModifyAbility,
    TwoItemAbility,
    TypeilateAbility,
    TypeImmunityAbility,
    TypeImmunityWeaknessAbility,
    TypeResistAbility,
    TypeWeaknessAbility,
    WeatherStatAbility,
];

const extraTypeAbilities: Record<string, string> = {
    HAUNTED: "GHOST",
    INFECTED: "GRASS",
    RUSTWRACK: "STEEL",
    SLUGGISH: "BUG",
    UNIDENTIFIED: "MUTANT",
    MOLTENADAPTED: "FIRE",
    PLASMAADAPTED: "ELECTRIC",
};

const abilityModifiers: Array<{ abilityIds: string[]; apply: (ability: Ability) => void }> = [
    {
        abilityIds: Object.keys(extraTypeAbilities),
        apply: (a) => {
            a.extraType = TectonicData.types[extraTypeAbilities[a.id]];
        },
    },
];

function fromLoaded<L extends LoadedData<L>, T>(load: Record<string, L>, ctor: new (l: L) => T): Record<string, T> {
    return Object.fromEntries(Object.entries(load).map(([k, v]) => [k, new ctor(v)]));
}

function fromLoadedMapped<L extends LoadedData<L>, T>(load: Record<string, L>, map: (l: L) => T): Record<string, T> {
    return Object.fromEntries(Object.entries(load).map(([k, v]) => [k, map(v)]));
}

function fromLoadedArray<L extends LoadedData<L>, T>(load: Record<string, L[]>, map: (l: L) => T): Record<string, T[]> {
    return Object.fromEntries(Object.entries(load).map(([k, v]) => [k, v.map(map)]));
}

type TectonicDataType = {
    version: string;
    isDev: boolean;
    types: Record<string, PokemonType>;
    tribes: Record<string, Tribe>;
    abilities: Record<string, Ability>;
    moves: Record<string, Move>;
    moveFilterCaches: Record<string, Move[]>;
    items: Record<string, Item>;
    heldItems: Array<Item>;
    pokemon: Record<string, Pokemon>;
    pokemonList: Pokemon[];
    forms: Record<string, Pokemon[]>;
    trainerTypes: Record<string, TrainerType>;
    trainers: Record<string, Trainer>;
    encounters: Record<string, LoadedEncounterMap>;
    typeChart: number[][];
    realTypes: PokemonType[];
};

// Note that the order of operations below is done explicitly.
// The .NULL statics require other data to be loaded and cannot be done as part of their declaration.
// To this end, the data not in-line loaded with TectonicData (left as {}) is done that way because it requires TectonicData to be instanciated first to populate
export const TectonicData: TectonicDataType = {
    version: data.version,
    isDev: data.version.includes("-dev"),
    types: fromLoaded(data.types, PokemonType),
    tribes: fromLoaded(data.tribes, Tribe),
    trainerTypes: fromLoaded(data.trainerTypes, TrainerType),
    encounters: Object.fromEntries(Object.entries(data.encounters)),
    typeChart: data.typeChart,
    abilities: {},
    moves: {},
    moveFilterCaches: {},
    items: {},
    heldItems: [],
    pokemon: {},
    pokemonList: [],
    forms: {},
    trainers: {},
    realTypes: [],
};

TectonicData.realTypes = Object.values(TectonicData.types).filter((t) => t.isRealType);

// Start of janky loading, not seen otherwise to users of this data
TectonicData.abilities = fromLoadedMapped(data.abilities, (x) => {
    const subclass = abilitySubclasses.find((sc) => sc.abilityIds.includes(x.key));
    const ability = subclass ? new subclass(x) : new Ability(x);
    for (const mod of abilityModifiers) {
        if (mod.abilityIds.includes(x.key)) {
            mod.apply(ability);
        }
    }
    return ability;
});
Ability.NULL = new Ability();

TectonicData.moves = fromLoadedMapped(data.moves, (x) => {
    const subclass = moveSubclasses.find((sc) => sc.moveCodes.includes(x.functionCode));
    const move = subclass ? new subclass(x) : new Move(x);
    for (const mod of moveModifiers) {
        if (mod.moveCodes.includes(x.functionCode)) {
            mod.apply(move);
        }
    }
    return move;
});
Move.NULL = new Move();
// these are some hefty filters potentially used a few times so may as well cache 'em
TectonicData.moveFilterCaches.nonSignatureMoves = Object.values(TectonicData.moves).filter((m) => !m.isSignature);
TectonicData.moveFilterCaches.stapleMoves = Object.values(TectonicData.moves).filter((m) => m.flags.includes("Staple"));

TectonicData.items = fromLoadedMapped(data.items, (x) => {
    const subclass = itemSubclasses.find((sc) => sc.itemIds.includes(x.key));
    return subclass ? new subclass(x) : new Item(x);
});
Item.NULL = new Item();

TectonicData.pokemon = fromLoaded(data.pokemon, Pokemon);
TectonicData.pokemonList = Object.values(TectonicData.pokemon);
Pokemon.NULL = new Pokemon();
TectonicData.forms = fromLoadedArray(data.forms, Pokemon.loadForm);

TectonicData.trainers = fromLoaded(data.trainers, Trainer);
Trainer.NULL = new Trainer();

// Start of post-load population
Object.entries(TectonicData.forms).forEach(([k, v]) => TectonicData.pokemon[k].addForms([Pokemon.NULL, ...v]));
TectonicData.heldItems = Object.values(TectonicData.items).filter((x) => x.pocket >= 9 && x.pocket <= 13);
