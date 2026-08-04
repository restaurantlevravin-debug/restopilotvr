import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";


export type Salarie = {

  id:number;
  nom:string;
  prenom:string;
  dateNaissance:string;
  sexe:string;
  adresse:string;
  fonction:string;
  contrat:string;
  dateEntree:string;
  dateSortie:string;
  actif:boolean;
  nationalite:string;
  numeroSecuriteSociale:string;
  documents:{
    contratTravail:boolean;
    pieceIdentite:boolean;
    visiteMedicale:boolean;
    mutuelle:boolean;
    rib:boolean;
    permisTravail:boolean;
    
  };

};


export type DocumentsSalarie = Salarie["documents"];


type DonneesSalarie =
Omit<Salarie,"id" | "documents" | "nationalite"> & {
  nationalite?:string;
  documents?:DocumentsSalarie;
};


type PersonnelContextType = {

  personnel:Salarie[];

  ajouterSalarie(
    salarie:Omit<Salarie,"id">
  ):void;


  modifierSalarie(
    id:number,
    salarie:DonneesSalarie
  ):void;


  modifierDocuments(
    id:number,
    documents:DocumentsSalarie
  ):void;


  supprimerSalarie(
    id:number
  ):void;

};



const PersonnelContext =
createContext<PersonnelContextType | null>(null);



const STORAGE_KEY = "RESTOPILOT_PERSONNEL";


const DOCUMENTS_PAR_DEFAUT:DocumentsSalarie = {

  contratTravail:false,
  pieceIdentite:false,
  visiteMedicale:false,
  mutuelle:false,
  rib:false,
  permisTravail:false,

};



export function PersonnelProvider({
  children,
}:{
  children:React.ReactNode;
}) {


  const [personnel,setPersonnel] =
  useState<Salarie[]>([]);



  useEffect(()=>{

    chargerPersonnel();

  },[]);



  async function chargerPersonnel(){

    try {

      const data =
      await AsyncStorage.getItem(STORAGE_KEY);


      if(data){

        const liste = JSON.parse(data) as Salarie[];
        const listeNormalisee = liste.map((salarie) => ({
          ...salarie,
          nationalite:salarie.nationalite || "",
          numeroSecuriteSociale:salarie.numeroSecuriteSociale || "",
          documents:{
            ...DOCUMENTS_PAR_DEFAUT,
            ...salarie.documents,
          },
        }));

        setPersonnel(
          listeNormalisee
        );

        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(listeNormalisee)
        );

      }

    } catch(e){

      console.log(e);

    }

  }



  async function sauvegarder(
    liste:Salarie[]
  ){

    setPersonnel(liste);


    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(liste)
    );

  }




  function ajouterSalarie(
  salarie: Omit<Salarie,"id" | "documents"> & {
    documents?: Salarie["documents"];
  }
){


    const nouveau:Salarie={

      id:Date.now(),

      ...salarie,

      documents:{
        ...DOCUMENTS_PAR_DEFAUT,
        ...salarie.documents,
      },

    };


    sauvegarder([

      ...personnel,

      nouveau,

    ]);

  }




  function modifierSalarie(
    id:number,
    salarie:DonneesSalarie
  ){


    const nouveauPersonnel =
    personnel.map((p)=>

      p.id===id

      ? {
          ...p,
          id,
          ...salarie,
          documents:{
            ...p.documents,
            ...salarie.documents,
          },
        }

      : p

    );


    sauvegarder(
      nouveauPersonnel
    );

  }



  function modifierDocuments(
    id:number,
    documents:DocumentsSalarie
  ){

    const nouveauPersonnel =
    personnel.map((p) =>

      p.id===id

      ? {
          ...p,
          documents,
        }

      : p

    );


    sauvegarder(
      nouveauPersonnel
    );

  }




  function supprimerSalarie(
    id:number
  ){


    const nouveauPersonnel =
    personnel.filter(
      (p)=>p.id!==id
    );


    sauvegarder(
      nouveauPersonnel
    );

  }





  return (

    <PersonnelContext.Provider
      value={{
        personnel,
        ajouterSalarie,
        modifierSalarie,
        modifierDocuments,
        supprimerSalarie,
      }}
    >

      {children}

    </PersonnelContext.Provider>

  );

}




export function usePersonnel(){

  const context =
  useContext(PersonnelContext);


  if(!context){

    throw new Error(
      "usePersonnel doit être utilisé dans PersonnelProvider"
    );

  }


  return context;

}
