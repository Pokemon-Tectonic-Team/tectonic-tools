import { PokePartyEncoding, PokePartyEncodingType } from "@/app/data/pokeparty";
import { Pokemon } from "@/app/data/tectonic/Pokemon";
import { defaultStylePoints, PartyPokemon } from "@/app/data/types/PartyPokemon";
import { isNull } from "@/app/data/util";
import { JSX, useCallback, useEffect, useState } from "react";
import BasicButton from "./BasicButton";
import DownloadFileButton from "./DownloadFileButton";

function exportToPBS(party: PartyPokemon[]): string {
    const lines: string[] = [];
    for (const mon of party) {
        if (isNull(mon.species)) continue;

        lines.push(`Pokemon = ${mon.species.id},${mon.level}`);

        const validMoves = mon.moves.filter((m) => !isNull(m));
        if (validMoves.length > 0) {
            lines.push(`    Moves = ${validMoves.map((m) => m.id).join(",")}`);
        }

        const abilities = mon.species.getAbilities(mon.form);
        const abilityIndex = abilities.findIndex((a) => a.id === mon.ability.id);
        lines.push(`    AbilityIndex = ${abilityIndex >= 0 ? abilityIndex : 0} # ${mon.ability.name}`);

        const sp = mon.stylePoints;
        if (!mon.spEquals(defaultStylePoints)) {
            lines.push(`    EV = ${sp.hp},${sp.attacks},${sp.defense},${sp.speed},${sp.attacks},${sp.spdef}`);
        }

        const validItems = mon.items.filter((i) => !isNull(i));
        if (validItems.length > 0) {
            lines.push(`    Item = ${validItems.map((i) => i.id).join(",")}`);
        }
        if (mon.hasTypeChangingItemAndCanChangeType()) {
            lines.push(`    ItemType = ${mon.itemType.id}`);
        }

        if (mon.form !== 0 && mon.form !== -1) {
            const formId = mon.species.forms[mon.form].formId;
            if (formId !== 0) {
                lines.push(`    Form = ${formId}`);
            }
        }
    }
    return lines.join("\n");
}

const teamManagementLocalStorageKeyV1 = "TeamManagementLocalStorageKey_V1";
const pokePartyLocalStorageV1 = "PokePartyLocalStorageKey_V1";

function getSavedTeamCodes(versionKey: string): Record<string, string> {
    const base64TeamsString = localStorage.getItem(versionKey);
    const base64Teams: Record<string, string> = base64TeamsString ? JSON.parse(base64TeamsString) : {};

    return base64Teams;
}

function saveTeamCodes(versionKey: string, codes: Record<string, string>): void {
    localStorage.setItem(versionKey, JSON.stringify(codes));
}

// Trys to migrate saved teams to the base64 grouped key local storage area.
// If someone has an error the idea is we release a fix then we can direct them to run this function from console
export function performSavedLegacyTeamMigrations(forceTry: boolean = false) {
    if (
        !(teamManagementLocalStorageKeyV1 in localStorage) || // Don't migrate if there is nothing to migrate
        (!forceTry && pokePartyLocalStorageV1 in localStorage) // Don't migrate if there are somehow new teams already
    ) {
        return;
    }

    const oldTeams = getSavedTeamCodes(teamManagementLocalStorageKeyV1);
    const newTeams: Record<string, string> = {};

    Object.keys(oldTeams).forEach((k) => {
        const oldTeam = PokePartyEncoding.decode(oldTeams[k]);
        newTeams[k] = PokePartyEncoding.encode(oldTeam);
    });
    saveTeamCodes(pokePartyLocalStorageV1, newTeams);
}

