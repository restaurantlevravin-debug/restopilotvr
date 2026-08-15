import type { ImageSourcePropType } from "react-native";

export type Reward = {
  id: string;
  name: string;
  image: ImageSourcePropType;
  level?: number;
  points?: number;
  title?: string;
};

export const rewards: readonly Reward[] = [
  {
    id: "padawan",
    name: "Padawan HACCP",
    image: require("../../assets/images/rewards/padawan.png"),
    level: 1,
    points: 10,
  },
  {
    id: "monstre",
    name: "Monstre HACCP",
    image: require("../../assets/images/rewards/monstre.png"),
    level: 2,
    points: 50,
  },
  {
    id: "empereur",
    name: "Empereur Impérial",
    image: require("../../assets/images/rewards/empereur.png"),
    level: 3,
    points: 200,
    title: "Divinité de la conformité",
  },
  {
    id: "boulanger",
    name: "Boulanger Impérial",
    image: require("../../assets/images/rewards/boulanger.png"),
    title: "Apôtre de la fermentation",
  },
  {
    id: "patissier",
    name: "Pâtissier Impérial",
    image: require("../../assets/images/rewards/patissier.png"),
    title: "Architecte des douceurs",
  },
  {
    id: "saucier",
    name: "Saucier Impérial",
    image: require("../../assets/images/rewards/saucier.png"),
    title: "Alchimiste des saveurs",
  },
  {
    id: "poissonnier",
    name: "Poissonnier Impérial",
    image: require("../../assets/images/rewards/poissonnier.png"),
    title: "Gardien des 7 mers",
  },
  {
    id: "barman",
    name: "Barman Impérial",
    image: require("../../assets/images/rewards/barman.png"),
    title: "Matcha lover",
  },
  {
    id: "boucher",
    name: "Boucher Impérial",
    image: require("../../assets/images/rewards/boucher.png"),
    title: "Maître du persillage",
  },
  {
    id: "sommelier",
    name: "Sommelier Impérial",
    image: require("../../assets/images/rewards/sommelier.png"),
    title: "Protecteur des flacons",
  },
  {
    id: "commis",
    name: "Commis Impérial",
    image: require("../../assets/images/rewards/commis.png"),
    title: "Garant de la gourmandise",
  },
];
