import type { Language } from "../../store/appSlice";

export interface TutorialMessage {
  eyebrow: string;
  title: string;
  description: string;
}

interface UiMessages {
  navbar: {
    primaryNavigation: string;
    returnToBeginning: string;
    logoAlt: string;
    viewMode: string;
    story: string;
    data: string;
    dataUnavailable: string;
    openTutorial: string;
    tutorial: string;
    language: string;
    english: string;
    danish: string;
  };
  story: {
    missingTitle: string;
    missingSubtitle: string;
    missingText: string;
    missingLocation: string;
    missingTime: string;
    missingSvgPath: string;
    interactionPrompt: string;
  };
  tutorial: {
    steps: TutorialMessage[];
    of: string;
    close: string;
    previous: string;
    next: string;
    startExploring: string;
  };
  audio: {
    listen: string;
    seek: string;
    pause: string;
    play: string;
    volume: string;
  };
  timeline: {
    previous: string;
    next: string;
    discovered: (discovered: number, total: number) => string;
  };
  map: {
    historicalTravelMap: string;
  };
}

export const messages: Record<Language, UiMessages> = {
  en: {
    navbar: {
      primaryNavigation: "Primary navigation",
      returnToBeginning: "Return to the beginning",
      logoAlt: "Memorise Logo",
      viewMode: "View mode",
      story: "Story",
      data: "Data",
      dataUnavailable: "No data available for this scene",
      openTutorial: "Open screen tutorial",
      tutorial: "Tutorial",
      language: "Language",
      english: "English",
      danish: "Danish",
    },
    story: {
      missingTitle: "Please add title.",
      missingSubtitle: "Please add subtitle.",
      missingText: "Please add text.",
      missingLocation: "Please add location.",
      missingTime: "Please add time.",
      missingSvgPath: "No SVG path was provided.",
      interactionPrompt:
        "Click on the interactive objects in the drawing to find out more.",
    },
    tutorial: {
      steps: [
        {
          eyebrow: "Explore",
          title: "Investigate the drawing",
          description:
            "Move across the illustration and select highlighted objects to reveal more of the testimony.",
        },
        {
          eyebrow: "Read & listen",
          title: "Follow the testimony",
          description:
            "The story for the selected scene appears here. Some entries also include quotes, audio, and maps.",
        },
        {
          eyebrow: "View the data",
          title: "Visit the evidence resources",
          description:
            "The drawings and story are based on Steen's testimony and memories as well as archival evidence.",
        },
        {
          eyebrow: "Navigate",
          title: "Travel through the story",
          description:
            "Use the timeline to revisit discovered scenes and move between moments in Steen's journey. The counter in the bottom-right corner keeps track of your discovered interactive objects.",
        },
      ],
      of: "of",
      close: "Close tutorial",
      previous: "Previous",
      next: "Next",
      startExploring: "Start exploring",
    },
    audio: {
      listen: "Listen to Steen to learn more.",
      seek: "Seek audio",
      pause: "Pause audio",
      play: "Play audio",
      volume: "Volume",
    },
    timeline: {
      previous: "Go to the previous story entry",
      next: "Go to the next story entry",
      discovered: (discovered, total) =>
        `Discovered ${discovered} of ${total} story entries`,
    },
    map: {
      historicalTravelMap: "Historical travel map",
    },
  },
  da: {
    navbar: {
      primaryNavigation: "Primær navigation",
      returnToBeginning: "Gå tilbage til begyndelsen",
      logoAlt: "Memorise-logo",
      viewMode: "Visning",
      story: "Fortælling",
      data: "Data",
      dataUnavailable: "Der er ingen data til denne scene",
      openTutorial: "Åbn introduktionen",
      tutorial: "Introduktion",
      language: "Sprog",
      english: "Engelsk",
      danish: "Dansk",
    },
    story: {
      missingTitle: "Tilføj en titel.",
      missingSubtitle: "Tilføj en undertitel.",
      missingText: "Tilføj tekst.",
      missingLocation: "Tilføj et sted.",
      missingTime: "Tilføj et tidspunkt.",
      missingSvgPath: "Der er ikke angivet en sti til SVG-filen.",
      interactionPrompt:
        "Klik på de interaktive objekter i tegningen for at få mere at vide.",
    },
    tutorial: {
      steps: [
        {
          eyebrow: "Udforsk",
          title: "Undersøg tegningen",
          description:
            "Bevæg dig rundt i illustrationen, og vælg de fremhævede objekter for at opdage mere af vidnesbyrdet.",
        },
        {
          eyebrow: "Læs og lyt",
          title: "Følg vidnesbyrdet",
          description:
            "Fortællingen til den valgte scene vises her. Nogle opslag indeholder også citater, lyd og kort.",
        },
        {
          eyebrow: "Se data",
          title: "Gå på opdagelse i kilderne",
          description:
            "Tegningerne og fortællingen bygger på Steens vidnesbyrd og erindringer samt historisk kildemateriale.",
        },
        {
          eyebrow: "Navigér",
          title: "Bevæg dig gennem fortællingen",
          description:
            "Brug tidslinjen til at besøge opdagede scener igen og bevæge dig mellem øjeblikke i Steens rejse. Tælleren nederst til højre holder styr på de interaktive objekter, du har opdaget.",
        },
      ],
      of: "af",
      close: "Luk introduktionen",
      previous: "Forrige",
      next: "Næste",
      startExploring: "Begynd udforskningen",
    },
    audio: {
      listen: "Lyt til Steen for at få mere at vide.",
      seek: "Søg i lydklippet",
      pause: "Sæt lyden på pause",
      play: "Afspil lyd",
      volume: "Lydstyrke",
    },
    timeline: {
      previous: "Gå til det forrige opslag",
      next: "Gå til det næste opslag",
      discovered: (discovered, total) =>
        `Du har opdaget ${discovered} af ${total} opslag`,
    },
    map: {
      historicalTravelMap: "Historisk rejsekort",
    },
  },
};
