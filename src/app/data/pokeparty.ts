import pokePartyMappedEncodings from "public/data/pokePartyMappedEncodings.json";
import { decodeTeam } from "./teamExport";
import { Ability } from "./tectonic/Ability";
import { Item } from "./tectonic/Item";
import { Move } from "./tectonic/Move";
import { Pokemon } from "./tectonic/Pokemon";
import { PokemonType } from "./tectonic/PokemonType";
import { TectonicData } from "./tectonic/TectonicData";
import { PartyPokemon } from "./types/PartyPokemon";
import { convertBase64UrlToBuffer, convertToBase64Url } from "./util";

interface PokePartyMappedEncodings {
    pokemon: Record<string, number>;
    abilities: Record<string, number>;
    moves: Record<string, number>;
    heldItems: Record<string, number>;
    types: Record<string, number>;
}
const encodingMapping = pokePartyMappedEncodings as PokePartyMappedEncodings;
const decodingMapping = {
    pokemon: Object.fromEntries(Object.entries(encodingMapping.pokemon).map(([k, v]) => [v, k])) as Record<
        number,
        string
    >,
    abilities: Object.fromEntries(Object.entries(encodingMapping.abilities).map(([k, v]) => [v, k])) as Record<
        number,
        string
    >,
    moves: Object.fromEntries(Object.entries(encodingMapping.moves).map(([k, v]) => [v, k])) as Record<number, string>,
    heldItems: Object.fromEntries(Object.entries(encodingMapping.heldItems).map(([k, v]) => [v, k])) as Record<
        number,
        string
    >,
    types: Object.fromEntries(Object.entries(encodingMapping.types).map(([k, v]) => [v, k])) as Record<number, string>,
};

export enum PokePartyEncodingType {
    Full = 0, // String ids are written out fully, no mapping required
    Mapped = 1, // String ids are mapped to an int when encoded and must be decoded via the same maping
}

enum BytesRequired {
    U8 = 1,
    U16 = 2,
    U32 = 4,
}

const POKE_PARTY_FORMAT_VERSION = 1;
const VERSION_BYTES = 4;

// Byte protocol shift
const ENCODING_SHIFT = 5; // The first 5 bits are reserved (unused in the new format, they represent the major version in the old one)
const VERSION_MAJOR_SHIFT = 0;
const VERSION_MINOR_SHIFT = 5;
const VERSION_PATCH_SHIFT = 10;
const VERSION_DEV_SHIFT = 15; // End of header, not repeated - u16
const STYLE_HP_SHIFT = 0;
const STYLE_ATK_SHIFT = 5;
const STYLE_DEF_SHIFT = 10;
const STYLE_SDEF_SHIFT = 15;
const STYLE_SPEED_SHIFT = 20;
const LEVEL_SHIFT = 25; // Stats and style points fit into one u32
const POKEMON_MAPPED_ID_SHIFT = 0;
const ABILITY_MAPPED_ID_SHIFT = 13;
const MOVE1_LOWER_7BITS_MAPPED_ID_SHIFT = 25; // First u32
const MOVE1_UPPER_6BITS_MAPPED_ID_SHIFT = 0;
const MOVE2_MAPPED_ID_SHIFT = 6;
const MOVE3_MAPPED_ID_SHIFT = 19; // Second u32
const MOVE4_MAPPED_ID_SHIFT = 0;
const ITEM1_MAPPED_ID_SHIFT = 13;
const FORM_SHIFT = 22;
const FLAG_ITEM2_SHIFT = 30;
const FLAG_ITEM1_TYPE_SHIFT = 31; // Third u32

