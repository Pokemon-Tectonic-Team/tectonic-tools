import { Move } from "../tectonic/Move";

export class BypassProtectMove extends Move {
    public bypassesProtect(): boolean {
        return true;
    }

    static moveCodes = [
        "AlwaysHits",
        "FrostbiteTargetAlwaysHitsInHail",
        "HitTwoToFiveTimesAlwaysHits",
        "NumbTargetAlwaysHitsInRainstormHitsTargetInSky",
        "RemoveProtections",
        "RemoveProtectionsBypassSubstituteAlwaysHits",
        "TwoTurnAttackInvulnerableRemoveProtections",
    ];
}
