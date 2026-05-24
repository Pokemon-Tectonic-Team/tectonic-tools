import { writeFile } from "fs/promises";

const BASE_URL = "https://pokemon-tectonic-team.github.io/tectonic-data";

async function downloadData(dev: boolean) {
    const dataFile = dev ? "loadedData-dev.json" : "loadedData.json";

    const [loadedData, mappings] = await Promise.all([
        fetch(`${BASE_URL}/${dataFile}`).then((r) => {
            if (!r.ok) throw new Error(`Failed to fetch ${dataFile}: ${r.status}`);
            return r.text();
        }),
        fetch(`${BASE_URL}/pokePartyMappedEncodings.json`).then((r) => {
            if (!r.ok) throw new Error(`Failed to fetch pokePartyMappedEncodings.json: ${r.status}`);
            return r.text();
        }),
    ]);

    await Promise.all([
        writeFile("public/data/loadedData.json", loadedData),
        writeFile("public/data/pokePartyMappedEncodings.json", mappings),
    ]);

    console.log(`Downloaded ${dev ? "dev" : "public"} data from tectonic-data.`);
}

downloadData(process.argv[2] === "dev").catch((e) => console.error(e));