// Byte protocol masks
const OLD_CODE_CHECK_MASK = 0x1f;
const ENCODING_MASK = 0xe0;
//const VERSION_MAJOR_MASK = 0b11111 << VERSION_MAJOR_SHIFT;
//const VERSION_MINOR_MASK = 0b11111 << VERSION_MINOR_SHIFT;
//const VERSION_PATCH_MASK = 0b11111 << VERSION_PATCH_SHIFT;
const VERSION_DEV_MASK = 0b1 << VERSION_DEV_SHIFT; // End of header, not repeated - u16
const STYLE_HP_MASK = 0b11111 << STYLE_HP_SHIFT;
const STYLE_ATK_MASK = 0b11111 << STYLE_ATK_SHIFT;
const STYLE_DEF_MASK = 0b11111 << STYLE_DEF_SHIFT;
const STYLE_SDEF_MASK = 0b11111 << STYLE_SDEF_SHIFT;
const STYLE_SPEED_MASK = 0b11111 << STYLE_SPEED_SHIFT;
const LEVEL_MASK = 0b1111111 << LEVEL_SHIFT;
const POKEMON_MAPPED_ID_MASK = 0x1fff << POKEMON_MAPPED_ID_SHIFT;
const ABILITY_MAPPED_ID_MASK = 0xfff << ABILITY_MAPPED_ID_SHIFT;
const MOVE1_LOWER_7BITS_MAPPED_ID_MASK = 0x7f << MOVE1_LOWER_7BITS_MAPPED_ID_SHIFT;
const MOVE1_UPPER_6BITS_MAPPED_ID_MASK = 0x3f << MOVE1_UPPER_6BITS_MAPPED_ID_SHIFT;
const MOVE2_MAPPED_ID_MASK = 0x1fff << MOVE2_MAPPED_ID_SHIFT;
const MOVE3_MAPPED_ID_MASK = 0x1fff << MOVE3_MAPPED_ID_SHIFT;
const MOVE4_MAPPED_ID_MASK = 0x1fff << MOVE4_MAPPED_ID_SHIFT;
const ITEM1_MAPPED_ID_MASK = 0x1ff << ITEM1_MAPPED_ID_SHIFT;
const FORM_MASK = 0xf << FORM_SHIFT;
const FLAG_ITEM2_MASK = 0x1 << FLAG_ITEM2_SHIFT;
const FLAG_ITEM1_TYPE_MASK = 0x1 << FLAG_ITEM1_TYPE_SHIFT;

