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
