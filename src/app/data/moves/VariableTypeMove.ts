import { BattleState } from "@/app/data/battleState";
import { LoadedMove } from "@/app/data/loadedDataClasses";
import { Move } from "../tectonic/Move";
import { PokemonType } from "../tectonic/PokemonType";
import { TectonicData } from "../tectonic/TectonicData";
import { PartyPokemon } from "../types/PartyPokemon";
import { isNull } from "../util";

type MoveTypeFunction = (user: PartyPokemon, battleState: BattleState, name: string) => PokemonType | undefined;

// return the item type iff user is holding the relevant item
function typeFromItemType(user: PartyPokemon, typeItem: string): PokemonType | undefined {
    const itemType = user.items.some((i) => i.id === typeItem) ? user.itemType : PokemonType.NULL;
    if (!isNull(itemType)) {
        return itemType;
    }
}

const berryTypes = {
    CHILANBERRY: "NORMAL",
    CHERIBERRY: "FIRE",
    BLUKBERRY: "FIRE",
    WATMELBERRY: "FIRE",
    OCCABERRY: "FIRE",
    CHESTOBERRY: "WATER",
    NANABBERRY: "WATER",
    DURINBERRY: "WATER",
    PASSHOBERRY: "WATER",
    PECHABERY: "ELECTRIC",
    WEPEARBERRY: "ELECTRIC",
    BELUEBERRY: "ELECTRIC",
    WACANBERRY: "ELECTRIC",
    RAWSTBERRY: "GRASS",
    PINAPBERRY: "GRASS",
    RINDOBERRY: "GRASS",
    LIECHIBERRY: "GRASS",
    ASPEARBERRY: "ICE",
    POMEGBERRY: "ICE",
    YACHEBERRY: "ICE",
    GANLONBERRY: "ICE",
    LEPPABERRY: "FIGHTING",
    KELPSYBERRY: "FIGHTING",
    CHOPLEBERRY: "FIGHTING",
    SALACBERRY: "FIGHTING",
    CADOBERRY: "POISON",
    QUALOTBERRY: "POISON",
    KEBIABERRY: "POISON",
    PETAYABERRY: "POISON",
    PERSIMBERRY: "GROUND",
    HONDEWBERRY: "GROUND",
    SHUCABERRY: "GROUND",
    APICOTBERRY: "GROUND",
    LUMBERRY: "FLYING",
    GREPABERRY: "FLYING",
    COBABERRY: "FLYING",
    LANSATBERRY: "FLYING",
    SITRUSBERRY: "PSYCHIC",
    TAMATOBERRY: "PSYCHIC",
    PAYAPABERRY: "PSYCHIC",
    STARFBERRY: "PSYCHIC",
    FIGYBERRY: "BUG",
    CORNNBERRY: "BUG",
    TANGABERRY: "BUG",
    ENIGMABERRY: "BUG",
    WIKIBERRY: "ROCK",
    MAGOSTBERRY: "ROCK",
    CHARTIBERRY: "ROCK",
    MICLEBERRY: "ROCK",
    MAGOBERRY: "GHOST",
    RABUTABERRY: "GHOST",
    KASIBBERRY: "GHOST",
    CUSTAPBERRY: "GHOST",
    AGUAVBERRY: "DRAGON",
    NOMELBERRY: "DRAGON",
    HABANBERRY: "DRAGON",
    JABOCABERRY: "DRAGON",
    IAPAPABERRY: "DARK",
    SPELONBERRY: "DARK",
    COLBURBERRY: "DARK",
    ROWAPBERRY: "DARK",
    MARANGABERRY: "DARK",
    RAZZBERRY: "STEEL",
    PAMTREBERRY: "STEEL",
    BABIRIBERRY: "STEEL",
    ROSELIBERRY: "FAIRY",
    KEEBERRY: "FAIRY",
};

const technoBlastTypes = {
    DOUSEDRIVE: "WATER",
    SHOCKDRIVE: "ELECTRIC",
    BURNDRIVE: "FIRE",
    CHILLDRIVE: "ICE",
};

const gemTypes = {
    FIREGEM: "FIRE",
    WATERGEM: "WATER",
    ELECTRICGEM: "ELECTRIC",
    GRASSGEM: "GRASS",
    ICEGEM: "ICE",
    FIGHTINGGEM: "FIGHTING",
    POISONGEM: "POISON",
    GROUNDGEM: "GROUND",
    FLYINGGEM: "FLYING",
    PSYCHICGEM: "PSYCHIC",
    BUGGEM: "BUG",
    ROCKGEM: "ROCK",
    GHOSTGEM: "GHOST",
    DRAGONGEM: "DRAGON",
    DARKGEM: "DARK",
    STEELGEM: "STEEL",
    NORMALGEM: "NORMAL",
    FAIRYGEM: "FAIRY",
};

function typeFromItemMap(user: PartyPokemon, map: Record<string, string>): PokemonType | undefined {
    for (const item of user.items) {
        if (item.id in map) {
            return TectonicData.types[map[item.id]];
        }
    }
}

function typeFromUser(user: PartyPokemon): PokemonType {
    return user.species.getType1(user.form);
}

// workaround for special casing
function handleTypeDependsOnUserSpecialItem(user: PartyPokemon, _: BattleState, name: string) {
    switch (name) {
        case "JUDGMENT":
            return typeFromItemType(user, "PRISMATICPLATE");
        case "MULTIATTACK":
            return typeFromItemType(user, "MEMORYSET");
        case "TECHNOBLAST":
            return typeFromItemMap(user, technoBlastTypes);
    }
}

function prismaticPower(user: PartyPokemon) {
    // I'm not exactly sure what the priority here is if holding multiple items
    // But Unown can't in practice so it shouldn't matter
    return (
        typeFromItemType(user, "PRISMATICPLATE") ||
        typeFromItemType(user, "CRYSTALVEIL") ||
        typeFromItemMap(user, gemTypes)
    );
}

// WeatherCondition key type enforces having an answer for all of them
// which isn't what we want
const weatherTypes: Record<string, string> = {
    Sunshine: "FIRE",
    "Harsh Sunlight": "FIRE",
    Rainstorm: "WATER",
    "Heavy Rain": "WATER",
    Sandstorm: "ROCK",
    Hail: "ICE",
    Eclipse: "PSYCHIC",
    "Ring Eclipse": "PSYCHIC",
    Moonglow: "FAIRY",
    "Blood Moon": "FAIRY",
};

function typeFromWeather(battleState: BattleState) {
    if (battleState.weather in weatherTypes) {
        return TectonicData.types[weatherTypes[battleState.weather]];
    }
    return TectonicData.types["NORMAL"];
}

const variableTypeMoves: Record<string, MoveTypeFunction> = {
    TypeDependsOnUserSpecialItem: handleTypeDependsOnUserSpecialItem,
    NaturalGift: (user: PartyPokemon) => typeFromItemMap(user, berryTypes),
    TypeIsUserFirstType: typeFromUser,
    TypeDependsOnUserGemPlateVeil: prismaticPower,
    TypeDependsOnWeather: (_: PartyPokemon, battleState: BattleState) => typeFromWeather(battleState),
};

export class VariableTypeMove extends Move {
    typeFunction: MoveTypeFunction;
    constructor(move: LoadedMove) {
        super(move);
        this.typeFunction = variableTypeMoves[move.functionCode];
    }
    public getType(user: PartyPokemon, battleState: BattleState): PokemonType {
        return this.typeFunction(user, battleState, this.id) || super.getType(user, battleState);
    }

    static moveCodes = Object.keys(variableTypeMoves);
}
