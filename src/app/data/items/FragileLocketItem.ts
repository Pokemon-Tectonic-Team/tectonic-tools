import { LoadedItem } from "@/preload/loadedDataClasses";
import { Item } from "../tectonic/Item";

export class FragileLocketItem extends Item {
    constructor(loaded: LoadedItem) {
        super(loaded);
    }

    static itemIds = ["FRAGILELOCKET"];
}
