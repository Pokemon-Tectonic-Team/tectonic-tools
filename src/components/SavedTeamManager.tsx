import { PokePartyEncoding } from "@/app/data/pokeparty";
import { Pokemon } from "@/app/data/tectonic/Pokemon";
import { PartyPokemon } from "@/app/data/types/PartyPokemon";
import { JSX, useCallback, useEffect, useState } from "react";
import BasicButton from "./BasicButton";

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
