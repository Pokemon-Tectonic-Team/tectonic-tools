# Pokémon Tectonic Team Code Format Specification

Date: April 24, 2025

## 1. Introduction

This document specifies the data format used for serializing and deserializing Pokémon Tectonic team data. The format is designed to efficiently represent Pokémon teams as compact binary data encoded in URL-safe Base64 strings that can be easily shared and stored. The format contains all data necessary to reconstruct the mechanical identity of a team, but does not include any cosmetic details.

### 1.1 TODO

-   Update this document with the new spec
-   Include this bit somewhere about the tectonic version

```
// Unused for now, but leave this code in for future reference that the format does contain the tectonic version
// const tectonicVersion = view.getUint16(2);
// let versionString = "";
// versionString += `${(tectonicVersion & VERSION_MAJOR_MASK) >>> VERSION_MAJOR_SHIFT}.`;
// versionString += `${(tectonicVersion & VERSION_MINOR_MASK) >>> VERSION_MINOR_SHIFT}.`;
// versionString += `${(tectonicVersion & VERSION_PATCH_MASK) >>> VERSION_PATCH_SHIFT}`;
// if ((tectonicVersion & VERSION_DEV_MASK) > 0) {
//     versionString += "-dev";
// }
```

## 2. Format Overview

The team code format represents a collection of up to 6 Pokémon as a version-tagged series of binary data chunks encoded in a single URL-safe Base64 string. Each chunk contains all properties necessary to define a single team member.

### 2.1 High-Level Structure

```
┌────────────┬────────────┬────────────┬─────┬────────────┐
│  Version   │  Pokémon   │  Pokémon   │ ... │  Pokémon   │
│   Header   │     1      │     2      │     │     N      │
└────────────┴────────────┴────────────┴─────┴────────────┘
```

The binary data consists of:

-   A 2-byte version header that encodes the Pokémon Tectonic game version
-   A sequence of variable-length binary chunks, each representing a single Pokémon

## 3. Version Header

The version header is a 16-bit unsigned integer with the following bit layout:

```
┌─────────────────┬─────────────────┬─────────────────┬─────┐
│    5 bits       │    5 bits       │    5 bits       │  1  │
│  Major Version  │  Minor Version  │  Patch Version  │ Dev │
└─────────────────┴─────────────────┴─────────────────┴─────┘
```

-   Bits 0-4: Major version (0-31)
-   Bits 5-9: Minor version (0-31)
-   Bits 10-14: Patch version (0-31)
-   Bit 15: Development flag (0 = release, 1 = development)

This corresponds to the Pokémon Tectonic game version from which the Pokémon data is sourced. This follows semantic versioning, with development builds indicated by the dev flag.

## 4. Pokémon Data Representation

Each Pokémon in a team is represented by the following properties:

| Property    | Description                            | Constraints                  |
| ----------- | -------------------------------------- | ---------------------------- |
| species     | The Pokémon species                    | Valid Pokémon Pokédex number |
| moves       | Array of up to 4 move identifiers      | Valid move indices           |
| ability     | The ability identifier                 | Valid ability index          |
| items       | Array of up to 2 held item identifiers | Valid held item indices      |
| itemType    | Type modifier for the first item       | Valid type index             |
| form        | The form identifier of the Pokémon     | Valid form ID                |
| level       | The Pokémon's level                    | Integer between 1 and 70     |
| stylePoints | Object containing 5 style point values | Integers between 0 and 20    |

Type indices refer to the position of a type in the ordering of Pokémon Tectonic's `types.txt` PBS data files. All similar indices start at 0.

Item indices refer to the position of an item in the ordering of Pokémon Tectonic's `items.txt` PBS data files, _after_ filtering down to only items for which the Pocket field is equal to 5. For example, in version 3.3.0-dev, the index of the Air Balloon is 0.

Ability indices refer to which of a Pokémon two legal abilities it can have. If a Pokémon only has one legal ability, either value (0 or 1) is valid, and refer to the same ability.

Move indices refer to the position of a move in the ordering of a Pokémon's list of learnable moves. This list must be constructed in a certain order to match up with Pokémon Tectonic's data structures. The order within these categories is as defined in the `pokemon.txt` PBS file for the Pokémon in question.

1. Tutor Moves
1. Line Moves
1. Form-Specific Moves
1. Level Moves (sorted by learn level)
   The list should strip out any undefined or duplicate entries, leaving the first entry in the latter case.

