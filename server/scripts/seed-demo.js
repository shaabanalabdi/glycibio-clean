import { db } from "../src/core/database.js";
import bcrypt from "bcrypt";
import * as dotenv from "dotenv";

dotenv.config();

// Hash for password 'JuryTest2026!'
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync("JuryTest2026!", 12);

async function run() {
    console.log("==================================================");
    console.log("Starting GlyciBio Demo Database Seeding...");
    console.log("==================================================");

    try {
        // 1. Get Categories IDs
        const [categories] = await db.query("SELECT id, name FROM categories");
        const categoryMap = {};
        categories.forEach(c => {
            categoryMap[c.name] = c.id;
        });

        const catEpicerieSucree = categoryMap["Epicerie sucree"];
        const catCereales = categoryMap["Cereales et feculents"];
        const catBoissons = categoryMap["Boissons"];
        const catLaitiers = categoryMap["Produits laitiers"];
        const catEpicerieSalee = categoryMap["Epicerie salee"];
        const catFruitsLegumes = categoryMap["Fruits et legumes"];
        const catCompl = categoryMap["Complements alimentaires"];
        const catSnacks = categoryMap["Snacks et en-cas"];

        if (!catEpicerieSucree) {
            throw new Error("Required category 'Epicerie sucree' not found. Please run base schema import first.");
        }

        // 2. Insert Dummy Products (if not already exists)
        console.log("--> Inserting dummy products...");
        
        const dummyProducts = [
            {
                name: "Pate a Tartiner Noisette-Cacao IG Bas",
                slug: "pate-a-tartiner-noisette-cacao-ig-bas-demo",
                description: "Une delicieuse pate a tartiner bio aux noisettes et cacao, edulcoree naturellement a l'erythritol. Sans sucres ajoutes et a index glycemique tres bas (IG 5). Parfait pour les tartines du matin sans pic d'insuline.",
                price: 5.90,
                image: "/uploads/products/pate-noisette-ig-bas.webp",
                stock: 80,
                glycemic_index: 5,
                allergens: JSON.stringify(["fruits_a_coque"]),
                nutritional_info: JSON.stringify({ calories: 450, proteines: 8, glucides: 14, lipides: 39, fibres: 12 }),
                category_id: catEpicerieSucree
            },
            {
                name: "Chocolat Noir 90% aux eclats d'Amandes",
                slug: "chocolat-noir-90-aux-eclats-d-amandes-demo",
                description: "Une tablette de chocolat noir intense a 90% de cacao biologique, agrementee d'eclats d'amandes croquantes. Parfait pour une pause gourmande a IG bas (IG 15), riche en antioxydants et en magnesium.",
                price: 3.90,
                image: "/uploads/products/chocolat-amandes-ig-bas.webp",
                stock: 120,
                glycemic_index: 15,
                allergens: JSON.stringify(["fruits_a_coque", "soja"]),
                nutritional_info: JSON.stringify({ calories: 590, proteines: 10, glucides: 12, lipides: 53, fibres: 14 }),
                category_id: catEpicerieSucree
            },
            {
                name: "Kombucha Gingembre Bio",
                slug: "kombucha-gingembre-bio-demo",
                description: "Une boisson fermentee petillante a base de the noir et de gingembre frais biologique. Naturellement riche en probiotiques et tres faible en sucres, parfaite pour rafraichir a index glycemique bas (IG 15).",
                price: 2.90,
                image: "/uploads/products/kombucha-gingembre-ig-bas.webp",
                stock: 150,
                glycemic_index: 15,
                allergens: JSON.stringify([]),
                nutritional_info: JSON.stringify({ calories: 18, proteines: 0.1, glucides: 4, lipides: 0, fibres: 0.5 }),
                category_id: catBoissons
            },
            {
                name: "Pesto de Chou Kale et Cajou",
                slug: "pesto-de-chou-kale-et-cajou-demo",
                description: "Un pesto artisanal revisite au chou kale bio et noix de cajou cremeuses. Ideal pour accompagner vos pates completes ou napper vos legumes grilles tout en maintenant un IG tres bas (IG 15).",
                price: 4.50,
                image: "/uploads/products/pesto-kale-ig-bas.webp",
                stock: 60,
                glycemic_index: 15,
                allergens: JSON.stringify(["fruits_a_coque"]),
                nutritional_info: JSON.stringify({ calories: 320, proteines: 5, glucides: 8, lipides: 30, fibres: 3 }),
                category_id: catEpicerieSalee
            },
            {
                name: "Pates de Lentilles Corail",
                slug: "pates-de-lentilles-corail-demo",
                description: "Pates 100% farine de lentilles corail biologiques. Riches en proteines et en fibres, elles offrent une excellente alternative sans gluten aux pates de ble avec un IG bas tres stable (IG 30).",
                price: 3.20,
                image: "/uploads/products/pates-lentilles-ig-bas.webp",
                stock: 90,
                glycemic_index: 30,
                allergens: JSON.stringify([]),
                nutritional_info: JSON.stringify({ calories: 340, proteines: 25, glucides: 50, lipides: 1.5, fibres: 12 }),
                category_id: catCereales
            },
            {
                name: "Puree de Patates Douces et Epices",
                slug: "puree-de-patates-douces-et-epices-demo",
                description: "Une puree gourmande de patates douces biologiques cuites a la vapeur douce et parfumees aux epices. Ideale pour accompagner vos plats tout en conservant un index glycemique modere (IG 60).",
                price: 4.80,
                image: "/uploads/products/puree-patates-ig-moyen.webp",
                stock: 70,
                glycemic_index: 60,
                allergens: JSON.stringify([]),
                nutritional_info: JSON.stringify({ calories: 95, proteines: 1.8, glucides: 21, lipides: 0.2, fibres: 3.2 }),
                category_id: catFruitsLegumes
            },
            {
                name: "Yaourt de Brebis Bio IG Bas",
                slug: "yaourt-de-brebis-bio-ig-bas-demo",
                description: "Yaourts au lait de brebis biologique, cremeux et onctueux. Tres digeste, riche en proteines et calcium, sans sucre ajoute pour un IG tres bas (IG 15).",
                price: 3.50,
                image: "/uploads/products/yaourt-brebis-ig-bas.webp",
                stock: 45,
                glycemic_index: 15,
                allergens: JSON.stringify(["lactose"]),
                nutritional_info: JSON.stringify({ calories: 90, proteines: 6, glucides: 4, lipides: 5.5, fibres: 0 }),
                category_id: catLaitiers
            },
            {
                name: "Graines de Chia Bio",
                slug: "graines-de-chia-bio-demo",
                description: "Graines de chia biologiques de haute qualite, riches en acides gras Omega-3, en fibres et en proteines. Ideales pour preparer des puddings sains a IG tres bas (IG 1).",
                price: 4.90,
                image: "/uploads/products/graines-chia-ig-bas.webp",
                stock: 110,
                glycemic_index: 1,
                allergens: JSON.stringify([]),
                nutritional_info: JSON.stringify({ calories: 486, proteines: 17, glucides: 42, lipides: 31, fibres: 34 }),
                category_id: catCompl
            },
            {
                name: "Galettes de Riz Souffle Bio",
                slug: "galettes-de-riz-souffle-bio-demo",
                description: "Galettes de riz souffle biologique croustillantes. Bien qu'appreciees en collation legere, elles possedent un index glycemique eleve (IG 85) a consommer avec moderation ou a associer avec des graisses saines.",
                price: 1.90,
                image: "/uploads/products/galettes-riz-ig-eleve.webp",
                stock: 130,
                glycemic_index: 85,
                allergens: JSON.stringify([]),
                nutritional_info: JSON.stringify({ calories: 380, proteines: 8, glucides: 80, lipides: 3, fibres: 4 }),
                category_id: catSnacks
            },
            {
                name: "Chocolat Noir 99% Pur Cacao",
                slug: "chocolat-noir-99-pur-cacao-demo",
                description: "Une tablette de chocolat noir a 99% de cacao de qualite superieure. Ideal pour les puristes a la recherche d'une experience intense et d'un index glycemique quasi-nul (IG 8).",
                price: 4.20,
                image: "/uploads/products/chocolat-85.webp",
                stock: 55,
                glycemic_index: 8,
                allergens: JSON.stringify(["soja"]),
                nutritional_info: JSON.stringify({ calories: 610, proteines: 12, glucides: 8, lipides: 56, fibres: 15 }),
                category_id: catEpicerieSucree
            },
            {
                name: "Pates Completes Penne Rigate",
                slug: "pates-completes-penne-rigate-demo",
                description: "Pates completes type Penne Rigate issues de l'agriculture biologique. Cuisson al dente pour un IG modere tres stable (IG 40), riches en fibres et en nutriments.",
                price: 2.90,
                image: "/uploads/products/pates-completes.webp",
                stock: 160,
                glycemic_index: 40,
                allergens: JSON.stringify(["gluten"]),
                nutritional_info: JSON.stringify({ calories: 345, proteines: 13, glucides: 66, lipides: 2.2, fibres: 7.5 }),
                category_id: catCereales
            },
            {
                name: "Pain de Seigle Noir Bio",
                slug: "pain-de-seigle-noir-bio-demo",
                description: "Pain de seigle traditionnel biologique, riche en fibres solubles qui ralentissent l'absorption des glucides. Index glycemique bas (IG 45).",
                price: 4.50,
                image: "/uploads/products/pain-graines.webp",
                stock: 35,
                glycemic_index: 45,
                allergens: JSON.stringify(["gluten"]),
                nutritional_info: JSON.stringify({ calories: 240, proteines: 8, glucides: 45, lipides: 2, fibres: 9 }),
                category_id: catCereales
            },
            {
                name: "Riz Complet Sauvage",
                slug: "riz-complet-sauvage-demo",
                description: "Melange de riz complet et de riz sauvage biologique. Offre un excellent profil nutritionnel et une richesse en fibres qui maintient un IG bas (IG 50).",
                price: 4.90,
                image: "/uploads/products/riz-basmati.webp",
                stock: 95,
                glycemic_index: 50,
                allergens: JSON.stringify([]),
                nutritional_info: JSON.stringify({ calories: 350, proteines: 9, glucides: 72, lipides: 1.2, fibres: 4.5 }),
                category_id: catCereales
            },
            {
                name: "Farine de Pois Chiche Bio",
                slug: "farine-de-pois-chiche-bio-demo",
                description: "Farine de pois chiche biologique de mouture artisanale. Ideale pour vos recettes salees et sans gluten, avec un index glycemique bas (IG 35).",
                price: 4.80,
                image: "/uploads/products/farine-sarrasin.webp",
                stock: 65,
                glycemic_index: 35,
                allergens: JSON.stringify([]),
                nutritional_info: JSON.stringify({ calories: 365, proteines: 22, glucides: 47, lipides: 6, fibres: 10 }),
                category_id: catCereales
            },
            {
                name: "Lentilles Corail Bio (500g)",
                slug: "lentilles-corail-bio-demo",
                description: "Lentilles corail biologiques a cuisson rapide. Riches en fer et proteines vegetales, tres rassasiantes et a index glycemique bas (IG 30).",
                price: 3.50,
                image: "/uploads/products/pates-lentilles-ig-bas.webp",
                stock: 140,
                glycemic_index: 30,
                allergens: JSON.stringify([]),
                nutritional_info: JSON.stringify({ calories: 330, proteines: 24, glucides: 48, lipides: 1.8, fibres: 10 }),
                category_id: catFruitsLegumes
            },
            {
                name: "Lait d'Avoine sans sucre",
                slug: "lait-d-avoine-sans-sucre-demo",
                description: "Boisson a l'avoine biologique sans sucres ajoutes. Parfait substitut vegetal pour vos cereales ou cafes, avec un index glycemique controle (IG 30).",
                price: 2.80,
                image: "/uploads/products/lait-amande.webp",
                stock: 80,
                glycemic_index: 30,
                allergens: JSON.stringify(["gluten"]),
                nutritional_info: JSON.stringify({ calories: 42, proteines: 1, glucides: 6.5, lipides: 1.5, fibres: 0.8 }),
                category_id: catLaitiers
            },
            {
                name: "The Vert Sencha Bio",
                slug: "the-vert-sencha-bio-demo",
                description: "The vert Sencha biologique de qualite superieure, originaire du Japon. Riche en antioxydants et catechines, sans calories et a IG nul (IG 0).",
                price: 8.90,
                image: "/uploads/products/matcha.webp",
                stock: 75,
                glycemic_index: 0,
                allergens: JSON.stringify([]),
                nutritional_info: JSON.stringify({ calories: 1, proteines: 0.1, glucides: 0, lipides: 0, fibres: 0 }),
                category_id: catBoissons
            },
            {
                name: "Eau de Coco au Gingembre",
                slug: "eau-de-coco-au-gingembre-demo",
                description: "Eau de coco biologique infusee au jus de gingembre frais. Hydratante, naturellement riche en potassium et a IG tres bas (IG 45).",
                price: 2.80,
                image: "/uploads/products/eau-coco.webp",
                stock: 100,
                glycemic_index: 45,
                allergens: JSON.stringify([]),
                nutritional_info: JSON.stringify({ calories: 22, proteines: 0.2, glucides: 5.2, lipides: 0, fibres: 0.2 }),
                category_id: catBoissons
            },
            {
                name: "Miel de Lavande Bio (250g)",
                slug: "miel-de-lavande-bio-demo",
                description: "Miel de lavande cremeux issu de l'agriculture biologique. Repute pour ses vertus apaisantes et son IG modere par rapport au sucre de table (IG 50).",
                price: 9.50,
                image: "/uploads/products/miel-acacia.webp",
                stock: 25,
                glycemic_index: 50,
                allergens: JSON.stringify([]),
                nutritional_info: JSON.stringify({ calories: 310, proteines: 0.3, glucides: 78, lipides: 0, fibres: 0 }),
                category_id: catEpicerieSucree
            },
            {
                name: "Confiture de Myrtilles sans sucre",
                slug: "confiture-de-myrtilles-sans-sucre-demo",
                description: "Confiture artisanale de myrtilles sauvages biologiques, edulcoree naturellement a l'erythritol. Tres faible impact glycemique (IG 25).",
                price: 5.80,
                image: "/uploads/products/confiture-fraises.webp",
                stock: 40,
                glycemic_index: 25,
                allergens: JSON.stringify([]),
                nutritional_info: JSON.stringify({ calories: 110, proteines: 0.6, glucides: 26, lipides: 0.1, fibres: 2 }),
                category_id: catEpicerieSucree
            },
            {
                name: "Biscuits d'Epeautre IG Bas",
                slug: "biscuits-d-epeautre-ig-bas-demo",
                description: "Biscuits croquants a la farine d'epeautre integrale et pepites de chocolat noir, edulcores a la stevia. Index glycemique bas (IG 35).",
                price: 4.90,
                image: "/uploads/products/barres-proteinees.webp",
                stock: 90,
                glycemic_index: 35,
                allergens: JSON.stringify(["gluten", "soja"]),
                nutritional_info: JSON.stringify({ calories: 390, proteines: 8, glucides: 48, lipides: 16, fibres: 6 }),
                category_id: catSnacks
            },
            {
                name: "Huile de Coco Vierge Bio (500ml)",
                slug: "huile-de-coco-vierge-bio-demo",
                description: "Huile de coco vierge biologique de premiere pression a froid. Ideale pour la cuisson saine a haute temperature, avec un index glycemique nul (IG 0).",
                price: 8.90,
                image: "/uploads/products/huile-olive.webp",
                stock: 60,
                glycemic_index: 0,
                allergens: JSON.stringify([]),
                nutritional_info: JSON.stringify({ calories: 890, proteines: 0, glucides: 0, lipides: 100, fibres: 0 }),
                category_id: catEpicerieSalee
            },
            {
                name: "Sauce Bolognaise Vegetale Bio",
                slug: "sauce-bolognaise-vegetale-bio-demo",
                description: "Sauce tomate biologique mijotee aux proteines de soja texturees et herbes fraiches. Sans sucres ajoutes et a index glycemique bas (IG 20).",
                price: 4.20,
                image: "/uploads/products/sauce-tomate.webp",
                stock: 75,
                glycemic_index: 20,
                allergens: JSON.stringify(["soja"]),
                nutritional_info: JSON.stringify({ calories: 65, proteines: 4.5, glucides: 6, lipides: 2.2, fibres: 2 }),
                category_id: catEpicerieSalee
            },
            {
                name: "Yaourt de Chevre Nature Bio",
                slug: "yaourt-de-chevre-nature-bio-demo",
                description: "Yaourts individuels au lait de chevre entier biologique. Texture douce et onctueuse, riches en proteines, a IG tres bas (IG 15).",
                price: 3.80,
                image: "/uploads/products/yaourt-grec.webp",
                stock: 50,
                glycemic_index: 15,
                allergens: JSON.stringify(["lactose"]),
                nutritional_info: JSON.stringify({ calories: 72, proteines: 4, glucides: 3.5, lipides: 4.5, fibres: 0 }),
                category_id: catLaitiers
            },
            {
                name: "Puree de Citrouille et Epices",
                slug: "puree-de-citrouille-et-epices-demo",
                description: "Heris de citrouille et potimarron biologiques assaisonnes d'une touche de cannelle et de muscade. Index glycemique modere (IG 65).",
                price: 4.50,
                image: "/uploads/products/puree-patates-ig-moyen.webp",
                stock: 60,
                glycemic_index: 65,
                allergens: JSON.stringify([]),
                nutritional_info: JSON.stringify({ calories: 48, proteines: 1.2, glucides: 9.5, lipides: 0.2, fibres: 2.5 }),
                category_id: catFruitsLegumes
            },
            {
                name: "Farine d'Epeautre Integrale Bio",
                slug: "farine-d-epeautre-integrale-bio-demo",
                description: "Farine d'epeautre grand epeautre integral type 150 biologique. Parfaite pour des pains d'epeautre a index glycemique bas (IG 45).",
                price: 4.90,
                image: "/uploads/products/farine-sarrasin.webp",
                stock: 70,
                glycemic_index: 45,
                allergens: JSON.stringify(["gluten"]),
                nutritional_info: JSON.stringify({ calories: 335, proteines: 14, glucides: 60, lipides: 2.5, fibres: 10 }),
                category_id: catCereales
            },
            {
                name: "Lentilles Noires Beluga Bio",
                slug: "lentilles-noires-beluga-bio-demo",
                description: "Lentilles noires Beluga biologiques de qualite superieure. Surnommee le caviar des lentilles, riches en fibres et a IG tres bas (IG 25).",
                price: 3.90,
                image: "/uploads/products/lentilles-puy.webp",
                stock: 80,
                glycemic_index: 25,
                allergens: JSON.stringify([]),
                nutritional_info: JSON.stringify({ calories: 310, proteines: 23, glucides: 45, lipides: 1.2, fibres: 15 }),
                category_id: catFruitsLegumes
            },
            {
                name: "Stevia Liquide Vanille (50ml)",
                slug: "stevia-liquide-vanille-demo",
                description: "Edulcorant liquide de stevia pure aromatisee a la vanille naturelle. Ideal pour sucrer vos yaourts ou boissons avec un IG nul (IG 0).",
                price: 5.90,
                image: "/uploads/products/stevia-poudre.webp",
                stock: 120,
                glycemic_index: 0,
                allergens: JSON.stringify([]),
                nutritional_info: JSON.stringify({ calories: 0, proteines: 0, glucides: 0, lipides: 0, fibres: 0 }),
                category_id: catEpicerieSucree
            },
            {
                name: "Xylitol Bio Poudre de Bouleau",
                slug: "xylitol-bio-poudre-de-bouleau-demo",
                description: "Edulcorant naturel de bouleau biologique (xylitol). Meme pouvoir sucrant que le sucre traditionnel mais avec un IG tres bas (IG 7).",
                price: 8.50,
                image: "/uploads/products/xylitol.webp",
                stock: 90,
                glycemic_index: 7,
                allergens: JSON.stringify([]),
                nutritional_info: JSON.stringify({ calories: 240, proteines: 0, glucides: 100, lipides: 0, fibres: 0 }),
                category_id: catEpicerieSucree
            }
        ];

        const productIds = {};
        for (const p of dummyProducts) {
            const [existing] = await db.query("SELECT id FROM products WHERE slug = ?", [p.slug]);
            if (existing.length > 0) {
                console.log(`Product '${p.name}' already exists with ID ${existing[0].id}.`);
                productIds[p.slug] = existing[0].id;
            } else {
                const [res] = await db.query(
                    `INSERT INTO products (name, slug, description, price, image, stock, glycemic_index, allergens, nutritional_info, category_id, is_active) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
                    [p.name, p.slug, p.description, p.price, p.image, p.stock, p.glycemic_index, p.allergens, p.nutritional_info, p.category_id]
                );
                console.log(`Created product '${p.name}' with ID ${res.insertId}`);
                productIds[p.slug] = res.insertId;
            }
        }

        // Get some other existing products for orders
        const [existingProds] = await db.query("SELECT id, price, name FROM products LIMIT 5");
        
        // 3. Insert Dummy Users (Clients)
        console.log("--> Inserting dummy clients...");
        const dummyUsers = [
            { username: "jean_dupont", email: "jean.dupont@example.com", first_name: "Jean", last_name: "Dupont" },
            { username: "marie_martin", email: "marie.martin@example.com", first_name: "Marie", last_name: "Martin" },
            { username: "sophie_lefevre", email: "sophie.lefevre@example.com", first_name: "Sophie", last_name: "Lefèvre" }
        ];

        const userIds = {};
        for (const u of dummyUsers) {
            const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [u.email]);
            if (existing.length > 0) {
                console.log(`User '${u.email}' already exists with ID ${existing[0].id}.`);
                userIds[u.username] = existing[0].id;
            } else {
                const [res] = await db.query(
                    `INSERT INTO users (username, email, password, role, first_name, last_name, address, phone, is_active)
                     VALUES (?, ?, ?, 'client', ?, ?, '12 Rue de la Paix, 75002 Paris', '0612345678', true)`,
                    [u.username, u.email, DEFAULT_PASSWORD_HASH, u.first_name, u.last_name]
                );
                console.log(`Created user '${u.email}' with ID ${res.insertId} (Password: JuryTest2026!)`);
                userIds[u.username] = res.insertId;
            }
        }

        // 4. Insert Dummy Orders
        console.log("--> Inserting dummy orders...");
        
        // Get shipping methods
        const [shippingMethods] = await db.query("SELECT id, name, price FROM shipping_methods");
        const standardShipping = shippingMethods.find(s => s.name.includes("Standard")) || shippingMethods[0];
        const freeShipping = shippingMethods.find(s => s.name.includes("Gratuit")) || shippingMethods[0];

        const dummyOrders = [
            {
                username: "jean_dupont",
                status: "payee",
                shipping_address: "12 Rue de la Paix, 75002 Paris",
                shipping_method_id: standardShipping.id,
                shipping_cost: standardShipping.price,
                created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
                items: [
                    { product_id: productIds["pate-a-tartiner-noisette-cacao-ig-bas-demo"], quantity: 2, unit_price: 5.90 },
                    { product_id: productIds["kombucha-gingembre-bio-demo"], quantity: 4, unit_price: 2.90 },
                    { product_id: existingProds[0].id, quantity: 1, unit_price: existingProds[0].price }
                ]
            },
            {
                username: "marie_martin",
                status: "expediee",
                shipping_address: "45 Avenue des Champs-Élysées, 75008 Paris",
                shipping_method_id: freeShipping.id,
                shipping_cost: 0.00,
                created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                items: [
                    { product_id: productIds["chocolat-noir-90-aux-eclats-d-amandes-demo"], quantity: 5, unit_price: 3.90 },
                    { product_id: productIds["pates-de-lentilles-corail-demo"], quantity: 2, unit_price: 3.20 },
                    { product_id: productIds["pate-a-tartiner-noisette-cacao-ig-bas-demo"], quantity: 6, unit_price: 5.90 }
                ]
            },
            {
                username: "sophie_lefevre",
                status: "remboursee",
                shipping_address: "8 Rue de l'Église, 69002 Lyon",
                shipping_method_id: standardShipping.id,
                shipping_cost: standardShipping.price,
                created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
                items: [
                    { product_id: productIds["pesto-de-chou-kale-et-cajou-demo"], quantity: 1, unit_price: 4.50 }
                ]
            },
            {
                username: "jean_dupont",
                status: "en_preparation",
                shipping_address: "12 Rue de la Paix, 75002 Paris",
                shipping_method_id: standardShipping.id,
                shipping_cost: standardShipping.price,
                created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                items: [
                    { product_id: productIds["pate-a-tartiner-noisette-cacao-ig-bas-demo"], quantity: 1, unit_price: 5.90 },
                    { product_id: productIds["puree-de-patates-douces-et-epices-demo"], quantity: 2, unit_price: 4.80 },
                    { product_id: productIds["chocolat-noir-90-aux-eclats-d-amandes-demo"], quantity: 2, unit_price: 3.90 }
                ]
            },
            {
                username: "marie_martin",
                status: "en_attente",
                shipping_address: "45 Avenue des Champs-Élysées, 75008 Paris",
                shipping_method_id: standardShipping.id,
                shipping_cost: standardShipping.price,
                created_at: new Date(), // Today
                items: [
                    { product_id: existingProds[2].id, quantity: 2, unit_price: existingProds[2].price }
                ]
            }
        ];

        for (const o of dummyOrders) {
            const userId = userIds[o.username];

            // 1. Create the order in 'en_attente' status to avoid triggering the 'Modification interdite' exception on order_items insert
            const [orderRes] = await db.query(
                `INSERT INTO orders (user_id, subtotal, shipping_cost, total, status, shipping_address, shipping_method_id, created_at, updated_at)
                 VALUES (?, 0.00, ?, 0.00, 'en_attente', ?, ?, ?, ?)`,
                [userId, o.shipping_cost, o.shipping_address, o.shipping_method_id, o.created_at, o.created_at]
            );

            const orderId = orderRes.insertId;

            // 2. Insert order items. The database triggers will automatically update subtotal and total on the orders table
            for (const item of o.items) {
                await db.query(
                    `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
                     VALUES (?, ?, ?, ?)`,
                    [orderId, item.product_id, item.quantity, item.unit_price]
                );
            }

            // 3. Finally, update the order to the actual target status and set the correct timestamp
            await db.query(
                `UPDATE orders SET status = ?, created_at = ?, updated_at = ? WHERE id = ?`,
                [o.status, o.created_at, o.created_at, orderId]
            );
            console.log(`Created order #${orderId} for '${o.username}' (${o.status})`);
        }

        // 5. Insert Dummy Reviews
        console.log("--> Inserting dummy product reviews...");
        const dummyReviews = [
            {
                product_id: productIds["chocolat-noir-90-aux-eclats-d-amandes-demo"],
                username: "jean_dupont",
                rating: 5,
                title: "Excellent chocolat !",
                comment: "Très intense en cacao, et les éclats d'amandes apportent un super croquant. Un délice sans culpabilité pour mon diabète.",
                status: "approved"
            },
            {
                product_id: productIds["pate-a-tartiner-noisette-cacao-ig-bas-demo"],
                username: "marie_martin",
                rating: 4,
                title: "Très bonne alternative",
                comment: "Le goût de noisette est bien présent. Moins sucré qu'une pâte classique mais c'est parfait pour s'habituer à l'IG bas.",
                status: "approved"
            },
            {
                product_id: productIds["kombucha-gingembre-bio-demo"],
                username: "marie_martin",
                rating: 5,
                title: "Délicieux et très rafraîchissant !",
                comment: "Une excellente boisson fermentée. Le gingembre est bien dosé, ça pique juste ce qu'il faut et c'est très peu sucré.",
                status: "approved"
            },
            {
                product_id: productIds["pates-de-lentilles-corail-demo"],
                username: "jean_dupont",
                rating: 4,
                title: "Excellente tenue à la cuisson",
                comment: "Riche en protéines et fibres, ces pâtes ne font pas monter ma glycémie. Idéal pour un repas rapide et sain.",
                status: "approved"
            },
            {
                product_id: productIds["pesto-de-chou-kale-et-cajou-demo"],
                username: "sophie_lefevre",
                rating: 5,
                title: "Crémeux et original",
                comment: "Le goût du chou kale est très doux, marié au cajou c'est un pur régal. À valider absolument !",
                status: "pending" // Admin can approve this one during demo
            },
            {
                product_id: productIds["pate-a-tartiner-noisette-cacao-ig-bas-demo"],
                username: "sophie_lefevre",
                rating: 5,
                title: "Incroyable, texture parfaite",
                comment: "Je n'en reviens pas que ce soit sans sucre. La texture est super onctueuse. J'adore !",
                status: "pending" // Admin can approve this one during demo
            },
            {
                product_id: productIds["chocolat-noir-90-aux-eclats-d-amandes-demo"],
                username: "sophie_lefevre",
                rating: 2,
                title: "Un peu trop amer",
                comment: "C'est du 90% donc c'est normal, mais personnellement je préfère le chocolat un peu plus doux.",
                status: "pending" // Admin can reject or approve this
            }
        ];

        for (const r of dummyReviews) {
            const userId = userIds[r.username];
            // Check if review already exists
            const [existing] = await db.query(
                "SELECT id FROM product_reviews WHERE user_id = ? AND product_id = ?",
                [userId, r.product_id]
            );

            if (existing.length > 0) {
                console.log(`Review by user ${userId} on product ${r.product_id} already exists.`);
            } else {
                await db.query(
                    `INSERT INTO product_reviews (product_id, user_id, rating, title, comment, status)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [r.product_id, userId, r.rating, r.title, r.comment, r.status]
                );
                console.log(`Created review by '${r.username}' on product ID ${r.product_id} (Status: ${r.status})`);
            }
        }

        // 6. Insert Dummy Contact Messages
        console.log("--> Inserting dummy contact messages...");
        const dummyMessages = [
            {
                name: "Lucas Bernard",
                email: "lucas.bernard@example.com",
                subject: "Question sur la livraison en Belgique",
                message: "Bonjour, je réside à Bruxelles et je souhaiterais savoir si vous livrez également en Belgique et quels sont les tarifs de livraison. Merci !",
                is_read: false
            },
            {
                name: "Julie Richard",
                email: "j.richard@organic-miel.fr",
                subject: "Proposition de partenariat local",
                message: "Bonjour, nous sommes des apiculteurs bio basés dans le Nord de la France. Nous proposons des miels d'acacia et de fleurs sauvages à IG modéré et nous aimerions savoir s'il est possible de référencer nos produits sur votre boutique GlyciBio. Cordialement.",
                is_read: true
            }
        ];

        for (const m of dummyMessages) {
            // Check if message already exists
            const [existing] = await db.query(
                "SELECT id FROM contact_messages WHERE email = ? AND subject = ?",
                [m.email, m.subject]
            );

            if (existing.length > 0) {
                console.log(`Message from ${m.email} with subject '${m.subject}' already exists.`);
            } else {
                await db.query(
                    `INSERT INTO contact_messages (name, email, subject, message, is_read)
                     VALUES (?, ?, ?, ?, ?)`,
                    [m.name, m.email, m.subject, m.message, m.is_read]
                );
                console.log(`Created contact message from '${m.name}' (Is Read: ${m.is_read})`);
            }
        }

        console.log("==================================================");
        console.log("SUCCESS: GlyciBio Demo Database Seeded Successfully!");
        console.log("Demo Clients Password: JuryTest2026!");
        console.log("==================================================");

    } catch (error) {
        console.error("CRITICAL ERROR during database seeding:", error);
    } finally {
        // End db connection
        await db.end();
    }
}

run();
