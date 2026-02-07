import { Move } from "../tectonic/Move";

export class AlwaysCritMove extends Move {
    public alwaysCrits(): boolean {
        return true;
    }

    static moveCodes = ["AlwaysCriticalHit", "AlwaysCritialLowerUserSpeed1"];
}
