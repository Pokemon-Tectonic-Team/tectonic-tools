import { Item } from "./tectonic/Item";
import { Move } from "./tectonic/Move";
import { Pokemon, Stat, StylePoints } from "./tectonic/Pokemon";
import { TectonicData } from "./tectonic/TectonicData";
import { PartyPokemon } from "./types/PartyPokemon";
import { convertBase64UrlToBuffer, convertToBase64Url } from "./util";
import { VersionMap, versionMaps } from "./versions";

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 70;
export const STYLE_POINT_CAP = 50;
export const MIN_SP = 0;
export const MAX_SP = 20;
export const MIN_STEP = -12;
export const MAX_STEP = +12;

// Byte protocol shift
const VERSION_MAJOR_SHIFT = 0;
const VERSION_MINOR_SHIFT = 5;
const VERSION_PATCH_SHIFT = 10;
const VERSION_DEV_SHIFT = 15; // End of header, not repeated - u16
const POKEMON_SHIFT = 0;
const ABILITY_SHIFT = 11;
const MOVE1_SHIFT = 12;
const MOVE2_SHIFT = 22; // End of first u32
const STYLE_HP_SHIFT = 0;
const STYLE_ATK_SHIFT = 5;
const STYLE_DEF_SHIFT = 10;
const STYLE_SDEF_SHIFT = 15;
const STYLE_SPEED_SHIFT = 20;
const LEVEL_SHIFT = 25; // End of second u32
const MOVE3_SHIFT = 0;
const MOVE4_SHIFT = 10;
const ITEM1_SHIFT = 20;
const FLAG_HAS_2_ITEM_SHIFT = 28;
const FLAG_HAS_ITEM1_TYPE_SHIFT = 29;
const FLAG_HAS_FORM_SHIFT = 30; // End of third u32, next data is variable or non-existant based on previous flags
// Variable flag data is next, it's all aligned within it's own byte, so not shifting or masking needed

// Byte protocol other
const VERSION_BYTES = 2;
const MIN_BYTES_PER_POKEMON = 12;
const MAX_BYTES_PER_POKEMON = 16;
const MAX_TEAM_BYTES = VERSION_BYTES + 6 * MAX_BYTES_PER_POKEMON;

// Byte protocol masks
const VERSION_MAJOR_MASK = 0b11111 << VERSION_MAJOR_SHIFT;
const VERSION_MINOR_MASK = 0b11111 << VERSION_MINOR_SHIFT;
const VERSION_PATCH_MASK = 0b11111 << VERSION_PATCH_SHIFT;
const VERSION_DEV_MASK = 0b1 << VERSION_DEV_SHIFT; // End of header, not repeated - u16
const POKEMON_MASK = 0b111_1111_1111 << POKEMON_SHIFT;
const ABILITY_MASK = 0b1 << ABILITY_SHIFT;
const MOVE1_MASK = 0b11_1111_1111 << MOVE1_SHIFT;
const MOVE2_MASK = 0b11_1111_1111 << MOVE2_SHIFT; // End of first u32
const STYLE_HP_MASK = 0b11111 << STYLE_HP_SHIFT;
const STYLE_ATK_MASK = 0b11111 << STYLE_ATK_SHIFT;
const STYLE_DEF_MASK = 0b11111 << STYLE_DEF_SHIFT;
const STYLE_SDEF_MASK = 0b11111 << STYLE_SDEF_SHIFT;
const STYLE_SPEED_MASK = 0b11111 << STYLE_SPEED_SHIFT;
const LEVEL_MASK = 0b1111111 << LEVEL_SHIFT; // End of second u32
const MOVE3_MASK = 0b11_1111_1111 << MOVE3_SHIFT;
const MOVE4_MASK = 0b11_1111_1111 << MOVE4_SHIFT;
const ITEM1_MASK = 0b1111_1111 << ITEM1_SHIFT;
const FLAG_HAS_2_ITEM_MASK = 0b1 << FLAG_HAS_2_ITEM_SHIFT;
const FLAG_HAS_ITEM1_TYPE_MASK = 0b1 << FLAG_HAS_ITEM1_TYPE_SHIFT;
const FLAG_HAS_FORM_MASK = 0b1 << FLAG_HAS_FORM_SHIFT; // End of third u32, next data is variable or non-existant based on previous flags
// Variable flag data is next, it's all aligned within it's own byte, so no shifting or masking needed

export function styleFromStat(stat: Stat): keyof StylePoints {
    if (stat === "attack" || stat === "spatk") {
        return "attacks";
    }
    return stat;
}

