import { Redirect, type Href } from "expo-router";

import { useUser } from "@/context/UserContext";

export default function AncienneRoutePointsControle() {
  const { utilisateurActif } = useUser();
  const destination = utilisateurActif?.role === "GERANT" ? "/haccp/configuration" : "/haccp";
  return <Redirect href={destination as Href} />;
}