// TODO for later poke party work: Store alongside the entry in local storage the name for the entry (ie. single mon name / team name)
export class PokePartyEncoding {
    // Can encode a team of any size. Pokemon can have any ability and any move
    static encode(party: PartyPokemon[], encoding: PokePartyEncodingType = PokePartyEncodingType.Mapped): string {
        const pokePartyEncodingU8 = encoding << ENCODING_SHIFT;
        const pokePartyVersionU8 = POKE_PARTY_FORMAT_VERSION;
        const versionSplit = TectonicData.version.replace("dev", "").split(".");
        let versionU16 = TectonicData.version.includes("-dev") ? VERSION_DEV_MASK : 0;
        versionU16 |= (parseInt(versionSplit[0]) & 0x1f) << VERSION_MAJOR_SHIFT;
        versionU16 |= (parseInt(versionSplit[1]) & 0x1f) << VERSION_MINOR_SHIFT;
        versionU16 |= (parseInt(versionSplit[2]) & 0x1f) << VERSION_PATCH_SHIFT;

        const data: [number, BytesRequired][] = [
            [pokePartyEncodingU8, BytesRequired.U8],
            [pokePartyVersionU8, BytesRequired.U8],
            [versionU16, BytesRequired.U16],
        ];
        for (const pokemon of party.filter((x) => x.species.id != Pokemon.NULL.id)) {
            const has1Item = pokemon.items.length >= 1 && pokemon.items[0] != Item.NULL;
            const has2Items = pokemon.items.length == 2 && pokemon.items[1] != Item.NULL;
            const hasItem1Type = pokemon.itemType?.id != undefined; // Pretty sure this is always true because we use NORMAL instead of a defined Type.NULL value in PartyPokemon
            const statsU32 = encodeStats(pokemon);

            if (encoding == PokePartyEncodingType.Full) {
                const u8s: number[] = [];
                encodeStringId(pokemon.species.id, u8s);
                encodeStringId(pokemon.ability.id, u8s);
                encodeStringId(has1Item ? pokemon.items[0].id : "", u8s);
                encodeStringId(pokemon.itemType?.id ?? "", u8s);
                encodeStringId(has2Items ? pokemon.items[1].id : "", u8s);
                encodeStringId(pokemon.moves[0]?.id ?? "", u8s);
                encodeStringId(pokemon.moves[1]?.id ?? "", u8s);
                encodeStringId(pokemon.moves[2]?.id ?? "", u8s);
                encodeStringId(pokemon.moves[3]?.id ?? "", u8s);
                u8s.push(pokemon.form);

                u8s.forEach((x) => data.push([x, BytesRequired.U8]));
                data.push([statsU32, BytesRequired.U32]);
            } else if (encoding == PokePartyEncodingType.Mapped) {
                const move1Id = encodeMapId("moves", pokemon.moves[0]?.id, 0);
                const firstU32 =
                    encodeMapId("pokemon", pokemon.species.id, POKEMON_MAPPED_ID_SHIFT) |
                    encodeMapId("abilities", pokemon.ability.id, ABILITY_MAPPED_ID_SHIFT) |
                    ((move1Id & 0x7f) << MOVE1_LOWER_7BITS_MAPPED_ID_SHIFT);
                const secondU32 =
                    (((move1Id & 0x1f80) >>> 7) << MOVE1_UPPER_6BITS_MAPPED_ID_SHIFT) |
                    encodeMapId("moves", pokemon.moves[1]?.id, MOVE2_MAPPED_ID_SHIFT) |
                    encodeMapId("moves", pokemon.moves[2]?.id, MOVE3_MAPPED_ID_SHIFT);
                const thirdU32 =
                    encodeMapId("moves", pokemon.moves[3]?.id, MOVE4_MAPPED_ID_SHIFT) |
                    encodeMapId("heldItems", has1Item ? pokemon.items[0].id : undefined, ITEM1_MAPPED_ID_SHIFT) |
                    (pokemon.form << FORM_SHIFT) |
                    ((has2Items ? 1 : 0) << FLAG_ITEM2_SHIFT) |
                    ((hasItem1Type ? 1 : 0) << FLAG_ITEM1_TYPE_SHIFT);

                data.push([firstU32, BytesRequired.U32]);
                data.push([secondU32, BytesRequired.U32]);
                data.push([thirdU32, BytesRequired.U32]);
                data.push([statsU32, BytesRequired.U32]);
                if (has2Items) data.push([encodeMapId("heldItems", pokemon.items[1].id, 0), BytesRequired.U16]);
                if (hasItem1Type) data.push([encodeMapId("types", pokemon.itemType.id, 0), BytesRequired.U8]);
            }
        }

        const byteSize = data.reduce((accumulator, currentValue) => accumulator + currentValue[1], 0);
        const view = new DataView(new ArrayBuffer(byteSize));
        for (let i = 0, offset = 0; i < data.length; i++) {
            switch (data[i][1]) {
                case BytesRequired.U8:
                    view.setUint8(offset, data[i][0]);
                    break;
                case BytesRequired.U16:
                    view.setUint16(offset, data[i][0]);
                    break;
                case BytesRequired.U32:
                    view.setUint32(offset, data[i][0]);
                    break;
            }
            offset += data[i][1];
        }
        return convertToBase64Url(view.buffer);
    }