function encodeChunk(version: VersionMap, view: DataView<ArrayBuffer>, byteOffset: number, data: PartyPokemon): number {
    const heldItems = version.indices.item;
    function getMonMoveShiftValue(dataIndex: number, shift: number, mask: number): number {
        const monMoves = version.indices.move[data.species.id];

        let index = -1;
        if (monMoves && monMoves[data.moves[dataIndex].id] !== undefined) {
            index = monMoves[data.moves[dataIndex].id];
        }

        return (index << shift) & mask;
    }

    let first_u32 = 0;
    let second_u32 = 0;
    let third_u32 = 0;
    view.buffer.resize(view.byteLength + MIN_BYTES_PER_POKEMON);

    // FindIndex returns -1 which maps to null values where applicable
    first_u32 |= (data.species.dex << POKEMON_SHIFT) & POKEMON_MASK;
    first_u32 |= (data.species.abilities.findIndex((x) => x.id == data.ability.id) << ABILITY_SHIFT) & ABILITY_MASK;
    first_u32 |= getMonMoveShiftValue(0, MOVE1_SHIFT, MOVE1_MASK);
    first_u32 |= getMonMoveShiftValue(1, MOVE2_SHIFT, MOVE2_MASK);
    view.setUint32(byteOffset, first_u32);
    byteOffset += 4;

    second_u32 |= (data.stylePoints.hp << STYLE_HP_SHIFT) & STYLE_HP_MASK;
    second_u32 |= (data.stylePoints.attacks << STYLE_ATK_SHIFT) & STYLE_ATK_MASK;
    second_u32 |= (data.stylePoints.defense << STYLE_DEF_SHIFT) & STYLE_DEF_MASK;
    second_u32 |= (data.stylePoints.spdef << STYLE_SDEF_SHIFT) & STYLE_SDEF_MASK;
    second_u32 |= (data.stylePoints.speed << STYLE_SPEED_SHIFT) & STYLE_SPEED_MASK;
    second_u32 |= (data.level << LEVEL_SHIFT) & LEVEL_MASK;
    view.setUint32(byteOffset, second_u32);
    byteOffset += 4;

    const hasSecondItem = data.items.length > 1 && data.items[1].id != Item.NULL.id;
    const hasItem1Type = data.hasTypeChangingItemAndCanChangeType();
    const hasForm = data.form != Pokemon.NULL.formId && data.form != -1;

    third_u32 |= getMonMoveShiftValue(2, MOVE3_SHIFT, MOVE3_MASK);
    third_u32 |= getMonMoveShiftValue(3, MOVE4_SHIFT, MOVE4_MASK);
    third_u32 |= ((data.items.length > 0 ? (heldItems[data.items[0].id] ?? -1) : -1) << ITEM1_SHIFT) & ITEM1_MASK;
    third_u32 |= (hasSecondItem ? 1 : 0) << FLAG_HAS_2_ITEM_SHIFT;
    third_u32 |= (hasItem1Type ? 1 : 0) << FLAG_HAS_ITEM1_TYPE_SHIFT;
    third_u32 |= (hasForm ? 1 : 0) << FLAG_HAS_FORM_SHIFT;
    view.setUint32(byteOffset, third_u32);
    byteOffset += 4;

    if (hasSecondItem) {
        view.buffer.resize(view.byteLength + 1);
        view.setUint8(byteOffset, heldItems[data.items[1].id]);
        byteOffset++;
    }
    if (hasItem1Type) {
        view.buffer.resize(view.byteLength + 1);
        view.setUint8(byteOffset, version.indices.type[data.itemType.id]);
        byteOffset++;
    }
    if (hasForm) {
        const formId = data.species.forms[data.form].formId;
        view.buffer.resize(view.byteLength + 1);
        view.setUint8(byteOffset, formId);
        byteOffset++;
    }

    return byteOffset;
}

export function encodeTeam(party: PartyPokemon[]): string {
    const view = new DataView(new ArrayBuffer(1, { maxByteLength: MAX_TEAM_BYTES }));

    const versionSplit = TectonicData.version.replace("dev", "").split(".");
    let versionU16 = TectonicData.isDev ? VERSION_DEV_MASK : 0;
    versionU16 |= (parseInt(versionSplit[0]) & 0x1f) << VERSION_MAJOR_SHIFT;
    versionU16 |= (parseInt(versionSplit[1]) & 0x1f) << VERSION_MINOR_SHIFT;
    versionU16 |= (parseInt(versionSplit[2]) & 0x1f) << VERSION_PATCH_SHIFT;
    view.buffer.resize(view.byteLength + 2);
    view.setUint16(0, versionU16);

    let byteOffset = 2;
    party
        .filter((x) => x.species.id != Pokemon.NULL.id)
        .forEach((x) => {
            byteOffset = encodeChunk(versionMaps[TectonicData.version], view, byteOffset, x);
        });

    return convertToBase64Url(view.buffer);
}

