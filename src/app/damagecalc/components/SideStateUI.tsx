import { nullSideState, SideState } from "@/app/data/battleState";
import Checkbox from "@/components/Checkbox";
import { ReactNode, useState } from "react";

const screenStateKeys: Array<keyof SideState> = ["reflect", "lightScreen", "auroraVeil"];
const screenStateNameMap: Record<string, string> = {
    reflect: "Reflect",
    lightScreen: "Light Screen",
    auroraVeil: "Aurora Veil",
};

export default function SideStateUI({ onUpdate }: { onUpdate: (sideState: SideState) => void }): ReactNode {
    const [sideState, setSideState] = useState<SideState>(nullSideState);
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

    return (
        <div className="flex flex-col gap-1 mb-1">
            <div className="flex gap-2">
                {screenStateKeys.map((k) => (
                    <Checkbox
                        key={k}
                        checked={sideState[k] as boolean}
                        onChange={() => {
                            const newState = { ...sideState, [k]: !sideState[k] };
                            setSideState(newState);
                            onUpdate(newState);
                        }}
                    >
                        {screenStateNameMap[k]}
                    </Checkbox>
                ))}
                <button
                    className="text-sm text-gray-400 hover:text-white"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                >
                    {showAdvanced ? "▼ Advanced" : "▶ Advanced"}
                </button>
            </div>
            {showAdvanced && (
                <div className="flex items-center gap-2">
                    <label className="text-sm">Incoming Damage Multiplier:</label>
                    <input
                        type="number"
                        step="0.1"
                        min="0"
                        className="w-16 px-2 py-1 rounded bg-gray-700 border border-gray-600 text-center"
                        value={sideState.customDamageMultiplier}
                        onChange={(e) => {
                            const newState = { ...sideState, customDamageMultiplier: parseFloat(e.target.value) || 1 };
                            setSideState(newState);
                            onUpdate(newState);
                        }}
                    />
                </div>
            )}
        </div>
    );
}