    static decode(base64: string): PartyPokemon[] {
        const view = new DataView(convertBase64UrlToBuffer(base64));
        const party: PartyPokemon[] = [];

        if (view.byteLength >= VERSION_BYTES) {
            decodeTeam(base64);
            if ((view.getUint8(1) & OLD_CODE_CHECK_MASK) != 0) {
                // Check at offset 1 because the old format stored the version as a u16.
                // Since endianess is a thing (this is big endian) that puts our lower byte actually 2nd not first.
                // The decode below will handle as the old format and if this path was not taken we don't care about this endianess here

                // TODO: This must be an old code, for now use the old decoder, but eventually we will want to phase these out.
                return decodeTeam(base64);
            }

            const encoding = ((view.getUint8(0) & ENCODING_MASK) >>> ENCODING_SHIFT) as PokePartyEncodingType;
            let offset = VERSION_BYTES;
            while (offset < view.byteLength) {
                const mon = new PartyPokemon();
                if (encoding == PokePartyEncodingType.Full) {
                    let monId, abilityId, item1Id, item1TypeId, item2Id, move1Id, move2Id, move3Id, move4Id: string;
                    [monId, offset] = decodeStringId(view, offset);
                    [abilityId, offset] = decodeStringId(view, offset);
                    [item1Id, offset] = decodeStringId(view, offset);
                    [item1TypeId, offset] = decodeStringId(view, offset);
                    [item2Id, offset] = decodeStringId(view, offset);
                    [move1Id, offset] = decodeStringId(view, offset);
                    [move2Id, offset] = decodeStringId(view, offset);
                    [move3Id, offset] = decodeStringId(view, offset);
                    [move4Id, offset] = decodeStringId(view, offset);
                    const form = view.getUint8(offset);
                    offset += 1;

                    mon.species = TectonicData.pokemon[monId];
                    mon.ability = TectonicData.abilities[abilityId] || Ability.NULL;
                    if (item1Id.length > 0) mon.items[0] = TectonicData.items[item1Id] || Item.NULL;
                    if (item2Id.length > 0) mon.items[1] = TectonicData.items[item2Id] || Item.NULL;
                    if (item1TypeId.length > 0) mon.itemType = TectonicData.types[item1TypeId] || PokemonType.NULL;
                    if (move1Id.length > 0) mon.moves[0] = TectonicData.moves[move1Id] || Move.NULL;
                    if (move2Id.length > 0) mon.moves[1] = TectonicData.moves[move2Id] || Move.NULL;
                    if (move3Id.length > 0) mon.moves[2] = TectonicData.moves[move3Id] || Move.NULL;
                    if (move4Id.length > 0) mon.moves[3] = TectonicData.moves[move4Id] || Move.NULL;
                    const formIndex = mon.species.forms.findIndex((f) => f.formId === form);
                    mon.form = Math.max(formIndex, 0);
                    offset = decodeStats(mon, view, offset);
                } else if (PokePartyEncodingType.Mapped) {
                    const firstU32 = view.getUint32(offset);
                    const secondU32 = view.getUint32(offset + 4);
                    const thirdU32 = view.getUint32(offset + 8);
                    offset = decodeStats(mon, view, offset + 12);

                    const move1LowerBits =
                        (firstU32 & MOVE1_LOWER_7BITS_MAPPED_ID_MASK) >>> MOVE1_LOWER_7BITS_MAPPED_ID_SHIFT;
                    const move1UpperBits =
                        (secondU32 & MOVE1_UPPER_6BITS_MAPPED_ID_MASK) >>> MOVE1_UPPER_6BITS_MAPPED_ID_SHIFT;
                    const move1Id = move1LowerBits | (move1UpperBits << 7);
                    const hasItem2 = (thirdU32 & FLAG_ITEM2_MASK) != 0;
                    const hasItem1Type = (thirdU32 & FLAG_ITEM1_TYPE_MASK) != 0;

                    mon.species = decodeMapId(
                        "pokemon",
                        firstU32,
                        POKEMON_MAPPED_ID_SHIFT,
                        POKEMON_MAPPED_ID_MASK,
                        TectonicData.pokemon,
                        Pokemon.NULL,
                    );
                    mon.ability = decodeMapId(
                        "abilities",
                        firstU32,
                        ABILITY_MAPPED_ID_SHIFT,
                        ABILITY_MAPPED_ID_MASK,
                        TectonicData.abilities,
                        Ability.NULL,
                    );
                    mon.moves[0] = move1Id == 0 ? Move.NULL : TectonicData.moves[decodingMapping.moves[move1Id]];
                    mon.moves[1] = decodeMapId(
                        "moves",
                        secondU32,
                        MOVE2_MAPPED_ID_SHIFT,
                        MOVE2_MAPPED_ID_MASK,
                        TectonicData.moves,
                        Move.NULL,
                    );
                    mon.moves[2] = decodeMapId(
                        "moves",
                        secondU32,
                        MOVE3_MAPPED_ID_SHIFT,
                        MOVE3_MAPPED_ID_MASK,
                        TectonicData.moves,
                        Move.NULL,
                    );
                    mon.moves[3] = decodeMapId(
                        "moves",
                        thirdU32,
                        MOVE4_MAPPED_ID_SHIFT,
                        MOVE4_MAPPED_ID_MASK,
                        TectonicData.moves,
                        Move.NULL,
                    );
                    mon.form = (thirdU32 & FORM_MASK) >>> FORM_SHIFT;
                    mon.items[0] = decodeMapId(
                        "heldItems",
                        thirdU32,
                        ITEM1_MAPPED_ID_SHIFT,
                        ITEM1_MAPPED_ID_MASK,
                        TectonicData.items,
                        Item.NULL,
                    );

                    if (hasItem2) {
                        const item2Id = view.getUint16(offset);
                        offset += 2;
                        mon.items[1] = TectonicData.items[decodingMapping.heldItems[item2Id]];
                    }
                    if (hasItem1Type) {
                        const item1TypeId = view.getUint8(offset);
                        offset++;
                        mon.itemType = TectonicData.types[decodingMapping.types[item1TypeId]];
                    }
                } else break;

                party.push(mon);
            }
        }

        return party;
    }
}

