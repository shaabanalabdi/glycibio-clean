import path from "node:path";
import { ImageProcessor } from "../src/services/ImageProcessor.js";

const brainDir = "C:/Users/shaab/.gemini/antigravity-ide/brain/2c08c6c4-ecfe-471f-941a-57bf9028d218";
const uploadDir = "uploads/products";

const files = [
    {
        input: path.join(brainDir, "pate_noisette_1781740012862.png"),
        output: path.join(uploadDir, "pate-noisette-ig-bas.webp")
    },
    {
        input: path.join(brainDir, "chocolat_noir_1781740021253.png"),
        output: path.join(uploadDir, "chocolat-amandes-ig-bas.webp")
    },
    {
        input: path.join(brainDir, "kombucha_gingembre_1781740558904.png"),
        output: path.join(uploadDir, "kombucha-gingembre-ig-bas.webp")
    },
    {
        input: path.join(brainDir, "pesto_kale_1781740568976.png"),
        output: path.join(uploadDir, "pesto-kale-ig-bas.webp")
    },
    {
        input: path.join(brainDir, "pates_lentilles_1781740580638.png"),
        output: path.join(uploadDir, "pates-lentilles-ig-bas.webp")
    },
    {
        input: path.join(brainDir, "puree_patates_1781740589443.png"),
        output: path.join(uploadDir, "puree-patates-ig-moyen.webp")
    },
    {
        input: path.join(brainDir, "sauce_tomate_1781740815384.png"),
        output: path.join(uploadDir, "sauce-tomate.webp")
    },
    {
        input: path.join(brainDir, "proteine_pois_1781740824121.png"),
        output: path.join(uploadDir, "proteine-pois.webp")
    },
    {
        input: path.join(brainDir, "farine_coco_1781740833201.png"),
        output: path.join(uploadDir, "farine-coco.webp")
    },
    {
        input: path.join(brainDir, "stevia_poudre_1781740844864.png"),
        output: path.join(uploadDir, "stevia-poudre.webp")
    },
    {
        input: path.join(brainDir, "erythritol_1781740853809.png"),
        output: path.join(uploadDir, "erythritol.webp")
    },
    {
        input: path.join(brainDir, "monk_fruit_1781740862550.png"),
        output: path.join(uploadDir, "monk-fruit.webp")
    },
    {
        input: path.join(brainDir, "stevia_erythritol_1781740873058.png"),
        output: path.join(uploadDir, "stevia-erythritol.webp")
    },
    {
        input: path.join(brainDir, "xylitol_1781740883170.png"),
        output: path.join(uploadDir, "xylitol.webp")
    },
    {
        input: path.join(brainDir, "yaourt_brebis_1781741281991.png"),
        output: path.join(uploadDir, "yaourt-brebis-ig-bas.webp")
    },
    {
        input: path.join(brainDir, "graines_chia_1781741291645.png"),
        output: path.join(uploadDir, "graines-chia-ig-bas.webp")
    },
    {
        input: path.join(brainDir, "galettes_riz_1781741301452.png"),
        output: path.join(uploadDir, "galettes-riz-ig-eleve.webp")
    }
];

async function run() {
    console.log("Processing demo images...");
    for (const file of files) {
        console.log(`Processing: ${file.input} -> ${file.output}`);
        try {
            const result = await ImageProcessor.processImageWithVariants(file.input, file.output);
            console.log(`Success! Main: ${result.main}, Variants: ${result.variants.join(", ")}`);
        } catch (error) {
            console.error(`Failed to process ${file.input}:`, error);
        }
    }
}

run();