const decodeChunk = (
    version: VersionMap,
    view: DataView<ArrayBuffer>,
    byteOffset: number,
    party: PartyPokemon[],
): number => {
    const mon = new PartyPokemon();

    const firstU32 = view.getUint32(byteOffset);
    const pokemonDexNum = (firstU32 & POKEMON_MASK) >>> POKEMON_SHIFT;
    const pokemonAbilityIndex = (firstU32 & ABILITY_MASK) >>> ABILITY_SHIFT;
    const pokemonMove1Index = (firstU32 & MOVE1_MASK) >>> MOVE1_SHIFT;
    const pokemonMove2Index = (firstU32 & MOVE2_MASK) >>> MOVE2_SHIFT;
    byteOffset += 4;

    const secondU32 = view.getUint32(byteOffset);
    const styleHp = (secondU32 & STYLE_HP_MASK) >>> STYLE_HP_SHIFT;
    const styleAtk = (secondU32 & STYLE_ATK_MASK) >>> STYLE_ATK_SHIFT;
    const styleDef = (secondU32 & STYLE_DEF_MASK) >>> STYLE_DEF_SHIFT;
    const styleSDef = (secondU32 & STYLE_SDEF_MASK) >>> STYLE_SDEF_SHIFT;
    const styleSpeed = (secondU32 & STYLE_SPEED_MASK) >>> STYLE_SPEED_SHIFT;
    const level = (secondU32 & LEVEL_MASK) >>> LEVEL_SHIFT;
    byteOffset += 4;

    const thirdU32 = view.getUint32(byteOffset);
    const pokemonMove3Index = (thirdU32 & MOVE3_MASK) >>> MOVE3_SHIFT;
    const pokemonMove4Index = (thirdU32 & MOVE4_MASK) >>> MOVE4_SHIFT;
    const heldItem1Index = (thirdU32 & ITEM1_MASK) >>> ITEM1_SHIFT;
    const hasItem2 = (thirdU32 & FLAG_HAS_2_ITEM_MASK) > 0;
    const hasItem1Type = (thirdU32 & FLAG_HAS_ITEM1_TYPE_MASK) > 0;
    const hasForm = (thirdU32 & FLAG_HAS_FORM_MASK) > 0;
    byteOffset += 4;

    if (hasItem2) {
        mon.items[1] = TectonicData.items[version.keys.item[view.getUint8(byteOffset)]];
        byteOffset++;
    }
    if (hasItem1Type) {
        const byte = view.getUint8(byteOffset);
        const type = Object.keys(version.indices.type).find((x) => version.indices.type[x] == byte);
        if (type != undefined) {
            mon.itemType = TectonicData.types[type];
        }

        byteOffset++;
    }
    let formId: number | undefined = undefined;
    if (hasForm) {
        formId = view.getUint8(byteOffset);
        byteOffset++;
    }

    const pokemonKey = version.keys.pokemon[pokemonDexNum];
    const loadedMon = TectonicData.pokemon[pokemonKey];

    mon.species = loadedMon;
    const formIndex = loadedMon.forms.findIndex((f) => f.formId === formId);
    mon.form = Math.max(formIndex, 0);
    const abilities = loadedMon.getAbilities(mon.form);
    if (abilities.length === 1) {
        mon.ability = abilities[0];
    } else {
        mon.ability = abilities[pokemonAbilityIndex];
    }

    mon.moves[0] = TectonicData.moves[version.keys.move[loadedMon.id][pokemonMove1Index]] || Move.NULL;
    mon.moves[1] = TectonicData.moves[version.keys.move[loadedMon.id][pokemonMove2Index]] || Move.NULL;
    mon.moves[2] = TectonicData.moves[version.keys.move[loadedMon.id][pokemonMove3Index]] || Move.NULL;
    mon.moves[3] = TectonicData.moves[version.keys.move[loadedMon.id][pokemonMove4Index]] || Move.NULL;
    mon.items[0] = TectonicData.items[version.keys.item[heldItem1Index]] || Item.NULL;
    mon.stylePoints = {
        hp: styleHp,
        attacks: styleAtk,
        defense: styleDef,
        spdef: styleSDef,
        speed: styleSpeed,
    };
    mon.level = level;

    party.push(mon);
    return byteOffset;
};

export function decodeTeam(teamCode: string): PartyPokemon[] {
    const view = new DataView(convertBase64UrlToBuffer(teamCode));
    const party: PartyPokemon[] = [];

    if (view.byteLength > VERSION_BYTES) {
        const versionU16 = view.getUint16(0);
        let versionString = "";
        versionString += `${(versionU16 & VERSION_MAJOR_MASK) >>> VERSION_MAJOR_SHIFT}.`;
        versionString += `${(versionU16 & VERSION_MINOR_MASK) >>> VERSION_MINOR_SHIFT}.`;
        versionString += `${(versionU16 & VERSION_PATCH_MASK) >>> VERSION_PATCH_SHIFT}`;
        if ((versionU16 & VERSION_DEV_MASK) > 0) {
            versionString += "-dev";
        }

        let byteOffset = VERSION_BYTES;
        while (byteOffset < view.byteLength - 1) {
            byteOffset = decodeChunk(versionMaps[versionString], view, byteOffset, party);
        }
    }

    // Fill in blanks
    while (party.length < 6) {
        party.push(new PartyPokemon());
    }
    return party;
}
