import { Pokemon } from "@/app/data/tectonic/Pokemon";
import { TectonicData } from "@/app/data/tectonic/TectonicData";
import { LoadedEncounterMap, LoadedEncounterTable } from "@/app/data/loadedDataClasses";

function printEncChance(table: LoadedEncounterTable, monId: string) {
    const currentEnc = table.encounters.find((e) => e.pokemon === monId);
    if (!currentEnc) {
        return "Error";
    }

    const currentWeight = currentEnc.weight;
    const totalWeight = table.encounters.reduce((sum, enc) => sum + enc.weight, 0);
    return ((currentWeight / totalWeight) * 100).toFixed(0) + "%";
}

function getNameForEncounterType(encounterType: string) {
    switch (encounterType) {
        case "Land":
            return "Grass";
        case "LandSparse":
            return "Sparse Grass";
        case "LandTall":
            return "Tall Grass";
        case "Special":
            return "Other";
        case "FloweryGrass":
            return "Yellow Flowers";
        case "FloweryGrass2":
            return "Blue Flowers";
        case "SewerWater":
            return "Sewage";
        case "SewerFloor":
            return "Dirty Floor";
        case "DarkCave":
            return "Dark Ground";
        case "Mud":
            return "Mud";
        case "Puddle":
            return "Puddle";
        case "LandTinted":
            return "Secret Grass";
        case "Cloud":
            return "Dark Clouds";
        case "ActiveWater":
            return "Deep Water";
        case "FishingContest":
            return "Surfing";
    }
    return "Unknown";
}

export default function EncounterDisplay({ pokemon }: { pokemon: Pokemon }) {
    const encounters: [string, LoadedEncounterMap[]][] = [];
    encounters.push([
        pokemon.id,
        Object.values(TectonicData.encounters).filter((e) =>
            e.tables.some((t) => t.encounters.some((enc) => enc.pokemon === pokemon.id))
        ),
    ]);

    pokemon.getEvoNode().callParents((node) => {
        const newEncounters = Object.values(TectonicData.encounters).filter((e) =>
            e.tables.some((t) => t.encounters.some((enc) => enc.pokemon === node.getData().pokemon))
        );
        if (newEncounters.length > 0) {
            encounters.push([node.getData().pokemon, newEncounters]);
        }
    });

    const thClass = "border py-2 bg-gray-700";
    const tbClass = "border py-2";

    return (
        encounters.length > 0 && (
            <table className="table-auto w-full text-center">
                <thead>
                    <tr>
                        <th className={thClass}>Pokemon</th>
                        <th className={thClass}>Location</th>
                        <th className={thClass}>Zone</th>
                        <th className={thClass}>Chance</th>
                    </tr>
                </thead>
                <tbody>
                    {encounters.map(([mon, ecMaps]) =>
                        ecMaps.map((ecMap) =>
                            ecMap.tables
                                .filter((t) => t.encounters.some((e) => e.pokemon === mon))
                                .map((t, index) => (
                                    <tr key={index}>
                                        <td className={`${tbClass} font-semibold`}>{TectonicData.pokemon[mon].name}</td>
                                        <td className={tbClass}>{ecMap.name}</td>
                                        <td className={tbClass}>
                                            {t.type == "Special" ? "Other" : getNameForEncounterType(t.type)}
                                        </td>
                                        <td className={tbClass}>
                                            {t.type == "Special" ? "Other" : printEncChance(t, mon)}
                                        </td>
                                    </tr>
                                ))
                        )
                    )}
                </tbody>
            </table>
        )
    );
}