// Encodes style points and level into a u32
function encodeStats(pokemon: PartyPokemon): number {
    let stats = 0;
    stats |= (pokemon.stylePoints.hp << STYLE_HP_SHIFT) & STYLE_HP_MASK;
    stats |= (pokemon.stylePoints.attacks << STYLE_ATK_SHIFT) & STYLE_ATK_MASK;
    stats |= (pokemon.stylePoints.defense << STYLE_DEF_SHIFT) & STYLE_DEF_MASK;
    stats |= (pokemon.stylePoints.spdef << STYLE_SDEF_SHIFT) & STYLE_SDEF_MASK;
    stats |= (pokemon.stylePoints.speed << STYLE_SPEED_SHIFT) & STYLE_SPEED_MASK;
    stats |= (pokemon.level << LEVEL_SHIFT) & LEVEL_MASK;

    return stats;
}

// Decodes style points and level. Returns the new offset
function decodeStats(pokemon: PartyPokemon, view: DataView<ArrayBuffer>, offset: number): number {
    const stats = view.getUint32(offset);
    const styleHp = (stats & STYLE_HP_MASK) >>> STYLE_HP_SHIFT;
    const styleAtk = (stats & STYLE_ATK_MASK) >>> STYLE_ATK_SHIFT;
    const styleDef = (stats & STYLE_DEF_MASK) >>> STYLE_DEF_SHIFT;
    const styleSDef = (stats & STYLE_SDEF_MASK) >>> STYLE_SDEF_SHIFT;
    const styleSpeed = (stats & STYLE_SPEED_MASK) >>> STYLE_SPEED_SHIFT;
    const level = (stats & LEVEL_MASK) >>> LEVEL_SHIFT;

    pokemon.stylePoints = {
        hp: styleHp,
        attacks: styleAtk,
        defense: styleDef,
        spdef: styleSDef,
        speed: styleSpeed,
    };
    pokemon.level = level;
    return offset + 4;
}

// Encodes the string id as (num chars (u8)) (u8 value 1, 2, 3...)
function encodeStringId(id: string, u8s: number[]) {
    u8s.push(id.length);
    for (let i = 0; i < id.length; i++) {
        u8s.push(id.charCodeAt(i));
    }
}

// Decodes the string id from (num chars (u8)) (u8 value 1, 2, 3...). Returns [id, newOffset]
function decodeStringId(view: DataView<ArrayBuffer>, offset: number): [string, number] {
    const numChars = view.getUint8(offset++);
    let id = "";

    for (let i = 0; i < numChars; i++) {
        id += String.fromCharCode(view.getUint8(offset++));
    }
    return [id, offset];
}

// Finds the mapping from the mapping file. If the key is undefined 0 is returned
function encodeMapId(category: keyof PokePartyMappedEncodings, key: string | undefined, shift: number): number {
    return (key == "" || key == undefined ? 0 : encodingMapping[category][key]) << shift;
}

// Decodes the mapping value, or the default value when not defined
function decodeMapId<T>(
    category: keyof PokePartyMappedEncodings,
    u32: number,
    shift: number,
    mask: number,
    tectonicDataRecord: Record<string, T>,
    def: T,
): T {
    const key = (u32 & mask) >>> shift;
    return key == 0 ? def : tectonicDataRecord[decodingMapping[category][key]];
}