The form ID refers to the number assigned to a given form in the `pokemonforms.txt` PBS file. For a Pokémon's default form, the form ID is considered to be 0.

## 5. Binary Structure

Each Pokémon is encoded in a minimum of 12 bytes, with variable length up to 16 bytes depending on what optional data is included. The format consists of three mandatory 32-bit integers followed by optional data bytes.

### 5.1 First 32-bit Integer

```
┌─────────────────┬────────┬─────────────┬─────────────┐
│    11 bits      │ 1 bit  │   10 bits   │   10 bits   │
│  Pokémon Index  │ Ability│   Move 1    │   Move 2    │
└─────────────────┴────────┴─────────────┴─────────────┘
```

-   Bits 0-10: Pokémon Dex Number (0-2047)
-   Bit 11: Ability Index (0-1, selects between available abilities)
-   Bits 12-21: Move 1 Index (0-1023, index into Pokémon's move list)
-   Bits 22-31: Move 2 Index (0-1023, index into Pokémon's move list)

### 5.2 Second 32-bit Integer

```
┌─────────┬─────────┬─────────┬─────────┬─────────┬───────────┐
│  5 bits │  5 bits │  5 bits │  5 bits │  5 bits │  7 bits   │
│   HP SP │  ATK SP │  DEF SP │ SDEF SP │ SPD SP  │  Level    │
└─────────┴─────────┴─────────┴─────────┴─────────┴───────────┘
```

-   Bits 0-4: HP Style Points (0-20)
-   Bits 5-9: Attack Style Points (0-20)
-   Bits 10-14: Defense Style Points (0-20)
-   Bits 15-19: Special Defense Style Points (0-20)
-   Bits 20-24: Speed Style Points (0-20)
-   Bits 25-31: Level (1-70)

### 5.3 Third 32-bit Integer

```
┌─────────────┬─────────────┬────────────┬───┬───┬───┬───┐
│   10 bits   │   10 bits   │   8 bits   │ 1 │ 1 │ 1 │ 1 │
│   Move 3    │   Move 4    │   Item 1   │I2 │IT │ F │ - │
└─────────────┴─────────────┴────────────┴───┴───┴───┴───┘
```

-   Bits 0-9: Move 3 Index (0-1023, index into Pokémon's move list)
-   Bits 10-19: Move 4 Index (0-1023, index into Pokémon's move list)
-   Bits 20-27: Item 1 Index (0-255, index into item list)
-   Bit 28: Has Second Item Flag (0 = no second item, 1 = has second item)
-   Bit 29: Has Item Type Flag (0 = no item type, 1 = has item type)
-   Bit 30: Has Form Flag (0 = default form, 1 = has specific form)
-   Bit 31: Unused

### 5.4 Optional Data (0-4 bytes)

The optional data section can include up to 3 additional bytes based on the flags set in the third 32-bit integer:

1. If Has Second Item Flag (bit 28) is set:

    - 1 byte: Item 2 Index (0-255)

2. If Has Item Type Flag (bit 29) is set:

    - 1 byte: Item Type Index (0-255)

3. If Has Form Flag (bit 30) is set:
    - 1 byte: Form ID (0-255)

## 6. Encoding Process

### 6.1 Encoding Algorithm

1. Create a binary buffer starting with the 2-byte version header
2. For each Pokémon in the team (up to 6):
   a. Convert each property to its corresponding numeric index using version-specific mapping tables
   b. Pack the data according to the bit layout described in Section 5
   c. Append the resulting binary chunk to the buffer
3. Convert the entire binary buffer to a URL-safe Base64 string

### 6.2 Decoding Algorithm

1. Convert the URL-safe Base64 string to a binary buffer
2. Extract the version header from the first 2 bytes
3. For each chunk in the remaining buffer:
   a. Read the three 32-bit integers
   b. Determine if optional data exists based on flag bits
   c. Read optional data if present
   d. Map index values back to their corresponding entities using version-specific mapping tables
   e. Construct a Pokémon object with the decoded properties

## 7. Version Mapping

The binary format uses compact indices that are mapped to and from actual game data through version-specific mapping tables. These mappings convert between binary indices and game object identifiers for:

-   Pokémon species
-   Moves (per Pokémon)
-   Items
-   Types

Each version of the game has its own unique mappings, defined in a version map data structure.

## 8. Default Values and Error Handling

When encoding a team, any undefined/empty value in team data should be represented by the index -1. Since we use unsigned integers, this will wrap around to the maximum possible value and minimise the possibility of future collisions in the case that the number of entities to track expands.

When decoding a team, allow for the possibility of data to be unselected (for example, a team having no 6th Pokémon, or a Pokémon having no 4th move). If there is no entity at a given index, consider that slot undefined and log a warning for developers, as the version map may be incorrect.

However, certain values should never be undefined. A Pokémon's ability index should always be 0 or 1. A Pokémon's item type should default to Normal-type. A Pokémon's form should default to 0.

## 9. Constraints and Limitations

-   Pokémon level must be between 1 and 70
-   Style points must be between 0 and 20
-   Total style points should not exceed 50
-   Maximum team size: 6 Pokémon
-   Minimum bytes per Pokémon: 12 bytes
-   Maximum bytes per Pokémon: 16 bytes
-   Maximum encoded data size: 2 bytes (version) + 6 \* 16 bytes (max team) = 98 bytes before Base64 encoding

## 10. Example

### 10.1 Example of an Encoded Team

```
BEMYgdDEjKUpSiQhDCcAG4HxLYylKUoiUZxtABFCyn2MpSlKJKCADgATBKoljKUpSjKwsEgtAADBcTKMpSlKJHCcXg0jBDOcjKUpSiISDI0AAA
```

### 10.2 Example of a Decoded Team

```json
[
    "3.3.0-dev",
    {
        "species": "ESPEON",
        "ability": "OVERTHINKING",
        "moves": ["PSYCHIC", "CONFUSERAY", "SHADOWBALL", "MIASMA"],
        "items": ["EJECTPACK"],
        "itemType": "NORMAL",
        "form": 0,
        "level": 70,
        "stylePoints": { "hp": 10, "attacks": 10, "defense": 10, "spdef": 10, "speed": 10 }
    },
    {
        "species": "DELCATTY",
        "ability": "ABOVEITALL",
        "moves": ["FAKEOUT", "BLACKOUT", "HYPOTHERMIATE", "EXTREMESPEED"],
        "items": ["LEFTOVERS"],
        "itemType": "NORMAL",
        "form": 0,
        "level": 70,
        "stylePoints": { "hp": 10, "attacks": 10, "defense": 10, "spdef": 10, "speed": 10 }
    },
    {
        "species": "VOLCARONA",
        "ability": "DAWNFALL",
        "moves": ["PSYCHIC", "SMOLDERRAVE", "BUGBUZZ", "HEATWAVE"],
        "items": ["WILDCARD"],
        "itemType": "NORMAL",
        "form": 0,
        "level": 70,
        "stylePoints": { "hp": 10, "attacks": 10, "defense": 10, "spdef": 10, "speed": 10 }
    },
    {
        "pokemon": "LILLIGANT",
        "ability": "HERBALIST",
        "items": ["AGILITYHERB", "INTELLECTHERB"],
        "itemTypes": "NORMAL",
        "form": 0,
        "moves": ["BLOSSOM", "MOONBLAST", "PUFFBALL", "PETALDANCE"],
        "level": 70,
        "stylePoints": { "hp": 10, "attacks": 10, "defense": 10, "spdef": 10, "speed": 10 }
    },
    {
        "pokemon": "AGGRON",
        "ability": "ROCKHEAD",
        "items": ["CRYSTALVEIL"],
        "itemType": "ELECTRIC",
        "form": 0,
        "moves": ["EARTHQUAKE", "BEDROCKBREAKER", "SUPERPOWER", "HEAVYSLAM"],
        "level": 70,
        "stylePoints": { "hp": 10, "attacks": 10, "defense": 10, "spdef": 10, "speed": 10 }
    },
    {
        "pokemon": "NIBELONG",
        "ability": "LONGODDS",
        "items": ["LOADEDDICE"],
        "itemTypes": "NORMAL",
        "form": 0,
        "moves": ["IRONHEAD", "SACREDLOTS", "DRAGONDANCE", "FAKEOUT"],
        "level": 70,
        "stylePoints": { "hp": 10, "attacks": 10, "defense": 10, "spdef": 10, "speed": 10 }
    }
]
```

## 11. References

This specification is derived from the implementation in the `teamExport.ts` file, which provides the encoding and decoding functionality for the team code format.

The index mappings used for version compatibility are stored in the `versions.json` file, and constructed in the `loadData.ts` file.