export default function SavedTeamManager({
    onLoad,
    exportMons,
}: {
    onLoad: (party: PartyPokemon[]) => void;
    exportMons?: PartyPokemon[];
}): JSX.Element {
    const [teamCode, setTeamCode] = useState<string>("");
    const [saveTeamName, setSaveTeamName] = useState<string>("");
    const [savedTeamCodes, setSavedTeamCodes] = useState<Record<string, string>>({});
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

    function exportTeam() {
        const code = PokePartyEncoding.encode(exportMons!);
        setTeamCode(code);

        navigator.clipboard.writeText(code);
        alert(`Team copied to clipboard!`);
    }

    function importTeam(code: string, showAlert: boolean = true) {
        if (!code || code.length == 0) {
            if (showAlert) {
                alert("No team or code found to load");
            }
            return;
        }

        try {
            setTeamCode(code);
            onLoad(PokePartyEncoding.decode(code).filter((x) => x.species != Pokemon.NULL));
            if (showAlert) {
                alert("Team imported successfully!");
            }
        } catch (error) {
            console.error("Import error:", error);
            alert("Invalid team code! Please check and try again.");
        }
    }

    function saveTeam() {
        if (saveTeamName.length == 0) {
            alert("Team must have a name to save");
            return;
        }

        const newCodes = { ...savedTeamCodes };
        newCodes[saveTeamName] = PokePartyEncoding.encode(exportMons!);

        saveTeamCodes(pokePartyLocalStorageV1, newCodes);
        setSavedTeamCodes(newCodes);
        alert("Saved!");
    }

    function deleteTeam() {
        if (!confirm(`Are you sure you want to delete the saved team "${saveTeamName}"?`)) {
            return;
        }

        const newCodes = { ...savedTeamCodes };
        delete newCodes[saveTeamName];

        saveTeamCodes(pokePartyLocalStorageV1, newCodes);
        setSavedTeamCodes(newCodes);
        setSaveTeamName("");
    }

    const importTeamCallback = useCallback(importTeam, [onLoad]);
    useEffect(() => {
        if (typeof window !== "undefined") {
            const code = new URLSearchParams(window.location.search).get("team") ?? "";

            setTeamCode(code);
            importTeamCallback(code, false);
        }

        performSavedLegacyTeamMigrations();
        setSavedTeamCodes(getSavedTeamCodes(pokePartyLocalStorageV1));
    }, [importTeamCallback]);

    return (
        <div className="flex gap-20">
            <div className="flex flex-col items-center gap-1">
                <h2 className="text-white text-2xl">Team Code</h2>
                <input
                    type="text"
                    placeholder="Team code"
                    className="border rounded px-2 py-1 bg-gray-700 text-white border-gray-600"
                    value={teamCode}
                    onChange={(e) => setTeamCode(e.target.value)}
                />
                <div className="flex gap-2">
                    <BasicButton onClick={() => importTeam(teamCode)}>Import</BasicButton>
                    {exportMons && <BasicButton onClick={exportTeam}>Export</BasicButton>}
                </div>
                {exportMons && (
                    <>
                        <button
                            className="text-gray-400 text-sm hover:text-gray-200 cursor-pointer"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                        >
                            Advanced {showAdvanced ? "▲" : "▼"}
                        </button>
                        {showAdvanced && (
                            <div className="flex gap-2">
                                <DownloadFileButton
                                    filename="teamcode.txt"
                                    generateContent={() =>
                                        PokePartyEncoding.encode(exportMons!, PokePartyEncodingType.Full)
                                    }
                                >
                                    Export for Tectonic
                                </DownloadFileButton>
                                <DownloadFileButton
                                    filename="team_pbs.txt"
                                    generateContent={() => exportToPBS(exportMons!)}
                                >
                                    Export to PBS
                                </DownloadFileButton>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="flex flex-col items-center gap-1">
                <h2 className="text-white text-2xl">Saved Teams</h2>
                <input
                    className="border rounded px-2 py-1 bg-gray-700 text-white border-gray-600"
                    list="savedTeamCodes"
                    value={saveTeamName}
                    onChange={(e) => setSaveTeamName(e.target.value)}
                    placeholder="Saved Teams"
                />
                <datalist id="savedTeamCodes">
                    {Object.keys(savedTeamCodes).map((t, i) => (
                        <option key={i} value={t} />
                    ))}
                </datalist>
                <div className="flex gap-2">
                    {" "}
                    <BasicButton onClick={() => importTeam(savedTeamCodes[saveTeamName])}>Load</BasicButton>
                    {exportMons && <BasicButton onClick={saveTeam}>Save</BasicButton>}
                    <BasicButton onClick={deleteTeam}>Delete</BasicButton>
                </div>
            </div>
        </div>
    );
}
