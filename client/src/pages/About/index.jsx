import "./style.scss"
import { Heart, Leaf, ShieldCheck, Users } from "lucide-react";
import { useDocumentMeta } from "@hooks/useDocumentMeta.js";

export const About = () => {
    useDocumentMeta({
        title: "A propos - Notre demarche | GlyciBio",
        description: "Decouvrez la mission GlyciBio : selection rigoureuse d'aliments a index glycemique controle pour les personnes diabetiques, sportives ou soucieuses de leur sante.",
        canonical: "https://glycibio.fr/a-propos",
    });

    return (
        <section className="about">
            <div className="about__hero">
                <h1>Manger sain ne devrait pas etre complique</h1>
                <p className="about__lede">
                    GlyciBio est ne d'une conviction simple : chacun merite d'avoir acces a des aliments
                    respectueux de sa glycemie, sans avoir a dechiffrer des etiquettes ou faire le tri
                    parmi des milliers de produits.
                </p>
            </div>

            <div className="about__pillars">
                <article className="about__pillar">
                    <Leaf size={36} />
                    <h2>Selection rigoureuse</h2>
                    <p>
                        Chaque produit de notre catalogue est selectionne pour son index glycemique bas ou
                        modere (IG &le; 69), sa qualite nutritionnelle et son origine. Les valeurs IG sont
                        sourcees aupres de la base de donnees internationale de Sydney.
                    </p>
                </article>

                <article className="about__pillar">
                    <ShieldCheck size={36} />
                    <h2>Transparence totale</h2>
                    <p>
                        Pour chaque produit : l'IG, les allergenes, la composition nutritionnelle complete et
                        l'origine sont affiches. Aucun produit miracle, aucune promesse de perte de poids
                        magique - juste de bons aliments.
                    </p>
                </article>

                <article className="about__pillar">
                    <Heart size={36} />
                    <h2>Pour qui ?</h2>
                    <p>
                        Personnes diabetiques de type 1 ou 2, pre-diabetiques, sportifs cherchant une energie
                        stable, parents soucieux de la sante de leur famille, ou simplement curieux de manger
                        mieux : GlyciBio est pour vous.
                    </p>
                </article>

                <article className="about__pillar">
                    <Users size={36} />
                    <h2>Engagement local</h2>
                    <p>
                        Nous privilegions les producteurs francais et europeens, et travaillons en
                        partenariat avec des dieteticiens-nutritionnistes pour valider notre catalogue.
                    </p>
                </article>
            </div>

            <div className="about__values">
                <h2>Nos engagements</h2>
                <ul>
                    <li><strong>Aucun produit ultra-transforme.</strong> Liste d'ingredients courte, claire et identifiable.</li>
                    <li><strong>Pas de pseudo-science.</strong> Nous nous appuyons sur les recommandations OMS, ANSES et Federation Francaise des Diabetiques.</li>
                    <li><strong>Reglements respectueux.</strong> Conformite RGPD totale, paiement securise Stripe, donnees bancaires jamais stockees.</li>
                    <li><strong>Livraison responsable.</strong> Emballages recyclables, livraison neutre carbone en relais Mondial Relay.</li>
                </ul>
            </div>

            <div className="about__cta">
                <h2>Une question ?</h2>
                <p>
                    Notre equipe est joignable par email a <a href="mailto:contact@glycibio.fr">contact@glycibio.fr</a>{" "}
                    ou via le <a href="/contact">formulaire de contact</a>. Nous repondons sous 48h ouvrees.
                </p>
            </div>
        </section>
    );
};
