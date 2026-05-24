import { LoadedTribe } from "@/app/data/loadedDataClasses";

export class Tribe {
    id: string = "";
    activationCount: number = 0;
    name: string = "";
    description: string = "";

    static NULL: Tribe = new Tribe();

    constructor(loaded?: LoadedTribe) {
        if (!loaded) return;

        this.id = loaded.key;
        this.activationCount = loaded.activationCount;
        this.name = loaded.name;
        this.description = loaded.description;
    }
}
